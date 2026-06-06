/**
 * Sudoku Master - Save Manager (localStorage)
 */
const SaveManager = (() => {
    const KEY = 'sudokuMaster';

    function getDefaults() {
        return {
            // Current game (auto-save)
            currentGame: null,
            // Statistics
            stats: {
                gamesPlayed: 0, gamesCompleted: 0,
                easyPlayed: 0, easyCompleted: 0,
                mediumPlayed: 0, mediumCompleted: 0,
                hardPlayed: 0, hardCompleted: 0,
                expertPlayed: 0, expertCompleted: 0,
                evilPlayed: 0, evilCompleted: 0,
                bestTimeEasy: 0, bestTimeMedium: 0, bestTimeHard: 0,
                bestTimeExpert: 0, bestTimeEvil: 0,
                totalTime: 0, hintsUsed: 0, currentStreak: 0, longestStreak: 0
            },
            // Achievements
            achievements: [],
            // Settings
            settings: { soundEnabled: true, volume: 0.5, theme: 'dark', mistakeMode: 'relaxed' }
        };
    }

    function load() {
        try {
            const raw = localStorage.getItem(KEY);
            if (raw) {
                const data = JSON.parse(raw);
                const d = getDefaults();
                return {
                    ...d, ...data,
                    stats: { ...d.stats, ...(data.stats || {}) },
                    settings: { ...d.settings, ...(data.settings || {}) }
                };
            }
        } catch (e) {}
        return getDefaults();
    }

    function save(data) {
        try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
    }

    function saveCurrentGame(state) {
        const d = load();
        d.currentGame = state;
        save(d);
    }

    function clearCurrentGame() {
        const d = load();
        d.currentGame = null;
        save(d);
    }

    function getCurrentGame() {
        return load().currentGame;
    }

    function updateStats(difficulty, time, hintsUsed, completed) {
        const d = load();
        d.stats.gamesPlayed++;
        d.stats[difficulty + 'Played'] = (d.stats[difficulty + 'Played'] || 0) + 1;
        if (completed) {
            d.stats.gamesCompleted++;
            d.stats[difficulty + 'Completed'] = (d.stats[difficulty + 'Completed'] || 0) + 1;
            d.stats.totalTime += time;
            d.stats.hintsUsed += hintsUsed;
            d.stats.currentStreak++;
            if (d.stats.currentStreak > d.stats.longestStreak) d.stats.longestStreak = d.stats.currentStreak;
            const bestKey = 'bestTime' + difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
            if (!d.stats[bestKey] || time < d.stats[bestKey]) d.stats[bestKey] = time;
        } else {
            d.stats.currentStreak = 0;
        }
        save(d);
    }

    function unlockAchievement(id) {
        const d = load();
        if (!d.achievements.includes(id)) {
            d.achievements.push(id);
            save(d);
            return true;
        }
        return false;
    }

    function updateSettings(s) {
        const d = load();
        Object.assign(d.settings, s);
        save(d);
    }

    return {
        load, save, saveCurrentGame, clearCurrentGame, getCurrentGame,
        updateStats, unlockAchievement, updateSettings
    };
})();
