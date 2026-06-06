/**
 * PvZ Lite - Renderer
 * Procedural sprites for plants, zombies, effects
 */
const Renderer = {
    // ─── Background ───
    drawBackground(ctx, gameTime) {
        // Sky
        const grad = ctx.createLinearGradient(0, 0, 0, GRID_Y);
        grad.addColorStop(0, '#87CEEB');
        grad.addColorStop(1, '#B0E0E6');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, GRID_Y);

        // Grass rows
        for (let r = 0; r < ROWS; r++) {
            ctx.fillStyle = r % 2 === 0 ? '#4CAF50' : '#45A049';
            ctx.fillRect(GRID_X, GRID_Y + r * CELL_H, COLS * CELL_W, CELL_H);
        }

        // Grid lines
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 1;
        for (let r = 0; r <= ROWS; r++) {
            ctx.beginPath();
            ctx.moveTo(GRID_X, GRID_Y + r * CELL_H);
            ctx.lineTo(GRID_X + COLS * CELL_W, GRID_Y + r * CELL_H);
            ctx.stroke();
        }
        for (let c = 0; c <= COLS; c++) {
            ctx.beginPath();
            ctx.moveTo(GRID_X + c * CELL_W, GRID_Y);
            ctx.lineTo(GRID_X + c * CELL_W, GRID_Y + ROWS * CELL_H);
            ctx.stroke();
        }

        // House
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, GRID_Y, HOUSE_X - 10, ROWS * CELL_H);
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(HOUSE_X - 15, GRID_Y - 20, 30, ROWS * CELL_H + 20);
        // Roof
        ctx.fillStyle = '#CD853F';
        ctx.beginPath();
        ctx.moveTo(0, GRID_Y - 20);
        ctx.lineTo(HOUSE_X - 15, GRID_Y - 40);
        ctx.lineTo(HOUSE_X + 15, GRID_Y - 20);
        ctx.fill();
        // Door
        ctx.fillStyle = '#654321';
        ctx.fillRect(HOUSE_X - 20, GRID_Y + 80, 20, 40);
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(HOUSE_X - 5, GRID_Y + 100, 2, 0, Math.PI * 2);
        ctx.fill();

        // Lawn mower area
        ctx.fillStyle = '#333';
        for (let r = 0; r < ROWS; r++) {
            ctx.fillRect(HOUSE_X - 5, GRID_Y + r * CELL_H + CELL_H/2 - 5, 10, 10);
        }
    },

    // ─── Plants ───
    drawPlant(ctx, plant, gameTime) {
        const cx = GRID_X + plant.col * CELL_W + CELL_W/2;
        const cy = GRID_Y + plant.row * CELL_H + CELL_H/2 + 10;
        const t = gameTime || 0;
        const bob = Math.sin(t * 3 + plant.col + plant.row) * 1.5;

        ctx.save();
        ctx.translate(cx, cy + bob);

        switch (plant.type) {
            case 'sunflower':
                // Stem
                ctx.fillStyle = '#228B22';
                ctx.fillRect(-2, -5, 4, 20);
                // Petals
                ctx.fillStyle = '#FFD700';
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2 + t * 0.5;
                    ctx.beginPath();
                    ctx.ellipse(Math.cos(angle) * 12, -10 + Math.sin(angle) * 12, 6, 3, angle, 0, Math.PI * 2);
                    ctx.fill();
                }
                // Center
                ctx.fillStyle = '#8B4513';
                ctx.beginPath();
                ctx.arc(0, -10, 8, 0, Math.PI * 2);
                ctx.fill();
                // Face
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(-3, -12, 1.5, 0, Math.PI * 2);
                ctx.arc(3, -12, 1.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(0, -8, 3, 0, Math.PI);
                ctx.stroke();
                break;

            case 'peashooter':
                // Stem
                ctx.fillStyle = '#228B22';
                ctx.fillRect(-2, -5, 4, 18);
                // Head
                ctx.fillStyle = '#32CD32';
                ctx.beginPath();
                ctx.arc(0, -12, 10, 0, Math.PI * 2);
                ctx.fill();
                // Mouth
                ctx.fillStyle = '#006400';
                ctx.beginPath();
                ctx.arc(8, -12, 5, -Math.PI/3, Math.PI/3);
                ctx.fill();
                // Eye
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(2, -15, 2, 0, Math.PI * 2);
                ctx.fill();
                // Leaf
                ctx.fillStyle = '#228B22';
                ctx.beginPath();
                ctx.ellipse(-8, 0, 8, 4, -0.3, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'wallnut':
                // Body
                const dmgRatio = 1 - plant.hp / PLANT_DEFS.wallnut.hp;
                ctx.fillStyle = dmgRatio > 0.5 ? '#8B6914' : '#A0522D';
                ctx.beginPath();
                ctx.arc(0, -5, 16, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#654321';
                ctx.lineWidth = 2;
                ctx.stroke();
                // Face
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(-5, -8, 2, 0, Math.PI * 2);
                ctx.arc(5, -8, 2, 0, Math.PI * 2);
                ctx.fill();
                // Mouth (worried when damaged)
                if (dmgRatio > 0.5) {
                    ctx.beginPath();
                    ctx.arc(0, 0, 4, Math.PI, 0);
                    ctx.stroke();
                } else {
                    ctx.beginPath();
                    ctx.arc(0, -2, 3, 0, Math.PI);
                    ctx.stroke();
                }
                // Cracks
                if (dmgRatio > 0.3) {
                    ctx.strokeStyle = '#654321';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(-5, -15); ctx.lineTo(-2, -5); ctx.lineTo(-8, 2);
                    ctx.stroke();
                }
                break;

            case 'snowpea':
                // Stem
                ctx.fillStyle = '#00CED1';
                ctx.fillRect(-2, -5, 4, 18);
                // Head
                ctx.fillStyle = '#48D1CC';
                ctx.beginPath();
                ctx.arc(0, -12, 10, 0, Math.PI * 2);
                ctx.fill();
                // Ice crystals
                ctx.fillStyle = '#E0FFFF';
                ctx.beginPath();
                ctx.moveTo(-6, -22); ctx.lineTo(-3, -18); ctx.lineTo(-9, -18);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(4, -22); ctx.lineTo(7, -18); ctx.lineTo(1, -18);
                ctx.fill();
                // Mouth
                ctx.fillStyle = '#008B8B';
                ctx.beginPath();
                ctx.arc(8, -12, 5, -Math.PI/3, Math.PI/3);
                ctx.fill();
                // Eye
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(2, -15, 2, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'cherrybomb':
                // Stems
                ctx.strokeStyle = '#228B22';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(-8, -20); ctx.lineTo(-5, -8);
                ctx.moveTo(8, -20); ctx.lineTo(5, -8);
                ctx.stroke();
                // Left cherry
                ctx.fillStyle = '#DC143C';
                ctx.beginPath();
                ctx.arc(-8, -2, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#FF6347';
                ctx.beginPath();
                ctx.arc(-10, -5, 3, 0, Math.PI * 2);
                ctx.fill();
                // Right cherry
                ctx.fillStyle = '#DC143C';
                ctx.beginPath();
                ctx.arc(8, -2, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#FF6347';
                ctx.beginPath();
                ctx.arc(6, -5, 3, 0, Math.PI * 2);
                ctx.fill();
                // Angry eyes
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(-10, -4, 1.5, 0, Math.PI * 2);
                ctx.arc(-6, -4, 1.5, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'repeater':
                // Stem
                ctx.fillStyle = '#228B22';
                ctx.fillRect(-2, -5, 4, 18);
                // Head
                ctx.fillStyle = '#32CD32';
                ctx.beginPath();
                ctx.arc(0, -12, 10, 0, Math.PI * 2);
                ctx.fill();
                // Double barrel
                ctx.fillStyle = '#006400';
                ctx.beginPath();
                ctx.arc(10, -14, 4, -Math.PI/3, Math.PI/3);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(10, -10, 4, -Math.PI/3, Math.PI/3);
                ctx.fill();
                // Eye
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(2, -15, 2, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'spikeplant':
                // Base
                ctx.fillStyle = '#228B22';
                ctx.beginPath();
                ctx.arc(0, 0, 12, 0, Math.PI * 2);
                ctx.fill();
                // Spikes
                ctx.fillStyle = '#2E8B57';
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2;
                    ctx.beginPath();
                    ctx.moveTo(Math.cos(angle) * 8, Math.sin(angle) * 8);
                    ctx.lineTo(Math.cos(angle) * 18, Math.sin(angle) * 18);
                    ctx.lineTo(Math.cos(angle + 0.3) * 8, Math.sin(angle + 0.3) * 8);
                    ctx.fill();
                }
                break;
        }

        ctx.restore();
    },

    // ─── Zombies ───
    drawZombie(ctx, zombie, gameTime) {
        const t = gameTime || 0;
        const walk = Math.sin(t * 5 + zombie.y) * 3;
        const eating = zombie.eating;
        const def = ZOMBIE_DEFS[zombie.type];

        ctx.save();
        ctx.translate(zombie.x, zombie.y + walk);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(0, 20, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Legs
        ctx.fillStyle = '#4A4A4A';
        const legOff = eating ? 0 : Math.sin(t * 8 + zombie.y) * 4;
        ctx.fillRect(-6, 8, 4, 12 + legOff);
        ctx.fillRect(2, 8, 4, 12 - legOff);

        // Body
        ctx.fillStyle = '#556B2F';
        ctx.fillRect(-8, -8, 16, 18);

        // Torn shirt
        ctx.fillStyle = '#6B8E23';
        ctx.fillRect(-7, -6, 14, 12);
        ctx.fillStyle = '#556B2F';
        ctx.beginPath();
        ctx.moveTo(-3, -6); ctx.lineTo(0, 2); ctx.lineTo(3, -6);
        ctx.fill();

        // Arms
        ctx.fillStyle = '#6B8E23';
        const armAngle = eating ? Math.sin(t * 10) * 0.3 : -0.2;
        ctx.save();
        ctx.translate(8, -4);
        ctx.rotate(armAngle);
        ctx.fillRect(0, -2, 12, 4);
        ctx.restore();
        ctx.save();
        ctx.translate(-8, -4);
        ctx.rotate(-armAngle);
        ctx.fillRect(-12, -2, 12, 4);
        ctx.restore();

        // Head
        ctx.fillStyle = '#8FBC8F';
        ctx.beginPath();
        ctx.arc(0, -16, 9, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(-4, -18, 2, 0, Math.PI * 2);
        ctx.arc(4, -18, 2, 0, Math.PI * 2);
        ctx.fill();

        // Mouth
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(0, -12, 3, 0, Math.PI);
        ctx.fill();

        // Armor
        if (zombie.type === 'cone') {
            ctx.fillStyle = '#FF8C00';
            ctx.beginPath();
            ctx.moveTo(-8, -20); ctx.lineTo(0, -35); ctx.lineTo(8, -20);
            ctx.fill();
            ctx.fillStyle = '#FF6600';
            ctx.beginPath();
            ctx.moveTo(-6, -22); ctx.lineTo(0, -32); ctx.lineTo(6, -22);
            ctx.fill();
        } else if (zombie.type === 'bucket') {
            ctx.fillStyle = '#808080';
            ctx.fillRect(-9, -30, 18, 14);
            ctx.fillStyle = '#696969';
            ctx.fillRect(-7, -28, 14, 10);
            ctx.fillStyle = '#A9A9A9';
            ctx.fillRect(-10, -30, 20, 2);
        }

        // Tank armor
        if (zombie.type === 'tank') {
            ctx.fillStyle = '#333';
            ctx.fillRect(-10, -10, 20, 22);
            ctx.fillStyle = '#444';
            ctx.fillRect(-8, -8, 16, 18);
            // Helmet
            ctx.fillStyle = '#555';
            ctx.beginPath();
            ctx.arc(0, -18, 11, Math.PI, 0);
            ctx.fill();
        }

        // HP bar
        if (zombie.hp < def.hp) {
            const barW = 24;
            ctx.fillStyle = '#333';
            ctx.fillRect(-barW/2, -35, barW, 3);
            ctx.fillStyle = '#F44336';
            ctx.fillRect(-barW/2, -35, barW * (zombie.hp / def.hp), 3);
        }

        ctx.restore();
    },

    // ─── Projectiles ───
    drawProjectile(ctx, proj) {
        ctx.save();
        ctx.translate(proj.x, proj.y);

        if (proj.type === 'pea') {
            ctx.fillStyle = '#32CD32';
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#90EE90';
            ctx.beginPath();
            ctx.arc(-1, -1, 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (proj.type === 'snowpea') {
            ctx.fillStyle = '#00CED1';
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#E0FFFF';
            ctx.beginPath();
            ctx.arc(-1, -1, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    },

    // ─── Sun ───
    drawSun(ctx, sun) {
        ctx.save();
        ctx.translate(sun.x, sun.y);
        ctx.globalAlpha = sun.alpha || 1;

        // Glow
        ctx.fillStyle = 'rgba(255,255,0,0.2)';
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();

        // Rays
        ctx.fillStyle = '#FFD700';
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * 14, Math.sin(angle) * 14);
            ctx.lineTo(Math.cos(angle + 0.2) * 10, Math.sin(angle + 0.2) * 10);
            ctx.fill();
        }

        // Body
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();

        // Face
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.arc(-3, -2, 1.5, 0, Math.PI * 2);
        ctx.arc(3, -2, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 2, 3, 0, Math.PI);
        ctx.stroke();

        ctx.globalAlpha = 1;
        ctx.restore();
    },

    // ─── Particles ───
    drawParticle(ctx, p) {
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    },

    // ─── Plant Bar ───
    drawPlantBar(ctx, selectedPlant, plantCooldowns, currentSun, currentWave) {
        // Bar background
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, H - 70, W, 70);

        const startX = 10;
        const btnW = 55, btnH = 55;

        for (let i = 0; i < PLANT_ORDER.length; i++) {
            const key = PLANT_ORDER[i];
            const def = PLANT_DEFS[key];
            const bx = startX + i * (btnW + 5);
            const by = H - 65;
            const unlocked = currentWave >= def.unlocked;
            const canAfford = currentSun >= def.cost;
            const cooldown = plantCooldowns[key] || 0;
            const onCooldown = cooldown > 0;
            const isSelected = selectedPlant === key;

            // Button background
            ctx.fillStyle = isSelected ? 'rgba(76,175,80,0.4)' : unlocked ? 'rgba(255,255,255,0.1)' : 'rgba(50,50,50,0.3)';
            ctx.fillRect(bx, by, btnW, btnH);
            ctx.strokeStyle = isSelected ? '#4CAF50' : canAfford && unlocked ? '#FFD700' : '#444';
            ctx.lineWidth = isSelected ? 2 : 1;
            ctx.strokeRect(bx, by, btnW, btnH);

            if (unlocked) {
                // Mini plant icon
                ctx.save();
                ctx.translate(bx + btnW/2, by + 22);
                ctx.scale(0.5, 0.5);
                this.drawPlant(ctx, { type: key, row: 0, col: 0, hp: 100 }, 0);
                ctx.restore();

                // Cost
                ctx.fillStyle = canAfford ? '#FFD700' : '#F44336';
                ctx.font = 'bold 10px Rajdhani, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(def.cost, bx + btnW/2, by + 42);

                // Cooldown overlay
                if (onCooldown) {
                    ctx.fillStyle = 'rgba(0,0,0,0.5)';
                    const cdRatio = cooldown / def.cooldown;
                    ctx.fillRect(bx, by, btnW, btnH * cdRatio);
                }

                // Key hint
                ctx.fillStyle = '#666';
                ctx.font = '8px Rajdhani, sans-serif';
                ctx.fillText(i + 1, bx + btnW/2, by + 52);
            } else {
                // Locked
                ctx.fillStyle = '#555';
                ctx.font = '18px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('🔒', bx + btnW/2, by + 30);
                ctx.font = '8px Rajdhani, sans-serif';
                ctx.fillText('Wave ' + def.unlocked, bx + btnW/2, by + 48);
            }
        }

        // Shovel button
        const shovelX = startX + PLANT_ORDER.length * (btnW + 5) + 10;
        ctx.fillStyle = selectedPlant === 'shovel' ? 'rgba(255,165,0,0.4)' : 'rgba(255,255,255,0.1)';
        ctx.fillRect(shovelX, H - 65, btnW, btnH);
        ctx.strokeStyle = selectedPlant === 'shovel' ? '#FFA500' : '#444';
        ctx.strokeRect(shovelX, H - 65, btnW, btnH);
        ctx.fillStyle = '#FFA500';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🔧', shovelX + btnW/2, H - 35);
        ctx.fillStyle = '#888';
        ctx.font = '8px Rajdhani, sans-serif';
        ctx.fillText('Shovel', shovelX + btnW/2, H - 18);
    },

    // ─── HUD ───
    drawHUD(ctx, sun, wave, maxWaves) {
        // Sun counter
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(10, 10, 100, 35);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1;
        ctx.strokeRect(10, 10, 100, 35);

        ctx.fillStyle = '#FFD700';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('☀️', 18, 33);
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 16px Orbitron, monospace';
        ctx.fillText(String(sun), 40, 33);

        // Wave indicator
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
        ctx.fillText('Đã bảo vệ thành công!', W/2, H/2);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px Orbitron, monospace';
        ctx.fillText('[ NHẤP ĐỂ TIẾP TỤC ]', W/2, H/2 + 50);
    }
};
