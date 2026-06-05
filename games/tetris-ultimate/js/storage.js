/**
 * Tetris Ultimate - Storage Manager
 */
const Storage = (() => {
    const KEY = 'tetrisUltimate';

    function _defaults() {
        return {
            bestScore: 0,
            highestLevel: 0,
            totalLines: 0,
            gamesPlayed: 0,
            achievements: [],
            theme: 'classic',
            soundEnabled: true
        };
    }

    function _load() {
        try {
            const raw = localStorage.getItem(KEY);
            if (raw) return { ..._defaults(), ...JSON.parse(raw) };
        } catch (e) {}
        return _defaults();
    }

    function _save(data) {
        try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
    }

    function getBestScore() { return _load().bestScore; }
    function setBestScore(v) {
        const d = _load();
        if (v > d.bestScore) { d.bestScore = v; _save(d); return true; }
        return false;
    }

    function getHighestLevel() { return _load().highestLevel; }
    function setHighestLevel(v) {
        const d = _load();
        if (v > d.highestLevel) { d.highestLevel = v; _save(d); }
    }

    function getTotalLines() { return _load().totalLines; }
    function addLines(n) {
        const d = _load();
        d.totalLines += n;
        _save(d);
    }

    function getGamesPlayed() { return _load().gamesPlayed; }
    function addGamePlayed() {
        const d = _load();
        d.gamesPlayed++;
        _save(d);
    }

    function getAchievements() { return _load().achievements || []; }
    function unlockAchievement(id) {
        const d = _load();
        if (!d.achievements) d.achievements = [];
        if (d.achievements.includes(id)) return false;
        d.achievements.push(id);
        _save(d);
        return true;
    }

    function getTheme() { return _load().theme || 'classic'; }
    function setTheme(t) {
        const d = _load();
        d.theme = t;
        _save(d);
    }

    function getSoundEnabled() { return _load().soundEnabled !== false; }
    function setSoundEnabled(v) {
        const d = _load();
        d.soundEnabled = v;
        _save(d);
    }

    return {
        getBestScore, setBestScore,
        getHighestLevel, setHighestLevel,
        getTotalLines, addLines,
        getGamesPlayed, addGamePlayed,
        getAchievements, unlockAchievement,
        getTheme, setTheme,
        getSoundEnabled, setSoundEnabled
    };
})();
