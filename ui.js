/**
 * UI - User interface with weapon level display
 */
class UI {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.screenShake = 0;
        this.screenShakeX = 0;
        this.screenShakeY = 0;
        this.screenShakeIntensity = 5;
        this.hudAnim = 0;
        this.warningPulse = 0;
    }

    applyShake(intensity = 5, duration = 10) {
        this.screenShake = duration;
        this.screenShakeIntensity = intensity;
    }

    updateShake() {
        if (this.screenShake > 0) {
            this.screenShake--;
            const decay = this.screenShake / 10;
            this.screenShakeX = (Math.random() - 0.5) * this.screenShakeIntensity * decay;
            this.screenShakeY = (Math.random() - 0.5) * this.screenShakeIntensity * decay;
        } else {
            this.screenShakeX = 0;
            this.screenShakeY = 0;
        }
        this.hudAnim += 0.05;
        this.warningPulse += 0.1;
    }

    // Draw HUD
    drawHUD(ctx, player, score, wave, combo, highScore) {
        ctx.save();

        // Top bar background
        const barGrad = ctx.createLinearGradient(0, 0, 0, 85);
        barGrad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
        barGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = barGrad;
        ctx.fillRect(0, 0, this.canvasWidth, 85);

        // Score (left)
        ctx.textAlign = 'left';
        ctx.fillStyle = '#888';
        ctx.font = '10px monospace';
        ctx.fillText('SCORE', 15, 18);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px monospace';
        ctx.fillText(score.toLocaleString(), 15, 38);
        ctx.fillStyle = '#666';
        ctx.font = '10px monospace';
        ctx.fillText(`HI: ${highScore.toLocaleString()}`, 15, 52);

        // Wave (center)
        ctx.textAlign = 'center';
        const isBoss = wave % 5 === 0;
        if (isBoss) {
            ctx.fillStyle = `rgba(255, 0, 0, ${0.5 + Math.sin(this.warningPulse) * 0.3})`;
            ctx.font = 'bold 18px monospace';
            ctx.fillText('⚠ BOSS WAVE ⚠', this.canvasWidth / 2, 28);
        } else {
            ctx.fillStyle = '#ffaa00';
            ctx.font = '10px monospace';
            ctx.fillText('WAVE', this.canvasWidth / 2, 16);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 22px monospace';
            ctx.fillText(wave.toString(), this.canvasWidth / 2, 38);
        }

        // Combo
        if (combo > 1) {
            ctx.fillStyle = '#ff4444';
            ctx.font = 'bold 13px monospace';
            ctx.fillText(`x${combo} COMBO`, this.canvasWidth / 2, 58);
        }

        // Lives & Health (right)
        ctx.textAlign = 'right';

        // Lives hearts
        let livesX = this.canvasWidth - 15;
        ctx.font = 'bold 16px monospace';
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = i < player.lives ? '#ff4444' : '#333';
            ctx.fillText('♥', livesX, 25);
            livesX -= 20;
        }

        // Health bar
        const hbWidth = 100;
        const hbHeight = 8;
        const hbX = this.canvasWidth - hbWidth - 15;
        const hbY = 32;

        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(hbX - 1, hbY - 1, hbWidth + 2, hbHeight + 2);

        const healthPercent = player.health / player.maxHealth;
        ctx.fillStyle = healthPercent > 0.6 ? '#00ff88' : healthPercent > 0.3 ? '#ffaa00' : '#ff4444';
        ctx.fillRect(hbX, hbY, hbWidth * healthPercent, hbHeight);

        // Health segments
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 1;
        for (let i = 1; i < player.maxHealth; i++) {
            const segX = hbX + (hbWidth / player.maxHealth) * i;
            ctx.beginPath();
            ctx.moveTo(segX, hbY);
            ctx.lineTo(segX, hbY + hbHeight);
            ctx.stroke();
        }

        ctx.strokeStyle = '#555';
        ctx.strokeRect(hbX, hbY, hbWidth, hbHeight);

        ctx.fillStyle = '#fff';
        ctx.font = '9px monospace';
        ctx.fillText(`${player.health}/${player.maxHealth}`, this.canvasWidth - 15, hbY + hbHeight + 10);

        // Weapon display (bottom left)
        this._drawWeaponDisplay(ctx, player);

        ctx.restore();
    }

    // Draw weapon level display
    _drawWeaponDisplay(ctx, player) {
        const x = 10;
        const y = this.canvasHeight - 70;

        // Background
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(x, y, 130, 55);
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, 130, 55);

        // Weapon type label
        const isRapid = player.weaponType === 'rapid';
        const typeColor = isRapid ? '#ffaa00' : '#00ffcc';
        const typeName = isRapid ? 'RAPID' : 'SPREAD';

        ctx.fillStyle = typeColor;
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`[${typeName}]`, x + 5, y + 15);

        // Current level indicator
        const currentLevel = player.getCurrentLevel();
        const rapidLevel = player.rapidLevel;
        const spreadLevel = player.spreadLevel;

        // Rapid level bar
        ctx.fillStyle = '#888';
        ctx.font = '9px monospace';
        ctx.fillText('RAPID:', x + 5, y + 30);
        this._drawLevelBar(ctx, x + 50, y + 22, 70, 8, rapidLevel, isRapid ? '#ffaa00' : '#aa8800');

        // Spread level bar
        ctx.fillStyle = '#888';
        ctx.fillText('SPREAD:', x + 5, y + 44);
        this._drawLevelBar(ctx, x + 50, y + 36, 70, 8, spreadLevel, !isRapid ? '#00ffcc' : '#008866');

        // Q to switch hint
        ctx.fillStyle = '#555';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Q: Đổi loại', x + 65, y + 53);
    }

    // Draw level bar (1-4 segments)
    _drawLevelBar(ctx, x, y, width, height, level, color) {
        const segWidth = width / 4;

        for (let i = 0; i < 4; i++) {
            const segX = x + i * segWidth;

            if (i < level) {
                ctx.fillStyle = color;
                ctx.fillRect(segX + 1, y, segWidth - 2, height);

                // Glow on filled segments
                ctx.shadowColor = color;
                ctx.shadowBlur = 5;
                ctx.fillRect(segX + 1, y, segWidth - 2, height);
                ctx.shadowBlur = 0;
            } else {
                ctx.fillStyle = 'rgba(255,255,255,0.1)';
                ctx.fillRect(segX + 1, y, segWidth - 2, height);
            }
        }

        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    // Draw main menu
    drawMenu(ctx, highScore, highWave) {
        ctx.save();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        // Animated border
        const time = Date.now() * 0.002;
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3 + Math.sin(time) * 0.2;
        ctx.strokeRect(20, 20, this.canvasWidth - 40, this.canvasHeight - 40);
        ctx.globalAlpha = 1;

        // Title
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 42px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SPACE AVIAN', this.canvasWidth / 2, 120);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#ff4444';
        ctx.shadowColor = '#ff4444';
        ctx.shadowBlur = 15;
        ctx.font = 'bold 32px monospace';
        ctx.fillText('ASSAULT', this.canvasWidth / 2, 165);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#888';
        ctx.font = '12px monospace';
        ctx.fillText('Chiến đấu chống lại cuộc xâm lược ngoài hành tinh', this.canvasWidth / 2, 195);

        // Divider
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(200, 215);
        ctx.lineTo(600, 215);
        ctx.stroke();

        // Controls
        ctx.font = '12px monospace';
        const controls = [
            ['← → ↑ ↓ / WASD', 'Di chuyển'],
            ['Chuột trái', 'Bắn'],
            ['Q', 'Đổi loại đạn'],
            ['P / ESC', 'Tạm dừng'],
            ['M', 'Tắt/Bật âm thanh']
        ];

        controls.forEach((ctrl, i) => {
            ctx.textAlign = 'right';
            ctx.fillStyle = '#00ffff';
            ctx.fillText(ctrl[0], this.canvasWidth / 2 - 15, 245 + i * 22);
            ctx.textAlign = 'left';
            ctx.fillStyle = '#ccc';
            ctx.fillText(ctrl[1], this.canvasWidth / 2 + 15, 245 + i * 22);
        });

        // Divider
        ctx.beginPath();
        ctx.moveTo(200, 370);
        ctx.lineTo(600, 370);
        ctx.stroke();

        // Gameplay tips
        ctx.fillStyle = '#ffaa00';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('🎁 Nhặt hộp quà để nâng cấp đạn', this.canvasWidth / 2, 395);
        ctx.fillText('💩 Tránh cứt gà nếu không muốn mất mạng + giảm cấp đạn!', this.canvasWidth / 2, 415);
        ctx.fillText('⚡ Giết nhiều quái liên tiếp để tăng combo', this.canvasWidth / 2, 435);

        // High score
        if (highScore > 0) {
            ctx.fillStyle = '#ffaa00';
            ctx.font = 'bold 13px monospace';
            ctx.fillText(`★ Kỷ lục: ${highScore.toLocaleString()} (Wave ${highWave}) ★`, this.canvasWidth / 2, 465);
        }

        // Start prompt
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 16px monospace';
        if (Math.floor(Date.now() / 600) % 2 === 0) {
            ctx.shadowColor = '#00ff00';
            ctx.shadowBlur = 10;
            ctx.fillText('[ CLICK hoặc SPACE để bắt đầu ]', this.canvasWidth / 2, 510);
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    }

    // Draw pause
    drawPause(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        const boxW = 300;
        const boxH = 130;
        const boxX = this.canvasWidth / 2 - boxW / 2;
        const boxY = this.canvasHeight / 2 - boxH / 2;

        ctx.fillStyle = 'rgba(20, 20, 40, 0.95)';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        ctx.fillStyle = '#ffaa00';
        ctx.font = 'bold 28px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('TẠM DỪNG', this.canvasWidth / 2, boxY + 45);

        ctx.fillStyle = '#aaa';
        ctx.font = '13px monospace';
        ctx.fillText('P / ESC để tiếp tục', this.canvasWidth / 2, boxY + 75);
        ctx.fillStyle = '#666';
        ctx.font = '11px monospace';
        ctx.fillText('Q: Đổi loại đạn | M: Tắt/Bật âm thanh', this.canvasWidth / 2, boxY + 100);

        ctx.restore();
    }

    // Draw game over
    drawGameOver(ctx, score, wave, highScore, isNewRecord, stats) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        const boxW = 340;
        const boxH = 320;
        const boxX = this.canvasWidth / 2 - boxW / 2;
        const boxY = this.canvasHeight / 2 - boxH / 2;

        ctx.fillStyle = 'rgba(20, 10, 10, 0.95)';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        ctx.fillStyle = '#ff4444';
        ctx.shadowColor = '#ff4444';
        ctx.shadowBlur = 20;
        ctx.font = 'bold 34px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', this.canvasWidth / 2, boxY + 50);
        ctx.shadowBlur = 0;

        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(boxX + 20, boxY + 65);
        ctx.lineTo(boxX + boxW - 20, boxY + 65);
        ctx.stroke();

        const statsY = boxY + 85;
        ctx.font = '13px monospace';
        ctx.textAlign = 'left';

        const statItems = [
            ['Điểm số', score.toLocaleString(), '#fff'],
            ['Wave', wave.toString(), '#ffaa00'],
            ['Tiêu diệt', `${stats.killed || 0}/${stats.total || 0}`, '#ff8888'],
            ['Combo cao nhất', `x${stats.maxCombo || 0}`, '#ff4444']
        ];

        statItems.forEach((item, i) => {
            ctx.fillStyle = '#888';
            ctx.fillText(item[0], boxX + 30, statsY + i * 26);
            ctx.fillStyle = item[2];
            ctx.textAlign = 'right';
            ctx.fillText(item[1], boxX + boxW - 30, statsY + i * 26);
            ctx.textAlign = 'left';
        });

        if (isNewRecord) {
            ctx.fillStyle = '#ffaa00';
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'center';
            if (Math.floor(Date.now() / 400) % 2 === 0) {
                ctx.fillText('★ KỶ LỤC MỚI! ★', this.canvasWidth / 2, boxY + 220);
            }
        } else {
            ctx.fillStyle = '#666';
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`Kỷ lục: ${highScore.toLocaleString()}`, this.canvasWidth / 2, boxY + 220);
        }

        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        if (Math.floor(Date.now() / 600) % 2 === 0) {
            ctx.fillText('[ CLICK hoặc SPACE để chơi lại ]', this.canvasWidth / 2, boxY + 275);
        }

        ctx.restore();
    }

    // Draw victory
    drawVictory(ctx, score, wave) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        const boxW = 340;
        const boxH = 220;
        const boxX = this.canvasWidth / 2 - boxW / 2;
        const boxY = this.canvasHeight / 2 - boxH / 2;

        ctx.fillStyle = 'rgba(10, 20, 10, 0.95)';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        ctx.fillStyle = '#00ff00';
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 25;
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CHIẾN THẮNG!', this.canvasWidth / 2, boxY + 55);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#ffaa00';
        ctx.font = 'bold 18px monospace';
        ctx.fillText(`Wave ${wave} hoàn thành!`, this.canvasWidth / 2, boxY + 95);

        ctx.fillStyle = '#fff';
        ctx.font = '15px monospace';
        ctx.fillText(`Điểm: ${score.toLocaleString()}`, this.canvasWidth / 2, boxY + 130);

        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 14px monospace';
        if (Math.floor(Date.now() / 600) % 2 === 0) {
            ctx.fillText('[ CLICK hoặc SPACE để chơi lại ]', this.canvasWidth / 2, boxY + 180);
        }

        ctx.restore();
    }

    // Draw wave announcement
    drawWaveAnnouncement(ctx, wave, timer) {
        if (timer <= 0) return;

        ctx.save();
        const alpha = timer > 60 ? 1 : timer / 60;
        ctx.globalAlpha = alpha;

        const isBoss = wave % 5 === 0;

        ctx.fillStyle = isBoss ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, this.canvasHeight / 2 - 35, this.canvasWidth, 70);

        if (isBoss) {
            const pulse = Math.sin(this.warningPulse * 2) * 0.3;
            ctx.fillStyle = `rgba(255, 68, 68, ${0.7 + pulse})`;
            ctx.font = 'bold 28px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('⚠ CẢNH BÁO: BOSS ⚠', this.canvasWidth / 2, this.canvasHeight / 2 + 5);
        } else {
            ctx.fillStyle = '#ffaa00';
            ctx.font = 'bold 26px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`WAVE ${wave}`, this.canvasWidth / 2, this.canvasHeight / 2 + 5);
        }

        ctx.restore();
    }

    // Draw scanlines (optimized - every 4th line)
    drawScanlines(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.015)';
        for (let y = 0; y < this.canvasHeight; y += 4) {
            ctx.fillRect(0, y, this.canvasWidth, 1);
        }
        ctx.restore();
    }

    // Sound indicator
    drawSoundIndicator(ctx, enabled) {
        ctx.save();
        ctx.fillStyle = enabled ? 'rgba(0, 255, 0, 0.4)' : 'rgba(255, 0, 0, 0.4)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(enabled ? '♪ ON' : '♪ OFF', 10, this.canvasHeight - 10);
        ctx.restore();
    }
}
