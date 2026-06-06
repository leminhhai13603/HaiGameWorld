/**
 * Plants vs Zombies Lite - Main Game Controller
 */
const GS = { MENU:'menu', PLAYING:'playing', PAUSED:'paused', GAME_OVER:'gameOver', VICTORY:'victory' };
const MAX_PARTICLES = 100;

class PvZGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = W; this.canvas.height = H;
        this.state = GS.MENU;
        this.lastTime = 0;
        this._setupInput();
        window.addEventListener('beforeunload', () => { AudioManager.close(); });
        this._gameLoop(performance.now());
    }

    _initGame() {
        this.sun = STARTING_SUN;
        this.wave = 0;
        this.maxWaves = 20;
        this.gameTime = 0;
        this.selectedPlant = null;
        this.plants = [];
        this.zombies = [];
        this.projectiles = [];
        this.suns = [];
        this.particles = [];
        this.plantCooldowns = {};
        this.waveTimer = 0;
        this.waveActive = false;
        this.zombiesToSpawn = [];
        this.spawnTimer = 0;
        this.fallingSunTimer = 0;
        this.lawnMowers = [true, true, true, true, true]; // one per row
        PLANT_ORDER.forEach(k => this.plantCooldowns[k] = 0);
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
            this._handleClick(x, y);
        }, { passive: false });
        document.addEventListener('keydown', (e) => {
            if (this.state === GS.PLAYING) {
                const n = parseInt(e.key);
                if (n >= 1 && n <= PLANT_ORDER.length) {
                    const key = PLANT_ORDER[n - 1];
                    if (this.wave >= PLANT_DEFS[key].unlocked) {
                        this.selectedPlant = this.selectedPlant === key ? null : key;
                    }
                }
                if (e.key === 'Escape') this.state = GS.PAUSED;
            } else if (this.state === GS.PAUSED) {
                this.state = GS.PLAYING;
            }
        });
    }

    _handleClick(x, y) {
        if (this.state === GS.MENU) { this._menuClick(x, y); return; }
        if (this.state === GS.GAME_OVER || this.state === GS.VICTORY) { this.state = GS.MENU; return; }
        if (this.state === GS.PAUSED) { this.state = GS.PLAYING; return; }
        if (this.state !== GS.PLAYING) return;

        // Sun collection
        for (let i = this.suns.length - 1; i >= 0; i--) {
            const s = this.suns[i];
            if (Math.abs(x - s.x) < 18 && Math.abs(y - s.y) < 18) {
                this.sun += SUN_VALUE;
                this.suns[i] = this.suns[this.suns.length - 1];
                this.suns.length--;
                AudioManager.play('sunCollect');
                return;
            }
        }

        // Plant bar click
        if (y > H - 70) {
            const startX = 10, btnW = 55;
            for (let i = 0; i < PLANT_ORDER.length; i++) {
                const bx = startX + i * (btnW + 5);
                if (x >= bx && x < bx + btnW) {
                    const key = PLANT_ORDER[i];
                    if (this.wave >= PLANT_DEFS[key].unlocked) {
                        this.selectedPlant = this.selectedPlant === key ? null : key;
                    }
                    return;
                }
            }
            // Shovel
            const shovelX = startX + PLANT_ORDER.length * (btnW + 5) + 10;
            if (x >= shovelX && x < shovelX + btnW) {
                this.selectedPlant = this.selectedPlant === 'shovel' ? null : 'shovel';
                return;
            }
            return;
        }

        // Grid click
        if (x >= GRID_X && x < GRID_X + COLS * CELL_W && y >= GRID_Y && y < GRID_Y + ROWS * CELL_H) {
            const col = Math.floor((x - GRID_X) / CELL_W);
            const row = Math.floor((y - GRID_Y) / CELL_H);

            if (this.selectedPlant === 'shovel') {
                // Remove plant
                const idx = this.plants.findIndex(p => p.row === row && p.col === col);
                if (idx >= 0) {
                    this.plants.splice(idx, 1);
                    this.selectedPlant = null;
                    AudioManager.play('plant');
                }
                return;
            }

            if (this.selectedPlant && this.selectedPlant !== 'shovel') {
                const def = PLANT_DEFS[this.selectedPlant];
                const occupied = this.plants.some(p => p.row === row && p.col === col);
                if (!occupied && this.sun >= def.cost && (this.plantCooldowns[this.selectedPlant] || 0) <= 0) {
                    this.sun -= def.cost;
                    this.plants.push({
                        type: this.selectedPlant, row, col, hp: def.hp,
                        atkCooldown: 0, sunTimer: 0
                    });
                    this.plantCooldowns[this.selectedPlant] = def.cooldown;
                    AudioManager.play('plant');
                }
                return;
            }
        }
    }

    _menuClick(x, y) {
        const cx = W / 2;
        if (x >= cx - 100 && x <= cx + 100 && y >= 200 && y <= 240) {
            this._initGame();
            this.state = GS.PLAYING;
            this.wave = 1;
            this._startWave(1);
            SaveManager.addGamePlayed();
        }
    }

    _startWave(num) {
        this.wave = num;
        this.waveActive = true;
        this.zombiesToSpawn = [];
        const waveDef = generateWave(num);
        for (const z of waveDef) {
            for (let i = 0; i < z.count; i++) {
                this.zombiesToSpawn.push(z.type);
            }
        }
        // Shuffle
        for (let i = this.zombiesToSpawn.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.zombiesToSpawn[i], this.zombiesToSpawn[j]] = [this.zombiesToSpawn[j], this.zombiesToSpawn[i]];
        }
        // Early waves: longer delay before first spawn
        this.spawnTimer = num <= 3 ? 5 : 1;
        AudioManager.play('waveStart');
    }

    // ─── Game Loop ───
    destroy() {
        if (this._rafId) cancelAnimationFrame(this._rafId);
        AudioManager.close();
    }

    _gameLoop(now) {
        this._rafId = requestAnimationFrame((t) => this._gameLoop(t));
        const elapsed = now - this.lastTime;
        if (elapsed < 16) return;
        this.lastTime = now - (elapsed % 16);
        const dt = Math.min(elapsed / 1000, 0.05);
        try { this._update(dt); this._render(); } catch(e) { console.error('Animal Kingdom error:', e); }
    }

    _update(dt) {
        if (this.state !== GS.PLAYING) return;
        this.gameTime += dt;

        // Cooldowns
        for (const key of Object.keys(this.plantCooldowns)) {
            if (this.plantCooldowns[key] > 0) this.plantCooldowns[key] -= dt;
        }

        // Falling sun (faster in early waves)
        this.fallingSunTimer -= dt;
        if (this.fallingSunTimer <= 0) {
            const sunInterval = this.wave <= 3 ? FALLING_SUN_INTERVAL * 0.7 : FALLING_SUN_INTERVAL;
            this.fallingSunTimer = sunInterval;
            this.suns.push({
                x: GRID_X + Math.random() * COLS * CELL_W,
                y: -20, vy: FALLING_SUN_SPEED, targetY: GRID_Y + Math.random() * ROWS * CELL_H,
                life: 10, alpha: 1
            });
        }

        // Update suns
        let sunWrite = 0;
        for (let i = 0; i < this.suns.length; i++) {
            const s = this.suns[i];
            if (s.y < s.targetY) s.y += s.vy * dt;
            s.life -= dt;
            if (s.life < 2) s.alpha = s.life / 2;
            if (s.life > 0) this.suns[sunWrite++] = s;
        }
        this.suns.length = sunWrite;

        // Sunflower sun generation
        for (const p of this.plants) {
            if (p.type === 'sunflower') {
                p.sunTimer -= dt;
                if (p.sunTimer <= 0) {
                    p.sunTimer = PLANT_DEFS.sunflower.sunInterval;
                    const px = GRID_X + p.col * CELL_W + CELL_W/2;
                    const py = GRID_Y + p.row * CELL_H + CELL_H/2;
                    this.suns.push({ x: px, y: py, vy: 0, targetY: py + 20, life: 10, alpha: 1 });
                }
            }
        }

        // Spawn zombies
        if (this.zombiesToSpawn.length > 0) {
            this.spawnTimer -= dt;
            if (this.spawnTimer <= 0) {
                // Early waves spawn slower to give player time to build
                const baseInterval = this.wave <= 3 ? 4 + Math.random() * 3 : 2 + Math.random() * 3;
                this.spawnTimer = baseInterval;
                const type = this.zombiesToSpawn.pop();
                const row = Math.floor(Math.random() * ROWS);
                const def = ZOMBIE_DEFS[type];
                this.zombies.push({
                    type, row,
                    x: W + 20,
                    y: GRID_Y + row * CELL_H + CELL_H/2 + 10,
                    hp: def.hp, maxHp: def.hp,
                    speed: def.speed, dps: def.dps,
                    eating: null, eatingTimer: 0
                });
            }
        }

        // Update plants (attacking)
        for (const p of this.plants) {
            if (PLANT_DEFS[p.type].damage) {
                p.atkCooldown -= dt;
                if (p.atkCooldown <= 0) {
                    // Check if zombie in same row
                    const hasTarget = this.zombies.some(z => z.row === p.row && z.x > GRID_X + p.col * CELL_W);
                    if (hasTarget) {
                        p.atkCooldown = 1 / PLANT_DEFS[p.type].atkSpeed;
                        const px = GRID_X + p.col * CELL_W + CELL_W;
                        const py = GRID_Y + p.row * CELL_H + CELL_H/2;
                        const shots = PLANT_DEFS[p.type].shots || 1;
                        for (let s = 0; s < shots; s++) {
                            this.projectiles.push({
                                x: px + s * 10, y: py, row: p.row,
                                speed: 200, damage: PLANT_DEFS[p.type].damage,
                                type: p.type === 'snowpea' ? 'snowpea' : 'pea',
                                slow: PLANT_DEFS[p.type].slow || 0
                            });
                        }
                        AudioManager.play('shoot');
                    }
                }
            }
            // Spike plant damage
            if (p.type === 'spikeplant') {
                p.atkCooldown -= dt;
                if (p.atkCooldown <= 0) {
                    p.atkCooldown = 1 / PLANT_DEFS.spikeplant.atkSpeed;
                    for (const z of this.zombies) {
                        if (z.row === p.row) {
                            const zx = z.x, px = GRID_X + p.col * CELL_W + CELL_W/2;
                            if (Math.abs(zx - px) < CELL_W) {
                                z.hp -= PLANT_DEFS.spikeplant.damage;
                                if (z.hp <= 0) this._killZombie(z);
                            }
                        }
                    }
                }
            }
        }

        // Update projectiles
        let projWrite = 0;
        for (let i = 0; i < this.projectiles.length; i++) {
            const p = this.projectiles[i];
            p.x += p.speed * dt;
            // Check collision with zombies
            let hit = false;
            for (const z of this.zombies) {
                if (z.row === p.row && Math.abs(z.x - p.x) < 15) {
                    z.hp -= p.damage;
                    if (p.slow) {
                        z.speed = ZOMBIE_DEFS[z.type].speed * (1 - p.slow);
                        z.slowTimer = 3;
                    }
                    if (z.hp <= 0) this._killZombie(z);
                    hit = true;
                    AudioManager.play('hit');
                    break;
                }
            }
            if (!hit && p.x <= W + 20) {
                this.projectiles[projWrite++] = p;
            }
        }
        this.projectiles.length = projWrite;

        // Update zombies
        for (let i = this.zombies.length - 1; i >= 0; i--) {
            const z = this.zombies[i];

            // Slow debuff recovery
            if (z.slowTimer > 0) {
                z.slowTimer -= dt;
                if (z.slowTimer <= 0) {
                    z.speed = ZOMBIE_DEFS[z.type].speed;
                    z.slowTimer = 0;
                }
            }

            if (z.eating) {
                // Eating a plant
                z.eatingTimer -= dt;
                if (z.eatingTimer <= 0) {
                    z.eatingTimer = 0.5;
                    z.eating.hp -= z.dps * 0.5;
                    AudioManager.play('bite');
                    if (z.eating.hp <= 0) {
                        const pidx = this.plants.indexOf(z.eating);
                        if (pidx >= 0) this.plants.splice(pidx, 1);
                        z.eating = null;
                    }
                }
            } else {
                // Move left
                z.x -= z.speed * dt;

                // Check collision with plants
                for (const p of this.plants) {
                    if (p.row === z.row) {
                        const px = GRID_X + p.col * CELL_W + CELL_W;
                        if (Math.abs(z.x - px) < 10) {
                            z.eating = p;
                            z.eatingTimer = 0.5;
                            break;
                        }
                    }
                }

                // Check if reached house
                if (z.x < HOUSE_X) {
                    // Lawn mower check
                    if (this.lawnMowers[z.row]) {
                        this.lawnMowers[z.row] = false;
                        // Kill all zombies in this row
                        for (let j = this.zombies.length - 1; j >= 0; j--) {
                            if (this.zombies[j].row === z.row) {
                                this._killZombie(this.zombies[j]);
                            }
                        }
                        AudioManager.play('explosion');
                    } else {
                        this.state = GS.GAME_OVER;
                        AudioManager.play('gameOver');
                        SaveManager.updateBestWave(this.wave);
                        return;
                    }
                }
            }

            // Cherry bomb explosion (instant)
            if (z.hp <= 0) {
                this._killZombie(z);
            }
        }

        // Cherry bomb explosion
        for (let i = this.plants.length - 1; i >= 0; i--) {
            const p = this.plants[i];
            if (p.type === 'cherrybomb') {
                const px = GRID_X + p.col * CELL_W + CELL_W/2;
                const py = GRID_Y + p.row * CELL_H + CELL_H/2;
                const radius = PLANT_DEFS.cherrybomb.radius * CELL_W;
                // Damage all zombies in radius
                for (const z of this.zombies) {
                    const dx = z.x - px, dy = z.y - py;
                    if (Math.sqrt(dx*dx + dy*dy) < radius) {
                        z.hp -= PLANT_DEFS.cherrybomb.damage;
                        if (z.hp <= 0) this._killZombie(z);
                    }
                }
                // Explosion particles
                for (let j = 0; j < 20 && this.particles.length < MAX_PARTICLES; j++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 50 + Math.random() * 150;
                    this.particles.push({
                        x: px, y: py,
                        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                        life: 0.5, maxLife: 0.5,
                        color: ['#FF4500','#FF6600','#FFD700'][Math.floor(Math.random()*3)],
                        size: 3 + Math.random() * 5
                    });
                }
                AudioManager.play('explosion');
                this.plants.splice(i, 1);
            }
        }

        // Update particles
        let partWrite = 0;
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            p.x += p.vx * dt; p.y += p.vy * dt;
            p.vy += 200 * dt;
            p.life -= dt;
            if (p.life > 0) this.particles[partWrite++] = p;
        }
        this.particles.length = partWrite;

        // Check wave completion
        if (this.waveActive && this.zombiesToSpawn.length === 0 && this.zombies.length === 0) {
            this.waveActive = false;
            if (this.wave >= this.maxWaves) {
                this.state = GS.VICTORY;
                AudioManager.play('victory');
                SaveManager.updateBestWave(this.wave);
            } else {
                this.waveTimer = 5;
            }
        }

        // Next wave timer
        if (!this.waveActive && this.waveTimer > 0) {
            this.waveTimer -= dt;
            if (this.waveTimer <= 0) {
                this._startWave(this.wave + 1);
            }
        }
    }

    _killZombie(z) {
        const idx = this.zombies.indexOf(z);
        if (idx >= 0) {
            this.zombies.splice(idx, 1);
            SaveManager.addZombiesKilled(1);
            // Death particles
            for (let i = 0; i < 8 && this.particles.length < MAX_PARTICLES; i++) {
                this.particles.push({
                    x: z.x, y: z.y,
                    vx: (Math.random()-0.5)*100, vy: -50-Math.random()*80,
                    life: 0.4, maxLife: 0.4,
                    color: '#556B2F', size: 3
                });
            }
            AudioManager.play('zombieDie');
        }
    }

    // ─── Rendering ───
    _render() {
        const ctx = this.ctx;

        if (this.state === GS.MENU) { this._renderMenu(ctx); return; }

        Renderer.drawBackground(ctx, this.gameTime);

        // Lawn mowers
        for (let r = 0; r < ROWS; r++) {
            if (this.lawnMowers[r]) {
                ctx.fillStyle = '#333';
                ctx.fillRect(HOUSE_X - 5, GRID_Y + r * CELL_H + CELL_H/2 - 8, 16, 16);
                ctx.fillStyle = '#F44336';
                ctx.fillRect(HOUSE_X, GRID_Y + r * CELL_H + CELL_H/2 - 5, 10, 10);
            }
        }

        // Plants
        for (const p of this.plants) {
            Renderer.drawPlant(ctx, p, this.gameTime);
        }

        // Projectiles
        for (const p of this.projectiles) {
            Renderer.drawProjectile(ctx, p);
        }

        // Zombies
        for (const z of this.zombies) {
            Renderer.drawZombie(ctx, z, this.gameTime);
        }

        // Suns
        for (const s of this.suns) {
            Renderer.drawSun(ctx, s);
        }

        // Particles
        for (const p of this.particles) {
            Renderer.drawParticle(ctx, p);
        }

        // UI
        Renderer.drawHUD(ctx, this.sun, this.wave, this.maxWaves);
        Renderer.drawPlantBar(ctx, this.selectedPlant, this.plantCooldowns, this.sun, this.wave);

        // Wave countdown
        if (!this.waveActive && this.waveTimer > 0 && this.wave < this.maxWaves) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(W/2 - 80, H/2 - 20, 160, 40);
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 18px Orbitron, monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Wave ' + (this.wave + 1) + ' trong ' + Math.ceil(this.waveTimer) + 's', W/2, H/2 + 6);
        }

        if (this.state === GS.PAUSED) Renderer.drawPause(ctx);
        if (this.state === GS.GAME_OVER) Renderer.drawGameOver(ctx, this.wave);
        if (this.state === GS.VICTORY) Renderer.drawVictory(ctx);
    }

    _renderMenu(ctx) {
        ctx.fillStyle = '#1a3a1a';
        ctx.fillRect(0, 0, W, H);

        // Title
        ctx.textAlign = 'center';
        ctx.fillStyle = '#8B6914';
        ctx.font = 'bold 32px Orbitron, monospace';
        ctx.fillText('ANIMAL KINGDOM', W/2, 70);
        ctx.fillStyle = '#4CAF50';
        ctx.font = 'bold 20px Orbitron, monospace';
        ctx.fillText('DEFENSE', W/2, 100);

        // Decorative animals
        ctx.font = '36px sans-serif';
        ctx.fillText('🐔 🐵 🐻 🐧 🐡', W/2, 150);
        ctx.font = '14px sans-serif';
        ctx.fillText('⚔️ vs 🤖', W/2, 180);

        // Play button
        ctx.fillStyle = 'rgba(76,175,80,0.3)';
        ctx.fillRect(W/2 - 100, 200, 200, 40);
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2;
        ctx.strokeRect(W/2 - 100, 200, 200, 40);
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 16px Rajdhani, sans-serif';
        ctx.fillText('🌱 BẮT ĐẦU', W/2, 225);

        // Best wave
        ctx.fillStyle = '#888';
        ctx.font = '13px Rajdhani, sans-serif';
        ctx.fillText('Wave cao nhất: ' + SaveManager.load().bestWave, W/2, 290);

        // Controls
        ctx.fillStyle = '#666';
        ctx.font = '12px Rajdhani, sans-serif';
        ctx.fillText('Chọn cây → Click lưới để trồng | Phím 1-7 chọn cây', W/2, 350);
        ctx.fillText('Click mặt trời để thu thập | ESC tạm dừng', W/2, 370);
    }
}

window.addEventListener('load', () => { new PvZGame(); });
