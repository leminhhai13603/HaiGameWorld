/**
 * Particle - Optimized visual effects system
 */
class Particle {
    constructor() {
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.life = 0;
        this.maxLife = 0;
        this.size = 0;
        this.color = '#fff';
        this.type = 'circle';
        this.gravity = 0;
        this.friction = 0.98;
        this.shrink = true;
        this.fadeOut = true;
    }

    init(config) {
        this.active = true;
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.vx = config.vx || 0;
        this.vy = config.vy || 0;
        this.life = config.life || 30;
        this.maxLife = this.life;
        this.size = config.size || 3;
        this.color = config.color || '#fff';
        this.type = config.type || 'circle';
        this.gravity = config.gravity || 0;
        this.friction = config.friction || 0.98;
        this.shrink = config.shrink !== false;
        this.fadeOut = config.fadeOut !== false;
    }

    update(dt) {
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        if (this.life <= 0) this.active = false;
    }
}

/**
 * ParticlePool - Active-list based, no full pool iteration
 */
class ParticlePool {
    constructor(size = 200) {
        this.pool = [];
        this.active = []; // Active particle references only
        for (let i = 0; i < size; i++) {
            this.pool.push(new Particle());
        }
    }

    get() {
        for (let i = 0; i < this.pool.length; i++) {
            if (!this.pool[i].active) return this.pool[i];
        }
        const p = new Particle();
        this.pool.push(p);
        return p;
    }

    emit(config) {
        const p = this.get();
        p.init(config);
        this.active.push(p);
        return p;
    }

    explosion(x, y, count = 10, color = '#ff6600', options = {}) {
        const colors = options.colors || [color, '#ff3300', '#ffaa00'];
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
            const speed = 1 + Math.random() * (options.speed || 3);
            this.emit({
                x: x, y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 15 + Math.random() * 20,
                size: 2 + Math.random() * (options.maxSize || 3),
                color: colors[Math.floor(Math.random() * colors.length)],
                type: options.type || 'circle',
                gravity: options.gravity || 0.05
            });
        }
        if (options.shockwave) {
            this.emit({
                x, y, vx: 0, vy: 0,
                life: 12, size: options.shockwave,
                color: color, type: 'ring',
                shrink: false, fadeOut: true
            });
        }
    }

    bossExplosion(x, y) {
        const colors = ['#ff0000', '#ff6600', '#ffaa00', '#ffff00'];
        this.explosion(x, y, 12, '#ff6600', {
            speed: 5, maxSize: 5, colors: colors, shockwave: 25
        });
        for (let wave = 0; wave < 2; wave++) {
            setTimeout(() => {
                const ox = (Math.random() - 0.5) * 50;
                const oy = (Math.random() - 0.5) * 30;
                this.explosion(x + ox, y + oy, 6, '#ff6600', {
                    speed: 3, maxSize: 3, colors: colors
                });
            }, wave * 120);
        }
    }

    pickupEffect(x, y, color = '#00ffff') {
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            this.emit({
                x: x + Math.cos(angle) * 25,
                y: y + Math.sin(angle) * 25,
                vx: -Math.cos(angle) * 2,
                vy: -Math.sin(angle) * 2,
                life: 15, size: 3, color: color
            });
        }
        setTimeout(() => {
            this.explosion(x, y, 6, color, { speed: 3, maxSize: 3, shockwave: 12 });
        }, 80);
    }

    thrust(x, y) {
        this.emit({
            x: x + (Math.random() - 0.5) * 8,
            y: y,
            vx: (Math.random() - 0.5) * 0.3,
            vy: 1 + Math.random() * 1.5,
            life: 8 + Math.random() * 6,
            size: 2 + Math.random(),
            color: Math.random() > 0.5 ? '#ff6600' : '#ffaa00',
            gravity: 0.02
        });
    }

    update(dt) {
        // Only iterate active particles
        let writeIdx = 0;
        for (let i = 0; i < this.active.length; i++) {
            const p = this.active[i];
            if (p.active) {
                p.update(dt);
                this.active[writeIdx++] = p;
            }
        }
        this.active.length = writeIdx;
    }

    draw(ctx) {
        const active = this.active;
        const len = active.length;

        // Circle particles - use fillRect (faster than arc for small sizes)
        // Group by color to minimize fillStyle changes
        let lastColor = null;
        for (let i = 0; i < len; i++) {
            const p = active[i];
            if (p.type !== 'circle') continue;

            const progress = 1 - (p.life / p.maxLife);
            const alpha = p.fadeOut ? (1 - progress) : 1;
            if (alpha < 0.05) continue;
            const sz = p.shrink ? p.size * (1 - progress * 0.5) : p.size;
            if (sz < 0.5) continue;

            ctx.globalAlpha = alpha;
            if (p.color !== lastColor) { ctx.fillStyle = p.color; lastColor = p.color; }
            // fillRect is much faster than arc for small particles
            ctx.fillRect(p.x - sz, p.y - sz, sz * 2, sz * 2);
        }

        // Spark particles (need rotation)
        for (let i = 0; i < len; i++) {
            const p = active[i];
            if (p.type !== 'spark') continue;

            const progress = 1 - (p.life / p.maxLife);
            const alpha = p.fadeOut ? (1 - progress) : 1;
            if (alpha < 0.05) continue;
            const sz = p.shrink ? p.size * (1 - progress * 0.5) : p.size;

            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            const angle = Math.atan2(p.vy, p.vx);
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(angle);
            ctx.fillRect(-speed * 2, -sz / 4, speed * 4, sz / 2);
            ctx.restore();
        }

        // Ring particles
        let lastRingColor = null;
        for (let i = 0; i < len; i++) {
            const p = active[i];
            if (p.type !== 'ring') continue;

            const progress = 1 - (p.life / p.maxLife);
            const alpha = p.fadeOut ? (1 - progress) : 1;
            if (alpha < 0.05) continue;
            const sz = p.shrink ? p.size * (1 - progress * 0.5) : p.size;

            ctx.globalAlpha = alpha;
            if (p.color !== lastRingColor) { ctx.strokeStyle = p.color; lastRingColor = p.color; }
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(p.x, p.y, sz * (1 + progress), 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.globalAlpha = 1;
    }

    getActiveCount() {
        return this.active.length;
    }
}
