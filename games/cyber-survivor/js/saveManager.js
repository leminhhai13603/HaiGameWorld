/**
 * Cyber Survivor Phase 2 - Save Manager with Meta Progression
 */
const SaveManager = (() => {
    const KEY = 'cyberSurvivor';
    function getDefaults() {
        return {
            bestTime:0, bestKills:0, bestLevel:1, gamesPlayed:0,
            techCredits:0, meta:{ damage:0, health:0, xpGain:0, pickup:0, critChance:0 },
            settings:{ soundEnabled:true, volume:0.5 }
        };
    }
    function load() {
        try {
            const raw = localStorage.getItem(KEY);
            if (raw) {
                const d = JSON.parse(raw);
                const def = getDefaults();
                return {
                    ...def, ...d,
                    meta:{ ...def.meta, ...(d.meta||{}) },
                    settings:{ ...def.settings, ...(d.settings||{}) }
                };
            }
        } catch(e) {}
        return getDefaults();
    }
    function save(data) { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch(e) {} }
    function updateBest(time, kills, level) {
        const d = load();
        if (time > d.bestTime) d.bestTime = time;
        if (kills > d.bestKills) d.bestKills = kills;
        if (level > d.bestLevel) d.bestLevel = level;
        d.gamesPlayed++;
        // Earn tech credits based on performance
        d.techCredits += Math.floor(time / 30) + Math.floor(kills / 10) + level;
        save(d);
    }
    function buyMetaUpgrade(key) {
        const d = load();
        const def = META_UPGRADES[key];
        if (!def) return false;
        const lv = d.meta[key] || 0;
        if (lv >= def.maxLv) return false;
        const cost = def.cost[lv];
        if (d.techCredits < cost) return false;
        d.techCredits -= cost;
        d.meta[key] = lv + 1;
        save(d);
        return true;
    }
    function getMetaBonus(key) {
        const d = load();
        return d.meta[key] || 0;
    }
    function updateSettings(s) { const d = load(); Object.assign(d.settings, s); save(d); }
    return { load, save, updateBest, buyMetaUpgrade, getMetaBonus, updateSettings };
})();
