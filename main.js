/**
 * Main - Optimized game loop
 */
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver',
    VICTORY: 'victory'
};

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;

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

        // Pools sized for full formations
        this.bulletPool = new BulletPool(300);
        this.particlePool = new ParticlePool(350);
        this.formationManager = new FormationManager(this.canvas.width, this.canvas.height);
        this.dropManager = new DropManager(this.canvas.width, this.canvas.height);
        this.ui = new UI(this.canvas.width, this.canvas.height);

        this.player = new Player(this.canvas.width, this.canvas.height);
        this.boss = null;
        this.bossActive = false;

        this.waveAnnouncementTimer = 0;
        this.betweenWaveDelay = 0;

        this.keys = { left: false, right: false, up: false, down: false };
        this.mouse = { x: this.canvas.width / 2, y: this.canvas.height / 2, down: false };

        this.bg = new Background(this.canvas.width, this.canvas.height);

        this.slowMo = { active: false, factor: 1, timer: 0 };
        this.flash = { active: false, color: '#fff', alpha: 0 };
        this.floatingTexts = [];

        // Frame rate
        this.lastFrameTime = 0;
        this.frameInterval = 1000 / 60;

        // Skip frames counter for heavy effects
        this.frameCount = 0;

        // Cached player bounds object (reused every frame)
        this._playerBounds = { x: 0, y: 0, width: 0, height: 0 };

        AudioManager.init();
        this._setupInput();
        this._gameLoop(performance.now());
    }

    _setupInput() {
        // Keyboard
        document.addEventListener('keydown', (e) => this._handleKeyDown(e));
        document.addEventListener('keyup', (e) => this._handleKeyUp(e));

        // Mouse
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

        // Canvas touch for aiming
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            AudioManager.resume();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
            this.mouse.y = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
            this.mouse.down = true;
            this._handleAction();
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
            this.mouse.y = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.mouse.down = false;
        }, { passive: false });

        // Mobile touch buttons
        this._setupTouchButtons();
    }

    // Setup mobile touch buttons
    _setupTouchButtons() {
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (!isTouchDevice) return;

        const addTouchEvent = (id, key) => {
            const btn = document.getElementById(id);
            if (!btn) return;

            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.keys[key] = true;
                AudioManager.resume();
            }, { passive: false });

            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.keys[key] = false;
            }, { passive: false });

            btn.addEventListener('touchcancel', (e) => {
                this.keys[key] = false;
            });
        };

        addTouchEvent('btn-left', 'left');
        addTouchEvent('btn-right', 'right');
        addTouchEvent('btn-up', 'up');
        addTouchEvent('btn-down', 'down');

        // Fire button
        const fireBtn = document.getElementById('btn-fire');
        if (fireBtn) {
            fireBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.mouse.down = true;
                AudioManager.resume();
                this._handleAction();
            }, { passive: false });

            fireBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.mouse.down = false;
            }, { passive: false });
        }

        // Switch weapon button
        const switchBtn = document.getElementById('btn-switch');
        if (switchBtn) {
            switchBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (this.state === GameState.PLAYING) {
                    this.player.weaponType = this.player.weaponType === 'rapid' ? 'spread' : 'rapid';
                }
            }, { passive: false });
        }

        // Auto-aim: set mouse to above player for mobile
        if (this.state === GameState.PLAYING) {
            this.mouse.x = this.player.x;
            this.mouse.y = this.player.y - 200;
        }
    }

    _handleAction() {
        if (this.state === GameState.MENU || this.state === GameState.GAME_OVER || this.state === GameState.VICTORY) {
            this._startGame();
        }
    }

    _handleKeyDown(e) {
        switch (e.key) {
            case 'ArrowLeft': case 'a': case 'A': this.keys.left = true; e.preventDefault(); break;
            case 'ArrowRight': case 'd': case 'D': this.keys.right = true; e.preventDefault(); break;
            case 'ArrowUp': case 'w': case 'W': this.keys.up = true; e.preventDefault(); break;
            case 'ArrowDown': case 's': case 'S': this.keys.down = true; e.preventDefault(); break;
            case ' ': e.preventDefault(); this._handleAction(); break;
            case 'p': case 'P': case 'Escape':
                if (this.state === GameState.PLAYING) this.state = GameState.PAUSED;
                else if (this.state === GameState.PAUSED) this.state = GameState.PLAYING;
                break;
            case 'm': case 'M': AudioManager.toggle(); break;
            case 'q': case 'Q':
                if (this.state === GameState.PLAYING) {
                    this.player.weaponType = this.player.weaponType === 'rapid' ? 'spread' : 'rapid';
                }
                break;
        }
    }

    _handleKeyUp(e) {
        switch (e.key) {
            case 'ArrowLeft': case 'a': case 'A': this.keys.left = false; break;
            case 'ArrowRight': case 'd': case 'D': this.keys.right = false; break;
            case 'ArrowUp': case 'w': case 'W': this.keys.up = false; break;
            case 'ArrowDown': case 's': case 'S': this.keys.down = false; break;
        }
    }

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
        this.particlePool = new ParticlePool(200);
        this.dropManager.clear();
        this.formationManager.clear();
        this.boss = null;
        this.bossActive = false;

        this._startWave(1);
    }

    _startWave(waveNum) {
        this.wave = waveNum;
        this.waveAnnouncementTimer = 90;
        this.betweenWaveDelay = 0;

        if (waveNum % 5 === 0) {
            this.boss = new Boss(this.canvas.width, this.canvas.height, waveNum);
            this.bossActive = true;
        }

        const enemies = this.formationManager.generateFormation(waveNum);
        this.totalEnemies = enemies.length;
        Storage.setHighWave(waveNum);
    }

    triggerSlowMo(factor = 0.3, duration = 20) {
        this.slowMo = { active: true, factor, timer: duration };
    }

    triggerFlash(color = '#fff', duration = 8) {
        this.flash = { active: true, color, alpha: 0.4, duration };
    }

    addFloatingText(x, y, text, color = '#fff', size = 14) {
        if (this.floatingTexts.length > 15) this.floatingTexts.shift();
        this.floatingTexts.push({ x, y, text, color, size, vy: -1.5, life: 35, maxLife: 35 });
    }

    _gameLoop(now) {
        requestAnimationFrame((t) => this._gameLoop(t));

        const elapsed = now - this.lastFrameTime;
        if (elapsed < this.frameInterval) return;
        this.lastFrameTime = now - (elapsed % this.frameInterval);

        this.frameCount++;
        this._update();
        this._render();
    }

    _update() {
        this.bg.update();
        this.ui.updateShake();

        if (this.slowMo.active) {
            this.slowMo.timer--;
            if (this.slowMo.timer <= 0) {
                this.slowMo.active = false;
                this.slowMo.factor = 1;
            }
        }

        if (this.flash.active) {
            this.flash.alpha -= 0.05;
            if (this.flash.alpha <= 0) this.flash.active = false;
        }

        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            this.floatingTexts[i].y += this.floatingTexts[i].vy;
            this.floatingTexts[i].life--;
            if (this.floatingTexts[i].life <= 0) this.floatingTexts.splice(i, 1);
        }

        if (this.state !== GameState.PLAYING) return;

        const dt = this.slowMo.active ? this.slowMo.factor : 1;

        // Auto-aim for mobile (aim upward)
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (isTouchDevice && !this.mouse.down) {
            this.mouse.x = this.player.x;
            this.mouse.y = this.player.y - 300;
        }

        this.player.update(this.keys, this.mouse, this.bulletPool, dt);

        // Only thrust particles every 2nd frame
        if (this.frameCount % 2 === 0 && (this.keys.left || this.keys.right || this.keys.up || this.keys.down)) {
            this.particlePool.thrust(this.player.x, this.player.y + this.player.height / 2);
        }

        this.bulletPool.update(this.canvas.width, this.canvas.height, dt);
        this.formationManager.update(dt);

        if (this.boss && this.bossActive) {
            this.boss.update(this.player.x, this.player.y, this.bulletPool, dt);
            if (!this.boss.active) this._onBossKilled();
        }

        this._updateEnemyActions(dt);
        this.dropManager.update(dt);
        this.particlePool.update(dt);
        this._checkCollisions();
        this._checkWaveComplete();

        if (this.comboTimer > 0) {
            this.comboTimer--;
            if (this.comboTimer <= 0) this.combo = 0;
        }

        if (this.waveAnnouncementTimer > 0) this.waveAnnouncementTimer--;
    }

    _updateEnemyActions(dt) {
        const enemies = this.formationManager.getEnemies();
        for (const enemy of enemies) {
            if (enemy.shouldShoot()) this._enemyShoot(enemy);
            if (enemy.shouldDropPoop()) {
                this.dropManager.spawnPoop(enemy.x, enemy.y + enemy.height / 2);
            }
        }
    }

    _enemyShoot(enemy) {
        const dx = this.player.x - enemy.x;
        const dy = this.player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        this.bulletPool.fire({
            x: enemy.x, y: enemy.y + enemy.height / 2,
            vx: (dx / dist) * 3.5, vy: (dy / dist) * 3.5,
            width: 6, height: 6,
            damage: 1, type: 'enemy', color: '#ff6644'
        });
    }

    _onBossKilled() {
        this.score += this.boss.score;
        this.particlePool.bossExplosion(this.boss.x, this.boss.y);
        this.ui.applyShake(15, 30);
        this.triggerSlowMo(0.3, 40);
        this.triggerFlash('#ff8800', 15);
        AudioManager.play('bossDeath');
        this.addFloatingText(this.boss.x, this.boss.y, `+${this.boss.score}`, '#ffaa00', 20);

        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                this.dropManager.spawnGift(
                    this.boss.x + (Math.random() - 0.5) * 150,
                    this.boss.y + i * 25
                );
            }, i * 150);
        }

        this.boss = null;
        this.bossActive = false;
    }

    // Optimized collision detection - no array allocations
    _checkCollisions() {
        const playerBounds = this.player.getBounds();
        const enemies = this.formationManager.getEnemies();
        const hasBoss = this.boss && this.boss.active && !this.boss.entering;
        const bossBounds = hasBoss ? this.boss.getBounds() : null;

        // Player bullets vs enemies + boss (single pass, no getActive/concat)
        this.bulletPool.forEachActive('player', (bullet) => {
            const bb = bullet.getBounds();

            for (const enemy of enemies) {
                if (!enemy.active) continue;
                if (this._collides(bb, enemy.getBounds())) {
                    if (enemy.takeDamage(bullet.damage)) {
                        this._onEnemyKilled(enemy);
                    } else {
                        this.particlePool.explosion(bullet.x, bullet.y, 4, enemy.color, { speed: 2, maxSize: 2 });
                        AudioManager.play('enemyHit');
                    }
                    if (!bullet.piercing) bullet.active = false;
                    break;
                }
            }

            if (hasBoss && bullet.active) {
                if (this._collides(bb, bossBounds)) {
                    this.boss.takeDamage(bullet.damage);
                    this.particlePool.explosion(bullet.x, bullet.y, 5, '#ff4444', { speed: 2, maxSize: 2 });
                    AudioManager.play('bossHit');
                    if (!bullet.piercing) bullet.active = false;
                }
            }
        });

        // Laser bullets vs enemies + boss (single pass)
        this.bulletPool.forEachActive('laser', (bullet) => {
            const bb = bullet.getBounds();

            for (const enemy of enemies) {
                if (!enemy.active) continue;
                if (this._collides(bb, enemy.getBounds())) {
                    if (enemy.takeDamage(bullet.damage)) {
                        this._onEnemyKilled(enemy);
                    } else {
                        this.particlePool.explosion(bullet.x, bullet.y, 4, enemy.color, { speed: 2, maxSize: 2 });
                        AudioManager.play('enemyHit');
                    }
                    if (!bullet.piercing) bullet.active = false;
                    break;
                }
            }

            if (hasBoss && bullet.active) {
                if (this._collides(bb, bossBounds)) {
                    this.boss.takeDamage(bullet.damage);
                    this.particlePool.explosion(bullet.x, bullet.y, 5, '#ff4444', { speed: 2, maxSize: 2 });
                    AudioManager.play('bossHit');
                    if (!bullet.piercing) bullet.active = false;
                }
            }
        });

        // Enemy bullets vs player (single pass)
        this.bulletPool.forEachActive('enemy', (bullet) => {
            if (this._collides(bullet.getBounds(), playerBounds)) {
                if (this.player.takeDamage(this.particlePool)) {
                    if (!this.player.isAlive()) this._gameOver();
                }
                bullet.active = false;
                this.ui.applyShake(6, 10);
                this.triggerFlash('#ff0000', 6);
            }
        });

        if (this.dropManager.checkPoopCollision(playerBounds)) {
            if (this.player.takeDamage(this.particlePool)) {
                if (!this.player.isAlive()) this._gameOver();
            }
            this.ui.applyShake(8, 12);
            this.triggerFlash('#884400', 8);
            this.addFloatingText(this.player.x, this.player.y - 25, 'POOP!', '#8B4513', 16);
        }

        const collected = this.dropManager.checkGiftCollection(playerBounds);
        for (const type of collected) {
            this.player.upgradeWeapon(type);
            this.score += 100;
            this.particlePool.pickupEffect(this.player.x, this.player.y, type === 'rapid' ? '#ffaa00' : '#00ffcc');
            AudioManager.play('powerup');
            const level = this.player.getCurrentLevel();
            this.addFloatingText(this.player.x, this.player.y - 35, `${type.toUpperCase()} LV${level}!`, type === 'rapid' ? '#ffaa00' : '#00ffcc', 18);
        }

        if (hasBoss) {
            if (this._collides(bossBounds, playerBounds)) {
                if (this.player.takeDamage(this.particlePool)) {
                    if (!this.player.isAlive()) this._gameOver();
                }
                this.ui.applyShake(10, 15);
            }
        }
    }

    _onEnemyKilled(enemy) {
        const earnedScore = Math.floor(enemy.score * (1 + this.combo * 0.15));
        this.score += earnedScore;
        this.combo++;
        this.comboTimer = 90;
        this.enemiesKilled++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;

        if (this.combo >= 5 && this.combo % 5 === 0) {
            AudioManager.play('combo');
            this.triggerFlash('#ffaa00', 4);
            this.addFloatingText(this.canvas.width / 2, 90, `x${this.combo} COMBO!`, '#ffaa00', 24);
        }

        this.particlePool.explosion(enemy.x, enemy.y, 12, enemy.color, { speed: 3, maxSize: 3 });
        AudioManager.play('explosion');
        this.addFloatingText(enemy.x, enemy.y - 15, `+${earnedScore}`, '#ffff00', 14);

        if (enemy.shouldDropGift()) {
            this.dropManager.spawnGift(enemy.x, enemy.y);
        }
    }

    _checkWaveComplete() {
        if (this.formationManager.isCleared() && (!this.bossActive || (this.boss && !this.boss.active))) {
            this.betweenWaveDelay++;
            if (this.betweenWaveDelay > 70) {
                if (this.wave >= this.maxWave) this._victory();
                else this._startWave(this.wave + 1);
            }
        }
    }

    _gameOver() {
        this.state = GameState.GAME_OVER;
        this.isNewRecord = Storage.setHighScore(Math.floor(this.score));
        AudioManager.play('gameOver');
        this.triggerFlash('#ff0000', 20);
    }

    _victory() {
        this.state = GameState.VICTORY;
        this.isNewRecord = Storage.setHighScore(Math.floor(this.score));
        AudioManager.play('victory');
        this.triggerFlash('#00ff00', 20);
    }

    _collides(a, b) {
        return a.x < b.x + b.width && a.x + a.width > b.x &&
               a.y < b.y + b.height && a.y + a.height > b.y;
    }

    _render() {
        const ctx = this.ctx;

        ctx.save();
        ctx.translate(this.ui.screenShakeX, this.ui.screenShakeY);

        this.bg.draw(ctx);

        switch (this.state) {
            case GameState.MENU:
                this.ui.drawMenu(ctx, this.highScore, this.highWave);
                break;

            case GameState.PLAYING:
            case GameState.PAUSED:
                this.dropManager.draw(ctx);
                this.formationManager.draw(ctx);
                if (this.boss) this.boss.draw(ctx);
                this.bulletPool.draw(ctx);
                this.player.draw(ctx, this.mouse);
                this.particlePool.draw(ctx);
                this._drawFloatingTexts(ctx);

                this.ui.drawHUD(ctx, this.player, Math.floor(this.score), this.wave, this.combo, this.highScore);
                this.ui.drawWaveAnnouncement(ctx, this.wave, this.waveAnnouncementTimer);
                this.ui.drawSoundIndicator(ctx, AudioManager.enabled);
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
                    killed: this.enemiesKilled, total: this.totalEnemies, maxCombo: this.maxCombo
                });
                break;

            case GameState.VICTORY:
                this.particlePool.draw(ctx);
                this._drawFloatingTexts(ctx);
                this.ui.drawVictory(ctx, Math.floor(this.score), this.wave);
                break;
        }

        if (this.flash.active) {
            ctx.fillStyle = this.flash.color;
            ctx.globalAlpha = this.flash.alpha;
            ctx.fillRect(-10, -10, this.canvas.width + 20, this.canvas.height + 20);
            ctx.globalAlpha = 1;
        }

        ctx.restore();
    }

    _drawFormationCounter(ctx) {
        const remaining = this.formationManager.getAliveCount();
        if (this.totalEnemies > 0 && this.state === GameState.PLAYING) {
            ctx.fillStyle = '#aaa';
            ctx.font = '11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`Quái còn lại: ${remaining}/${this.totalEnemies}`, this.canvas.width / 2, this.canvas.height - 15);
        }
    }

    _drawFloatingTexts(ctx) {
        for (const ft of this.floatingTexts) {
            ctx.globalAlpha = ft.life / ft.maxLife;
            ctx.fillStyle = ft.color;
            ctx.font = `bold ${ft.size}px monospace`;
            ctx.textAlign = 'center';
            ctx.fillText(ft.text, ft.x, ft.y);
        }
        ctx.globalAlpha = 1;
    }
}

/**
 * Background - Lightweight parallax with cached gradients
 */
class Background {
    constructor(width, height) {
        this.width = width;
        this.height = height;

        this.stars = [];
        for (let i = 0; i < 80; i++) {
            this.stars.push({
                x: Math.random() * width,
                y: Math.random() * height,
                speed: 0.3 + Math.random() * 0.7,
                size: 0.5 + Math.random() * 1.5
            });
        }

        this.nebulae = [];
        for (let i = 0; i < 3; i++) {
            this.nebulae.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: 80 + Math.random() * 100,
                color: i === 0 ? { r: 80, g: 0, b: 120 } : i === 1 ? { r: 0, g: 40, b: 120 } : { r: 120, g: 0, b: 50 },
                speed: 0.08 + Math.random() * 0.1,
                alpha: 0.04
            });
        }

        this.meteors = [];
        this.meteorTimer = 0;

        // Cache the background gradient (created once)
        this._bgGradient = null;
    }

    update() {
        for (const star of this.stars) {
            star.y += star.speed;
            if (star.y > this.height) {
                star.y = -2;
                star.x = Math.random() * this.width;
            }
        }

        for (const neb of this.nebulae) {
            neb.y += neb.speed;
            if (neb.y - neb.radius > this.height) {
                neb.y = -neb.radius;
                neb.x = Math.random() * this.width;
            }
        }

        this.meteorTimer++;
        if (this.meteorTimer > 200 && Math.random() < 0.01) {
            this.meteors.push({
                x: Math.random() * this.width,
                y: -15,
                vx: (Math.random() - 0.5) * 1.5,
                vy: 3 + Math.random() * 3,
                size: 2,
                life: 120
            });
            this.meteorTimer = 0;
        }

        for (let i = this.meteors.length - 1; i >= 0; i--) {
            const m = this.meteors[i];
            m.x += m.vx;
            m.y += m.vy;
            m.life--;
            if (m.life <= 0 || m.y > this.height + 30) this.meteors.splice(i, 1);
        }
    }

    draw(ctx) {
        // Cached background gradient
        if (!this._bgGradient) {
            this._bgGradient = ctx.createLinearGradient(0, 0, 0, this.height);
            this._bgGradient.addColorStop(0, '#050510');
            this._bgGradient.addColorStop(0.5, '#0a0a25');
            this._bgGradient.addColorStop(1, '#0a0515');
        }
        ctx.fillStyle = this._bgGradient;
        ctx.fillRect(0, 0, this.width, this.height);

        // Nebulae - draw with simple fillStyle (skip expensive radial gradients)
        for (const neb of this.nebulae) {
            ctx.fillStyle = `rgba(${neb.color.r}, ${neb.color.g}, ${neb.color.b}, ${neb.alpha})`;
            ctx.beginPath();
            ctx.arc(neb.x, neb.y, neb.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Stars
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        for (const star of this.stars) {
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Meteors
        ctx.strokeStyle = 'rgba(255, 200, 100, 0.5)';
        ctx.lineWidth = 1;
        for (const m of this.meteors) {
            ctx.beginPath();
            ctx.moveTo(m.x, m.y);
            ctx.lineTo(m.x - m.vx * 3, m.y - m.vy * 3);
            ctx.stroke();
            ctx.fillStyle = '#ffcc88';
            ctx.beginPath();
            ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

window.addEventListener('load', () => { new Game(); });
