/**
 * Fruit Ninja Ultimate - Achievement Manager
 */
const AchievementManager = (() => {
    const DEFS = [
        { id: 'first_slice', name: 'First Slice', desc: 'Chém trái cây đầu tiên', icon: '🔪' },
        { id: 'fruits_100', name: 'Fruit Cutter', desc: 'Chém 100 trái cây', icon: '🍎' },
        { id: 'fruits_1000', name: 'Fruit Master', desc: 'Chém 1000 trái cây', icon: '🏆' },
        { id: 'combo_5', name: 'Combo Starter', desc: 'Đạt combo x5', icon: '⚡' },
        { id: 'combo_10', name: 'Combo Legend', desc: 'Đạt combo x10', icon: '🌟' },
        { id: 'score_10k', name: 'Score Hunter', desc: 'Đạt 10,000 điểm', icon: '💰' },
        { id: 'score_50k', name: 'Score Master', desc: 'Đạt 50,000 điểm', icon: '💎' },
        { id: 'score_100k', name: 'Score Legend', desc: 'Đạt 100,000 điểm', icon: '👑' },
        { id: 'fruit_master', name: 'Fruit Ninja', desc: 'Hoàn thành mọi loại trái cây', icon: '🎯' },
        { id: 'ninja_legend', name: 'Ninja Legend', desc: 'Đạt 50,000 điểm ở Classic', icon: '🥷' }
    ];

    let _toastQueue = [];
    let _toastTimer = 0;
    let _currentToast = null;
    let _slicedTypes = new Set();

    function getAll() { return DEFS; }
    function getUnlocked() { return SaveManager.load().achievements || []; }
    function isUnlocked(id) { return getUnlocked().includes(id); }

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

    function trackFruitSlice(fruitName) {
        _slicedTypes.add(fruitName);
    }

    function checkAll(stats) {
        if (stats.totalFruitsSliced >= 1) tryUnlock('first_slice');
        if (stats.totalFruitsSliced >= 100) tryUnlock('fruits_100');
        if (stats.totalFruitsSliced >= 1000) tryUnlock('fruits_1000');
        if (stats.highestCombo >= 5) tryUnlock('combo_5');
        if (stats.highestCombo >= 10) tryUnlock('combo_10');

        const best = Math.max(stats.bestScoreClassic || 0, stats.bestScoreArcade || 0, stats.bestScoreZen || 0);
        if (best >= 10000) tryUnlock('score_10k');
        if (best >= 50000) tryUnlock('score_50k');
        if (best >= 100000) tryUnlock('score_100k');

        // Fruit master: all 9 types sliced
        if (_slicedTypes.size >= 9) tryUnlock('fruit_master');

        // Ninja legend: 50k in classic
        if ((stats.bestScoreClassic || 0) >= 50000) tryUnlock('ninja_legend');
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

        const y = 60;
        const text = _currentToast.icon + ' ' + _currentToast.name;
        ctx.font = 'bold 16px Orbitron, monospace';
        const tw = ctx.measureText(text).width;
        const bw = tw + 30;

        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth = 2;
        const bx = canvasW / 2 - bw / 2;
        // Rounded rect
        const r = 8;
        ctx.beginPath();
        ctx.moveTo(bx + r, y - 16);
        ctx.lineTo(bx + bw - r, y - 16);
        ctx.arcTo(bx + bw, y - 16, bx + bw, y - 16 + r, r);
        ctx.lineTo(bx + bw, y + 20 - r);
        ctx.arcTo(bx + bw, y + 20, bx + bw - r, y + 20, r);
        ctx.lineTo(bx + r, y + 20);
        ctx.arcTo(bx, y + 20, bx, y + 20 - r, r);
        ctx.lineTo(bx, y - 16 + r);
        ctx.arcTo(bx, y - 16, bx + r, y - 16, r);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffcc00';
        ctx.textAlign = 'center';
        ctx.fillText(text, canvasW / 2, y + 2);

        ctx.fillStyle = '#aaa';
        ctx.font = '11px Rajdhani, sans-serif';
        ctx.fillText(_currentToast.desc, canvasW / 2, y + 18);

        ctx.globalAlpha = 1;
    }

    function getProgress() {
        return { unlocked: getUnlocked().length, total: DEFS.length };
    }

    function clearTracking() {
        _slicedTypes.clear();
    }

    return {
        getAll, getUnlocked, isUnlocked, tryUnlock, trackFruitSlice,
        checkAll, update, drawToast, getProgress, clearTracking
    };
})();
