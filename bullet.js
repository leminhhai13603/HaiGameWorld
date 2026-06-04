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
        // Cached bounds object (reused, never reallocated)
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
        if (!this.active) return;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.y < -20 || this.y > canvasHeight + 20 ||
            this.x < -20 || this.x > canvasWidth + 20) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.fillStyle = this.color;

        if (this.type === 'laser') {
            ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);
            ctx.fillStyle = '#fff';
            ctx.fillRect(this.x - 1, this.y, 2, this.height);
        } else if (this.type === 'player') {
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, this.width / 4, this.height / 3, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
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
 * BulletPool - Optimized object pool with batched rendering
 */
class BulletPool {
    constructor(size = 300) {
        this.pool = [];
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
        return bullet;
    }

    update(canvasWidth, canvasHeight, dt) {
        for (let i = 0; i < this.pool.length; i++) {
            this.pool[i].update(canvasWidth, canvasHeight, dt);
        }
    }

    // Optimized: batch draw by type to minimize ctx.fillStyle changes
    draw(ctx) {
        // Enemy bullets - all same shape (circle), batch by color
        // Most enemy bullets are '#ff4444', '#ffaa00', '#ff88ff', '#ff6644'
        // Group them to reduce fillStyle changes
        let lastColor = null;

        // Draw all enemy bullets in one pass
        for (let i = 0; i < this.pool.length; i++) {
            const b = this.pool[i];
            if (!b.active || b.type !== 'enemy') continue;
            if (b.color !== lastColor) {
                ctx.fillStyle = b.color;
                lastColor = b.color;
            }
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.width / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw all player bullets
        lastColor = null;
        for (let i = 0; i < this.pool.length; i++) {
            const b = this.pool[i];
            if (!b.active || b.type !== 'player') continue;
            if (b.color !== lastColor) {
                ctx.fillStyle = b.color;
                lastColor = b.color;
            }
            ctx.beginPath();
            ctx.ellipse(b.x, b.y, b.width / 2, b.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw laser bullets (separate type with different shape)
        lastColor = null;
        for (let i = 0; i < this.pool.length; i++) {
            const b = this.pool[i];
            if (!b.active || b.type !== 'laser') continue;
            if (b.color !== lastColor) {
                ctx.fillStyle = b.color;
                lastColor = b.color;
            }
            ctx.fillRect(b.x - b.width / 2, b.y, b.width, b.height);
        }
        // Laser white center (batch)
        ctx.fillStyle = '#fff';
        for (let i = 0; i < this.pool.length; i++) {
            const b = this.pool[i];
            if (!b.active || b.type !== 'laser') continue;
            ctx.fillRect(b.x - 1, b.y, 2, b.height);
        }
    }

    // Optimized: iterate directly without allocating arrays
    forEachActive(type, callback) {
        for (let i = 0; i < this.pool.length; i++) {
            const b = this.pool[i];
            if (b.active && b.type === type) callback(b);
        }
    }

    getActive(type) {
        const active = [];
        for (let i = 0; i < this.pool.length; i++) {
            if (this.pool[i].active && this.pool[i].type === type) {
                active.push(this.pool[i]);
            }
        }
        return active;
    }

    getActiveCount() {
        let count = 0;
        for (let i = 0; i < this.pool.length; i++) {
            if (this.pool[i].active) count++;
        }
        return count;
    }

    clear() {
        for (let i = 0; i < this.pool.length; i++) {
            this.pool[i].active = false;
        }
    }
}
