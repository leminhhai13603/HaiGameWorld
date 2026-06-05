/**
 * Fruit Ninja Ultimate - Save Manager (localStorage)
 */
const SaveManager = (() => {
    const KEY = 'fruitNinjaUltimate';

    function getDefaults() {
        return {
            bestScoreClassic: 0,
            bestScoreArcade: 0,
            bestScoreZen: 0,
            gamesPlayed: 0,
            totalFruitsSliced: 0,
            highestCombo: 0,
            achievements: [],
            settings: { soundEnabled: true, volume: 0.5 }
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
                    settings: { ...d.settings, ...(data.settings || {}) }
                };
            }
        } catch (e) {}
        return getDefaults();
    }

    function save(data) {
        try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
    }

    function updateBestScore(mode, score) {
        const d = load();
        const key = 'bestScore' + mode.charAt(0).toUpperCase() + mode.slice(1);
        if (score > (d[key] || 0)) {
            d[key] = score;
            save(d);
        }
    }

    function addGamePlayed() {
        const d = load();
        d.gamesPlayed++;
        save(d);
    }

    function addFruitsSliced(count) {
        const d = load();
        d.totalFruitsSliced += count;
        save(d);
    }

    function updateHighestCombo(combo) {
        const d = load();
        if (combo > d.highestCombo) {
            d.highestCombo = combo;
            save(d);
        }
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

    function updateSettings(settings) {
        const d = load();
        Object.assign(d.settings, settings);
        save(d);
    }

    function getBestScore(mode) {
        const d = load();
        const key = 'bestScore' + mode.charAt(0).toUpperCase() + mode.slice(1);
        return d[key] || 0;
    }

    return {
        load, save, updateBestScore, addGamePlayed, addFruitsSliced,
        updateHighestCombo, unlockAchievement, updateSettings, getBestScore
    };
})();
