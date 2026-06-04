/**
 * Bullet - Projectile with object pooling support
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
        this.trail = [];
    }

    // Initialize bullet
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
        this.trail = [];
    }

    // Update bullet position
    update(canvasWidth, canvasHeight, dt = 1) {
        if (!this.active) return;

        // Store trail position
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 5) this.trail.shift();

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Deactivate if off screen
        if (this.y < -30 || this.y > canvasHeight + 30 ||
            this.x < -30 || this.x > canvasWidth + 30) {
            this.active = false;
        }
    }

    // Draw bullet
    draw(ctx) {
        if (!this.active) return;

        ctx.save();

        // Draw trail
        if (this.trail.length > 1) {
            ctx.strokeStyle = this.color;
            ctx.globalAlpha = 0.2;
            ctx.lineWidth = this.width * 0.5;
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) {
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        if (this.type === 'laser') {
            this._drawLaser(ctx);
        } else if (this.type === 'player') {
            this._drawPlayerBullet(ctx);
        } else {
            this._drawEnemyBullet(ctx);
        }

        ctx.restore();
    }

    // Draw laser beam
    _drawLaser(ctx) {
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.2, this.color);
        gradient.addColorStop(0.8, this.color + '88');
        gradient.addColorStop(1, 'rgba(255, 0, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);

        // Glow
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);

        // Core
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x - 1, this.y, 2, this.height);
    }

    // Draw player bullet
    _drawPlayerBullet(ctx) {
        // Outer glow
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;

        // Bullet shape
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bright core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.width / 4, this.height / 3, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw enemy bullet
    _drawEnemyBullet(ctx) {
        // Outer glow
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;

        // Bullet
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Inner glow
        ctx.fillStyle = '#ffaaaa';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width / 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // Get bounding box for collision
    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }
}

/**
 * BulletPool - Object pool for bullets
 */
class BulletPool {
    constructor(size = 400) {
        this.pool = [];
        this.size = size;

        // Pre-allocate bullets
        for (let i = 0; i < size; i++) {
            this.pool.push(new Bullet());
        }
    }

    // Get an inactive bullet
    get() {
        for (let i = 0; i < this.pool.length; i++) {
            if (!this.pool[i].active) {
                return this.pool[i];
            }
        }
        // Pool full - create new bullet
        const b = new Bullet();
        this.pool.push(b);
        return b;
    }

    // Fire a bullet
    fire(config) {
        const bullet = this.get();
        bullet.init(config);
        return bullet;
    }

    // Update all bullets
    update(canvasWidth, canvasHeight, dt = 1) {
        for (let i = 0; i < this.pool.length; i++) {
            this.pool[i].update(canvasWidth, canvasHeight, dt);
        }
    }

    // Draw all bullets
    draw(ctx) {
        for (let i = 0; i < this.pool.length; i++) {
            this.pool[i].draw(ctx);
        }
    }

    // Get all active bullets of a type
    getActive(type) {
        const active = [];
        for (let i = 0; i < this.pool.length; i++) {
            if (this.pool[i].active && this.pool[i].type === type) {
                active.push(this.pool[i]);
            }
        }
        return active;
    }

    // Get active count
    getActiveCount() {
        let count = 0;
        for (let i = 0; i < this.pool.length; i++) {
            if (this.pool[i].active) count++;
        }
        return count;
    }

    // Deactivate all bullets
    clear() {
        for (let i = 0; i < this.pool.length; i++) {
            this.pool[i].active = false;
        }
    }
}
