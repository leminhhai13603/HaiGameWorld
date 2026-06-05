/**
 * Battle City - Game Manager
 * ALL coordinates in canvas space (y includes HUD_H)
 */
class BattleCityGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CANVAS_W;
        this.canvas.height = CANVAS_H;

        this.state = GameState.MENU;
        this.isCoop = false;
        this.level = 1;
        this.score = 0;
        this.maxUnlockedLevel = 1;
        this.maxActiveEnemies = 4;

        this.map = new MapSystem();
        this.bullets = new BulletSystem();
        this.powerups = new PowerupSystem();
        this.ui = new UIManager();
        this.editor = new EditorManager();

        this.players = [];
        this.enemies = [];
        this.boss = null;
        this.enemyQueue = [];
        this.spawnPoints = [
            { x: 0, y: HUD_H },
            { x: (COLS/2 - 1) * CELL, y: HUD_H },
            { x: (COLS - 2) * CELL, y: HUD_H }
        ];
        this.spawnIndex = 0;
        this.levelStartTimer = 0;
        this.freezeTimer = 0;
        this.stats = {};
        this.lastTime = 0;
        this.frameInterval = 1000 / 60;
        this.keys = {};

        this._loadSave();
        this._setupInput();
        this._gameLoop(performance.now());
    }

    _loadSave() {
        const save = SaveManager.load();
        this.maxUnlockedLevel = save.stats.highestLevel || 1;
        this.stats = save.stats;
    }

    _setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            AudioManager.resume();
            if (e.key === 'p' || e.key === 'P') {
                if (this.state === GameState.PLAYING) this.state = GameState.PAUSED;
                else if (this.state === GameState.PAUSED) this.state = GameState.PLAYING;
            }
            if (e.key === 'm' || e.key === 'M') AudioManager.toggle();
            if (e.key === 'Escape') {
                if (this.state === GameState.PAUSED) this.state = GameState.PLAYING;
                else if (this.state === GameState.EDITOR) { this.editor.deactivate(); this.state = GameState.MENU; }
                else if (this.state !== GameState.MENU) this.state = GameState.MENU;
            }
            if (this.state === GameState.EDITOR && (e.key === 's' || e.key === 'S')) {
                const name = prompt('Map name:', 'Custom Map');
                if (name) this.editor.save(name);
            }
        });
        document.addEventListener('keyup', (e) => { this.keys[e.key] = false; });

        this.canvas.addEventListener('click', (e) => this._handleClick(e));
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (this.state === GameState.EDITOR) {
                const rect = this.canvas.getBoundingClientRect();
                this.editor.handleRightClick(
                    (e.clientX - rect.left) * (this.canvas.width / rect.width),
                    (e.clientY - rect.top) * (this.canvas.height / rect.height)
                );
            }
        });
        this.canvas.addEventListener('wheel', (e) => {
            if (this.state === GameState.EDITOR) { e.preventDefault(); this.editor.cycleTile(e.deltaY > 0 ? 1 : -1); }
        });
    }

    _handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        AudioManager.resume();

        switch (this.state) {
            case GameState.MENU: this._handleMenuClick(x, y); break;
            case GameState.LEVEL_SELECT: this._handleLevelSelectClick(x, y); break;
            case GameState.STATISTICS: case GameState.SETTINGS: this.state = GameState.MENU; break;
            case GameState.LEVEL_START: this.state = GameState.PLAYING; break;
            case GameState.PAUSED: this.state = GameState.PLAYING; break;
            case GameState.LEVEL_CLEAR: this._nextLevel(); break;
            case GameState.GAME_OVER: this.state = GameState.MENU; break;
            case GameState.VICTORY: this._startGame(1); break;
            case GameState.EDITOR: this.editor.handleClick(x, y); break;
        }
    }

    _handleMenuClick(x, y) {
        const cx = CANVAS_W / 2;
        const items = [
            { y: 290, action: () => { this.isCoop = false; this._startGame(1); } },
            { y: 325, action: () => { this.isCoop = true; this._startGame(1); } },
            { y: 360, action: () => { this.state = GameState.LEVEL_SELECT; } },
            { y: 395, action: () => { this.editor.activate(); this.state = GameState.EDITOR; } },
            { y: 430, action: () => { this.state = GameState.STATISTICS; } },
            { y: 465, action: () => { this.state = GameState.SETTINGS; } }
        ];
        for (const item of items) {
            if (Math.abs(y - item.y) < 15 && Math.abs(x - cx) < 120) { item.action(); return; }
        }
    }

    _handleLevelSelectClick(x, y) {
        const cols = 7, cellSize = 44, gap = 6;
        const startX = CANVAS_W / 2 - (cols * (cellSize + gap) - gap) / 2;
        const startY = 70;
        for (let i = 0; i < 35; i++) {
            const bx = startX + (i % cols) * (cellSize + gap);
            const by = startY + Math.floor(i / cols) * (cellSize + gap);
            if (x >= bx && x <= bx + cellSize && y >= by && y <= by + cellSize) {
                if ((i + 1) <= this.maxUnlockedLevel) { this.isCoop = false; this._startGame(i + 1); }
                return;
            }
        }
    }

    _startGame(level) {
        this.level = level; this.score = 0; this._loadLevel(level);
    }

    _loadLevel(level) {
        const def = LevelManager.getLevel(level - 1);
        this.map.init(def.map);
        this.bullets.clear();
        this.powerups.clear();
        this.enemies = [];
        this.boss = null;
        this.freezeTimer = 0;
        this.ui.explosions = [];
        this.ui.scorePopups = [];

        this.players = [new PlayerTank(1, 8 * CELL, (ROWS - 2) * CELL + HUD_H)];
        if (this.isCoop) this.players.push(new PlayerTank(2, 16 * CELL, (ROWS - 2) * CELL + HUD_H));

        this.enemyQueue = [];
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < (def.enemies[i] || 0); j++) {
                this.enemyQueue.push({ type: i, hasPowerup: Math.random() < 0.15 });
            }
        }
        for (let i = this.enemyQueue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.enemyQueue[i], this.enemyQueue[j]] = [this.enemyQueue[j], this.enemyQueue[i]];
        }

        if (def.hasBoss) {
            this.boss = new BossTank(level, (COLS / 2 - 1) * CELL, HUD_H + CELL);
            AudioManager.play('boss');
        }

        this.state = GameState.LEVEL_START;
        this.levelStartTimer = 90;
        SaveManager.saveGame(level, this.players[0].lives, this.score);
    }

    _nextLevel() {
        if (this.level >= 35) { this.state = GameState.VICTORY; AudioManager.play('victory'); return; }
        this.level++; this._loadLevel(this.level);
    }

    _spawnEnemy() {
        if (this.enemies.filter(e => e.active).length >= this.maxActiveEnemies) return;
        if (this.enemyQueue.length === 0) return;
        const def = this.enemyQueue.shift();
        const sp = this.spawnPoints[this.spawnIndex % this.spawnPoints.length];
        this.spawnIndex++;
        if (this.enemies.some(e => e.active && Math.abs(e.x - sp.x) < CELL && Math.abs(e.y - sp.y) < CELL)) return;
        const ai = [AIType.PATROL, AIType.AGGRESSIVE, AIType.BASE_HUNTER, AIType.GUARD_BREAKER][Math.floor(Math.random() * 4)];
        this.enemies.push(new EnemyTank(def.type, sp.x, sp.y, ai, def.hasPowerup));
    }

    _gameLoop(now) {
        requestAnimationFrame((t) => this._gameLoop(t));
        const elapsed = now - this.lastTime;
        if (elapsed < this.frameInterval) return;
        this.lastTime = now - (elapsed % this.frameInterval);
        this._update();
        this._render();
    }

    _update() {
        this.ui.update();
        if (this.state === GameState.LEVEL_START) { this.levelStartTimer--; if (this.levelStartTimer <= 0) this.state = GameState.PLAYING; return; }
        if (this.state === GameState.EDITOR) return;
        if (this.state !== GameState.PLAYING) return;
        this.stats.totalPlayTime = (this.stats.totalPlayTime || 0) + 1 / 60;
        if (this.freezeTimer > 0) this.freezeTimer--;

        this.map.update();
        for (const p of this.players) p.update(this.keys, this.map, this.bullets);
        if (this.freezeTimer <= 0) {
            for (const e of this.enemies) e.update(this.map, this.bullets, this.enemies);
            if (this.boss && this.boss.active) this.boss.update(this.map, this.bullets, this.players);
        }
        this._spawnEnemy();

        // Update bullets (handles tile collision internally)
        this.bullets.update(this.map);

        // Check eagle
        if (!this.map.eagleAlive) { this._onEagleDestroyed(); return; }

        this.powerups.update();
        this._checkCollisions();
        this._checkLevelComplete();
    }

    _checkCollisions() {
        const bullets = this.bullets.bullets;

        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            if (!b.active) continue;
            const bb = b.getBounds();

            // Player bullets vs enemies
            if (b.owner.startsWith('player')) {
                for (const e of this.enemies) {
                    if (!e.active || e.spawnTimer > 0) continue;
                    if (this._collides(bb, e.getBounds())) {
                        const killed = e.hit(); b.active = false; this.stats.shotsHit++;
                        if (killed) {
                            this.score += e.score; this.stats.enemiesDestroyed++;
                            this.ui.addExplosion(e.x + e.w/2, e.y + e.h/2, 1);
                            this.ui.addScorePopup(e.x + e.w/2, e.y, `+${e.score}`);
                            AudioManager.play('explode');
                            if (e.hasPowerup) this.powerups.spawn(e.x, e.y);
                        } else { AudioManager.play('hit'); }
                        break;
                    }
                }
                if (this.boss && this.boss.active && this.boss.spawnTimer <= 0 && b.active) {
                    if (this._collides(bb, this.boss.getBounds())) {
                        const killed = this.boss.hit(b.strong); b.active = false; this.stats.shotsHit++;
                        if (killed) {
                            this.score += this.boss.score;
                            this.ui.addExplosion(this.boss.x+this.boss.w/2, this.boss.y+this.boss.h/2, 2);
                            this.ui.addScorePopup(this.boss.x+this.boss.w/2, this.boss.y, `+${this.boss.score}`, '#ff4444');
                            this.ui.shake(8, 20); AudioManager.play('explode');
                        } else { AudioManager.play('hit'); }
                    }
                }
            }

            // Enemy bullets vs players
            if (b.owner === 'enemy' && b.active) {
                for (const p of this.players) {
                    if (!p.active || p.spawnTimer > 0 || p.shieldTimer > 0) continue;
                    if (this._collides(bb, p.getBounds())) { b.active = false; this._onPlayerHit(p); break; }
                }
            }

            // Bullet vs bullet
            if (b.active) {
                for (let j = i - 1; j >= 0; j--) {
                    const b2 = bullets[j];
                    if (!b2.active || b.owner === b2.owner) continue;
                    if (this._collides(bb, b2.getBounds())) { b.active = false; b2.active = false; break; }
                }
            }
        }

        for (const p of this.players) {
            if (!p.active || p.spawnTimer > 0) continue;
            const pu = this.powerups.checkCollision(p);
            if (pu !== null) this._applyPowerup(pu, p);
        }
    }

    _applyPowerup(type, player) {
        this.score += 500; this.stats.powerupsCollected++;
        AudioManager.play('powerup'); this.ui.flash('#fff', 5);
        switch (type) {
            case PowerupType.STAR: player.upgrade(); break;
            case PowerupType.GRENADE:
                for (const e of this.enemies) {
                    if (e.active) { this.score += e.score; this.stats.enemiesDestroyed++; this.ui.addExplosion(e.x+e.w/2, e.y+e.h/2, 1); e.active = false; }
                }
                if (this.boss && this.boss.active) { this.boss.hit(true); this.ui.addExplosion(this.boss.x+this.boss.w/2, this.boss.y+this.boss.h/2, 1.5); }
                AudioManager.play('explode'); break;
            case PowerupType.HELMET: player.shieldTimer = 600; break;
            case PowerupType.SHOVEL: this.map.activateShovel(); break;
            case PowerupType.TANK: player.lives++; AudioManager.play('life'); break;
            case PowerupType.CLOCK: this.freezeTimer = 300; break;
        }
    }

    _onPlayerHit(player) {
        player.lives--; this.stats.deaths++;
        this.ui.addExplosion(player.x + player.w/2, player.y + player.h/2, 1.5);
        this.ui.shake(6, 12); AudioManager.play('explode');
        if (player.lives <= 0) { player.active = false; }
        else {
            player.resetAfterDeath();
            player.x = player.playerNum === 1 ? 8 * CELL : 16 * CELL;
            player.y = (ROWS - 2) * CELL + HUD_H;
            player.spawnTimer = 60; player.active = true;
        }
        if (this.players.every(p => !p.active || p.lives <= 0)) {
            this.state = GameState.GAME_OVER; AudioManager.play('gameover'); this._saveStats();
        }
    }

    _onEagleDestroyed() {
        this.ui.addExplosion(COLS/2 * CELL, (ROWS-1) * CELL + HUD_H, 2);
        this.ui.shake(10, 30); AudioManager.play('explode');
        setTimeout(() => { this.state = GameState.GAME_OVER; AudioManager.play('gameover'); this._saveStats(); }, 500);
    }

    _checkLevelComplete() {
        if (this.enemies.every(e => !e.active) && this.enemyQueue.length === 0 && (!this.boss || !this.boss.active)) {
            this.state = GameState.LEVEL_CLEAR; AudioManager.play('victory');
            this.maxUnlockedLevel = Math.max(this.maxUnlockedLevel, this.level + 1);
            this.stats.levelsCleared++; this.stats.highestLevel = Math.max(this.stats.highestLevel || 1, this.level);
            if (this.players.every(p => p.active)) this.score += 1000;
            this._saveStats();
        }
    }

    _saveStats() {
        const save = SaveManager.load();
        save.stats = { ...save.stats, ...this.stats, highestLevel: Math.max(save.stats.highestLevel || 1, this.level), totalScore: Math.max(save.stats.totalScore || 0, this.score) };
        SaveManager.save(save);
    }

    _collides(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

    _render() {
        const ctx = this.ctx;
        ctx.save(); ctx.translate(this.ui.shakeX, this.ui.shakeY);
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        switch (this.state) {
            case GameState.MENU: this.ui.drawMenu(ctx); break;
            case GameState.LEVEL_SELECT: this.ui.drawLevelSelect(ctx, this.maxUnlockedLevel); break;
            case GameState.STATISTICS: this.ui.drawStatistics(ctx, this.stats); break;
            case GameState.SETTINGS: this._drawSettings(ctx); break;
            case GameState.EDITOR: this.map.draw(ctx); this.editor.draw(ctx); this.ui.drawEditorUI(ctx, this.editor.selectedTile, this.editor.mapName); break;
            case GameState.LEVEL_START: this.map.draw(ctx); this.ui.drawLevelStart(ctx, this.level, !!this.boss); break;
            case GameState.PLAYING: case GameState.PAUSED: case GameState.LEVEL_CLEAR: case GameState.GAME_OVER:
                this._drawGame(ctx);
                if (this.state === GameState.PAUSED) this.ui.drawPaused(ctx);
                if (this.state === GameState.LEVEL_CLEAR) {
                    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
                    ctx.textAlign = 'center'; ctx.fillStyle = '#44ff44'; ctx.font = 'bold 28px Orbitron, monospace';
                    ctx.fillText('LEVEL CLEAR!', CANVAS_W/2, CANVAS_H/2 - 20);
                    ctx.fillStyle = '#ffcc00'; ctx.font = '16px Rajdhani, sans-serif'; ctx.fillText(`Score: ${this.score}`, CANVAS_W/2, CANVAS_H/2 + 15);
                    ctx.fillStyle = '#aaa'; ctx.font = '13px Rajdhani, sans-serif'; ctx.fillText('Click to continue', CANVAS_W/2, CANVAS_H/2 + 45);
                }
                if (this.state === GameState.GAME_OVER) this.ui.drawGameOver(ctx, this.score, this.level);
                break;
            case GameState.VICTORY: this.ui.drawVictory(ctx, this.score); break;
        }
        this.ui.drawFlash(ctx);
        ctx.restore();
    }

    _drawGame(ctx) {
        this.map.draw(ctx);
        for (const e of this.enemies) e.draw(ctx);
        if (this.boss) this.boss.draw(ctx);
        for (const p of this.players) p.draw(ctx);
        this.bullets.draw(ctx);
        this.powerups.draw(ctx);
        this.map.drawForest(ctx);
        this.ui.drawExplosions(ctx);
        this.ui.drawScorePopups(ctx);
        const enemiesLeft = this.enemyQueue.length + this.enemies.filter(e => e.active).length + (this.boss && this.boss.active ? 1 : 0);
        this.ui.drawHUD(ctx, this.players[0].lives, this.score, this.level, enemiesLeft, this.isCoop, this.isCoop ? this.players[1].lives : 0);
    }

    _drawSettings(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.textAlign = 'center'; ctx.fillStyle = '#ffcc00'; ctx.font = 'bold 24px Orbitron, monospace'; ctx.fillText('SETTINGS', CANVAS_W/2, 50);
        ctx.fillStyle = '#fff'; ctx.font = '15px Rajdhani, sans-serif';
        ctx.fillText(`SFX Volume: ${Math.round(AudioManager.sfxVol * 100)}%  [←/→]`, CANVAS_W/2, 110);
        ctx.fillText(`Sound: ${AudioManager.enabled ? 'ON' : 'OFF'}  [M]`, CANVAS_W/2, 145);
        ctx.fillStyle = '#aaa'; ctx.font = '13px Rajdhani, sans-serif'; ctx.fillText('ESC to go back', CANVAS_W/2, CANVAS_H - 20);
    }
}

window.addEventListener('load', () => { new BattleCityGame(); });
