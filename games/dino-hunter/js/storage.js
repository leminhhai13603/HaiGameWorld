/**
 * Dino Hunter - Storage Manager (localStorage)
 */
const Storage = (() => {
    const KEY = 'dinoHunter';

    function _defaults() {
        return {
            bestScore: 0,
            highestDistance: 0,
            lifetimeCoins: 0,
            enemiesDestroyed: 0,
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
    function getHighestDistance() { return _load().highestDistance; }
    function setHighestDistance(v) { const d = _load(); if (v > d.highestDistance) { d.highestDistance = v; _save(d); } }
    function getLifetimeCoins() { return _load().lifetimeCoins; }
    function addLifetimeCoins(v) { const d = _load(); d.lifetimeCoins += v; _save(d); }
    function getEnemiesDestroyed() { return _load().enemiesDestroyed; }
    function addEnemiesDestroyed(v) { const d = _load(); d.enemiesDestroyed += v; _save(d); }
    function addGamePlayed() { const d = _load(); d.gamesPlayed++; _save(d); }
    function hasAchievement(id) { return _load().achievements.includes(id); }
    function unlockAchievement(id) { const d = _load(); if (!d.achievements.includes(id)) { d.achievements.push(id); _save(d); return true; } return false; }
    function getAchievements() { return _load().achievements; }
    function getSettings() { return _load().settings; }
    function saveSettings(s) { const d = _load(); d.settings = s; _save(d); }

    return {
        getBestScore, setBestScore, getHighestDistance, setHighestDistance,
        getLifetimeCoins, addLifetimeCoins, getEnemiesDestroyed, addEnemiesDestroyed,
        addGamePlayed, hasAchievement, unlockAchievement, getAchievements,
        getSettings, saveSettings
    };
})();
