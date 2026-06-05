/**
 * Dino Hunter - Main Game Controller
 */
// roundRect polyfill
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
        const r = typeof radii === 'number' ? radii : (radii && radii[0]) || 0;
        this.moveTo(x + r, y); this.lineTo(x + w - r, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r); this.lineTo(x + w, y + h - r);
        this.quadraticCurveTo(x + w, y + h, x + w - r, y + h); this.lineTo(x + r, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r); this.lineTo(x, y + r);
        this.quadraticCurveTo(x, y, x + r, y); this.closePath();
    };
}

const GameState = { READY: 'ready', PLAYING: 'playing', PAUSED: 'paused', GAME_OVER: 'gameOver' };

const ACHIEVEMENTS = [
    { id: 'firstWeapon', label: 'Armed!', desc: 'Picked up your first weapon', check: (g) => g._gotFirstWeapon },
    { id: 'doubleJump', label: 'Double Jump!', desc: 'Unlocked double jump at score 200', check: (g) => g.player.canDoubleJump },
    { id: 'score100', label: '100 Score!', desc: 'Reached 100 points', check: (g) => g.world.score >= 100 },
    { id: 'score500', label: '500 Score!', desc: 'Reached 500 points', check: (g) => g.world.score >= 500 },
    { id: 'score1000', label: '1000 Score!', desc: 'Reached 1000 points', check: (g) => g.world.score >= 1000 },
    { id: 'score5000', label: '5000 Score!', desc: 'Reached 5000 points', check: (g) => g.world.score >= 5000 },
    { id: 'coins100', label: '100 Coins!', desc: 'Collected 100 lifetime coins', check: (g) => Storage.getLifetimeCoins() >= 100 },
    { id: 'coins1000', label: '1000 Coins!', desc: 'Collected 1000 lifetime coins', check: (g) => Storage.getLifetimeCoins() >= 1000 },
    { id: 'coins2048', label: '2048 Coins!', desc: 'Collected 2048 lifetime coins', check: (g) => Storage.getLifetimeCoins() >= 2048 },
    { id: 'enemies100', label: '100 Kills!', desc: 'Destroyed 100 enemies', check: (g) => Storage.getEnemiesDestroyed() >= 100 },
    { id: 'enemies500', label: '500 Kills!', desc: 'Destroyed 500 enemies', check: (g) => Storage.getEnemiesDestroyed() >= 500 },
];

class DinoHunterGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.W = 800;
        this.H = 300;
        this.GROUND_Y = 250;
        this.canvas.width = this.W;
        this.canvas.height = this.H;
        this._resize();
        window.addEventListener('resize', () => this._resize());

        this.state = GameState.READY;
        this.player = new Player(this.GROUND_Y);
        this.world = new WorldManager(this.W, this.GROUND_Y);

        this.bestScore = Storage.getBestScore();
        this._gotFirstWeapon = false;
        this.doubleJumpUnlocked = false;

        // Achievement popup
        this.achievementQueue = [];
        this.currentAchievement = null;
        this.achievementTimer = 0;

        // Day/night cycle
        this.cycleTimer = 0;
        this.cyclePhase = 0; // 0=day, 1=sunset, 2=night, 3=dawn

        // Ground scroll
        this.groundOffset = 0;

        // Stars (for night)
        this.stars = [];
        for (let i = 0; i < 40; i++) {
            this.stars.push({ x: Math.random() * this.W, y: Math.random() * 180, size: 0.5 + Math.random() * 1.5 });
        }

        // Clouds
        this.clouds = [];
        for (let i = 0; i < 5; i++) {
            this.clouds.push({ x: Math.random() * this.W, y: 30 + Math.random() * 80, w: 40 + Math.random() * 60 });
        }

        // Frame rate
        this.lastTime = 0;
        this.frameInterval = 1000 / 60;
        this.frameCount = 0;

        this._setupInput();
        this._gameLoop(performance.now());
    }

    _resize() {
        const maxW = window.innerWidth;
        const maxH = window.innerHeight - 80;
        const scale = Math.min(maxW / this.W, maxH / this.H, 1);
        this.canvas.style.width = Math.floor(this.W * scale) + 'px';
        this.canvas.style.height = Math.floor(this.H * scale) + 'px';
    }

    _setupInput() {
        let touchHandled = false;
        let lastTapTime = 0;

        // Keyboard
        document.addEventListener('keydown', (e) => {
            AudioManager.resume();
            if (e.key === ' ' || e.key === 'ArrowUp') {
                e.preventDefault();
                this._doJump();
            }
            if (e.key === 'ArrowDown') { e.preventDefault(); this.player.duck(true); }
            if (e.key === 'z' || e.key === 'Z') this._manualFire();
            if (e.key === 'p' || e.key === 'P') this._togglePause();
            if (e.key === 'r' || e.key === 'R') this._restart();
        });
        document.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowDown') this.player.duck(false);
        });

        // Touch
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); AudioManager.resume(); touchHandled = true;
            const now = Date.now();
            if (now - lastTapTime < 300) {
                this._doDoubleJump();
            } else {
                this._doJump();
            }
            lastTapTime = now;
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const t = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const y = (t.clientY - rect.top) / rect.height * this.H;
            if (y > this.H * 0.7) this.player.duck(true);
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault(); this.player.duck(false);
        }, { passive: false });

        // Click
        this.canvas.addEventListener('click', () => {
            if (touchHandled) { touchHandled = false; return; }
            this._doJump();
        });

        // Swipe down for duck
        let swipeStartY = 0;
        this.canvas.addEventListener('touchstart', (e) => { swipeStartY = e.touches[0].clientY; }, { passive: true });
        this.canvas.addEventListener('touchend', (e) => {
            const dy = e.changedTouches[0].clientY - swipeStartY;
            if (dy > 50) { this.player.duck(true); setTimeout(() => this.player.duck(false), 500); }
        }, { passive: true });

        // New Game button
        const newGameBtn = document.getElementById('btn-new-game');
        if (newGameBtn) newGameBtn.addEventListener('click', () => this._restart());

        // Sound toggle
        const soundBtn = document.getElementById('sound-toggle');
        if (soundBtn) soundBtn.addEventListener('click', () => {
            const on = AudioManager.toggle(); soundBtn.textContent = on ? '🔊' : '🔇';
        });
    }

    _doJump() {
        if (this.state === GameState.READY) { this.state = GameState.PLAYING; Storage.addGamePlayed(); }
        if (this.state === GameState.GAME_OVER) { this._restart(); return; }
        if (this.state !== GameState.PLAYING) return;
        const result = this.player.jump();
        if (result === 'jump') AudioManager.play('jump');
        else if (result === 'doubleJump') AudioManager.play('doubleJump');
    }

    _doDoubleJump() {
        if (this.state !== GameState.PLAYING) return;
        const result = this.player.jump();
        if (result === 'doubleJump') AudioManager.play('doubleJump');
    }

    _manualFire() {
        if (this.state !== GameState.PLAYING || !this.player.hasWeapon) return;
        this._fireWeapon();
    }

    _fireWeapon() {
        const bx = this.player.x + this.player.width;
        const by = this.player.y + this.player.height / 2 - 4;
        this.world.fireWeapon(bx, by);
        AudioManager.play('laser');
    }

    _togglePause() {
        if (this.state === GameState.PLAYING) this.state = GameState.PAUSED;
        else if (this.state === GameState.PAUSED) this.state = GameState.PLAYING;
    }

    _restart() {
        this.player = new Player(this.GROUND_Y);
        this.world.reset();
        this._gotFirstWeapon = false;
        this.doubleJumpUnlocked = false;
        this.achievementQueue = [];
        this.currentAchievement = null;
        this.state = GameState.READY;
    }

    _gameLoop(now) {
        requestAnimationFrame((t) => this._gameLoop(t));
        const elapsed = now - this.lastTime;
        if (elapsed < this.frameInterval) return;
        this.lastTime = now - (elapsed % this.frameInterval);
        this.frameCount++;
        this._update();
        this._render();
    }

    _update() {
        if (this.state !== GameState.PLAYING) return;

        const dt = 1;

        // Update player
        this.player.update(dt);

        // Update world
        this.world.update(dt, this.player, this.doubleJumpUnlocked);

        // Auto fire weapon
        if (this.player.hasWeapon) {
            this.player.fireTimer -= dt;
            const rate = this.player.rapidFire ? 6 : this.player.fireRate;
            if (this.player.fireTimer <= 0) {
                this._fireWeapon();
                this.player.fireTimer = rate;
            }
        }

        // Ground scroll
        this.groundOffset = (this.groundOffset + this.world.speed * dt) % 24;

        // Day/night cycle
        this.cycleTimer += dt;
        if (this.cycleTimer > 600) { this.cycleTimer = 0; this.cyclePhase = (this.cyclePhase + 1) % 4; }

        // Clouds
        for (const c of this.clouds) {
            c.x -= this.world.speed * 0.2 * dt;
            if (c.x + c.w < 0) { c.x = this.W + 20; c.y = 30 + Math.random() * 80; }
        }

        // Double jump unlock at score 200
        if (this.world.score >= 200 && !this.doubleJumpUnlocked) {
            this.player.canDoubleJump = true;
            this.doubleJumpUnlocked = true;
            this._showAchievement('doubleJump');
        }

        // Collisions
        this._checkCollisions();

        // Check achievements
        this._checkAchievements();

        // Achievement popup update
        if (this.currentAchievement) {
            this.achievementTimer -= dt;
            if (this.achievementTimer <= 0) this.currentAchievement = null;
        } else if (this.achievementQueue.length > 0) {
            const id = this.achievementQueue.shift();
            const ach = ACHIEVEMENTS.find(a => a.id === id);
            if (ach) { this.currentAchievement = ach; this.achievementTimer = 120; AudioManager.play('achievement'); }
        }

        // Update HUD
        this._updateHUD();
    }

    _checkCollisions() {
        const pb = this.player.getBounds();

        // Obstacles
        for (const o of this.world.obstacles) {
            if (!o.active) continue;
            if (this._overlap(pb, o.getBounds())) {
                if (this.player.hit()) {
                    this._onDeath();
                    return;
                }
            }
        }

        // Enemies
        for (const e of this.world.enemies) {
            if (!e.active) continue;
            if (this._overlap(pb, e.getBounds())) {
                if (this.player.hit()) {
                    this._onDeath();
                    return;
                }
            }
        }

        // Projectiles vs obstacles/enemies
        for (const p of this.world.projectiles) {
            if (!p.active) continue;
            const pr = p.getBounds();
            for (const o of this.world.obstacles) {
                if (!o.active) continue;
                if (this._overlap(pr, o.getBounds())) {
                    p.active = false; o.active = false;
                    this.world.addExplosion(o.x + o.width / 2, o.y + o.height / 2, '#ff8800', 8);
                    AudioManager.play('enemyHit');
                    break;
                }
            }
            for (const e of this.world.enemies) {
                if (!e.active) continue;
                if (this._overlap(pr, e.getBounds())) {
                    p.active = false;
                    if (e.hit(1)) {
                        this.world.enemiesKilled++;
                        this.world.addExplosion(e.x + e.width / 2, e.y + e.height / 2, '#ff4444', 12);
                        AudioManager.play('enemyHit');
                    }
                    break;
                }
            }
        }

        // Coins
        for (const c of this.world.coins) {
            if (!c.active) continue;
            if (this._overlap(pb, c.getBounds())) {
                c.active = false;
                this.world.coinsCollected++;
                AudioManager.play('coin');
                this.world.addExplosion(c.x, c.y, '#ffcc00', 5);
            }
        }

        // Powerups
        for (const pu of this.world.powerups) {
            if (!pu.active) continue;
            if (this._overlap(pb, pu.getBounds())) {
                pu.active = false;
                this._applyPowerup(pu.type);
                AudioManager.play('powerup');
                this.world.addExplosion(pu.x, pu.y, pu.color, 10);
            }
        }
    }

    _applyPowerup(type) {
        switch (type) {
            case 'shield':
                this.player.hasShield = true; this.player.shieldTimer = 600; break;
            case 'weapon':
                this.player.hasWeapon = true; this.player.weaponTimer = 600;
                this.player.fireRate = 12;
                if (!this._gotFirstWeapon) { this._gotFirstWeapon = true; this._showAchievement('firstWeapon'); }
                break;
            case 'rapidFire':
                this.player.hasWeapon = true; this.player.weaponTimer = 400;
                this.player.rapidFire = true; this.player.rapidFireTimer = 400; this.player.fireRate = 6;
                break;
            case 'slowMo':
                this.player.slowMo = true; this.player.slowMoTimer = 300; break;
            case 'magnet':
                this.player.hasMagnet = true; this.player.magnetTimer = 500; break;
        }
    }

    _onDeath() {
        this.player.die();
        this.state = GameState.GAME_OVER;
        AudioManager.play('hit');
        setTimeout(() => AudioManager.play('gameover'), 300);

        // Save stats
        Storage.setBestScore(this.world.score);
        Storage.setHighestDistance(Math.floor(this.world.distance));
        Storage.addLifetimeCoins(this.world.coinsCollected);
        Storage.addEnemiesDestroyed(this.world.enemiesKilled);
        this.bestScore = Storage.getBestScore();
    }

    _checkAchievements() {
        for (const ach of ACHIEVEMENTS) {
            if (!Storage.hasAchievement(ach.id) && ach.check(this)) {
                Storage.unlockAchievement(ach.id);
                this._showAchievement(ach.id);
            }
        }
    }

    _showAchievement(id) {
        if (!this.achievementQueue.includes(id) && (!this.currentAchievement || this.currentAchievement.id !== id)) {
            this.achievementQueue.push(id);
        }
    }

    _overlap(a, b) {
        return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
    }

    _updateHUD() {
        const el = (id) => document.getElementById(id);
        if (el('hud-score')) el('hud-score').textContent = this.world.score;
        if (el('hud-coins')) el('hud-coins').textContent = this.world.coinsCollected;
        if (el('hud-best')) el('hud-best').textContent = this.bestScore;
    }

    _render() {
        const ctx = this.ctx;

        // Sky (day/night cycle)
        const bgColors = [
            ['#87CEEB', '#E0F0FF'], // day
            ['#FF8C42', '#2D1B69'], // sunset
            ['#0a0a2a', '#1a1a4a'], // night
            ['#FFB347', '#87CEEB'], // dawn
        ];
        const [c1, c2] = bgColors[this.cyclePhase];
        const skyGrad = ctx.createLinearGradient(0, 0, 0, this.GROUND_Y);
        skyGrad.addColorStop(0, c1); skyGrad.addColorStop(1, c2);
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, this.W, this.GROUND_Y);

        // Stars (night)
        if (this.cyclePhase === 2) {
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            for (const s of this.stars) {
                ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill();
            }
        }

        // Clouds
        ctx.fillStyle = this.cyclePhase === 2 ? 'rgba(100,100,150,0.3)' : 'rgba(255,255,255,0.6)';
        for (const c of this.clouds) {
            ctx.beginPath(); ctx.ellipse(c.x, c.y, c.w / 2, 14, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(c.x - c.w / 3, c.y + 5, c.w / 3, 10, 0, 0, Math.PI * 2); ctx.fill();
        }

        // Mountains (parallax)
        ctx.fillStyle = this.cyclePhase === 2 ? '#1a2a1a' : '#7a9a7a';
        ctx.beginPath(); ctx.moveTo(0, this.GROUND_Y);
        for (let x = 0; x <= this.W; x += 40) {
            ctx.lineTo(x, this.GROUND_Y - 30 - Math.sin(x * 0.01 + this.groundOffset * 0.01) * 20);
        }
        ctx.lineTo(this.W, this.GROUND_Y); ctx.closePath(); ctx.fill();

        // Ground
        ctx.fillStyle = this.cyclePhase === 2 ? '#2a3a2a' : '#8B7355';
        ctx.fillRect(0, this.GROUND_Y, this.W, this.H - this.GROUND_Y);
        ctx.fillStyle = this.cyclePhase === 2 ? '#1a2a1a' : '#6a8a3a';
        ctx.fillRect(0, this.GROUND_Y, this.W, 4);

        // Ground texture
        ctx.fillStyle = this.cyclePhase === 2 ? '#3a4a3a' : '#9a8a6a';
        for (let i = -1; i < this.W / 24 + 2; i++) {
            const sx = i * 24 - this.groundOffset;
            ctx.fillRect(sx, this.GROUND_Y + 10, 12, 2);
            ctx.fillRect(sx + 8, this.GROUND_Y + 24, 10, 2);
        }

        // World objects
        this.world.draw(ctx);

        // Player
        this.player.draw(ctx);

        // Weapon timer bar (on canvas)
        if (this.player.hasWeapon) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(this.W - 120, 10, 110, 8);
            ctx.fillStyle = this.player.rapidFire ? '#ff4444' : '#ffcc00';
            ctx.fillRect(this.W - 120, 10, 110 * (this.player.weaponTimer / 600), 8);
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
            ctx.strokeRect(this.W - 120, 10, 110, 8);
        }

        // Shield timer
        if (this.player.hasShield) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(this.W - 120, 22, 110, 6);
            ctx.fillStyle = '#4488ff';
            ctx.fillRect(this.W - 120, 22, 110 * (this.player.shieldTimer / 600), 6);
        }

        // Achievement popup
        if (this.currentAchievement) {
            const progress = this.achievementTimer > 100 ? (120 - this.achievementTimer) / 20 :
                             this.achievementTimer < 20 ? this.achievementTimer / 20 : 1;
            ctx.globalAlpha = progress;
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            const pw = 240, px = this.W / 2 - pw / 2, py = 10;
            ctx.beginPath(); ctx.roundRect(px, py, pw, 40, 8); ctx.fill();
            ctx.fillStyle = '#ffcc00'; ctx.font = 'bold 14px Orbitron, monospace';
            ctx.textAlign = 'center'; ctx.fillText('🏆 ' + this.currentAchievement.label, this.W / 2, py + 16);
            ctx.fillStyle = '#aaa'; ctx.font = '11px Rajdhani, sans-serif';
            ctx.fillText(this.currentAchievement.desc, this.W / 2, py + 32);
            ctx.globalAlpha = 1;
        }

        // Ready screen
        if (this.state === GameState.READY) {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(0, 0, this.W, this.H);
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
            ctx.font = 'bold 28px Orbitron, monospace';
            ctx.strokeText('DINO HUNTER', this.W / 2, this.H / 2 - 30);
            ctx.fillText('DINO HUNTER', this.W / 2, this.H / 2 - 30);
            const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
            ctx.globalAlpha = pulse;
            ctx.font = '16px Rajdhani, sans-serif';
            ctx.fillText('Tap or SPACE to Start', this.W / 2, this.H / 2 + 10);
            ctx.globalAlpha = 1;
            if (this.bestScore > 0) {
                ctx.fillStyle = '#ffcc00'; ctx.font = '13px Rajdhani, sans-serif';
                ctx.fillText(`Best: ${this.bestScore}`, this.W / 2, this.H / 2 + 40);
            }
        }

        // Pause overlay
        if (this.state === GameState.PAUSED) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(0, 0, this.W, this.H);
            ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
            ctx.font = 'bold 28px Orbitron, monospace';
            ctx.fillText('PAUSED', this.W / 2, this.H / 2 - 10);
            ctx.fillStyle = '#aaa'; ctx.font = '14px Rajdhani, sans-serif';
            ctx.fillText('Press P to resume', this.W / 2, this.H / 2 + 20);
        }

        // Game Over overlay
        if (this.state === GameState.GAME_OVER) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, this.W, this.H);
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ff4444'; ctx.font = 'bold 28px Orbitron, monospace';
            ctx.fillText('GAME OVER', this.W / 2, this.H / 2 - 60);
            ctx.fillStyle = '#fff'; ctx.font = '16px Rajdhani, sans-serif';
            ctx.fillText(`Score: ${this.world.score}  |  Best: ${this.bestScore}`, this.W / 2, this.H / 2 - 25);
            ctx.fillText(`Distance: ${Math.floor(this.world.distance)}m  |  Coins: ${this.world.coinsCollected}`, this.W / 2, this.H / 2 + 5);
            ctx.fillText(`Enemies Destroyed: ${this.world.enemiesKilled}`, this.W / 2, this.H / 2 + 30);
            ctx.fillStyle = '#ffcc00'; ctx.font = 'bold 14px Orbitron, monospace';
            ctx.fillText('Tap or SPACE to Restart', this.W / 2, this.H / 2 + 65);
        }
    }
}

window.addEventListener('load', () => { new DinoHunterGame(); });
