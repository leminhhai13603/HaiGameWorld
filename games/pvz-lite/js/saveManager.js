/**
 * PvZ Lite - Save Manager
 */
const SaveManager = (() => {
    const KEY = 'pvzLite';
    function getDefaults() { return { bestWave:0, gamesPlayed:0, zombiesKilled:0, settings:{soundEnabled:true,volume:0.5} }; }
    function load() {
        try { const raw = localStorage.getItem(KEY); if (raw) { const d = JSON.parse(raw); const def = getDefaults(); return {...def,...d,settings:{...def.settings,...(d.settings||{})}}; } } catch(e) {}
        return getDefaults();
    }
    function save(data) { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch(e) {} }
    function updateBestWave(w) { const d = load(); if (w > d.bestWave) { d.bestWave = w; save(d); } }
    function addGamePlayed() { const d = load(); d.gamesPlayed++; save(d); }
    function addZombiesKilled(n) { const d = load(); d.zombiesKilled += n; save(d); }
    function updateSettings(s) { const d = load(); Object.assign(d.settings, s); save(d); }
    return { load, save, updateBestWave, addGamePlayed, addZombiesKilled, updateSettings };
})();
