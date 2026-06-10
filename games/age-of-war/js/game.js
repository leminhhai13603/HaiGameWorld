/**
 * Age of War: Ultimate Edition - Main Game Controller
 */
const GS = { MENU:'menu', PLAYING:'playing', PAUSED:'paused', VICTORY:'victory', DEFEAT:'defeat', STATS:'stats', SETTINGS:'settings' };
const MAX_PARTICLES = 150;

class AgeOfWar {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = W; this.canvas.height = H;
        this.state = GS.MENU;
        this.mode = 'campaign'; // campaign, survival
        this.difficulty = SaveManager.load().settings.difficulty || 'normal';
        this.stage = 0;
        this._initGame();
        this.lastTime = 0;
        this._setupInput();
        window.addEventListener('beforeunload', () => { AudioManager.close(); });
        this._gameLoop(performance.now());
    }

    _initGame() {
        // Player state
        this.pGold = 100; this.pXP = 0; this.pAge = 0;
        this.pBaseHp = BASE_HP; this.pBaseMaxHp = BASE_HP;
        this.pUnits = []; this.pProjectiles = [];
        this.pUpgrades = { income:0, dmg:0, hp:0, baseHp:0, turret:0 };
        this.pTurretCooldown = 0; this.pTurretTarget = null;
        // Enemy state
        this.eGold = 100; this.eXP = 0; this.eAge = 0;
        this.eBaseHp = BASE_HP; this.eBaseMaxHp = BASE_HP;
        this.eUnits = []; this.eProjectiles = [];
        this.eUpgrades = { income:0, dmg:0, hp:0, baseHp:0, turret:0 };
        this.eTurretCooldown = 0;
        // AI
        this.aiSpawnTimer = 2; this.aiUpgradeTimer = 5; this.aiAgeTimer = 10;
        // Particles
        this.particles = [];
        // UI
        this.selectedUnit = null;
        this.gameTime = 0;
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
            if (e.key === 'Escape') {
                if (this.state === GS.PLAYING) this.state = GS.PAUSED;
                else if (this.state === GS.PAUSED) this.state = GS.PLAYING;
                else if (this.state === GS.STATS || this.state === GS.SETTINGS) this.state = GS.MENU;
            }
            if (this.state === GS.PLAYING) {
                // Number keys 1-5 for unit spawning
                const n = parseInt(e.key);
                if (n >= 1 && n <= 5) {
                    const units = AGE_UNITS[this.pAge];
                    if (n <= units.length) this._spawnUnit(units[n-1], true);
                }
            }
        });
    }

    _handleClick(x, y) {
        if (this.state === GS.MENU) { this._menuClick(x, y); return; }
        if (this.state === GS.STATS || this.state === GS.SETTINGS) { this.state = GS.MENU; return; }
        if (this.state === GS.VICTORY || this.state === GS.DEFEAT) { this.state = GS.MENU; return; }
        if (this.state === GS.PAUSED) { this.state = GS.PLAYING; return; }
        if (this.state !== GS.PLAYING) return;

        // Bottom bar: unit buttons (y > 420)
        if (y > 420) {
            const units = AGE_UNITS[this.pAge];
            const btnW = 80, startX = 10;
            for (let i = 0; i < units.length; i++) {
                const bx = startX + i * (btnW + 6);
                if (x >= bx && x < bx + btnW && y >= 425 && y < 465) {
                    this._spawnUnit(units[i], true);
                    AudioManager.play('click');
                    return;
                }
            }
            // Upgrade buttons (y > 470)
            if (y >= 470) {
                const upgKeys = Object.keys(UPGRADE_DEFS);
                const ubW = 75, uStartX = 10;
                for (let i = 0; i < upgKeys.length; i++) {
                    const bx = uStartX + i * (ubW + 4);
                    if (x >= bx && x < bx + ubW && y >= 472 && y < 500) {
                        this._upgrade(upgKeys[i], true);
                        return;
                    }
                }
                // Age advance button
                if (x >= W - 140 && x < W - 10 && y >= 472 && y < 500) {
                    this._advanceAge(true);
                    return;
                }
            }
            return;
        }

    }

    _menuClick(x, y) {
        const cx = W / 2;
        // Campaign
        if (x >= cx-120 && x <= cx+120 && y >= 180 && y <= 215) { this.mode = 'campaign'; this._startGame(); return; }
        // Survival
        if (x >= cx-120 && x <= cx+120 && y >= 230 && y <= 265) { this.mode = 'survival'; this._startGame(); return; }
        // Difficulty
        const diffs = ['easy','normal','hard','insane'];
        const diffLabels = ['Dễ','Thường','Khó','Điên'];
        for (let i = 0; i < 4; i++) {
            if (x >= cx-120+i*62 && x <= cx-120+i*62+58 && y >= 300 && y <= 330) {
                this.difficulty = diffs[i]; SaveManager.updateSettings({difficulty:diffs[i]}); AudioManager.play('click'); return;
            }
        }
        // Stats
        if (x >= cx-120 && x <= cx+120 && y >= 360 && y <= 390) { this.state = GS.STATS; return; }
        // Settings
        if (x >= cx-120 && x <= cx+120 && y >= 400 && y <= 430) { this.state = GS.SETTINGS; return; }
    }

    _startGame() {
        this._initGame();
        this.state = GS.PLAYING;
        this.gameTime = 0;
        const s = SaveManager.load();
        if (this.mode === 'campaign') {
            this.stage = s.campaignProgress;
            const stg = CAMPAIGN_STAGES[this.stage];
            this.difficulty = stg.aiDifficulty;
        }
        AudioManager.play('spawn');
    }

    _spawnUnit(unitKey, isPlayer) {
        const def = UNIT_DEFS[unitKey];
        if (!def) return;
        const gold = isPlayer ? this.pGold : this.eGold;
        const age = isPlayer ? this.pAge : this.eAge;
        if (def.age > age) return;
        if (gold < def.cost) return;

        if (isPlayer) this.pGold -= def.cost; else this.eGold -= def.cost;

        const hpMul = 1 + (isPlayer ? this.pUpgrades.hp : this.eUpgrades.hp) * UPGRADE_DEFS.hp.effect;
        const dmgMul = 1 + (isPlayer ? this.pUpgrades.dmg : this.eUpgrades.dmg) * UPGRADE_DEFS.dmg.effect;

        const unit = {
            key: unitKey, x: isPlayer ? SPAWN_X_PLAYER : SPAWN_X_ENEMY,
            y: 350 + Math.random() * 50, hp: Math.floor(def.hp * hpMul), maxHp: Math.floor(def.hp * hpMul),
            dmg: Math.floor(def.dmg * dmgMul), atkSpeed: def.atkSpeed, range: def.range,
            moveSpeed: def.moveSpeed, cost: def.cost, type: def.type, size: def.size,
            projSpeed: def.projSpeed || 0, splash: def.splash || 0,
            atkCooldown: 0, isPlayer, animTimer: 0, hitFlash: 0
        };

        if (isPlayer) { this.pUnits.push(unit); SaveManager.updateStats('unitsSpawned', 1); }
        else this.eUnits.push(unit);
        AudioManager.play('spawn');
    }

    _autoFireTurret(isPlayer) {
        const upgrades = isPlayer ? this.pUpgrades : this.eUpgrades;
        if (upgrades.turret <= 0) return; // No turret purchased

        const cooldown = isPlayer ? this.pTurretCooldown : this.eTurretCooldown;
        if (cooldown > 0) return;

        const age = isPlayer ? this.pAge : this.eAge;
        const tierIdx = Math.min(age, upgrades.turret - 1);
        const tier = TURRET_TIERS[tierIdx];

        const baseX = isPlayer ? BASE_X_PLAYER + BASE_W : BASE_X_ENEMY;
        const enemies = isPlayer ? this.eUnits : this.pUnits;

        // Find nearest enemy within range
        let bestTarget = null, bestDist = Infinity;
        for (const u of enemies) {
            const d = Math.abs(u.x - baseX);
            if (d <= TURRET_RANGE && d < bestDist) {
                bestDist = d;
                bestTarget = u;
            }
        }
        if (!bestTarget) return;

        // Fire projectile
        const projArr = isPlayer ? this.pProjectiles : this.eProjectiles;
        const dx = bestTarget.x - baseX, dy = bestTarget.y - 280;
        const dist = Math.sqrt(dx*dx + dy*dy) || 1;
        projArr.push({
            x: baseX, y: 280, speed: 400, dmg: tier.dmg, splash: 0,
            isPlayer, vx: (dx/dist)*400, vy: (dy/dist)*400, life: 2
        });

        if (isPlayer) this.pTurretCooldown = tier.cooldown;
        else this.eTurretCooldown = tier.cooldown;
        AudioManager.play('shoot');
    }

    _upgrade(key, isPlayer) {
        const def = UPGRADE_DEFS[key];
        const upgs = isPlayer ? this.pUpgrades : this.eUpgrades;
        if (upgs[key] >= def.maxLv) return;
        // Turret: level capped by age (can't exceed age+1)
        if (key === 'turret') {
            const age = isPlayer ? this.pAge : this.eAge;
            if (upgs.turret >= age + 1) return;
        }
        const cost = def.costs[upgs[key]];
        const gold = isPlayer ? this.pGold : this.eGold;
        if (gold < cost) return;
        if (isPlayer) this.pGold -= cost; else this.eGold -= cost;
        upgs[key]++;
        if (key === 'baseHp') {
            if (isPlayer) { this.pBaseMaxHp += def.effect; this.pBaseHp += def.effect; }
            else { this.eBaseMaxHp += def.effect; this.eBaseHp += def.effect; }
        }
        AudioManager.play('upgrade');
    }

    _advanceAge(isPlayer) {
        const age = isPlayer ? this.pAge : this.eAge;
        const xp = isPlayer ? this.pXP : this.eXP;
        if (age >= 4) return;
        const req = AGE_DEFS[age + 1].xpRequired;
        if (xp < req) return;
        if (isPlayer) this.pAge++; else this.eAge++;
        AudioManager.play('ageUp');
        SaveManager.updateHighestAge(isPlayer ? this.pAge : this.eAge);
    }

    _updateAI(dt) {
        const diff = AI_DIFF[this.difficulty] || AI_DIFF.normal;

        // AI gold generation (same formula as player, with difficulty multiplier)
        const aiIncome = (BASE_INCOME + this.eUpgrades.income * UPGRADE_DEFS.income.effect) * diff.goldMul;
        this.eGold += aiIncome * dt;

        // ── AI Age Advance (always try when ready) ──
        this._advanceAge(false);

        // ── AI Smart Upgrades (priority-based, not random) ──
        this.aiUpgradeTimer -= dt;
        if (this.aiUpgradeTimer <= 0) {
            this.aiUpgradeTimer = 3 + Math.random() * 2;
            this._aiSmartUpgrade();
        }

        // ── AI Smart Unit Spawning ──
        this.aiSpawnTimer -= dt;
        if (this.aiSpawnTimer <= 0) {
            this.aiSpawnTimer = diff.spawnDelay + Math.random() * 0.3;
            this._aiSmartSpawn();
        }
    }

    _aiSmartUpgrade() {
        // Priority 1: Always buy turret when age-appropriate
        if (this.eUpgrades.turret < UPGRADE_DEFS.turret.maxLv && this.eUpgrades.turret < this.eAge + 1) {
            const cost = UPGRADE_DEFS.turret.costs[this.eUpgrades.turret];
            if (this.eGold >= cost) { this._upgrade('turret', false); return; }
        }

        // Priority 2: Income upgrade (invest early for long-term advantage)
        if (this.eUpgrades.income < UPGRADE_DEFS.income.maxLv) {
            const cost = UPGRADE_DEFS.income.costs[this.eUpgrades.income];
            if (this.eGold >= cost) { this._upgrade('income', false); return; }
        }

        // Priority 3: Base HP when base is damaged
        if (this.eBaseHp < this.eBaseMaxHp * 0.6 && this.eUpgrades.baseHp < UPGRADE_DEFS.baseHp.maxLv) {
            const cost = UPGRADE_DEFS.baseHp.costs[this.eUpgrades.baseHp];
            if (this.eGold >= cost) { this._upgrade('baseHp', false); return; }
        }

        // Priority 4: Damage upgrade (offensive advantage)
        if (this.eUpgrades.dmg < UPGRADE_DEFS.dmg.maxLv) {
            const cost = UPGRADE_DEFS.dmg.costs[this.eUpgrades.dmg];
            if (this.eGold >= cost) { this._upgrade('dmg', false); return; }
        }

        // Priority 5: HP upgrade (unit survivability)
        if (this.eUpgrades.hp < UPGRADE_DEFS.hp.maxLv) {
            const cost = UPGRADE_DEFS.hp.costs[this.eUpgrades.hp];
            if (this.eGold >= cost) { this._upgrade('hp', false); return; }
        }

        // Priority 6: Base HP as fallback
        if (this.eUpgrades.baseHp < UPGRADE_DEFS.baseHp.maxLv) {
            const cost = UPGRADE_DEFS.baseHp.costs[this.eUpgrades.baseHp];
            if (this.eGold >= cost) { this._upgrade('baseHp', false); return; }
        }
    }

    _aiSmartSpawn() {
        const units = AGE_UNITS[this.eAge];
        if (units.length === 0) return;

        const affordable = units.filter(u => UNIT_DEFS[u].cost <= this.eGold);
        if (affordable.length === 0) return;

        // Check if player is pushing (many units near AI base) → spawn defenders
        const playerUnitsNearBase = this.pUnits.filter(u => u.x > 600).length;
        const underPressure = playerUnitsNearBase >= 3;

        let pick;
        if (underPressure) {
            // Under pressure: prefer cheap units for rapid defense, or splash damage
            const splashers = affordable.filter(u => UNIT_DEFS[u].splash > 0);
            if (splashers.length > 0 && this.eGold >= UNIT_DEFS[splashers[0]].cost * 1.5) {
                pick = splashers[0]; // Use splash to clear groups
            } else {
                pick = affordable[0]; // Cheapest = fastest to deploy
            }
        } else {
            // Normal: prefer strongest unit affordable (sort by cost desc)
            const sorted = [...affordable].sort((a, b) => UNIT_DEFS[b].cost - UNIT_DEFS[a].cost);
            // Pick best unit if AI has enough gold for it, otherwise mid-range
            if (this.eGold >= UNIT_DEFS[sorted[0]].cost * 1.5) {
                pick = sorted[0]; // Can afford expensive unit comfortably
            } else {
                // Pick mid-range unit
                pick = sorted[Math.min(1, sorted.length - 1)];
            }
        }

        if (pick) this._spawnUnit(pick, false);
    }

    _updateUnits(dt) {
        const processUnit = (unit) => {
            unit.atkCooldown -= dt;
            unit.animTimer += dt;
            if (unit.hitFlash > 0) unit.hitFlash -= dt * 5;

            // Find target
            const enemies = unit.isPlayer ? this.eUnits : this.pUnits;
            const enemyBase = unit.isPlayer ? BASE_X_ENEMY : BASE_X_PLAYER;
            let target = null;
            let minDist = Infinity;

            for (const e of enemies) {
                const d = Math.abs(e.x - unit.x);
                if (d < minDist) { minDist = d; target = e; }
            }

            // Also consider base as target
            const distToBase = Math.abs(enemyBase - unit.x);

            if (target && minDist <= unit.range) {
                // Attack enemy
                if (unit.atkCooldown <= 0) {
                    unit.atkCooldown = 1 / unit.atkSpeed;
                    if (unit.type === 'ranged' && unit.projSpeed > 0) {
                        // Spawn projectile
                        const proj = {
                            x: unit.x, y: unit.y - 10, tx: target.x, ty: target.y - 10,
                            speed: unit.projSpeed, dmg: unit.dmg, splash: unit.splash,
                            isPlayer: unit.isPlayer, vx: 0, vy: 0, life: 2
                        };
                        const dx = target.x - unit.x, dy = (target.y - 10) - (unit.y - 10);
                        const dist = Math.sqrt(dx*dx + dy*dy) || 1;
                        proj.vx = (dx/dist) * unit.projSpeed;
                        proj.vy = (dy/dist) * unit.projSpeed;
                        (unit.isPlayer ? this.pProjectiles : this.eProjectiles).push(proj);
                        AudioManager.play('shoot');
                    } else {
                        // Melee attack directly
                        target.hp -= unit.dmg;
                        target.hitFlash = 1;
                        this._spawnDmgNumber(target.x, target.y - 20, unit.dmg);
                        AudioManager.play('hit');
                        if (target.hp <= 0) this._killUnit(target);
                    }
                    unit.animTimer = 0;
                }
            } else if (distToBase <= unit.range + 30) {
                // Attack enemy base
                if (unit.atkCooldown <= 0) {
                    unit.atkCooldown = 1 / unit.atkSpeed;
                    if (unit.isPlayer) {
                        this.eBaseHp -= unit.dmg;
                        this._spawnDmgNumber(BASE_X_ENEMY + 25, 250, unit.dmg);
                    } else {
                        this.pBaseHp -= unit.dmg;
                        this._spawnDmgNumber(BASE_X_PLAYER + 25, 250, unit.dmg);
                    }
                    AudioManager.play('hit');
                    unit.animTimer = 0;
                }
            } else {
                // Move toward enemy
                const dir = unit.isPlayer ? 1 : -1;
                unit.x += dir * unit.moveSpeed * dt;
                // Clamp to battlefield
                unit.x = Math.max(BATTLE_LEFT + 10, Math.min(BATTLE_RIGHT - 10, unit.x));
            }
        };
        for (const unit of this.pUnits) processUnit(unit);
        for (const unit of this.eUnits) processUnit(unit);
    }

    _killUnit(unit) {
        const arr = unit.isPlayer ? this.pUnits : this.eUnits;
        const idx = arr.indexOf(unit);
        if (idx >= 0) arr.splice(idx, 1);

        // Rewards
        if (unit.isPlayer) {
            this.eGold += Math.floor(unit.cost * 0.5);
            this.eXP += Math.floor(unit.cost * 0.8);
        } else {
            this.pGold += Math.floor(unit.cost * 0.5);
            this.pXP += Math.floor(unit.cost * 0.8);
            SaveManager.updateStats('unitsKilled', 1);
            SaveManager.updateStats('goldEarned', Math.floor(unit.cost * 0.5));
        }

        // Death particles
        for (let i = 0; i < 6 && this.particles.length < MAX_PARTICLES; i++) {
            this.particles.push({
                x: unit.x, y: unit.y, vx: (Math.random()-0.5)*100, vy: -50 - Math.random()*80,
                life: 0.5, maxLife: 0.5, color: unit.isPlayer ? '#4488ff' : '#ff4444', size: 3
            });
        }
        AudioManager.play('die');
    }

    _updateProjectiles(dt) {
        for (const arr of [this.pProjectiles, this.eProjectiles]) {
            for (let i = arr.length - 1; i >= 0; i--) {
                const p = arr[i];
                p.x += p.vx * dt; p.y += p.vy * dt;
                p.life -= dt;

                // Check collision with enemies
                const enemies = p.isPlayer ? this.eUnits : this.pUnits;
                let hit = false;
                for (const e of enemies) {
                    if (Math.abs(e.x - p.x) < e.size + 5 && Math.abs(e.y - p.y) < e.size + 5) {
                        e.hp -= p.dmg;
                        e.hitFlash = 1;
                        this._spawnDmgNumber(e.x, e.y - 20, p.dmg);
                        if (p.splash > 0) {
                            // Splash damage
                            for (const e2 of enemies) {
                                if (e2 !== e && Math.abs(e2.x - p.x) < p.splash) {
                                    e2.hp -= Math.floor(p.dmg * 0.5);
                                    e2.hitFlash = 1;
                                }
                            }
                            this._spawnExplosion(p.x, p.y, p.splash);
                        }
                        if (e.hp <= 0) this._killUnit(e);
                        hit = true; break;
                    }
                }

                // Check collision with base
                if (!hit) {
                    const baseX = p.isPlayer ? BASE_X_ENEMY : BASE_X_PLAYER;
                    if (Math.abs(p.x - baseX) < 30 && p.y > 200 && p.y < 380) {
                        if (p.isPlayer) this.eBaseHp -= p.dmg;
                        else this.pBaseHp -= p.dmg;
                        this._spawnDmgNumber(baseX + 25, 250, p.dmg);
                        hit = true;
                    }
                }

                if (hit || p.life <= 0 || p.x < 0 || p.x > W) {
                    arr.splice(i, 1);
                }
            }
        }
    }

    _spawnDmgNumber(x, y, dmg) {
        this.particles.push({
            x, y, vx: 0, vy: -40, life: 0.8, maxLife: 0.8,
            color: '#ffcc00', size: 0, text: '-' + dmg, type: 'text'
        });
    }

    _spawnExplosion(x, y, radius) {
        for (let i = 0; i < 10 && this.particles.length < MAX_PARTICLES; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 100;
            this.particles.push({
                x, y, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed,
                life: 0.4, maxLife: 0.4, color: '#ff8800', size: 3 + Math.random()*3
            });
        }
        AudioManager.play('explosion');
    }

    _updateParticles(dt) {
        let write = 0;
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            p.x += p.vx * dt; p.y += p.vy * dt;
            if (p.type !== 'text') p.vy += 150 * dt;
            p.life -= dt;
            if (p.life > 0) this.particles[write++] = p;
        }
        this.particles.length = write;
    }

    _checkWinLose() {
        if (this.pBaseHp <= 0) {
            this.state = GS.DEFEAT;
            SaveManager.updateStats('gamesPlayed', 1);
            SaveManager.setBestSurvival(Math.floor(this.gameTime));
            AudioManager.play('defeat');
        }
        if (this.eBaseHp <= 0) {
            this.state = GS.VICTORY;
            SaveManager.updateStats('gamesPlayed', 1);
            SaveManager.updateStats('gamesWon', 1);
            if (this.mode === 'campaign') SaveManager.setCampaignProgress(this.stage + 1);
            SaveManager.setBestSurvival(Math.floor(this.gameTime));
            AudioManager.play('victory');
            // Check achievements
            if (this.pAge >= 1) SaveManager.unlockAchievement('medieval');
            if (this.pAge >= 4) SaveManager.unlockAchievement('future');
            const s = SaveManager.load().stats;
            if (s.gamesWon >= 10) SaveManager.unlockAchievement('win10');
            if (s.gamesWon >= 100) SaveManager.unlockAchievement('win100');
            if (s.unitsKilled >= 1000) SaveManager.unlockAchievement('kill1000');
        }
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
        try { this._update(dt); this._render(); } catch(e) { console.error('Age of War error:', e); }
    }

    _update(dt) {
        if (this.state !== GS.PLAYING) return;
        this.gameTime += dt;

        // Player income
        const pIncome = BASE_INCOME + this.pUpgrades.income * UPGRADE_DEFS.income.effect;
        this.pGold += pIncome * dt;

        // Turret cooldowns & auto-fire
        this.pTurretCooldown -= dt;
        this.eTurretCooldown -= dt;
        this._autoFireTurret(true);
        this._autoFireTurret(false);

        this._updateAI(dt);
        this._updateUnits(dt);
        this._updateProjectiles(dt);
        this._updateParticles(dt);
        this._checkWinLose();
    }

    // ─── Rendering ───
    _render() {
        const ctx = this.ctx;

        if (this.state === GS.MENU) { this._renderMenu(ctx); return; }
        if (this.state === GS.STATS) { this._renderStats(ctx); return; }
        if (this.state === GS.SETTINGS) { this._renderSettings(ctx); return; }

        // Background
        Renderer.drawBackground(ctx, this.pAge, this.gameTime);

        // Bases
        const pTier = this.pUpgrades.turret > 0 ? TURRET_TIERS[Math.min(this.pAge, this.pUpgrades.turret-1)] : null;
        const eTier = this.eUpgrades.turret > 0 ? TURRET_TIERS[Math.min(this.eAge, this.eUpgrades.turret-1)] : null;
        Renderer.drawBase(ctx, BASE_X_PLAYER, true, this.pAge, this.pBaseHp, this.pBaseMaxHp, this.pTurretCooldown, pTier, this.pUpgrades.turret);
        Renderer.drawBase(ctx, BASE_X_ENEMY, false, this.eAge, this.eBaseHp, this.eBaseMaxHp, this.eTurretCooldown, eTier, this.eUpgrades.turret);

        // Units
        const allUnits = [...this.pUnits, ...this.eUnits];
        allUnits.sort((a, b) => a.y - b.y);
        for (const u of allUnits) {
            Renderer.drawUnit(ctx, u, this.gameTime);
        }

        // Projectiles
        for (const p of this.pProjectiles) Renderer.drawProjectile(ctx, p, this.pAge);
        for (const p of this.eProjectiles) Renderer.drawProjectile(ctx, p, this.eAge);

        // Particles
        for (const p of this.particles) Renderer.drawParticle(ctx, p);

        this._renderUI(ctx);

        if (this.state === GS.PAUSED) this._renderPause(ctx);
        if (this.state === GS.VICTORY) this._renderEndScreen(ctx, true);
        if (this.state === GS.DEFEAT) this._renderEndScreen(ctx, false);
    }

    _renderUI(ctx) {
        // Top bar
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, W, 30);

        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 13px Orbitron, monospace';
        ctx.textAlign = 'left';
        ctx.fillText('💰 ' + Math.floor(this.pGold), 10, 20);

        ctx.fillStyle = '#88ccff';
        ctx.font = '12px Rajdhani, sans-serif';
        ctx.fillText('XP: ' + Math.floor(this.pXP) + '/' + (this.pAge < 4 ? AGE_DEFS[this.pAge+1].xpRequired : 'MAX'), 100, 20);

        ctx.fillStyle = '#ccc';
        ctx.fillText(AGE_DEFS[this.pAge].name, 250, 20);

        // Income/sec
        const inc = BASE_INCOME + this.pUpgrades.income * UPGRADE_DEFS.income.effect;
        ctx.fillStyle = '#88ff88';
        ctx.fillText('+' + inc + '/s', 370, 20);

        // Game time
        const mins = Math.floor(this.gameTime / 60);
        const secs = Math.floor(this.gameTime % 60);
        ctx.fillStyle = '#aaa';
        ctx.textAlign = 'right';
        ctx.fillText(String(mins).padStart(2,'0') + ':' + String(secs).padStart(2,'0'), W - 10, 20);

        // Bottom bar: Unit buttons
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 420, W, 80);

        const units = AGE_UNITS[this.pAge];
        const btnW = 80;
        for (let i = 0; i < units.length; i++) {
            const def = UNIT_DEFS[units[i]];
            const bx = 10 + i * (btnW + 6);
            const canAfford = this.pGold >= def.cost;

            ctx.fillStyle = canAfford ? 'rgba(68,136,255,0.3)' : 'rgba(100,100,100,0.2)';
            ctx.fillRect(bx, 425, btnW, 38);
            ctx.strokeStyle = canAfford ? '#4488ff' : '#444';
            ctx.lineWidth = 1;
            ctx.strokeRect(bx, 425, btnW, 38);

            ctx.fillStyle = canAfford ? '#fff' : '#666';
            ctx.font = 'bold 11px Rajdhani, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(def.name, bx + btnW/2, 440);
            ctx.fillStyle = canAfford ? '#ffcc00' : '#555';
            ctx.font = '10px Rajdhani, sans-serif';
            ctx.fillText('💰' + def.cost, bx + btnW/2, 456);

            // Key hint
            ctx.fillStyle = '#555';
            ctx.font = '9px Rajdhani, sans-serif';
            ctx.fillText('[' + (i+1) + ']', bx + btnW/2, 463);
        }

        // Upgrade buttons
        const upgKeys = Object.keys(UPGRADE_DEFS);
        const ubW = 75;
        for (let i = 0; i < upgKeys.length; i++) {
            const def = UPGRADE_DEFS[upgKeys[i]];
            const lv = this.pUpgrades[upgKeys[i]];
            const bx = 10 + i * (ubW + 4);
            const maxed = lv >= def.maxLv;

            // Turret: also check age cap
            let ageBlocked = false;
            let cost = maxed ? 0 : def.costs[lv];
            if (upgKeys[i] === 'turret' && !maxed && lv >= this.pAge + 1) {
                ageBlocked = true;
                cost = def.costs[lv];
            }
            const canAfford = !maxed && !ageBlocked && this.pGold >= cost;

            ctx.fillStyle = maxed ? 'rgba(68,204,68,0.2)' : canAfford ? 'rgba(255,204,0,0.2)' : 'rgba(100,100,100,0.15)';
            ctx.fillRect(bx, 472, ubW, 26);
            ctx.strokeStyle = maxed ? '#4c4' : canAfford ? '#cc0' : '#333';
            ctx.lineWidth = 1;
            ctx.strokeRect(bx, 472, ubW, 26);

            ctx.fillStyle = maxed ? '#4c4' : ageBlocked ? '#664' : '#ccc';
            ctx.font = '10px Rajdhani, sans-serif';
            ctx.textAlign = 'center';
            // Turret: show tier name instead of generic name
            let label = def.icon + ' ' + def.name + ' ' + lv + '/' + def.maxLv;
            if (upgKeys[i] === 'turret') {
                if (lv === 0) label = def.icon + ' Mua Pháo';
                else label = def.icon + ' ' + TURRET_TIERS[Math.min(this.pAge, lv-1)].name + ' ' + lv + '/' + def.maxLv;
            }
            ctx.fillText(label, bx + ubW/2, 484);
            if (!maxed) {
                ctx.fillStyle = canAfford ? '#ffcc00' : ageBlocked ? '#553' : '#555';
                ctx.font = '9px Rajdhani, sans-serif';
                ctx.fillText('💰' + cost + (ageBlocked ? ' (cần tuổi ' + AGE_DEFS[lv].name + ')' : ''), bx + ubW/2, 496);
            }
        }

        // Age advance button
        const canAdvance = this.pAge < 4 && this.pXP >= AGE_DEFS[this.pAge+1].xpRequired;
        ctx.fillStyle = canAdvance ? 'rgba(168,85,247,0.3)' : 'rgba(100,100,100,0.15)';
        ctx.fillRect(W-140, 472, 130, 26);
        ctx.strokeStyle = canAdvance ? '#a855f7' : '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(W-140, 472, 130, 26);
        ctx.fillStyle = canAdvance ? '#a855f7' : '#555';
        ctx.font = 'bold 11px Rajdhani, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(canAdvance ? '⬆ TIẾN HÓA' : '⬆ ' + (this.pAge < 4 ? AGE_DEFS[this.pAge+1].xpRequired + ' XP' : 'MAX'), W-75, 488);

        // Enemy info
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(W-180, 32, 170, 20);
        ctx.fillStyle = '#ff6666';
        ctx.font = '11px Rajdhani, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('Enemy: ' + AGE_DEFS[this.eAge].name + ' | 💰' + Math.floor(this.eGold), W-15, 46);

        // Turret range indicator (only when turret purchased)
        if (this.pUpgrades.turret > 0) {
            ctx.strokeStyle = 'rgba(255,255,100,0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(BASE_X_PLAYER + BASE_W, 280, TURRET_RANGE, -0.5, 0.5);
            ctx.stroke();
            // Range label
            ctx.fillStyle = 'rgba(255,255,100,0.3)';
            ctx.font = '9px Rajdhani, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(TURRET_TIERS[Math.min(this.pAge, this.pUpgrades.turret-1)].name, BASE_X_PLAYER + BASE_W + TURRET_RANGE * 0.7, 240);
        }
    }

    _renderMenu(ctx) {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, W, H);
        const cx = W / 2;

        ctx.fillStyle = '#ff6600';
        ctx.font = 'bold 36px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('AGE OF WAR', cx, 70);
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 16px Orbitron, monospace';
        ctx.fillText('ULTIMATE EDITION', cx, 100);

        // Age icons
        ctx.font = '28px sans-serif';
        ctx.fillText('🪨 ⚔️ ⚙️ 🚁 🤖', cx, 145);

        // Mode buttons
        ctx.fillStyle = 'rgba(255,102,0,0.2)';
        ctx.fillRect(cx-120, 180, 240, 32);
        ctx.strokeStyle = '#ff6600'; ctx.lineWidth = 1; ctx.strokeRect(cx-120, 180, 240, 32);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Rajdhani, sans-serif';
        ctx.fillText('⚔️ CHIẾN DỊCH (Stage ' + (SaveManager.load().campaignProgress + 1) + ')', cx, 200);

        ctx.fillStyle = 'rgba(168,85,247,0.2)';
        ctx.fillRect(cx-120, 230, 240, 32);
        ctx.strokeStyle = '#a855f7'; ctx.strokeRect(cx-120, 230, 240, 32);
        ctx.fillStyle = '#fff';
        ctx.fillText('♾️ SINH TỒN', cx, 250);

        // Difficulty
        const diffs = ['easy','normal','hard','insane'];
        const diffLabels = ['Dễ','Thường','Khó','Điên'];
        for (let i = 0; i < 4; i++) {
            const bx = cx - 120 + i * 62;
            const sel = this.difficulty === diffs[i];
            ctx.fillStyle = sel ? 'rgba(255,204,0,0.3)' : 'rgba(255,255,255,0.05)';
            ctx.fillRect(bx, 300, 58, 28);
            ctx.strokeStyle = sel ? '#ffcc00' : '#444'; ctx.strokeRect(bx, 300, 58, 28);
            ctx.fillStyle = sel ? '#ffcc00' : '#888';
            ctx.font = '12px Rajdhani, sans-serif';
            ctx.fillText(diffLabels[i], bx + 29, 317);
        }

        // Stats & Settings
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(cx-120, 360, 240, 28);
        ctx.strokeStyle = '#444'; ctx.strokeRect(cx-120, 360, 240, 28);
        ctx.fillStyle = '#888'; ctx.font = '13px Rajdhani, sans-serif';
        ctx.fillText('📊 THỐNG KÊ', cx, 378);

        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(cx-120, 400, 240, 28);
        ctx.strokeStyle = '#444'; ctx.strokeRect(cx-120, 400, 240, 28);
        ctx.fillStyle = '#888';
        ctx.fillText('⚙ CÀI ĐẶT', cx, 418);

        // Best survival
        ctx.fillStyle = '#555';
        ctx.font = '11px Rajdhani, sans-serif';
        ctx.fillText('Kỷ lục sinh tồn: ' + SaveManager.load().bestSurvival + 's', cx, 460);
    }

    _renderStats(ctx) {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, W, H);
        const cx = W / 2, stats = SaveManager.load().stats;
        ctx.fillStyle = '#ff6600'; ctx.font = 'bold 22px Orbitron, monospace'; ctx.textAlign = 'center';
        ctx.fillText('THỐNG KÊ', cx, 40);
        const items = [['Ván chơi',stats.gamesPlayed],['Ván thắng',stats.gamesWon],['Tỷ lệ thắng',stats.gamesPlayed?Math.round(stats.gamesWon/stats.gamesPlayed*100)+'%':'—'],['Quân đã tạo',stats.unitsSpawned],['Quân đã giết',stats.unitsKilled],['Vàng kiếm',stats.goldEarned],['Tuổi cao nhất',stats.highestAge?AGE_DEFS[stats.highestAge].name:'—'],['Kỷ lục sinh tồn',SaveManager.load().bestSurvival+'s']];
        ctx.textAlign = 'left';
        items.forEach(([l,v],i) => {
            ctx.fillStyle = '#888'; ctx.font = '13px Rajdhani, sans-serif'; ctx.fillText(l, 120, 80+i*30);
            ctx.fillStyle = '#fff'; ctx.font = 'bold 13px Rajdhani, sans-serif'; ctx.textAlign = 'right'; ctx.fillText(String(v), W-120, 80+i*30); ctx.textAlign = 'left';
        });
        ctx.fillStyle = '#555'; ctx.font = '12px Rajdhani, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Nhấn ESC hoặc click để quay lại', cx, 460);
    }

    _renderSettings(ctx) {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, W, H);
        const cx = W / 2, s = SaveManager.load().settings;
        ctx.fillStyle = '#ff6600'; ctx.font = 'bold 22px Orbitron, monospace'; ctx.textAlign = 'center';
        ctx.fillText('CÀI ĐẶT', cx, 40);
        ctx.fillStyle = '#fff'; ctx.font = '14px Rajdhani, sans-serif';
        ctx.fillText('Âm thanh: ' + (s.soundEnabled ? 'BẬT' : 'TẮT') + ' (nhấn S)', cx, 100);
        ctx.fillText('Độ khó: ' + this.difficulty, cx, 130);
        ctx.fillStyle = '#555'; ctx.font = '12px Rajdhani, sans-serif';
        ctx.fillText('Nhấn ESC để quay lại', cx, 460);
    }

    _renderPause(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 24px Orbitron, monospace'; ctx.textAlign = 'center';
        ctx.fillText('TẠM DỪNG', W/2, H/2-10);
        ctx.fillStyle = '#aaa'; ctx.font = '14px Rajdhani, sans-serif';
        ctx.fillText('Nhấn để tiếp tục', W/2, H/2+15);
    }

    _renderEndScreen(ctx, isVictory) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center';
        ctx.fillStyle = isVictory ? '#4caf50' : '#f44336';
        ctx.font = 'bold 30px Orbitron, monospace';
        ctx.fillText(isVictory ? 'CHIẾN THẮNG!' : 'THẤT BẠI!', W/2, H/2-60);
        ctx.fillStyle = '#fff'; ctx.font = '15px Rajdhani, sans-serif';
        ctx.fillText('Thời gian: ' + Math.floor(this.gameTime) + 's', W/2, H/2-15);
        ctx.fillText('Tuổi đạt được: ' + AGE_DEFS[this.pAge].name, W/2, H/2+10);
        ctx.fillText('Quân đã giết: ' + (SaveManager.load().stats.unitsKilled || 0), W/2, H/2+35);
        ctx.fillStyle = '#ffcc00'; ctx.font = 'bold 13px Orbitron, monospace';
        ctx.fillText('[ NHẤP ĐỂ TIẾP TỤC ]', W/2, H/2+80);
    }
}

window.addEventListener('load', () => { new AgeOfWar(); });
