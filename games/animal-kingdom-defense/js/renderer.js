/**
 * Animal Kingdom Defense - Renderer
 * Procedural sprites for animal defenders and robot invaders
 */
const Renderer = {
    // ─── Background ───
    drawBackground(ctx, gameTime) {
        // Sky
        const grad = ctx.createLinearGradient(0, 0, 0, GRID_Y);
        grad.addColorStop(0, '#87CEEB');
        grad.addColorStop(1, '#98D8C8');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, GRID_Y);

        // Grass/dirt rows
        for (let r = 0; r < ROWS; r++) {
            ctx.fillStyle = r % 2 === 0 ? '#6B8E23' : '#556B2F';
            ctx.fillRect(GRID_X, GRID_Y + r * CELL_H, COLS * CELL_W, CELL_H);
            // Grass tufts
            ctx.fillStyle = '#7CFC00';
            ctx.globalAlpha = 0.3;
            for (let c = 0; c < COLS; c++) {
                const gx = GRID_X + c * CELL_W + 10 + (r * 17) % 30;
                const gy = GRID_Y + r * CELL_H + 5;
                ctx.beginPath();
                ctx.moveTo(gx, gy + 8); ctx.lineTo(gx + 3, gy); ctx.lineTo(gx + 6, gy + 8);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        // Grid lines
        ctx.strokeStyle = 'rgba(0,0,0,0.08)';
        ctx.lineWidth = 1;
        for (let r = 0; r <= ROWS; r++) {
            ctx.beginPath(); ctx.moveTo(GRID_X, GRID_Y + r * CELL_H); ctx.lineTo(GRID_X + COLS * CELL_W, GRID_Y + r * CELL_H); ctx.stroke();
        }
        for (let c = 0; c <= COLS; c++) {
            ctx.beginPath(); ctx.moveTo(GRID_X + c * CELL_W, GRID_Y); ctx.lineTo(GRID_X + c * CELL_W, GRID_Y + ROWS * CELL_H); ctx.stroke();
        }

        // Tree house (base)
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, GRID_Y + 20, HOUSE_X - 10, ROWS * CELL_H - 40);
        // Trunk
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(HOUSE_X - 18, GRID_Y, 36, ROWS * CELL_H);
        // Leaves
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.arc(HOUSE_X, GRID_Y - 10, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#32CD32';
        ctx.beginPath();
        ctx.arc(HOUSE_X - 10, GRID_Y - 5, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(HOUSE_X + 10, GRID_Y - 5, 20, 0, Math.PI * 2);
        ctx.fill();
        // Door
        ctx.fillStyle = '#654321';
        ctx.fillRect(HOUSE_X - 12, GRID_Y + 100, 24, 35);
        ctx.fillStyle = '#8B6914';
        ctx.beginPath();
        ctx.arc(HOUSE_X, GRID_Y + 100, 12, Math.PI, 0);
        ctx.fill();
    },

    // ─── Animal Defenders ───
    drawPlant(ctx, plant, gameTime) {
        const cx = GRID_X + plant.col * CELL_W + CELL_W/2;
        const cy = GRID_Y + plant.row * CELL_H + CELL_H/2 + 10;
        const t = gameTime || 0;
        const bob = Math.sin(t * 3 + plant.col + plant.row) * 1.5;

        ctx.save();
        ctx.translate(cx, cy + bob);

        switch (plant.type) {
            case 'chicken':
                // Nest
                ctx.fillStyle = '#8B6914';
                ctx.beginPath();
                ctx.ellipse(0, 8, 14, 6, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#A0522D';
                ctx.beginPath();
                ctx.ellipse(0, 6, 12, 5, 0, 0, Math.PI);
                ctx.fill();
                // Eggs
                ctx.fillStyle = '#FFFACD';
                ctx.beginPath(); ctx.arc(-4, 2, 4, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(4, 3, 3.5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#FFE4B5';
                ctx.beginPath(); ctx.arc(-5, 1, 1, 0, Math.PI * 2); ctx.fill();
                // Chicken head
                ctx.fillStyle = '#F5DEB3';
                ctx.beginPath(); ctx.arc(-8, -10, 7, 0, Math.PI * 2); ctx.fill();
                // Comb
                ctx.fillStyle = '#DC143C';
                ctx.beginPath();
                ctx.moveTo(-10, -16); ctx.lineTo(-8, -12); ctx.lineTo(-6, -16);
                ctx.lineTo(-4, -12); ctx.lineTo(-2, -16);
                ctx.fill();
                // Beak
                ctx.fillStyle = '#FF8C00';
                ctx.beginPath();
                ctx.moveTo(-12, -10); ctx.lineTo(-16, -9); ctx.lineTo(-12, -8);
                ctx.fill();
                // Eye
                ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.arc(-9, -11, 1.5, 0, Math.PI * 2); ctx.fill();
                break;

            case 'monkey':
                // Body
                ctx.fillStyle = '#8B4513';
                ctx.beginPath(); ctx.arc(0, -2, 10, 0, Math.PI * 2); ctx.fill();
                // Belly
                ctx.fillStyle = '#D2B48C';
                ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
                // Head
                ctx.fillStyle = '#8B4513';
                ctx.beginPath(); ctx.arc(0, -16, 8, 0, Math.PI * 2); ctx.fill();
                // Face
                ctx.fillStyle = '#D2B48C';
                ctx.beginPath(); ctx.arc(0, -14, 5, 0, Math.PI * 2); ctx.fill();
                // Eyes
                ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.arc(-3, -15, 1.5, 0, Math.PI * 2); ctx.arc(3, -15, 1.5, 0, Math.PI * 2); ctx.fill();
                // Smile
                ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.arc(0, -12, 3, 0.1, Math.PI - 0.1); ctx.stroke();
                // Ears
                ctx.fillStyle = '#D2B48C';
                ctx.beginPath(); ctx.arc(-9, -16, 4, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(9, -16, 4, 0, Math.PI * 2); ctx.fill();
                // Arms
                ctx.fillStyle = '#8B4513';
                ctx.save(); ctx.translate(10, -4); ctx.rotate(0.3 + Math.sin(t * 4) * 0.2);
                ctx.fillRect(0, -2, 12, 4);
                // Coconut
                ctx.fillStyle = '#8B6914';
                ctx.beginPath(); ctx.arc(14, 0, 4, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
                // Tail
                ctx.strokeStyle = '#8B4513'; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.moveTo(-8, 5); ctx.quadraticCurveTo(-15, -5, -12, -15); ctx.stroke();
                break;

            case 'bear':
                // Body
                ctx.fillStyle = '#8B6914';
                ctx.beginPath(); ctx.arc(0, -2, 16, 0, Math.PI * 2); ctx.fill();
                // Belly
                ctx.fillStyle = '#D2B48C';
                ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
                // Head
                ctx.fillStyle = '#8B6914';
                ctx.beginPath(); ctx.arc(0, -20, 12, 0, Math.PI * 2); ctx.fill();
                // Ears
                ctx.fillStyle = '#8B6914';
                ctx.beginPath(); ctx.arc(-10, -30, 5, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(10, -30, 5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#D2B48C';
                ctx.beginPath(); ctx.arc(-10, -30, 3, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(10, -30, 3, 0, Math.PI * 2); ctx.fill();
                // Face
                ctx.fillStyle = '#D2B48C';
                ctx.beginPath(); ctx.arc(0, -17, 7, 0, Math.PI * 2); ctx.fill();
                // Eyes
                ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.arc(-4, -21, 2, 0, Math.PI * 2); ctx.arc(4, -21, 2, 0, Math.PI * 2); ctx.fill();
                // Nose
                ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.arc(0, -16, 3, 0, Math.PI * 2); ctx.fill();
                // Arms
                ctx.fillStyle = '#8B6914';
                ctx.fillRect(-18, -8, 8, 16);
                ctx.fillRect(10, -8, 8, 16);
                // Paws
                ctx.fillStyle = '#654321';
                ctx.beginPath(); ctx.arc(-14, 8, 5, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(14, 8, 5, 0, Math.PI * 2); ctx.fill();
                break;

            case 'penguin':
                // Body
                ctx.fillStyle = '#2F2F2F';
                ctx.beginPath(); ctx.ellipse(0, -4, 10, 14, 0, 0, Math.PI * 2); ctx.fill();
                // Belly
                ctx.fillStyle = '#FFF';
                ctx.beginPath(); ctx.ellipse(0, -2, 6, 10, 0, 0, Math.PI * 2); ctx.fill();
                // Head
                ctx.fillStyle = '#2F2F2F';
                ctx.beginPath(); ctx.arc(0, -20, 8, 0, Math.PI * 2); ctx.fill();
                // Eyes
                ctx.fillStyle = '#FFF';
                ctx.beginPath(); ctx.arc(-3, -21, 3, 0, Math.PI * 2); ctx.arc(3, -21, 3, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.arc(-3, -21, 1.5, 0, Math.PI * 2); ctx.arc(3, -21, 1.5, 0, Math.PI * 2); ctx.fill();
                // Beak
                ctx.fillStyle = '#FF8C00';
                ctx.beginPath();
                ctx.moveTo(-3, -17); ctx.lineTo(0, -14); ctx.lineTo(3, -17);
                ctx.fill();
                // Ice crystals on head
                ctx.fillStyle = '#87CEEB';
                ctx.globalAlpha = 0.7;
                ctx.beginPath(); ctx.moveTo(-4, -28); ctx.lineTo(-2, -24); ctx.lineTo(-6, -24); ctx.fill();
                ctx.beginPath(); ctx.moveTo(2, -28); ctx.lineTo(4, -24); ctx.lineTo(0, -24); ctx.fill();
                ctx.globalAlpha = 1;
                // Feet
                ctx.fillStyle = '#FF8C00';
                ctx.beginPath(); ctx.ellipse(-5, 10, 5, 3, -0.2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(5, 10, 5, 3, 0.2, 0, Math.PI * 2); ctx.fill();
                break;

            case 'pufferfish':
                // Body (inflated)
                const inflate = 1 + Math.sin(t * 2) * 0.1;
                ctx.fillStyle = '#FFD700';
                ctx.beginPath(); ctx.arc(0, -5, 14 * inflate, 0, Math.PI * 2); ctx.fill();
                // Spikes
                ctx.fillStyle = '#DAA520';
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    ctx.beginPath();
                    ctx.moveTo(Math.cos(angle) * 12 * inflate, -5 + Math.sin(angle) * 12 * inflate);
                    ctx.lineTo(Math.cos(angle) * 18 * inflate, -5 + Math.sin(angle) * 18 * inflate);
                    ctx.lineTo(Math.cos(angle + 0.2) * 12 * inflate, -5 + Math.sin(angle + 0.2) * 12 * inflate);
                    ctx.fill();
                }
                // Eyes
                ctx.fillStyle = '#FFF';
                ctx.beginPath(); ctx.arc(-5, -8, 4, 0, Math.PI * 2); ctx.arc(5, -8, 4, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.arc(-5, -8, 2, 0, Math.PI * 2); ctx.arc(5, -8, 2, 0, Math.PI * 2); ctx.fill();
                // Mouth
                ctx.fillStyle = '#FF6347';
                ctx.beginPath(); ctx.arc(0, -1, 4, 0, Math.PI); ctx.fill();
                // Fins
                ctx.fillStyle = '#DAA520';
                ctx.beginPath();
                ctx.moveTo(-14, -5); ctx.lineTo(-20, -10); ctx.lineTo(-18, 0);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(14, -5); ctx.lineTo(20, -10); ctx.lineTo(18, 0);
                ctx.fill();
                break;

            case 'twinmonkey':
                // Left monkey
                ctx.save(); ctx.translate(-8, 0);
                ctx.fillStyle = '#A0522D';
                ctx.beginPath(); ctx.arc(0, -2, 8, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#D2B48C';
                ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#A0522D';
                ctx.beginPath(); ctx.arc(0, -14, 6, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#D2B48C';
                ctx.beginPath(); ctx.arc(0, -12, 4, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.arc(-2, -13, 1, 0, Math.PI * 2); ctx.arc(2, -13, 1, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
                // Right monkey
                ctx.save(); ctx.translate(8, 0);
                ctx.fillStyle = '#8B4513';
                ctx.beginPath(); ctx.arc(0, -2, 8, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#D2B48C';
                ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#8B4513';
                ctx.beginPath(); ctx.arc(0, -14, 6, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#D2B48C';
                ctx.beginPath(); ctx.arc(0, -12, 4, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.arc(-2, -13, 1, 0, Math.PI * 2); ctx.arc(2, -13, 1, 0, Math.PI * 2); ctx.fill();
                // Arm with coconut
                ctx.fillStyle = '#8B4513';
                ctx.save(); ctx.translate(8, -4); ctx.rotate(0.3 + Math.sin(t * 5) * 0.2);
                ctx.fillRect(0, -2, 10, 4);
                ctx.fillStyle = '#8B6914';
                ctx.beginPath(); ctx.arc(12, 0, 3, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
                ctx.restore();
                break;

            case 'hedgehog':
                // Body
                ctx.fillStyle = '#8B6914';
                ctx.beginPath(); ctx.arc(0, -2, 12, 0, Math.PI * 2); ctx.fill();
                // Spikes
                ctx.fillStyle = '#654321';
                for (let i = 0; i < 10; i++) {
                    const angle = (i / 10) * Math.PI * 2;
                    ctx.beginPath();
                    ctx.moveTo(Math.cos(angle) * 10, -2 + Math.sin(angle) * 10);
                    ctx.lineTo(Math.cos(angle) * 18, -2 + Math.sin(angle) * 18);
                    ctx.lineTo(Math.cos(angle + 0.2) * 10, -2 + Math.sin(angle + 0.2) * 10);
                    ctx.fill();
                }
                // Face
                ctx.fillStyle = '#D2B48C';
                ctx.beginPath(); ctx.arc(6, -4, 6, 0, Math.PI * 2); ctx.fill();
                // Eyes
                ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.arc(5, -6, 1.5, 0, Math.PI * 2); ctx.arc(9, -6, 1.5, 0, Math.PI * 2); ctx.fill();
                // Nose
                ctx.fillStyle = '#FF69B4';
                ctx.beginPath(); ctx.arc(11, -3, 2, 0, Math.PI * 2); ctx.fill();
                // Feet
                ctx.fillStyle = '#654321';
                ctx.fillRect(-8, 8, 4, 4);
                ctx.fillRect(4, 8, 4, 4);
                break;
        }

        ctx.restore();
    },

    // ─── Robot Invaders ───
    drawZombie(ctx, zombie, gameTime) {
        const t = gameTime || 0;
        const walk = Math.sin(t * 5 + zombie.y) * 2;
        const eating = zombie.eating;

        ctx.save();
        ctx.translate(zombie.x, zombie.y + walk);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.ellipse(0, 20, 12, 5, 0, 0, Math.PI * 2); ctx.fill();

        // Base color by type
        let bodyColor = '#708090', accentColor = '#A9A9A9', eyeColor = '#FF0000';
        if (zombie.type === 'cone') { bodyColor = '#5F6B7A'; accentColor = '#FF8C00'; }
        if (zombie.type === 'bucket') { bodyColor = '#4A5568'; accentColor = '#A9A9A9'; }
        if (zombie.type === 'fast') { bodyColor = '#556B2F'; accentColor = '#7CFC00'; eyeColor = '#00FF00'; }
        if (zombie.type === 'tank') { bodyColor = '#333'; accentColor = '#555'; eyeColor = '#FF4500'; }

        // Legs (mechanical)
        ctx.fillStyle = bodyColor;
        const legOff = eating ? 0 : Math.sin(t * 8 + zombie.y) * 3;
        ctx.fillRect(-6, 10, 4, 10 + legOff);
        ctx.fillRect(2, 10, 4, 10 - legOff);
        // Joints
        ctx.fillStyle = accentColor;
        ctx.beginPath(); ctx.arc(-4, 10, 2, 0, Math.PI * 2); ctx.arc(4, 10, 2, 0, Math.PI * 2); ctx.fill();

        // Body (boxy robot)
        ctx.fillStyle = bodyColor;
        ctx.fillRect(-10, -10, 20, 20);
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(-10, -10, 20, 20);

        // Chest panel
        ctx.fillStyle = '#333';
        ctx.fillRect(-6, -6, 12, 8);
        // Blinking light
        ctx.fillStyle = eyeColor;
        ctx.globalAlpha = 0.5 + Math.sin(t * 4) * 0.5;
        ctx.beginPath(); ctx.arc(0, -2, 2, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;

        // Arms
        ctx.fillStyle = bodyColor;
        const armAngle = eating ? Math.sin(t * 10) * 0.3 : -0.2;
        ctx.save(); ctx.translate(10, -4); ctx.rotate(armAngle);
        ctx.fillRect(0, -2, 12, 4);
        ctx.fillStyle = accentColor;
        ctx.fillRect(10, -3, 4, 6);
        ctx.restore();
        ctx.save(); ctx.translate(-10, -4); ctx.rotate(-armAngle);
        ctx.fillRect(-12, -2, 12, 4);
        ctx.fillStyle = accentColor;
        ctx.fillRect(-14, -3, 4, 6);
        ctx.restore();

        // Head
        ctx.fillStyle = bodyColor;
        ctx.fillRect(-8, -24, 16, 14);
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(-8, -24, 16, 14);

        // Eyes (glowing)
        ctx.fillStyle = eyeColor;
        ctx.globalAlpha = 0.7 + Math.sin(t * 3) * 0.3;
        ctx.beginPath(); ctx.arc(-4, -18, 3, 0, Math.PI * 2); ctx.arc(4, -18, 3, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;

        // Antenna
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, -24); ctx.lineTo(0, -30); ctx.stroke();
        ctx.fillStyle = eyeColor;
        ctx.beginPath(); ctx.arc(0, -31, 2, 0, Math.PI * 2); ctx.fill();

        // Armor additions
        if (zombie.type === 'cone') {
            // Scout visor
            ctx.fillStyle = '#FF8C00';
            ctx.globalAlpha = 0.5;
            ctx.fillRect(-9, -20, 18, 6);
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#FF8C00';
            ctx.beginPath();
            ctx.moveTo(-6, -26); ctx.lineTo(0, -34); ctx.lineTo(6, -26);
            ctx.fill();
        } else if (zombie.type === 'bucket') {
            // Heavy armor plates
            ctx.fillStyle = '#A9A9A9';
            ctx.fillRect(-12, -12, 24, 24);
            ctx.fillStyle = bodyColor;
            ctx.fillRect(-10, -10, 20, 20);
            // Shoulder pads
            ctx.fillStyle = '#A9A9A9';
            ctx.fillRect(-14, -10, 6, 12);
            ctx.fillRect(8, -10, 6, 12);
        } else if (zombie.type === 'tank') {
            // Mech armor
            ctx.fillStyle = '#555';
            ctx.fillRect(-14, -14, 28, 28);
            ctx.fillStyle = bodyColor;
            ctx.fillRect(-10, -10, 20, 20);
            // Helmet
            ctx.fillStyle = '#555';
            ctx.beginPath(); ctx.arc(0, -22, 10, Math.PI, 0); ctx.fill();
            ctx.fillStyle = '#333';
            ctx.fillRect(-8, -24, 16, 4);
            // Weapon arms
            ctx.fillStyle = '#444';
            ctx.fillRect(-18, -6, 6, 12);
            ctx.fillRect(12, -6, 6, 12);
        }

        // HP bar
        const def = ZOMBIE_DEFS[zombie.type];
        if (zombie.hp < def.hp) {
            const barW = 24;
            ctx.fillStyle = '#333';
            ctx.fillRect(-barW/2, -38, barW, 3);
            ctx.fillStyle = '#F44336';
            ctx.fillRect(-barW/2, -38, barW * (zombie.hp / def.hp), 3);
        }

        ctx.restore();
    },

    // ─── Projectiles ───
    drawProjectile(ctx, proj) {
        ctx.save();
        ctx.translate(proj.x, proj.y);

        if (proj.type === 'pea') {
            // Coconut
            ctx.fillStyle = '#8B6914';
            ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#A0522D';
            ctx.beginPath(); ctx.arc(-1, -1, 2, 0, Math.PI * 2); ctx.fill();
            // Husk lines
            ctx.strokeStyle = '#654321'; ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(-3, -3); ctx.lineTo(3, 3); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(3, -3); ctx.lineTo(-3, 3); ctx.stroke();
        } else if (proj.type === 'snowpea') {
            // Ice crystal
            ctx.fillStyle = '#87CEEB';
            ctx.beginPath();
            ctx.moveTo(0, -6); ctx.lineTo(4, 0); ctx.lineTo(0, 6); ctx.lineTo(-4, 0);
            ctx.fill();
            ctx.fillStyle = '#E0FFFF';
            ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2); ctx.fill();
        }

        ctx.restore();
    },

    // ─── Sun/Eggs ───
    drawSun(ctx, sun) {
        ctx.save();
        ctx.translate(sun.x, sun.y);
        ctx.globalAlpha = sun.alpha || 1;

        // Glow
        ctx.fillStyle = 'rgba(255,215,0,0.2)';
        ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();

        // Egg shape
        ctx.fillStyle = '#FFFACD';
        ctx.beginPath(); ctx.ellipse(0, 0, 10, 13, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#FFE4B5'; ctx.lineWidth = 1; ctx.stroke();

        // Spots
        ctx.fillStyle = '#DEB887';
        ctx.beginPath(); ctx.arc(-3, -4, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(4, 2, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-2, 5, 1, 0, Math.PI * 2); ctx.fill();

        ctx.globalAlpha = 1;
        ctx.restore();
    },

    // ─── Particles ───
    drawParticle(ctx, p) {
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
    },

    // ─── Plant Bar ───
    drawPlantBar(ctx, selectedPlant, plantCooldowns, currentSun, currentWave) {
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(0, H - 70, W, 70);

        const startX = 10, btnW = 55, btnH = 55;

        for (let i = 0; i < PLANT_ORDER.length; i++) {
            const key = PLANT_ORDER[i];
            const def = PLANT_DEFS[key];
            const bx = startX + i * (btnW + 5);
            const by = H - 65;
            const unlocked = currentWave >= def.unlocked;
            const canAfford = currentSun >= def.cost;
            const cooldown = plantCooldowns[key] || 0;
            const isSelected = selectedPlant === key;

            ctx.fillStyle = isSelected ? 'rgba(76,175,80,0.4)' : unlocked ? 'rgba(255,255,255,0.08)' : 'rgba(50,50,50,0.3)';
            ctx.fillRect(bx, by, btnW, btnH);
            ctx.strokeStyle = isSelected ? '#4CAF50' : canAfford && unlocked ? '#8B6914' : '#444';
            ctx.lineWidth = isSelected ? 2 : 1;
            ctx.strokeRect(bx, by, btnW, btnH);

            if (unlocked) {
                ctx.save();
                ctx.translate(bx + btnW/2, by + 22);
                ctx.scale(0.45, 0.45);
                this.drawPlant(ctx, { type: key, row: 0, col: 0, hp: 100 }, 0);
                ctx.restore();

                ctx.fillStyle = canAfford ? '#FFD700' : '#F44336';
                ctx.font = 'bold 10px Rajdhani, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(def.cost, bx + btnW/2, by + 42);

                if (cooldown > 0) {
                    ctx.fillStyle = 'rgba(0,0,0,0.5)';
                    ctx.fillRect(bx, by, btnW, btnH * (cooldown / def.cooldown));
                }

                ctx.fillStyle = '#666';
                ctx.font = '8px Rajdhani, sans-serif';
                ctx.fillText(i + 1, bx + btnW/2, by + 52);
            } else {
                ctx.fillStyle = '#555';
                ctx.font = '18px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('🔒', bx + btnW/2, by + 30);
                ctx.font = '8px Rajdhani, sans-serif';
                ctx.fillText('Wave ' + def.unlocked, bx + btnW/2, by + 48);
            }
        }

        const shovelX = startX + PLANT_ORDER.length * (btnW + 5) + 10;
        ctx.fillStyle = selectedPlant === 'shovel' ? 'rgba(255,165,0,0.4)' : 'rgba(255,255,255,0.08)';
        ctx.fillRect(shovelX, H - 65, btnW, btnH);
        ctx.strokeStyle = selectedPlant === 'shovel' ? '#FFA500' : '#444';
        ctx.strokeRect(shovelX, H - 65, btnW, btnH);
        ctx.fillStyle = '#FFA500';
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🔧', shovelX + btnW/2, H - 35);
        ctx.fillStyle = '#888';
        ctx.font = '8px Rajdhani, sans-serif';
        ctx.fillText('Remove', shovelX + btnW/2, H - 18);
    },

    // ─── HUD ───
    drawHUD(ctx, sun, wave, maxWaves) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(10, 10, 100, 35);
        ctx.strokeStyle = '#8B6914';
        ctx.lineWidth = 1;
        ctx.strokeRect(10, 10, 100, 35);
        ctx.fillStyle = '#FFD700';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('🥚', 18, 33);
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 16px Orbitron, monospace';
        ctx.fillText(String(sun), 40, 33);

        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(W - 130, 10, 120, 35);
        ctx.strokeStyle = '#FF6600';
        ctx.strokeRect(W - 130, 10, 120, 35);
        ctx.fillStyle = '#FF6600';
        ctx.font = 'bold 14px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Wave ' + wave + '/' + maxWaves, W - 70, 33);
    },

    // ─── Overlays ───
    drawPause(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 28px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('TẠM DỪNG', W/2, H/2 - 10);
        ctx.fillStyle = '#AAA';
        ctx.font = '14px Rajdhani, sans-serif';
        ctx.fillText('Nhấn để tiếp tục', W/2, H/2 + 20);
    },

    drawGameOver(ctx, wave) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#F44336';
        ctx.font = 'bold 30px Orbitron, monospace';
        ctx.fillText('GAME OVER', W/2, H/2 - 50);
        ctx.fillStyle = '#FFF';
        ctx.font = '16px Rajdhani, sans-serif';
        ctx.fillText('Sống sót đến Wave ' + wave, W/2, H/2);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px Orbitron, monospace';
        ctx.fillText('[ NHẤP ĐỂ CHƠI LẠI ]', W/2, H/2 + 50);
    },

    drawVictory(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#4CAF50';
        ctx.font = 'bold 30px Orbitron, monospace';
        ctx.fillText('CHIẾN THẮNG!', W/2, H/2 - 50);
        ctx.fillStyle = '#FFF';
        ctx.font = '16px Rajdhani, sans-serif';
        ctx.fillText('Đã bảo vệ Vương Quốc Động Vật!', W/2, H/2);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px Orbitron, monospace';
        ctx.fillText('[ NHẤP ĐỂ TIẾP TỤC ]', W/2, H/2 + 50);
    }
};
