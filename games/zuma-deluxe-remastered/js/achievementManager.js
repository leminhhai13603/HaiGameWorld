/**
 * Zuma Deluxe Remastered - Achievement Manager
 */
const AchievementManager = (() => {
    const DEFS = [
        { id: 'first_match', name: 'First Match', desc: 'Tạo trận ghép đầu tiên', icon: '🎯' },
        { id: 'marbles_100', name: 'Marble Crusher', desc: 'Phá hủy 100 viên bi', icon: '💥' },
        { id: 'marbles_1000', name: 'Marble Annihilator', desc: 'Phá hủy 1000 viên bi', icon: '🔥' },
        { id: 'first_combo', name: 'Chain Starter', desc: 'Tạo chuỗi phản ứng đầu tiên', icon: '⚡' },
        { id: 'combo_10', name: 'Combo Master', desc: 'Đạt combo x10', icon: '🌟' },
        { id: 'level_10', name: 'Temple Explorer', desc: 'Đạt màn 10', icon: '🏛️' },
        { id: 'level_20', name: 'Zuma Veteran', desc: 'Đạt màn 20', icon: '🏆' },
        { id: 'score_100k', name: 'Score Hunter', desc: 'Đạt 100,000 điểm', icon: '💰' },
        { id: 'score_500k', name: 'Score Legend', desc: 'Đạt 500,000 điểm', icon: '👑' },
        { id: 'zuma_master', name: 'Zuma Master', desc: 'Hoàn thành tất cả 20 màn', icon: '🎮' },
        { id: 'match_5', name: 'Big Match', desc: 'Ghép 5+ viên bi cùng lúc', icon: '✨' },
        { id: 'no_miss', name: 'Sharpshooter', desc: 'Hoàn thành màn không bắn trượt', icon: '🏹' }
    ];

    let _toastQueue = [];
    let _toastTimer = 0;
    let _currentToast = null;

    function getAll() { return DEFS; }

    function getUnlocked() {
        return SaveManager.load().achievements || [];
    }

    function isUnlocked(id) {
        return getUnlocked().includes(id);
    }

    function tryUnlock(id) {
        if (SaveManager.unlockAchievement(id)) {
            const def = DEFS.find(d => d.id === id);
            if (def) {
                _toastQueue.push(def);
                AudioManager.play('achievement');
            }
            return true;
        }
        return false;
    }

    function checkAll(stats) {
        if (stats.totalMatches > 0) tryUnlock('first_match');
        if (stats.totalMarblesDestroyed >= 100) tryUnlock('marbles_100');
        if (stats.totalMarblesDestroyed >= 1000) tryUnlock('marbles_1000');
        if (stats.totalChainReactions > 0) tryUnlock('first_combo');
        if (stats.bestCombo >= 10) tryUnlock('combo_10');
        if (stats.highestLevel >= 10) tryUnlock('level_10');
        if (stats.highestLevel >= 20) tryUnlock('level_20');
        if (stats.bestScore >= 100000) tryUnlock('score_100k');
        if (stats.bestScore >= 500000) tryUnlock('score_500k');
        if (stats.highestLevel > 20) tryUnlock('zuma_master');
    }

    function update(dt) {
        if (_currentToast) {
            _toastTimer -= dt;
            if (_toastTimer <= 0) _currentToast = null;
        }
        if (!_currentToast && _toastQueue.length > 0) {
            _currentToast = _toastQueue.shift();
            _toastTimer = 3.0;
        }
    }

    function drawToast(ctx, canvasW) {
        if (!_currentToast) return;
        const alpha = _toastTimer > 2.5 ? (3.0 - _toastTimer) * 2 : _toastTimer > 0.5 ? 1 : _toastTimer * 2;
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

        const y = 80;
        const text = _currentToast.icon + ' ' + _currentToast.name;
        ctx.font = 'bold 16px Orbitron, monospace';
        const tw = ctx.measureText(text).width;
        const bw = tw + 30;

        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth = 2;
        const bx = canvasW / 2 - bw / 2;
        ctx.beginPath();
        const r = 8;
        const rx = bx, ry = y - 16, rw = bw, rh = 36;
        ctx.moveTo(rx + r, ry);
        ctx.lineTo(rx + rw - r, ry);
        ctx.arcTo(rx + rw, ry, rx + rw, ry + r, r);
        ctx.lineTo(rx + rw, ry + rh - r);
        ctx.arcTo(rx + rw, ry + rh, rx + rw - r, ry + rh, r);
        ctx.lineTo(rx + r, ry + rh);
        ctx.arcTo(rx, ry + rh, rx, ry + rh - r, r);
        ctx.lineTo(rx, ry + r);
        ctx.arcTo(rx, ry, rx + r, ry, r);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffcc00';
        ctx.textAlign = 'center';
        ctx.fillText(text, canvasW / 2, y + 5);

        ctx.fillStyle = '#aaa';
        ctx.font = '11px Rajdhani, sans-serif';
        ctx.fillText(_currentToast.desc, canvasW / 2, y + 22);

        ctx.globalAlpha = 1;
    }

    function getProgress() {
        return { unlocked: getUnlocked().length, total: DEFS.length };
    }

    return { getAll, getUnlocked, isUnlocked, tryUnlock, checkAll, update, drawToast, getProgress };
})();
