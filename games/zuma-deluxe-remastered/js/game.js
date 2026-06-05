/**
 * Zuma Deluxe Remastered - Main Game Controller
 */
const GameState = {
    MENU: 'menu',
    LEVEL_SELECT: 'levelSelect',
    ACHIEVEMENTS: 'achievements',
    SETTINGS: 'settings',
    LEVEL_START: 'levelStart',
    PLAYING: 'playing',
    PAUSED: 'paused',
    LEVEL_COMPLETE: 'levelComplete',
    GAME_OVER: 'gameOver'
};

class ZumaGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.W = UIManager.W;
        this.H = UIManager.H;
        this.canvas.width = this.W;
        this.canvas.height = this.H;

        this.state = GameState.MENU;
        this.level = 1;
        this.score = 0;
        this.combo = 0;
        this.comboTimer = 0;
        this.freezeTimer = 0;
        this.levelStartTime = 0;
        this.levelElapsedTime = 0;
        this.shakeTimer = 0;
        this.missCount = 0;
        this.chainCheckTimer = 0;

        this.path = null;
        this.marbles = [];
        this.launcher = null;
        this.theme = null;

        this.mouseX = this.W / 2;
        this.mouseY = this.H / 2;

        this.lastTime = 0;
        this.frameInterval = 1000 / 60;

        this._loadSettings();
        this._setupInput();
        this._gameLoop(performance.now());
    }

    _loadSettings() {
        const save = SaveManager.load();
        AudioManager.setVolume(save.settings.volume);
        if (!save.settings.soundEnabled) AudioManager.toggle();
    }

    _setupInput() {
        // Mouse
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = (e.clientX - rect.left) * (this.W / rect.width);
            this.mouseY = (e.clientY - rect.top) * (this.H / rect.height);
        });

        this.canvas.addEventListener('click', (e) => {
            AudioManager.init();
            AudioManager.resume();
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (this.W / rect.width);
            const y = (e.clientY - rect.top) * (this.H / rect.height);
            this._handleClick(x, y);
        });

        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (this.state === GameState.PLAYING && this.launcher) {
                Launcher.swap(this.launcher);
                AudioManager.play('swap');
            }
        });

        // Touch
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            AudioManager.init();
            AudioManager.resume();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = (touch.clientX - rect.left) * (this.W / rect.width);
            this.mouseY = (touch.clientY - rect.top) * (this.H / rect.height);

            if (this.state === GameState.PLAYING) {
                // Check if tapped near launcher for swap
                if (this.launcher) {
                    const dx = this.mouseX - this.launcher.x;
                    const dy = this.mouseY - this.launcher.y;
                    if (dx * dx + dy * dy < 900) {
                        Launcher.swap(this.launcher);
                        AudioManager.play('swap');
                        return;
                    }
                }
            }
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = (touch.clientX - rect.left) * (this.W / rect.width);
            this.mouseY = (touch.clientY - rect.top) * (this.H / rect.height);
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (this.state === GameState.PLAYING && this.launcher) {
                Launcher.shoot(this.launcher);
                AudioManager.play('shoot');
            } else {
                const rect = this.canvas.getBoundingClientRect();
                const touch = e.changedTouches[0];
                const x = (touch.clientX - rect.left) * (this.W / rect.width);
                const y = (touch.clientY - rect.top) * (this.H / rect.height);
                this._handleClick(x, y);
            }
        }, { passive: false });

        // Keyboard
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'Escape':
                    if (this.state === GameState.PLAYING) {
                        this.state = GameState.PAUSED;
                        AudioManager.play('pause');
                    } else if (this.state === GameState.PAUSED) {
                        this.state = GameState.PLAYING;
                    } else if (this.state !== GameState.MENU) {
                        this.state = GameState.MENU;
                    }
                    break;
                case 'p': case 'P':
                    if (this.state === GameState.PLAYING) {
                        this.state = GameState.PAUSED;
                        AudioManager.play('pause');
                    } else if (this.state === GameState.PAUSED) {
                        this.state = GameState.PLAYING;
                    }
                    break;
                case ' ':
                    e.preventDefault();
                    if (this.state === GameState.PLAYING && this.launcher) {
                        Launcher.swap(this.launcher);
                        AudioManager.play('swap');
                    }
                    break;
                case 'r': case 'R':
                    if (this.state === GameState.PLAYING || this.state === GameState.GAME_OVER) {
                        this._startLevel(this.level);
                    }
                    break;
                case 's': case 'S':
                    if (this.state === GameState.SETTINGS) {
                        const save = SaveManager.load();
                        const enabled = AudioManager.toggle();
                        SaveManager.updateSettings({ soundEnabled: enabled });
                    }
                    break;
                case 'ArrowLeft':
                    if (this.state === GameState.SETTINGS) {
                        const save = SaveManager.load();
                        const v = Math.max(0, save.settings.volume - 0.1);
                        AudioManager.setVolume(v);
                        SaveManager.updateSettings({ volume: v });
                    }
                    break;
                case 'ArrowRight':
                    if (this.state === GameState.SETTINGS) {
                        const save = SaveManager.load();
                        const v = Math.min(1, save.settings.volume + 0.1);
                        AudioManager.setVolume(v);
                        SaveManager.updateSettings({ volume: v });
                    }
                    break;
            }
        });
    }

    _handleClick(x, y) {
        switch (this.state) {
            case GameState.MENU:
                this._handleMenuClick(x, y);
                break;
            case GameState.LEVEL_SELECT:
                this._handleLevelSelectClick(x, y);
                break;
            case GameState.ACHIEVEMENTS:
            case GameState.SETTINGS:
                this.state = GameState.MENU;
                break;
            case GameState.LEVEL_START:
                this.state = GameState.PLAYING;
                this.levelStartTime = performance.now();
                break;
            case GameState.PLAYING:
                if (this.launcher) {
                    Launcher.shoot(this.launcher);
                    AudioManager.play('shoot');
                }
                break;
            case GameState.PAUSED:
                this.state = GameState.PLAYING;
                break;
            case GameState.LEVEL_COMPLETE:
                this._nextLevel();
                break;
            case GameState.GAME_OVER:
                this._startLevel(this.level);
                break;
        }
    }

    _handleMenuClick(x, y) {
        const item = UIManager.getMenuClickItem(y, SaveManager.load().highestLevel > 1);
        if (!item) return;
        switch (item) {
            case 'play':
                this._startLevel(1);
                break;
            case 'continue': {
                const save = SaveManager.load();
                this._startLevel(save.highestLevel);
                break;
            }
            case 'levelSelect':
                this.state = GameState.LEVEL_SELECT;
                break;
            case 'achievements':
                this.state = GameState.ACHIEVEMENTS;
                break;
            case 'settings':
                this.state = GameState.SETTINGS;
                break;
        }
    }

    _handleLevelSelectClick(x, y) {
        const save = SaveManager.load();
        const selected = UIManager.getLevelSelectClick(x, y, save.highestLevel);
        if (selected) this._startLevel(selected);
    }

    _startLevel(level) {
        this.level = level;
        this.score = 0;
        this.combo = 0;
        this.comboTimer = 0;
        this.freezeTimer = 0;
        this.shakeTimer = 0;
        this.missCount = 0;
        this.chainCheckTimer = 0;

        const def = LevelManager.getLevel(level - 1);
        this.theme = LevelManager.getTheme(def.theme);
        this.path = PathManager.getLevelPath(level - 1);
        this.marbles = MarbleManager.createTrain(def.marbles, def.colors, def.specialFreq);
        this.launcher = Launcher.create(this.W / 2, this.H / 2, def.colors);

        ParticleSystem.clear();
        this.state = GameState.LEVEL_START;
        SaveManager.addGamePlayed();
    }

    _nextLevel() {
        if (this.level >= LevelManager.getTotalLevels()) {
            // All levels complete - go to level 1 with endless mode
            SaveManager.unlockAchievement('zuma_master');
            this._startLevel(this.level + 1);
        } else {
            this._startLevel(this.level + 1);
        }
    }

    _onLevelComplete() {
        const def = LevelManager.getLevel(this.level - 1);
        const stars = LevelManager.getStars(this.score, this.levelElapsedTime, 300);
        this.state = GameState.LEVEL_COMPLETE;
        this._stars = stars;

        AudioManager.play('levelComplete');
        SaveManager.unlockLevel(this.level + 1);
        SaveManager.updateBestScore(this.score);

        // Check achievements
        AchievementManager.checkAll({
            totalMatches: SaveManager.load().totalMarblesDestroyed > 0 ? 1 : 0,
            totalMarblesDestroyed: SaveManager.load().totalMarblesDestroyed,
            totalChainReactions: SaveManager.load().totalChainReactions,
            bestCombo: SaveManager.load().bestCombo,
            highestLevel: this.level,
            bestScore: Math.max(this.score, SaveManager.load().bestScore)
        });
    }

    _onGameOver() {
        this.state = GameState.GAME_OVER;
        AudioManager.play('gameOver');
        SaveManager.updateBestScore(this.score);
    }

    // ─── Game Loop ───
    _gameLoop(now) {
        requestAnimationFrame((t) => this._gameLoop(t));
        const elapsed = now - this.lastTime;
        if (elapsed < this.frameInterval) return;
        this.lastTime = now - (elapsed % this.frameInterval);
        const dt = Math.min(elapsed / 1000, 0.05);
        this._update(dt);
        this._render();
    }

    _update(dt) {
        if (this.state === GameState.LEVEL_START) {
            // Auto-advance after a brief delay, or wait for click
            return;
        }

        if (this.state !== GameState.PLAYING) return;

        const def = LevelManager.getLevel(this.level - 1);
        this.levelElapsedTime += dt;

        // Update combo timer
        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) this.combo = 0;
        }

        // Update freeze
        if (this.freezeTimer > 0) this.freezeTimer -= dt;

        // Update shake
        if (this.shakeTimer > 0) this.shakeTimer -= dt;

        // Chain reaction check (after gap closes)
        if (this.chainCheckTimer > 0) {
            this.chainCheckTimer -= dt;
            if (this.chainCheckTimer <= 0) {
                // Remove fully dead marbles first
                for (let i = this.marbles.length - 1; i >= 0; i--) {
                    if (this.marbles[i].removing && this.marbles[i].removeTimer <= 0) {
                        this.marbles.splice(i, 1);
                    }
                }
                const chainMatch = MatchEngine.checkChainReaction(this.marbles);
                if (chainMatch) {
                    this._processMatch(chainMatch);
                }
            }
        }

        // Update launcher
        if (this.launcher) {
            Launcher.update(this.launcher, this.mouseX, this.mouseY, dt);
        }

        // Update marble train
        const reachedEnd = MarbleManager.update(this.marbles, def.speed, dt, this.path, this.freezeTimer);
        if (reachedEnd) {
            this._onGameOver();
            return;
        }

        // Check projectile hit
        if (this.launcher && this.launcher.projectile) {
            const hit = Launcher.checkProjectileHit(this.launcher, this.marbles, this.path);
            if (hit) {
                this._processHit(hit);
            }
        }

        // Update particles
        ParticleSystem.update(dt);

        // Update achievements
        AchievementManager.update(dt);

        // Win condition: all marbles removed and no pending chain checks
        if (this.marbles.length === 0 && this.chainCheckTimer <= 0) {
            this._onLevelComplete();
        }
    }

    _processHit(hit) {
        const proj = this.launcher.projectile;
        const insertIdx = MarbleManager.findInsertIndex(this.marbles, hit.x, hit.y, this.path);

        // Calculate insert distance
        let insertDist;
        if (this.marbles.length === 0) {
            insertDist = this.path.getClosestDist(hit.x, hit.y);
        } else if (insertIdx <= 0) {
            insertDist = this.marbles[0].dist - MarbleManager.SPACING;
        } else if (insertIdx >= this.marbles.length) {
            insertDist = this.marbles[this.marbles.length - 1].dist + MarbleManager.SPACING;
        } else {
            insertDist = (this.marbles[insertIdx - 1].dist + this.marbles[insertIdx].dist) / 2;
        }

        // Insert marble
        MarbleManager.insert(this.marbles, insertIdx, insertDist, proj.color, proj.special);
        this.launcher.projectile = null;

        AudioManager.play('hit');

        // Check for match at insert position
        const match = MatchEngine.findMatch(this.marbles, insertIdx);
        if (match) {
            this._processMatch(match);
        } else {
            this.missCount++;
        }
    }

    _processMatch(match) {
        this.combo++;
        this.comboTimer = 2.0;

        const result = MatchEngine.removeMatch(this.marbles, match);
        const score = MatchEngine.calcScore(result.score, this.combo);
        this.score += score;

        // Visual feedback
        const midIdx = match.start + Math.floor(match.count / 2);
        if (midIdx < this.marbles.length) {
            const pos = this.path.getPointAtDist(this.marbles[midIdx].dist);
            ParticleSystem.emitScore(pos.x, pos.y - 20, '+' + score, this.theme.accent);
            ParticleSystem.emit('explosion', pos.x, pos.y, MARBLE_COLORS[result.removed[0]?.color]?.fill || '#fff', match.count * 3);

            if (this.combo > 1) {
                ParticleSystem.emitCombo(pos.x, pos.y - 40, this.combo);
            }
        }

        AudioManager.play(this.combo > 1 ? 'chain' : 'match');
        if (this.combo >= 3) AudioManager.play('combo');
        this.shakeTimer = 0.15;

        // Save stats
        SaveManager.addMarblesDestroyed(match.count);
        if (this.combo > 1) SaveManager.addChainReaction();
        SaveManager.updateBestCombo(this.combo);
        if (match.count >= 5) AchievementManager.tryUnlock('match_5');

        // Process special marble effects
        if (result.hasBomb) {
            const bombIdx = this.marbles.findIndex(m => m.special === SPECIAL_TYPES.BOMB && m.removing);
            if (bombIdx >= 0) {
                const bombRemoved = MatchEngine.processBomb(this.marbles, bombIdx, this.path);
                const bombPos = this.path.getPointAtDist(this.marbles[bombIdx].dist);
                ParticleSystem.emitRing(bombPos.x, bombPos.y, '#ff4400');
                AudioManager.play('special');
                this.shakeTimer = 0.3;
                SaveManager.addMarblesDestroyed(bombRemoved.length);
            }
        }

        if (result.hasLightning) {
            const lightIdx = this.marbles.findIndex(m => m.special === SPECIAL_TYPES.LIGHTNING && m.removing);
            if (lightIdx >= 0) {
                const lightRemoved = MatchEngine.processLightning(this.marbles, lightIdx);
                AudioManager.play('special');
                this.shakeTimer = 0.2;
                SaveManager.addMarblesDestroyed(lightRemoved.length);
            }
        }

        if (result.hasFreeze) {
            this.freezeTimer = 5.0;
            ParticleSystem.emit('explosion', this.W / 2, this.H / 2, '#00ccff', 20);
            AudioManager.play('powerup');
        }

        if (result.hasReverse) {
            MarbleManager.pushBack(this.marbles, 150);
            AudioManager.play('special');
        }

        // Schedule chain reaction check after gap closes
        this.chainCheckTimer = 0.25;
    }

    // ─── Render ───
    _render() {
        const ctx = this.ctx;

        switch (this.state) {
            case GameState.MENU:
                Renderer.drawBackground(ctx, this.W, this.H, LevelManager.getTheme('temple'));
                UIManager.drawMenu(ctx, SaveManager.load().highestLevel > 1);
                break;

            case GameState.LEVEL_SELECT:
                Renderer.drawBackground(ctx, this.W, this.H, LevelManager.getTheme('cyber'));
                UIManager.drawLevelSelect(ctx, SaveManager.load().highestLevel);
                break;

            case GameState.ACHIEVEMENTS:
                Renderer.drawBackground(ctx, this.W, this.H, LevelManager.getTheme('cyber'));
                UIManager.drawAchievements(ctx);
                break;

            case GameState.SETTINGS: {
                const save = SaveManager.load();
                Renderer.drawBackground(ctx, this.W, this.H, LevelManager.getTheme('cyber'));
                UIManager.drawSettings(ctx, save.settings.soundEnabled, save.settings.volume);
                break;
            }

            case GameState.LEVEL_START: {
                const def = LevelManager.getLevel(this.level - 1);
                Renderer.drawBackground(ctx, this.W, this.H, this.theme);
                Renderer.drawPath(ctx, this.path, this.theme);
                Renderer.drawMarbles(ctx, this.marbles, this.path, this.theme);
                Renderer.drawLauncher(ctx, this.launcher, this.theme);
                UIManager.drawLevelStart(ctx, this.level, def.desc, this.theme);
                break;
            }

            case GameState.PLAYING:
            case GameState.PAUSED:
            case GameState.LEVEL_COMPLETE:
            case GameState.GAME_OVER:
                ctx.save();
                Renderer.applyShake(ctx, this.shakeTimer);
                Renderer.drawBackground(ctx, this.W, this.H, this.theme);
                Renderer.drawPath(ctx, this.path, this.theme);
                Renderer.drawMarbles(ctx, this.marbles, this.path, this.theme);
                if (this.launcher) {
                    Renderer.drawAimLine(ctx, this.launcher, this.theme);
                    Renderer.drawLauncher(ctx, this.launcher, this.theme);
                    Renderer.drawProjectile(ctx, this.launcher);
                }
                ParticleSystem.draw(ctx);
                if (this.freezeTimer > 0) Renderer.drawFreezeEffect(ctx, this.W, this.H);
                ctx.restore();

                UIManager.drawHUD(ctx, this.score, this.level, this.combo, this.comboTimer, this.freezeTimer, this.marbles.filter(m => !m.removing).length, this.theme);
                AchievementManager.drawToast(ctx, this.W);

                if (this.state === GameState.PAUSED) UIManager.drawPaused(ctx);
                if (this.state === GameState.LEVEL_COMPLETE) UIManager.drawLevelComplete(ctx, this.score, this._stars || 1, this.theme);
                if (this.state === GameState.GAME_OVER) UIManager.drawGameOver(ctx, this.score, this.level);
                break;
        }
    }
}

window.addEventListener('load', () => { new ZumaGame(); });
