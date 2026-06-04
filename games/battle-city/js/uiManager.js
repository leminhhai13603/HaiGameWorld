/**
 * Battle City - UI Manager
 */
class UIManager {
    constructor() {
        this.shakeX = 0; this.shakeY = 0; this.shakeTimer = 0;
        this.flashColor = null; this.flashTimer = 0;
        this.explosions = [];
        this.scorePopups = [];
    }

    shake(amt = 4, dur = 10) {
        this.shakeX = (Math.random() - 0.5) * amt * 2;
        this.shakeY = (Math.random() - 0.5) * amt * 2;
        this.shakeTimer = dur;
    }

    flash(color, dur = 8) {
        this.flashColor = color;
        this.flashTimer = dur;
    }

    addExplosion(x, y, size = 1) {
        this.explosions.push({ x, y, timer: 20, size });
    }

    addScorePopup(x, y, text, color = '#fff') {
        this.scorePopups.push({ x, y, text, timer: 40, color });
    }

    update() {
        if (this.shakeTimer > 0) {
            this.shakeTimer--;
            this.shakeX *= 0.85;
            this.shakeY *= 0.85;
            if (this.shakeTimer <= 0) { this.shakeX = 0; this.shakeY = 0; }
        }
        if (this.flashTimer > 0) this.flashTimer--;

        for (let i = this.explosions.length - 1; i >= 0; i--) {
            this.explosions[i].timer--;
            if (this.explosions[i].timer <= 0) this.explosions.splice(i, 1);
        }
        for (let i = this.scorePopups.length - 1; i >= 0; i--) {
            this.scorePopups[i].timer--;
            this.scorePopups[i].y -= 0.8;
            if (this.scorePopups[i].timer <= 0) this.scorePopups.splice(i, 1);
        }
    }

    drawHUD(ctx, lives, score, level, enemiesLeft, isCoop, p2Lives) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, CANVAS_W, HUD_H);

        // Lives
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`P1: ${'🏆'.repeat(Math.max(0, lives))}`, 10, 18);

        if (isCoop) {
            ctx.fillStyle = '#00ccff';
            ctx.fillText(`P2: ${'🏆'.repeat(Math.max(0, p2Lives))}`, 10, 38);
        }

        // Score
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`SCORE: ${score}`, CANVAS_W / 2, 18);

        // Level
        ctx.fillStyle = '#aaa';
        ctx.font = '14px monospace';
        ctx.fillText(`LEVEL ${level}`, CANVAS_W / 2, 38);

        // Enemies left
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ff4444';
        ctx.font = '14px monospace';
        ctx.fillText(`Enemies: ${enemiesLeft}`, CANVAS_W - 10, 18);

        // Controls hint
        ctx.fillStyle = '#555';
        ctx.font = '10px monospace';
        ctx.fillText('P:Pause M:Sound', CANVAS_W - 10, 38);
    }

    drawExplosions(ctx) {
        for (const e of this.explosions) {
            const progress = 1 - (e.timer / 20);
            const radius = (10 + e.size * 10) * (0.5 + progress * 0.5);
            const alpha = 1 - progress;

            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#ff4400';
            ctx.beginPath();
            ctx.arc(e.x, e.y + HUD_H, radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffaa00';
            ctx.beginPath();
            ctx.arc(e.x, e.y + HUD_H, radius * 0.6, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(e.x, e.y + HUD_H, radius * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    drawScorePopups(ctx) {
        for (const p of this.scorePopups) {
            ctx.globalAlpha = p.timer / 40;
            ctx.fillStyle = p.color;
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(p.text, p.x, p.y + HUD_H);
        }
        ctx.globalAlpha = 1;
    }

    drawFlash(ctx) {
        if (this.flashTimer > 0 && this.flashColor) {
            ctx.fillStyle = this.flashColor;
            ctx.globalAlpha = this.flashTimer / 20;
            ctx.fillRect(0, HUD_H, CANVAS_W, MAP_H);
            ctx.globalAlpha = 1;
        }
    }

    drawMenu(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.9)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        ctx.textAlign = 'center';

        // Title
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 36px Orbitron, monospace';
        ctx.fillText('BATTLE CITY', CANVAS_W / 2, 120);

        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 18px Orbitron, monospace';
        ctx.fillText('TANK 1990 REMAKE', CANVAS_W / 2, 155);

        // Tank decorations
        ctx.font = '40px sans-serif';
        ctx.fillText('🎯 🏆 💥', CANVAS_W / 2, 210);

        // Menu items
        const items = [
            { text: '1 PLAYER', y: 290 },
            { text: '2 PLAYERS (CO-OP)', y: 325 },
            { text: 'LEVEL SELECT', y: 360 },
            { text: 'MAP EDITOR', y: 395 },
            { text: 'STATISTICS', y: 430 },
            { text: 'SETTINGS', y: 465 }
        ];

        for (const item of items) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px Rajdhani, sans-serif';
            ctx.fillText(item.text, CANVAS_W / 2, item.y);
        }

        // Controls
        ctx.fillStyle = '#888';
        ctx.font = '12px Rajdhani, sans-serif';
        ctx.fillText('P1: WASD + SPACE  |  P2: Arrows + ENTER  |  P: Pause  |  M: Sound', CANVAS_W / 2, CANVAS_H - 40);
        ctx.fillText('Click to select option', CANVAS_W / 2, CANVAS_H - 20);
    }

    drawLevelSelect(ctx, maxLevel) {
        ctx.fillStyle = 'rgba(0,0,0,0.9)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 24px Orbitron, monospace';
        ctx.fillText('LEVEL SELECT', CANVAS_W / 2, 40);

        const cols = 7;
        const cellSize = 44;
        const gap = 6;
        const startX = CANVAS_W / 2 - (cols * (cellSize + gap) - gap) / 2;
        const startY = 70;

        for (let i = 0; i < 35; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = startX + col * (cellSize + gap);
            const y = startY + row * (cellSize + gap);
            const unlocked = (i + 1) <= maxLevel;
            const isBoss = BOSS_LEVELS.includes(i + 1);

            ctx.fillStyle = unlocked ? (isBoss ? '#5a1a1a' : '#1a2a3a') : '#222';
            ctx.fillRect(x, y, cellSize, cellSize);
            ctx.strokeStyle = unlocked ? (isBoss ? '#ff4444' : '#4488cc') : '#333';
            ctx.lineWidth = isBoss ? 2 : 1;
            ctx.strokeRect(x, y, cellSize, cellSize);

            ctx.fillStyle = unlocked ? '#fff' : '#444';
            ctx.font = 'bold 16px Orbitron, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${i + 1}`, x + cellSize / 2, y + cellSize / 2);
        }

        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#aaa';
        ctx.font = '13px Rajdhani, sans-serif';
        ctx.fillText('Click a level  |  ESC to go back', CANVAS_W / 2, CANVAS_H - 20);
    }

    drawLevelStart(ctx, level, hasBoss) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 30px Orbitron, monospace';
        ctx.fillText(`LEVEL ${level}`, CANVAS_W / 2, CANVAS_H / 2 - 20);

        if (hasBoss) {
            ctx.fillStyle = '#ff4444';
            ctx.font = 'bold 18px Orbitron, monospace';
            ctx.fillText('⚠ BOSS BATTLE ⚠', CANVAS_W / 2, CANVAS_H / 2 + 20);
        }

        ctx.fillStyle = '#aaa';
        ctx.font = '14px Rajdhani, sans-serif';
        ctx.fillText('Click to start', CANVAS_W / 2, CANVAS_H / 2 + 60);
    }

    drawGameOver(ctx, score, level) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 36px Orbitron, monospace';
        ctx.fillText('GAME OVER', CANVAS_W / 2, CANVAS_H / 2 - 50);

        ctx.fillStyle = '#fff';
        ctx.font = '18px Rajdhani, sans-serif';
        ctx.fillText(`Score: ${score}`, CANVAS_W / 2, CANVAS_H / 2);
        ctx.fillText(`Level: ${level}`, CANVAS_W / 2, CANVAS_H / 2 + 25);

        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 14px Orbitron, monospace';
        ctx.fillText('[ CLICK TO CONTINUE ]', CANVAS_W / 2, CANVAS_H / 2 + 70);
    }

    drawVictory(ctx, score) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#44ff44';
        ctx.font = 'bold 34px Orbitron, monospace';
        ctx.fillText('VICTORY!', CANVAS_W / 2, CANVAS_H / 2 - 50);

        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 20px Orbitron, monospace';
        ctx.fillText(`Final Score: ${score}`, CANVAS_W / 2, CANVAS_H / 2);

        ctx.fillStyle = '#fff';
        ctx.font = '15px Rajdhani, sans-serif';
        ctx.fillText('All 35 levels cleared!', CANVAS_W / 2, CANVAS_H / 2 + 30);

        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 14px Orbitron, monospace';
        ctx.fillText('[ CLICK TO RESTART ]', CANVAS_W / 2, CANVAS_H / 2 + 70);
    }

    drawStatistics(ctx, stats) {
        ctx.fillStyle = 'rgba(0,0,0,0.9)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 24px Orbitron, monospace';
        ctx.fillText('STATISTICS', CANVAS_W / 2, 45);

        const items = [
            ['Enemies Destroyed', stats.enemiesDestroyed],
            ['Accuracy', stats.shotsFired > 0 ? `${Math.round(stats.shotsHit / stats.shotsFired * 100)}%` : 'N/A'],
            ['Levels Cleared', stats.levelsCleared],
            ['Deaths', stats.deaths],
            ['Powerups Collected', stats.powerupsCollected],
            ['Total Score', stats.totalScore],
            ['Play Time', `${Math.floor(stats.playTime / 60)}m`],
            ['Highest Level', stats.highestLevel]
        ];

        ctx.textAlign = 'left';
        const sx = CANVAS_W / 2 - 140;
        items.forEach(([label, val], i) => {
            ctx.fillStyle = '#aaa';
            ctx.font = '14px Rajdhani, sans-serif';
            ctx.fillText(label, sx, 90 + i * 32);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 15px Rajdhani, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`${val}`, sx + 280, 90 + i * 32);
            ctx.textAlign = 'left';
        });

        ctx.fillStyle = '#aaa';
        ctx.font = '13px Rajdhani, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ESC to go back', CANVAS_W / 2, CANVAS_H - 20);
    }

    drawPaused(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 28px Orbitron, monospace';
        ctx.fillText('PAUSED', CANVAS_W / 2, CANVAS_H / 2 - 10);
        ctx.fillStyle = '#aaa';
        ctx.font = '14px Rajdhani, sans-serif';
        ctx.fillText('Press P or ESC to resume', CANVAS_W / 2, CANVAS_H / 2 + 25);
    }

    drawEditorUI(ctx, selectedTile, mapName) {
        const tileNames = ['Empty', 'Brick', 'Steel', 'Water', 'Forest', 'Ice'];
        const tileColors = ['#000', '#b35900', '#aaa', '#2244aa', '#1a6b1a', '#aaddff'];

        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, CANVAS_W, HUD_H);

        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 14px Orbitron, monospace';
        ctx.fillText('MAP EDITOR', 10, 18);

        ctx.fillStyle = '#fff';
        ctx.font = '12px Rajdhani, sans-serif';
        ctx.fillText(`Map: ${mapName}`, 10, 38);

        // Tile palette
        for (let i = 0; i < 6; i++) {
            const x = 200 + i * 50;
            const y = 5;
            ctx.fillStyle = tileColors[i];
            ctx.fillRect(x, y, 40, 30);
            if (i === selectedTile) {
                ctx.strokeStyle = '#ffcc00';
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, 40, 30);
            }
            ctx.fillStyle = '#fff';
            ctx.font = '9px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(tileNames[i], x + 20, 44);
        }

        ctx.textAlign = 'right';
        ctx.fillStyle = '#888';
        ctx.font = '11px Rajdhani, sans-serif';
        ctx.fillText('Left:Place  Right:Erase  Scroll:Change  S:Save  ESC:Exit', CANVAS_W - 10, 18);
    }
}
