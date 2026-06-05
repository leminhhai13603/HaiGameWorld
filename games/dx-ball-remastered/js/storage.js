/**
 * DX-Ball Remastered - Storage Manager (localStorage)
 */
const Storage = (() => {
    const KEY = 'dxBallRemastered';

    function _defaults() {
        return {
            bestScore: 0,
            highestLevel: 0,
            bricksDestroyed: 0,
            gamesPlayed: 0,
            achievements: [],
            settings: { sound: true, volume: 0.4 }
        };
    }

    function _load() {
        try {
            const raw = localStorage.getItem(KEY);
            if (raw) { const d = JSON.parse(raw); return { ..._defaults(), ...d, achievements: d.achievements || [], settings: { ..._defaults().settings, ...(d.settings || {}) } }; }
        } catch (e) {}
        return _defaults();
    }

    function _save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }

    function getBestScore() { return _load().bestScore; }
    function setBestScore(v) { const d = _load(); if (v > d.bestScore) { d.bestScore = v; _save(d); return true; } return false; }
    function getHighestLevel() { return _load().highestLevel; }
    function setHighestLevel(v) { const d = _load(); if (v > d.highestLevel) { d.highestLevel = v; _save(d); } }
    function getBricksDestroyed() { return _load().bricksDestroyed; }
    function addBricksDestroyed(v) { const d = _load(); d.bricksDestroyed += v; _save(d); }
    function addGamePlayed() { const d = _load(); d.gamesPlayed++; _save(d); }
    function hasAchievement(id) { return _load().achievements.includes(id); }
    function unlockAchievement(id) { const d = _load(); if (!d.achievements.includes(id)) { d.achievements.push(id); _save(d); return true; } return false; }
    function getAchievements() { return _load().achievements; }

    return {
        getBestScore, setBestScore, getHighestLevel, setHighestLevel,
        getBricksDestroyed, addBricksDestroyed, addGamePlayed,
        hasAchievement, unlockAchievement, getAchievements
    };
})();
