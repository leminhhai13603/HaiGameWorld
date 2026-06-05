/**
 * 2048 - Storage Manager (localStorage)
 */
const Storage = (() => {
    const KEY = 'game2048';

    function _defaults() {
        return {
            bestScore: 0,
            largestTile: 0,
            gamesPlayed: 0,
            totalMoves: 0,
            achievements: []
        };
    }

    function _load() {
        try {
            const raw = localStorage.getItem(KEY);
            if (raw) {
                const d = JSON.parse(raw);
                return { ..._defaults(), ...d, achievements: d.achievements || [] };
            }
        } catch (e) {}
        return _defaults();
    }

    function _save(data) {
        try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
    }

    function getBestScore() { return _load().bestScore || 0; }

    function setBestScore(score) {
        const d = _load();
        if (score > (d.bestScore || 0)) {
            d.bestScore = score;
            _save(d);
            return true;
        }
        return false;
    }

    function getLargestTile() { return _load().largestTile || 0; }

    function setLargestTile(tile) {
        const d = _load();
        if (tile > (d.largestTile || 0)) {
            d.largestTile = tile;
            _save(d);
        }
    }

    function addGamePlayed() {
        const d = _load();
        d.gamesPlayed = (d.gamesPlayed || 0) + 1;
        _save(d);
    }

    function addMoves(count) {
        const d = _load();
        d.totalMoves = (d.totalMoves || 0) + count;
        _save(d);
    }

    function getGamesPlayed() { return _load().gamesPlayed || 0; }
    function getTotalMoves() { return _load().totalMoves || 0; }

    function hasAchievement(id) {
        return _load().achievements.includes(id);
    }

    function unlockAchievement(id) {
        const d = _load();
        if (!d.achievements.includes(id)) {
            d.achievements.push(id);
            _save(d);
            return true;
        }
        return false;
    }

    function getAchievements() { return _load().achievements || []; }

    return {
        getBestScore, setBestScore,
        getLargestTile, setLargestTile,
        addGamePlayed, addMoves,
        getGamesPlayed, getTotalMoves,
        hasAchievement, unlockAchievement, getAchievements
    };
})();
