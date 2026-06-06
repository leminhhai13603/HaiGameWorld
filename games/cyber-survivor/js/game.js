/**
 * Cyber Survivor Phase 2 - Complete Game
 * Weapons, passives, evolutions, bosses, elites, events, meta
 */
const GS = { MENU:'menu', PLAYING:'playing', LEVELUP:'levelup', PAUSED:'paused', GAMEOVER:'gameover', META:'meta' };

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
        this._setupInput();
        this._gameLoop(performance.now());
    }

    _initGame() {
        const meta = SaveManager.load().meta;
        this.player = {
            x:0, y:0,
            hp: PLAYER_BASE.hp + (meta.health||0)*10,
            maxHp: PLAYER_BASE.hp + (meta.health||0)*10,
            speed: PLAYER_BASE.speed,
            damage: PLAYER_BASE.damage * (1 + (meta.damage||0)*0.05),
            atkSpeed: PLAYER_BASE.atkSpeed,
            critChance: PLAYER_BASE.critChance + (meta.critChance||0)*0.03,
            projCount: PLAYER_BASE.projCount,
            projSpeed: PLAYER_BASE.projSpeed,
            atkRange: PLAYER_BASE.atkRange + (meta.pickup||0)*15,
            pickupRange: 80 + (meta.pickup||0)*12,
            xpMul: 1 + (meta.xpGain||0)*0.10,
            level:1, xp:0, xpNext:xpForLevel(1),
            kills:0, time:0, invTimer:0,
            weapons:{ blaster:{lv:1, cd:0} },
            passives:{},
            evolved:{},
            dmgMul:1, atkSpeedMul:1, moveMul:1
        };
        this.activeEnemies = []; this.activeProjs = []; this.activeXp = []; this.activeParticles = [];
        this.spawnTimer = 0; this.bossTimers = {};
        Object.keys(BOSS_TYPES).forEach(k => this.bossTimers[k] = false);
        this.upgradeChoices = [];
        this.eventTimer = 60 + Math.random()*30;
        this.activeEvent = null; this.eventTimerLeft = 0;
        this.beamTargets = []; this.orbitAngle = 0; this.sawAngle = 0;
        this.state = GS.PLAYING;
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
                if (y>=260 && y<=295) this._initGame();
                if (y>=310 && y<=345) this.state = GS.META;
            }
            return;
        }
        if (this.state === GS.META) {
            // Back button
            if (x>=W/2-50 && x<=W/2+50 && y>=H-50 && y<=H-20) { this.state = GS.MENU; return; }
            // Meta upgrades
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
            if (p.weapons[c.id]) {
                p.weapons[c.id].lv = Math.min(p.weapons[c.id].lv + 1, WEAPONS[c.id].maxLv);
            } else if (Object.keys(p.weapons).length < MAX_WEAPONS) {
                p.weapons[c.id] = { lv:1, cd:0 };
            } else return;
        } else if (c.type === 'passive') {
            if (p.passives[c.id]) {
                p.passives[c.id] = Math.min(p.passives[c.id] + 1, PASSIVES[c.id].maxLv);
            } else if (Object.keys(p.passives).length < MAX_PASSIVES) {
                p.passives[c.id] = 1;
            } else return;
        }
        // Check evolutions
        this._checkEvolutions();
        // Apply passive effects
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
                    // Big particle effect
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
        p.critChance = PLAYER_BASE.critChance + (p.passives.critChance||0)*0.05 + SaveManager.getMetaBonus('critChance')*0.03;
        p.pickupRange = 80 + (p.passives.magnet||0)*20 + SaveManager.getMetaBonus('pickup')*12;
        p.maxHp = PLAYER_BASE.hp + (p.passives.maxHp||0)*20 + SaveManager.getMetaBonus('health')*10;
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
                choices.push({ type:'weapon', id:wk, name:def.name+' +', desc:'Cấp '+(wv.lv+1), icon:def.icon });
            }
        }
        // New weapons
        for (const wk of WEAPON_ORDER) {
            if (!p.weapons[wk] && Object.keys(p.weapons).length < MAX_WEAPONS) {
                choices.push({ type:'weapon', id:wk, name:WEAPONS[wk].name, desc:WEAPONS[wk].desc, icon:WEAPONS[wk].icon });
            }
        }
        // Passive upgrades
        for (const [pk, pv] of Object.entries(p.passives)) {
            if (pv < PASSIVES[pk].maxLv) {
                choices.push({ type:'passive', id:pk, name:PASSIVES[pk].name+' +', desc:PASSIVES[pk].desc, icon:PASSIVES[pk].icon });
            }
        }
        // New passives
        for (const pk of PASSIVE_ORDER) {
            if (!p.passives[pk] && Object.keys(p.passives).length < MAX_PASSIVES) {
                choices.push({ type:'passive', id:pk, name:PASSIVES[pk].name, desc:PASSIVES[pk].desc, icon:PASSIVES[pk].icon });
            }
        }
        // Shuffle and pick 3
        for (let i = choices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [choices[i], choices[j]] = [choices[j], choices[i]];
        }
        this.upgradeChoices = choices.slice(0, 3);
        if (this.upgradeChoices.length === 0) { this.state = GS.PLAYING; return; }
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

    // ─── Game Loop ───
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

        // Orbit/Saw angle
        this.orbitAngle += dt * 3;
        this.sawAngle += dt * 5;

        // Spawn enemies
        const cfg = getSpawnConfig(p.time);
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawnTimer = cfg.interval;
            const type = cfg.types[Math.floor(Math.random()*cfg.types.length)];
            this._spawnEnemy(type);
        }

        // Elite spawns (after 2 min)
        if (p.time > 120 && Math.random() < 0.002) {
            const eliteKeys = Object.keys(ELITE_TYPES);
            const eKey = eliteKeys[Math.floor(Math.random()*eliteKeys.length)];
            this._spawnElite(eKey);
        }

        // Boss spawns
        for (const [bKey, bDef] of Object.entries(BOSS_TYPES)) {
            if (!this.bossTimers[bKey] && p.time >= bDef.time) {
                this.bossTimers[bKey] = true;
                this._spawnBoss(bKey);
            }
        }

        // Events
        this._updateEvents(dt);

        // Update enemies
        for (let i = this.activeEnemies.length-1; i >= 0; i--) {
            const e = this.activeEnemies[i];
            if (e.hitFlash > 0) e.hitFlash -= dt * 5;
            if (e.slowTimer > 0) e.slowTimer -= dt;
            if (e.stunTimer > 0) { e.stunTimer -= dt; continue; }

            // Boss attack patterns
            if (e.isBoss) { this._updateBoss(e, dt); }

            const spd = e.slowTimer > 0 ? e.speed * 0.3 : e.speed;
            const edx = p.x - e.x, edy = p.y - e.y;
            const eDist = Math.sqrt(edx*edx+edy*edy) || 1;
            e.x += (edx/eDist)*spd*dt;
            e.y += (edy/eDist)*spd*dt;

            // Damage player
            if (eDist < e.size + 14 && p.invTimer <= 0 && !e.isRanged) {
                p.hp -= e.dmg * (1 - (p.passives.shield||0)*0.10);
                p.invTimer = 0.5;
                AudioManager.play('playerHit');
                if (p.hp <= 0) { this.state = GS.GAMEOVER; SaveManager.updateBest(Math.floor(p.time), p.kills, p.level); AudioManager.play('gameOver'); return; }
            }

            // Exploder enemies
            if (e.explode && eDist < 30) {
                p.hp -= e.dmg * (1 - (p.passives.shield||0)*0.10);
                p.invTimer = 0.5;
                this._spawnExplosion(e.x, e.y, '#FF8800', 30);
                this._releaseEnemy(e);
                AudioManager.play('explosion');
                if (p.hp <= 0) { this.state = GS.GAMEOVER; SaveManager.updateBest(Math.floor(p.time), p.kills, p.level); AudioManager.play('gameOver'); return; }
            }
        }

        // Update projectiles
        for (let i = this.activeProjs.length-1; i >= 0; i--) {
            const proj = this.activeProjs[i];
            // Homing
            if (proj.homing) {
                let closest = null, closestD = Infinity;
                for (const e of this.activeEnemies) {
                    const d = (e.x-proj.x)**2 + (e.y-proj.y)**2;
                    if (d < closestD) { closestD = d; closest = e; }
                }
                if (closest && closestD > 100) {
                    const dx = closest.x-proj.x, dy = closest.y-proj.y;
                    const d = Math.sqrt(dx*dx+dy*dy)||1;
                    proj.vx += (dx/d)*400*dt;
                    proj.vy += (dy/d)*400*dt;
                    const s = Math.sqrt(proj.vx**2+proj.vy**2);
                    if (s > proj.speed) { proj.vx = (proj.vx/s)*proj.speed; proj.vy = (proj.vy/s)*proj.speed; }
                }
            }
            proj.x += proj.vx*dt; proj.y += proj.vy*dt;
            proj.life -= dt;
            // Trail
            if (proj.life > 0.1) {
                const pt = this._getParticle();
                Object.assign(pt, { x:proj.x, y:proj.y, vx:0, vy:0, life:0.15, maxLife:0.15, type:'circle', color:proj.trailColor||'#00E5FF', size:2 });
            }
            let hit = false;
            for (const e of this.activeEnemies) {
                if ((e.x-proj.x)**2+(e.y-proj.y)**2 < (e.size+6)**2) {
                    const dmg = proj.crit ? proj.damage*2 : proj.damage;
                    e.hp -= dmg;
                    e.hitFlash = 1;
                    if (proj.slow) { e.slowTimer = proj.slowDur||2; }
                    if (proj.crit) AudioManager.play('crit'); else AudioManager.play('hit');
                    const pn = this._getParticle();
                    Object.assign(pn, { x:e.x, y:e.y-e.size-5, vx:0, vy:-40, life:0.5, maxLife:0.5, type:'text',
                        text:proj.crit?'💥'+Math.floor(dmg):'-'+Math.floor(dmg), color:proj.crit?'#FFD700':'#FFF' });
                    if (e.hp <= 0) this._killEnemy(e);
                    // Explosion
                    if (proj.explodeR) {
                        this._spawnExplosion(proj.x, proj.y, '#FF6600', proj.explodeR);
                        for (const e2 of this.activeEnemies) {
                            if (e2 !== e && (e2.x-proj.x)**2+(e2.y-proj.y)**2 < proj.explodeR**2) {
                                e2.hp -= proj.damage*0.6;
                                if (e2.hp <= 0) this._killEnemy(e2);
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
                const count = def.orbitCount || 3;
                for (const e of this.activeEnemies) {
                    const dx = e.x-p.x, dy = e.y-p.y;
                    if (dx*dx+dy*dy < (r+e.size)**2) {
                        e.hp -= def.dmg*p.dmgMul*wv.lv*0.3*dt;
                        if (e.hp <= 0) this._killEnemy(e);
                    }
                }
            }
        }

        // Update XP orbs
        for (let i = this.activeXp.length-1; i >= 0; i--) {
            const o = this.activeXp[i];
            o.life -= dt;
            const dx = p.x-o.x, dy = p.y-o.y;
            const dist = Math.sqrt(dx*dx+dy*dy);
            if (dist < p.pickupRange) {
                const pull = 350*(1-dist/p.pickupRange);
                o.x += (dx/dist)*pull*dt; o.y += (dy/dist)*pull*dt;
            }
            if (dist < 20) {
                p.xp += Math.floor(o.value * p.xpMul * (this.activeEvent==='doubleXp'?2:1));
                AudioManager.play('xpCollect');
                this._releaseXp(o);
                while (p.xp >= p.xpNext) {
                    p.xp -= p.xpNext; p.level++; p.xpNext = xpForLevel(p.level);
                    this._showLevelUp();
                }
            } else if (o.life <= 0) this._releaseXp(o);
        }

        // Update particles
        for (let i = this.activeParticles.length-1; i >= 0; i--) {
            const pt = this.activeParticles[i];
            pt.x += pt.vx*dt; pt.y += pt.vy*dt;
            if (pt.type !== 'text') pt.vy += 100*dt;
            pt.life -= dt;
            if (pt.life <= 0) this._releaseParticle(pt);
        }

        // Camera
        this.camX += (p.x-W/2-this.camX)*0.1;
        this.camY += (p.y-H/2-this.camY)*0.1;
    }

    _updateWeapons(dt) {
        const p = this.player;
        for (const [wk, wv] of Object.entries(p.weapons)) {
            const def = WEAPONS[wk] || EVOLUTIONS[wk];
            if (!def) continue;
            const cd = (def.cd || 0.5) / (p.atkSpeedMul * (this.activeEvent==='overload'?2:1));
            wv.cd -= dt;
            if (wv.cd > 0) continue;
            wv.cd = cd;

            const dmg = (def.dmg||10) * p.dmgMul * wv.lv * (this.activeEvent==='powerSurge'?2:1);
            const crit = Math.random() < p.critChance;

            switch (def.type) {
                case 'proj': {
                    const targets = this._getNearestEnemies(p.projCount);
                    for (const t of targets) {
                        const dx = t.x-p.x, dy = t.y-p.y, d = Math.sqrt(dx*dx+dy*dy)||1;
                        const proj = this._getProj();
                        Object.assign(proj, { x:p.x, y:p.y, vx:(dx/d)*(def.projSpd||350), vy:(dy/d)*(def.projSpd||350),
                            damage:dmg, crit, life:1.5, slow:def.slow, slowDur:def.slowDur,
                            explodeR:def.explodeR, homing:false, trailColor:'#00E5FF' });
                    }
                    AudioManager.play(wk==='plasma'?'plasma':'shoot');
                    break;
                }
                case 'homing': {
                    for (let i=0; i<(def.projCount||2); i++) {
                        const angle = Math.random()*Math.PI*2;
                        const proj = this._getProj();
                        Object.assign(proj, { x:p.x, y:p.y, vx:Math.cos(angle)*50, vy:Math.sin(angle)*50,
                            damage:dmg, crit, life:3, speed:def.projSpd||250, homing:true, trailColor:'#FF44FF' });
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
                            damage:dmg, crit, life:2, explodeR:def.explodeR||80, homing:false, trailColor:'#FF6600' });
                    }
                    AudioManager.play('rocket');
                    break;
                }
                case 'beam': {
                    this.beamTargets = [];
                    const sorted = [...this.activeEnemies].sort((a,b) => ((a.x-p.x)**2+(a.y-p.y)**2)-((b.x-p.x)**2+(b.y-p.y)**2));
                    const range = def.range || 200;
                    for (const e of sorted) {
                        const d = Math.sqrt((e.x-p.x)**2+(e.y-p.y)**2);
                        if (d < range) {
                            this.beamTargets.push({ x:e.x, y:e.y });
                            e.hp -= dmg * dt * 10;
                            e.hitFlash = 1;
                            if (e.hp <= 0) this._killEnemy(e);
                        }
                    }
                    if (this.beamTargets.length > 0) AudioManager.play('laser');
                    break;
                }
                case 'chain': {
                    const targets = this._getNearestEnemies(1);
                    if (targets.length > 0) {
                        let current = targets[0];
                        const hit = new Set();
                        hit.add(current);
                        current.hp -= dmg; current.hitFlash = 1; current.stunTimer = 0.3;
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
                            closest.hp -= dmg*0.7; closest.hitFlash = 1; closest.stunTimer = 0.3;
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
        return [...this.activeEnemies]
            .sort((a,b) => ((a.x-p.x)**2+(a.y-p.y)**2)-((b.x-p.x)**2+(b.y-p.y)**2))
            .slice(0, count);
    }

    _spawnEnemy(type) {
        const p = this.player, def = ENEMY_TYPES[type];
        const angle = Math.random()*Math.PI*2, dist = 400+Math.random()*100;
        const e = this._getEnemy();
        Object.assign(e, {
            x:p.x+Math.cos(angle)*dist, y:p.y+Math.sin(angle)*dist,
            hp:def.hp, maxHp:def.hp, speed:def.speed, dmg:def.dmg, xp:def.xp,
            size:def.size, type, color:def.color, hitFlash:0, slowTimer:0, stunTimer:0,
            isElite:false, isBoss:false, isRanged:def.ranged, explode:def.explode,
            cloak:def.cloak, cloakTimer:0
        });
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
            hp:def.hp, maxHp:def.hp, speed:def.speed, dmg:def.dmg, xp:def.xp,
            size:def.size, type:bKey, color:def.color, hitFlash:0,
            slowTimer:0, stunTimer:0, isElite:false, isBoss:true, bossKey:bKey,
            bossPhase:1, bossAtkTimer:2, bossAtkType:0, isRanged:false,
            shoots:def.shoots, flies:def.flies, phases:def.phases||1
        });
        AudioManager.play('bossSpawn');
    }

    _updateBoss(e, dt) {
        const p = this.player;
        e.bossAtkTimer -= dt;
        if (e.bossAtkTimer <= 0) {
            e.bossAtkTimer = 1.5;
            // Phase check
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
            if (this.eventTimerLeft <= 0) { this.activeEvent = null; }
            if (this.activeEvent === 'meteors' && Math.random() < 0.1) {
                const p = this.player;
                const mx = p.x + (Math.random()-0.5)*400, my = p.y + (Math.random()-0.5)*400;
                for (const e of this.activeEnemies) {
                    if ((e.x-mx)**2+(e.y-my)**2 < 80**2) {
                        e.hp -= 30; if (e.hp <= 0) this._killEnemy(e);
                    }
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
            Object.assign(o, { x:e.x+(Math.random()-0.5)*30, y:e.y+(Math.random()-0.5)*30,
                value:Math.ceil(e.xp/count), life:15 });
        }
        for (let i = 0; i < 8; i++) {
            const pt = this._getParticle();
            Object.assign(pt, { x:e.x, y:e.y, vx:(Math.random()-0.5)*150, vy:(Math.random()-0.5)*150,
                life:0.4, maxLife:0.4, type:'circle', color:e.color, size:3 });
        }
        if (e.isBoss) {
            AudioManager.play('bossDie');
            for (let i = 0; i < 20; i++) {
                const pt = this._getParticle();
                const angle = Math.random()*Math.PI*2, spd = 100+Math.random()*200;
                Object.assign(pt, { x:e.x, y:e.y, vx:Math.cos(angle)*spd, vy:Math.sin(angle)*spd,
                    life:1, maxLife:1, type:'circle', color:'#FFD700', size:5 });
            }
        }
        this.player.kills++;
        AudioManager.play('kill');
        this._releaseEnemy(e);
    }

    _spawnExplosion(x, y, color, radius) {
        for (let i = 0; i < 12; i++) {
            const angle = Math.random()*Math.PI*2, spd = 50+Math.random()*radius;
            const pt = this._getParticle();
            Object.assign(pt, { x, y, vx:Math.cos(angle)*spd, vy:Math.sin(angle)*spd,
                life:0.5, maxLife:0.5, type:'circle', color, size:3+Math.random()*3 });
        }
    }

    // ─── Rendering ───
    _render() {
        const ctx = this.ctx;
        if (this.state === GS.MENU) { this._renderMenu(ctx); return; }
        if (this.state === GS.META) { this._renderMeta(ctx); return; }

        ctx.save(); ctx.translate(-this.camX, -this.camY);
        this._drawGrid(ctx);

        // XP orbs
        for (const o of this.activeXp) {
            ctx.fillStyle = '#4CAF50';
            ctx.globalAlpha = 0.5+Math.sin(o.life*5)*0.3;
            ctx.beginPath(); ctx.arc(o.x, o.y, 6, 0, Math.PI*2); ctx.fill();
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#8BC34A';
            ctx.beginPath(); ctx.arc(o.x, o.y, 4, 0, Math.PI*2); ctx.fill();
        }

        // Enemies
        for (const e of this.activeEnemies) this._drawEnemy(ctx, e);

        // Projectiles
        for (const proj of this.activeProjs) {
            ctx.fillStyle = proj.isEnemy ? '#FF4444' : (proj.trailColor || '#00E5FF');
            ctx.shadowColor = proj.isEnemy ? '#FF4444' : '#00E5FF';
            ctx.shadowBlur = 6;
            ctx.beginPath(); ctx.arc(proj.x, proj.y, proj.explodeR ? 5 : 3, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Beam
        const p = this.player;
        if (this.beamTargets.length > 0) {
            for (const bt of this.beamTargets) {
                ctx.strokeStyle = '#FF0000';
                ctx.lineWidth = 3;
                ctx.globalAlpha = 0.7;
                ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(bt.x, bt.y); ctx.stroke();
                ctx.globalAlpha = 0.3;
                ctx.lineWidth = 8;
                ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(bt.x, bt.y); ctx.stroke();
                ctx.globalAlpha = 1;
            }
            this.beamTargets = [];
        }

        // Orbit/Saw visual
        for (const [wk, wv] of Object.entries(p.weapons)) {
            const def = WEAPONS[wk] || EVOLUTIONS[wk];
            if (!def) continue;
            if (def.type === 'orbit') {
                const count = def.orbitCount || 3;
                const r = def.orbitR || 80;
                for (let i = 0; i < count; i++) {
                    const angle = this.orbitAngle + (i/count)*Math.PI*2;
                    const ox = p.x+Math.cos(angle)*r, oy = p.y+Math.sin(angle)*r;
                    ctx.fillStyle = '#00E5FF';
                    ctx.beginPath(); ctx.arc(ox, oy, 6, 0, Math.PI*2); ctx.fill();
                }
            }
            if (def.type === 'saw') {
                const r = def.sawR || 60;
                ctx.strokeStyle = '#FF6600';
                ctx.lineWidth = 3;
                ctx.globalAlpha = 0.6;
                ctx.beginPath(); ctx.arc(p.x, p.y, r, this.sawAngle, this.sawAngle+Math.PI*1.5); ctx.stroke();
                ctx.globalAlpha = 1;
            }
        }

        // Player
        this._drawPlayer(ctx);

        // Particles
        for (const pt of this.activeParticles) {
            const alpha = Math.max(0, pt.life/pt.maxLife);
            ctx.globalAlpha = alpha;
            if (pt.type === 'text') {
                ctx.fillStyle = pt.color; ctx.font = 'bold 11px Orbitron, monospace'; ctx.textAlign = 'center';
                ctx.fillText(pt.text, pt.x, pt.y);
            } else {
                ctx.fillStyle = pt.color;
                ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size*alpha, 0, Math.PI*2); ctx.fill();
            }
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
        // Shield
        if (p.passives.shield) {
            ctx.strokeStyle = 'rgba(0,150,255,0.3)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(p.x, p.y, 20, 0, Math.PI*2); ctx.stroke();
        }
        ctx.fillStyle = 'rgba(0,229,255,0.12)';
        ctx.beginPath(); ctx.arc(p.x, p.y, 24, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#00E5FF';
        ctx.beginPath(); ctx.arc(p.x, p.y, 14, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#80DEEA';
        ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#FFF';
        ctx.beginPath(); ctx.arc(p.x-4, p.y-3, 3, 0, Math.PI*2); ctx.arc(p.x+4, p.y-3, 3, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(p.x-4, p.y-3, 1.5, 0, Math.PI*2); ctx.arc(p.x+4, p.y-3, 1.5, 0, Math.PI*2); ctx.fill();
    }

    _drawEnemy(ctx, e) {
        if (e.cloak && e.cloakTimer < 2) { ctx.globalAlpha = 0.3; }
        if (e.hitFlash > 0) ctx.fillStyle = '#FFF';
        else ctx.fillStyle = e.color;

        // Elite glow
        if (e.isElite && e.eliteGlow) {
            ctx.shadowColor = e.eliteGlow; ctx.shadowBlur = 12;
        }

        ctx.beginPath(); ctx.arc(e.x, e.y, e.size, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;

        if (e.isBoss) {
            ctx.fillStyle = '#333';
            ctx.beginPath(); ctx.arc(e.x, e.y, e.size*0.7, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = e.color;
            ctx.beginPath(); ctx.arc(e.x, e.y, e.size*0.5, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#FFF';
            ctx.beginPath(); ctx.arc(e.x-8, e.y-5, 5, 0, Math.PI*2); ctx.arc(e.x+8, e.y-5, 5, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#FF0000';
            ctx.beginPath(); ctx.arc(e.x-8, e.y-5, 3, 0, Math.PI*2); ctx.arc(e.x+8, e.y-5, 3, 0, Math.PI*2); ctx.fill();
        } else {
            ctx.fillStyle = '#FFF';
            ctx.beginPath(); ctx.arc(e.x, e.y-2, e.size*0.25, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(e.x, e.y-2, e.size*0.12, 0, Math.PI*2); ctx.fill();
        }

        // Elite badge
        if (e.isElite) {
            ctx.fillStyle = '#FFD700'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('★', e.x, e.y-e.size-4);
        }

        // HP bar
        if (e.hp < e.maxHp) {
            const bw = e.size*2;
            ctx.fillStyle = '#333'; ctx.fillRect(e.x-bw/2, e.y-e.size-8, bw, 3);
            ctx.fillStyle = e.isBoss ? '#FFD700' : '#F44336';
            ctx.fillRect(e.x-bw/2, e.y-e.size-8, bw*(e.hp/e.maxHp), 3);
        }
        ctx.globalAlpha = 1;
    }

    _drawHUD(ctx) {
        const p = this.player;
        ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, W, 50);

        const mins = Math.floor(p.time/60), secs = Math.floor(p.time%60);
        ctx.fillStyle = '#FFF'; ctx.font = 'bold 14px Orbitron,monospace'; ctx.textAlign = 'left';
        ctx.fillText(String(mins).padStart(2,'0')+':'+String(secs).padStart(2,'0'), 10, 18);

        ctx.fillStyle = '#00E5FF'; ctx.textAlign = 'center';
        ctx.fillText('Lv.'+p.level, W/2, 18);

        ctx.fillStyle = '#FF6600'; ctx.textAlign = 'right';
        ctx.fillText('💀 '+p.kills, W-10, 18);
        ctx.fillStyle = '#F44336'; ctx.font = '10px Rajdhani,sans-serif';
        ctx.fillText('Enemies: '+this.activeEnemies.length, W-10, 33);

        // XP bar
        ctx.fillStyle = '#222'; ctx.fillRect(10, 33, W-20, 5);
        ctx.fillStyle = '#4CAF50'; ctx.fillRect(10, 33, (W-20)*(p.xp/p.xpNext), 5);

        // HP bar
        ctx.fillStyle = '#222'; ctx.fillRect(10, H-18, 140, 8);
        ctx.fillStyle = '#F44336'; ctx.fillRect(10, H-18, 140*(p.hp/p.maxHp), 8);
        ctx.fillStyle = '#FFF'; ctx.font = '8px Rajdhani,sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(Math.floor(p.hp)+'/'+p.maxHp, 80, H-11);

        // Weapons display
        ctx.textAlign = 'left'; ctx.font = '11px sans-serif';
        let wx = 10;
        for (const [wk, wv] of Object.entries(p.weapons)) {
            const def = WEAPONS[wk] || EVOLUTIONS[wk];
            if (def) { ctx.fillStyle = '#AAA'; ctx.fillText(def.icon, wx, H-30); wx += 18; }
        }

        // Event
        if (this.activeEvent) {
            const evt = EVENTS.find(e => e.effect === this.activeEvent);
            if (evt) {
                ctx.fillStyle = 'rgba(255,200,0,0.8)'; ctx.font = 'bold 12px Orbitron,monospace'; ctx.textAlign = 'center';
                ctx.fillText(evt.icon+' '+evt.name+' '+Math.ceil(this.eventTimerLeft)+'s', W/2, 62);
            }
        }

        // Stats
        ctx.fillStyle = '#666'; ctx.font = '9px Rajdhani,sans-serif'; ctx.textAlign = 'right';
        ctx.fillText('DMG:'+Math.floor(p.damage*p.dmgMul)+' SPD:'+Math.floor(p.atkSpeed*p.atkSpeedMul*10)/10+' CRIT:'+Math.floor(p.critChance*100)+'%', W-10, H-11);
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
        ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 24px Orbitron,monospace';
        ctx.fillText('LEVEL UP!', W/2, 130);
        ctx.fillStyle = '#FFF'; ctx.font = '13px Rajdhani,sans-serif';
        ctx.fillText('Chọn 1 nâng cấp (phím 1-3)', W/2, 155);

        for (let i = 0; i < this.upgradeChoices.length; i++) {
            const c = this.upgradeChoices[i];
            const bx = W/2-130, by = 170+i*80;
            ctx.fillStyle = c.type==='weapon' ? 'rgba(0,229,255,0.1)' : 'rgba(255,200,0,0.1)';
            ctx.fillRect(bx, by, 260, 65);
            ctx.strokeStyle = c.type==='weapon' ? '#00E5FF' : '#FFD700';
            ctx.lineWidth = 1; ctx.strokeRect(bx, by, 260, 65);

            ctx.font = '22px sans-serif'; ctx.textAlign = 'left';
            ctx.fillStyle = '#FFF'; ctx.fillText(c.icon, bx+12, by+30);
            ctx.font = 'bold 13px Rajdhani,sans-serif';
            ctx.fillStyle = '#FFF'; ctx.fillText(c.name, bx+45, by+25);
            ctx.fillStyle = '#AAA'; ctx.font = '11px Rajdhani,sans-serif';
            ctx.fillText(c.desc, bx+45, by+45);
            ctx.fillStyle = '#555'; ctx.font = '10px Rajdhani,sans-serif'; ctx.textAlign = 'right';
            ctx.fillText('['+(i+1)+']', bx+250, by+58);
        }
    }

    _drawGameOver(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.88)'; ctx.fillRect(0, 0, W, H);
        const p = this.player, best = SaveManager.load();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#F44336'; ctx.font = 'bold 30px Orbitron,monospace';
        ctx.fillText('GAME OVER', W/2, 100);

        ctx.fillStyle = '#FFF'; ctx.font = '15px Rajdhani,sans-serif';
        const mins = Math.floor(p.time/60), secs = Math.floor(p.time%60);
        ctx.fillText('Thời gian: '+String(mins).padStart(2,'0')+':'+String(secs).padStart(2,'0'), W/2, 160);
        ctx.fillText('Giết: '+p.kills, W/2, 190);
        ctx.fillText('Level: '+p.level, W/2, 220);

        // Weapons used
        ctx.fillStyle = '#888'; ctx.font = '12px Rajdhani,sans-serif';
        const weps = Object.keys(p.weapons).map(k => (WEAPONS[k]||EVOLUTIONS[k]||{}).icon||'?').join(' ');
        ctx.fillText('Vũ khí: '+weps, W/2, 260);

        ctx.fillStyle = '#FFD700';
        ctx.fillText('+'+Math.floor(p.time/30+p.kills/10+p.level)+' Tech Credits', W/2, 290);

        ctx.fillStyle = '#666'; ctx.font = '11px Rajdhani,sans-serif';
        ctx.fillText('Kỷ lục: '+Math.floor(best.bestTime/60)+':'+String(best.bestTime%60).padStart(2,'0')+' | '+best.bestKills+' kills | Lv.'+best.bestLevel, W/2, 330);

        ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(W/2-80, 380, 160, 32);
        ctx.strokeStyle = '#00E5FF'; ctx.strokeRect(W/2-80, 380, 160, 32);
        ctx.fillStyle = '#FFF'; ctx.font = 'bold 14px Rajdhani,sans-serif';
        ctx.fillText('🏠 MENU', W/2, 401);
    }

    _renderMenu(ctx) {
        ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(0,229,255,0.04)'; ctx.lineWidth = 1;
        for (let x=0; x<W; x+=60) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
        for (let y=0; y<H; y+=60) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

        ctx.textAlign = 'center';
        ctx.fillStyle = '#00E5FF'; ctx.font = 'bold 34px Orbitron,monospace';
        ctx.fillText('CYBER SURVIVOR', W/2, 80);
        ctx.fillStyle = '#FF6600'; ctx.font = 'bold 14px Orbitron,monospace';
        ctx.fillText('⚡ PHASE 2 ⚡', W/2, 105);

        // Character
        ctx.fillStyle = 'rgba(0,229,255,0.12)'; ctx.beginPath(); ctx.arc(W/2, 170, 28, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#00E5FF'; ctx.beginPath(); ctx.arc(W/2, 170, 16, 0, Math.PI*2); ctx.fill();

        // Weapons preview
        ctx.font = '18px sans-serif';
        ctx.fillText('🔫🔴🚀⚡🛸⚙️💜❄️🎯', W/2, 225);

        // Buttons
        const buttons = [
            { y:260, text:'▶ BẮT ĐẦU', color:'#00E5FF' },
            { y:310, text:'🔧 NÂNG CẤP', color:'#FF6600' }
        ];
        for (const btn of buttons) {
            ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(W/2-80, btn.y, 160, 32);
            ctx.strokeStyle = btn.color; ctx.lineWidth = 1; ctx.strokeRect(W/2-80, btn.y, 160, 32);
            ctx.fillStyle = '#FFF'; ctx.font = 'bold 14px Rajdhani,sans-serif';
            ctx.fillText(btn.text, W/2, btn.y+21);
        }

        const best = SaveManager.load();
        ctx.fillStyle = '#666'; ctx.font = '11px Rajdhani,sans-serif';
        ctx.fillText('Kỷ lục: '+Math.floor(best.bestTime/60)+':'+String(best.bestTime%60).padStart(2,'0')+' | '+best.bestKills+' kills | Lv.'+best.bestLevel, W/2, 380);
        ctx.fillText('Tech Credits: '+best.techCredits, W/2, 400);

        ctx.fillStyle = '#444'; ctx.font = '11px Rajdhani,sans-serif';
        ctx.fillText('WASD: Di chuyển | ESC: Tạm dừng | Mobile: Joystick', W/2, 460);
        ctx.fillText('9 vũ khí + 10 bị động + 9 tiến hóa + 4 boss + sự kiện ngẫu nhiên', W/2, 480);
    }

    _renderMeta(ctx) {
        ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, W, H);
        const save = SaveManager.load();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FF6600'; ctx.font = 'bold 22px Orbitron,monospace';
        ctx.fillText('NÂNG CẤP VĨNH VIỄN', W/2, 40);
        ctx.fillStyle = '#FFD700'; ctx.font = '14px Rajdhani,sans-serif';
        ctx.fillText('Tech Credits: '+save.techCredits, W/2, 65);

        for (let i = 0; i < META_ORDER.length; i++) {
            const key = META_ORDER[i], def = META_UPGRADES[key];
            const lv = save.meta[key] || 0;
            const bx = W/2-150, by = 120+i*55;
            const maxed = lv >= def.maxLv;
            const cost = maxed ? 0 : def.cost[lv];
            const canBuy = !maxed && save.techCredits >= cost;

            ctx.fillStyle = maxed ? 'rgba(76,175,80,0.15)' : canBuy ? 'rgba(255,102,0,0.15)' : 'rgba(100,100,100,0.1)';
            ctx.fillRect(bx, by, 300, 45);
            ctx.strokeStyle = maxed ? '#4CAF50' : canBuy ? '#FF6600' : '#444';
            ctx.strokeRect(bx, by, 300, 45);

            ctx.textAlign = 'left';
            ctx.fillStyle = '#FFF'; ctx.font = '16px sans-serif';
            ctx.fillText(def.icon, bx+10, by+27);
            ctx.font = 'bold 13px Rajdhani,sans-serif';
            ctx.fillText(def.name+' ('+lv+'/'+def.maxLv+')', bx+40, by+20);
            ctx.fillStyle = '#888'; ctx.font = '11px Rajdhani,sans-serif';
            ctx.fillText(def.desc, bx+40, by+37);

            ctx.textAlign = 'right';
            if (maxed) { ctx.fillStyle = '#4CAF50'; ctx.font = 'bold 11px Rajdhani,sans-serif'; ctx.fillText('MAX', bx+290, by+27); }
            else { ctx.fillStyle = canBuy ? '#FFD700' : '#666'; ctx.font = '12px Rajdhani,sans-serif'; ctx.fillText('💰'+cost, bx+290, by+27); }
        }

        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(W/2-50, H-50, 100, 28);
        ctx.strokeStyle = '#666'; ctx.strokeRect(W/2-50, H-50, 100, 28);
        ctx.fillStyle = '#FFF'; ctx.font = '13px Rajdhani,sans-serif';
        ctx.fillText('← QUAY LẠI', W/2, H-33);
    }
}

window.addEventListener('load', () => { new CyberSurvivor(); });
