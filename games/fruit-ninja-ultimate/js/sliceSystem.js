/**
 * Fruit Ninja Ultimate - Slice System
 * Swipe trail, collision detection
 */
const SliceSystem = (() => {
    const MAX_TRAIL = 15;
    const TRAIL_LIFE = 0.3; // seconds
    const MIN_DISTANCE = 10; // min pixels between trail points

    let trail = [];
    let lastX = -1, lastY = -1;
    let isSlicing = false;
    let sliceSpeed = 0;

    function startSlice(x, y) {
        trail = [];
        lastX = x;
        lastY = y;
        isSlicing = true;
        trail.push({ x, y, time: TRAIL_LIFE });
    }

    function moveSlice(x, y) {
        if (!isSlicing) return;
        const dx = x - lastX;
        const dy = y - lastY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < MIN_DISTANCE) return;

        sliceSpeed = dist; // track slice speed for critical detection
        trail.push({ x, y, time: TRAIL_LIFE });
        if (trail.length > MAX_TRAIL) trail.shift();
        lastX = x;
        lastY = y;
    }

    function endSlice() {
        isSlicing = false;
    }

    function checkCollisions(fruits, shieldActive) {
        if (trail.length < 2) return [];
        const results = [];
        const p1 = trail[trail.length - 2];
        const p2 = trail[trail.length - 1];

        for (let i = 0; i < fruits.length; i++) {
            const fruit = fruits[i];
            if (!fruit.active || fruit.sliced) continue;

            const hit = lineCircleIntersect(
                p1.x, p1.y, p2.x, p2.y,
                fruit.x, fruit.y, fruit.radius
            );

            if (hit) {
                if (fruit.isBomb) {
                    if (shieldActive) {
                        results.push({ type: 'shield_block', fruit });
                    } else {
                        results.push({ type: 'bomb', fruit });
                    }
                } else if (fruit.isPowerup) {
                    results.push({ type: 'powerup', fruit, powerupType: fruit.powerupType });
                } else {
                    results.push({ type: 'fruit', fruit });
                }
            }
        }

        return results;
    }

    function lineCircleIntersect(x1, y1, x2, y2, cx, cy, r) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const fx = x1 - cx;
        const fy = y1 - cy;

        const a = dx * dx + dy * dy;
        const b = 2 * (fx * dx + fy * dy);
        const c = fx * fx + fy * fy - r * r;

        let discriminant = b * b - 4 * a * c;
        if (discriminant < 0) return false;

        discriminant = Math.sqrt(discriminant);
        const t1 = (-b - discriminant) / (2 * a);
        const t2 = (-b + discriminant) / (2 * a);

        return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1) || (t1 < 0 && t2 > 1);
    }

    function update(dt) {
        let write = 0;
        for (let i = 0; i < trail.length; i++) {
            trail[i].time -= dt;
            if (trail[i].time > 0) trail[write++] = trail[i];
        }
        trail.length = write;
    }

    function draw(ctx) {
        if (trail.length < 2) return;

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 1; i < trail.length; i++) {
            const p0 = trail[i - 1];
            const p1 = trail[i];
            const alpha = p1.time / TRAIL_LIFE;

            ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.8})`;
            ctx.lineWidth = 3 + alpha * 3;
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.stroke();

            // Glow
            ctx.strokeStyle = `rgba(200,220,255,${alpha * 0.3})`;
            ctx.lineWidth = 8 + alpha * 6;
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.stroke();
        }
    }

    function getSliceSpeed() { return sliceSpeed; }
    function getIsSlicing() { return isSlicing; }
    function getTrail() { return trail; }

    function clear() {
        trail = [];
        isSlicing = false;
        lastX = -1;
        lastY = -1;
    }

    return {
        startSlice, moveSlice, endSlice,
        checkCollisions, update, draw,
        getSliceSpeed, getIsSlicing, getTrail, clear
    };
})();
