/**
 * Cyber Survivor - Main Game Controller
 * Object pooling, auto-combat, XP system, level up, boss
 */
const GS = { MENU:'menu', PLAYING:'playing', LEVELUP:'levelup', PAUSED:'paused', GAMEOVER:'gameover' };

class CyberSurvivor {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = W; this.canvas.height = H;
        this.state = GS.MENU;
        this.lastTime = 0;

        // Object pools
        this.enemyPool = [];
        this.projPool = [];
        this.xpPool = [];
        this.particlePool = [];
        this.activeEnemies = [];
        this.activeProjs = [];
        this.activeXp = [];
        this.activeParticles = [];

        // Camera (follows player)
        this.camX = 0; this.camY = 0;

        // Joystick
        this.joystick = { active:false, startX:0, startY:0, dx:0, dy:0 };

        this._setupInput();
        this._gameLoop(performance.now());
    }

    _initGame() {
        this.player = {
            x: 0, y: 0, hp: PLAYER_BASE.hp, maxHp: PLAYER_BASE.hp,
            speed: PLAYER_BASE.speed, damage: PLAYER_BASE.damage,
            atkSpeed: PLAYER_BASE.atkSpeed, atkCooldown: 0,
            critChance: PLAYER_BASE.critChance, projCount: PLAYER_BASE.projCount,
            projSpeed: PLAYER_BASE.projSpeed, atkRange: PLAYER_BASE.atkRange,
            level: 1, xp: 0, xpNext: xpForLevel(1),
            kills: 0, time: 0, invTimer: 0
        };
        this.activeEnemies = []; this.activeProjs = []; this.activeXp = []; this.activeParticles = [];
        this.spawnTimer = 0;
        this.bossSpawned = false;
        this.boss = null;
        this.upgradeChoices = [];
        this.keys = {};
        this.state = GS.PLAYING;
    }

    _setupInput() {
        this.canvas.addEventListener('click', (e) => {
            AudioManager.init(); AudioManager.resume();
            const r = this.canvas.getBoundingClientRect();
            const x = (e.clientX - r.left) * (W / r.width);
            const y = (e.clientY - r.top) * (H / r.height);
            this._handleClick(x, y);
        });
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); AudioManager.init(); AudioManager.resume();
            const t = e.touches[0], r = this.canvas.getBoundingClientRect();
            const x = (t.clientX - r.left) * (W / r.width);
            const y = (t.clientY - r.top) * (H / r.height);
            // Joystick (left half)
            if (x < W / 2) {
                this.joystick.active = true;
                this.joystick.startX = x; this.joystick.startY = y;
                this.joystick.dx = 0; this.joystick.dy = 0;
            }
            this._handleClick(x, y);
        }, { passive: false });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.joystick.active) {
                const t = e.touches[0], r = this.canvas.getBoundingClientRect();
                const x = (t.clientX - r.left) * (W / r.width);
                const y = (t.clientY - r.top) * (H / r.height);
                this.joystick.dx = x - this.joystick.startX;
                this.joystick.dy = y - this.joystick.startY;
            }
        }, { passive: false });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.joystick.active = false;
            this.joystick.dx = 0; this.joystick.dy = 0;
        }, { passive: false });
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key === 'Escape') {
                if (this.state === GS.PLAYING) this.state = GS.PAUSED;
                else if (this.state === GS.PAUSED) this.state = GS.PLAYING;
            }
        });
        document.addEventListener('keyup', (e) => { this.keys[e.key.toLowerCase()] = false; });
    }

    _handleClick(x, y) {
        if (this.state === GS.MENU) {
            if (x >= W/2-80 && x <= W/2+80 && y >= 280 && y <= 320) {
                this._initGame();
            }
            return;
        }
        if (this.state === GS.GAMEOVER) {
            if (x >= W/2-80 && x <= W/2+80 && y >= 380 && y <= 420) {
                this.state = GS.MENU;
            }
            return;
        }
        if (this.state === GS.LEVELUP) {
            for (let i = 0; i < this.upgradeChoices.length; i++) {
                const bx = W/2 - 120, by = 180 + i * 80;
                if (x >= bx && x <= bx + 240 && y >= by && y <= by + 65) {
                    this.upgradeChoices[i].apply(this.player);
                    this.player.atkCooldown = 1 / this.player.atkSpeed;
                    this.state = GS.PLAYING;
                    AudioManager.play('levelUp');
                    return;
                }
            }
            return;
        }
        if (this.state === GS.PAUSED) {
            this.state = GS.PLAYING;
        }
    }

    // ─── Pool helpers ───
    _getEnemy() {
        const e = this.enemyPool.pop() || {};
        this.activeEnemies.push(e);
        return e;
    }
    _releaseEnemy(e) {
        const i = this.activeEnemies.indexOf(e);
        if (i >= 0) { this.activeEnemies.splice(i, 1); this.enemyPool.push(e); }
    }
    _getProj() {
        const p = this.projPool.pop() || {};
        this.activeProjs.push(p);
        return p;
    }
    _releaseProj(p) {
        const i = this.activeProjs.indexOf(p);
        if (i >= 0) { this.activeProjs.splice(i, 1); this.projPool.push(p); }
    }
    _getXpOrb() {
        const o = this.xpPool.pop() || {};
        this.activeXp.push(o);
        return o;
    }
    _releaseXp(o) {
        const i = this.activeXp.indexOf(o);
        if (i >= 0) { this.activeXp.splice(i, 1); this.xpPool.push(o); }
    }
    _getParticle() {
        const p = this.particlePool.pop() || {};
        this.activeParticles.push(p);
        return p;
    }
    _releaseParticle(p) {
        const i = this.activeParticles.indexOf(p);
        if (i >= 0) { this.activeParticles.splice(i, 1); this.particlePool.push(p); }
    }

    // ─── Game Loop ───
    _gameLoop(now) {
        requestAnimationFrame((t) => this._gameLoop(t));
        const elapsed = now - this.lastTime;
        if (elapsed < 16) return;
        this.lastTime = now - (elapsed % 16);
        const dt = Math.min(elapsed / 1000, 0.05);
        try { this._update(dt); this._render(); } catch(e) {}
    }

    _update(dt) {
        if (this.state !== GS.PLAYING) return;
        const p = this.player;
        p.time += dt;

        // Player movement
        let dx = 0, dy = 0;
        if (this.keys['w'] || this.keys['arrowup']) dy -= 1;
        if (this.keys['s'] || this.keys['arrowdown']) dy += 1;
        if (this.keys['a'] || this.keys['arrowleft']) dx -= 1;
        if (this.keys['d'] || this.keys['arrowright']) dx += 1;
        // Joystick
        if (this.joystick.active) {
            const jLen = Math.sqrt(this.joystick.dx ** 2 + this.joystick.dy ** 2);
            if (jLen > 10) {
                dx += this.joystick.dx / jLen;
                dy += this.joystick.dy / jLen;
            }
        }
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        p.x += (dx / len) * p.speed * dt * (dx !== 0 || dy !== 0 ? 1 : 0);
        p.y += (dy / len) * p.speed * dt * (dx !== 0 || dy !== 0 ? 1 : 0);

        // Invincibility timer
        if (p.invTimer > 0) p.invTimer -= dt;

        // Auto-attack
        p.atkCooldown -= dt;
        if (p.atkCooldown <= 0 && this.activeEnemies.length > 0) {
            p.atkCooldown = 1 / p.atkSpeed;
            // Find nearest enemies
            const sorted = [...this.activeEnemies].sort((a, b) => {
                const da = (a.x - p.x) ** 2 + (a.y - p.y) ** 2;
                const db = (b.x - p.x) ** 2 + (b.y - p.y) ** 2;
                return da - db;
            });
            const targets = sorted.slice(0, p.projCount);
            for (const t of targets) {
                const dx = t.x - p.x, dy = t.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const proj = this._getProj();
                Object.assign(proj, {
                    x: p.x, y: p.y,
                    vx: (dx / dist) * p.projSpeed,
                    vy: (dy / dist) * p.projSpeed,
                    damage: p.damage, crit: Math.random() < p.critChance,
                    life: 1.5
                });
                AudioManager.play('shoot');
            }
        }

        // Spawn enemies
        const cfg = getSpawnConfig(p.time);
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawnTimer = cfg.interval;
            const type = cfg.types[Math.floor(Math.random() * cfg.types.length)];
            const angle = Math.random() * Math.PI * 2;
            const dist = 400 + Math.random() * 100;
            const def = ENEMY_TYPES[type];
            const e = this._getEnemy();
            Object.assign(e, {
                x: p.x + Math.cos(angle) * dist,
                y: p.y + Math.sin(angle) * dist,
                hp: def.hp, maxHp: def.hp, speed: def.speed,
                dmg: def.dmg, xp: def.xp, size: def.size,
                type, color: def.color, hitFlash: 0
            });
        }

        // Boss spawn at 5 minutes
        if (!this.bossSpawned && p.time >= 300) {
            this.bossSpawned = true;
            const def = ENEMY_TYPES.boss;
            const angle = Math.random() * Math.PI * 2;
            const e = this._getEnemy();
            Object.assign(e, {
                x: p.x + Math.cos(angle) * 500,
                y: p.y + Math.sin(angle) * 500,
                hp: def.hp, maxHp: def.hp, speed: def.speed,
                dmg: def.dmg, xp: def.xp, size: def.size,
                type: 'boss', color: def.color, hitFlash: 0, isBoss: true
            });
            AudioManager.play('bossSpawn');
        }

        // Update enemies
        for (let i = this.activeEnemies.length - 1; i >= 0; i--) {
            const e = this.activeEnemies[i];
            if (e.hitFlash > 0) e.hitFlash -= dt * 5;
            // Chase player
            const dx = p.x - e.x, dy = p.y - e.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            e.x += (dx / dist) * e.speed * dt;
            e.y += (dy / dist) * e.speed * dt;
            // Damage player on contact
            if (dist < e.size + 14 && p.invTimer <= 0) {
                p.hp -= e.dmg;
                p.invTimer = 0.5;
                AudioManager.play('playerHit');
                if (p.hp <= 0) {
                    this.state = GS.GAMEOVER;
                    SaveManager.updateBest(Math.floor(p.time), p.kills, p.level);
                    AudioManager.play('gameOver');
                    return;
                }
            }
        }

        // Update projectiles
        for (let i = this.activeProjs.length - 1; i >= 0; i--) {
            const proj = this.activeProjs[i];
            proj.x += proj.vx * dt;
            proj.y += proj.vy * dt;
            proj.life -= dt;
            // Check hit enemies
            let hit = false;
            for (const e of this.activeEnemies) {
                const dx = e.x - proj.x, dy = e.y - proj.y;
                if (dx * dx + dy * dy < (e.size + 6) ** 2) {
                    const dmg = proj.crit ? proj.damage * 2 : proj.damage;
                    e.hp -= dmg;
                    e.hitFlash = 1;
                    if (proj.crit) AudioManager.play('crit'); else AudioManager.play('hit');
                    // Spawn damage number
                    const pn = this._getParticle();
                    Object.assign(pn, {
                        x: e.x, y: e.y - e.size - 5, vx: 0, vy: -40,
                        life: 0.6, maxLife: 0.6, type: 'text',
                        text: proj.crit ? '💥' + Math.floor(dmg) : '-' + Math.floor(dmg),
                        color: proj.crit ? '#FFD700' : '#FFF'
                    });
                    if (e.hp <= 0) this._killEnemy(e);
                    hit = true; break;
                }
            }
            if (hit || proj.life <= 0) this._releaseProj(proj);
        }

        // Update XP orbs (magnet toward player)
        for (let i = this.activeXp.length - 1; i >= 0; i--) {
            const o = this.activeXp[i];
            o.life -= dt;
            const dx = p.x - o.x, dy = p.y - o.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) {
                const pull = 300 * (1 - dist / 100);
                o.x += (dx / dist) * pull * dt;
                o.y += (dy / dist) * pull * dt;
            }
            if (dist < 20) {
                p.xp += o.value;
                AudioManager.play('xpCollect');
                this._releaseXp(o);
                // Check level up
                while (p.xp >= p.xpNext) {
                    p.xp -= p.xpNext;
                    p.level++;
                    p.xpNext = xpForLevel(p.level);
                    this._showLevelUp();
                }
            } else if (o.life <= 0) {
                this._releaseXp(o);
            }
        }

        // Update particles
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const pt = this.activeParticles[i];
            pt.x += pt.vx * dt; pt.y += pt.vy * dt;
            pt.life -= dt;
            if (pt.life <= 0) this._releaseParticle(pt);
        }

        // Camera follow
        this.camX += (p.x - W / 2 - this.camX) * 0.1;
        this.camY += (p.y - H / 2 - this.camY) * 0.1;
    }

    _killEnemy(e) {
        // Drop XP orbs
        const count = Math.min(5, Math.ceil(e.xp / 20));
        for (let i = 0; i < count; i++) {
            const o = this._getXpOrb();
            Object.assign(o, {
                x: e.x + (Math.random() - 0.5) * 30,
                y: e.y + (Math.random() - 0.5) * 30,
                value: Math.ceil(e.xp / count), life: 15
            });
        }
        // Death particles
        for (let i = 0; i < 8; i++) {
            const pt = this._getParticle();
            Object.assign(pt, {
                x: e.x, y: e.y,
                vx: (Math.random() - 0.5) * 150, vy: (Math.random() - 0.5) * 150,
                life: 0.4, maxLife: 0.4, type: 'circle', color: e.color, size: 3
            });
        }
        this.player.kills++;
        AudioManager.play('kill');
        this._releaseEnemy(e);
    }

    _showLevelUp() {
        this.state = GS.LEVELUP;
        // Pick 3 random upgrades
        const shuffled = [...UPGRADES].sort(() => Math.random() - 0.5);
        this.upgradeChoices = shuffled.slice(0, 3);
    }

    // ─── Rendering ───
    _render() {
        const ctx = this.ctx;

        if (this.state === GS.MENU) { this._renderMenu(ctx); return; }

        ctx.save();
        ctx.translate(-this.camX, -this.camY);

        // Background grid
        this._drawGrid(ctx);

        // XP orbs
        for (const o of this.activeXp) {
            ctx.fillStyle = '#4CAF50';
            ctx.globalAlpha = 0.5 + Math.sin(o.life * 5) * 0.3;
            ctx.beginPath(); ctx.arc(o.x, o.y, 6, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#8BC34A';
            ctx.beginPath(); ctx.arc(o.x, o.y, 4, 0, Math.PI * 2); ctx.fill();
        }

        // Enemies
        for (const e of this.activeEnemies) {
            this._drawEnemy(ctx, e);
        }

        // Projectiles
        for (const proj of this.activeProjs) {
            ctx.fillStyle = '#00E5FF';
            ctx.shadowColor = '#00E5FF';
            ctx.shadowBlur = 8;
            ctx.beginPath(); ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Player
        this._drawPlayer(ctx);

        // Particles
        for (const pt of this.activeParticles) {
            const alpha = Math.max(0, pt.life / pt.maxLife);
            ctx.globalAlpha = alpha;
            if (pt.type === 'text') {
                ctx.fillStyle = pt.color;
                ctx.font = 'bold 12px Orbitron, monospace';
                ctx.textAlign = 'center';
                ctx.fillText(pt.text, pt.x, pt.y);
            } else {
                ctx.fillStyle = pt.color;
                ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size * alpha, 0, Math.PI * 2); ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        ctx.restore();

        // HUD
        this._drawHUD(ctx);

        // Joystick
        if (this.joystick.active) this._drawJoystick(ctx);

        if (this.state === GS.LEVELUP) this._drawLevelUp(ctx);
        if (this.state === GS.PAUSED) this._drawPause(ctx);
        if (this.state === GS.GAMEOVER) this._drawGameOver(ctx);
    }

    _drawGrid(ctx) {
        const gridSize = 80;
        const startX = Math.floor(this.camX / gridSize) * gridSize;
        const startY = Math.floor(this.camY / gridSize) * gridSize;
        ctx.strokeStyle = 'rgba(0,229,255,0.06)';
        ctx.lineWidth = 1;
        for (let x = startX; x < this.camX + W + gridSize; x += gridSize) {
            ctx.beginPath(); ctx.moveTo(x, this.camY); ctx.lineTo(x, this.camY + H); ctx.stroke();
        }
        for (let y = startY; y < this.camY + H + gridSize; y += gridSize) {
            ctx.beginPath(); ctx.moveTo(this.camX, y); ctx.lineTo(this.camX + W, y); ctx.stroke();
        }
    }

    _drawPlayer(ctx) {
        const p = this.player;
        if (p.invTimer > 0 && Math.floor(p.invTimer * 10) % 2 === 0) return;

        // Glow
        ctx.fillStyle = 'rgba(0,229,255,0.15)';
        ctx.beginPath(); ctx.arc(p.x, p.y, 24, 0, Math.PI * 2); ctx.fill();

        // Body
        ctx.fillStyle = '#00E5FF';
        ctx.beginPath(); ctx.arc(p.x, p.y, 14, 0, Math.PI * 2); ctx.fill();

        // Inner
        ctx.fillStyle = '#80DEEA';
        ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI * 2); ctx.fill();

        // Eyes
        ctx.fillStyle = '#FFF';
        ctx.beginPath(); ctx.arc(p.x - 4, p.y - 3, 3, 0, Math.PI * 2); ctx.arc(p.x + 4, p.y - 3, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(p.x - 4, p.y - 3, 1.5, 0, Math.PI * 2); ctx.arc(p.x + 4, p.y - 3, 1.5, 0, Math.PI * 2); ctx.fill();

        // Attack range indicator
        ctx.strokeStyle = 'rgba(0,229,255,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.atkRange, 0, Math.PI * 2); ctx.stroke();
    }

    _drawEnemy(ctx, e) {
        if (e.hitFlash > 0) ctx.fillStyle = '#FFF';
        else ctx.fillStyle = e.color;

        if (e.type === 'boss') {
            // Boss - larger, more details
            ctx.beginPath(); ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#333';
            ctx.beginPath(); ctx.arc(e.x, e.y, e.size * 0.7, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = e.color;
            ctx.beginPath(); ctx.arc(e.x, e.y, e.size * 0.5, 0, Math.PI * 2); ctx.fill();
            // Eyes
            ctx.fillStyle = '#FFF';
            ctx.beginPath(); ctx.arc(e.x - 8, e.y - 5, 5, 0, Math.PI * 2); ctx.arc(e.x + 8, e.y - 5, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#FF0000';
            ctx.beginPath(); ctx.arc(e.x - 8, e.y - 5, 3, 0, Math.PI * 2); ctx.arc(e.x + 8, e.y - 5, 3, 0, Math.PI * 2); ctx.fill();
            // Antenna
            ctx.strokeStyle = '#666'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(e.x, e.y - e.size); ctx.lineTo(e.x, e.y - e.size - 15); ctx.stroke();
            ctx.fillStyle = '#FF0000';
            ctx.beginPath(); ctx.arc(e.x, e.y - e.size - 16, 4, 0, Math.PI * 2); ctx.fill();
        } else {
            // Regular enemies
            ctx.beginPath(); ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2); ctx.fill();
            // Eye
            ctx.fillStyle = '#FFF';
            ctx.beginPath(); ctx.arc(e.x, e.y - 2, e.size * 0.3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(e.x, e.y - 2, e.size * 0.15, 0, Math.PI * 2); ctx.fill();
        }

        // HP bar
        if (e.hp < e.maxHp) {
            const bw = e.size * 2;
            ctx.fillStyle = '#333';
            ctx.fillRect(e.x - bw / 2, e.y - e.size - 8, bw, 3);
            ctx.fillStyle = '#F44336';
            ctx.fillRect(e.x - bw / 2, e.y - e.size - 8, bw * (e.hp / e.maxHp), 3);
        }
    }

    _drawHUD(ctx) {
        const p = this.player;
        // Top bar
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, W, 45);

        // Time
        const mins = Math.floor(p.time / 60);
        const secs = Math.floor(p.time % 60);
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 14px Orbitron, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0'), 10, 18);

        // Level
        ctx.fillStyle = '#00E5FF';
        ctx.font = 'bold 14px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Lv.' + p.level, W / 2, 18);

        // Kills
        ctx.fillStyle = '#FF6600';
        ctx.font = 'bold 14px Orbitron, monospace';
        ctx.textAlign = 'right';
        ctx.fillText('💀 ' + p.kills, W - 10, 18);

        // Enemies count
        ctx.fillStyle = '#F44336';
        ctx.font = '11px Rajdhani, sans-serif';
        ctx.fillText('Enemies: ' + this.activeEnemies.length, W - 10, 35);

        // XP bar
        ctx.fillStyle = '#222';
        ctx.fillRect(10, 30, W - 20, 6);
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(10, 30, (W - 20) * (p.xp / p.xpNext), 6);
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
        ctx.strokeRect(10, 30, W - 20, 6);

        // HP bar (bottom)
        ctx.fillStyle = '#222';
        ctx.fillRect(10, H - 20, 150, 10);
        ctx.fillStyle = '#F44336';
        ctx.fillRect(10, H - 20, 150 * (p.hp / p.maxHp), 10);
        ctx.strokeStyle = '#444';
        ctx.strokeRect(10, H - 20, 150, 10);
        ctx.fillStyle = '#FFF';
        ctx.font = '9px Rajdhani, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(Math.floor(p.hp) + '/' + p.maxHp, 85, H - 12);

        // Stats (bottom right)
        ctx.fillStyle = '#888';
        ctx.font = '10px Rajdhani, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('DMG:' + Math.floor(p.damage) + ' SPD:' + Math.floor(p.atkSpeed*10)/10 + ' CRIT:' + Math.floor(p.critChance*100) + '%', W - 10, H - 12);
    }

    _drawJoystick(ctx) {
        const j = this.joystick;
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#FFF';
        ctx.beginPath(); ctx.arc(j.startX, j.startY, 40, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#00E5FF';
        ctx.beginPath(); ctx.arc(j.startX + j.dx, j.startY + j.dy, 20, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
    }

    _drawLevelUp(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 24px Orbitron, monospace';
        ctx.fillText('LEVEL UP!', W / 2, 140);
        ctx.fillStyle = '#FFF';
        ctx.font = '14px Rajdhani, sans-serif';
        ctx.fillText('Chọn 1 nâng cấp', W / 2, 165);

        for (let i = 0; i < this.upgradeChoices.length; i++) {
            const u = this.upgradeChoices[i];
            const bx = W / 2 - 120, by = 180 + i * 80;
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.fillRect(bx, by, 240, 65);
            ctx.strokeStyle = '#00E5FF';
            ctx.lineWidth = 1;
            ctx.strokeRect(bx, by, 240, 65);
            ctx.fillStyle = '#FFF';
            ctx.font = '20px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(u.icon, bx + 15, by + 30);
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 14px Rajdhani, sans-serif';
            ctx.fillText(u.name, bx + 50, by + 25);
            ctx.fillStyle = '#AAA';
            ctx.font = '12px Rajdhani, sans-serif';
            ctx.fillText(u.desc, bx + 50, by + 45);
            ctx.fillStyle = '#555';
            ctx.font = '10px Rajdhani, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('[' + (i + 1) + ']', bx + 230, by + 58);
        }
    }

    _drawPause(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 28px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('TẠM DỪNG', W / 2, H / 2 - 10);
        ctx.fillStyle = '#AAA';
        ctx.font = '14px Rajdhani, sans-serif';
        ctx.fillText('Nhấn để tiếp tục', W / 2, H / 2 + 20);
    }

    _drawGameOver(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.88)';
        ctx.fillRect(0, 0, W, H);
        const p = this.player;
        const best = SaveManager.load();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#F44336';
        ctx.font = 'bold 30px Orbitron, monospace';
        ctx.fillText('GAME OVER', W / 2, 120);

        const mins = Math.floor(p.time / 60);
        const secs = Math.floor(p.time % 60);
        ctx.fillStyle = '#FFF';
        ctx.font = '16px Rajdhani, sans-serif';
        ctx.fillText('Thời gian: ' + String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0'), W / 2, 180);
        ctx.fillText('Giết: ' + p.kills, W / 2, 210);
        ctx.fillText('Level: ' + p.level, W / 2, 240);

        ctx.fillStyle = '#888';
        ctx.font = '13px Rajdhani, sans-serif';
        ctx.fillText('Kỷ lục: ' + Math.floor(best.bestTime / 60) + ':' + String(best.bestTime % 60).padStart(2, '0') + ' | ' + best.bestKills + ' kills | Lv.' + best.bestLevel, W / 2, 290);

        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(W / 2 - 80, 380, 160, 35);
        ctx.strokeStyle = '#00E5FF';
        ctx.strokeRect(W / 2 - 80, 380, 160, 35);
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 14px Rajdhani, sans-serif';
        ctx.fillText('🏠 MENU', W / 2, 402);
    }

    _renderMenu(ctx) {
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, W, H);

        // Grid bg
        ctx.strokeStyle = 'rgba(0,229,255,0.04)';
        for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        ctx.textAlign = 'center';
        ctx.fillStyle = '#00E5FF';
        ctx.font = 'bold 36px Orbitron, monospace';
        ctx.fillText('CYBER SURVIVOR', W / 2, 100);

        ctx.fillStyle = '#80DEEA';
        ctx.font = 'bold 16px Orbitron, monospace';
        ctx.fillText('⚡ PHASE 1 ⚡', W / 2, 135);

        // Character preview
        ctx.fillStyle = 'rgba(0,229,255,0.15)';
        ctx.beginPath(); ctx.arc(W / 2, 200, 30, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#00E5FF';
        ctx.beginPath(); ctx.arc(W / 2, 200, 18, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#80DEEA';
        ctx.beginPath(); ctx.arc(W / 2, 200, 10, 0, Math.PI * 2); ctx.fill();

        // Play button
        ctx.fillStyle = 'rgba(0,229,255,0.2)';
        ctx.fillRect(W / 2 - 80, 280, 160, 35);
        ctx.strokeStyle = '#00E5FF';
        ctx.lineWidth = 2;
        ctx.strokeRect(W / 2 - 80, 280, 160, 35);
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 16px Rajdhani, sans-serif';
        ctx.fillText('▶ BẮT ĐẦU', W / 2, 303);

        // Best record
        const best = SaveManager.load();
        ctx.fillStyle = '#666';
        ctx.font = '12px Rajdhani, sans-serif';
        ctx.fillText('Kỷ lục: ' + Math.floor(best.bestTime / 60) + ':' + String(best.bestTime % 60).padStart(2, '0') + ' | ' + best.bestKills + ' kills | Lv.' + best.bestLevel, W / 2, 360);

        // Controls
        ctx.fillStyle = '#555';
        ctx.font = '12px Rajdhani, sans-serif';
        ctx.fillText('WASD / Mũi tên: Di chuyển | Tự động tấn công', W / 2, 430);
        ctx.fillText('Mobile: Joystick bên trái | ESC: Tạm dừng', W / 2, 450);
    }
}

window.addEventListener('load', () => { new CyberSurvivor(); });
