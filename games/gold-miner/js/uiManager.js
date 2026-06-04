/**
 * Gold Miner - UI Manager
 */
class UIManager {
    constructor(w, h) {
        this.w = w;
        this.h = h;
        this.shakeX = 0;
        this.shakeY = 0;
        this.shakeTimer = 0;
    }

    shake(amt = 5, dur = 10) {
        this.shakeX = (Math.random()-0.5)*amt*2;
        this.shakeY = (Math.random()-0.5)*amt*2;
        this.shakeTimer = dur;
    }

    updateShake() {
        if (this.shakeTimer > 0) {
            this.shakeTimer--;
            this.shakeX *= 0.85;
            this.shakeY *= 0.85;
            if (this.shakeTimer <= 0) { this.shakeX = 0; this.shakeY = 0; }
        }
    }

    drawHUD(ctx, score, target, time, level, dynamite) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, this.w, 48);

        // Level
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 15px Orbitron, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Level ${level + 1}`, 10, 18);

        // Score
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px Rajdhani, sans-serif';
        ctx.fillText(`Score: $${score}`, 10, 36);

        // Target
        ctx.fillStyle = score >= target ? '#44ff44' : '#ff8844';
        ctx.font = 'bold 13px Rajdhani, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Target: $${target}`, this.w / 2, 18);

        // Progress bar
        const barW = 140;
        const barX = this.w / 2 - barW / 2;
        const progress = Math.min(1, score / target);
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, 26, barW, 8);
        ctx.fillStyle = score >= target ? '#44ff44' : '#ffaa00';
        ctx.fillRect(barX, 26, barW * progress, 8);
        ctx.strokeStyle = '#555'; ctx.lineWidth = 1;
        ctx.strokeRect(barX, 26, barW, 8);

        // Timer
        ctx.textAlign = 'right';
        const tc = time <= 10 ? '#ff4444' : time <= 20 ? '#ffaa00' : '#fff';
        ctx.fillStyle = tc;
        ctx.font = 'bold 16px Orbitron, monospace';
        ctx.fillText(`${Math.ceil(time)}s`, this.w - 10, 18);

        // Timer bar
        const tbW = 90;
        const tbX = this.w - 10 - tbW;
        ctx.fillStyle = '#333';
        ctx.fillRect(tbX, 26, tbW, 6);
        ctx.fillStyle = time <= 10 ? '#ff4444' : '#00ccff';
        ctx.fillRect(tbX, 26, tbW * Math.max(0, time / 60), 6);

        // Dynamite
        if (dynamite > 0) {
            ctx.textAlign = 'right';
            ctx.fillStyle = '#ff8844';
            ctx.font = 'bold 12px Rajdhani, sans-serif';
            ctx.fillText(`🧨 ${dynamite} [UP]`, this.w - 10, 42);
        }

        // Sound
        ctx.textAlign = 'left';
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#555';
        ctx.fillText(AudioSystem.enabled ? '🔊' : '🔇', 10, 48);
    }

    drawMiner(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);
        // Body
        ctx.fillStyle = '#4488cc';
        ctx.fillRect(-12, -5, 24, 20);
        // Head
        ctx.fillStyle = '#ffcc88';
        ctx.beginPath(); ctx.arc(0, -12, 10, 0, Math.PI * 2); ctx.fill();
        // Helmet
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath(); ctx.arc(0, -16, 11, Math.PI, 0); ctx.fill();
        // Light
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(0, -22, 3, 0, Math.PI * 2); ctx.fill();
        // Eyes
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(-4, -12, 2, 0, Math.PI * 2);
        ctx.arc(4, -12, 2, 0, Math.PI * 2);
        ctx.fill();
        // Smile
        ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0, -9, 4, 0.1, Math.PI - 0.1); ctx.stroke();
        ctx.restore();
    }

    drawStartScreen(ctx, level, target, time) {
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(0, 0, this.w, this.h);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 30px Orbitron, monospace';
        ctx.fillText(`Level ${level + 1}`, this.w / 2, this.h / 2 - 70);
        ctx.fillStyle = '#fff';
        ctx.font = '17px Rajdhani, sans-serif';
        ctx.fillText(`Target: $${target}`, this.w / 2, this.h / 2 - 25);
        ctx.fillText(`Time: ${time}s`, this.w / 2, this.h / 2 + 5);
        ctx.fillStyle = '#aaa';
        ctx.font = '14px Rajdhani, sans-serif';
        ctx.fillText('Click / Space to launch hook', this.w / 2, this.h / 2 + 50);
        ctx.fillText('Grab gold & diamonds to reach the target!', this.w / 2, this.h / 2 + 70);
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 18px Orbitron, monospace';
        if (Math.floor(Date.now() / 500) % 2 === 0)
            ctx.fillText('[ CLICK TO START ]', this.w / 2, this.h / 2 + 110);
    }

    drawWinScreen(ctx, score, level) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, this.w, this.h);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#44ff44';
        ctx.font = 'bold 34px Orbitron, monospace';
        ctx.fillText('LEVEL COMPLETE!', this.w / 2, this.h / 2 - 50);
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 22px Orbitron, monospace';
        ctx.fillText(`Score: $${score}`, this.w / 2, this.h / 2);
        ctx.fillStyle = '#aaa';
        ctx.font = '15px Rajdhani, sans-serif';
        ctx.fillText('Click to continue to shop', this.w / 2, this.h / 2 + 50);
    }

    drawLoseScreen(ctx, score, target, level) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, this.w, this.h);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 34px Orbitron, monospace';
        ctx.fillText("TIME'S UP!", this.w / 2, this.h / 2 - 60);
        ctx.fillStyle = '#fff';
        ctx.font = '17px Rajdhani, sans-serif';
        ctx.fillText(`Your Score: $${score}`, this.w / 2, this.h / 2 - 15);
        ctx.fillStyle = '#ff8844';
        ctx.fillText(`Target was: $${target}`, this.w / 2, this.h / 2 + 15);
        ctx.fillStyle = '#aaa';
        ctx.font = '14px Rajdhani, sans-serif';
        ctx.fillText('Click to retry', this.w / 2, this.h / 2 + 60);
    }

    drawGameOver(ctx, score, level, stats) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, this.w, this.h);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 38px Orbitron, monospace';
        ctx.fillText('GAME OVER', this.w / 2, this.h / 2 - 80);
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 22px Orbitron, monospace';
        ctx.fillText(`Final Score: $${score}`, this.w / 2, this.h / 2 - 30);
        ctx.fillStyle = '#aaa';
        ctx.font = '14px Rajdhani, sans-serif';
        ctx.fillText(`Reached Level ${level + 1}`, this.w / 2, this.h / 2);
        ctx.fillText(`Total Gold: ${stats.totalGold}  |  Diamonds: ${stats.totalDiamonds}`, this.w / 2, this.h / 2 + 25);
        ctx.fillText(`Rocks: ${stats.totalRocks}  |  Bones: ${stats.totalBones}`, this.w / 2, this.h / 2 + 45);
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 16px Orbitron, monospace';
        ctx.fillText('[ CLICK TO RESTART ]', this.w / 2, this.h / 2 + 85);
    }

    drawVictoryScreen(ctx, score, stats) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, this.w, this.h);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#44ff44';
        ctx.font = 'bold 36px Orbitron, monospace';
        ctx.fillText('YOU WIN!', this.w / 2, this.h / 2 - 100);
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 24px Orbitron, monospace';
        ctx.fillText(`Total: $${score}`, this.w / 2, this.h / 2 - 50);
        ctx.fillStyle = '#fff';
        ctx.font = '15px Rajdhani, sans-serif';
        ctx.fillText('Congratulations! You completed all 25 levels!', this.w / 2, this.h / 2 - 15);
        ctx.fillStyle = '#aaa';
        ctx.font = '13px Rajdhani, sans-serif';
        ctx.fillText(`Total Gold Collected: ${stats.totalGold}`, this.w / 2, this.h / 2 + 20);
        ctx.fillText(`Total Diamonds: ${stats.totalDiamonds}`, this.w / 2, this.h / 2 + 38);
        ctx.fillText(`Total Rocks: ${stats.totalRocks}`, this.w / 2, this.h / 2 + 56);
        ctx.fillText(`Total Bones: ${stats.totalBones}`, this.w / 2, this.h / 2 + 74);
        ctx.fillText(`Total Money Earned: $${stats.totalMoney}`, this.w / 2, this.h / 2 + 92);
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 16px Orbitron, monospace';
        ctx.fillText('[ CLICK TO PLAY AGAIN ]', this.w / 2, this.h / 2 + 130);
    }

    drawMenu(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, this.w, this.h);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 40px Orbitron, monospace';
        ctx.fillText('GOLD MINER', this.w / 2, this.h / 2 - 80);
        ctx.fillStyle = '#aaa';
        ctx.font = '15px Rajdhani, sans-serif';
        ctx.fillText('Grab gold, diamonds and beat the clock!', this.w / 2, this.h / 2 - 40);
        ctx.fillStyle = '#888';
        ctx.font = '13px Rajdhani, sans-serif';
        ctx.fillText('Click / Space = Launch hook  |  ↑ = Use Dynamite  |  M = Sound', this.w / 2, this.h / 2 + 10);
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 18px Orbitron, monospace';
        if (Math.floor(Date.now() / 500) % 2 === 0)
            ctx.fillText('[ CLICK TO PLAY ]', this.w / 2, this.h / 2 + 60);
        ctx.fillStyle = '#555';
        ctx.font = '11px Rajdhani, sans-serif';
        ctx.fillText('25 Levels  |  Shop System  |  TNT  |  Moles  |  Mystery Bags', this.w / 2, this.h / 2 + 100);
    }
}
