/**
 * SUPER HERO RAMPAGE - Main Game
 */
class SuperHeroRampage {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = W; this.canvas.height = H;
        this.state = GS.MENU;
        this.lastTime = 0;
        this._rafId = null;

        // Player
        this.player = null;
        // Enemies
        this.enemies = [];
        this.enemyPool = [];
        // Projectiles
        this.projectiles = [];
        this.projPool = [];
        // Particles
        this.particles = [];
        this.partPool = [];
        // Pickups
        this.pickups = [];
        // Floating texts
        this.floatTexts = [];

        // Stage
        this.currentStage = 0;
        this.stageProgress = 0;
        this.waveIndex = 0;
        this.waveTimer = 0;
        this.bossActive = false;
        this.stageComplete = false;

        // Camera
        this.camX = 0;
        this.shakeX = 0; this.shakeY = 0; this.shakeTimer = 0;

        // Combo
        this.comboCount = 0;
        this.comboTimer = 0;
        this.inputBuffer = [];
        this.inputBufferTimer = 0;

        // Slow motion
        this.slowMo = 1;
        this.slowMoTimer = 0;

        // RPG
        this.level = 1;
        this.xp = 0;
        this.xpNext = xpForLevel(1);
        this.money = 0;
        this.unlockedPowers = ['energyBlast'];
        this.equippedPowers = ['energyBlast','',''];
        this.powerCooldowns = {};

        // Stats
        this.stats = { kills:0, combos:0, maxCombo:0, bosses:0, playTime:0 };

        // Shop
        this.shopItems = [];

        // Throwable objects on map
        this.throwables = [];
        // Grabbed enemy
        this.grabbedEnemy = null;
        // Combo display
        this.comboDisplay = { text:'', timer:0, color:'#FFF' };
        // Unlock notifications
        this.unlockNotifs = [];

        // Input
        this.keys = {};
        this.touchControls = { left:false, right:false, up:false, down:false, jump:false, attack:false, special:false, grab:false };

        // Achievements
        this.achievements = {};

        // Auto-save
        this.autoSaveTimer = 30;

        this._setupInput();
        window.addEventListener('beforeunload', () => { this._saveGame(); });
        this._gameLoop(performance.now());
    }

    // ─── Init ───
    _initPlayer() {
        const save = this._loadSave();
        this.player = {
            x: 200, y: GROUND_Y,
            vx: 0, vy: 0,
            width: 30, height: 60,
            facing: 1, // 1=right, -1=left
            grounded: true,
            hp: save.hp || PLAYER_BASE.maxHp,
            maxHp: save.maxHp || PLAYER_BASE.maxHp,
            damage: save.damage || PLAYER_BASE.damage,
            speed: save.speed || PLAYER_BASE.speed,
            jumpForce: save.jumpForce || PLAYER_BASE.jumpForce,
            energy: save.maxEnergy || PLAYER_BASE.maxEnergy,
            maxEnergy: save.maxEnergy || PLAYER_BASE.maxEnergy,
            energyRegen: save.energyRegen || PLAYER_BASE.energyRegen,
            critChance: save.critChance || PLAYER_BASE.critChance,
            level: save.level || 1,
            xp: save.xp || 0,
            xpNext: xpForLevel(save.level || 1),
            money: save.money || 0,
            state: 'idle', // idle, walking, jumping, attacking, hit, dead
            attackTimer: 0,
            attackType: '',
            hitTimer: 0,
            invTimer: 0,
            comboState: 0,
            comboTimer: 0,
            weapon: null,
            weaponTimer: 0,
            heroMode: false,
            heroModeTimer: 0,
            animFrame: 0,
            animTimer: 0,
        };
        this.level = this.player.level;
        this.xp = this.player.xp;
        this.xpNext = this.player.xpNext;
        this.money = this.player.money;
        this.unlockedPowers = save.unlockedPowers || ['energyBlast'];
        this.equippedPowers = save.equippedPowers || ['energyBlast','',''];
        this.stats = save.stats || this.stats;
        this.achievements = save.achievements || {};
    }

    _startStage(stageIndex) {
        this.currentStage = stageIndex;
        this.stageProgress = 0;
        this.waveIndex = 0;
        this.waveTimer = 1;
        this.bossActive = false;
        this.stageComplete = false;
        this.enemies = [];
        this.projectiles = [];
        this.throwables = [];
        this.grabbedEnemy = null;
        this.pickups = [];
        this.particles = [];
        this.floatTexts = [];
        this.camX = 0;
        this.player.x = 200;
        this.player.y = GROUND_Y;
        this.player.state = 'idle';
        this.player.hp = this.player.maxHp;
        this.player.energy = this.player.maxEnergy;
        this.state = GS.PLAYING;

        // Spawn throwable objects
        const objTypes = Object.keys(THROWABLE_OBJECTS);
        for (let i = 0; i < 5 + stageIndex * 2; i++) {
            const type = objTypes[Math.floor(Math.random() * objTypes.length)];
            this.throwables.push({
                type,
                x: 100 + Math.random() * 700,
                y: GROUND_Y,
                vx: 0, vy: 0,
                grounded: true,
                thrown: false,
                life: 999
            });
        }
    }

    // ─── Save/Load ───
    _loadSave() {
        try {
            const raw = localStorage.getItem('superHeroRampage_save');
            return raw ? JSON.parse(raw) : {};
        } catch(e) { return {}; }
    }

    _saveGame() {
        const save = {
            hp: this.player?.maxHp || PLAYER_BASE.maxHp,
            maxHp: this.player?.maxHp || PLAYER_BASE.maxHp,
            damage: this.player?.damage || PLAYER_BASE.damage,
            speed: this.player?.speed || PLAYER_BASE.speed,
            jumpForce: this.player?.jumpForce || PLAYER_BASE.jumpForce,
            maxEnergy: this.player?.maxEnergy || PLAYER_BASE.maxEnergy,
            energyRegen: this.player?.energyRegen || PLAYER_BASE.energyRegen,
            critChance: this.player?.critChance || PLAYER_BASE.critChance,
            level: this.level,
            xp: this.xp,
            money: this.money,
            unlockedPowers: this.unlockedPowers,
            equippedPowers: this.equippedPowers,
            stats: this.stats,
            achievements: this.achievements,
            currentStage: this.currentStage,
        };
        try { localStorage.setItem('superHeroRampage_save', JSON.stringify(save)); } catch(e) {}
    }

    // ─── Input ───
    _setupInput() {
        document.addEventListener('keydown', e => {
            this.keys[e.key.toLowerCase()] = true;
            if (this.state === GS.PLAYING) {
                if (e.key === 'p' || e.key === 'P') this._pauseGame();
                this._bufferInput(e.key.toLowerCase());
            }
            if (this.state === GS.PAUSED && (e.key === 'p' || e.key === 'P')) this._resumeGame();
        });
        document.addEventListener('keyup', e => { this.keys[e.key.toLowerCase()] = false; });

        // Touch controls
        const tcs = [
            { id:'btn-left',  key:'left',  x:20,  y:H-120, w:60, h:60 },
            { id:'btn-right', key:'right', x:100, y:H-120, w:60, h:60 },
            { id:'btn-up',    key:'up',    x:60,  y:H-180, w:60, h:50 },
            { id:'btn-down',  key:'down',  x:60,  y:H-60,  w:60, h:50 },
            { id:'btn-jump',  key:'jump',  x:W-180,y:H-120,w:70, h:70 },
            { id:'btn-attack',key:'attack',x:W-100,y:H-120,w:70, h:70 },
            { id:'btn-grab',key:'grab',x:W-180,y:H-200,w:60, h:50 },
            { id:'btn-special',key:'special',x:W-100,y:H-200,w:70, h:50 },
        ];
        for (const tc of tcs) {
            const el = document.getElementById(tc.id);
            if (!el) continue;
            el.addEventListener('touchstart', e => { e.preventDefault(); this.touchControls[tc.key] = true; });
            el.addEventListener('touchend', e => { e.preventDefault(); this.touchControls[tc.key] = false; });
            el.addEventListener('touchcancel', e => { this.touchControls[tc.key] = false; });
        }
        // Canvas click for menu
        this.canvas.addEventListener('click', e => {
            if (this.state === GS.MENU) {
                this._initPlayer();
                this._startStage(0);
            }
            if (this.state === GS.GAMEOVER || this.state === GS.VICTORY) {
                this.state = GS.MENU;
            }
        });
    }

    _bufferInput(key) {
        this.inputBuffer.push(key);
        this.inputBufferTimer = 0.5;
        if (this.inputBuffer.length > 10) this.inputBuffer.shift();
    }

    _pauseGame() { this.state = GS.PAUSED; }
    _resumeGame() { this.state = GS.PLAYING; }

    // ─── Game Loop ───
    _gameLoop(now) {
        this._rafId = requestAnimationFrame(t => this._gameLoop(t));
        const elapsed = now - this.lastTime;
        if (elapsed < 16) return;
        this.lastTime = now - (elapsed % 16);
        const dt = Math.min(elapsed / 1000, 0.05) * this.slowMo;
        try {
            if (this.state === GS.PLAYING) this._update(dt);
            this._render();
        } catch(e) { console.error('Hero error:', e); }
    }

    destroy() {
        if (this._rafId) cancelAnimationFrame(this._rafId);
        this._saveGame();
    }

    // ─── Update ───
    _update(dt) {
        this.stats.playTime += dt;
        this.autoSaveTimer -= dt;
        if (this.autoSaveTimer <= 0) { this.autoSaveTimer = 30; this._saveGame(); }

        // Slow motion
        if (this.slowMoTimer > 0) {
            this.slowMoTimer -= dt / this.slowMo;
            if (this.slowMoTimer <= 0) this.slowMo = 1;
        }

        // Player
        this._updatePlayer(dt);
        // Update grabbed enemy position
        if (this.grabbedEnemy) {
            this.grabbedEnemy.x = this.player.x + this.player.facing * 30;
            this.grabbedEnemy.y = this.player.y - 30;
        }
        // Enemies
        this._updateEnemies(dt);
        // Projectiles
        this._updateProjectiles(dt);
        // Throwable objects
        this._updateThrowables(dt);
        // Pickups
        this._updatePickups(dt);
        // Particles
        this._updateParticles(dt);
        // Float texts
        this._updateFloatTexts(dt);
        // Stage waves
        this._updateStageWaves(dt);
        // Camera
        this._updateCamera(dt);
        // Combo timer
        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                if (this.comboCount > this.stats.maxCombo) this.stats.maxCombo = this.comboCount;
                this.comboCount = 0;
            }
        }
        // Input buffer
        if (this.inputBufferTimer > 0) {
            this.inputBufferTimer -= dt;
            if (this.inputBufferTimer <= 0) this.inputBuffer = [];
        }
        // Unlock notifications
        for (let i = this.unlockNotifs.length - 1; i >= 0; i--) {
            this.unlockNotifs[i].timer -= dt;
            if (this.unlockNotifs[i].timer <= 0) this.unlockNotifs.splice(i, 1);
        }
    }

    _updatePlayer(dt) {
        const p = this.player;
        if (!p || p.state === 'dead') return;

        // Energy regen
        p.energy = Math.min(p.maxEnergy, p.energy + p.energyRegen * dt);

        // Hero mode
        if (p.heroMode) {
            p.heroModeTimer -= dt;
            if (p.heroModeTimer <= 0) p.heroMode = false;
        }

        // Weapon timer
        if (p.weapon && p.weaponTimer > 0) {
            p.weaponTimer -= dt;
            if (p.weaponTimer <= 0) p.weapon = null;
        }

        // Invincibility
        if (p.invTimer > 0) p.invTimer -= dt;

        // Hit stun
        if (p.hitTimer > 0) {
            p.hitTimer -= dt;
            p.vx *= 0.9;
            if (p.hitTimer <= 0) p.state = 'idle';
            return;
        }

        // Attack timer
        if (p.attackTimer > 0) {
            p.attackTimer -= dt;
            if (p.attackTimer <= 0) {
                p.state = 'idle';
                p.comboState = 0;
            }
            return;
        }

        // Movement
        let moveX = 0, moveY = 0;
        if (this.keys['a'] || this.keys['arrowleft'] || this.touchControls.left) moveX = -1;
        if (this.keys['d'] || this.keys['arrowright'] || this.touchControls.right) moveX = 1;
        if (this.keys['w'] || this.keys['arrowup'] || this.touchControls.up) moveY = -1;
        if (this.keys['s'] || this.keys['arrowdown'] || this.touchControls.down) moveY = 1;

        if (moveX !== 0) {
            p.facing = moveX;
            p.state = 'walking';
        } else if (p.state === 'walking') {
            p.state = 'idle';
        }

        p.vx = moveX * p.speed;
        p.x += p.vx * dt;
        p.x = Math.max(30, Math.min(930, p.x));

        // Jump
        if ((this.keys[' '] || this.touchControls.jump) && p.grounded) {
            p.vy = -p.jumpForce;
            p.grounded = false;
            p.state = 'jumping';
        }

        // Gravity
        if (!p.grounded) {
            p.vy += GRAVITY * dt;
            p.y += p.vy * dt;
            if (p.y >= GROUND_Y) {
                p.y = GROUND_Y;
                p.vy = 0;
                p.grounded = true;
                if (p.state === 'jumping') p.state = 'idle';
            }
        }

        // Attack
        if (this.keys['j'] || this.keys['z'] || this.touchControls.attack) {
            if (this.grabbedEnemy) {
                this._throwEnemy();
            } else {
                this._playerAttack();
            }
            this.keys['j'] = false; this.keys['z'] = false; this.touchControls.attack = false;
        }

        // Grab/Throw (G key or touch)
        if (this.keys['g'] || this.touchControls.grab) {
            if (this.grabbedEnemy) {
                this._throwEnemy();
            } else {
                this._grabEnemy();
            }
            this.keys['g'] = false; this.touchControls.grab = false;
        }

        // Ground attack (down + attack while in air)
        if (!p.grounded && (this.keys['s'] || this.touchControls.down) && (this.keys['j'] || this.touchControls.attack)) {
            this._groundPound();
            this.keys['j'] = false; this.touchControls.attack = false;
        }

        // Pick up throwable object
        if (this.keys['l'] || this.touchControls.special) {
            this._pickUpThrowable();
            this.keys['l'] = false;
        }

        // Special power
        if (this.keys['k'] || this.keys['x'] || this.touchControls.special) {
            this._usePower();
            this.keys['k'] = false; this.keys['x'] = false; this.touchControls.special = false;
        }

        // Check combos
        this._checkCombos();

        // Animation
        p.animTimer += dt;
        if (p.animTimer > 0.15) {
            p.animTimer = 0;
            p.animFrame = (p.animFrame + 1) % 4;
        }
    }

    _playerAttack() {
        const p = this.player;
        if (p.attackTimer > 0 || p.hitTimer > 0) return;

        p.state = 'attacking';
        p.attackType = p.grounded ? 'punch' : 'air';
        p.attackTimer = 0.25;
        p.comboState++;

        const dmg = p.damage + (p.weapon ? WEAPONS[p.weapon].damage : 0);
        const crit = Math.random() < p.critChance;
        const finalDmg = crit ? dmg * 2 : dmg;

        // Hit enemies in range
        const range = 60;
        for (const e of this.enemies) {
            if (e.state === 'dead') continue;
            const dx = e.x - p.x;
            const dy = e.y - p.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < range && Math.sign(dx) === p.facing) {
                this._damageEnemy(e, finalDmg, crit);
                // Knockback
                e.vx = p.facing * 200;
                e.vy = -100;
                e.hitTimer = 0.2;
                // Combo
                this.comboCount++;
                this.comboTimer = 2;
                this.stats.combos = Math.max(this.stats.combos, this.comboCount);
                // Particles
                this._spawnHitParticles(e.x, e.y - 20, crit);
                // Screen shake
                this._shake(crit ? 8 : 3);
                // Slow mo on crit
                if (crit) { this.slowMo = 0.3; this.slowMoTimer = 0.15; }
            }
        }
    }

    _grabEnemy() {
        const p = this.player;
        const range = 50;
        for (const e of this.enemies) {
            if (e.state === 'dead' || e.isBoss) continue;
            const dx = e.x - p.x;
            const dist = Math.abs(dx);
            if (dist < range && Math.sign(dx) === p.facing) {
                this.grabbedEnemy = e;
                e.state = 'grabbed';
                e.hitTimer = 0;
                this._floatText(e.x, e.y - 40, 'GRAB!', '#FFD700');
                this._shake(3);
                break;
            }
        }
    }

    _throwEnemy() {
        const p = this.player;
        const e = this.grabbedEnemy;
        if (!e) return;

        // Throw enemy forward
        e.vx = p.facing * 500;
        e.vy = -200;
        e.state = 'idle';
        e.hitTimer = 0.5;
        this.grabbedEnemy = null;

        // Damage thrown enemy
        this._damageEnemy(e, 30, false);

        // Damage enemies hit by thrown enemy
        for (const other of this.enemies) {
            if (other === e || other.state === 'dead') continue;
            const dist = Math.abs(other.x - e.x);
            if (dist < 60) {
                this._damageEnemy(other, 40, false);
                other.vx = e.vx * 0.5;
                other.vy = -150;
                other.hitTimer = 0.3;
                this._spawnHitParticles(other.x, other.y - 20, false);
            }
        }

        this._floatText(e.x, e.y - 40, 'THROW!', '#FF4444');
        this._shake(10);
        this.comboCount += 3;
        this.comboTimer = 2;
    }

    _groundPound() {
        const p = this.player;
        p.vy = 800; // Slam down fast
        p.state = 'attacking';
        p.attackTimer = 0.3;

        // Damage all enemies below
        for (const e of this.enemies) {
            if (e.state === 'dead') continue;
            const dx = Math.abs(e.x - p.x);
            const dy = e.y - p.y;
            if (dx < 80 && dy > -20) {
                this._damageEnemy(e, 60 + p.damage, false);
                e.vy = -300;
                e.hitTimer = 0.3;
                this._spawnHitParticles(e.x, e.y - 10, false);
            }
        }
        this._shake(15);
        this.slowMo = 0.2;
        this.slowMoTimer = 0.2;
        this._floatText(p.x, p.y + 20, 'GROUND SLAM!', '#FF8800');
        this.comboCount += 2;
        this.comboTimer = 2;
    }

    _pickUpThrowable() {
        const p = this.player;
        for (let i = 0; i < this.throwables.length; i++) {
            const t = this.throwables[i];
            const dist = Math.abs(t.x - p.x);
            if (dist < 40 && t.grounded) {
                // Throw it
                const def = THROWABLE_OBJECTS[t.type];
                this._spawnProjectile(t.x, t.y - 15, p.facing * 400, -100, def.damage, def.color, def.size/2);
                this.throwables.splice(i, 1);
                this._floatText(t.x, t.y - 30, def.name + '!', '#FFD700');
                this._shake(5);
                break;
            }
        }
    }

    _checkCombos() {
        const buf = this.inputBuffer;
        if (buf.length < 2) return;
        for (const [key, combo] of Object.entries(COMBOS)) {
            if (this.level < combo.unlock) continue;
            const keys = combo.keys;
            if (buf.length >= keys.length) {
                const slice = buf.slice(-keys.length);
                if (keys.every((k, i) => k === slice[i])) {
                    this._executeCombo(combo);
                    this.inputBuffer = [];
                    break;
                }
            }
        }
    }

    _executeCombo(combo) {
        const p = this.player;
        const dmg = combo.damage + p.damage;
        const crit = Math.random() < p.critChance;
        const finalDmg = crit ? dmg * 2 : dmg;

        // Hit all enemies in range
        const range = 100;
        for (const e of this.enemies) {
            if (e.state === 'dead') continue;
            const dx = e.x - p.x;
            const dist = Math.abs(dx);
            if (dist < range) {
                this._damageEnemy(e, finalDmg, crit);
                e.vx = p.facing * 300;
                e.vy = -200;
                e.hitTimer = 0.3;
                this._spawnHitParticles(e.x, e.y - 20, crit);
            }
        }
        this._shake(10);
        this.slowMo = 0.2;
        this.slowMoTimer = 0.2;
        this._floatText(p.x, p.y - 60, combo.name + '!', '#FFD700');
    }

    _usePower() {
        const p = this.player;
        const powerKey = this.equippedPowers[0];
        if (!powerKey || !POWERS[powerKey]) return;
        const power = POWERS[powerKey];
        if (this.powerCooldowns[powerKey] > 0) return;
        if (p.energy < 20) return;

        p.energy -= 20;
        this.powerCooldowns[powerKey] = power.cooldown;

        if (powerKey === 'energyBlast') {
            // Projectile
            this._spawnProjectile(p.x + p.facing * 30, p.y - 30, p.facing * 400, 0, power.damage, '#4FF', 10);
        } else if (powerKey === 'shockwave') {
            for (const e of this.enemies) {
                if (e.state === 'dead') continue;
                const dist = Math.abs(e.x - p.x);
                if (dist < 150) {
                    this._damageEnemy(e, power.damage, false);
                    e.vx = (e.x > p.x ? 1 : -1) * 400;
                    e.vy = -200;
                }
            }
            this._shake(15);
        } else if (powerKey === 'dashStrike') {
            p.vx = p.facing * 600;
            for (const e of this.enemies) {
                if (e.state === 'dead') continue;
                const dist = Math.abs(e.x - p.x);
                if (dist < 80) {
                    this._damageEnemy(e, power.damage, false);
                    e.vx = p.facing * 300;
                }
            }
        } else if (powerKey === 'heroMode') {
            p.heroMode = true;
            p.heroModeTimer = power.duration;
            this._floatText(p.x, p.y - 60, 'HERO MODE!', '#FFD700');
        } else if (powerKey === 'ultimateBeam') {
            // Beam forward
            for (const e of this.enemies) {
                if (e.state === 'dead') continue;
                if (Math.sign(e.x - p.x) === p.facing && Math.abs(e.y - p.y) < 50) {
                    this._damageEnemy(e, power.damage, false);
                }
            }
            this._shake(20);
            this.slowMo = 0.1;
            this.slowMoTimer = 0.3;
        }
    }

    _damageEnemy(e, damage, crit) {
        e.hp -= damage;
        if (e.hp <= 0) {
            e.state = 'dead';
            e.deathTimer = 0.5;
            this.stats.kills++;
            this._addXP(e.xp);
            this._floatText(e.x, e.y - 40, (crit ? 'CRIT! ' : '') + damage, crit ? '#FF4444' : '#FFFFFF');
            // Drop money
            this.money += Math.floor(e.xp / 2);
        } else {
            this._floatText(e.x, e.y - 40, (crit ? 'CRIT! ' : '') + damage, crit ? '#FF4444' : '#FFFF00');
        }
    }

    _addXP(amount) {
        this.xp += amount;
        this.player.xp = this.xp;
        while (this.xp >= this.xpNext) {
            this.xp -= this.xpNext;
            this.level++;
            this.player.level = this.level;
            this.xpNext = xpForLevel(this.level);
            this.player.xpNext = this.xpNext;
            // Level up bonuses
            this.player.maxHp += 10;
            this.player.hp = this.player.maxHp;
            this.player.damage += 3;
            this.player.maxEnergy += 5;
            this.player.energy = this.player.maxEnergy;
            this._floatText(this.player.x, this.player.y - 80, 'LEVEL UP! Lv.' + this.level, '#FFD700');
            this._shake(8);
            this.slowMo = 0.3;
            this.slowMoTimer = 0.3;

            // Check combo unlocks
            for (const [key, combo] of Object.entries(COMBOS)) {
                if (this.level === combo.unlock) {
                    this.unlockNotifs.push({ text:'New Combo: ' + combo.name, timer:3, color:'#FF8800' });
                    this._floatText(this.player.x, this.player.y - 100, 'Combo: ' + combo.name + '!', '#FF8800');
                }
            }

            // Check power unlocks
            for (const [key, power] of Object.entries(POWERS)) {
                if (this.level >= power.unlock && !this.unlockedPowers.includes(key)) {
                    this.unlockedPowers.push(key);
                    this.unlockNotifs.push({ text:'New Power: ' + power.name, timer:3, color:'#4FF' });
                    this._floatText(this.player.x, this.player.y - 120, 'Power: ' + power.name + '!', '#4FF');
                }
            }
        }
    }

    // ─── Enemy Update ───
    _updateEnemies(dt) {
        const p = this.player;
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            if (e.state === 'dead') {
                e.deathTimer -= dt;
                if (e.deathTimer <= 0) {
                    this.enemies.splice(i, 1);
                    this.enemyPool.push(e);
                }
                continue;
            }
            // AI
            const dx = p.x - e.x;
            const dy = p.y - e.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const dir = Math.sign(dx);

            if (e.hitTimer > 0) {
                e.hitTimer -= dt;
                e.x += e.vx * dt;
                e.vx *= 0.9;
            } else if (dist < 50 && !e.flying) {
                // Attack
                if (e.attackTimer <= 0) {
                    e.attackTimer = 1;
                    if (p.invTimer <= 0) {
                        const dmg = e.damage;
                        p.hp -= dmg;
                        p.hitTimer = 0.3;
                        p.vx = -dir * 200;
                        p.vy = -100;
                        p.invTimer = 0.5;
                        this._shake(5);
                        this._floatText(p.x, p.y - 40, '-' + dmg, '#FF4444');
                        if (p.hp <= 0) {
                            p.state = 'dead';
                            this.state = GS.GAMEOVER;
                        }
                    }
                }
            } else {
                // Move toward player
                e.x += dir * e.speed * dt;
                if (e.flying) {
                    e.y += Math.sign(dy) * e.speed * 0.5 * dt;
                    e.y = Math.max(100, Math.min(GROUND_Y, e.y));
                }
            }
            e.x = Math.max(10, Math.min(950, e.x));
            if (e.attackTimer > 0) e.attackTimer -= dt;
        }
    }

    _spawnEnemy(type, x) {
        const def = ENEMY_TYPES[type];
        if (!def) return;
        let e = this.enemyPool.pop() || {};
        e.type = type;
        e.x = x || (Math.random() > 0.5 ? -20 : W + 20);
        e.y = def.flying ? 200 : GROUND_Y;
        e.vx = 0; e.vy = 0;
        e.hp = def.hp;
        e.maxHp = def.hp;
        e.damage = def.damage;
        e.speed = def.speed;
        e.xp = def.xp;
        e.state = 'idle';
        e.hitTimer = 0;
        e.attackTimer = 0;
        e.deathTimer = 0;
        e.size = def.size;
        e.color = def.color;
        e.flying = def.flying || false;
        e.shield = def.shield || false;
        this.enemies.push(e);
    }

    _spawnBoss(type) {
        const def = BOSS_TYPES[type];
        if (!def) return;
        let e = this.enemyPool.pop() || {};
        e.type = type;
        e.isBoss = true;
        e.x = 700;
        e.y = GROUND_Y;
        e.vx = 0; e.vy = 0;
        e.hp = def.hp;
        e.maxHp = def.hp;
        e.damage = def.damage;
        e.speed = def.speed;
        e.xp = def.xp;
        e.state = 'idle';
        e.hitTimer = 0;
        e.attackTimer = 0;
        e.deathTimer = 0;
        e.size = def.size;
        e.color = def.color;
        e.flying = false;
        e.bossAttacks = def.attacks;
        e.bossAttackIndex = 0;
        e.bossAttackTimer = 3;
        this.enemies.push(e);
        this.bossActive = true;
    }

    // ─── Projectiles ───
    _spawnProjectile(x, y, vx, vy, damage, color, size) {
        let p = this.projPool.pop() || {};
        p.x = x; p.y = y; p.vx = vx; p.vy = vy;
        p.damage = damage; p.color = color; p.size = size || 5;
        p.life = 2;
        this.projectiles.push(p);
    }

    _updateProjectiles(dt) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            if (p.life <= 0 || p.x < -50 || p.x > W+50) {
                this.projectiles.splice(i, 1);
                this.projPool.push(p);
                continue;
            }
            // Hit enemies
            for (const e of this.enemies) {
                if (e.state === 'dead') continue;
                const dist = Math.sqrt((e.x-p.x)**2 + (e.y-p.y)**2);
                if (dist < e.size + p.size) {
                    this._damageEnemy(e, p.damage, false);
                    this.projectiles.splice(i, 1);
                    this.projPool.push(p);
                    break;
                }
            }
        }
    }

    // ─── Pickups ───
    _updatePickups(dt) {
        const p = this.player;
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const pk = this.pickups[i];
            pk.life -= dt;
            if (pk.life <= 0) { this.pickups.splice(i, 1); continue; }
            const dist = Math.sqrt((pk.x-p.x)**2 + (pk.y-p.y)**2);
            if (dist < 30) {
                if (pk.type === 'health') {
                    p.hp = Math.min(p.maxHp, p.hp + 30);
                    this._floatText(p.x, p.y - 40, '+30 HP', '#4F4');
                } else {
                    p.weapon = pk.type;
                    p.weaponTimer = WEAPONS[pk.type].duration;
                    this._floatText(p.x, p.y - 40, WEAPONS[pk.type].name + '!', '#FFD700');
                }
                this.pickups.splice(i, 1);
            }
        }
    }

    _updateThrowables(dt) {
        for (let i = this.throwables.length - 1; i >= 0; i--) {
            const t = this.throwables[i];
            if (t.thrown) {
                t.x += t.vx * dt;
                t.y += t.vy * dt;
                t.vy += GRAVITY * dt;
                if (t.y >= GROUND_Y) {
                    t.y = GROUND_Y;
                    t.vy = 0;
                    t.vx *= 0.5;
                    if (Math.abs(t.vx) < 10) {
                        t.thrown = false;
                        t.grounded = true;
                    }
                }
                // Hit enemies
                for (const e of this.enemies) {
                    if (e.state === 'dead') continue;
                    const dist = Math.sqrt((e.x-t.x)**2 + (e.y-t.y)**2);
                    if (dist < 30) {
                        this._damageEnemy(e, THROWABLE_OBJECTS[t.type].damage, false);
                        e.vx = t.vx * 0.5;
                        e.vy = -150;
                        this.throwables.splice(i, 1);
                        break;
                    }
                }
            }
            t.life -= dt;
            if (t.life <= 0) this.throwables.splice(i, 1);
        }
    }

    // ─── Stage Waves ───
    _updateStageWaves(dt) {
        const stage = STAGES[this.currentStage];
        if (!stage || this.stageComplete) return;

        this.waveTimer -= dt;
        if (this.waveTimer <= 0) {
            if (this.waveIndex < stage.waves.length) {
                const wave = stage.waves[this.waveIndex];
                for (const type of wave.enemies) {
                    this._spawnEnemy(type);
                }
                this.waveIndex++;
                this.waveTimer = stage.waves[this.waveIndex - 1]?.delay || 3;
            } else if (!this.bossActive && this.enemies.every(e => e.state === 'dead')) {
                // Spawn boss
                this._spawnBoss(stage.boss);
                this._floatText(W/2, 200, 'BOSS: ' + BOSS_TYPES[stage.boss].name, '#FF4444');
            }
        }

        // Check stage complete
        if (this.bossActive && this.enemies.every(e => e.state === 'dead')) {
            this.bossActive = false;
            this.stageComplete = true;
            this.stats.bosses++;
            this._saveGame();
            setTimeout(() => {
                if (this.currentStage < STAGES.length - 1) {
                    this._floatText(W/2, 200, 'STAGE COMPLETE!', '#FFD700');
                    setTimeout(() => {
                        this.currentStage++;
                        this._startStage(this.currentStage);
                    }, 2000);
                } else {
                    this.state = GS.VICTORY;
                }
            }, 1000);
        }
    }

    // ─── Particles ───
    _spawnHitParticles(x, y, crit) {
        const count = crit ? 12 : 5;
        for (let i = 0; i < count; i++) {
            let p = this.partPool.pop() || {};
            p.x = x; p.y = y;
            p.vx = (Math.random()-0.5) * 300;
            p.vy = -100 - Math.random() * 200;
            p.life = 0.3 + Math.random() * 0.3;
            p.maxLife = p.life;
            p.color = crit ? '#FF4444' : '#FFD700';
            p.size = crit ? 4 : 2;
            this.particles.push(p);
        }
    }

    _updateParticles(dt) {
        let write = 0;
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            p.x += p.vx * dt; p.y += p.vy * dt;
            p.vy += 500 * dt;
            p.life -= dt;
            if (p.life > 0) this.particles[write++] = p;
            else this.partPool.push(p);
        }
        this.particles.length = write;
    }

    _updateFloatTexts(dt) {
        let write = 0;
        for (let i = 0; i < this.floatTexts.length; i++) {
            const ft = this.floatTexts[i];
            ft.y -= 40 * dt;
            ft.life -= dt;
            if (ft.life > 0) this.floatTexts[write++] = ft;
        }
        this.floatTexts.length = write;
    }

    _floatText(x, y, text, color) {
        this.floatTexts.push({ x, y, text, color, life: 1 });
    }

    // ─── Camera ───
    _shake(amount) {
        this.shakeTimer = 0.15;
        this.shakeX = (Math.random()-0.5) * amount;
        this.shakeY = (Math.random()-0.5) * amount;
    }

    _updateCamera(dt) {
        if (this.shakeTimer > 0) {
            this.shakeTimer -= dt;
            this.shakeX = (Math.random()-0.5) * 6;
            this.shakeY = (Math.random()-0.5) * 6;
        } else {
            this.shakeX = 0; this.shakeY = 0;
        }
    }

    // ─── Render ───
    _render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, W, H);

        if (this.state === GS.MENU) { this._renderMenu(ctx); return; }
        if (this.state === GS.GAMEOVER) { this._renderGameOver(ctx); return; }
        if (this.state === GS.VICTORY) { this._renderVictory(ctx); return; }

        ctx.save();
        ctx.translate(this.shakeX, this.shakeY);

        // Background
        const stage = STAGES[this.currentStage];
        ctx.fillStyle = stage?.bgColor || '#1a1a2e';
        ctx.fillRect(0, 0, W, H);

        // BG elements
        if (stage?.bgElements) {
            for (const el of stage.bgElements) {
                ctx.fillStyle = el.color;
                if (el.type === 'building' || el.type === 'tower' || el.type === 'pipe') {
                    ctx.fillRect(el.x, GROUND_Y - el.h, 80, el.h);
                } else if (el.type === 'wall') {
                    ctx.fillRect(el.x, GROUND_Y - el.h, el.w, el.h);
                } else if (el.type === 'machine') {
                    ctx.fillRect(el.x, GROUND_Y - el.h, 60, el.h);
                } else if (el.type === 'core') {
                    ctx.fillStyle = el.color;
                    ctx.beginPath();
                    ctx.arc(el.x + el.w/2, el.y + el.h/2, el.w/2, 0, Math.PI*2);
                    ctx.fill();
                }
            }
        }

        // Ground
        ctx.fillStyle = '#333';
        ctx.fillRect(0, GROUND_Y + 30, W, H - GROUND_Y);

        // Pickups
        for (const pk of this.pickups) {
            ctx.fillStyle = pk.type === 'health' ? '#4F4' : '#FFD700';
            ctx.beginPath();
            ctx.arc(pk.x, pk.y, 10, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = '#FFF';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(pk.type === 'health' ? '❤️' : '⚔️', pk.x, pk.y + 4);
        }

        // Throwable objects
        for (const t of this.throwables) {
            const def = THROWABLE_OBJECTS[t.type];
            ctx.fillStyle = def.color;
            ctx.fillRect(t.x - def.size/2, t.y - def.size, def.size, def.size);
            ctx.font = (def.size * 0.8) + 'px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(def.icon, t.x, t.y - def.size/3);
            // Glow effect
            ctx.strokeStyle = 'rgba(255,215,0,0.5)';
            ctx.lineWidth = 2;
            ctx.strokeRect(t.x - def.size/2 - 2, t.y - def.size - 2, def.size + 4, def.size + 4);
        }

        // Enemies
        for (const e of this.enemies) {
            this._renderEnemy(ctx, e);
        }

        // Player
        if (this.player) this._renderPlayer(ctx, this.player);

        // Projectiles
        for (const p of this.projectiles) {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
            ctx.fill();
        }

        // Particles
        for (const p of this.particles) {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
        }
        ctx.globalAlpha = 1;

        // Float texts
        for (const ft of this.floatTexts) {
            ctx.fillStyle = ft.color;
            ctx.globalAlpha = ft.life;
            ctx.font = 'bold 16px Rajdhani,sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(ft.text, ft.x, ft.y);
        }
        ctx.globalAlpha = 1;

        ctx.restore();

        // HUD
        this._renderHUD(ctx);

        // Pause
        if (this.state === GS.PAUSED) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 32px Orbitron,monospace';
            ctx.textAlign = 'center';
            ctx.fillText('PAUSED', W/2, H/2);
            ctx.font = '16px Rajdhani,sans-serif';
            ctx.fillText('Press P to resume', W/2, H/2 + 30);
        }
    }

    _renderPlayer(ctx, p) {
        if (p.invTimer > 0 && Math.floor(p.invTimer*10)%2===0) return;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.scale(p.facing, 1);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 30, 20, 5, 0, 0, Math.PI*2);
        ctx.fill();

        // Hero mode aura
        if (p.heroMode) {
            ctx.fillStyle = 'rgba(255,215,0,0.3)';
            ctx.beginPath();
            ctx.arc(0, -30, 45, 0, Math.PI*2);
            ctx.fill();
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Cape (animated)
        ctx.fillStyle = '#F44';
        ctx.beginPath();
        const capeWave = Math.sin(p.animTimer * 8) * 5;
        ctx.moveTo(-8, -45);
        ctx.lineTo(-25 - capeWave, -5);
        ctx.lineTo(-10, -10);
        ctx.fill();

        // Legs (animated walk)
        const legAnim = p.state === 'walking' ? Math.sin(p.animTimer * 12) * 8 : 0;
        ctx.fillStyle = '#1565C0';
        ctx.fillRect(-8, -10 + legAnim, 7, 15 - legAnim);
        ctx.fillRect(1, -10 - legAnim, 7, 15 + legAnim);
        // Boots
        ctx.fillStyle = '#0D47A1';
        ctx.fillRect(-9, 3 + legAnim, 9, 5);
        ctx.fillRect(0, 3 - legAnim, 9, 5);

        // Body (armor)
        ctx.fillStyle = p.hitTimer > 0 ? '#FF4444' : '#2196F3';
        ctx.fillRect(-14, -50, 28, 42);
        // Armor details
        ctx.fillStyle = '#1976D2';
        ctx.fillRect(-10, -45, 20, 5); // chest plate
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(-3, -42, 6, 3); // emblem

        // Arms
        const armAngle = p.state === 'attacking' ? -1.2 : Math.sin(p.animTimer * 8) * 0.3;
        ctx.fillStyle = '#2196F3';
        // Right arm
        ctx.save();
        ctx.translate(14, -42);
        ctx.rotate(armAngle);
        ctx.fillRect(0, 0, 18, 7);
        // Glove
        ctx.fillStyle = '#F44';
        ctx.fillRect(14, -2, 8, 11);
        ctx.restore();
        // Left arm
        ctx.fillStyle = '#2196F3';
        ctx.save();
        ctx.translate(-14, -42);
        ctx.rotate(-armAngle * 0.5);
        ctx.fillRect(-18, 0, 18, 7);
        ctx.fillStyle = '#F44';
        ctx.fillRect(-22, -2, 8, 11);
        ctx.restore();

        // Head
        ctx.fillStyle = '#FFD';
        ctx.beginPath();
        ctx.arc(0, -60, 13, 0, Math.PI*2);
        ctx.fill();
        // Helmet
        ctx.fillStyle = '#F44';
        ctx.beginPath();
        ctx.arc(0, -63, 14, Math.PI, 0);
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#FFF';
        ctx.fillRect(-6, -62, 5, 4);
        ctx.fillRect(1, -62, 5, 4);
        ctx.fillStyle = '#2196F3';
        ctx.fillRect(-5, -61, 3, 3);
        ctx.fillRect(2, -61, 3, 3);

        // Weapon
        if (p.weapon) {
            ctx.fillStyle = WEAPONS[p.weapon].color;
            ctx.save();
            ctx.translate(18, -38);
            ctx.rotate(armAngle);
            ctx.fillRect(0, -3, 25, 6);
            ctx.restore();
        }

        ctx.restore();

        // HP bar (outside transform)
        ctx.fillStyle = '#333';
        ctx.fillRect(p.x - 18, p.y - 82, 36, 5);
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(p.x - 18, p.y - 82, 36 * (p.hp / p.maxHp), 5);
    }

    _renderEnemy(ctx, e) {
        if (e.state === 'dead') {
            ctx.globalAlpha = e.deathTimer * 2;
        }
        const color = e.hitTimer > 0 ? '#FFF' : e.color;
        const s = e.size;

        ctx.save();
        ctx.translate(e.x, e.y);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 0, s*0.6, s*0.15, 0, 0, Math.PI*2);
        ctx.fill();

        if (e.isBoss) {
            // Boss body
            ctx.fillStyle = color;
            ctx.fillRect(-s/2, -s, s, s);
            // Boss details
            ctx.fillStyle = '#FF0';
            ctx.fillRect(-s/3, -s+10, s/3, 8); // visor
            ctx.fillRect(0, -s+10, s/3, 8);
            // Arms
            ctx.fillStyle = color;
            ctx.fillRect(-s/2-15, -s+20, 15, 25);
            ctx.fillRect(s/2, -s+20, 15, 25);
            // Name
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 12px Rajdhani,sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(BOSS_TYPES[e.type]?.name || 'BOSS', 0, -s-15);
            // HP bar
            ctx.fillStyle = '#333';
            ctx.fillRect(-30, -s-10, 60, 6);
            ctx.fillStyle = '#F44';
            ctx.fillRect(-30, -s-10, 60 * (e.hp / e.maxHp), 6);
        } else {
            // Robot body
            ctx.fillStyle = color;
            ctx.fillRect(-s/2, -s, s, s*0.7); // torso
            ctx.fillRect(-s/3, -s*0.3, s/3, s*0.4); // left leg
            ctx.fillRect(0, -s*0.3, s/3, s*0.4); // right leg
            // Head
            ctx.fillStyle = e.hitTimer > 0 ? '#FFF' : '#666';
            ctx.fillRect(-s/3, -s, s*0.66, s*0.4);
            // Eyes
            ctx.fillStyle = '#F00';
            ctx.fillRect(-s/4, -s*0.8, s*0.15, s*0.15);
            ctx.fillRect(s*0.1, -s*0.8, s*0.15, s*0.15);
            // Antenna
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -s);
            ctx.lineTo(0, -s-8);
            ctx.stroke();
            ctx.fillStyle = '#F00';
            ctx.beginPath();
            ctx.arc(0, -s-10, 3, 0, Math.PI*2);
            ctx.fill();
            // Arms
            ctx.fillStyle = color;
            ctx.fillRect(-s/2-10, -s*0.8, 10, s*0.3);
            ctx.fillRect(s/2, -s*0.8, 10, s*0.3);
            // HP bar
            if (e.hp < e.maxHp) {
                ctx.fillStyle = '#333';
                ctx.fillRect(-12, -s-15, 24, 3);
                ctx.fillStyle = '#F44';
                ctx.fillRect(-12, -s-15, 24 * (e.hp / e.maxHp), 3);
            }
        }
        ctx.restore();
        ctx.globalAlpha = 1;
    }

    _renderHUD(ctx) {
        const p = this.player;
        if (!p) return;

        // Top bar
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, W, 50);

        // HP
        ctx.fillStyle = '#333';
        ctx.fillRect(10, 10, 200, 16);
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(10, 10, 200 * (p.hp / p.maxHp), 16);
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 11px Rajdhani,sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('HP: ' + Math.floor(p.hp) + '/' + p.maxHp, 15, 23);

        // Energy
        ctx.fillStyle = '#333';
        ctx.fillRect(10, 30, 200, 10);
        ctx.fillStyle = '#2196F3';
        ctx.fillRect(10, 30, 200 * (p.energy / p.maxEnergy), 10);

        // Level & XP
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px Orbitron,monospace';
        ctx.textAlign = 'left';
        ctx.fillText('Lv.' + this.level, 220, 20);
        ctx.fillStyle = '#888';
        ctx.font = '11px Rajdhani,sans-serif';
        ctx.fillText('XP: ' + this.xp + '/' + this.xpNext, 220, 35);

        // Money
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px Rajdhani,sans-serif';
        ctx.fillText('💰 ' + this.money, 350, 20);

        // Combo display (Hobo style - big and flashy)
        if (this.comboCount > 1) {
            const comboY = 90;
            const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.1;
            ctx.save();
            ctx.translate(W/2, comboY);
            ctx.scale(pulse, pulse);
            // Background glow
            ctx.fillStyle = 'rgba(255,0,0,0.2)';
            ctx.fillRect(-80, -20, 160, 40);
            // Combo count
            ctx.fillStyle = this.comboCount >= 10 ? '#FFD700' : this.comboCount >= 5 ? '#FF8800' : '#FF4444';
            ctx.font = 'bold 32px Orbitron,monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.comboCount + 'x', 0, 5);
            // Combo text
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 14px Rajdhani,sans-serif';
            const comboTexts = ['COMBO!','GREAT!','AWESOME!','AMAZING!','UNSTOPPABLE!','LEGENDARY!'];
            ctx.fillText(comboTexts[Math.min(this.comboCount - 2, comboTexts.length - 1)], 0, 20);
            ctx.restore();
        }

        // Grabbed enemy indicator
        if (this.grabbedEnemy) {
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 14px Rajdhani,sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Press J/G to THROW!', W/2, H - 150);
        }

        // Controls hint
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '10px Rajdhani,sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('J:Attack G:Grab K:Power L:Throw Object', 10, H - 5);

        // Unlock notifications
        for (let i = 0; i < this.unlockNotifs.length; i++) {
            const notif = this.unlockNotifs[i];
            ctx.fillStyle = notif.color;
            ctx.globalAlpha = Math.min(1, notif.timer);
            ctx.font = 'bold 18px Rajdhani,sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🔓 ' + notif.text, W/2, 140 + i * 30);
        }
        ctx.globalAlpha = 1;

        // Stage
        ctx.fillStyle = '#CCC';
        ctx.font = '12px Rajdhani,sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('Stage ' + (this.currentStage + 1) + ': ' + (STAGES[this.currentStage]?.name || ''), W - 10, 20);

        // Power cooldowns
        for (let i = 0; i < this.equippedPowers.length; i++) {
            const pk = this.equippedPowers[i];
            if (!pk) continue;
            const power = POWERS[pk];
            const cd = this.powerCooldowns[pk] || 0;
            const bx = W - 60 - i * 50;
            ctx.fillStyle = cd > 0 ? '#333' : '#4CAF50';
            ctx.fillRect(bx, 35, 40, 40);
            ctx.fillStyle = '#FFF';
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(power.icon, bx + 20, 58);
            if (cd > 0) {
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(bx, 35, 40, 40 * (cd / power.cooldown));
            }
        }

        // Weapon
        if (p.weapon) {
            ctx.fillStyle = '#FFD700';
            ctx.font = '11px Rajdhani,sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('⚔️ ' + WEAPONS[p.weapon].name + ' (' + Math.ceil(p.weaponTimer) + 's)', 10, H - 10);
        }
    }

    _renderMenu(ctx) {
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, W, H);

        // Title
        ctx.fillStyle = '#FF4444';
        ctx.font = 'bold 48px Orbitron,monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SUPER HERO', W/2, 150);
        ctx.fillStyle = '#FFD700';
        ctx.fillText('RAMPAGE', W/2, 210);

        // Subtitle
        ctx.fillStyle = '#888';
        ctx.font = '16px Rajdhani,sans-serif';
        ctx.fillText('Robot forces have invaded Earth. Fight back!', W/2, 250);

        // Start
        ctx.fillStyle = '#4CAF50';
        ctx.font = 'bold 20px Rajdhani,sans-serif';
        ctx.fillText('[ Click or Tap to Start ]', W/2, 350);

        // Controls
        ctx.fillStyle = '#666';
        ctx.font = '13px Rajdhani,sans-serif';
        ctx.fillText('WASD: Move | J/Z: Attack | K/X: Power | Space: Jump | P: Pause', W/2, 450);
        ctx.fillText('Mobile: Use on-screen buttons', W/2, 470);
    }

    _renderGameOver(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#F44';
        ctx.font = 'bold 48px Orbitron,monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', W/2, H/2 - 30);
        ctx.fillStyle = '#888';
        ctx.font = '16px Rajdhani,sans-serif';
        ctx.fillText('Stage: ' + (this.currentStage+1) + ' | Kills: ' + this.stats.kills + ' | Max Combo: ' + this.stats.maxCombo, W/2, H/2 + 20);
        ctx.fillStyle = '#FFF';
        ctx.fillText('[ Click to Continue ]', W/2, H/2 + 60);
    }

    _renderVictory(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 48px Orbitron,monospace';
        ctx.textAlign = 'center';
        ctx.fillText('VICTORY!', W/2, H/2 - 30);
        ctx.fillStyle = '#4CAF50';
        ctx.font = '16px Rajdhani,sans-serif';
        ctx.fillText('You defeated the AI Overlord and saved Earth!', W/2, H/2 + 10);
        ctx.fillStyle = '#888';
        ctx.fillText('Kills: ' + this.stats.kills + ' | Max Combo: ' + this.stats.maxCombo + ' | Level: ' + this.level, W/2, H/2 + 40);
        ctx.fillStyle = '#FFF';
        ctx.fillText('[ Click to Continue ]', W/2, H/2 + 80);
    }
}
