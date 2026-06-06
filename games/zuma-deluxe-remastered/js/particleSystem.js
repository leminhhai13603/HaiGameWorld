/**
 * Zuma Deluxe Remastered - Particle System
 */
const ParticleSystem = (() => {
    let particles = [];

    const MAX_PARTICLES = 200;

    function emit(type, x, y, color, count) {
        count = count || 10;
        for (let i = 0; i < count && particles.length < MAX_PARTICLES; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = type === 'explosion' ? 80 + Math.random() * 180 : 40 + Math.random() * 100;
            particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.3 + Math.random() * 0.5,
                maxLife: 0.3 + Math.random() * 0.5,
                color: color || '#fff',
                size: type === 'explosion' ? 3 + Math.random() * 5 : 2 + Math.random() * 3,
                type: 'circle'
            });
        }
    }

    function emitScore(x, y, text, color) {
        particles.push({
            x, y, vx: 0, vy: -70,
            life: 1.2, maxLife: 1.2,
            color: color || '#ffcc00',
            size: 0, type: 'text', text: String(text)
        });
    }

    function emitCombo(x, y, combo) {
        particles.push({
            x, y, vx: 0, vy: -50,
            life: 1.5, maxLife: 1.5,
            color: '#ff6600',
            size: 0, type: 'combo', text: 'x' + combo
        });
    }

    function emitRing(x, y, color) {
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            particles.push({
                x, y,
                vx: Math.cos(angle) * 120,
                vy: Math.sin(angle) * 120,
                life: 0.4, maxLife: 0.4,
                color: color || '#fff',
                size: 4, type: 'circle'
            });
        }
    }

    function update(dt) {
        let write = 0;
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            if (p.type === 'circle') {
                p.vx *= 0.96;
                p.vy *= 0.96;
                p.vy += 120 * dt;
            }
            if (p.life > 0) particles[write++] = p;
        }
        particles.length = write;
    }

    function draw(ctx) {
        for (const p of particles) {
            const alpha = Math.max(0, p.life / p.maxLife);
            ctx.globalAlpha = alpha;
            if (p.type === 'text') {
                ctx.fillStyle = p.color;
                ctx.font = 'bold 16px Orbitron, monospace';
                ctx.textAlign = 'center';
                ctx.fillText(p.text, p.x, p.y);
            } else if (p.type === 'combo') {
                ctx.fillStyle = p.color;
                ctx.font = 'bold 22px Orbitron, monospace';
                ctx.textAlign = 'center';
                ctx.fillText(p.text, p.x, p.y);
            } else {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
    }

    function clear() { particles = []; }

    return { emit, emitScore, emitCombo, emitRing, update, draw, clear };
})();
