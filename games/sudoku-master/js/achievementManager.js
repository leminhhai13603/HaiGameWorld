/**
 * Sudoku Master - Achievement Manager
 */
const AchievementManager = (() => {
    const DEFS = [
        { id: 'first_complete', name: 'First Win', desc: 'Hoàn thành Sudoku đầu tiên', icon: '🎯' },
        { id: 'games_10', name: 'Regular Player', desc: 'Hoàn thành 10 ván', icon: '🎮' },
        { id: 'games_100', name: 'Sudoku Addict', desc: 'Hoàn thành 100 ván', icon: '🏆' },
        { id: 'easy_master', name: 'Easy Master', desc: 'Hoàn thành 10 ván Easy', icon: '⭐' },
        { id: 'medium_master', name: 'Medium Master', desc: 'Hoàn thành 10 ván Medium', icon: '🌟' },
        { id: 'hard_master', name: 'Hard Master', desc: 'Hoàn thành 10 ván Hard', icon: '💫' },
        { id: 'expert_master', name: 'Expert Master', desc: 'Hoàn thành 10 ván Expert', icon: '🔥' },
        { id: 'evil_master', name: 'Evil Master', desc: 'Hoàn thành 10 ván Evil', icon: '💀' },
        { id: 'no_hint', name: 'No Hint Victory', desc: 'Hoàn thành không dùng gợi ý', icon: '🧠' },
        { id: 'perfect', name: 'Perfect Game', desc: 'Hoàn thành Hard+ không gợi ý', icon: '👑' }
    ];

    let _toastQueue = [];
    let _toastTimer = 0;
    let _currentToast = null;

    function getAll() { return DEFS; }
    function getUnlocked() { return SaveManager.load().achievements || []; }
    function isUnlocked(id) { return getUnlocked().includes(id); }

    function tryUnlock(id) {
        if (SaveManager.unlockAchievement(id)) {
            const def = DEFS.find(d => d.id === id);
            if (def) { _toastQueue.push(def); AudioManager.play('achievement'); }
            return true;
        }
        return false;
    }

    function checkAll(stats) {
        if (stats.gamesCompleted >= 1) tryUnlock('first_complete');
        if (stats.gamesCompleted >= 10) tryUnlock('games_10');
        if (stats.gamesCompleted >= 100) tryUnlock('games_100');
        if ((stats.easyCompleted || 0) >= 10) tryUnlock('easy_master');
        if ((stats.mediumCompleted || 0) >= 10) tryUnlock('medium_master');
        if ((stats.hardCompleted || 0) >= 10) tryUnlock('hard_master');
        if ((stats.expertCompleted || 0) >= 10) tryUnlock('expert_master');
        if ((stats.evilCompleted || 0) >= 10) tryUnlock('evil_master');
    }

    function update(dt) {
        if (_currentToast) { _toastTimer -= dt; if (_toastTimer <= 0) _currentToast = null; }
        if (!_currentToast && _toastQueue.length > 0) { _currentToast = _toastQueue.shift(); _toastTimer = 3; }
    }

    function drawToast(ctx, W) {
        if (!_currentToast) return;
        const alpha = _toastTimer > 2.5 ? (3 - _toastTimer) * 2 : _toastTimer > 0.5 ? 1 : _toastTimer * 2;
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        const y = 50;
        const text = _currentToast.icon + ' ' + _currentToast.name;
        ctx.font = 'bold 14px Orbitron, monospace';
        const tw = ctx.measureText(text).width;
        const bw = tw + 24;
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth = 2;
        const bx = W / 2 - bw / 2;
        ctx.beginPath();
        ctx.rect(bx, y - 14, bw, 32);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffcc00';
        ctx.textAlign = 'center';
        ctx.fillText(text, W / 2, y + 2);
        ctx.globalAlpha = 1;
    }

    function getProgress() { return { unlocked: getUnlocked().length, total: DEFS.length }; }

    return { getAll, getUnlocked, isUnlocked, tryUnlock, checkAll, update, drawToast, getProgress };
})();
