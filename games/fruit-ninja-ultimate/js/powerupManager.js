/**
 * Fruit Ninja Ultimate - Power-up Manager
 */
const POWERUP_TYPES = {
    FREEZE: 'freeze',
    DOUBLE: 'double',
    FRENZY: 'frenzy',
    SHIELD: 'shield'
};

const POWERUP_DEFS = {
    freeze: { name: 'Freeze Time', icon: '⏱️', duration: 5, color: '#00ccff' },
    double: { name: 'Double Score', icon: '×2', duration: 10, color: '#ffcc00' },
    frenzy: { name: 'Fruit Frenzy', icon: '🍇', duration: 5, color: '#ff44aa' },
    shield: { name: 'Bomb Shield', icon: '🛡️', duration: -1, color: '#44ff44' } // -1 = one use
};

const PowerupManager = (() => {
    let active = {};
    let _spawnTimer = 0;

    function activate(type) {
        if (type === 'shield') {
            active.shield = { remaining: 1 }; // one use
        } else {
            active[type] = { remaining: POWERUP_DEFS[type].duration };
        }
    }

    function isActive(type) {
        return active[type] && (active[type].remaining > 0 || active[type].remaining === -1);
    }

    function useShield() {
        if (active.shield && active.shield.remaining > 0) {
            active.shield.remaining--;
            if (active.shield.remaining <= 0) delete active.shield;
            return true;
        }
        return false;
    }

    function getFreezeFactor() {
        return active.freeze ? 0.4 : 1;
    }

    function getScoreMultiplier() {
        return active.double ? 2 : 1;
    }

    function update(dt) {
        for (const key of Object.keys(active)) {
            if (active[key].remaining > 0) {
                active[key].remaining -= dt;
                if (active[key].remaining <= 0) {
                    delete active[key];
                }
            }
        }
    }

    function getActiveList() {
        const list = [];
        for (const key of Object.keys(active)) {
            const def = POWERUP_DEFS[key];
            list.push({
                type: key,
                name: def.name,
                icon: def.icon,
                color: def.color,
                remaining: active[key].remaining
            });
        }
        return list;
    }

    function shouldSpawn(dt, mode) {
        if (mode === 'classic') return false; // no powerup drops in classic
        _spawnTimer -= dt;
        if (_spawnTimer <= 0) {
            _spawnTimer = 8 + Math.random() * 7; // every 8-15 seconds
            return true;
        }
        return false;
    }

    function getRandomType() {
        const types = Object.keys(POWERUP_TYPES);
        return types[Math.floor(Math.random() * types.length)];
    }

    function clear() {
        active = {};
        _spawnTimer = 5;
    }

    function isShieldActive() {
        return !!active.shield;
    }

    return {
        activate, isActive, useShield, getFreezeFactor, getScoreMultiplier,
        update, getActiveList, shouldSpawn, getRandomType, clear, isShieldActive
    };
})();
