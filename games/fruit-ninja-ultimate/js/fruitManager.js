/**
 * Fruit Ninja Ultimate - Fruit Manager
 * Fruit types, spawning, physics, slicing
 */

const FRUIT_TYPES = [
    { name: 'apple', radius: 26, points: 10, weight: 15, colors: { base: '#ff3333', light: '#ff8888', dark: '#cc0000', juice: '#ff4444', inner: '#ffcccc', leaf: '#33aa33' } },
    { name: 'orange', radius: 28, points: 10, weight: 15, colors: { base: '#ff8800', light: '#ffbb44', dark: '#cc6600', juice: '#ffaa22', inner: '#ffddaa' } },
    { name: 'watermelon', radius: 38, points: 20, weight: 7, colors: { base: '#22aa22', light: '#44cc44', dark: '#118811', juice: '#ff4466', inner: '#ff6688', seeds: '#333' } },
    { name: 'banana', radius: 24, points: 10, weight: 14, colors: { base: '#ffdd00', light: '#ffee66', dark: '#ccaa00', juice: '#ffee88', inner: '#ffffcc' } },
    { name: 'kiwi', radius: 22, points: 15, weight: 10, colors: { base: '#886633', light: '#aa8855', dark: '#664422', juice: '#88cc44', inner: '#88cc44' } },
    { name: 'pineapple', radius: 30, points: 25, weight: 5, colors: { base: '#ddaa00', light: '#ffcc44', dark: '#aa7700', juice: '#ffdd44', inner: '#ffee88' } },
    { name: 'mango', radius: 26, points: 15, weight: 10, colors: { base: '#ff9922', light: '#ffbb66', dark: '#dd7700', juice: '#ffaa44', inner: '#ffdd88' } },
    { name: 'strawberry', radius: 20, points: 15, weight: 12, colors: { base: '#ff3366', light: '#ff88aa', dark: '#cc0033', juice: '#ff4488', inner: '#ffccdd' } },
    { name: 'dragonfruit', radius: 28, points: 30, weight: 4, colors: { base: '#ff44aa', light: '#ff88cc', dark: '#cc2288', juice: '#ff66bb', inner: '#ffffff' } }
];

const BOMB_DEF = { radius: 26, colors: { base: '#333', light: '#555', dark: '#111', fuse: '#ff6600', spark: '#ffff00' } };

const FruitManager = (() => {
    let fruits = [];
    let halves = [];
    let _spawnTimer = 0;
    let _waveCount = 0;

    function _weightedRandom() {
        let total = 0;
        for (const f of FRUIT_TYPES) total += f.weight;
        let r = Math.random() * total;
        for (const f of FRUIT_TYPES) {
            r -= f.weight;
            if (r <= 0) return f;
        }
        return FRUIT_TYPES[0];
    }

    function spawnFruit(W, H, mode) {
        const type = _weightedRandom();
        const x = 80 + Math.random() * (W - 160);
        const speedY = -(550 + Math.random() * 300); // upward (much higher)
        const speedX = (Math.random() - 0.5) * 100; // slight horizontal
        const gravity = 480; // lower gravity for higher arcs

        // Calculate time to peak and peak height
        const timeToPeak = -speedY / gravity;
        const peakY = H + speedY * timeToPeak + 0.5 * gravity * timeToPeak * timeToPeak;

        // Only spawn if peak is visible (at least 60% up)
        if (peakY > H * 0.05) {
            fruits.push({
                x: x,
                y: H + type.radius,
                vx: speedX,
                vy: speedY,
                radius: type.radius,
                type: type,
                isBomb: false,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 6,
                sliced: false,
                active: true
            });
        }
    }

    function spawnBomb(W, H) {
        const x = 80 + Math.random() * (W - 160);
        const speedY = -(500 + Math.random() * 250);
        const speedX = (Math.random() - 0.5) * 80;

        fruits.push({
            x: x,
            y: H + BOMB_DEF.radius,
            vx: speedX,
            vy: speedY,
            radius: BOMB_DEF.radius,
            type: null,
            isBomb: true,
            rotation: 0,
            rotSpeed: 0,
            sliced: false,
            active: true,
            pulse: 0
        });
    }

    function spawnPowerup(W, H, type) {
        const x = 80 + Math.random() * (W - 160);
        const speedY = -(300 + Math.random() * 100);
        const speedX = (Math.random() - 0.5) * 60;

        fruits.push({
            x: x,
            y: H + 20,
            vx: speedX,
            vy: speedY,
            radius: 22,
            type: null,
            isBomb: false,
            isPowerup: true,
            powerupType: type,
            rotation: 0,
            rotSpeed: 3,
            sliced: false,
            active: true,
            glow: 0
        });
    }

    function spawnWave(W, H, mode, count, bombChance) {
        const delay = 120; // ms between each fruit in wave
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                if (mode !== 'zen' && Math.random() < bombChance) {
                    spawnBomb(W, H);
                } else {
                    spawnFruit(W, H, mode);
                }
            }, i * delay);
        }
        _waveCount++;
    }

    function update(dt, H, freezeFactor) {
        const ff = freezeFactor || 1;
        let missed = null;
        let fWrite = 0;

        for (let i = 0; i < fruits.length; i++) {
            const f = fruits[i];
            if (!f.active) continue;

            f.x += f.vx * dt * ff;
            f.vy += 480 * dt * ff; // gravity (reduced for higher arcs)
            f.y += f.vy * dt * ff;
            f.rotation += f.rotSpeed * dt * ff;

            if (f.isPowerup) {
                f.glow = (f.glow || 0) + dt * 3;
            }
            if (f.isBomb) {
                f.pulse = (f.pulse || 0) + dt * 4;
            }

            // Check if fell off screen
            if (f.y > H + 60 && f.vy > 0) {
                f.active = false;
                if (!f.sliced && !f.isBomb && !f.isPowerup) {
                    missed = 'miss';
                }
            } else {
                fruits[fWrite++] = f;
            }
        }
        fruits.length = fWrite;

        // Update halves
        let hWrite = 0;
        for (let i = 0; i < halves.length; i++) {
            const h = halves[i];
            h.x += h.vx * dt;
            h.vy += 500 * dt;
            h.y += h.vy * dt;
            h.rotation += h.rotSpeed * dt;
            h.life -= dt;
            if (h.life > 0) halves[hWrite++] = h;
        }
        halves.length = hWrite;

        return missed;
    }

    function sliceFruit(fruit) {
        if (fruit.sliced) return false;
        fruit.sliced = true;
        fruit.active = false;

        if (fruit.isBomb) {
            return { type: 'bomb', x: fruit.x, y: fruit.y };
        }

        if (fruit.isPowerup) {
            return { type: 'powerup', x: fruit.x, y: fruit.y, powerupType: fruit.powerupType };
        }

        const type = fruit.type;
        // Create halves
        halves.push({
            x: fruit.x - type.radius * 0.3,
            y: fruit.y,
            vx: -60 - Math.random() * 40,
            vy: -100 - Math.random() * 60,
            radius: type.radius,
            type: type,
            side: 'left',
            rotation: fruit.rotation,
            rotSpeed: -3 - Math.random() * 2,
            life: 1.0
        });
        halves.push({
            x: fruit.x + type.radius * 0.3,
            y: fruit.y,
            vx: 60 + Math.random() * 40,
            vy: -100 - Math.random() * 60,
            radius: type.radius,
            type: type,
            side: 'right',
            rotation: fruit.rotation,
            rotSpeed: 3 + Math.random() * 2,
            life: 1.0
        });

        return {
            type: 'fruit',
            x: fruit.x,
            y: fruit.y,
            fruitType: type,
            points: type.points
        };
    }

    function clear() {
        fruits = [];
        halves = [];
        _spawnTimer = 0;
        _waveCount = 0;
    }

    function getActiveFruits() {
        return fruits.filter(f => f.active && !f.sliced);
    }

    function getWaveCount() { return _waveCount; }

    return {
        FRUIT_TYPES, BOMB_DEF,
        spawnFruit, spawnBomb, spawnPowerup, spawnWave,
        update, sliceFruit, clear, getActiveFruits, getWaveCount,
        get fruits() { return fruits; },
        get halves() { return halves; }
    };
})();
