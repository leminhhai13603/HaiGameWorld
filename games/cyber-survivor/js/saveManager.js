/**
 * Cyber Survivor Phase 3 - Save Manager
 * Characters, Relics, Endgame, Completion Tracking
 */
const SaveManager = (() => {
    const KEY = 'cyberSurvivor';
    function getDefaults() {
        return {
            bestTime:0, bestKills:0, bestLevel:1, gamesPlayed:0,
            techCredits:0,
            meta:{ damage:0, health:0, xpGain:0, pickup:0, critChance:0 },
            unlockedChars:['vanguard'],
            unlockedRelics:[],
            bestTimes:{ normal:0, bossRush:0, endless:0, nightmare:0, chaos:0 },
            bossesDefeated:{},
            totalKills:0, totalGames:0,
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
                    settings:{ ...def.settings, ...(d.settings||{}) },
                    unlockedChars: d.unlockedChars || ['vanguard'],
                    unlockedRelics: d.unlockedRelics || [],
                    bestTimes: { ...def.bestTimes, ...(d.bestTimes||{}) },
                    bossesDefeated: d.bossesDefeated || {}
                };
            }
        } catch(e) {}
        return getDefaults();
    }
    function save(data) { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch(e) {} }

    function updateBest(time, kills, level, mode) {
        const d = load();
        if (time > d.bestTime) d.bestTime = time;
        if (kills > d.bestKills) d.bestKills = kills;
        if (level > d.bestLevel) d.bestLevel = level;
        d.gamesPlayed++;
        d.totalGames++;
        d.totalKills += kills;
        d.techCredits += Math.floor(time / 30) + Math.floor(kills / 10) + level;
        if (mode && time > (d.bestTimes[mode] || 0)) d.bestTimes[mode] = time;
        save(d);
        checkUnlocks(d);
    }

    function defeatBoss(bossKey) {
        const d = load();
        d.bossesDefeated[bossKey] = (d.bossesDefeated[bossKey] || 0) + 1;
        save(d);
        checkUnlocks(d);
    }

    function checkUnlocks(d) {
        // Character unlocks
        for (const [key, def] of Object.entries(CHARACTERS)) {
            if (d.unlockedChars.includes(key)) continue;
            let unlock = false;
            if (def.unlock === 0) unlock = true;
            else if (def.unlock <= 20 && d.bestLevel >= def.unlock) unlock = true;
            else if (def.unlock === 100 && d.techCredits >= 100) unlock = true;
            else if (def.unlock === 500 && d.totalKills >= 500) unlock = true;
            else if (def.unlock === 900 && d.bestTime >= 900) unlock = true;
            else if (def.unlock === 1 && Object.keys(d.bossesDefeated).length >= 1) unlock = true;
            if (unlock) d.unlockedChars.push(key);
        }
        // Relic unlocks
        for (const key of RELIC_ORDER) {
            if (d.unlockedRelics.includes(key)) continue;
            if (d.bestLevel >= 15) d.unlockedRelics.push(key);
        }
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

    function getMetaBonus(key) { return load().meta[key] || 0; }
    function isCharUnlocked(key) { return load().unlockedChars.includes(key); }
    function isRelicUnlocked(key) { return load().unlockedRelics.includes(key); }
    function getCompletionPercent() {
        const d = load();
        let total = 0, done = 0;
        // Characters
        total += CHAR_ORDER.length;
        done += d.unlockedChars.length;
        // Relics
        total += RELIC_ORDER.length;
        done += d.unlockedRelics.length;
        // Bosses
        total += Object.keys(BOSS_TYPES).length;
        done += Object.keys(d.bossesDefeated).length;
        // Meta
        for (const key of META_ORDER) {
            total += META_UPGRADES[key].maxLv;
            done += d.meta[key] || 0;
        }
        return total > 0 ? Math.floor(done / total * 100) : 0;
    }

    function updateSettings(s) { const d = load(); Object.assign(d.settings, s); save(d); }

    return {
        load, save, updateBest, defeatBoss, checkUnlocks, buyMetaUpgrade,
        getMetaBonus, isCharUnlocked, isRelicUnlocked, getCompletionPercent, updateSettings
    };
})();
