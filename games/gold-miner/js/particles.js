/**
 * Gold Miner - Particle Effects System
 */
class ParticleSystem {
    constructor() { this.particles = []; }

    emit(x, y, count, color, opts = {}) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
            const speed = (opts.speed || 2) + Math.random() * 2;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - (opts.upward ? 2 : 0),
                life: opts.life || 30 + Math.random() * 20,
                maxLife: opts.life || 30 + Math.random() * 20,
                size: opts.size || 2 + Math.random() * 3,
                color, gravity: opts.gravity || 0.08,
                friction: opts.friction || 0.98,
                type: opts.type || 'circle'
            });
        }
    }

    goldSparkle(x, y) {
        this.emit(x, y, 8, '#ffcc00', { speed: 2, size: 2, life: 25, upward: true });
        this.emit(x, y, 4, '#ffee66', { speed: 1.5, size: 1.5, life: 20 });
    }

    diamondSparkle(x, y) {
        this.emit(x, y, 10, '#aaddff', { speed: 2.5, size: 2, life: 30, upward: true });
        this.emit(x, y, 6, '#ffffff', { speed: 1.5, size: 1, life: 25 });
    }

    rockBurst(x, y) {
        this.emit(x, y, 12, '#888888', { speed: 3, size: 3, life: 25, gravity: 0.15 });
        this.emit(x, y, 6, '#666666', { speed: 2, size: 2, life: 20 });
    }

    boneBurst(x, y) {
        this.emit(x, y, 8, '#ddccaa', { speed: 2, size: 2, life: 20, gravity: 0.12 });
    }

    explosion(x, y) {
        this.emit(x, y, 20, '#ff4400', { speed: 4, size: 4, life: 30, gravity: 0.1 });
        this.emit(x, y, 15, '#ffaa00', { speed: 3, size: 3, life: 25 });
        this.emit(x, y, 10, '#ffff00', { speed: 2, size: 2, life: 20 });
    }

    moleDirt(x, y) {
        this.emit(x, y, 6, '#8B7355', { speed: 1.5, size: 2, life: 20, gravity: 0.12 });
    }

    scorePopup(x, y, text, color = '#fff') {
        this.particles.push({
            x, y, vx: 0, vy: -1.5,
            life: 50, maxLife: 50, size: 0,
            color, gravity: 0, friction: 1,
            type: 'text', text
        });
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.vx *= p.friction;
            p.vy *= p.friction;
            p.vy += p.gravity;
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    draw(ctx) {
        for (const p of this.particles) {
            const alpha = Math.max(0, p.life / p.maxLife);
            if (p.type === 'text') {
                ctx.globalAlpha = alpha;
                ctx.fillStyle = p.color;
                ctx.font = 'bold 16px Rajdhani, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(p.text, p.x, p.y);
                continue;
            }
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            const sz = p.size * (0.5 + alpha * 0.5);
            ctx.fillRect(p.x - sz, p.y - sz, sz * 2, sz * 2);
        }
        ctx.globalAlpha = 1;
    }

    clear() { this.particles = []; }
}
