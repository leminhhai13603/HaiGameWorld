/**
 * Bullet - Optimized projectile system
 */
class Bullet {
    constructor() {
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.width = 4;
        this.height = 10;
        this.damage = 1;
        this.type = 'player';
        this.color = '#00ffff';
        this.piercing = false;
        this._bounds = { x: 0, y: 0, width: 0, height: 0 };
    }

    init(config) {
        this.active = true;
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.vx = config.vx || 0;
        this.vy = config.vy || -8;
        this.width = config.width || 4;
        this.height = config.height || 10;
        this.damage = config.damage || 1;
        this.type = config.type || 'player';
        this.color = config.color || '#00ffff';
        this.piercing = config.piercing || false;
    }

    update(canvasWidth, canvasHeight, dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.y < -20 || this.y > canvasHeight + 20 ||
            this.x < -20 || this.x > canvasWidth + 20) {
            this.active = false;
        }
    }

    getBounds() {
        this._bounds.x = this.x - this.width / 2;
        this._bounds.y = this.y - this.height / 2;
        this._bounds.width = this.width;
        this._bounds.height = this.height;
        return this._bounds;
    }
}

/**
 * BulletPool - Active-list based, no full pool iteration
 */
class BulletPool {
    constructor(size = 300) {
        this.pool = [];
        this.active = []; // Active bullet references only
        for (let i = 0; i < size; i++) {
            this.pool.push(new Bullet());
        }
    }

    get() {
        for (let i = 0; i < this.pool.length; i++) {
            if (!this.pool[i].active) return this.pool[i];
        }
        const b = new Bullet();
        this.pool.push(b);
        return b;
    }

    fire(config) {
        const bullet = this.get();
        bullet.init(config);
        this.active.push(bullet);
        return bullet;
    }

    update(canvasWidth, canvasHeight, dt) {
        // Only iterate active bullets
        let writeIdx = 0;
        for (let i = 0; i < this.active.length; i++) {
            const b = this.active[i];
            if (b.active) {
                b.update(canvasWidth, canvasHeight, dt);
                this.active[writeIdx++] = b;
            }
        }
        this.active.length = writeIdx;
    }

    // Draw only active bullets, batched by type
    draw(ctx) {
        const active = this.active;
        const len = active.length;

        // Enemy bullets - use fillRect (faster than arc for small circles)
        let lastColor = null;
        for (let i = 0; i < len; i++) {
            const b = active[i];
            if (b.type !== 'enemy') continue;
            const r = b.width / 2;
            if (b.color !== lastColor) { ctx.fillStyle = b.color; lastColor = b.color; }
            ctx.fillRect(b.x - r, b.y - r, b.width, b.width);
        }

        // Player bullets - use fillRect
        lastColor = null;
        for (let i = 0; i < len; i++) {
            const b = active[i];
            if (b.type !== 'player') continue;
            if (b.color !== lastColor) { ctx.fillStyle = b.color; lastColor = b.color; }
            ctx.fillRect(b.x - b.width / 2, b.y - b.height / 2, b.width, b.height);
        }

        // Laser bullets
        lastColor = null;
        for (let i = 0; i < len; i++) {
            const b = active[i];
            if (b.type !== 'laser') continue;
            if (b.color !== lastColor) { ctx.fillStyle = b.color; lastColor = b.color; }
            ctx.fillRect(b.x - b.width / 2, b.y, b.width, b.height);
        }
        ctx.fillStyle = '#fff';
        for (let i = 0; i < len; i++) {
            const b = active[i];
            if (b.type !== 'laser') continue;
            ctx.fillRect(b.x - 1, b.y, 2, b.height);
        }
    }

    forEachActive(type, callback) {
        const active = this.active;
        for (let i = 0; i < active.length; i++) {
            if (active[i].type === type) callback(active[i]);
        }
    }

    getActive(type) {
        const result = [];
        const active = this.active;
        for (let i = 0; i < active.length; i++) {
            if (active[i].type === type) result.push(active[i]);
        }
        return result;
    }

    getActiveCount() {
        return this.active.length;
    }

    clear() {
        for (let i = 0; i < this.pool.length; i++) {
            this.pool[i].active = false;
        }
        this.active.length = 0;
    }
}
