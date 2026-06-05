/**
 * Fruit Ninja Ultimate - UI Manager
 * Menu, HUD, overlays
 */
const UIManager = (() => {
    const W = 600, H = 800;

    // ─── Main Menu ───
    function drawMenu(ctx, bestScores) {
        ctx.fillStyle = 'rgba(0,0,0,0.88)';
        ctx.fillRect(0, 0, W, H);

        ctx.textAlign = 'center';

        // Title
        ctx.fillStyle = '#ff6633';
        ctx.font = 'bold 42px Orbitron, monospace';
        ctx.fillText('FRUIT NINJA', W / 2, H / 2 - 180);

        ctx.fillStyle = '#44ff88';
        ctx.font = 'bold 20px Orbitron, monospace';
        ctx.fillText('ULTIMATE', W / 2, H / 2 - 145);

        // Decorative fruits
        const icons = ['🍎', '🍊', '🍉', '🍌', '🥝', '🍍', '🥭', '🍓', '🐉'];
        ctx.font = '28px sans-serif';
        ctx.fillText(icons.join(' '), W / 2, H / 2 - 100);

        // Menu items
        const items = [
            { text: '⚔️ CLASSIC', id: 'classic' },
            { text: '⏱️ ARCADE', id: 'arcade' },
            { text: '🧘 ZEN', id: 'zen' },
            { text: '🏆 THÀNH TÍCH', id: 'achievements' }
        ];

        const startY = H / 2 - 40;
        const spacing = 50;

        for (let i = 0; i < items.length; i++) {
            const y = startY + i * spacing;

            // Button background
            ctx.fillStyle = 'rgba(255,255,255,0.06)';
            ctx.fillRect(W / 2 - 120, y - 18, 240, 36);
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth = 1;
            ctx.strokeRect(W / 2 - 120, y - 18, 240, 36);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 18px Rajdhani, sans-serif';
            ctx.fillText(items[i].text, W / 2, y + 6);
        }

        // Best scores
        ctx.fillStyle = '#666';
        ctx.font = '12px Rajdhani, sans-serif';
        ctx.fillText(`Classic: ${bestScores.classic || 0}  |  Arcade: ${bestScores.arcade || 0}  |  Zen: ${bestScores.zen || 0}`, W / 2, H - 60);

        ctx.fillStyle = '#555';
        ctx.font = '11px Rajdhani, sans-serif';
        ctx.fillText('Vuốt để chém trái cây! Tránh bom!', W / 2, H - 30);
    }

    function getMenuClickItem(x, y) {
        const items = [
            { id: 'classic' },
            { id: 'arcade' },
            { id: 'zen' },
            { id: 'achievements' }
        ];
        const startY = H / 2 - 40;
        const spacing = 50;
        for (let i = 0; i < items.length; i++) {
            const iy = startY + i * spacing;
            if (x >= W / 2 - 120 && x <= W / 2 + 120 && y >= iy - 18 && y <= iy + 18) {
                return items[i].id;
            }
        }
        return null;
    }

    // ─── HUD ───
    function drawHUD(ctx, score, lives, maxLives, combo, comboTimer, mode, timeLeft) {
        // Score
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 28px Orbitron, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(score.toLocaleString(), 15, 35);

        // Combo
        if (combo > 1 && comboTimer > 0) {
            const alpha = Math.min(1, comboTimer);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#ff6600';
            ctx.font = 'bold 22px Orbitron, monospace';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#ff6600';
            ctx.shadowBlur = 10;
            ctx.fillText('COMBO x' + combo, W / 2, 35);
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        }

        // Lives (Classic mode)
        if (mode === 'classic') {
            Renderer.drawLives(ctx, lives, maxLives, W);
        }

        // Timer (Arcade mode)
        if (mode === 'arcade' && timeLeft !== undefined) {
            ctx.fillStyle = timeLeft <= 10 ? '#ff4444' : '#fff';
            ctx.font = 'bold 20px Orbitron, monospace';
            ctx.textAlign = 'right';
            ctx.fillText(Math.ceil(timeLeft) + 's', W - 15, 35);
        }

        // Pause hint
        ctx.fillStyle = '#444';
        ctx.font = '11px Rajdhani, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('[P] Tạm dừng', W - 15, 55);
    }

    // ─── Level Start ───
    function drawModeStart(ctx, mode) {
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(0, 0, W, H);

        ctx.textAlign = 'center';
        const modeNames = { classic: 'CLASSIC', arcade: 'ARCADE', zen: 'ZEN' };
        const modeDescs = {
            classic: '3 mạng · Có bom · Chơi đến khi thua',
            arcade: '60 giây · Không bom · Power-ups · Điểm cao nhất!',
            zen: 'Không bom · Thư giãn · Chơi thoải mái'
        };

        ctx.fillStyle = '#ff6633';
        ctx.font = 'bold 32px Orbitron, monospace';
        ctx.fillText(modeNames[mode] || 'CLASSIC', W / 2, H / 2 - 40);

        ctx.fillStyle = '#ccc';
        ctx.font = '16px Rajdhani, sans-serif';
        ctx.fillText(modeDescs[mode] || '', W / 2, H / 2 + 10);

        ctx.fillStyle = '#44ff88';
        ctx.font = 'bold 16px Orbitron, monospace';
        if (Math.floor(Date.now() / 500) % 2 === 0) {
            ctx.fillText('[ VUỐT ĐỂ BẮT ĐẦU ]', W / 2, H / 2 + 60);
        }
    }

    // ─── Pause ───
    function drawPaused(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 28px Orbitron, monospace';
        ctx.fillText('TẠM DỪNG', W / 2, H / 2 - 20);
        ctx.fillStyle = '#aaa';
        ctx.font = '14px Rajdhani, sans-serif';
        ctx.fillText('Nhấn ESC hoặc P để tiếp tục', W / 2, H / 2 + 20);
    }

    // ─── Game Over ───
    function drawGameOver(ctx, score, stats, mode) {
        ctx.fillStyle = 'rgba(0,0,0,0.88)';
        ctx.fillRect(0, 0, W, H);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 32px Orbitron, monospace';
        ctx.fillText('GAME OVER', W / 2, H / 2 - 100);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px Orbitron, monospace';
        ctx.fillText(score.toLocaleString(), W / 2, H / 2 - 50);

        ctx.fillStyle = '#aaa';
        ctx.font = '14px Rajdhani, sans-serif';
        ctx.fillText('Trái cây đã chém: ' + (stats.fruitsSliced || 0), W / 2, H / 2 - 15);
        ctx.fillText('Combo cao nhất: x' + (stats.highestCombo || 0), W / 2, H / 2 + 10);
        ctx.fillText('Độ chính xác: ' + (stats.accuracy || 0) + '%', W / 2, H / 2 + 35);

        const best = SaveManager.getBestScore(mode);
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 14px Orbitron, monospace';
        ctx.fillText('Kỷ lục: ' + best.toLocaleString(), W / 2, H / 2 + 65);

        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 16px Orbitron, monospace';
        ctx.fillText('[ VUỐT ĐỂ CHƠI LẠI ]', W / 2, H / 2 + 110);
    }

    // ─── Achievements ───
    function drawAchievements(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.94)';
        ctx.fillRect(0, 0, W, H);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 22px Orbitron, monospace';
        ctx.fillText('THÀNH TÍCH', W / 2, 40);

        const all = AchievementManager.getAll();
        const unlocked = AchievementManager.getUnlocked();

        const cols = 2, itemW = 270, itemH = 44;
        const startX = W / 2 - (cols * itemW + 10) / 2;
        const startY = 65;

        for (let i = 0; i < all.length; i++) {
            const a = all[i];
            const col = i % cols, row = Math.floor(i / cols);
            const x = startX + col * (itemW + 10);
            const y = startY + row * (itemH + 8);
            const done = unlocked.includes(a.id);

            ctx.fillStyle = done ? 'rgba(68,255,136,0.1)' : 'rgba(255,255,255,0.04)';
            ctx.fillRect(x, y, itemW, itemH);
            ctx.strokeStyle = done ? '#44ff88' : '#333';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, itemW, itemH);

            ctx.textAlign = 'left';
            ctx.fillStyle = done ? '#fff' : '#555';
            ctx.font = '13px Rajdhani, sans-serif';
            ctx.fillText(a.icon + ' ' + a.name, x + 10, y + 18);

            ctx.fillStyle = done ? '#aaa' : '#444';
            ctx.font = '10px Rajdhani, sans-serif';
            ctx.fillText(a.desc, x + 10, y + 33);
        }

        ctx.textAlign = 'center';
        ctx.fillStyle = '#888';
        ctx.font = '13px Rajdhani, sans-serif';
        const progress = AchievementManager.getProgress();
        ctx.fillText(`Đã mở khóa: ${progress.unlocked}/${progress.total}  |  Nhấn ESC để quay lại`, W / 2, H - 20);
    }

    return {
        W, H,
        drawMenu, getMenuClickItem, drawHUD, drawModeStart,
        drawPaused, drawGameOver, drawAchievements
    };
})();
