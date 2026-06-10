/**
 * Age of War - Visual Renderer
 * Procedural sprite construction, animations, effects
 */

const AGE_PALETTES = {
    0: { // Stone
        skin: '#D2A679', body: '#8B6914', bodyDark: '#6B4F12', weapon: '#8B7355',
        accent: '#CD853F', hair: '#4A3728', ground: '#5C4033', sky: '#87CEEB'
    },
    1: { // Medieval
        skin: '#D2A679', body: '#708090', bodyDark: '#4A5568', weapon: '#C0C0C0',
        accent: '#FFD700', hair: '#3D2B1F', ground: '#556B2F', sky: '#6B8E9B'
    },
    2: { // Industrial
        skin: '#C4A882', body: '#556B2F', bodyDark: '#3B4F1E', weapon: '#2F4F4F',
        accent: '#8B8B00', hair: '#2D1F14', ground: '#4A4A4A', sky: '#696969'
    },
    3: { // Modern
        skin: '#C4A882', body: '#2F4F4F', bodyDark: '#1C3333', weapon: '#4A4A4A',
        accent: '#00CED1', hair: '#1A1A1A', ground: '#3C3C3C', sky: '#4A5568'
    },
    4: { // Future
        skin: '#B8C4D0', body: '#4B0082', bodyDark: '#2E0054', weapon: '#7B68EE',
        accent: '#00FFFF', hair: '#2E0054', ground: '#1A0A2E', sky: '#0A0A1A'
    }
};

const Renderer = {
    // ─── Background ───
    drawBackground(ctx, age, gameTime) {
        const pal = AGE_PALETTES[age] || AGE_PALETTES[0];
        const t = gameTime || 0;

        // Sky
        const skyGrad = ctx.createLinearGradient(0, 0, 0, 300);
        skyGrad.addColorStop(0, '#0a0a1a');
        skyGrad.addColorStop(0.5, pal.sky + '88');
        skyGrad.addColorStop(1, pal.ground + '44');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, W, 380);

        // Clouds
        ctx.globalAlpha = 0.15;
        for (let i = 0; i < 5; i++) {
            const cx = ((i * 200 + t * 8) % (W + 200)) - 100;
            const cy = 40 + i * 30 + Math.sin(t * 0.5 + i) * 10;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.ellipse(cx, cy, 60 + i * 10, 20 + i * 3, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Far mountains
        ctx.fillStyle = pal.ground + '66';
        ctx.beginPath();
        ctx.moveTo(0, 320);
        for (let x = 0; x <= W; x += 40) {
            ctx.lineTo(x, 280 + Math.sin(x * 0.008 + 1) * 40 + Math.sin(x * 0.02) * 15);
        }
        ctx.lineTo(W, 380); ctx.lineTo(0, 380); ctx.fill();

        // Near hills
        ctx.fillStyle = pal.ground + '99';
        ctx.beginPath();
        ctx.moveTo(0, 360);
        for (let x = 0; x <= W; x += 30) {
            ctx.lineTo(x, 340 + Math.sin(x * 0.012 + 2) * 20 + Math.sin(x * 0.03) * 8);
        }
        ctx.lineTo(W, 380); ctx.lineTo(0, 380); ctx.fill();

        // Ground
        const groundGrad = ctx.createLinearGradient(0, 370, 0, H);
        groundGrad.addColorStop(0, pal.ground);
        groundGrad.addColorStop(1, '#1a1a1a');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, 370, W, H - 370);

        // Ground line
        ctx.strokeStyle = pal.ground;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 372); ctx.lineTo(W, 372); ctx.stroke();

        // Ambient dust particles
        ctx.globalAlpha = 0.08;
        for (let i = 0; i < 15; i++) {
            const dx = ((i * 73 + t * 15) % W);
            const dy = 350 + Math.sin(t * 0.8 + i * 2.5) * 20;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(dx, dy, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    },

    // ─── Bases ───
    drawBase(ctx, x, isPlayer, age, hp, maxHp, turretCooldown, turretTier, turretLevel) {
        const pal = AGE_PALETTES[age] || AGE_PALETTES[0];
        const dir = isPlayer ? 1 : -1;
        const bx = isPlayer ? x : x - BASE_W;
        const damageRatio = 1 - hp / maxHp;

        ctx.save();

        // Base shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(bx + BASE_W/2, 375, BASE_W * 0.8, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Main structure varies by age
        if (age === 0) {
            // Stone Age: wooden palisade
            ctx.fillStyle = '#6B4226';
            ctx.fillRect(bx, 220, BASE_W, 150);
            // Wood planks
            ctx.strokeStyle = '#5A3520';
            ctx.lineWidth = 1;
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.moveTo(bx + 12 + i * 10, 220);
                ctx.lineTo(bx + 12 + i * 10, 370);
                ctx.stroke();
            }
            // Top spikes
            ctx.fillStyle = '#8B5E3C';
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(bx + 8 + i * 16, 220);
                ctx.lineTo(bx + 14 + i * 16, 200);
                ctx.lineTo(bx + 20 + i * 16, 220);
                ctx.fill();
            }
        } else if (age === 1) {
            // Medieval: castle
            ctx.fillStyle = '#808080';
            ctx.fillRect(bx, 220, BASE_W, 150);
            // Towers
            ctx.fillRect(bx - 5, 200, 15, 170);
            ctx.fillRect(bx + BASE_W - 10, 200, 15, 170);
            // Battlements
            ctx.fillStyle = '#696969';
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(bx - 5 + i * 6, 195, 4, 8);
                ctx.fillRect(bx + BASE_W - 10 + i * 6, 195, 4, 8);
            }
            // Gate
            ctx.fillStyle = '#4A3728';
            ctx.beginPath();
            ctx.arc(bx + BASE_W/2, 340, 12, Math.PI, 0);
            ctx.fillRect(bx + BASE_W/2 - 12, 340, 24, 30);
            ctx.fill();
        } else if (age === 2) {
            // Industrial: factory
            ctx.fillStyle = '#5A5A5A';
            ctx.fillRect(bx, 230, BASE_W, 140);
            // Smokestacks
            ctx.fillStyle = '#4A4A4A';
            ctx.fillRect(bx + 5, 180, 8, 50);
            ctx.fillRect(bx + 30, 190, 8, 40);
            // Smoke
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#888';
            const smokeOff = Math.sin(turretCooldown * 3) * 3;
            ctx.beginPath();
            ctx.arc(bx + 9 + smokeOff, 175, 6, 0, Math.PI * 2);
            ctx.arc(bx + 34 + smokeOff, 185, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            // Windows
            ctx.fillStyle = '#FFD700';
            ctx.globalAlpha = 0.6;
            ctx.fillRect(bx + 10, 260, 8, 8);
            ctx.fillRect(bx + 30, 260, 8, 8);
            ctx.globalAlpha = 1;
        } else if (age === 3) {
            // Modern: military base
            ctx.fillStyle = '#4A5568';
            ctx.fillRect(bx, 230, BASE_W, 140);
            // Radar tower
            ctx.fillStyle = '#3C4A5C';
            ctx.fillRect(bx + 20, 180, 4, 50);
            // Radar dish
            ctx.strokeStyle = '#718096';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(bx + 22, 180, 10, -Math.PI * 0.7, Math.PI * 0.7);
            ctx.stroke();
            // Sandbags
            ctx.fillStyle = '#8B7355';
            ctx.fillRect(bx - 3, 350, BASE_W + 6, 15);
            // Windows
            ctx.fillStyle = '#00CED1';
            ctx.globalAlpha = 0.5;
            ctx.fillRect(bx + 8, 260, 10, 6);
            ctx.fillRect(bx + 30, 260, 10, 6);
            ctx.globalAlpha = 1;
        } else {
            // Future: neon city
            ctx.fillStyle = '#1A0A2E';
            ctx.fillRect(bx, 220, BASE_W, 150);
            // Neon lines
            ctx.strokeStyle = '#00FFFF';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.7 + Math.sin(turretCooldown * 5) * 0.3;
            ctx.strokeRect(bx + 2, 222, BASE_W - 4, 146);
            ctx.beginPath();
            ctx.moveTo(bx, 260); ctx.lineTo(bx + BASE_W, 260);
            ctx.moveTo(bx, 300); ctx.lineTo(bx + BASE_W, 300);
            ctx.stroke();
            ctx.globalAlpha = 1;
            // Energy core
            ctx.fillStyle = '#00FFFF';
            ctx.globalAlpha = 0.5 + Math.sin(turretCooldown * 4) * 0.3;
            ctx.beginPath();
            ctx.arc(bx + BASE_W/2, 280, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        // Damage cracks
        if (damageRatio > 0.3) {
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            const crackCount = Math.floor(damageRatio * 5);
            for (let i = 0; i < crackCount; i++) {
                const cx = bx + 10 + (i * 17) % (BASE_W - 20);
                const cy = 240 + (i * 31) % 100;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx + 8, cy + 12);
                ctx.lineTo(cx + 3, cy + 20);
                ctx.stroke();
            }
        }

        // Smoke when damaged
        if (damageRatio > 0.5) {
            ctx.globalAlpha = 0.2 * damageRatio;
            ctx.fillStyle = '#555';
            const smokeT = turretCooldown * 2;
            for (let i = 0; i < 3; i++) {
                const sx = bx + 15 + i * 12 + Math.sin(smokeT + i) * 4;
                const sy = 210 - i * 15 - Math.abs(Math.sin(smokeT * 0.7 + i)) * 10;
                ctx.beginPath();
                ctx.arc(sx, sy, 6 + i * 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        // Turret (only if purchased)
        if (turretLevel > 0 && turretTier) {
            const turretX = bx + (isPlayer ? BASE_W : 0);
            const turretY = 240;
            const cd = Math.max(0, turretCooldown);
            const cdRatio = cd / turretTier.cooldown;

            // Turret base block - color by tier
            const tierColors = ['#8B7355', '#808080', '#5A5A5A', '#4A5568', '#1A0A2E'];
            const tierBarrelColors = ['#A0855A', '#999', '#777', '#718096', '#00FFFF'];
            const tc = tierColors[Math.min(turretLevel - 1, 4)];
            const bc = tierBarrelColors[Math.min(turretLevel - 1, 4)];

            ctx.fillStyle = tc;
            ctx.fillRect(turretX - 5, turretY - 5, 10, 10);
            // Turret barrel - thicker at higher tiers
            ctx.strokeStyle = bc;
            ctx.lineWidth = 2 + Math.min(turretLevel, 3);
            ctx.beginPath();
            ctx.moveTo(turretX, turretY);
            ctx.lineTo(turretX + dir * (16 + turretLevel * 3), turretY);
            ctx.stroke();
            // Cooldown indicator
            if (cdRatio > 0) {
                ctx.fillStyle = 'rgba(255,255,0,0.3)';
                ctx.beginPath();
                ctx.arc(turretX, turretY, 10, -Math.PI/2, -Math.PI/2 + Math.PI * 2 * (1 - cdRatio));
                ctx.lineTo(turretX, turretY);
                ctx.fill();
            }
        }

        // HP bar
        const hpW = BASE_W + 10;
        const hpX = bx - 5;
        const hpY = 205;
        ctx.fillStyle = '#333';
        ctx.fillRect(hpX, hpY, hpW, 6);
        const hpColor = hp / maxHp > 0.5 ? '#4CAF50' : hp / maxHp > 0.25 ? '#FF9800' : '#F44336';
        ctx.fillStyle = hpColor;
        ctx.fillRect(hpX, hpY, hpW * Math.max(0, hp / maxHp), 6);
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        ctx.strokeRect(hpX, hpY, hpW, 6);

        ctx.restore();
    },

    // ─── Units ───
    drawUnit(ctx, unit, gameTime) {
        const pal = AGE_PALETTES[UNIT_DEFS[unit.key].age] || AGE_PALETTES[0];
        const def = UNIT_DEFS[unit.key];
        const t = gameTime || 0;
        const dir = unit.isPlayer ? 1 : -1;
        const walkBob = Math.sin(t * 8 + unit.x * 0.1) * 2;
        const isAttacking = unit.atkCooldown > (1 / unit.atkSpeed) * 0.7;

        ctx.save();
        ctx.translate(unit.x, unit.y + walkBob);

        // Hit flash
        if (unit.hitFlash > 0) {
            ctx.globalAlpha = 0.5 + unit.hitFlash * 0.5;
        }

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 2 - walkBob, unit.size * 0.7, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Unit-specific rendering
        switch (unit.key) {
            case 'clubman': this._drawClubman(ctx, dir, isAttacking, pal, t); break;
            case 'spear': this._drawSpear(ctx, dir, isAttacking, pal, t); break;
            case 'swordsman': this._drawSwordsman(ctx, dir, isAttacking, pal, t); break;
            case 'archer': this._drawArcher(ctx, dir, isAttacking, pal, t); break;
            case 'knight': this._drawKnight(ctx, dir, isAttacking, pal, t); break;
            case 'rifleman': this._drawRifleman(ctx, dir, isAttacking, pal, t); break;
            case 'grenadier': this._drawGrenadier(ctx, dir, isAttacking, pal, t); break;
            case 'heavy': this._drawHeavy(ctx, dir, isAttacking, pal, t); break;
            case 'marine': this._drawMarine(ctx, dir, isAttacking, pal, t); break;
            case 'rocket': this._drawRocket(ctx, dir, isAttacking, pal, t); break;
            case 'tank': this._drawTank(ctx, dir, isAttacking, pal, t); break;
            case 'laser': this._drawLaser(ctx, dir, isAttacking, pal, t); break;
            case 'mech': this._drawMech(ctx, dir, isAttacking, pal, t); break;
            case 'plasma': this._drawPlasma(ctx, dir, isAttacking, pal, t); break;
            default: this._drawGeneric(ctx, dir, isAttacking, pal, unit.size); break;
        }

        ctx.globalAlpha = 1;
        ctx.restore();

        // HP bar above unit
        if (unit.hp < unit.maxHp) {
            const barW = unit.size * 1.5;
            const barX = unit.x - barW / 2;
            const barY = unit.y - unit.size - 10 + walkBob;
            ctx.fillStyle = '#333';
            ctx.fillRect(barX, barY, barW, 3);
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(barX, barY, barW * (unit.hp / unit.maxHp), 3);
        }
    },

    // ─── Unit Drawing Helpers ───
    _drawClubman(ctx, dir, atk, pal, t) {
        const swing = atk ? Math.sin(t * 15) * 0.5 : 0;
        // Legs
        ctx.fillStyle = pal.skin;
        ctx.fillRect(-3, -4, 2, 8);
        ctx.fillRect(1, -4, 2, 8);
        // Body
        ctx.fillStyle = pal.body;
        ctx.fillRect(-5, -14, 10, 10);
        // Head
        ctx.fillStyle = pal.skin;
        ctx.beginPath();
        ctx.arc(0, -18, 5, 0, Math.PI * 2);
        ctx.fill();
        // Hair
        ctx.fillStyle = pal.hair;
        ctx.beginPath();
        ctx.arc(0, -20, 5, Math.PI, 0);
        ctx.fill();
        // Club
        ctx.save();
        ctx.translate(dir * 5, -12);
        ctx.rotate(swing * dir);
        ctx.fillStyle = pal.weapon;
        ctx.fillRect(0, -2, 12 * dir, 4);
        ctx.fillRect(10 * dir, -4, 4 * dir, 8);
        ctx.restore();
    },

    _drawSpear(ctx, dir, atk, pal, t) {
        const throwAnim = atk ? Math.sin(t * 12) * 0.3 : 0;
        // Legs
        ctx.fillStyle = pal.skin;
        ctx.fillRect(-3, -4, 2, 8);
        ctx.fillRect(1, -4, 2, 8);
        // Body
        ctx.fillStyle = pal.body;
        ctx.fillRect(-5, -14, 10, 10);
        // Head
        ctx.fillStyle = pal.skin;
        ctx.beginPath();
        ctx.arc(0, -18, 5, 0, Math.PI * 2);
        ctx.fill();
        // Headband
        ctx.fillStyle = '#C0392B';
        ctx.fillRect(-5, -20, 10, 2);
        // Spear
        ctx.save();
        ctx.translate(dir * 6, -14);
        ctx.rotate(throwAnim * dir);
        ctx.strokeStyle = pal.weapon;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(18 * dir, -5);
        ctx.stroke();
        // Spear tip
        ctx.fillStyle = '#AAA';
        ctx.beginPath();
        ctx.moveTo(18 * dir, -5);
        ctx.lineTo(22 * dir, -5);
        ctx.lineTo(18 * dir, -2);
        ctx.fill();
        ctx.restore();
    },

    _drawSwordsman(ctx, dir, atk, pal, t) {
        const swing = atk ? Math.sin(t * 15) * 0.6 : 0;
        // Legs
        ctx.fillStyle = '#4A5568';
        ctx.fillRect(-3, -4, 2, 8);
        ctx.fillRect(1, -4, 2, 8);
        // Body (armor)
        ctx.fillStyle = pal.body;
        ctx.fillRect(-6, -15, 12, 11);
        // Belt
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(-6, -6, 12, 2);
        // Head
        ctx.fillStyle = pal.skin;
        ctx.beginPath();
        ctx.arc(0, -19, 5, 0, Math.PI * 2);
        ctx.fill();
        // Helmet
        ctx.fillStyle = pal.body;
        ctx.beginPath();
        ctx.arc(0, -21, 6, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(-6, -21, 12, 3);
        // Sword
        ctx.save();
        ctx.translate(dir * 6, -12);
        ctx.rotate(swing * dir);
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(0, -1, 14 * dir, 2);
        // Guard
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(-1 * dir, -3, 2 * dir, 6);
        ctx.restore();
        // Shield
        if (dir > 0) {
            ctx.fillStyle = '#8B0000';
            ctx.fillRect(-9, -14, 4, 8);
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(-8, -12, 2, 4);
        }
    },

    _drawArcher(ctx, dir, atk, pal, t) {
        const draw = atk ? Math.sin(t * 10) * 3 : 0;
        // Legs
        ctx.fillStyle = pal.skin;
        ctx.fillRect(-3, -4, 2, 8);
        ctx.fillRect(1, -4, 2, 8);
        // Body
        ctx.fillStyle = '#2E7D32';
        ctx.fillRect(-5, -14, 10, 10);
        // Head
        ctx.fillStyle = pal.skin;
        ctx.beginPath();
        ctx.arc(0, -18, 5, 0, Math.PI * 2);
        ctx.fill();
        // Hood
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.arc(0, -20, 6, Math.PI * 1.2, Math.PI * 1.8);
        ctx.fill();
        // Bow
        ctx.save();
        ctx.translate(dir * 6, -12);
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 10, -Math.PI * 0.4, Math.PI * 0.4);
        ctx.stroke();
        // String
        ctx.strokeStyle = '#DDD';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(10 * Math.cos(-Math.PI * 0.4), 10 * Math.sin(-Math.PI * 0.4));
        ctx.lineTo(-draw * dir, 0);
        ctx.lineTo(10 * Math.cos(Math.PI * 0.4), 10 * Math.sin(Math.PI * 0.4));
        ctx.stroke();
        // Arrow
        if (atk) {
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-draw * dir, 0);
            ctx.lineTo(-draw * dir + 12 * dir, 0);
            ctx.stroke();
        }
        ctx.restore();
        // Quiver
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-8, -14, 3, 10);
    },

    _drawKnight(ctx, dir, atk, pal, t) {
        const charge = atk ? Math.sin(t * 12) * 2 : 0;
        // Legs (armored)
        ctx.fillStyle = '#708090';
        ctx.fillRect(-4, -4, 3, 10);
        ctx.fillRect(1, -4, 3, 10);
        // Body (heavy armor)
        ctx.fillStyle = '#A9A9A9';
        ctx.fillRect(-7, -16, 14, 12);
        // Chest plate
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(-5, -14, 10, 8);
        // Head
        ctx.fillStyle = '#A9A9A9';
        ctx.beginPath();
        ctx.arc(0, -20, 6, 0, Math.PI * 2);
        ctx.fill();
        // Visor
        ctx.fillStyle = '#333';
        ctx.fillRect(-3, -21, 6, 2);
        // Plume
        ctx.fillStyle = '#C0392B';
        ctx.beginPath();
        ctx.moveTo(0, -26);
        ctx.lineTo(-3, -20);
        ctx.lineTo(3, -20);
        ctx.fill();
        // Lance
        ctx.save();
        ctx.translate(dir * 7, -14 + charge);
        ctx.strokeStyle = '#C0C0C0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(20 * dir, -3);
        ctx.stroke();
        // Lance tip
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(20 * dir, -3);
        ctx.lineTo(24 * dir, -3);
        ctx.lineTo(20 * dir, 0);
        ctx.fill();
        ctx.restore();
        // Shield
        ctx.fillStyle = '#C0392B';
        ctx.fillRect(-10, -15, 4, 10);
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(-8, -10, 2, 0, Math.PI * 2);
        ctx.fill();
    },

    _drawRifleman(ctx, dir, atk, pal, t) {
        const recoil = atk ? Math.sin(t * 20) * 1.5 : 0;
        // Legs
        ctx.fillStyle = '#3B4F1E';
        ctx.fillRect(-3, -4, 2, 8);
        ctx.fillRect(1, -4, 2, 8);
        // Body
        ctx.fillStyle = pal.body;
        ctx.fillRect(-5, -14, 10, 10);
        // Head
        ctx.fillStyle = pal.skin;
        ctx.beginPath();
        ctx.arc(0, -18, 5, 0, Math.PI * 2);
        ctx.fill();
        // Helmet
        ctx.fillStyle = '#4A5568';
        ctx.beginPath();
        ctx.arc(0, -20, 5.5, Math.PI, 0);
        ctx.fill();
        // Rifle
        ctx.save();
        ctx.translate(dir * 5 - recoil * dir, -12);
        ctx.fillStyle = '#333';
        ctx.fillRect(0, -1, 16 * dir, 3);
        // Stock
        ctx.fillStyle = '#5A3520';
        ctx.fillRect(-3 * dir, -1, 4 * dir, 3);
        ctx.restore();
    },

    _drawGrenadier(ctx, dir, atk, pal, t) {
        const toss = atk ? Math.sin(t * 10) * 0.4 : 0;
        // Legs
        ctx.fillStyle = '#3B4F1E';
        ctx.fillRect(-3, -4, 2, 8);
        ctx.fillRect(1, -4, 2, 8);
        // Body
        ctx.fillStyle = pal.body;
        ctx.fillRect(-6, -15, 12, 11);
        // Belt with grenades
        ctx.fillStyle = '#556B2F';
        ctx.fillRect(-6, -6, 12, 3);
        ctx.fillStyle = '#4A4A4A';
        ctx.beginPath();
        ctx.arc(-3, -4.5, 2, 0, Math.PI * 2);
        ctx.arc(3, -4.5, 2, 0, Math.PI * 2);
        ctx.fill();
        // Head
        ctx.fillStyle = pal.skin;
        ctx.beginPath();
        ctx.arc(0, -19, 5, 0, Math.PI * 2);
        ctx.fill();
        // Bandana
        ctx.fillStyle = '#8B0000';
        ctx.fillRect(-5, -22, 10, 3);
        // Throwing arm
        ctx.save();
        ctx.translate(dir * 6, -14);
        ctx.rotate(toss * dir);
        ctx.fillStyle = pal.skin;
        ctx.fillRect(0, -2, 8 * dir, 4);
        // Grenade
        if (atk) {
            ctx.fillStyle = '#4A4A4A';
            ctx.beginPath();
            ctx.arc(8 * dir, 0, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    },

    _drawHeavy(ctx, dir, atk, pal, t) {
        const recoil = atk ? Math.sin(t * 15) * 1 : 0;
        // Legs (wide stance)
        ctx.fillStyle = '#3B4F1E';
        ctx.fillRect(-5, -4, 3, 10);
        ctx.fillRect(2, -4, 3, 10);
        // Body (heavy armor)
        ctx.fillStyle = pal.body;
        ctx.fillRect(-8, -16, 16, 12);
        // Chest plate
        ctx.fillStyle = pal.bodyDark;
        ctx.fillRect(-6, -14, 12, 8);
        // Head
        ctx.fillStyle = pal.skin;
        ctx.beginPath();
        ctx.arc(0, -20, 5, 0, Math.PI * 2);
        ctx.fill();
        // Heavy helmet
        ctx.fillStyle = '#4A5568';
        ctx.fillRect(-7, -24, 14, 6);
        ctx.fillRect(-5, -26, 10, 3);
        // Machine gun
        ctx.save();
        ctx.translate(dir * 8 - recoil * dir, -14);
        ctx.fillStyle = '#333';
        ctx.fillRect(0, -2, 14 * dir, 4);
        // Ammo belt
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(0, 2, 8 * dir, 2);
        ctx.restore();
    },

    _drawMarine(ctx, dir, atk, pal, t) {
        const recoil = atk ? Math.sin(t * 18) * 1.2 : 0;
        // Legs
        ctx.fillStyle = '#2F4F4F';
        ctx.fillRect(-3, -4, 2, 8);
        ctx.fillRect(1, -4, 2, 8);
        // Body
        ctx.fillStyle = pal.body;
        ctx.fillRect(-5, -14, 10, 10);
        // Vest
        ctx.fillStyle = '#1C3333';
        ctx.fillRect(-4, -12, 8, 6);
        // Head
        ctx.fillStyle = pal.skin;
        ctx.beginPath();
        ctx.arc(0, -18, 5, 0, Math.PI * 2);
        ctx.fill();
        // Helmet with visor
        ctx.fillStyle = '#2F4F4F';
        ctx.beginPath();
        ctx.arc(0, -20, 5.5, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#00CED1';
        ctx.globalAlpha = 0.5;
        ctx.fillRect(-3, -21, 6, 2);
        ctx.globalAlpha = 1;
        // Assault rifle
        ctx.save();
        ctx.translate(dir * 5 - recoil * dir, -12);
        ctx.fillStyle = '#333';
        ctx.fillRect(0, -1, 14 * dir, 3);
        ctx.fillStyle = '#555';
        ctx.fillRect(6 * dir, 2, 3 * dir, 4);
        ctx.restore();
    },

    _drawRocket(ctx, dir, atk, pal, t) {
        const aim = atk ? Math.sin(t * 8) * 0.2 : 0;
        // Legs
        ctx.fillStyle = '#2F4F4F';
        ctx.fillRect(-3, -4, 2, 8);
        ctx.fillRect(1, -4, 2, 8);
        // Body
        ctx.fillStyle = pal.body;
        ctx.fillRect(-6, -15, 12, 11);
        // Head
        ctx.fillStyle = pal.skin;
        ctx.beginPath();
        ctx.arc(0, -19, 5, 0, Math.PI * 2);
        ctx.fill();
        // Helmet
        ctx.fillStyle = '#2F4F4F';
        ctx.beginPath();
        ctx.arc(0, -21, 5.5, Math.PI, 0);
        ctx.fill();
        // Rocket launcher
        ctx.save();
        ctx.translate(dir * 7, -14);
        ctx.rotate(aim * dir);
        ctx.fillStyle = '#4A4A4A';
        ctx.fillRect(0, -3, 16 * dir, 6);
        // Barrel opening
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(16 * dir, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },

    _drawTank(ctx, dir, atk, pal, t) {
        const trackBob = Math.sin(t * 6) * 0.5;
        // Tracks
        ctx.fillStyle = '#333';
        ctx.fillRect(-10, -2, 20, 6);
        ctx.fillStyle = '#444';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(-8 + i * 5, -1 + trackBob, 3, 4);
        }
        // Hull
        ctx.fillStyle = '#4A5568';
        ctx.fillRect(-9, -12, 18, 10);
        // Turret
        ctx.fillStyle = '#3C4A5C';
        ctx.fillRect(-5, -18, 10, 6);
        // Barrel
        ctx.save();
        ctx.translate(dir * 5, -15);
        ctx.fillStyle = '#555';
        ctx.fillRect(0, -2, 16 * dir, 4);
        ctx.restore();
        // Antenna
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-6, -18);
        ctx.lineTo(-8, -26);
        ctx.stroke();
    },

    _drawLaser(ctx, dir, atk, pal, t) {
        const glow = atk ? 0.5 + Math.sin(t * 20) * 0.5 : 0;
        // Legs
        ctx.fillStyle = pal.body;
        ctx.fillRect(-3, -4, 2, 8);
        ctx.fillRect(1, -4, 2, 8);
        // Body (futuristic armor)
        ctx.fillStyle = pal.body;
        ctx.fillRect(-5, -14, 10, 10);
        // Energy lines
        ctx.strokeStyle = pal.accent;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.moveTo(-4, -12); ctx.lineTo(4, -12);
        ctx.moveTo(-4, -8); ctx.lineTo(4, -8);
        ctx.stroke();
        ctx.globalAlpha = 1;
        // Head
        ctx.fillStyle = '#B8C4D0';
        ctx.beginPath();
        ctx.arc(0, -18, 5, 0, Math.PI * 2);
        ctx.fill();
        // Visor
        ctx.fillStyle = pal.accent;
        ctx.globalAlpha = 0.8;
        ctx.fillRect(-4, -19, 8, 3);
        ctx.globalAlpha = 1;
        // Laser gun
        ctx.save();
        ctx.translate(dir * 6, -12);
        ctx.fillStyle = pal.bodyDark;
        ctx.fillRect(0, -2, 14 * dir, 4);
        // Glow
        if (glow > 0) {
            ctx.fillStyle = pal.accent;
            ctx.globalAlpha = glow * 0.6;
            ctx.beginPath();
            ctx.arc(14 * dir, 0, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        ctx.restore();
    },

    _drawMech(ctx, dir, atk, pal, t) {
        const step = Math.sin(t * 5) * 2;
        // Mechanical legs
        ctx.fillStyle = '#4B0082';
        ctx.fillRect(-6, -4, 4, 10 + step);
        ctx.fillRect(2, -4, 4, 10 - step);
        // Knee joints
        ctx.fillStyle = '#7B68EE';
        ctx.beginPath();
        ctx.arc(-4, 2 + step/2, 2, 0, Math.PI * 2);
        ctx.arc(4, 2 - step/2, 2, 0, Math.PI * 2);
        ctx.fill();
        // Body (mech torso)
        ctx.fillStyle = '#4B0082';
        ctx.fillRect(-8, -18, 16, 14);
        // Core
        ctx.fillStyle = '#00FFFF';
        ctx.globalAlpha = 0.6 + Math.sin(t * 4) * 0.3;
        ctx.beginPath();
        ctx.arc(0, -12, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        // Head
        ctx.fillStyle = '#2E0054';
        ctx.fillRect(-4, -24, 8, 6);
        // Eyes
        ctx.fillStyle = '#F00';
        ctx.fillRect(-3, -22, 2, 2);
        ctx.fillRect(1, -22, 2, 2);
        // Arms/Weapons
        ctx.save();
        ctx.translate(dir * 8, -14);
        ctx.fillStyle = '#5A2D82';
        ctx.fillRect(0, -3, 10 * dir, 6);
        // Claw
        ctx.fillStyle = '#7B68EE';
        ctx.fillRect(10 * dir, -5, 4 * dir, 10);
        ctx.restore();
    },

    _drawPlasma(ctx, dir, atk, pal, t) {
        const hover = Math.sin(t * 4) * 2;
        // Hover pads
        ctx.fillStyle = '#00FFFF';
        ctx.globalAlpha = 0.4 + Math.sin(t * 8) * 0.2;
        ctx.beginPath();
        ctx.ellipse(-6, 2, 4, 2, 0, 0, Math.PI * 2);
        ctx.ellipse(6, 2, 4, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        // Hull
        ctx.fillStyle = '#2E0054';
        ctx.fillRect(-10, -14 + hover, 20, 12);
        // Energy lines
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(-8, -10 + hover); ctx.lineTo(8, -10 + hover);
        ctx.moveTo(-8, -6 + hover); ctx.lineTo(8, -6 + hover);
        ctx.stroke();
        ctx.globalAlpha = 1;
        // Turret
        ctx.fillStyle = '#4B0082';
        ctx.fillRect(-4, -20 + hover, 8, 6);
        // Barrel
        ctx.save();
        ctx.translate(dir * 4, -17 + hover);
        ctx.fillStyle = '#7B68EE';
        ctx.fillRect(0, -2, 14 * dir, 4);
        // Plasma glow
        if (atk) {
            ctx.fillStyle = '#00FFFF';
            ctx.globalAlpha = 0.5 + Math.sin(t * 15) * 0.3;
            ctx.beginPath();
            ctx.arc(14 * dir, 0, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        ctx.restore();
    },

    _drawGeneric(ctx, dir, atk, pal, size) {
        ctx.fillStyle = pal.body;
        ctx.fillRect(-size/2, -size, size, size);
        ctx.fillStyle = pal.skin;
        ctx.beginPath();
        ctx.arc(0, -size - 4, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
    },

    // ─── Projectiles ───
    drawProjectile(ctx, proj, age) {
        const pal = AGE_PALETTES[age] || AGE_PALETTES[0];
        const angle = Math.atan2(proj.vy, proj.vx);
        const speed = Math.sqrt(proj.vx * proj.vx + proj.vy * proj.vy);

        ctx.save();
        ctx.translate(proj.x, proj.y);
        ctx.rotate(angle);

        if (age === 0) {
            // Spear
            ctx.strokeStyle = '#8B7355';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-10, 0); ctx.lineTo(8, 0);
            ctx.stroke();
            ctx.fillStyle = '#AAA';
            ctx.beginPath();
            ctx.moveTo(8, 0); ctx.lineTo(12, -2); ctx.lineTo(12, 2);
            ctx.fill();
        } else if (age === 1) {
            // Arrow
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-8, 0); ctx.lineTo(6, 0);
            ctx.stroke();
            ctx.fillStyle = '#AAA';
            ctx.beginPath();
            ctx.moveTo(6, 0); ctx.lineTo(10, -2); ctx.lineTo(10, 2);
            ctx.fill();
            // Fletching
            ctx.strokeStyle = '#DDD';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-8, 0); ctx.lineTo(-10, -2);
            ctx.moveTo(-8, 0); ctx.lineTo(-10, 2);
            ctx.stroke();
        } else if (age === 2) {
            // Bullet
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
            ctx.fill();
            // Trail
            ctx.strokeStyle = '#FFA500';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.moveTo(-10, 0); ctx.lineTo(0, 0);
            ctx.stroke();
            ctx.globalAlpha = 1;
        } else if (age === 3) {
            // Missile
            ctx.fillStyle = '#4A4A4A';
            ctx.fillRect(-6, -2, 12, 4);
            // Fins
            ctx.fillStyle = '#666';
            ctx.beginPath();
            ctx.moveTo(-6, -2); ctx.lineTo(-10, -5); ctx.lineTo(-6, 0);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(-6, 2); ctx.lineTo(-10, 5); ctx.lineTo(-6, 0);
            ctx.fill();
            // Exhaust
            ctx.fillStyle = '#FF6600';
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(-8, 0, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        } else {
            // Laser/Plasma beam
            ctx.strokeStyle = pal.accent;
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.moveTo(-15, 0); ctx.lineTo(15, 0);
            ctx.stroke();
            // Glow
            ctx.strokeStyle = pal.accent;
            ctx.lineWidth = 8;
            ctx.globalAlpha = 0.2;
            ctx.beginPath();
            ctx.moveTo(-15, 0); ctx.lineTo(15, 0);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        ctx.restore();
    },

    // ─── Particles ───
    drawParticle(ctx, p) {
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.globalAlpha = alpha;
        if (p.type === 'text') {
            ctx.fillStyle = p.color;
            ctx.font = 'bold 13px Orbitron, monospace';
            ctx.textAlign = 'center';
            ctx.fillText(p.text, p.x, p.y);
        } else {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    },

    // ─── UI Elements ───
    drawButton(ctx, x, y, w, h, text, canAfford, isSelected, icon) {
        const grad = ctx.createLinearGradient(x, y, x, y + h);
        if (isSelected) {
            grad.addColorStop(0, 'rgba(68,136,255,0.5)');
            grad.addColorStop(1, 'rgba(68,136,255,0.2)');
        } else if (canAfford) {
            grad.addColorStop(0, 'rgba(255,255,255,0.08)');
            grad.addColorStop(1, 'rgba(255,255,255,0.03)');
        } else {
            grad.addColorStop(0, 'rgba(50,50,50,0.3)');
            grad.addColorStop(1, 'rgba(30,30,30,0.2)');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, w, h);

        ctx.strokeStyle = isSelected ? '#4488ff' : canAfford ? 'rgba(255,255,255,0.15)' : 'rgba(100,100,100,0.2)';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(x, y, w, h);

        if (icon) {
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = canAfford ? '#fff' : '#555';
            ctx.fillText(icon, x + w/2, y + 18);
        }
    },

    drawProgressBar(ctx, x, y, w, h, ratio, color) {
        ctx.fillStyle = '#222';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w * Math.max(0, Math.min(1, ratio)), h);
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
    }
};
