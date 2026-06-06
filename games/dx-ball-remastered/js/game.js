/**
 * DX-Ball Remastered - Main Game Controller
 */
const MAX_PARTICLES = 150;
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

const GameState = { READY: 'ready', PLAYING: 'playing', PAUSED: 'paused', LEVEL_COMPLETE: 'levelComplete', GAME_OVER: 'gameOver' };

const BRICK_COLORS = {
    1: { fill: '#4488ff', stroke: '#2266dd', name: 'Normal' },
    2: { fill: '#ff8844', stroke: '#dd6622', name: 'Strong' },
    3: { fill: '#888888', stroke: '#666666', name: 'Steel' },
    4: { fill: '#ff4444', stroke: '#dd2222', name: 'Explosive' },
    5: { fill: '#ffcc00', stroke: '#ddaa00', name: 'Bonus' },
};

const BRICK_COLORS_HIT2 = {
    2: { fill: '#cc6622', stroke: '#aa4400' },
};

const THEMES = {
    neon:   { bg1: '#0a0a2a', bg2: '#1a1a4a', grid: 'rgba(0,200,255,0.06)' },
    space:  { bg1: '#050510', bg2: '#0a0a25', grid: 'rgba(100,0,200,0.06)' },
    cyber:  { bg1: '#0a1a0a', bg2: '#1a2a1a', grid: 'rgba(0,255,100,0.06)' },
    retro:  { bg1: '#1a0a0a', bg2: '#2a1a1a', grid: 'rgba(255,100,0,0.06)' },
};

const ACHIEVEMENTS = [
    { id: 'firstBrick', label: 'First Brick!', desc: 'Destroyed your first brick' },
    { id: 'level1', label: 'Level 1 Clear!', desc: 'Cleared level 1' },
    { id: 'level10', label: '10 Levels!', desc: 'Cleared 10 levels' },
    { id: 'level20', label: '20 Levels!', desc: 'Cleared all 20 levels' },
    { id: 'bricks100', label: '100 Bricks!', desc: 'Destroyed 100 bricks' },
    { id: 'bricks1000', label: '1000 Bricks!', desc: 'Destroyed 1000 bricks' },
    { id: 'score10k', label: '10K Score!', desc: 'Reached 10,000 score' },
    { id: 'score50k', label: '50K Score!', desc: 'Reached 50,000 score' },
    { id: 'score100k', label: '100K Score!', desc: 'Reached 100,000 score' },
    { id: 'multiBall', label: 'Multi Ball!', desc: 'Used Multi Ball power-up' },
    { id: 'laser', label: 'Laser Expert!', desc: 'Used Laser power-up' },
];

class DXBallGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.W = 700;
        this.H = 520;
        this.canvas.width = this.W;
        this.canvas.height = this.H;
        this._resize();
        window.addEventListener('resize', () => this._resize());

        // Game state
        this.state = GameState.READY;
        this.level = 1;
        this.score = 0;
        this.lives = 3;
        this.combo = 0;
        this.comboTimer = 0;
        this.bestScore = Storage.getBestScore();
        this.bricksDestroyedThisRun = 0;

        // Paddle
        this.paddle = { x: this.W / 2 - 50, y: this.H - 40, w: 100, h: 14, speed: 8 };

        // Ball
        this.balls = [];

        // Bricks
        this.bricks = [];

        // Powerups
        this.powerups = [];
        this.activePowerups = { expand: 0, laser: 0, slow: 0, shield: 0 };
        this.hasShield = false;

        // Lasers
        this.lasers = [];
        this.laserCooldown = 0;

        // Particles
        this.particles = [];

        // Screen shake
        this.shakeX = 0; this.shakeY = 0; this.shakeTimer = 0;

        // Achievement popup
        this.achievementQueue = [];
        this.currentAchievement = null;
        this.achievementTimer = 0;

        // Score popup
        this.scorePopups = [];

        // Theme
        this.theme = THEMES.neon;

        // Frame rate
        this.lastTime = 0;
        this.frameInterval = 1000 / 60;

        // Input
        this.keys = {};
        this.mouseX = this.W / 2;
        this.touchActive = false;

        this._setupInput();
        this._loadLevel(this.level);
        window.addEventListener('beforeunload', () => { AudioManager.close(); });
        this._gameLoop(performance.now());
    }

    _resize() {
        const maxW = window.innerWidth;
        const maxH = window.innerHeight - 100;
        const scale = Math.min(maxW / this.W, maxH / this.H, 1);
        this.canvas.style.width = Math.floor(this.W * scale) + 'px';
        this.canvas.style.height = Math.floor(this.H * scale) + 'px';
    }

    _setupInput() {
        document.addEventListener('keydown', (e) => {
            AudioManager.resume();
            this.keys[e.key] = true;
            if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); this._handleAction(); }
            if (e.key === 'p' || e.key === 'P') this._togglePause();
            if (e.key === 'r' || e.key === 'R') this._restart();
        });
        document.addEventListener('keyup', (e) => { this.keys[e.key] = false; });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = (e.clientX - rect.left) / rect.width * this.W;
        });

        this.canvas.addEventListener('click', () => { AudioManager.resume(); this._handleAction(); });

        // Touch
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); AudioManager.resume(); this.touchActive = true;
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = (e.touches[0].clientX - rect.left) / rect.width * this.W;
            this._handleAction();
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = (e.touches[0].clientX - rect.left) / rect.width * this.W;
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => { e.preventDefault(); this.touchActive = false; }, { passive: false });

        // Buttons
        const newBtn = document.getElementById('btn-new-game');
        if (newBtn) newBtn.addEventListener('click', () => this._restart());
        const soundBtn = document.getElementById('sound-toggle');
        if (soundBtn) soundBtn.addEventListener('click', () => {
            const on = AudioManager.toggle(); soundBtn.textContent = on ? '🔊' : '🔇';
        });
    }

    _handleAction() {
        if (this.state === GameState.READY) {
            this.state = GameState.PLAYING;
            this._launchBall();
            Storage.addGamePlayed();
        } else if (this.state === GameState.GAME_OVER) {
            this._restart();
        } else if (this.state === GameState.LEVEL_COMPLETE) {
            this._nextLevel();
        }
    }

    _launchBall() {
        if (this.balls.length === 0) {
            this.balls.push({
                x: this.paddle.x + this.paddle.w / 2,
                y: this.paddle.y - 8,
                vx: 3 * (Math.random() > 0.5 ? 1 : -1),
                vy: -5,
                radius: 6,
                active: true
            });
        }
    }

    _togglePause() {
        if (this.state === GameState.PLAYING) this.state = GameState.PAUSED;
        else if (this.state === GameState.PAUSED) this.state = GameState.PLAYING;
    }

    _restart() {
        this.level = 1; this.score = 0; this.lives = 3; this.combo = 0;
        this.bricksDestroyedThisRun = 0;
        this.powerups = []; this.lasers = []; this.particles = [];
        this.activePowerups = { expand: 0, laser: 0, slow: 0, shield: 0 };
        this.hasShield = false;
        this.achievementQueue = []; this.currentAchievement = null;
        this.scorePopups = [];
        this.paddle.w = 100;
        this._loadLevel(1);
        this.state = GameState.READY;
    }

    _loadLevel(lvl) {
        const def = LevelDefs[Math.min(lvl - 1, LevelDefs.length - 1)];
        this.theme = THEMES[def.theme] || THEMES.neon;
        this.bricks = [];
        this.balls = [];
        this.powerups = [];
        this.lasers = [];
        this.particles = [];
        this.activePowerups = { expand: 0, laser: 0, slow: 0, shield: 0 };
        this.hasShield = false;
        this.combo = 0;

        const startX = (this.W - BRICK_COLS * (BRICK_W + BRICK_GAP)) / 2;
        for (let r = 0; r < def.bricks.length; r++) {
            for (let c = 0; c < def.bricks[r].length; c++) {
                const type = def.bricks[r][c];
                if (type === 0) continue;
                this.bricks.push({
                    x: startX + c * (BRICK_W + BRICK_GAP),
                    y: 50 + r * (BRICK_H + BRICK_GAP),
                    w: BRICK_W, h: BRICK_H,
                    type: type,
                    health: type === 2 ? 2 : type === 3 ? 999 : 1,
                    active: true,
                    flash: 0
                });
            }
        }

        this.paddle.x = this.W / 2 - this.paddle.w / 2;
        this.state = GameState.READY;
    }

    _nextLevel() {
        this.level++;
        if (this.level > LevelDefs.length) {
            this.level = LevelDefs.length; // Stay on last level (endless)
        }
        this._loadLevel(this.level);
        Storage.setHighestLevel(this.level);
    }

    destroy() {
        if (this._rafId) cancelAnimationFrame(this._rafId);
        AudioManager.close();
    }

    _gameLoop(now) {
        this._rafId = requestAnimationFrame((t) => this._gameLoop(t));
        const elapsed = now - this.lastTime;
        if (elapsed < this.frameInterval) return;
        this.lastTime = now - (elapsed % this.frameInterval);
        this._update();
        this._render();
    }

    _update() {
        if (this.state !== GameState.PLAYING) return;

        // Paddle movement
        if (this.touchActive || (!this.keys['ArrowLeft'] && !this.keys['a'] && !this.keys['ArrowRight'] && !this.keys['d'])) {
            // Mouse/touch follow
            const target = this.mouseX - this.paddle.w / 2;
            this.paddle.x += (target - this.paddle.x) * 0.3;
        }
        if (this.keys['ArrowLeft'] || this.keys['a']) this.paddle.x -= this.paddle.speed;
        if (this.keys['ArrowRight'] || this.keys['d']) this.paddle.x += this.paddle.speed;
        this.paddle.x = Math.max(0, Math.min(this.W - this.paddle.w, this.paddle.x));

        // Powerup timers
        for (const key of Object.keys(this.activePowerups)) {
            if (this.activePowerups[key] > 0) {
                this.activePowerups[key]--;
                if (this.activePowerups[key] <= 0) {
                    if (key === 'expand') this.paddle.w = 100;
                    if (key === 'shield') this.hasShield = false;
                }
            }
        }

        // Laser auto-fire
        if (this.activePowerups.laser > 0) {
            this.laserCooldown--;
            if (this.laserCooldown <= 0) {
                this.lasers.push({ x: this.paddle.x + 6, y: this.paddle.y, active: true });
                this.lasers.push({ x: this.paddle.x + this.paddle.w - 6, y: this.paddle.y, active: true });
                this.laserCooldown = 10;
                AudioManager.play('laser');
            }
        }

        // Update lasers
        for (const l of this.lasers) {
            l.y -= 8;
            if (l.y < 0) l.active = false;
            // Laser vs bricks
            for (const b of this.bricks) {
                if (!b.active || b.type === 3) continue;
                if (l.x > b.x && l.x < b.x + b.w && l.y > b.y && l.y < b.y + b.h) {
                    l.active = false;
                    this._hitBrick(b);
                    break;
                }
            }
        }
        this.lasers = this.lasers.filter(l => l.active);

        // Combo timer
        if (this.comboTimer > 0) { this.comboTimer--; if (this.comboTimer <= 0) this.combo = 0; }

        // Update balls
        const spd = this.activePowerups.slow > 0 ? 0.6 : 1;
        for (const ball of this.balls) {
            if (!ball.active) continue;

            ball.x += ball.vx * spd;
            ball.y += ball.vy * spd;

            // Wall bounce
            if (ball.x - ball.radius < 0) { ball.x = ball.radius; ball.vx = Math.abs(ball.vx); }
            if (ball.x + ball.radius > this.W) { ball.x = this.W - ball.radius; ball.vx = -Math.abs(ball.vx); }
            if (ball.y - ball.radius < 0) { ball.y = ball.radius; ball.vy = Math.abs(ball.vy); }

            // Paddle bounce
            if (ball.vy > 0 &&
                ball.y + ball.radius >= this.paddle.y &&
                ball.y + ball.radius <= this.paddle.y + this.paddle.h + 4 &&
                ball.x >= this.paddle.x - 4 &&
                ball.x <= this.paddle.x + this.paddle.w + 4) {
                const hitPos = (ball.x - this.paddle.x) / this.paddle.w;
                const angle = (hitPos - 0.5) * Math.PI * 0.7;
                const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
                ball.vx = Math.sin(angle) * speed;
                ball.vy = -Math.abs(Math.cos(angle) * speed);
                ball.y = this.paddle.y - ball.radius;
                this.combo = 0;
                AudioManager.play('paddleHit');
            }

            // Ball vs bricks
            for (const b of this.bricks) {
                if (!b.active) continue;
                if (this._ballBrickCollision(ball, b)) {
                    this._hitBrick(b);
                    break;
                }
            }

            // Ball falls below screen
            if (ball.y - ball.radius > this.H) {
                ball.active = false;
            }
        }

        // Remove dead balls
        this.balls = this.balls.filter(b => b.active);

        // If no balls left
        if (this.balls.length === 0) {
            if (this.hasShield) {
                // Shield bounce
                this.hasShield = false;
                this.activePowerups.shield = 0;
                this.balls.push({
                    x: this.paddle.x + this.paddle.w / 2,
                    y: this.paddle.y - 8,
                    vx: 3 * (Math.random() > 0.5 ? 1 : -1),
                    vy: -5,
                    radius: 6, active: true
                });
            } else {
                this.lives--;
                if (this.lives <= 0) {
                    this.state = GameState.GAME_OVER;
                    Storage.setBestScore(this.score);
                    Storage.addBricksDestroyed(this.bricksDestroyedThisRun);
                    AudioManager.play('gameover');
                } else {
                    this.balls = [];
                    this._launchBall();
                }
            }
        }

        // Update powerups
        for (const p of this.powerups) {
            p.y += 2;
            if (p.y > this.H) p.active = false;
            // Collect
            if (p.y + 16 >= this.paddle.y && p.y <= this.paddle.y + this.paddle.h &&
                p.x + 12 >= this.paddle.x && p.x - 12 <= this.paddle.x + this.paddle.w) {
                p.active = false;
                this._applyPowerup(p.type);
                AudioManager.play('powerup');
            }
        }
        // Powerups - write-index filter
        let pwWrite = 0;
        for (let i = 0; i < this.powerups.length; i++) {
            if (this.powerups[i].active) this.powerups[pwWrite++] = this.powerups[i];
        }
        this.powerups.length = pwWrite;

        // Update particles - write-index filter
        let partWrite = 0;
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life--;
            if (p.life > 0) this.particles[partWrite++] = p;
        }
        this.particles.length = partWrite;

        // Score popups - write-index filter
        let popWrite = 0;
        for (let i = 0; i < this.scorePopups.length; i++) {
            const s = this.scorePopups[i];
            s.y -= 1; s.timer--;
            if (s.timer > 0) this.scorePopups[popWrite++] = s;
        }
        this.scorePopups.length = popWrite;

        // Shake
        if (this.shakeTimer > 0) {
            this.shakeTimer--;
            this.shakeX = (Math.random() - 0.5) * 6;
            this.shakeY = (Math.random() - 0.5) * 6;
            if (this.shakeTimer <= 0) { this.shakeX = 0; this.shakeY = 0; }
        }

        // Achievement check
        this._checkAchievements();
        if (this.currentAchievement) {
            this.achievementTimer--;
            if (this.achievementTimer <= 0) this.currentAchievement = null;
        } else if (this.achievementQueue.length > 0) {
            const id = this.achievementQueue.shift();
            const ach = ACHIEVEMENTS.find(a => a.id === id);
            if (ach) { this.currentAchievement = ach; this.achievementTimer = 120; AudioManager.play('levelComplete'); }
        }

        // Check level complete
        let destructibleCount = 0;
        for (let i = 0; i < this.bricks.length; i++) {
            if (this.bricks[i].active && this.bricks[i].type !== 3) destructibleCount++;
        }
        if (destructibleCount === 0) {
            this.state = GameState.LEVEL_COMPLETE;
            Storage.setHighestLevel(this.level);
            AudioManager.play('levelComplete');
            this.shakeTimer = 10;
        }

        // Update HUD
        this._updateHUD();
    }

    _ballBrickCollision(ball, brick) {
        const cx = Math.max(brick.x, Math.min(ball.x, brick.x + brick.w));
        const cy = Math.max(brick.y, Math.min(ball.y, brick.y + brick.h));
        const dx = ball.x - cx;
        const dy = ball.y - cy;
        if (dx * dx + dy * dy > ball.radius * ball.radius) return false;

        // Determine bounce direction
        const overlapX = ball.radius - Math.abs(ball.x - (brick.x + brick.w / 2)) + brick.w / 2;
        const overlapY = ball.radius - Math.abs(ball.y - (brick.y + brick.h / 2)) + brick.h / 2;

        if (overlapX < overlapY) {
            ball.vx = -ball.vx;
        } else {
            ball.vy = -ball.vy;
        }
        return true;
    }

    _hitBrick(brick) {
        brick.flash = 6;
        if (brick.type === 3) { AudioManager.play('paddleHit'); return; } // Steel

        brick.health--;
        if (brick.health <= 0) {
            brick.active = false;
            this.bricksDestroyedThisRun++;
            this.combo++;
            this.comboTimer = 90;

            const points = (brick.type === 2 ? 20 : brick.type === 4 ? 30 : brick.type === 5 ? 50 : 10) * Math.max(1, this.combo);
            this.score += points;

            // Particles
            const color = BRICK_COLORS[brick.type]?.fill || '#fff';
            for (let i = 0; i < 8 && this.particles.length < MAX_PARTICLES; i++) {
                this.particles.push({
                    x: brick.x + brick.w / 2, y: brick.y + brick.h / 2,
                    vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4 - 2,
                    color: color, life: 20 + Math.random() * 10, active: true
                });
            }

            // Score popup
            this.scorePopups.push({
                x: brick.x + brick.w / 2, y: brick.y,
                text: this.combo > 1 ? `+${points} x${this.combo}` : `+${points}`,
                timer: 30, active: true
            });

            // Explosive
            if (brick.type === 4) {
                this._explodeBricks(brick);
                AudioManager.play('explosion');
                this.shakeTimer = 8;
            } else {
                AudioManager.play(brick.type === 2 ? 'strongBreak' : 'brickBreak');
            }

            // Drop powerup
            if (brick.type === 5 || Math.random() < 0.12) {
                this._spawnPowerup(brick.x + brick.w / 2, brick.y + brick.h);
            }
        } else {
            AudioManager.play('paddleHit');
        }
    }

    _explodeBricks(brick) {
        const cx = brick.x + brick.w / 2;
        const cy = brick.y + brick.h / 2;
        const range = 60;
        for (const b of this.bricks) {
            if (!b.active || b === brick || b.type === 3) continue;
            const dx = (b.x + b.w / 2) - cx;
            const dy = (b.y + b.h / 2) - cy;
            if (Math.sqrt(dx * dx + dy * dy) < range) {
                b.health = 0;
                this._hitBrick(b);
            }
        }
    }

    _spawnPowerup(x, y) {
        const types = ['expand', 'laser', 'multiBall', 'slow', 'shield', 'extraLife'];
        const type = types[Math.floor(Math.random() * types.length)];
        this.powerups.push({ x, y, type, active: true });
    }

    _applyPowerup(type) {
        switch (type) {
            case 'expand':
                this.paddle.w = 150;
                this.activePowerups.expand = 900;
                break;
            case 'laser':
                this.activePowerups.laser = 900;
                this.laserCooldown = 0;
                this._checkAch('laser');
                break;
            case 'multiBall':
                const existing = this.balls.filter(b => b.active);
                for (const ball of existing) {
                    for (let i = 0; i < 2; i++) {
                        this.balls.push({
                            x: ball.x, y: ball.y,
                            vx: ball.vx + (Math.random() - 0.5) * 3,
                            vy: ball.vy,
                            radius: 6, active: true
                        });
                    }
                }
                this._checkAch('multiBall');
                break;
            case 'slow':
                this.activePowerups.slow = 900;
                break;
            case 'shield':
                this.hasShield = true;
                this.activePowerups.shield = 1200;
                break;
            case 'extraLife':
                this.lives++;
                break;
        }
    }

    _checkAchievements() {
        if (this.bricksDestroyedThisRun >= 1 && !Storage.hasAchievement('firstBrick')) this._checkAch('firstBrick');
        if (this.level >= 1 && this.state === GameState.LEVEL_COMPLETE && !Storage.hasAchievement('level1')) this._checkAch('level1');
        if (this.level >= 10 && !Storage.hasAchievement('level10')) this._checkAch('level10');
        if (this.level >= 20 && !Storage.hasAchievement('level20')) this._checkAch('level20');
        if (Storage.getBricksDestroyed() + this.bricksDestroyedThisRun >= 100 && !Storage.hasAchievement('bricks100')) this._checkAch('bricks100');
        if (Storage.getBricksDestroyed() + this.bricksDestroyedThisRun >= 1000 && !Storage.hasAchievement('bricks1000')) this._checkAch('bricks1000');
        if (this.score >= 10000 && !Storage.hasAchievement('score10k')) this._checkAch('score10k');
        if (this.score >= 50000 && !Storage.hasAchievement('score50k')) this._checkAch('score50k');
        if (this.score >= 100000 && !Storage.hasAchievement('score100k')) this._checkAch('score100k');
    }

    _checkAch(id) {
        if (!Storage.hasAchievement(id)) {
            Storage.unlockAchievement(id);
            if (!this.achievementQueue.includes(id)) this.achievementQueue.push(id);
        }
    }

    _updateHUD() {
        const el = (id) => document.getElementById(id);
        if (el('hud-score')) el('hud-score').textContent = this.score;
        if (el('hud-level')) el('hud-level').textContent = this.level;
        if (el('hud-lives')) el('hud-lives').textContent = '❤️'.repeat(Math.max(0, this.lives));
        if (el('hud-best')) el('hud-best').textContent = this.bestScore;
    }

    _render() {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(this.shakeX, this.shakeY);

        // Background
        const grad = ctx.createLinearGradient(0, 0, 0, this.H);
        grad.addColorStop(0, this.theme.bg1);
        grad.addColorStop(1, this.theme.bg2);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.W, this.H);

        // Grid
        ctx.strokeStyle = this.theme.grid;
        ctx.lineWidth = 1;
        for (let x = 0; x < this.W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.H); ctx.stroke(); }
        for (let y = 0; y < this.H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.W, y); ctx.stroke(); }

        // Shield floor
        if (this.hasShield) {
            ctx.fillStyle = 'rgba(100,200,255,0.3)';
            ctx.fillRect(0, this.H - 4, this.W, 4);
        }

        // Bricks
        for (const b of this.bricks) {
            if (!b.active) continue;
            const colors = b.health === 1 ? BRICK_COLORS[b.type] : (BRICK_COLORS_HIT2[b.type] || BRICK_COLORS[b.type]);

            if (b.flash > 0) {
                ctx.fillStyle = '#fff';
                b.flash--;
            } else {
                ctx.fillStyle = colors.fill;
            }
            ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 4); ctx.fill();

            ctx.strokeStyle = colors.stroke; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 4); ctx.stroke();

            // Highlight
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.fillRect(b.x + 2, b.y + 2, b.w - 4, b.h / 2 - 2);

            // Steel pattern
            if (b.type === 3) {
                ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + b.w, b.y + b.h);
                ctx.moveTo(b.x + b.w, b.y); ctx.lineTo(b.x, b.y + b.h);
                ctx.stroke();
            }

            // Explosive icon
            if (b.type === 4) {
                ctx.fillStyle = '#ff0'; ctx.font = 'bold 12px monospace';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('💥', b.x + b.w / 2, b.y + b.h / 2);
            }

            // Bonus icon
            if (b.type === 5) {
                ctx.fillStyle = '#000'; ctx.font = 'bold 12px monospace';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('★', b.x + b.w / 2, b.y + b.h / 2);
            }
        }

        // Powerups
        const powerupIcons = { expand: '⬜', laser: '🔫', multiBall: '🔵', slow: '⏱', shield: '🛡', extraLife: '❤️' };
        const powerupColors = { expand: '#4488ff', laser: '#ff4444', multiBall: '#44ff88', slow: '#aa44ff', shield: '#44ddff', extraLife: '#ff4488' };
        for (const p of this.powerups) {
            ctx.fillStyle = powerupColors[p.type] || '#fff';
            ctx.beginPath(); ctx.roundRect(p.x - 14, p.y - 8, 28, 16, 6); ctx.fill();
            ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.fillText(powerupIcons[p.type] || '?', p.x, p.y);
        }

        // Lasers
        ctx.fillStyle = '#ff4400';
        for (const l of this.lasers) {
            ctx.fillRect(l.x - 1, l.y, 3, 10);
        }

        // Balls
        for (const ball of this.balls) {
            if (!ball.active) continue;
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath(); ctx.arc(ball.x - 2, ball.y - 2, ball.radius * 0.4, 0, Math.PI * 2); ctx.fill();
        }

        // Paddle
        ctx.fillStyle = '#4488ff';
        ctx.beginPath(); ctx.roundRect(this.paddle.x, this.paddle.y, this.paddle.w, this.paddle.h, 7); ctx.fill();
        ctx.fillStyle = '#66aaff';
        ctx.fillRect(this.paddle.x + 4, this.paddle.y + 2, this.paddle.w - 8, 4);
        if (this.activePowerups.laser > 0) {
            ctx.fillStyle = '#ff4400';
            ctx.fillRect(this.paddle.x + 2, this.paddle.y - 4, 4, 6);
            ctx.fillRect(this.paddle.x + this.paddle.w - 6, this.paddle.y - 4, 4, 6);
        }

        // Particles
        for (const p of this.particles) {
            ctx.globalAlpha = p.life / 30;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, 3, 3);
        }
        ctx.globalAlpha = 1;

        // Score popups
        for (const s of this.scorePopups) {
            ctx.globalAlpha = s.timer / 30;
            ctx.fillStyle = '#ffcc00'; ctx.font = 'bold 14px Orbitron, monospace';
            ctx.textAlign = 'center'; ctx.fillText(s.text, s.x, s.y);
        }
        ctx.globalAlpha = 1;

        // Combo display
        if (this.combo > 1) {
            ctx.fillStyle = '#ff8844'; ctx.font = `bold ${18 + this.combo}px Orbitron, monospace`;
            ctx.textAlign = 'center';
            ctx.fillText(`x${this.combo} COMBO`, this.W / 2, 35);
        }

        // Achievement popup
        if (this.currentAchievement) {
            const progress = this.achievementTimer > 100 ? (120 - this.achievementTimer) / 20 :
                             this.achievementTimer < 20 ? this.achievementTimer / 20 : 1;
            ctx.globalAlpha = progress;
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            const pw = 240, px = this.W / 2 - pw / 2, py = this.H / 2 - 25;
            ctx.beginPath(); ctx.roundRect(px, py, pw, 50, 10); ctx.fill();
            ctx.strokeStyle = '#ffcc00'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.roundRect(px, py, pw, 50, 10); ctx.stroke();
            ctx.fillStyle = '#ffcc00'; ctx.font = 'bold 16px Orbitron, monospace';
            ctx.textAlign = 'center'; ctx.fillText('🏆 ' + this.currentAchievement.label, this.W / 2, py + 20);
            ctx.fillStyle = '#aaa'; ctx.font = '12px Rajdhani, sans-serif';
            ctx.fillText(this.currentAchievement.desc, this.W / 2, py + 38);
            ctx.globalAlpha = 1;
        }

        // Overlays
        if (this.state === GameState.READY) {
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.fillRect(0, 0, this.W, this.H);
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
            ctx.font = 'bold 28px Orbitron, monospace';
            ctx.strokeText('DX-BALL', this.W / 2, this.H / 2 - 40);
            ctx.fillText('DX-BALL', this.W / 2, this.H / 2 - 40);
            ctx.font = 'bold 16px Orbitron, monospace';
            ctx.strokeText('REMASTERED', this.W / 2, this.H / 2 - 15);
            ctx.fillText('REMASTERED', this.W / 2, this.H / 2 - 15);
            ctx.font = '14px Rajdhani, sans-serif';
            ctx.fillStyle = '#aaa';
            ctx.fillText(`Level ${this.level}: ${LevelDefs[Math.min(this.level - 1, LevelDefs.length - 1)].name}`, this.W / 2, this.H / 2 + 15);
            const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
            ctx.globalAlpha = pulse;
            ctx.fillStyle = '#fff';
            ctx.fillText('Click or Tap to Start', this.W / 2, this.H / 2 + 45);
            ctx.globalAlpha = 1;
        }

        if (this.state === GameState.PAUSED) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, this.W, this.H);
            ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
            ctx.font = 'bold 28px Orbitron, monospace';
            ctx.fillText('PAUSED', this.W / 2, this.H / 2 - 10);
            ctx.fillStyle = '#aaa'; ctx.font = '14px Rajdhani, sans-serif';
            ctx.fillText('Press P to resume', this.W / 2, this.H / 2 + 20);
        }

        if (this.state === GameState.LEVEL_COMPLETE) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, this.W, this.H);
            ctx.textAlign = 'center';
            ctx.fillStyle = '#44ff88'; ctx.font = 'bold 28px Orbitron, monospace';
            ctx.fillText('LEVEL COMPLETE!', this.W / 2, this.H / 2 - 30);
            ctx.fillStyle = '#ffcc00'; ctx.font = 'bold 18px Orbitron, monospace';
            ctx.fillText(`Score: ${this.score}`, this.W / 2, this.H / 2 + 5);
            ctx.fillStyle = '#aaa'; ctx.font = '14px Rajdhani, sans-serif';
            ctx.fillText('Click to continue', this.W / 2, this.H / 2 + 35);
        }

        if (this.state === GameState.GAME_OVER) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0, 0, this.W, this.H);
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ff4444'; ctx.font = 'bold 28px Orbitron, monospace';
            ctx.fillText('GAME OVER', this.W / 2, this.H / 2 - 50);
            ctx.fillStyle = '#fff'; ctx.font = '16px Rajdhani, sans-serif';
            ctx.fillText(`Score: ${this.score}  |  Best: ${this.bestScore}`, this.W / 2, this.H / 2 - 15);
            ctx.fillText(`Level: ${this.level}  |  Bricks: ${this.bricksDestroyedThisRun}`, this.W / 2, this.H / 2 + 10);
            ctx.fillStyle = '#ffcc00'; ctx.font = 'bold 14px Orbitron, monospace';
            ctx.fillText('Click to Restart', this.W / 2, this.H / 2 + 50);
        }

        ctx.restore();
    }
}

window.addEventListener('load', () => { new DXBallGame(); });
