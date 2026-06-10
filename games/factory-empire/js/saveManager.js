/**
 * Factory Empire - Save Manager
 */
const SaveManager = (() => {
    const KEY = 'factoryEmpire_save';
    const STATS_KEY = 'factoryEmpire_stats';
    const ACH_KEY = 'factoryEmpire_achievements';

    function getDefaults() {
        return {
            money: 500,
            grid: null, // will be generated
            buildings: [],
            research: {},
            stats: { totalEarned:0, itemsProduced:0, itemsSold:0, buildingsBuilt:0, playTime:0 },
            settings: { soundOn:true, volume:0.4 },
            lastSaved: 0
        };
    }

    function load() {
        try {
            const raw = localStorage.getItem(KEY);
            if (raw) {
                const d = JSON.parse(raw);
                const def = getDefaults();
                return { ...def, ...d, stats:{...def.stats,...(d.stats||{})}, settings:{...def.settings,...(d.settings||{})} };
            }
        } catch(e) {}
        return getDefaults();
    }

    function save(data) {
        try { data.lastSaved = Date.now(); localStorage.setItem(KEY, JSON.stringify(data)); } catch(e) {}
    }

    function getStats() {
        try { return JSON.parse(localStorage.getItem(STATS_KEY)) || {}; } catch(e) { return {}; }
    }

    function setStats(s) {
        try { localStorage.setItem(STATS_KEY, JSON.stringify(s)); } catch(e) {}
    }

    function getAchievements() {
        try { return JSON.parse(localStorage.getItem(ACH_KEY)) || {}; } catch(e) { return {}; }
    }

    function unlockAchievement(id) {
        const a = getAchievements();
        if (!a[id]) { a[id] = Date.now(); setAchievements(a); return true; }
        return false;
    }

    function setAchievements(a) {
        try { localStorage.setItem(ACH_KEY, JSON.stringify(a)); } catch(e) {}
    }

    function reset() {
        localStorage.removeItem(KEY);
        localStorage.removeItem(STATS_KEY);
        localStorage.removeItem(ACH_KEY);
    }

    return { load, save, getStats, setStats, getAchievements, unlockAchievement, reset };
})();
