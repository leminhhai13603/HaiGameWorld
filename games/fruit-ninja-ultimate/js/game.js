/**
 * Fruit Ninja Ultimate - Main Game Controller
 */
const GameState = {
    MENU: 'menu',
    MODE_START: 'modeStart',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver',
    ACHIEVEMENTS: 'achievements'
};

class FruitNinjaGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.W = UIManager.W;
        this.H = UIManager.H;
        this.canvas.width = this.W;
        this.canvas.height = this.H;

        this.state = GameState.MENU;
        this.mode = 'classic'; // classic, arcade, zen
        this.score = 0;
        this.lives = 3;
        this.maxLives = 3;
        this.combo = 0;
        this.comboTimer = 0;
        this.comboCount = 0; // fruits sliced in current swipe
        this.fruitsSliced = 0;
        this.fruitsMissed = 0;
        this.fruitsThrown = 0;
        this.highestCombo = 0;
        this.timeLeft = 0;

        this.theme = Renderer.getRandomTheme();
        this._spawnTimer = 0;
        this._spawnInterval = 1.5;
        this._bombChance = 0.1;
        this._difficultyTimer = 0;
        this._lastSwipeTime = 0;

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
        this.canvas.addEventListener('mousedown', (e) => {
            AudioManager.init();
            AudioManager.resume();
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (this.W / rect.width);
            const y = (e.clientY - rect.top) * (this.H / rect.height);
            this._handlePointerDown(x, y);
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (this.W / rect.width);
            const y = (e.clientY - rect.top) * (this.H / rect.height);
            this._handlePointerMove(x, y);
        });

        this.canvas.addEventListener('mouseup', () => {
            this._handlePointerUp();
        });

        // Touch
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            AudioManager.init();
            AudioManager.resume();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = (touch.clientX - rect.left) * (this.W / rect.width);
            const y = (touch.clientY - rect.top) * (this.H / rect.height);
            this._handlePointerDown(x, y);
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = (touch.clientX - rect.left) * (this.W / rect.width);
            const y = (touch.clientY - rect.top) * (this.H / rect.height);
            this._handlePointerMove(x, y);
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this._handlePointerUp();
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
                case 'r': case 'R':
                    if (this.state === GameState.PLAYING || this.state === GameState.GAME_OVER) {
                        this._startGame(this.mode);
                    }
                    break;
            }
        });
    }

    _handlePointerDown(x, y) {
        switch (this.state) {
            case GameState.MENU:
                this._handleMenuClick(x, y);
                break;
            case GameState.MODE_START:
                this.state = GameState.PLAYING;
                break;
            case GameState.PLAYING:
                SliceSystem.startSlice(x, y);
                this.comboCount = 0;
                break;
            case GameState.PAUSED:
                this.state = GameState.PLAYING;
                break;
            case GameState.GAME_OVER:
                this._startGame(this.mode);
                break;
            case GameState.ACHIEVEMENTS:
                this.state = GameState.MENU;
                break;
        }
    }

    _handlePointerMove(x, y) {
        if (this.state === GameState.PLAYING) {
            SliceSystem.moveSlice(x, y);
        }
    }

    _handlePointerUp() {
        if (this.state === GameState.PLAYING) {
            SliceSystem.endSlice();
            // End combo
            if (this.comboCount > 1) {
                this.combo = Math.max(this.combo, this.comboCount);
                this.comboTimer = 1.5;
                if (this.comboCount >= 3) {
                    AudioManager.play('combo');
                    ParticleSystem.emitCombo(this.W / 2, this.H / 2, this.comboCount);
                }
            }
            this.comboCount = 0;
        }
    }

    _handleMenuClick(x, y) {
        const item = UIManager.getMenuClickItem(x, y);
        if (!item) return;
        switch (item) {
            case 'classic':
            case 'arcade':
            case 'zen':
                this._startGame(item);
                break;
            case 'achievements':
                this.state = GameState.ACHIEVEMENTS;
                break;
        }
    }

    _startGame(mode) {
        this.mode = mode;
        this.score = 0;
        this.lives = mode === 'classic' ? 3 : 0;
        this.maxLives = 3;
        this.combo = 0;
        this.comboTimer = 0;
        this.comboCount = 0;
        this.fruitsSliced = 0;
        this.fruitsMissed = 0;
        this.fruitsThrown = 0;
        this.highestCombo = 0;
        this.timeLeft = mode === 'arcade' ? 60 : 0;

        this._spawnTimer = 0;
        this._spawnInterval = mode === 'arcade' ? 0.8 : 1.5;
        this._bombChance = mode === 'zen' ? 0 : 0.12;
        this._difficultyTimer = 0;

        this.theme = Renderer.getRandomTheme();
        FruitManager.clear();
        SliceSystem.clear();
        ParticleSystem.clear();
        PowerupManager.clear();
        AchievementManager.clearTracking();

        this.state = GameState.MODE_START;
        SaveManager.addGamePlayed();
    }

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
        if (this.state !== GameState.PLAYING) return;

        // Update combo timer
        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) this.combo = 0;
        }

        // Arcade timer
        if (this.mode === 'arcade') {
            this.timeLeft -= dt;
            if (this.timeLeft <= 0) {
                this.timeLeft = 0;
                this._onGameOver();
                return;
            }
        }

        // Difficulty scaling
        this._difficultyTimer += dt;
        if (this._difficultyTimer > 15) {
            this._difficultyTimer = 0;
            this._spawnInterval = Math.max(0.4, this._spawnInterval - 0.08);
            if (this.mode === 'classic') {
                this._bombChance = Math.min(0.25, this._bombChance + 0.01);
            }
        }

        // Spawn fruits
        this._spawnTimer -= dt;
        if (this._spawnTimer <= 0) {
            this._spawnTimer = this._spawnInterval;
            const count = 1 + Math.floor(Math.random() * 3);
            for (let i = 0; i < count; i++) {
                if (this.mode !== 'zen' && Math.random() < this._bombChance) {
                    FruitManager.spawnBomb(this.W, this.H);
                } else {
                    FruitManager.spawnFruit(this.W, this.H, this.mode);
                }
                this.fruitsThrown++;
            }
        }

        // Spawn powerups (arcade/zen)
        if (PowerupManager.shouldSpawn(dt, this.mode)) {
            const type = PowerupManager.getRandomType();
            FruitManager.spawnPowerup(this.W, this.H, type);
        }

        // Fruit frenzy
        if (PowerupManager.isActive('frenzy')) {
            if (Math.random() < dt * 5) {
                FruitManager.spawnFruit(this.W, this.H, this.mode);
            }
        }

        // Update fruits
        const freezeFactor = PowerupManager.getFreezeFactor();
        const missResult = FruitManager.update(dt, this.H, freezeFactor);
        if (missResult === 'miss') {
            this.fruitsMissed++;
            if (this.mode === 'classic') {
                this.lives--;
                AudioManager.play('miss');
                if (this.lives <= 0) {
                    this._onGameOver();
                    return;
                }
            }
        }

        // Update slice system
        SliceSystem.update(dt);

        // Check collisions
        const shieldActive = PowerupManager.isShieldActive();
        const hits = SliceSystem.checkCollisions(FruitManager.fruits, shieldActive);
        for (const hit of hits) {
            this._processHit(hit);
        }

        // Update powerups
        PowerupManager.update(dt);

        // Update particles
        ParticleSystem.update(dt);

        // Update achievements
        AchievementManager.update(dt);
    }

    _processHit(hit) {
        const result = FruitManager.sliceFruit(hit.fruit);
        if (!result) return;

        if (result.type === 'bomb') {
            if (PowerupManager.useShield()) {
                // Shield absorbed the bomb
                ParticleSystem.emitSparkle(hit.fruit.x, hit.fruit.y, '#44ff44');
                AudioManager.play('shield');
            } else {
                // Bomb explosion - game over
                ParticleSystem.emitExplosion(result.x, result.y, 40);
                AudioManager.play('bomb');
                this._onGameOver();
            }
            return;
        }

        if (result.type === 'powerup') {
            PowerupManager.activate(result.powerupType);
            ParticleSystem.emitSparkle(result.x, result.y, POWERUP_DEFS[result.powerupType].color);
            AudioManager.play('powerup');
            return;
        }

        // Fruit sliced!
        this.comboCount++;
        this.fruitsSliced++;
        AchievementManager.trackFruitSlice(result.fruitType.name);

        // Score
        const multiplier = PowerupManager.getScoreMultiplier();
        let points = result.points * multiplier;

        // Critical bonus for fast slicing
        const now = Date.now();
        if (now - this._lastSwipeTime < 100 && this.comboCount > 1) {
            points += 5 * multiplier;
            AudioManager.play('critical');
        }
        this._lastSwipeTime = now;

        this.score += points;

        // Visual feedback
        ParticleSystem.emitJuice(result.x, result.y, result.fruitType.colors.juice, 10);
        ParticleSystem.emitFragments(result.x, result.y, result.fruitType.colors.base, result.fruitType.colors.inner || result.fruitType.colors.light, 4);
        ParticleSystem.emitScore(result.x, result.y - 20, '+' + points, '#fff');

        AudioManager.play('slice');

        // Track combo
        if (this.comboCount > this.highestCombo) {
            this.highestCombo = this.comboCount;
        }

        // Save stats
        SaveManager.addFruitsSliced(1);
        SaveManager.updateHighestCombo(this.highestCombo);
    }

    _onGameOver() {
        this.state = GameState.GAME_OVER;
        AudioManager.play('gameOver');

        SaveManager.updateBestScore(this.mode, this.score);

        const accuracy = this.fruitsThrown > 0 ? Math.round((this.fruitsSliced / this.fruitsThrown) * 100) : 0;
        this._finalStats = {
            fruitsSliced: this.fruitsSliced,
            highestCombo: this.highestCombo,
            accuracy: accuracy
        };

        // Check achievements
        const save = SaveManager.load();
        AchievementManager.checkAll({
            totalFruitsSliced: save.totalFruitsSliced,
            highestCombo: Math.max(this.highestCombo, save.highestCombo),
            bestScoreClassic: Math.max(this.mode === 'classic' ? this.score : 0, save.bestScoreClassic),
            bestScoreArcade: Math.max(this.mode === 'arcade' ? this.score : 0, save.bestScoreArcade),
            bestScoreZen: Math.max(this.mode === 'zen' ? this.score : 0, save.bestScoreZen)
        });
    }

    _render() {
        const ctx = this.ctx;

        switch (this.state) {
            case GameState.MENU: {
                const save = SaveManager.load();
                Renderer.drawBackground(ctx, this.W, this.H, this.theme);
                UIManager.drawMenu(ctx, {
                    classic: save.bestScoreClassic,
                    arcade: save.bestScoreArcade,
                    zen: save.bestScoreZen
                });
                break;
            }

            case GameState.MODE_START:
                Renderer.drawBackground(ctx, this.W, this.H, this.theme);
                UIManager.drawModeStart(ctx, this.mode);
                break;

            case GameState.PLAYING:
            case GameState.PAUSED:
            case GameState.GAME_OVER:
                // Background
                Renderer.drawBackground(ctx, this.W, this.H, this.theme);

                // Fruits and halves
                for (const fruit of FruitManager.fruits) {
                    Renderer.drawFruit(ctx, fruit);
                }
                for (const half of FruitManager.halves) {
                    Renderer.drawHalf(ctx, half);
                }

                // Slice trail
                SliceSystem.draw(ctx);

                // Particles
                ParticleSystem.draw(ctx);

                // Freeze effect
                if (PowerupManager.isActive('freeze')) {
                    ctx.fillStyle = 'rgba(100,200,255,0.06)';
                    ctx.fillRect(0, 0, this.W, this.H);
                }

                // HUD
                UIManager.drawHUD(ctx, this.score, this.lives, this.maxLives,
                    this.comboCount > 1 ? this.comboCount : this.combo,
                    this.comboTimer, this.mode, this.timeLeft);

                // Power-up indicators
                const activeList = PowerupManager.getActiveList();
                if (activeList.length > 0) {
                    Renderer.drawPowerupIndicators(ctx, activeList, this.H);
                }

                // Achievement toast
                AchievementManager.drawToast(ctx, this.W);

                if (this.state === GameState.PAUSED) UIManager.drawPaused(ctx);
                if (this.state === GameState.GAME_OVER) {
                    UIManager.drawGameOver(ctx, this.score, this._finalStats || {}, this.mode);
                }
                break;

            case GameState.ACHIEVEMENTS:
                Renderer.drawBackground(ctx, this.W, this.H, this.theme);
                UIManager.drawAchievements(ctx);
                break;
        }
    }
}

window.addEventListener('load', () => { new FruitNinjaGame(); });
