/**
 * Fruit Ninja Ultimate - Particle System
 * Juice effects, fragments, combos
 */
const ParticleSystem = (() => {
    let particles = [];

    const MAX_PARTICLES = 300;

    function emitJuice(x, y, color, count) {
        if (particles.length > MAX_PARTICLES) return; // hard limit
        count = count || 12;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 60 + Math.random() * 180;
            particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 50,
                life: 0.4 + Math.random() * 0.4,
                maxLife: 0.4 + Math.random() * 0.4,
                color: color,
                size: 3 + Math.random() * 5,
                type: 'juice'
            });
        }
    }

    function emitFragments(x, y, color1, color2, count) {
        count = count || 6;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 40 + Math.random() * 120;
            particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 30,
                life: 0.6 + Math.random() * 0.4,
                maxLife: 0.6 + Math.random() * 0.4,
                color: Math.random() > 0.5 ? color1 : color2,
                size: 2 + Math.random() * 4,
                type: 'fragment',
                rot: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 10
            });
        }
    }

    function emitScore(x, y, text, color) {
        particles.push({
            x, y, vx: 0, vy: -80,
            life: 1.0, maxLife: 1.0,
            color: color || '#ffcc00',
            size: 0, type: 'text', text: String(text)
        });
    }

    function emitCombo(x, y, combo) {
        particles.push({
            x, y, vx: 0, vy: -60,
            life: 1.5, maxLife: 1.5,
            color: '#ff6600',
            size: 0, type: 'combo', text: 'x' + combo
        });
    }

    function emitExplosion(x, y, count) {
        count = count || 30;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 80 + Math.random() * 250;
            particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.5 + Math.random() * 0.5,
                maxLife: 0.5 + Math.random() * 0.5,
                color: ['#ff4400', '#ff8800', '#ffcc00', '#ff2200'][Math.floor(Math.random() * 4)],
                size: 3 + Math.random() * 6,
                type: 'explosion'
            });
        }
    }

    function emitSparkle(x, y, color) {
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            particles.push({
                x, y,
                vx: Math.cos(angle) * 80,
                vy: Math.sin(angle) * 80,
                life: 0.4, maxLife: 0.4,
                color: color || '#ffffff',
                size: 3, type: 'sparkle'
            });
        }
    }

    function update(dt) {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;

            if (p.type === 'juice' || p.type === 'fragment' || p.type === 'explosion') {
                p.vy += 300 * dt; // gravity
                p.vx *= 0.99;
            }
            if (p.type === 'fragment') {
                p.rot += p.rotSpeed * dt;
            }

            if (p.life <= 0) particles.splice(i, 1);
        }
    }

    function draw(ctx) {
        for (const p of particles) {
            const alpha = Math.max(0, p.life / p.maxLife);
            ctx.globalAlpha = alpha;

            if (p.type === 'text') {
                ctx.fillStyle = p.color;
                ctx.font = 'bold 18px Orbitron, monospace';
                ctx.textAlign = 'center';
                ctx.fillText(p.text, p.x, p.y);
            } else if (p.type === 'combo') {
                ctx.fillStyle = p.color;
                ctx.font = 'bold 28px Orbitron, monospace';
                ctx.textAlign = 'center';
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 12;
                ctx.fillText(p.text, p.x, p.y);
                ctx.shadowBlur = 0;
            } else {
                ctx.fillStyle = p.color;
                ctx.save();
                if (p.type === 'fragment') {
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.rot || 0);
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                } else {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }
        }
        ctx.globalAlpha = 1;
    }

    function clear() { particles = []; }
    function count() { return particles.length; }

    return { emitJuice, emitFragments, emitScore, emitCombo, emitExplosion, emitSparkle, update, draw, clear, count };
})();
