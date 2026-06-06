/**
 * Cyber Survivor - Save Manager
 */
const SaveManager = (() => {
    const KEY = 'cyberSurvivor';
    function getDefaults() { return { bestTime:0, bestKills:0, bestLevel:1, gamesPlayed:0, settings:{soundEnabled:true,volume:0.5} }; }
    function load() {
        try { const raw = localStorage.getItem(KEY); if (raw) { const d = JSON.parse(raw); const def = getDefaults(); return {...def,...d,settings:{...def.settings,...(d.settings||{})}}; } } catch(e) {}
        return getDefaults();
    }
    function save(data) { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch(e) {} }
    function updateBest(time, kills, level) {
        const d = load();
        if (time > d.bestTime) d.bestTime = time;
        if (kills > d.bestKills) d.bestKills = kills;
        if (level > d.bestLevel) d.bestLevel = level;
        d.gamesPlayed++;
        save(d);
    }
    function updateSettings(s) { const d = load(); Object.assign(d.settings, s); save(d); }
    return { load, save, updateBest, updateSettings };
})();
