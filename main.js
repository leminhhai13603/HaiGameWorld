/**
 * Main - Game loop, state management, and core systems
 */

// Game states
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver',
    VICTORY: 'victory'
};

// Main game class
class Game {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;

        // Game state
        this.state = GameState.MENU;
        this.score = 0;
        this.wave = 1;
        this.maxWave = 25;
        this.combo = 0;
        this.comboTimer = 0;
        this.maxCombo = 0;
        this.highScore = Storage.getHighScore();
        this.highWave = Storage.getHighWave();
        this.isNewRecord = false;
        this.enemiesKilled = 0;
        this.totalEnemies = 0;

        // Core systems
        this.bulletPool = new BulletPool(500);
        this.particlePool = new ParticlePool(1000);
        this.formationManager = new FormationManager(this.canvas.width, this.canvas.height);
        this.dropManager = new DropManager(this.canvas.width, this.canvas.height);
        this.ui = new UI(this.canvas.width, this.canvas.height);

        // Player
        this.player = new Player(this.canvas.width, this.canvas.height);

        // Boss
        this.boss = null;
        this.bossActive = false;

        // Wave management
        this.waveAnnouncementTimer = 0;
        this.betweenWaveDelay = 0;
        this.waveClearChecked = false;

        // Input
        this.keys = { left: false, right: false, up: false, down: false };
        this.mouse = { x: this.canvas.width / 2, y: this.canvas.height / 2, down: false };

        // Background
        this.bg = new Background(this.canvas.width, this.canvas.height);

        // Effects
        this.slowMo = { active: false, factor: 1, timer: 0 };
        this.flash = { active: false, color: '#fff', alpha: 0 };
        this.floatingTexts = [];

        // Initialize audio
        AudioManager.init();

        // Setup input
        this._setupInput();

        // Start game loop
        this.lastTime = performance.now();
        this._gameLoop();
    }

    // Setup input handlers
    _setupInput() {
        document.addEventListener('keydown', (e) => this._handleKeyDown(e));
        document.addEventListener('keyup', (e) => this._handleKeyUp(e));

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            this.mouse.y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        });

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.mouse.down = true;
                AudioManager.resume();
                this._handleAction();
            }
        });

        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.mouse.down = false;
        });

        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    // Handle action (click/space)
    _handleAction() {
        switch (this.state) {
            case GameState.MENU:
            case GameState.GAME_OVER:
            case GameState.VICTORY:
                this._startGame();
                break;
        }
    }

    // Handle key down
    _handleKeyDown(e) {
        switch (e.key) {
            case 'ArrowLeft': case 'a': case 'A': this.keys.left = true; e.preventDefault(); break;
            case 'ArrowRight': case 'd': case 'D': this.keys.right = true; e.preventDefault(); break;
            case 'ArrowUp': case 'w': case 'W': this.keys.up = true; e.preventDefault(); break;
            case 'ArrowDown': case 's': case 'S': this.keys.down = true; e.preventDefault(); break;
            case ' ':
                e.preventDefault();
                this._handleAction();
                break;
            case 'p': case 'P': case 'Escape':
                if (this.state === GameState.PLAYING) this.state = GameState.PAUSED;
                else if (this.state === GameState.PAUSED) this.state = GameState.PLAYING;
                break;
            case 'm': case 'M': AudioManager.toggle(); break;
            case 'q': case 'Q':
                // Quick switch weapon type
                if (this.state === GameState.PLAYING) {
                    this.player.weaponType = this.player.weaponType === 'rapid' ? 'spread' : 'rapid';
                }
                break;
        }
    }

    // Handle key up
    _handleKeyUp(e) {
        switch (e.key) {
            case 'ArrowLeft': case 'a': case 'A': this.keys.left = false; break;
            case 'ArrowRight': case 'd': case 'D': this.keys.right = false; break;
            case 'ArrowUp': case 'w': case 'W': this.keys.up = false; break;
            case 'ArrowDown': case 's': case 'S': this.keys.down = false; break;
        }
    }

    // Start new game
    _startGame() {
        this.state = GameState.PLAYING;
        this.score = 0;
        this.wave = 1;
        this.combo = 0;
        this.comboTimer = 0;
        this.maxCombo = 0;
        this.isNewRecord = false;
        this.enemiesKilled = 0;
        this.totalEnemies = 0;
        this.floatingTexts = [];

        this.player.reset();
        this.bulletPool.clear();
        this.particlePool = new ParticlePool(1000);
        this.dropManager.clear();
        this.formationManager.clear();
        this.boss = null;
        this.bossActive = false;

        this._startWave(1);
    }

    // Start a wave
    _startWave(waveNum) {
        this.wave = waveNum;
        this.waveAnnouncementTimer = 120;
        this.betweenWaveDelay = 0;
        this.waveClearChecked = false;

        const isBossWave = waveNum % 5 === 0;

        if (isBossWave) {
            this.boss = new Boss(this.canvas.width, this.canvas.height, waveNum);
            this.bossActive = true;
        }

        const enemies = this.formationManager.generateFormation(waveNum);
        this.totalEnemies = enemies.length;

        Storage.setHighWave(waveNum);
    }

    // Trigger effects
    triggerSlowMo(factor = 0.3, duration = 30) {
        this.slowMo = { active: true, factor, timer: duration };
    }

    triggerFlash(color = '#fff', duration = 10) {
        this.flash = { active: true, color, alpha: 0.5, duration };
    }

    addFloatingText(x, y, text, color = '#fff', size = 16) {
        this.floatingTexts.push({ x, y, text, color, size, vy: -2, life: 60, maxLife: 60 });
    }

    // Main game loop
    _gameLoop() {
        const now = performance.now();
        this.lastTime = now;

        this._update();
        this._render();

        requestAnimationFrame(() => this._gameLoop());
    }

    // Update game state
    _update() {
        this.bg.update();
        this.ui.updateShake();

        // Update slow motion
        if (this.slowMo.active) {
            this.slowMo.timer--;
            if (this.slowMo.timer <= 0) {
                this.slowMo.active = false;
                this.slowMo.factor = 1;
            }
        }

        // Update flash
        if (this.flash.active) {
            this.flash.alpha -= 0.05;
            if (this.flash.alpha <= 0) this.flash.active = false;
        }

        // Update floating texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y += ft.vy;
            ft.life--;
            if (ft.life <= 0) this.floatingTexts.splice(i, 1);
        }

        if (this.state !== GameState.PLAYING) return;

        const dt = this.slowMo.active ? this.slowMo.factor : 1;

        // Update player
        this.player.update(this.keys, this.mouse, this.bulletPool, dt);

        // Thrust particles
        if (this.keys.left || this.keys.right || this.keys.up || this.keys.down) {
            if (Math.random() > 0.5) {
                this.particlePool.thrust(this.player.x, this.player.y + this.player.height / 2);
            }
        }

        // Update bullets
        this.bulletPool.update(this.canvas.width, this.canvas.height, dt);

        // Update formation
        this.formationManager.update(dt);

        // Update boss
        if (this.boss && this.bossActive) {
            this.boss.update(this.player.x, this.player.y, this.bulletPool, dt);
            if (!this.boss.active) {
                this._onBossKilled();
            }
        }

        // Enemy actions (shoot, drop poop)
        this._updateEnemyActions(dt);

        // Update drops
        this.dropManager.update(dt);

        // Update particles
        this.particlePool.update(dt);

        // Check collisions
        this._checkCollisions();

        // Check wave completion
        this._checkWaveComplete();

        // Combo timer
        if (this.comboTimer > 0) {
            this.comboTimer--;
            if (this.comboTimer <= 0) this.combo = 0;
        }

        // Wave announcement
        if (this.waveAnnouncementTimer > 0) this.waveAnnouncementTimer--;
    }

    // Update enemy actions
    _updateEnemyActions(dt) {
        const enemies = this.formationManager.getEnemies();

        for (const enemy of enemies) {
            // Enemy shooting
            if (enemy.shouldShoot()) {
                this._enemyShoot(enemy);
            }

            // Enemy drops poop
            if (enemy.shouldDropPoop()) {
                this.dropManager.spawnPoop(enemy.x, enemy.y + enemy.height / 2);
            }
        }
    }

    // Enemy shoot
    _enemyShoot(enemy) {
        const dx = this.player.x - enemy.x;
        const dy = this.player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = 3.5;

        this.bulletPool.fire({
            x: enemy.x,
            y: enemy.y + enemy.height / 2,
            vx: (dx / dist) * speed,
            vy: (dy / dist) * speed,
            width: 6, height: 6,
            damage: 1, type: 'enemy', color: '#ff6644'
        });
    }

    // Boss killed
    _onBossKilled() {
        this.score += this.boss.score;
        this.particlePool.bossExplosion(this.boss.x, this.boss.y);
        this.ui.applyShake(20, 40);
        this.triggerSlowMo(0.2, 60);
        this.triggerFlash('#ff8800', 20);
        AudioManager.play('bossDeath');
        this.addFloatingText(this.boss.x, this.boss.y, `+${this.boss.score}`, '#ffaa00', 24);

        // Drop multiple gifts
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.dropManager.spawnGift(
                    this.boss.x + (Math.random() - 0.5) * 200,
                    this.boss.y + i * 30
                );
            }, i * 200);
        }

        this.boss = null;
        this.bossActive = false;
    }

    // Check collisions
    _checkCollisions() {
        const playerBounds = this.player.getBounds();

        // Player bullets vs enemies
        const playerBullets = [...this.bulletPool.getActive('player'), ...this.bulletPool.getActive('laser')];
        const enemies = this.formationManager.getEnemies();

        for (const bullet of playerBullets) {
            if (!bullet.active) continue;
            const bulletBounds = bullet.getBounds();

            for (const enemy of enemies) {
                if (!enemy.active) continue;
                if (this._collides(bulletBounds, enemy.getBounds())) {
                    const destroyed = enemy.takeDamage(bullet.damage);

                    if (destroyed) {
                        this._onEnemyKilled(enemy);
                    } else {
                        this.particlePool.explosion(bullet.x, bullet.y, 5, enemy.color, { speed: 2, maxSize: 2 });
                        AudioManager.play('enemyHit');
                    }

                    if (!bullet.piercing) bullet.active = false;
                    break;
                }
            }

            // vs boss
            if (this.boss && this.boss.active && !this.boss.entering) {
                if (this._collides(bulletBounds, this.boss.getBounds())) {
                    this.boss.takeDamage(bullet.damage);
                    this.particlePool.explosion(bullet.x, bullet.y, 8, '#ff4444', { speed: 3, maxSize: 3 });
                    AudioManager.play('bossHit');
                    if (!bullet.piercing) bullet.active = false;
                }
            }
        }

        // Enemy bullets vs player
        for (const bullet of this.bulletPool.getActive('enemy')) {
            if (!bullet.active) continue;
            if (this._collides(bullet.getBounds(), playerBounds)) {
                const lifeLost = this.player.takeDamage(this.particlePool);
                bullet.active = false;
                this.ui.applyShake(8, 15);
                this.triggerFlash('#ff0000', 8);

                if (lifeLost && !this.player.isAlive()) this._gameOver();
            }
        }

        // Poop vs player
        if (this.dropManager.checkPoopCollision(playerBounds)) {
            const lifeLost = this.player.takeDamage(this.particlePool);
            this.ui.applyShake(10, 15);
            this.triggerFlash('#884400', 10);
            this.addFloatingText(this.player.x, this.player.y - 30, 'POOP HIT!', '#8B4513', 18);

            if (lifeLost && !this.player.isAlive()) this._gameOver();
        }

        // Gift collection
        const collected = this.dropManager.checkGiftCollection(playerBounds);
        for (const type of collected) {
            this.player.upgradeWeapon(type);
            this.score += 100;
            this.particlePool.pickupEffect(this.player.x, this.player.y, type === 'rapid' ? '#ffaa00' : '#00ffcc');
            AudioManager.play('powerup');

            const level = this.player.getCurrentLevel();
            this.addFloatingText(
                this.player.x, this.player.y - 40,
                `${type.toUpperCase()} LV${level}!`,
                type === 'rapid' ? '#ffaa00' : '#00ffcc', 20
            );
        }

        // Boss vs player collision
        if (this.boss && this.boss.active && !this.boss.entering) {
            if (this._collides(this.boss.getBounds(), playerBounds)) {
                const lifeLost = this.player.takeDamage(this.particlePool);
                this.ui.applyShake(12, 20);
                if (lifeLost && !this.player.isAlive()) this._gameOver();
            }
        }
    }

    // Handle enemy killed
    _onEnemyKilled(enemy) {
        const baseScore = enemy.score;
        const comboMultiplier = 1 + this.combo * 0.15;
        const earnedScore = Math.floor(baseScore * comboMultiplier);

        this.score += earnedScore;
        this.combo++;
        this.comboTimer = 120;
        this.enemiesKilled++;

        if (this.combo > this.maxCombo) this.maxCombo = this.combo;

        // Combo effects
        if (this.combo >= 5 && this.combo % 5 === 0) {
            AudioManager.play('combo');
            this.triggerFlash('#ffaa00', 5);
            this.addFloatingText(this.canvas.width / 2, 100, `x${this.combo} COMBO!`, '#ffaa00', 28);
        }

        // Explosion
        this.particlePool.explosion(enemy.x, enemy.y, 20, enemy.color, {
            speed: 5, maxSize: 5, shockwave: 15
        });
        AudioManager.play('explosion');

        // Score popup
        this.addFloatingText(enemy.x, enemy.y - 20, `+${earnedScore}`, '#ffff00', 16);

        // Chance to drop gift
        if (enemy.shouldDropGift()) {
            this.dropManager.spawnGift(enemy.x, enemy.y);
        }
    }

    // Check if wave is complete
    _checkWaveComplete() {
        const formationCleared = this.formationManager.isCleared();
        const bossCleared = !this.bossActive || (this.boss && !this.boss.active);

        if (formationCleared && bossCleared) {
            this.betweenWaveDelay++;

            if (this.betweenWaveDelay > 90) {
                if (this.wave >= this.maxWave) {
                    this._victory();
                } else {
                    this._startWave(this.wave + 1);
                }
            }
        }
    }

    // Game over
    _gameOver() {
        this.state = GameState.GAME_OVER;
        this.isNewRecord = Storage.setHighScore(Math.floor(this.score));
        AudioManager.play('gameOver');
        this.triggerFlash('#ff0000', 30);
    }

    // Victory
    _victory() {
        this.state = GameState.VICTORY;
        this.isNewRecord = Storage.setHighScore(Math.floor(this.score));
        AudioManager.play('victory');
        this.triggerFlash('#00ff00', 30);
    }

    // Collision detection
    _collides(a, b) {
        return a.x < b.x + b.width && a.x + a.width > b.x &&
               a.y < b.y + b.height && a.y + a.height > b.y;
    }

    // Render
    _render() {
        const ctx = this.ctx;

        ctx.save();
        ctx.translate(this.ui.screenShakeX, this.ui.screenShakeY);

        // Background
        this.bg.draw(ctx);

        switch (this.state) {
            case GameState.MENU:
                this.ui.drawMenu(ctx, this.highScore, this.highWave);
                break;

            case GameState.PLAYING:
            case GameState.PAUSED:
                // Draw game objects (back to front)
                this.dropManager.draw(ctx);
                this.formationManager.draw(ctx);
                if (this.boss) this.boss.draw(ctx);
                this.bulletPool.draw(ctx);
                this.player.draw(ctx, this.mouse);
                this.particlePool.draw(ctx);
                this._drawFloatingTexts(ctx);

                // HUD
                this.ui.drawHUD(ctx, this.player, Math.floor(this.score), this.wave, this.combo, this.highScore);
                this.ui.drawWaveAnnouncement(ctx, this.wave, this.waveAnnouncementTimer);
                this.ui.drawSoundIndicator(ctx, AudioManager.enabled);

                // Formation counter
                this._drawFormationCounter(ctx);

                if (this.state === GameState.PAUSED) this.ui.drawPause(ctx);
                break;

            case GameState.GAME_OVER:
                this.formationManager.draw(ctx);
                this.bulletPool.draw(ctx);
                this.player.draw(ctx, this.mouse);
                this.particlePool.draw(ctx);
                this._drawFloatingTexts(ctx);
                this.ui.drawGameOver(ctx, Math.floor(this.score), this.wave, this.highScore, this.isNewRecord, {
                    killed: this.enemiesKilled,
                    total: this.totalEnemies,
                    maxCombo: this.maxCombo
                });
                break;

            case GameState.VICTORY:
                this.particlePool.draw(ctx);
                this._drawFloatingTexts(ctx);
                this.ui.drawVictory(ctx, Math.floor(this.score), this.wave);
                break;
        }

        // Screen flash
        if (this.flash.active) {
            ctx.fillStyle = this.flash.color;
            ctx.globalAlpha = this.flash.alpha;
            ctx.fillRect(-10, -10, this.canvas.width + 20, this.canvas.height + 20);
            ctx.globalAlpha = 1;
        }

        // Slow-mo border
        if (this.slowMo.active) {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.3;
            ctx.strokeRect(5, 5, this.canvas.width - 10, this.canvas.height - 10);
            ctx.globalAlpha = 1;
        }

        // Scanlines
        this.ui.drawScanlines(ctx);

        ctx.restore();
    }

    // Draw formation enemy counter
    _drawFormationCounter(ctx) {
        const remaining = this.formationManager.getAliveCount();
        const total = this.totalEnemies;

        if (total > 0 && this.state === GameState.PLAYING) {
            ctx.save();
            ctx.fillStyle = '#aaa';
            ctx.font = '11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`Quái còn lại: ${remaining}/${total}`, this.canvas.width / 2, this.canvas.height - 15);
            ctx.restore();
        }
    }

    // Draw floating texts
    _drawFloatingTexts(ctx) {
        for (const ft of this.floatingTexts) {
            const alpha = ft.life / ft.maxLife;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = ft.color;
            ctx.font = `bold ${ft.size}px monospace`;
            ctx.textAlign = 'center';
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
        }
    }
}

/**
 * Background - Parallax scrolling background
 */
class Background {
    constructor(width, height) {
        this.width = width;
        this.height = height;

        this.starLayers = [
            { stars: [], speed: 0.2, count: 80, size: 0.8 },
            { stars: [], speed: 0.5, count: 60, size: 1.2 },
            { stars: [], speed: 1.0, count: 40, size: 1.8 }
        ];

        this.starLayers.forEach(layer => {
            for (let i = 0; i < layer.count; i++) {
                layer.stars.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    twinkle: Math.random() * Math.PI * 2
                });
            }
        });

        this.nebulae = [];
        for (let i = 0; i < 5; i++) {
            this.nebulae.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: 80 + Math.random() * 120,
                color: this._randomColor(),
                speed: 0.1 + Math.random() * 0.2,
                alpha: 0.05 + Math.random() * 0.08
            });
        }

        this.meteors = [];
        this.meteorTimer = 0;
    }

    _randomColor() {
        const colors = [
            { r: 100, g: 0, b: 150 },
            { r: 0, g: 50, b: 150 },
            { r: 150, g: 0, b: 50 },
            { r: 0, g: 100, b: 100 }
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        this.starLayers.forEach(layer => {
            layer.stars.forEach(star => {
                star.y += layer.speed;
                star.twinkle += 0.03;
                if (star.y > this.height) {
                    star.y = -5;
                    star.x = Math.random() * this.width;
                }
            });
        });

        this.nebulae.forEach(neb => {
            neb.y += neb.speed;
            if (neb.y - neb.radius > this.height) {
                neb.y = -neb.radius;
                neb.x = Math.random() * this.width;
            }
        });

        this.meteorTimer++;
        if (this.meteorTimer > 120 && Math.random() < 0.02) {
            this.meteors.push({
                x: Math.random() * this.width,
                y: -20,
                vx: (Math.random() - 0.5) * 2,
                vy: 3 + Math.random() * 4,
                size: 2 + Math.random() * 3,
                life: 200
            });
            this.meteorTimer = 0;
        }

        for (let i = this.meteors.length - 1; i >= 0; i--) {
            const m = this.meteors[i];
            m.x += m.vx;
            m.y += m.vy;
            m.life--;
            if (m.life <= 0 || m.y > this.height + 50) this.meteors.splice(i, 1);
        }
    }

    draw(ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#050510');
        gradient.addColorStop(0.3, '#0a0a2a');
        gradient.addColorStop(0.7, '#0f0a1a');
        gradient.addColorStop(1, '#0a0515');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);

        this.nebulae.forEach(neb => {
            const grad = ctx.createRadialGradient(neb.x, neb.y, 0, neb.x, neb.y, neb.radius);
            grad.addColorStop(0, `rgba(${neb.color.r}, ${neb.color.g}, ${neb.color.b}, ${neb.alpha})`);
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(neb.x - neb.radius, neb.y - neb.radius, neb.radius * 2, neb.radius * 2);
        });

        this.starLayers.forEach(layer => {
            layer.stars.forEach(star => {
                const brightness = 0.5 + Math.sin(star.twinkle) * 0.5;
                ctx.fillStyle = `rgba(255,255,255,${brightness})`;
                ctx.beginPath();
                ctx.arc(star.x, star.y, layer.size, 0, Math.PI * 2);
                ctx.fill();
            });
        });

        this.meteors.forEach(m => {
            ctx.strokeStyle = 'rgba(255, 200, 100, 0.6)';
            ctx.lineWidth = m.size * 0.5;
            ctx.beginPath();
            ctx.moveTo(m.x, m.y);
            ctx.lineTo(m.x - m.vx * 3, m.y - m.vy * 3);
            ctx.stroke();
            ctx.fillStyle = '#ffcc88';
            ctx.beginPath();
            ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}

// Start game
window.addEventListener('load', () => { new Game(); });
