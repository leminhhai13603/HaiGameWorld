/**
 * Zuma Deluxe Remastered - Save Manager (localStorage)
 */
const SaveManager = (() => {
    const KEY = 'zumaDeluxeRemastered';

    function getDefaults() {
        return {
            bestScore: 0,
            highestLevel: 1,
            gamesPlayed: 0,
            totalMarblesDestroyed: 0,
            totalChainReactions: 0,
            bestCombo: 0,
            achievements: [],
            settings: { soundEnabled: true, volume: 0.5 },
            endlessRecord: 0,
            theme: 'temple'
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

    function updateBestScore(score) {
        const d = load();
        if (score > d.bestScore) { d.bestScore = score; save(d); }
    }

    function unlockLevel(level) {
        const d = load();
        if (level > d.highestLevel) { d.highestLevel = level; save(d); }
    }

    function addGamePlayed() {
        const d = load();
        d.gamesPlayed++;
        save(d);
    }

    function addMarblesDestroyed(count) {
        const d = load();
        d.totalMarblesDestroyed += count;
        save(d);
    }

    function addChainReaction() {
        const d = load();
        d.totalChainReactions++;
        save(d);
    }

    function updateBestCombo(combo) {
        const d = load();
        if (combo > d.bestCombo) { d.bestCombo = combo; save(d); }
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

    function updateEndlessRecord(score) {
        const d = load();
        if (score > d.endlessRecord) { d.endlessRecord = score; save(d); }
    }

    function setTheme(theme) {
        const d = load();
        d.theme = theme;
        save(d);
    }

    function updateSettings(settings) {
        const d = load();
        Object.assign(d.settings, settings);
        save(d);
    }

    return {
        load, save, updateBestScore, unlockLevel, addGamePlayed,
        addMarblesDestroyed, addChainReaction, updateBestCombo,
        unlockAchievement, updateEndlessRecord, setTheme, updateSettings
    };
})();
