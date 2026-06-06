/**
 * Cyber Survivor Phase 3 - Complete Game
 * Characters, Pets, Ultimates, Relics, Endgame Modes, Daily Challenges
 */
const GS = { MENU:'menu', CHARSELECT:'charselect', PLAYING:'playing', LEVELUP:'levelup', PAUSED:'paused', GAMEOVER:'gameover', META:'meta' };

class CyberSurvivor {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = W; this.canvas.height = H;
        this.state = GS.MENU;
        this.lastTime = 0;
        this.enemyPool = []; this.projPool = []; this.xpPool = []; this.particlePool = [];
        this.activeEnemies = []; this.activeProjs = []; this.activeXp = []; this.activeParticles = [];
        this.camX = 0; this.camY = 0;
        this.joystick = { active:false, startX:0, startY:0, dx:0, dy:0 };
        this.keys = {};
        this.selectedChar = 'vanguard';
        this.selectedMode = 'normal';
        this.dailyMods = getDailyModifiers();
        this._setupInput();
        this._gameLoop(performance.now());
    }

    _initGame() {
        const meta = SaveManager.load().meta;
        const charDef = CHARACTERS[this.selectedChar];
        const relicBonuses = this._getRelicBonuses();

        this.player = {
            x:0, y:0,
            hp: (PLAYER_BASE.hp + (meta.health||0)*10) * charDef.hpMul + (relicBonuses.maxHp||0),
            maxHp: (PLAYER_BASE.hp + (meta.health||0)*10) * charDef.hpMul + (relicBonuses.maxHp||0),
            speed: PLAYER_BASE.speed * charDef.spdMul * (1 + (relicBonuses.moveSpeed||0)),
            damage: PLAYER_BASE.damage * charDef.dmgMul * (1 + (meta.damage||0)*0.05 + (relicBonuses.damage||0)),
            atkSpeed: PLAYER_BASE.atkSpeed,
            critChance: PLAYER_BASE.critChance + (meta.critChance||0)*0.03 + charDef.critAdd + (relicBonuses.critChance||0),
            projCount: PLAYER_BASE.projCount,
            projSpeed: PLAYER_BASE.projSpeed,
            atkRange: PLAYER_BASE.atkRange + (meta.pickup||0)*15,
            pickupRange: 80 + (meta.pickup||0)*12 + (relicBonuses.pickup||0),
            xpMul: 1 + (meta.xpGain||0)*0.10 + (relicBonuses.xpGain||0),
            cdMul: charDef.cdMul,
            level:1, xp:0, xpNext:xpForLevel(1),
            kills:0, time:0, invTimer:0,
            weapons:{}, passives:{}, evolved:{},
            dmgMul:1, atkSpeedMul:1, moveMul:1,
            charKey: this.selectedChar,
            mode: this.selectedMode,
            ultimateCharge:0, ultimateActive:false, ultimateTimer:0,
            petLevels:{}
        };
        // Starting weapon
        this.player.weapons[charDef.startWeapon] = { lv:1, cd:0 };

        // Daily modifiers
        for (const mod of this.dailyMods) {
            if (mod.effect === 'halfHp') { this.player.hp *= 0.5; this.player.maxHp *= 0.5; }
            if (mod.effect === 'infiniteCrit') this.player.critChance = 1;
        }

        // Pets from relics
        this.pets = [];
        if (SaveManager.isRelicUnlocked('ancientCore')) this.pets.push({ type:'attack', lv:1, angle:0 });
        if (SaveManager.isRelicUnlocked('neuralMatrix')) this.pets.push({ type:'xp', lv:1, angle:Math.PI });

        this.activeEnemies = []; this.activeProjs = []; this.activeXp = []; this.activeParticles = [];
        this.spawnTimer = 0;
        this.bossTimers = {};
        Object.keys(BOSS_TYPES).forEach(k => this.bossTimers[k] = false);
        this.upgradeChoices = [];
        this.eventTimer = 60 + Math.random()*30;
        this.activeEvent = null; this.eventTimerLeft = 0;
        this.beamTargets = []; this.orbitAngle = 0; this.sawAngle = 0;
        this.nightmareMult = this.selectedMode === 'nightmare' ? 2 : 1;
        // Damage tracking
        this.damageStats = {};
        this.totalDamage = 0;
        this.state = GS.PLAYING;
    }

    _getRelicBonuses() {
        const bonuses = {};
        for (const key of RELIC_ORDER) {
            if (SaveManager.isRelicUnlocked(key)) {
                const relic = RELICS[key];
                bonuses[relic.effect] = (bonuses[relic.effect] || 0) + relic.value;
            }
        }
        return bonuses;
    }

    _setupInput() {
        this.canvas.addEventListener('click', e => {
            AudioManager.init(); AudioManager.resume();
            const r = this.canvas.getBoundingClientRect();
            this._handleClick((e.clientX-r.left)*(W/r.width), (e.clientY-r.top)*(H/r.height));
        });
        this.canvas.addEventListener('touchstart', e => {
            e.preventDefault(); AudioManager.init(); AudioManager.resume();
            const t = e.touches[0], r = this.canvas.getBoundingClientRect();
            const x = (t.clientX-r.left)*(W/r.width), y = (t.clientY-r.top)*(H/r.height);
            if (x < W/2 && this.state === GS.PLAYING) {
                this.joystick.active = true;
                this.joystick.startX = x; this.joystick.startY = y;
                this.joystick.dx = 0; this.joystick.dy = 0;
            }
            this._handleClick(x, y);
        }, {passive:false});
        this.canvas.addEventListener('touchmove', e => {
            e.preventDefault();
            if (this.joystick.active) {
                const t = e.touches[0], r = this.canvas.getBoundingClientRect();
                this.joystick.dx = (t.clientX-r.left)*(W/r.width) - this.joystick.startX;
                this.joystick.dy = (t.clientY-r.top)*(H/r.height) - this.joystick.startY;
            }
        }, {passive:false});
        this.canvas.addEventListener('touchend', e => {
            e.preventDefault();
            this.joystick.active = false; this.joystick.dx = 0; this.joystick.dy = 0;
        }, {passive:false});
        document.addEventListener('keydown', e => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key === 'Escape') {
                if (this.state === GS.PLAYING) this.state = GS.PAUSED;
                else if (this.state === GS.PAUSED) this.state = GS.PLAYING;
            }
            if (e.key === 'q' || e.key === 'Q') this._activateUltimate();
            if (this.state === GS.LEVELUP) {
                const n = parseInt(e.key);
                if (n >= 1 && n <= 3) this._selectUpgrade(n-1);
            }
        });
        document.addEventListener('keyup', e => { this.keys[e.key.toLowerCase()] = false; });
    }

    _handleClick(x, y) {
        if (this.state === GS.MENU) {
            if (x>=W/2-80 && x<=W/2+80) {
                if (y>=220 && y<=255) this.state = GS.CHARSELECT;
                if (y>=270 && y<=305) this.state = GS.META;
            }
            return;
        }
        if (this.state === GS.CHARSELECT) {
            // Character cards
            for (let i = 0; i < CHAR_ORDER.length; i++) {
                const bx = 30 + (i % 4) * 190, by = 80 + Math.floor(i / 4) * 120;
                if (x>=bx && x<=bx+175 && y>=by && y<=by+100 && SaveManager.isCharUnlocked(CHAR_ORDER[i])) {
                    this.selectedChar = CHAR_ORDER[i];
                    AudioManager.play('xpCollect');
                }
            }
            // Mode buttons
            for (let i = 0; i < MODE_ORDER.length; i++) {
                const bx = W/2-200+i*82, by = H-90;
                if (x>=bx && x<=bx+78 && y>=by && y<=by+30) {
                    this.selectedMode = MODE_ORDER[i];
                    AudioManager.play('xpCollect');
                }
            }
            // Start
            if (x>=W/2-60 && x<=W/2+60 && y>=H-50 && y<=H-20) {
                this._initGame();
            }
            // Back
            if (x>=10 && x<=60 && y>=10 && y<=35) this.state = GS.MENU;
            return;
        }
        if (this.state === GS.META) {
            if (x>=W/2-50 && x<=W/2+50 && y>=H-50 && y<=H-20) { this.state = GS.MENU; return; }
            for (let i=0; i<META_ORDER.length; i++) {
                const bx = W/2-150, by = 120+i*55;
                if (x>=bx && x<=bx+300 && y>=by && y<=by+45) {
                    if (SaveManager.buyMetaUpgrade(META_ORDER[i])) AudioManager.play('metaUpgrade');
                    return;
                }
            }
            return;
        }
        if (this.state === GS.GAMEOVER) {
            if (x>=W/2-80 && x<=W/2+80 && y>=380 && y<=415) this.state = GS.MENU;
            return;
        }
        if (this.state === GS.LEVELUP) {
            for (let i=0; i<this.upgradeChoices.length; i++) {
                const bx = W/2-130, by = 170+i*80;
                if (x>=bx && x<=bx+260 && y>=by && y<=by+65) { this._selectUpgrade(i); return; }
            }
            return;
        }
        if (this.state === GS.PAUSED) this.state = GS.PLAYING;
    }

    _selectUpgrade(i) {
        if (i >= this.upgradeChoices.length) return;
        const c = this.upgradeChoices[i];
        const p = this.player;
        if (c.type === 'weapon') {
            if (p.weapons[c.id]) p.weapons[c.id].lv = Math.min(p.weapons[c.id].lv + 1, WEAPONS[c.id]?.maxLv || 8);
            else if (Object.keys(p.weapons).length < MAX_WEAPONS) p.weapons[c.id] = { lv:1, cd:0 };
        } else if (c.type === 'passive') {
            if (p.passives[c.id]) p.passives[c.id] = Math.min(p.passives[c.id] + 1, PASSIVES[c.id].maxLv);
            else if (Object.keys(p.passives).length < MAX_PASSIVES) p.passives[c.id] = 1;
        } else if (c.type === 'pet') {
            if (this.pets.length < MAX_PETS && !this.pets.find(pt => pt.type === c.id)) {
                this.pets.push({ type:c.id, lv:1, angle: Math.random()*Math.PI*2 });
            }
        }
        this._checkEvolutions();
        this._applyPassives();
        this.state = GS.PLAYING;
        AudioManager.play('levelUp');
    }

    _checkEvolutions() {
        const p = this.player;
        for (const [evoId, evo] of Object.entries(EVOLUTIONS)) {
            const wDef = Object.entries(WEAPONS).find(([k,v]) => v.evoTo === evoId);
            if (!wDef) continue;
            const [wKey] = wDef;
            if (p.weapons[wKey] && p.weapons[wKey].lv >= WEAPONS[wKey].maxLv &&
                p.passives[WEAPONS[wKey].evolve] && p.passives[WEAPONS[wKey].evolve] >= PASSIVES[WEAPONS[wKey].evolve].maxLv) {
                if (!p.evolved[evoId]) {
                    p.evolved[evoId] = true;
                    delete p.weapons[wKey];
                    delete p.passives[WEAPONS[wKey].evolve];
                    p.weapons[evoId] = { lv:1, cd:0 };
                    AudioManager.play('evolve');
                    for (let i=0; i<30; i++) {
                        const angle = Math.random()*Math.PI*2, spd = 80+Math.random()*200;
                        const pt = this._getParticle();
                        Object.assign(pt, { x:p.x, y:p.y, vx:Math.cos(angle)*spd, vy:Math.sin(angle)*spd,
                            life:0.8, maxLife:0.8, type:'circle', color:'#FFD700', size:4+Math.random()*4 });
                    }
                }
            }
        }
    }

    _applyPassives() {
        const p = this.player;
        p.dmgMul = 1 + (p.passives.damage||0) * 0.15;
        p.atkSpeedMul = 1 + (p.passives.atkSpeed||0) * 0.12;
        p.moveMul = 1 + (p.passives.moveSpeed||0) * 0.08;
        p.critChance = PLAYER_BASE.critChance + (p.passives.critChance||0)*0.05 + SaveManager.getMetaBonus('critChance')*0.03 + CHARACTERS[p.charKey].critAdd;
        p.pickupRange = 80 + (p.passives.magnet||0)*20 + SaveManager.getMetaBonus('pickup')*12;
        p.maxHp = (PLAYER_BASE.hp + (p.passives.maxHp||0)*20 + SaveManager.getMetaBonus('health')*10) * CHARACTERS[p.charKey].hpMul;
    }

    _trackDamage(weaponKey, damage) {
        this.damageStats[weaponKey] = (this.damageStats[weaponKey] || 0) + damage;
        this.totalDamage += damage;
    }
        p.xpMul = 1 + (p.passives.xpGain||0)*0.15 + SaveManager.getMetaBonus('xpGain')*0.10;
        p.projCount = PLAYER_BASE.projCount + (p.passives.projCount||0);
    }

    _showLevelUp() {
        this.state = GS.LEVELUP;
        const p = this.player;
        const choices = [];

        // Existing weapon upgrades
        for (const [wk, wv] of Object.entries(p.weapons)) {
            const def = WEAPONS[wk] || EVOLUTIONS[wk];
            if (def && wv.lv < (def.maxLv||8)) {
                const rarity = getRarity();
                const syn = SYNERGIES[wk] || [];
                choices.push({
                    type:'weapon', id:wk, rarity,
                    name:def.name, curLv:wv.lv, nextLv:wv.lv+1,
                    icon:def.icon, role:def.role||'',
                    tags:def.tags||[], strong:def.strong||'', weak:def.weak||'',
                    synergies:syn.map(s => PASSIVES[s]?.icon||s).join(' '),
                    desc:'+'+Math.floor((def.dmg||10)*0.15)+' DMG mỗi cấp'
                });
            }
        }

        // New weapons
        for (const wk of WEAPON_ORDER) {
            if (!p.weapons[wk] && Object.keys(p.weapons).length < MAX_WEAPONS) {
                const def = WEAPONS[wk];
                const rarity = getRarity();
                const syn = SYNERGIES[wk] || [];
                choices.push({
                    type:'weapon', id:wk, rarity,
                    name:def.name, curLv:0, nextLv:1,
                    icon:def.icon, role:def.role||'',
                    tags:def.tags||[], strong:def.strong||'', weak:def.weak||'',
                    synergies:syn.map(s => PASSIVES[s]?.icon||s).join(' '),
                    desc:'Vũ khí mới'
                });
            }
        }

        // Passive upgrades
        for (const [pk, pv] of Object.entries(p.passives)) {
            if (pv < PASSIVES[pk].maxLv) {
                choices.push({
                    type:'passive', id:pk, rarity:'common',
                    name:PASSIVES[pk].name, curLv:pv, nextLv:pv+1,
                    icon:PASSIVES[pk].icon, role:'Passive',
                    tags:PASSIVES[pk].tags||[], strong:'', weak:'',
                    synergies:'', desc:PASSIVES[pk].desc
                });
            }
        }

        // New passives
        for (const pk of PASSIVE_ORDER) {
            if (!p.passives[pk] && Object.keys(p.passives).length < MAX_PASSIVES) {
                choices.push({
                    type:'passive', id:pk, rarity:'common',
                    name:PASSIVES[pk].name, curLv:0, nextLv:1,
                    icon:PASSIVES[pk].icon, role:'Passive',
                    tags:PASSIVES[pk].tags||[], strong:'', weak:'',
                    synergies:'', desc:PASSIVES[pk].desc
                });
            }
        }

        // Pets
        for (const pk of PET_ORDER) {
            if (!this.pets.find(pt => pt.type === pk) && this.pets.length < MAX_PETS) {
                choices.push({
                    type:'pet', id:pk, rarity:'rare',
                    name:PETS[pk].name, curLv:0, nextLv:1,
                    icon:PETS[pk].icon, role:'Pet',
                    tags:['Companion'], strong:PETS[pk].desc, weak:'',
                    synergies:'', desc:PETS[pk].desc
                });
            }
        }

        // Shuffle
        for (let i = choices.length - 1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [choices[i],choices[j]] = [choices[j],choices[i]]; }
        this.upgradeChoices = choices.slice(0, 3);
        if (!this.upgradeChoices.length) this.state = GS.PLAYING;
    }

    _activateUltimate() {
        const p = this.player;
        if (p.ultimateActive || p.ultimateCharge < 100) return;
        const ult = ULTIMATES[p.charKey];
        if (!ult) return;
        p.ultimateCharge = 0;
        p.ultimateActive = true;
        p.ultimateTimer = ult.dur || 0;
        AudioManager.play('evolve');
        // Effects
        if (ult.effect === 'nova') {
            for (const e of this.activeEnemies) {
                const d = Math.sqrt((e.x-p.x)**2+(e.y-p.y)**2);
                if (d < ult.radius) { e.hp -= ult.dmg; if (e.hp <= 0) this._killEnemy(e); }
            }
            this._spawnExplosion(p.x, p.y, '#00E5FF', ult.radius);
        }
        if (ult.effect === 'xpSurge') {
            p.xp += ult.xpAmount;
            while (p.xp >= p.xpNext) { p.xp -= p.xpNext; p.level++; p.xpNext = xpForLevel(p.level); this._showLevelUp(); }
        }
    }

    // ─── Pool helpers ───
    _getEnemy() { const e = this.enemyPool.pop() || {}; this.activeEnemies.push(e); return e; }
    _releaseEnemy(e) { const i = this.activeEnemies.indexOf(e); if (i>=0) { this.activeEnemies.splice(i,1); this.enemyPool.push(e); } }
    _getProj() { const p = this.projPool.pop() || {}; this.activeProjs.push(p); return p; }
    _releaseProj(p) { const i = this.activeProjs.indexOf(p); if (i>=0) { this.activeProjs.splice(i,1); this.projPool.push(p); } }
    _getXpOrb() { const o = this.xpPool.pop() || {}; this.activeXp.push(o); return o; }
    _releaseXp(o) { const i = this.activeXp.indexOf(o); if (i>=0) { this.activeXp.splice(i,1); this.xpPool.push(o); } }
    _getParticle() { const p = this.particlePool.pop() || {}; this.activeParticles.push(p); return p; }
    _releaseParticle(p) { const i = this.activeParticles.indexOf(p); if (i>=0) { this.activeParticles.splice(i,1); this.particlePool.push(p); } }

    _gameLoop(now) {
        requestAnimationFrame(t => this._gameLoop(t));
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
        if (p.invTimer > 0) p.invTimer -= dt;

        // Ultimate timer
        if (p.ultimateActive) {
            p.ultimateTimer -= dt;
            if (p.ultimateTimer <= 0) p.ultimateActive = false;
        }
        // Ultimate charge
        p.ultimateCharge = Math.min(100, p.ultimateCharge + ULTIMATES[p.charKey].chargeRate * dt * 1.5);

        // Movement
        let dx = 0, dy = 0;
        if (this.keys['w']||this.keys['arrowup']) dy -= 1;
        if (this.keys['s']||this.keys['arrowdown']) dy += 1;
        if (this.keys['a']||this.keys['arrowleft']) dx -= 1;
        if (this.keys['d']||this.keys['arrowright']) dx += 1;
        if (this.joystick.active) {
            const jLen = Math.sqrt(this.joystick.dx**2+this.joystick.dy**2);
            if (jLen > 10) { dx += this.joystick.dx/jLen; dy += this.joystick.dy/jLen; }
        }
        const len = Math.sqrt(dx*dx+dy*dy) || 1;
        if (dx||dy) { p.x += (dx/len)*p.speed*p.moveMul*dt; p.y += (dy/len)*p.speed*p.moveMul*dt; }

        // Weapon firing
        this._updateWeapons(dt);
        this.orbitAngle += dt * 3;
        this.sawAngle += dt * 5;

        // Spawn enemies
        const cfg = getSpawnConfig(p.time, p.mode);
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawnTimer = cfg.interval;
            const count = this.dailyMods.some(m => m.effect === 'doubleEnemies') ? 2 : 1;
            for (let i = 0; i < count; i++) {
                const type = cfg.types[Math.floor(Math.random()*cfg.types.length)];
                this._spawnEnemy(type);
            }
        }

        // Elite spawns
        if (p.time > 120 && Math.random() < (p.mode === 'nightmare' ? 0.005 : 0.002)) {
            const eliteKeys = Object.keys(ELITE_TYPES);
            this._spawnElite(eliteKeys[Math.floor(Math.random()*eliteKeys.length)]);
        }

        // Boss spawns
        for (const [bKey, bDef] of Object.entries(BOSS_TYPES)) {
            const bossTime = this.dailyMods.some(m => m.effect === 'bossRush') ? bDef.time * 0.3 : bDef.time;
            if (!this.bossTimers[bKey] && p.time >= bossTime) {
                this.bossTimers[bKey] = true;
                this._spawnBoss(bKey);
            }
        }

        this._updateEvents(dt);

        // Update enemies
        for (let i = this.activeEnemies.length-1; i >= 0; i--) {
            const e = this.activeEnemies[i];
            if (e.hitFlash > 0) e.hitFlash -= dt * 5;
            if (e.slowTimer > 0) e.slowTimer -= dt;
            if (e.stunTimer > 0) { e.stunTimer -= dt; continue; }

            if (e.isBoss) this._updateBoss(e, dt);

            const spd = (e.slowTimer > 0 ? e.speed * 0.3 : e.speed) * (p.ultimateActive && ULTIMATES[p.charKey].effect === 'timeSlow' ? 0.2 : 1);
            const edx = p.x - e.x, edy = p.y - e.y;
            const eDist = Math.sqrt(edx*edx+edy*edy) || 1;
            e.x += (edx/eDist)*spd*dt;
            e.y += (edy/eDist)*spd*dt;

            // Teleport
            if (e.teleport && Math.random() < 0.005) {
                e.x = p.x + (Math.random()-0.5)*200;
                e.y = p.y + (Math.random()-0.5)*200;
            }

            if (eDist < e.size + 14 && p.invTimer <= 0 && !e.isRanged) {
                let dmg = e.dmg * (1 - (p.passives.shield||0)*0.10);
                if (this.pets.find(pt => pt.type === 'shield') && Math.random() < 0.08) dmg = 0;
                if (dmg > 0) {
                    p.hp -= dmg; p.invTimer = 0.5;
                    AudioManager.play('playerHit');
                    if (p.hp <= 0) { this.state = GS.GAMEOVER; SaveManager.updateBest(Math.floor(p.time), p.kills, p.level, p.mode); AudioManager.play('gameOver'); return; }
                }
            }
            if (e.explode && eDist < 30) {
                p.hp -= e.dmg; p.invTimer = 0.5;
                this._spawnExplosion(e.x, e.y, '#FF8800', 30);
                this._releaseEnemy(e);
                AudioManager.play('explosion');
                if (p.hp <= 0) { this.state = GS.GAMEOVER; SaveManager.updateBest(Math.floor(p.time), p.kills, p.level, p.mode); AudioManager.play('gameOver'); return; }
            }
        }

        // Update projectiles
        for (let i = this.activeProjs.length-1; i >= 0; i--) {
            const proj = this.activeProjs[i];
            if (proj.homing && !proj.isEnemy) {
                let closest = null, closestD = Infinity;
                for (const e of this.activeEnemies) {
                    const d = (e.x-proj.x)**2+(e.y-proj.y)**2;
                    if (d < closestD) { closestD = d; closest = e; }
                }
                if (closest && closestD > 100) {
                    const dx = closest.x-proj.x, dy = closest.y-proj.y;
                    const d = Math.sqrt(dx*dx+dy*dy)||1;
                    proj.vx += (dx/d)*400*dt; proj.vy += (dy/d)*400*dt;
                    const s = Math.sqrt(proj.vx**2+proj.vy**2);
                    if (s > proj.speed) { proj.vx = (proj.vx/s)*proj.speed; proj.vy = (proj.vy/s)*proj.speed; }
                }
            }
            proj.x += proj.vx*dt; proj.y += proj.vy*dt;
            proj.life -= dt;
            if (proj.life > 0.1) {
                const pt = this._getParticle();
                Object.assign(pt, { x:proj.x, y:proj.y, vx:0, vy:0, life:0.12, maxLife:0.12, type:'circle', color:proj.trailColor||'#00E5FF', size:2 });
            }
            if (proj.isEnemy) {
                if ((proj.x-p.x)**2+(proj.y-p.y)**2 < 20*20 && p.invTimer <= 0) {
                    p.hp -= proj.damage; p.invTimer = 0.5;
                    this._releaseProj(proj);
                    if (p.hp <= 0) { this.state = GS.GAMEOVER; SaveManager.updateBest(Math.floor(p.time), p.kills, p.level, p.mode); AudioManager.play('gameOver'); return; }
                }
                if (proj.life <= 0) this._releaseProj(proj);
                continue;
            }
            let hit = false;
            for (const e of this.activeEnemies) {
                if ((e.x-proj.x)**2+(e.y-proj.y)**2 < (e.size+6)**2) {
                    if (e.reflect && Math.random() < 0.3) { proj.vx *= -1; proj.vy *= -1; proj.isEnemy = true; hit = true; break; }
                    const dmg = proj.crit ? proj.damage*2 : proj.damage;
                    e.hp -= dmg; e.hitFlash = 1;
                    if (proj.weaponKey) this._trackDamage(proj.weaponKey, dmg);
                    if (proj.slow) e.slowTimer = proj.slowDur||2;
                    if (proj.crit) AudioManager.play('crit'); else AudioManager.play('hit');
                    const pn = this._getParticle();
                    Object.assign(pn, { x:e.x, y:e.y-e.size-5, vx:0, vy:-40, life:0.5, maxLife:0.5, type:'text',
                        text:proj.crit?'💥'+Math.floor(dmg):'-'+Math.floor(dmg), color:proj.crit?'#FFD700':'#FFF' });
                    if (e.hp <= 0) this._killEnemy(e);
                    if (proj.explodeR) {
                        this._spawnExplosion(proj.x, proj.y, '#FF6600', proj.explodeR);
                        for (const e2 of this.activeEnemies) {
                            if (e2 !== e && (e2.x-proj.x)**2+(e2.y-proj.y)**2 < proj.explodeR**2) {
                                e2.hp -= proj.damage*0.6; if (e2.hp <= 0) this._killEnemy(e2);
                            }
                        }
                        AudioManager.play('explosion');
                    }
                    hit = true; break;
                }
            }
            if (hit || proj.life <= 0) this._releaseProj(proj);
        }

        // Orbit/Saw damage
        for (const [wk, wv] of Object.entries(p.weapons)) {
            const def = WEAPONS[wk] || EVOLUTIONS[wk];
            if (!def) continue;
            if (def.type === 'orbit' || def.type === 'saw') {
                const r = def.orbitR || def.sawR;
                for (const e of this.activeEnemies) {
                    const dx = e.x-p.x, dy = e.y-p.y;
                    if (dx*dx+dy*dy < (r+e.size)**2) {
                        e.hp -= def.dmg*p.dmgMul*wv.lv*0.3*dt;
                        if (e.hp <= 0) this._killEnemy(e);
                    }
                }
            }
        }

        // Pet behavior
        for (const pet of this.pets) {
            pet.angle += dt * 2;
            const petDef = PETS[pet.type];
            if (petDef.behavior === 'heal' && p.hp < p.maxHp) {
                p.hp = Math.min(p.maxHp, p.hp + petDef.healRate * pet.lv * dt);
            }
            if (petDef.behavior === 'attack' || petDef.behavior === 'missile') {
                pet.cd = (pet.cd || 0) - dt;
                if (pet.cd <= 0 && this.activeEnemies.length > 0) {
                    pet.cd = petDef.baseCd / pet.lv;
                    const closest = this._getNearestEnemies(1)[0];
                    if (closest) {
                        const dx = closest.x-p.x, dy = closest.y-p.y, d = Math.sqrt(dx*dx+dy*dy)||1;
                        const proj = this._getProj();
                        Object.assign(proj, { x:p.x, y:p.y, vx:(dx/d)*(petDef.behavior==='missile'?200:350), vy:(dy/d)*(petDef.behavior==='missile'?200:350),
                            damage:petDef.baseDmg*pet.lv, crit:false, life:1.5, homing:petDef.behavior==='missile', trailColor:'#FF8800' });
                    }
                }
            }
        }

        // XP orbs
        for (let i = this.activeXp.length-1; i >= 0; i--) {
            const o = this.activeXp[i];
            o.life -= dt;
            const dx = p.x-o.x, dy = p.y-o.y;
            const dist = Math.sqrt(dx*dx+dy*dy);
            let attractRange = p.pickupRange;
            const xpPet = this.pets.find(pt => pt.type === 'xp');
            if (xpPet) attractRange += PETS.xp.attractRange * xpPet.lv;
            if (dist < attractRange) {
                const pull = 350*(1-dist/attractRange);
                o.x += (dx/dist)*pull*dt; o.y += (dy/dist)*pull*dt;
            }
            if (dist < 20) {
                p.xp += Math.floor(o.value * p.xpMul * (this.activeEvent==='doubleXp'?2:1));
                AudioManager.play('xpCollect');
                this._releaseXp(o);
                while (p.xp >= p.xpNext) { p.xp -= p.xpNext; p.level++; p.xpNext = xpForLevel(p.level); this._showLevelUp(); }
            } else if (o.life <= 0) this._releaseXp(o);
        }

        // Particles
        for (let i = this.activeParticles.length-1; i >= 0; i--) {
            const pt = this.activeParticles[i];
            pt.x += pt.vx*dt; pt.y += pt.vy*dt;
            if (pt.type !== 'text') pt.vy += 100*dt;
            pt.life -= dt;
            if (pt.life <= 0) this._releaseParticle(pt);
        }

        this.camX += (p.x-W/2-this.camX)*0.1;
        this.camY += (p.y-H/2-this.camY)*0.1;
    }

    _updateWeapons(dt) {
        const p = this.player;
        const ult = ULTIMATES[p.charKey];
        const isStorm = p.ultimateActive && ult.effect === 'storm';
        const isOverdrive = p.ultimateActive && ult.effect === 'overdrive';

        for (const [wk, wv] of Object.entries(p.weapons)) {
            const def = WEAPONS[wk] || EVOLUTIONS[wk];
            if (!def) continue;
            const cd = (def.cd||0.5) / (p.atkSpeedMul * p.cdMul * (this.activeEvent==='overload'?2:1) * (isStorm?5:1));
            wv.cd -= dt;
            if (wv.cd > 0) continue;
            wv.cd = cd;

            const dmg = (def.dmg||10) * p.dmgMul * wv.lv * (this.activeEvent==='powerSurge'?2:1) * (isOverdrive?3:1);
            const crit = Math.random() < p.critChance;

            switch (def.type) {
                case 'proj': {
                    const targets = this._getNearestEnemies(p.projCount);
                    for (const t of targets) {
                        const dx = t.x-p.x, dy = t.y-p.y, d = Math.sqrt(dx*dx+dy*dy)||1;
                        const proj = this._getProj();
                        Object.assign(proj, { x:p.x, y:p.y, vx:(dx/d)*(def.projSpd||350), vy:(dy/d)*(def.projSpd||350),
                            damage:dmg, crit, life:1.5, slow:def.slow, slowDur:def.slowDur, explodeR:def.explodeR, homing:false, trailColor:'#00E5FF', weaponKey:wk });
                    }
                    AudioManager.play('shoot');
                    break;
                }
                case 'homing': {
                    for (let i=0; i<(def.projCount||2); i++) {
                        const angle = Math.random()*Math.PI*2;
                        const proj = this._getProj();
                        Object.assign(proj, { x:p.x, y:p.y, vx:Math.cos(angle)*50, vy:Math.sin(angle)*50,
                            damage:dmg, crit, life:3, speed:def.projSpd||250, homing:true, trailColor:'#FF44FF', weaponKey:wk });
                    }
                    AudioManager.play('missiles');
                    break;
                }
                case 'rocket': {
                    const targets = this._getNearestEnemies(1);
                    for (const t of targets) {
                        const dx = t.x-p.x, dy = t.y-p.y, d = Math.sqrt(dx*dx+dy*dy)||1;
                        const proj = this._getProj();
                        Object.assign(proj, { x:p.x, y:p.y, vx:(dx/d)*(def.projSpd||200), vy:(dy/d)*(def.projSpd||200),
                            damage:dmg, crit, life:2, explodeR:def.explodeR||80, homing:false, trailColor:'#FF6600', weaponKey:wk });
                    }
                    AudioManager.play('rocket');
                    break;
                }
                case 'beam': {
                    this.beamTargets = [];
                    const sorted = [...this.activeEnemies].sort((a,b) => ((a.x-p.x)**2+(a.y-p.y)**2)-((b.x-p.x)**2+(b.y-p.y)**2));
                    for (const e of sorted) {
                        if (Math.sqrt((e.x-p.x)**2+(e.y-p.y)**2) < (def.range||200)) {
                            this.beamTargets.push({ x:e.x, y:e.y });
                            const beamDmg = dmg * dt * 10;
                            e.hp -= beamDmg; e.hitFlash = 1;
                            this._trackDamage(wk, beamDmg);
                            if (e.hp <= 0) this._killEnemy(e);
                        }
                    }
                    if (this.beamTargets.length) AudioManager.play('laser');
                    break;
                }
                case 'chain': {
                    const targets = this._getNearestEnemies(1);
                    if (targets.length) {
                        let current = targets[0];
                        const hit = new Set([current]);
                        current.hp -= dmg; current.hitFlash = 1; current.stunTimer = 0.3;
                        this._trackDamage(wk, dmg);
                        if (current.hp <= 0) this._killEnemy(current);
                        for (let c = 0; c < (def.chainCount||3); c++) {
                            let closest = null, closestD = Infinity;
                            for (const e of this.activeEnemies) {
                                if (hit.has(e)) continue;
                                const d = (e.x-current.x)**2+(e.y-current.y)**2;
                                if (d < (def.chainR||120)**2 && d < closestD) { closestD = d; closest = e; }
                            }
                            if (!closest) break;
                            hit.add(closest);
                            const chainDmg = dmg*0.7;
                            closest.hp -= chainDmg; closest.hitFlash = 1; closest.stunTimer = 0.3;
                            this._trackDamage(wk, chainDmg);
                            if (closest.hp <= 0) this._killEnemy(closest);
                            current = closest;
                        }
                    }
                    AudioManager.play('lightning');
                    break;
                }
            }
        }
    }

    _getNearestEnemies(count) {
        const p = this.player;
        return [...this.activeEnemies].filter(e => !e.phase || Math.random() > 0.3)
            .sort((a,b) => ((a.x-p.x)**2+(a.y-p.y)**2)-((b.x-p.x)**2+(b.y-p.y)**2)).slice(0, count);
    }

    _spawnEnemy(type) {
        const p = this.player, def = ENEMY_TYPES[type];
        const angle = Math.random()*Math.PI*2, dist = 400+Math.random()*100;
        const e = this._getEnemy();
        const hpMult = this.nightmareMult * (this.selectedMode === 'endless' ? 1 + p.time/300 : 1);
        Object.assign(e, {
            x:p.x+Math.cos(angle)*dist, y:p.y+Math.sin(angle)*dist,
            hp:def.hp*hpMult, maxHp:def.hp*hpMult, speed:def.speed, dmg:def.dmg, xp:def.xp,
            size:def.size, type, color:def.color, hitFlash:0, slowTimer:0, stunTimer:0,
            isElite:false, isBoss:false, isRanged:def.ranged, explode:def.explode,
            cloak:def.cloak, teleport:def.teleport, reflect:def.reflect, emp:def.emp,
            spawns:def.spawns, hunter:def.hunter, phase:def.phase
        });
        if (e.spawns) e.spawnTimer = 3;
    }

    _spawnElite(eKey) {
        const eDef = ELITE_TYPES[eKey];
        const base = ENEMY_TYPES[eDef.base];
        const p = this.player;
        const angle = Math.random()*Math.PI*2, dist = 450+Math.random()*100;
        const e = this._getEnemy();
        Object.assign(e, {
            x:p.x+Math.cos(angle)*dist, y:p.y+Math.sin(angle)*dist,
            hp:base.hp*eDef.hpMul, maxHp:base.hp*eDef.hpMul,
            speed:base.speed*eDef.spdMul, dmg:base.dmg*2, xp:base.xp*eDef.xpMul,
            size:base.size*1.3, type:eDef.base, color:eDef.color, hitFlash:0,
            slowTimer:0, stunTimer:0, isElite:true, eliteGlow:eDef.glow,
            isBoss:false, isRanged:false, explode:false, cloak:false, shoots:eDef.shoots
        });
        AudioManager.play('bossSpawn');
    }

    _spawnBoss(bKey) {
        const def = BOSS_TYPES[bKey];
        const p = this.player;
        const angle = Math.random()*Math.PI*2;
        const e = this._getEnemy();
        Object.assign(e, {
            x:p.x+Math.cos(angle)*500, y:p.y+Math.sin(angle)*500,
            hp:def.hp*this.nightmareMult, maxHp:def.hp*this.nightmareMult,
            speed:def.speed, dmg:def.dmg, xp:def.xp,
            size:def.size, type:bKey, color:def.color, hitFlash:0,
            slowTimer:0, stunTimer:0, isElite:false, isBoss:true, bossKey:bKey,
            bossPhase:1, bossAtkTimer:2, shoots:def.shoots, flies:def.flies, phases:def.phases||1
        });
        AudioManager.play('bossSpawn');
    }

    _updateBoss(e, dt) {
        const p = this.player;
        e.bossAtkTimer -= dt;
        if (e.bossAtkTimer <= 0) {
            e.bossAtkTimer = Math.max(0.5, 1.5 - p.time/600);
            const hpRatio = e.hp / e.maxHp;
            if (e.phases >= 3 && hpRatio < 0.33) e.bossPhase = 3;
            else if (e.phases >= 2 && hpRatio < 0.66) e.bossPhase = 2;
            if (e.shoots) {
                const count = 3 + e.bossPhase * 2;
                for (let i = 0; i < count; i++) {
                    const angle = (i/count)*Math.PI*2;
                    const proj = this._getProj();
                    Object.assign(proj, { x:e.x, y:e.y, vx:Math.cos(angle)*120, vy:Math.sin(angle)*120,
                        damage:e.dmg*0.5, crit:false, life:3, homing:false, trailColor:e.color, isEnemy:true });
                }
            }
        }
    }

    _updateEvents(dt) {
        if (this.activeEvent) {
            this.eventTimerLeft -= dt;
            if (this.eventTimerLeft <= 0) this.activeEvent = null;
            if (this.activeEvent === 'meteors' && Math.random() < 0.1) {
                const p = this.player;
                const mx = p.x+(Math.random()-0.5)*400, my = p.y+(Math.random()-0.5)*400;
                for (const e of this.activeEnemies) {
                    if ((e.x-mx)**2+(e.y-my)**2 < 80**2) { e.hp -= 30; if (e.hp <= 0) this._killEnemy(e); }
                }
                this._spawnExplosion(mx, my, '#FF4400', 80);
            }
            return;
        }
        this.eventTimer -= dt;
        if (this.eventTimer <= 0) {
            this.eventTimer = 45 + Math.random()*30;
            const evt = EVENTS[Math.floor(Math.random()*EVENTS.length)];
            this.activeEvent = evt.effect;
            this.eventTimerLeft = evt.dur;
            AudioManager.play('event');
        }
    }

    _killEnemy(e) {
        const count = Math.min(5, Math.ceil(e.xp/20));
        for (let i = 0; i < count; i++) {
            const o = this._getXpOrb();
            Object.assign(o, { x:e.x+(Math.random()-0.5)*30, y:e.y+(Math.random()-0.5)*30, value:Math.ceil(e.xp/count), life:15 });
        }
        for (let i = 0; i < 8; i++) {
            const pt = this._getParticle();
            Object.assign(pt, { x:e.x, y:e.y, vx:(Math.random()-0.5)*150, vy:(Math.random()-0.5)*150, life:0.4, maxLife:0.4, type:'circle', color:e.color, size:3 });
        }
        if (e.isBoss) {
            AudioManager.play('bossDie');
            SaveManager.defeatBoss(e.bossKey);
            for (let i = 0; i < 20; i++) {
                const pt = this._getParticle();
                const angle = Math.random()*Math.PI*2, spd = 100+Math.random()*200;
                Object.assign(pt, { x:e.x, y:e.y, vx:Math.cos(angle)*spd, vy:Math.sin(angle)*spd, life:1, maxLife:1, type:'circle', color:'#FFD700', size:5 });
            }
        }
        // EMP effect
        if (e.emp) {
            this.player.atkSpeedMul *= 0.5;
            setTimeout(() => { if (this.player) this.player.atkSpeedMul = Math.max(1, this.player.atkSpeedMul * 2); }, 3000);
        }
        this.player.kills++;
        this.player.ultimateCharge = Math.min(100, this.player.ultimateCharge + 2);
        AudioManager.play('kill');
        this._releaseEnemy(e);
    }

    _spawnExplosion(x, y, color, radius) {
        for (let i = 0; i < 12; i++) {
            const angle = Math.random()*Math.PI*2, spd = 50+Math.random()*radius;
            const pt = this._getParticle();
            Object.assign(pt, { x, y, vx:Math.cos(angle)*spd, vy:Math.sin(angle)*spd, life:0.5, maxLife:0.5, type:'circle', color, size:3+Math.random()*3 });
        }
    }

    // ─── Rendering ───
    _render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, W, H);
        if (this.state === GS.MENU) { this._renderMenu(ctx); return; }
        if (this.state === GS.CHARSELECT) { this._renderCharSelect(ctx); return; }
        if (this.state === GS.META) { this._renderMeta(ctx); return; }

        ctx.save(); ctx.translate(-this.camX, -this.camY);
        this._drawGrid(ctx);

        // XP orbs
        for (const o of this.activeXp) {
            ctx.fillStyle = '#4CAF50'; ctx.globalAlpha = 0.5+Math.sin(o.life*5)*0.3;
            ctx.beginPath(); ctx.arc(o.x, o.y, 6, 0, Math.PI*2); ctx.fill();
            ctx.globalAlpha = 1; ctx.fillStyle = '#8BC34A';
            ctx.beginPath(); ctx.arc(o.x, o.y, 4, 0, Math.PI*2); ctx.fill();
        }

        for (const e of this.activeEnemies) this._drawEnemy(ctx, e);
        for (const proj of this.activeProjs) {
            ctx.fillStyle = proj.isEnemy ? '#FF4444' : (proj.trailColor||'#00E5FF');
            ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 6;
            ctx.beginPath(); ctx.arc(proj.x, proj.y, proj.explodeR ? 5 : 3, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 0;
        }

        const p = this.player;
        // Beam
        if (this.beamTargets.length) {
            for (const bt of this.beamTargets) {
                ctx.strokeStyle = '#FF0000'; ctx.lineWidth = 3; ctx.globalAlpha = 0.7;
                ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(bt.x, bt.y); ctx.stroke();
                ctx.globalAlpha = 0.3; ctx.lineWidth = 8;
                ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(bt.x, bt.y); ctx.stroke();
                ctx.globalAlpha = 1;
            }
            this.beamTargets = [];
        }

        // Orbit/Saw
        for (const [wk, wv] of Object.entries(p.weapons)) {
            const def = WEAPONS[wk] || EVOLUTIONS[wk];
            if (!def) continue;
            if (def.type === 'orbit') {
                const count = def.orbitCount || 3;
                for (let i = 0; i < count; i++) {
                    const angle = this.orbitAngle + (i/count)*Math.PI*2;
                    ctx.fillStyle = '#00E5FF';
                    ctx.beginPath(); ctx.arc(p.x+Math.cos(angle)*(def.orbitR||80), p.y+Math.sin(angle)*(def.orbitR||80), 6, 0, Math.PI*2); ctx.fill();
                }
            }
            if (def.type === 'saw') {
                ctx.strokeStyle = '#FF6600'; ctx.lineWidth = 3; ctx.globalAlpha = 0.6;
                ctx.beginPath(); ctx.arc(p.x, p.y, def.sawR||60, this.sawAngle, this.sawAngle+Math.PI*1.5); ctx.stroke();
                ctx.globalAlpha = 1;
            }
        }

        // Pets
        for (const pet of this.pets) {
            const petDef = PETS[pet.type];
            const pr = 50 + pet.lv * 5;
            const px = p.x + Math.cos(pet.angle) * pr;
            const py = p.y + Math.sin(pet.angle) * pr;
            ctx.fillStyle = '#FFA500';
            ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#FFF'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(petDef.icon, px, py + 3);
        }

        this._drawPlayer(ctx);
        for (const pt of this.activeParticles) {
            const alpha = Math.max(0, pt.life/pt.maxLife);
            ctx.globalAlpha = alpha;
            if (pt.type === 'text') { ctx.fillStyle = pt.color; ctx.font = 'bold 11px Orbitron,monospace'; ctx.textAlign = 'center'; ctx.fillText(pt.text, pt.x, pt.y); }
            else { ctx.fillStyle = pt.color; ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size*alpha, 0, Math.PI*2); ctx.fill(); }
            ctx.globalAlpha = 1;
        }
        ctx.restore();

        this._drawHUD(ctx);
        if (this.joystick.active) this._drawJoystick(ctx);
        if (this.state === GS.LEVELUP) this._drawLevelUp(ctx);
        if (this.state === GS.PAUSED) { ctx.fillStyle='rgba(0,0,0,0.7)'; ctx.fillRect(0,0,W,H); ctx.fillStyle='#FFF'; ctx.font='bold 28px Orbitron,monospace'; ctx.textAlign='center'; ctx.fillText('TẠM DỪNG',W/2,H/2); }
        if (this.state === GS.GAMEOVER) this._drawGameOver(ctx);
    }

    _drawGrid(ctx) {
        const gs = 80, sx = Math.floor(this.camX/gs)*gs, sy = Math.floor(this.camY/gs)*gs;
        ctx.strokeStyle = 'rgba(0,229,255,0.04)'; ctx.lineWidth = 1;
        for (let x=sx; x<this.camX+W+gs; x+=gs) { ctx.beginPath(); ctx.moveTo(x,this.camY); ctx.lineTo(x,this.camY+H); ctx.stroke(); }
        for (let y=sy; y<this.camY+H+gs; y+=gs) { ctx.beginPath(); ctx.moveTo(this.camX,y); ctx.lineTo(this.camX+W,y); ctx.stroke(); }
    }

    _drawPlayer(ctx) {
        const p = this.player;
        if (p.invTimer > 0 && Math.floor(p.invTimer*10)%2===0) return;
        const ult = ULTIMATES[p.charKey];
        // Ultimate aura
        if (p.ultimateActive) {
            ctx.fillStyle = 'rgba(255,200,0,0.15)';
            ctx.beginPath(); ctx.arc(p.x, p.y, 35, 0, Math.PI*2); ctx.fill();
        }
        if (p.passives.shield) { ctx.strokeStyle = 'rgba(0,150,255,0.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, 20, 0, Math.PI*2); ctx.stroke(); }
        ctx.fillStyle = 'rgba(0,229,255,0.12)';
        ctx.beginPath(); ctx.arc(p.x, p.y, 24, 0, Math.PI*2); ctx.fill();
        const charColor = p.charKey === 'assassin' ? '#FF4444' : p.charKey === 'engineer' ? '#FFA500' : p.charKey === 'heavy' ? '#888888' : p.charKey === 'monk' ? '#AA44FF' : p.charKey === 'pilot' ? '#4488FF' : p.charKey === 'hacker' ? '#00FF88' : '#00E5FF';
        ctx.fillStyle = charColor;
        ctx.beginPath(); ctx.arc(p.x, p.y, 14, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#FFF';
        ctx.beginPath(); ctx.arc(p.x-4, p.y-3, 3, 0, Math.PI*2); ctx.arc(p.x+4, p.y-3, 3, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(p.x-4, p.y-3, 1.5, 0, Math.PI*2); ctx.arc(p.x+4, p.y-3, 1.5, 0, Math.PI*2); ctx.fill();
    }

    _drawEnemy(ctx, e) {
        if (e.cloak) ctx.globalAlpha = 0.3;
        if (e.hitFlash > 0) ctx.fillStyle = '#FFF'; else ctx.fillStyle = e.color;
        if (e.isElite && e.eliteGlow) { ctx.shadowColor = e.eliteGlow; ctx.shadowBlur = 12; }
        ctx.beginPath(); ctx.arc(e.x, e.y, e.size, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
        if (e.isBoss) {
            ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(e.x, e.y, e.size*0.7, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = e.color; ctx.beginPath(); ctx.arc(e.x, e.y, e.size*0.5, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#FFF'; ctx.beginPath(); ctx.arc(e.x-8, e.y-5, 5, 0, Math.PI*2); ctx.arc(e.x+8, e.y-5, 5, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#FF0000'; ctx.beginPath(); ctx.arc(e.x-8, e.y-5, 3, 0, Math.PI*2); ctx.arc(e.x+8, e.y-5, 3, 0, Math.PI*2); ctx.fill();
        } else {
            ctx.fillStyle = '#FFF'; ctx.beginPath(); ctx.arc(e.x, e.y-2, e.size*0.25, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(e.x, e.y-2, e.size*0.12, 0, Math.PI*2); ctx.fill();
        }
        if (e.isElite) { ctx.fillStyle = '#FFD700'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('★', e.x, e.y-e.size-4); }
        if (e.hp < e.maxHp) { const bw = e.size*2; ctx.fillStyle = '#333'; ctx.fillRect(e.x-bw/2, e.y-e.size-8, bw, 3); ctx.fillStyle = e.isBoss ? '#FFD700' : '#F44336'; ctx.fillRect(e.x-bw/2, e.y-e.size-8, bw*(e.hp/e.maxHp), 3); }
        ctx.globalAlpha = 1;
    }

    _drawHUD(ctx) {
        const p = this.player;
        ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, W, 55);
        const mins = Math.floor(p.time/60), secs = Math.floor(p.time%60);
        ctx.fillStyle = '#FFF'; ctx.font = 'bold 14px Orbitron,monospace'; ctx.textAlign = 'left';
        ctx.fillText(String(mins).padStart(2,'0')+':'+String(secs).padStart(2,'0'), 10, 18);
        ctx.fillStyle = '#00E5FF'; ctx.textAlign = 'center';
        ctx.fillText('Lv.'+p.level, W/2, 18);
        ctx.fillStyle = '#FF6600'; ctx.textAlign = 'right';
        ctx.fillText('💀 '+p.kills, W-10, 18);
        ctx.fillStyle = '#222'; ctx.fillRect(10, 33, W-20, 5);
        ctx.fillStyle = '#4CAF50'; ctx.fillRect(10, 33, (W-20)*(p.xp/p.xpNext), 5);
        // HP bar
        ctx.fillStyle = '#222'; ctx.fillRect(10, H-18, 120, 8);
        ctx.fillStyle = '#F44336'; ctx.fillRect(10, H-18, 120*(p.hp/p.maxHp), 8);
        ctx.fillStyle = '#FFF'; ctx.font = '8px Rajdhani,sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(Math.floor(p.hp)+'/'+p.maxHp, 70, H-11);
        // Ultimate bar
        ctx.fillStyle = '#222'; ctx.fillRect(140, H-18, 80, 8);
        ctx.fillStyle = p.ultimateCharge >= 100 ? '#FFD700' : '#888';
        ctx.fillRect(140, H-18, 80*(p.ultimateCharge/100), 8);
        if (p.ultimateCharge >= 100) {
            ctx.fillStyle = '#FFD700'; ctx.font = 'bold 8px Rajdhani,sans-serif'; ctx.textAlign = 'left';
            ctx.fillText('[Q] ULTIMATE', 225, H-11);
        }
        // Weapons
        ctx.textAlign = 'left'; ctx.font = '11px sans-serif'; let wx = 10;
        for (const [wk, wv] of Object.entries(p.weapons)) {
            const def = WEAPONS[wk] || EVOLUTIONS[wk];
            if (def) { ctx.fillStyle = '#AAA'; ctx.fillText(def.icon, wx, H-30); wx += 18; }
        }
        // DPS
        if (p.time > 2 && this.totalDamage > 0) {
            const dps = Math.floor(this.totalDamage / p.time);
            ctx.fillStyle = '#FF8800'; ctx.font = '9px Rajdhani,sans-serif'; ctx.textAlign = 'left';
            ctx.fillText('DPS: '+dps, 10, H-40);
        }
        // Mode/Char
        ctx.fillStyle = '#555'; ctx.font = '9px Rajdhani,sans-serif'; ctx.textAlign = 'right';
        ctx.fillText(CHARACTERS[p.charKey].icon+' '+CHARACTERS[p.charKey].name+' | '+ENDGAME_MODES[p.mode].icon+' '+ENDGAME_MODES[p.mode].name, W-10, 48);
    }

    _drawJoystick(ctx) {
        const j = this.joystick;
        ctx.globalAlpha = 0.3; ctx.fillStyle = '#FFF';
        ctx.beginPath(); ctx.arc(j.startX, j.startY, 40, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#00E5FF';
        ctx.beginPath(); ctx.arc(j.startX+j.dx, j.startY+j.dy, 20, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 1;
    }

    _drawLevelUp(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.88)'; ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center'; ctx.fillStyle = '#FFD700'; ctx.font = 'bold 22px Orbitron,monospace';
        ctx.fillText('LEVEL UP!', W/2, 110);
        ctx.fillStyle = '#888'; ctx.font = '12px Rajdhani,sans-serif';
        ctx.fillText('Chọn 1 nâng cấp (phím 1-3)', W/2, 132);

        for (let i = 0; i < this.upgradeChoices.length; i++) {
            const c = this.upgradeChoices[i];
            const bx = W/2-155, by = 150+i*125, bw = 310, bh = 115;
            const rarityCol = RARITY[c.rarity]?.color || '#AAA';

            // Card bg
            ctx.fillStyle = c.type==='weapon' ? 'rgba(0,229,255,0.06)' : c.type==='pet' ? 'rgba(255,165,0,0.06)' : 'rgba(255,200,0,0.06)';
            ctx.fillRect(bx, by, bw, bh);
            ctx.strokeStyle = rarityCol; ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);

            // Rarity label
            ctx.fillStyle = rarityCol; ctx.font = 'bold 9px Orbitron,monospace'; ctx.textAlign = 'right';
            ctx.fillText((RARITY[c.rarity]?.name||'Common').toUpperCase(), bx+bw-8, by+12);

            // Icon + Name + Level
            ctx.font = '24px sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = '#FFF';
            ctx.fillText(c.icon, bx+10, by+32);
            ctx.font = 'bold 14px Rajdhani,sans-serif';
            ctx.fillText(c.name, bx+42, by+24);
            ctx.fillStyle = '#FFD700'; ctx.font = '11px Rajdhani,sans-serif';
            ctx.fillText(c.curLv > 0 ? 'Lv'+c.curLv+' → Lv'+c.nextLv : 'MỚI', bx+42, by+38);

            // Role
            if (c.role) {
                ctx.fillStyle = '#00E5FF'; ctx.font = '10px Rajdhani,sans-serif';
                ctx.fillText('Role: '+c.role, bx+42, by+52);
            }

            // Tags
            if (c.tags && c.tags.length) {
                ctx.fillStyle = '#888'; ctx.font = '9px Rajdhani,sans-serif';
                ctx.fillText('['+c.tags.join('] [')+']', bx+42, by+65);
            }

            // Strong/Weak
            if (c.strong) {
                ctx.fillStyle = '#4CAF50'; ctx.font = '9px Rajdhani,sans-serif';
                ctx.fillText('✓ '+c.strong, bx+42, by+80);
            }
            if (c.weak) {
                ctx.fillStyle = '#F44336'; ctx.font = '9px Rajdhani,sans-serif';
                ctx.fillText('✗ '+c.weak, bx+42, by+92);
            }

            // Synergies
            if (c.synergies) {
                ctx.fillStyle = '#FFA500'; ctx.font = '9px Rajdhani,sans-serif'; ctx.textAlign = 'right';
                ctx.fillText('Synergy: '+c.synergies, bx+bw-8, by+80);
            }

            // Key hint
            ctx.fillStyle = '#555'; ctx.font = '10px Rajdhani,sans-serif'; ctx.textAlign = 'right';
            ctx.fillText('['+(i+1)+']', bx+bw-8, by+105);
        }
    }

    _drawGameOver(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.88)'; ctx.fillRect(0, 0, W, H);
        const p = this.player, best = SaveManager.load();
        ctx.textAlign = 'center'; ctx.fillStyle = '#F44336'; ctx.font = 'bold 30px Orbitron,monospace';
        ctx.fillText('GAME OVER', W/2, 100);
        ctx.fillStyle = '#FFF'; ctx.font = '15px Rajdhani,sans-serif';
        const mins = Math.floor(p.time/60), secs = Math.floor(p.time%60);
        ctx.fillText('Thời gian: '+String(mins).padStart(2,'0')+':'+String(secs).padStart(2,'0'), W/2, 160);
        ctx.fillText('Giết: '+p.kills+' | Level: '+p.level, W/2, 190);
        ctx.fillText('Nhân vật: '+CHARACTERS[p.charKey].icon+' '+CHARACTERS[p.charKey].name, W/2, 220);
        ctx.fillText('Chế độ: '+ENDGAME_MODES[p.mode].icon+' '+ENDGAME_MODES[p.mode].name, W/2, 250);
        ctx.fillStyle = '#FFD700';
        ctx.fillText('+'+Math.floor(p.time/30+p.kills/10+p.level)+' Tech Credits', W/2, 290);
        ctx.fillStyle = '#666'; ctx.font = '11px Rajdhani,sans-serif';
        ctx.fillText('Kỷ lục: '+Math.floor(best.bestTime/60)+':'+String(best.bestTime%60).padStart(2,'0')+' | '+best.bestKills+' kills | Lv.'+best.bestLevel, W/2, 330);

        // Damage breakdown
        if (this.totalDamage > 0) {
            ctx.fillStyle = '#888'; ctx.font = '10px Rajdhani,sans-serif'; ctx.textAlign = 'left';
            const dx = W/2-120, dy = 345;
            ctx.fillText('Sát thương:', dx, dy);
            const entries = Object.entries(this.damageStats).sort((a,b) => b[1]-a[1]).slice(0, 4);
            for (let i = 0; i < entries.length; i++) {
                const [wk, dmg] = entries[i];
                const def = WEAPONS[wk] || EVOLUTIONS[wk];
                const pct = Math.floor(dmg / this.totalDamage * 100);
                ctx.fillStyle = '#AAA';
                ctx.fillText((def?.icon||'?')+' '+(def?.name||wk)+': '+Math.floor(dmg)+' ('+pct+'%)', dx, dy+14+i*13);
            }
        }

        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(W/2-80, 440, 160, 32);
        ctx.strokeStyle = '#00E5FF'; ctx.strokeRect(W/2-80, 440, 160, 32);
        ctx.fillStyle = '#FFF'; ctx.font = 'bold 14px Rajdhani,sans-serif'; ctx.fillText('🏠 MENU', W/2, 461);
    }

    _renderMenu(ctx) {
        ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(0,229,255,0.04)'; ctx.lineWidth = 1;
        for (let x=0; x<W; x+=60) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
        for (let y=0; y<H; y+=60) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
        ctx.textAlign = 'center';
        ctx.fillStyle = '#00E5FF'; ctx.font = 'bold 32px Orbitron,monospace'; ctx.fillText('CYBER SURVIVOR', W/2, 70);
        ctx.fillStyle = '#FF6600'; ctx.font = 'bold 12px Orbitron,monospace'; ctx.fillText('⚡ PHASE 3 ⚡', W/2, 92);
        ctx.font = '18px sans-serif'; ctx.fillStyle = '#FFF';
        ctx.fillText('🛡️🗡️🔧🔫🧘🤖💻', W/2, 130);
        ctx.fillText('🔫🔴🚀⚡🛸⚙️💜❄️🎯', W/2, 160);
        ctx.fillText('💚🛡️📈🔫🚀', W/2, 190);

        const buttons = [
            { y:220, text:'▶ CHỌN NHÂN VẬT', color:'#00E5FF' },
            { y:270, text:'🔧 NÂNG CẤP', color:'#FF6600' }
        ];
        for (const btn of buttons) {
            ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(W/2-80, btn.y, 160, 32);
            ctx.strokeStyle = btn.color; ctx.lineWidth = 1; ctx.strokeRect(W/2-80, btn.y, 160, 32);
            ctx.fillStyle = '#FFF'; ctx.font = 'bold 14px Rajdhani,sans-serif'; ctx.fillText(btn.text, W/2, btn.y+21);
        }

        const best = SaveManager.load();
        ctx.fillStyle = '#666'; ctx.font = '11px Rajdhani,sans-serif';
        ctx.fillText('Kỷ lục: '+Math.floor(best.bestTime/60)+':'+String(best.bestTime%60).padStart(2,'0')+' | '+best.bestKills+' kills | Lv.'+best.bestLevel, W/2, 340);
        ctx.fillText('Tech Credits: '+best.techCredits+' | Hoàn thành: '+SaveManager.getCompletionPercent()+'%', W/2, 360);
        ctx.fillStyle = '#444'; ctx.font = '10px Rajdhani,sans-serif';
        ctx.fillText('7 nhân vật | 5 pet | 9 vũ khí | 10 kẻ thù | 6 boss | 5 chế độ', W/2, 420);
        ctx.fillText('WASD: Di chuyển | Q: Ultimate | ESC: Tạm dừng', W/2, 440);
    }

    _renderCharSelect(ctx) {
        ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center'; ctx.fillStyle = '#00E5FF'; ctx.font = 'bold 22px Orbitron,monospace';
        ctx.fillText('CHỌN NHÂN VẬT', W/2, 35);

        // Back button
        ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(10, 10, 50, 25);
        ctx.fillStyle = '#FFF'; ctx.font = '12px Rajdhani,sans-serif'; ctx.textAlign = 'center'; ctx.fillText('←', 35, 27);

        // Character cards
        for (let i = 0; i < CHAR_ORDER.length; i++) {
            const key = CHAR_ORDER[i], def = CHARACTERS[key];
            const bx = 30 + (i % 4) * 190, by = 80 + Math.floor(i / 4) * 120;
            const unlocked = SaveManager.isCharUnlocked(key);
            const selected = this.selectedChar === key;

            ctx.fillStyle = selected ? 'rgba(0,229,255,0.2)' : unlocked ? 'rgba(255,255,255,0.06)' : 'rgba(50,50,50,0.3)';
            ctx.fillRect(bx, by, 175, 100);
            ctx.strokeStyle = selected ? '#00E5FF' : unlocked ? '#444' : '#333';
            ctx.lineWidth = selected ? 2 : 1; ctx.strokeRect(bx, by, 175, 100);

            if (unlocked) {
                ctx.font = '24px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#FFF';
                ctx.fillText(def.icon, bx+87, by+30);
                ctx.font = 'bold 13px Rajdhani,sans-serif'; ctx.fillText(def.name, bx+87, by+52);
                ctx.fillStyle = '#AAA'; ctx.font = '10px Rajdhani,sans-serif'; ctx.fillText(def.desc, bx+87, by+70);
                ctx.fillStyle = '#666'; ctx.font = '9px Rajdhani,sans-serif'; ctx.fillText('Start: '+WEAPONS[def.startWeapon].icon, bx+87, by+88);
            } else {
                ctx.fillStyle = '#555'; ctx.font = '20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🔒', bx+87, by+40);
                ctx.font = '10px Rajdhani,sans-serif';
                if (def.unlock <= 20) ctx.fillText('Lv.'+def.unlock, bx+87, by+65);
                else if (def.unlock === 100) ctx.fillText('100 Credits', bx+87, by+65);
                else if (def.unlock === 500) ctx.fillText('500 Kills', bx+87, by+65);
                else if (def.unlock === 900) ctx.fillText('15 Phút', bx+87, by+65);
                else if (def.unlock === 1) ctx.fillText('1 Boss', bx+87, by+65);
            }
        }

        // Mode selection
        ctx.fillStyle = '#888'; ctx.font = '12px Rajdhani,sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Chế độ:', W/2, H-105);
        for (let i = 0; i < MODE_ORDER.length; i++) {
            const key = MODE_ORDER[i], def = ENDGAME_MODES[key];
            const bx = W/2-200+i*82, by = H-90;
            const sel = this.selectedMode === key;
            ctx.fillStyle = sel ? 'rgba(255,102,0,0.3)' : 'rgba(255,255,255,0.05)';
            ctx.fillRect(bx, by, 78, 30);
            ctx.strokeStyle = sel ? '#FF6600' : '#444'; ctx.strokeRect(bx, by, 78, 30);
            ctx.fillStyle = sel ? '#FFF' : '#888'; ctx.font = '10px Rajdhani,sans-serif';
            ctx.fillText(def.icon+' '+def.name, bx+39, by+19);
        }

        // Start button
        ctx.fillStyle = 'rgba(0,229,255,0.2)'; ctx.fillRect(W/2-60, H-50, 120, 28);
        ctx.strokeStyle = '#00E5FF'; ctx.strokeRect(W/2-60, H-50, 120, 28);
        ctx.fillStyle = '#FFF'; ctx.font = 'bold 13px Rajdhani,sans-serif'; ctx.fillText('▶ BẮT ĐẦU', W/2, H-33);
    }

    _renderMeta(ctx) {
        ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, W, H);
        const save = SaveManager.load();
        ctx.textAlign = 'center'; ctx.fillStyle = '#FF6600'; ctx.font = 'bold 22px Orbitron,monospace';
        ctx.fillText('NÂNG CẤP VĨNH VIỄN', W/2, 40);
        ctx.fillStyle = '#FFD700'; ctx.font = '14px Rajdhani,sans-serif';
        ctx.fillText('Tech Credits: '+save.techCredits, W/2, 65);

        for (let i = 0; i < META_ORDER.length; i++) {
            const key = META_ORDER[i], def = META_UPGRADES[key];
            const lv = save.meta[key] || 0;
            const bx = W/2-150, by = 120+i*55;
            const maxed = lv >= def.maxLv, cost = maxed ? 0 : def.cost[lv], canBuy = !maxed && save.techCredits >= cost;
            ctx.fillStyle = maxed ? 'rgba(76,175,80,0.15)' : canBuy ? 'rgba(255,102,0,0.15)' : 'rgba(100,100,100,0.1)';
            ctx.fillRect(bx, by, 300, 45);
            ctx.strokeStyle = maxed ? '#4CAF50' : canBuy ? '#FF6600' : '#444'; ctx.strokeRect(bx, by, 300, 45);
            ctx.textAlign = 'left'; ctx.fillStyle = '#FFF'; ctx.font = '16px sans-serif'; ctx.fillText(def.icon, bx+10, by+27);
            ctx.font = 'bold 13px Rajdhani,sans-serif'; ctx.fillText(def.name+' ('+lv+'/'+def.maxLv+')', bx+40, by+20);
            ctx.fillStyle = '#888'; ctx.font = '11px Rajdhani,sans-serif'; ctx.fillText(def.desc, bx+40, by+37);
            ctx.textAlign = 'right';
            if (maxed) { ctx.fillStyle = '#4CAF50'; ctx.font = 'bold 11px Rajdhani,sans-serif'; ctx.fillText('MAX', bx+290, by+27); }
            else { ctx.fillStyle = canBuy ? '#FFD700' : '#666'; ctx.font = '12px Rajdhani,sans-serif'; ctx.fillText('💰'+cost, bx+290, by+27); }
        }
        ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(W/2-50, H-50, 100, 28);
        ctx.strokeStyle = '#666'; ctx.strokeRect(W/2-50, H-50, 100, 28);
        ctx.fillStyle = '#FFF'; ctx.font = '13px Rajdhani,sans-serif'; ctx.fillText('← QUAY LẠI', W/2, H-33);
    }
}

window.addEventListener('load', () => { new CyberSurvivor(); });
