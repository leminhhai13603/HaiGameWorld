/**
 * Zuma Deluxe Remastered - UI Manager
 * Menu screens, HUD, overlays
 */
const UIManager = (() => {
    const W = 800, H = 600;

    // ─── Menu ───
    function drawMenu(ctx, hasSave) {
        ctx.fillStyle = 'rgba(0,0,0,0.88)';
        ctx.fillRect(0, 0, W, H);

        ctx.textAlign = 'center';

        // Title
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 40px Orbitron, monospace';
        ctx.fillText('ZUMA', W / 2, H / 2 - 140);

        ctx.fillStyle = '#44ff88';
        ctx.font = 'bold 18px Orbitron, monospace';
        ctx.fillText('DELUXE REMASTERED', W / 2, H / 2 - 105);

        // Decorative marbles
        const icons = ['🔴', '🔵', '🟢', '🟡', '🟣', '🩵'];
        ctx.font = '24px sans-serif';
        ctx.fillText(icons.join(' '), W / 2, H / 2 - 65);

        // Menu items
        const items = [
            { text: '▶ CHƠI', id: 'play' },
            ...(hasSave ? [{ text: '↻ TIẾP TỤC', id: 'continue' }] : []),
            { text: '📋 CHỌN MÀN', id: 'levelSelect' },
            { text: '🏆 THÀNH TÍCH', id: 'achievements' },
            { text: '⚙ CÀI ĐẶT', id: 'settings' }
        ];

        const startY = H / 2 - 20;
        const spacing = 40;

        for (let i = 0; i < items.length; i++) {
            const y = startY + i * spacing;
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px Rajdhani, sans-serif';
            ctx.fillText(items[i].text, W / 2, y);
        }

        // Controls hint
        ctx.fillStyle = '#666';
        ctx.font = '12px Rajdhani, sans-serif';
        ctx.fillText('Chuột: Ngắm + Bắn | Phím cách: Đổi bi | P: Tạm dừng', W / 2, H - 30);
    }

    function getMenuItems(hasSave) {
        return [
            { text: '▶ CHƠI', id: 'play' },
            ...(hasSave ? [{ text: '↻ TIẾP TỤC', id: 'continue' }] : []),
            { text: '📋 CHỌN MÀN', id: 'levelSelect' },
            { text: '🏆 THÀNH TÍCH', id: 'achievements' },
            { text: '⚙ CÀI ĐẶT', id: 'settings' }
        ];
    }

    function getMenuClickItem(y, hasSave) {
        const items = getMenuItems(hasSave);
        const startY = H / 2 - 20;
        const spacing = 40;
        for (let i = 0; i < items.length; i++) {
            if (Math.abs(y - (startY + i * spacing)) < 16) return items[i].id;
        }
        return null;
    }

    // ─── Level Select ───
    function drawLevelSelect(ctx, highestLevel) {
        ctx.fillStyle = 'rgba(0,0,0,0.92)';
        ctx.fillRect(0, 0, W, H);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 24px Orbitron, monospace';
        ctx.fillText('CHỌN MÀN', W / 2, 45);

        const cols = 5, cellSize = 60, gap = 12;
        const startX = W / 2 - (cols * (cellSize + gap) - gap) / 2;
        const startY = 75;

        for (let i = 0; i < 20; i++) {
            const col = i % cols, row = Math.floor(i / cols);
            const x = startX + col * (cellSize + gap);
            const y = startY + row * (cellSize + gap);
            const unlocked = (i + 1) <= highestLevel;
            const isBoss = [5, 10, 15, 20].includes(i + 1);
            const levelDef = LevelManager.getLevel(i);

            ctx.fillStyle = unlocked ? (isBoss ? '#4a1a1a' : '#1a3a1a') : '#1a1a1a';
            ctx.fillRect(x, y, cellSize, cellSize);
            ctx.strokeStyle = unlocked ? (isBoss ? '#ff4444' : '#44ff88') : '#333';
            ctx.lineWidth = isBoss ? 2 : 1;
            ctx.strokeRect(x, y, cellSize, cellSize);

            ctx.fillStyle = unlocked ? '#fff' : '#444';
            ctx.font = 'bold 20px Orbitron, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(i + 1), x + cellSize / 2, y + cellSize / 2 - 6);

            if (isBoss && unlocked) {
                ctx.fillStyle = '#ff6644';
                ctx.font = '10px Rajdhani, sans-serif';
                ctx.fillText('BOSS', x + cellSize / 2, y + cellSize / 2 + 14);
            }
        }

        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#888';
        ctx.font = '13px Rajdhani, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Nhấn ESC để quay lại', W / 2, H - 20);
    }

    function getLevelSelectClick(x, y, highestLevel) {
        const cols = 5, cellSize = 60, gap = 12;
        const startX = W / 2 - (cols * (cellSize + gap) - gap) / 2;
        const startY = 75;
        for (let i = 0; i < 20; i++) {
            const col = i % cols, row = Math.floor(i / cols);
            const bx = startX + col * (cellSize + gap);
            const by = startY + row * (cellSize + gap);
            if (x >= bx && x <= bx + cellSize && y >= by && y <= by + cellSize) {
                if ((i + 1) <= highestLevel) return i + 1;
            }
        }
        return null;
    }

    // ─── HUD ───
    function drawHUD(ctx, score, level, combo, comboTimer, freezeTimer, marblesLeft, theme) {
        // Top bar
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(0, 0, W, 48);

        // Level
        ctx.fillStyle = theme.accent;
        ctx.font = 'bold 14px Orbitron, monospace';
        ctx.textAlign = 'left';
        ctx.fillText('Màn ' + level, 12, 18);

        // Score
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px Rajdhani, sans-serif';
        ctx.fillText('Điểm: ' + score.toLocaleString(), 12, 38);

        // Marbles left
        ctx.fillStyle = '#aaa';
        ctx.font = '12px Rajdhani, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Bi còn lại: ' + marblesLeft, W / 2, 18);

        // Combo
        if (combo > 1 && comboTimer > 0) {
            const alpha = Math.min(1, comboTimer);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#ff6600';
            ctx.font = 'bold 20px Orbitron, monospace';
            ctx.shadowColor = '#ff6600';
            ctx.shadowBlur = 10;
            ctx.fillText('COMBO x' + combo, W / 2, 40);
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        }

        // Freeze indicator
        if (freezeTimer > 0) {
            ctx.fillStyle = '#00ccff';
            ctx.font = 'bold 12px Rajdhani, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('❄️ ĐÓNG BĂNG ' + Math.ceil(freezeTimer) + 's', W - 12, 38);
        }

        // Pause hint
        ctx.fillStyle = '#555';
        ctx.font = '11px Rajdhani, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('[P] Tạm dừng', W - 12, 18);
    }

    // ─── Level Start Overlay ───
    function drawLevelStart(ctx, level, desc, theme) {
        ctx.fillStyle = 'rgba(0,0,0,0.78)';
        ctx.fillRect(0, 0, W, H);

        ctx.textAlign = 'center';
        ctx.fillStyle = theme.accent;
        ctx.font = 'bold 30px Orbitron, monospace';
        ctx.fillText('MÀN ' + level, W / 2, H / 2 - 50);

        const isBoss = LevelManager.getLevel(level - 1).boss;
        if (isBoss) {
            ctx.fillStyle = '#ff4444';
            ctx.font = 'bold 16px Orbitron, monospace';
            ctx.fillText('⚡ BOSS LEVEL ⚡', W / 2, H / 2 - 15);
        }

        ctx.fillStyle = '#ccc';
        ctx.font = '16px Rajdhani, sans-serif';
        ctx.fillText(desc, W / 2, H / 2 + 15);

        ctx.fillStyle = '#44ff88';
        ctx.font = 'bold 14px Orbitron, monospace';
        if (Math.floor(Date.now() / 500) % 2 === 0) {
            ctx.fillText('[ NHẤP ĐỂ BẮT ĐẦU ]', W / 2, H / 2 + 60);
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

    // ─── Level Complete ───
    function drawLevelComplete(ctx, score, stars, theme) {
        ctx.fillStyle = 'rgba(0,0,0,0.82)';
        ctx.fillRect(0, 0, W, H);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#44ff88';
        ctx.font = 'bold 30px Orbitron, monospace';
        ctx.fillText('HOÀN THÀNH!', W / 2, H / 2 - 70);

        // Stars
        ctx.font = '36px sans-serif';
        const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
        ctx.fillText(starStr, W / 2, H / 2 - 20);

        ctx.fillStyle = theme.accent;
        ctx.font = 'bold 18px Orbitron, monospace';
        ctx.fillText('Điểm: ' + score.toLocaleString(), W / 2, H / 2 + 20);

        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 14px Orbitron, monospace';
        ctx.fillText('[ NHẤP ĐỂ TIẾP TỤC ]', W / 2, H / 2 + 70);
    }

    // ─── Game Over ───
    function drawGameOver(ctx, score, level) {
        ctx.fillStyle = 'rgba(0,0,0,0.88)';
        ctx.fillRect(0, 0, W, H);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 30px Orbitron, monospace';
        ctx.fillText('THUA RỒI!', W / 2, H / 2 - 60);

        ctx.fillStyle = '#fff';
        ctx.font = '16px Rajdhani, sans-serif';
        ctx.fillText('Điểm: ' + score.toLocaleString(), W / 2, H / 2 - 10);
        ctx.fillText('Màn: ' + level, W / 2, H / 2 + 15);

        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 14px Orbitron, monospace';
        ctx.fillText('[ NHẤP ĐỂ CHƠI LẠI ]', W / 2, H / 2 + 60);
    }

    // ─── Achievements Screen ───
    function drawAchievements(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.94)';
        ctx.fillRect(0, 0, W, H);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 22px Orbitron, monospace';
        ctx.fillText('THÀNH TÍCH', W / 2, 40);

        const all = AchievementManager.getAll();
        const unlocked = AchievementManager.getUnlocked();

        const cols = 2, itemW = 360, itemH = 44;
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
            ctx.font = '14px Rajdhani, sans-serif';
            ctx.fillText(a.icon + ' ' + a.name, x + 10, y + 18);

            ctx.fillStyle = done ? '#aaa' : '#444';
            ctx.font = '11px Rajdhani, sans-serif';
            ctx.fillText(a.desc, x + 10, y + 34);
        }

        ctx.textAlign = 'center';
        ctx.fillStyle = '#888';
        ctx.font = '13px Rajdhani, sans-serif';
        const progress = AchievementManager.getProgress();
        ctx.fillText(`Đã mở khóa: ${progress.unlocked}/${progress.total}  |  Nhấn ESC để quay lại`, W / 2, H - 20);
    }

    // ─── Settings Screen ───
    function drawSettings(ctx, soundEnabled, volume) {
        ctx.fillStyle = 'rgba(0,0,0,0.94)';
        ctx.fillRect(0, 0, W, H);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 22px Orbitron, monospace';
        ctx.fillText('CÀI ĐẶT', W / 2, 60);

        ctx.fillStyle = '#fff';
        ctx.font = '16px Rajdhani, sans-serif';
        ctx.fillText('Âm thanh: ' + (soundEnabled ? 'BẬT' : 'TẮT') + '  [S]', W / 2, 120);
        ctx.fillText('Âm lượng: ' + Math.round(volume * 100) + '%  [←/→]', W / 2, 155);

        ctx.fillStyle = '#aaa';
        ctx.font = '13px Rajdhani, sans-serif';
        ctx.fillText('Nhấn ESC để quay lại', W / 2, H - 20);
    }

    return {
        W, H,
        drawMenu, getMenuClickItem, getMenuItems,
        drawLevelSelect, getLevelSelectClick,
        drawHUD, drawLevelStart, drawPaused,
        drawLevelComplete, drawGameOver,
        drawAchievements, drawSettings
    };
})();
