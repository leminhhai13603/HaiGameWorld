/**
 * Age of War - Save Manager
 */
const SaveManager = (() => {
    const KEY = 'ageOfWar';
    function getDefaults() {
        return {
            stats: { gamesPlayed:0, gamesWon:0, unitsSpawned:0, unitsKilled:0, goldEarned:0, highestAge:0, longestSurvival:0 },
            achievements: [],
            campaignProgress: 0,
            bestSurvival: 0,
            settings: { soundEnabled:true, volume:0.5, difficulty:'normal' }
        };
    }
    function load() {
        try { const raw = localStorage.getItem(KEY); if (raw) { const d = JSON.parse(raw); const def = getDefaults(); return { ...def, ...d, stats:{...def.stats,...(d.stats||{})}, settings:{...def.settings,...(d.settings||{})} }; } } catch(e) {}
        return getDefaults();
    }
    function save(data) { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch(e) {} }
    function updateStats(key, val) { const d = load(); if (typeof d.stats[key] === 'number') { d.stats[key] += val; save(d); } }
    function setBestSurvival(v) { const d = load(); if (v > d.bestSurvival) { d.bestSurvival = v; save(d); } }
    function setCampaignProgress(v) { const d = load(); if (v > d.campaignProgress) { d.campaignProgress = v; save(d); } }
    function unlockAchievement(id) { const d = load(); if (!d.achievements.includes(id)) { d.achievements.push(id); save(d); return true; } return false; }
    function updateSettings(s) { const d = load(); Object.assign(d.settings, s); save(d); }
    function updateHighestAge(a) { const d = load(); if (a > d.stats.highestAge) { d.stats.highestAge = a; save(d); } }
    return { load, save, updateStats, setBestSurvival, setCampaignProgress, unlockAchievement, updateSettings, updateHighestAge };
})();
