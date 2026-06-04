/**
 * Battle City - Save Manager
 */
const SaveManager = (() => {
    const KEY = 'battleCity';

    function defaults() {
        return {
            currentLevel: 1, lives: 3, score: 0, highScore: 0,
            stats: { enemiesDestroyed: 0, shotsFired: 0, shotsHit: 0, levelsCleared: 0, deaths: 0, powerupsCollected: 0, totalScore: 0, playTime: 0, highestLevel: 1 },
            settings: { sfxVol: 0.4, musicVol: 0.3, difficulty: 1, fullscreen: false },
            customMaps: []
        };
    }

    function load() {
        try {
            const raw = localStorage.getItem(KEY);
            if (raw) {
                const d = JSON.parse(raw);
                const def = defaults();
                return { ...def, ...d, stats: { ...def.stats, ...(d.stats || {}) }, settings: { ...def.settings, ...(d.settings || {}) } };
            }
        } catch(e) {}
        return defaults();
    }

    function save(data) {
        try { localStorage.setItem(KEY, JSON.stringify(data)); } catch(e) {}
    }

    function updateStats(key, val) {
        const d = load();
        if (typeof d.stats[key] === 'number') {
            if (['highestLevel', 'highScore'].includes(key)) d.stats[key] = Math.max(d.stats[key], val);
            else d.stats[key] += val;
        }
        save(d);
    }

    function saveGame(level, lives, score) {
        const d = load();
        d.currentLevel = level; d.lives = lives; d.score = score;
        save(d);
    }

    function clear() { try { localStorage.removeItem(KEY); } catch(e) {} }

    return { load, save, updateStats, saveGame, clear, defaults };
})();
