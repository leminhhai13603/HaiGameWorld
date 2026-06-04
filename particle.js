/**
 * Particle - Visual effects system with object pooling
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
        this.glow = false;
    }

    // Initialize particle
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
        this.glow = config.glow || false;
    }

    // Update particle
    update(dt = 1) {
        if (!this.active) return;

        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;

        if (this.life <= 0) {
            this.active = false;
        }
    }

    // Draw particle
    draw(ctx) {
        if (!this.active) return;

        const progress = 1 - (this.life / this.maxLife);
        const alpha = this.fadeOut ? (1 - progress) : 1;
        const currentSize = this.shrink ? this.size * (1 - progress * 0.5) : this.size;

        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha);

        if (this.glow) {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = currentSize * 2;
        }

        ctx.fillStyle = this.color;

        switch (this.type) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(this.x, this.y, Math.max(0.5, currentSize), 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'square':
                ctx.fillRect(
                    this.x - currentSize / 2,
                    this.y - currentSize / 2,
                    currentSize,
                    currentSize
                );
                break;

            case 'spark':
                const angle = Math.atan2(this.vy, this.vx);
                const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                ctx.translate(this.x, this.y);
                ctx.rotate(angle);
                ctx.fillRect(-speed * 2, -currentSize / 4, speed * 4, Math.max(0.5, currentSize / 2));
                break;

            case 'star':
                this._drawStar(ctx, this.x, this.y, 5, currentSize, currentSize / 2);
                break;

            case 'ring':
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(this.x, this.y, currentSize * (1 + progress), 0, Math.PI * 2);
                ctx.stroke();
                break;
        }

        ctx.restore();
    }

    // Draw star shape
    _drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);

        for (let i = 0; i < spikes; i++) {
            ctx.lineTo(
                cx + Math.cos(rot) * outerRadius,
                cy + Math.sin(rot) * outerRadius
            );
            rot += step;
            ctx.lineTo(
                cx + Math.cos(rot) * innerRadius,
                cy + Math.sin(rot) * innerRadius
            );
            rot += step;
        }

        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fill();
    }
}

/**
 * ParticlePool - Object pool for particles
 */
class ParticlePool {
    constructor(size = 800) {
        this.pool = [];
        this.size = size;

        // Pre-allocate particles
        for (let i = 0; i < size; i++) {
            this.pool.push(new Particle());
        }
    }

    // Get an inactive particle
    get() {
        for (let i = 0; i < this.pool.length; i++) {
            if (!this.pool[i].active) {
                return this.pool[i];
            }
        }
        // Pool full - create new particle
        const p = new Particle();
        this.pool.push(p);
        return p;
    }

    // Emit particles at position
    emit(config) {
        const p = this.get();
        p.init(config);
        return p;
    }

    // Create explosion effect
    explosion(x, y, count = 20, color = '#ff6600', options = {}) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
            const speed = 1 + Math.random() * (options.speed || 4);
            const colors = options.colors || [color, '#ff3300', '#ffaa00', '#ff0000'];

            this.emit({
                x: x + (Math.random() - 0.5) * 10,
                y: y + (Math.random() - 0.5) * 10,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 20 + Math.random() * 30,
                size: 2 + Math.random() * (options.maxSize || 4),
                color: colors[Math.floor(Math.random() * colors.length)],
                type: options.type || 'circle',
                gravity: options.gravity || 0.05,
                glow: options.glow || false
            });
        }

        // Add shockwave ring
        if (options.shockwave) {
            this.emit({
                x: x,
                y: y,
                vx: 0,
                vy: 0,
                life: 15,
                size: options.shockwave || 20,
                color: color,
                type: 'ring',
                shrink: false,
                fadeOut: true
            });
        }
    }

    // Create big boss explosion
    bossExplosion(x, y) {
        const colors = ['#ff0000', '#ff3300', '#ff6600', '#ffaa00', '#ffff00', '#ffffff'];

        // Initial big explosion
        this.explosion(x, y, 40, '#ff6600', {
            speed: 8,
            maxSize: 8,
            colors: colors,
            type: 'circle',
            glow: true,
            shockwave: 40
        });

        // Multiple waves of explosions
        for (let wave = 0; wave < 6; wave++) {
            setTimeout(() => {
                const ox = (Math.random() - 0.5) * 80;
                const oy = (Math.random() - 0.5) * 60;
                this.explosion(x + ox, y + oy, 25, '#ff6600', {
                    speed: 6,
                    maxSize: 6,
                    colors: colors,
                    type: Math.random() > 0.5 ? 'circle' : 'spark',
                    glow: true,
                    shockwave: 25
                });
            }, wave * 120);
        }

        // Sparks
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 8;
            this.emit({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 40 + Math.random() * 40,
                size: 2 + Math.random() * 3,
                color: '#ffff00',
                type: 'spark',
                gravity: 0.05,
                glow: true
            });
        }
    }

    // Create pickup effect
    pickupEffect(x, y, color = '#00ffff') {
        // Inward particles
        for (let i = 0; i < 16; i++) {
            const angle = (Math.PI * 2 / 16) * i;
            this.emit({
                x: x + Math.cos(angle) * 40,
                y: y + Math.sin(angle) * 40,
                vx: -Math.cos(angle) * 3,
                vy: -Math.sin(angle) * 3,
                life: 20,
                size: 3,
                color: color,
                type: 'circle',
                glow: true
            });
        }

        // Central burst
        setTimeout(() => {
            this.explosion(x, y, 12, color, {
                speed: 4,
                maxSize: 5,
                colors: [color, '#ffffff', '#aaffff'],
                glow: true,
                shockwave: 15
            });
        }, 100);

        // Stars
        for (let i = 0; i < 6; i++) {
            const angle = Math.random() * Math.PI * 2;
            this.emit({
                x: x,
                y: y,
                vx: Math.cos(angle) * 2,
                vy: Math.sin(angle) * 2 - 1,
                life: 30,
                size: 4,
                color: '#ffffff',
                type: 'star',
                glow: true
            });
        }
    }

    // Create thrust effect
    thrust(x, y) {
        this.emit({
            x: x + (Math.random() - 0.5) * 10,
            y: y,
            vx: (Math.random() - 0.5) * 0.5,
            vy: 1 + Math.random() * 2,
            life: 10 + Math.random() * 10,
            size: 2 + Math.random() * 2,
            color: Math.random() > 0.5 ? '#ff6600' : '#ffaa00',
            type: 'circle',
            gravity: 0.02
        });
    }

    // Update all particles
    update(dt = 1) {
        for (let i = 0; i < this.pool.length; i++) {
            this.pool[i].update(dt);
        }
    }

    // Draw all particles
    draw(ctx) {
        for (let i = 0; i < this.pool.length; i++) {
            this.pool[i].draw(ctx);
        }
    }

    // Get active particle count
    getActiveCount() {
        let count = 0;
        for (let i = 0; i < this.pool.length; i++) {
            if (this.pool[i].active) count++;
        }
        return count;
    }
}
