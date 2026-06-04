/**
 * Pikachu Classic - Save Manager (localStorage)
 */
const SaveManager = (() => {
    const KEY = 'pikachuClassic';

    function getDefaults() {
        return {
            currentLevel: 1,
            score: 0,
            hints: 3,
            shuffles: 3,
            maxUnlockedLevel: 1,
            stats: {
                totalMatches: 0,
                totalGames: 0,
                totalPlayTime: 0,
                highestScore: 0,
                highestCombo: 0,
                levelsCleared: 0
            },
            settings: {
                soundEnabled: true,
                volume: 0.5
            }
        };
    }

    function load() {
        try {
            const raw = localStorage.getItem(KEY);
            if (raw) {
                const data = JSON.parse(raw);
                const defaults = getDefaults();
                // Merge with defaults
                return {
                    ...defaults,
                    ...data,
                    stats: { ...defaults.stats, ...(data.stats || {}) },
                    settings: { ...defaults.settings, ...(data.settings || {}) }
                };
            }
        } catch(e) {}
        return getDefaults();
    }

    function save(data) {
        try {
            localStorage.setItem(KEY, JSON.stringify(data));
        } catch(e) {}
    }

    function clear() {
        try { localStorage.removeItem(KEY); } catch(e) {}
    }

    function updateStats(key, value) {
        const data = load();
        if (typeof data.stats[key] === 'number') {
            if (key === 'highestScore' || key === 'highestCombo' || key === 'levelsCleared') {
                data.stats[key] = Math.max(data.stats[key], value);
            } else {
                data.stats[key] += value;
            }
        }
        save(data);
        return data;
    }

    function unlockLevel(level) {
        const data = load();
        data.maxUnlockedLevel = Math.max(data.maxUnlockedLevel, level);
        save(data);
    }

    function saveGameState(level, score, hints, shuffles) {
        const data = load();
        data.currentLevel = level;
        data.score = score;
        data.hints = hints;
        data.shuffles = shuffles;
        save(data);
    }

    function hasSave() {
        const data = load();
        return data.currentLevel > 1 || data.score > 0;
    }

    return { load, save, clear, updateStats, unlockLevel, saveGameState, hasSave, getDefaults };
})();
