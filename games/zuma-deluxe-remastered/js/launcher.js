/**
 * Zuma Deluxe Remastered - Launcher
 * Frog/totem launcher with aiming and shooting
 */
const Launcher = (() => {
    const FIRE_SPEED = 800; // pixels per second
    const LAUNCHER_RADIUS = 28;

    function create(x, y, colorCount) {
        return {
            x: x,
            y: y,
            angle: 0,
            currentColor: Math.floor(Math.random() * colorCount),
            nextColor: Math.floor(Math.random() * colorCount),
            colorCount: colorCount,
            projectile: null, // { x, y, vx, vy, color, special }
            recoilTimer: 0,
            swapAnim: 0
        };
    }

    /**
     * Update launcher angle to face target
     */
    function update(launcher, targetX, targetY, dt) {
        const dx = targetX - launcher.x;
        const dy = targetY - launcher.y;
        launcher.angle = Math.atan2(dy, dx);

        if (launcher.recoilTimer > 0) launcher.recoilTimer -= dt * 5;
        if (launcher.swapAnim > 0) launcher.swapAnim -= dt * 4;

        // Update projectile
        if (launcher.projectile) {
            const p = launcher.projectile;
            p.x += p.vx * dt;
            p.y += p.vy * dt;

            // Check out of bounds
            if (p.x < -50 || p.x > 850 || p.y < -50 || p.y > 650) {
                launcher.projectile = null;
            }
        }
    }

    /**
     * Fire a marble
     */
    function shoot(launcher) {
        if (launcher.projectile) return false;

        const angle = launcher.angle;
        launcher.projectile = {
            x: launcher.x + Math.cos(angle) * (LAUNCHER_RADIUS + 8),
            y: launcher.y + Math.sin(angle) * (LAUNCHER_RADIUS + 8),
            vx: Math.cos(angle) * FIRE_SPEED,
            vy: Math.sin(angle) * FIRE_SPEED,
            color: launcher.currentColor,
            special: null
        };

        // Advance to next marble
        launcher.currentColor = launcher.nextColor;
        launcher.nextColor = Math.floor(Math.random() * launcher.colorCount);
        launcher.recoilTimer = 1;

        return true;
    }

    /**
     * Swap current and next marble
     */
    function swap(launcher) {
        const tmp = launcher.currentColor;
        launcher.currentColor = launcher.nextColor;
        launcher.nextColor = tmp;
        launcher.swapAnim = 1;
    }

    /**
     * Check if projectile hits a marble
     * Returns hit info or null
     */
    function checkProjectileHit(launcher, marbles, path) {
        const p = launcher.projectile;
        if (!p) return null;

        const r = MarbleManager.MARBLE_RADIUS;
        const hitDist = (r + 5) * (r + 5); // slightly generous hitbox

        for (let i = 0; i < marbles.length; i++) {
            if (marbles[i].removing) continue;
            const pos = path.getPointAtDist(marbles[i].dist);
            const dx = p.x - pos.x;
            const dy = p.y - pos.y;
            if (dx * dx + dy * dy < hitDist) {
                return { marbleIndex: i, x: p.x, y: p.y };
            }
        }
        return null;
    }

    /**
     * Reset launcher for new level
     */
    function reset(launcher, colorCount) {
        launcher.colorCount = colorCount;
        launcher.currentColor = Math.floor(Math.random() * colorCount);
        launcher.nextColor = Math.floor(Math.random() * colorCount);
        launcher.projectile = null;
        launcher.recoilTimer = 0;
    }

    return {
        LAUNCHER_RADIUS, FIRE_SPEED,
        create, update, shoot, swap, checkProjectileHit, reset
    };
})();
