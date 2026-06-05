/**
 * Fruit Ninja Ultimate - Renderer
 * Canvas rendering for all visual elements
 */
const Renderer = (() => {
    const THEMES = {
        dojo: { name: 'Dojo', bg1: '#1a0f0a', bg2: '#2d1810', accent: '#ff6633' },
        bamboo: { name: 'Bamboo Forest', bg1: '#0a1a0a', bg2: '#0d2818', accent: '#44ff44' },
        sunset: { name: 'Sunset Temple', bg1: '#1a0a0a', bg2: '#2d1510', accent: '#ff8844' },
        night: { name: 'Night Garden', bg1: '#0a0a1a', bg2: '#0d0d28', accent: '#8844ff' },
        cyber: { name: 'Cyber Arena', bg1: '#0a0a14', bg2: '#140a20', accent: '#00eeff' }
    };

    function getRandomTheme() {
        const keys = Object.keys(THEMES);
        return THEMES[keys[Math.floor(Math.random() * keys.length)]];
    }

    function drawBackground(ctx, W, H, theme) {
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, theme.bg1);
        grad.addColorStop(1, theme.bg2);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Subtle pattern
        ctx.globalAlpha = 0.04;
        ctx.fillStyle = theme.accent;
        for (let i = 0; i < 20; i++) {
            const x = ((i * 137 + 50) % W);
            const y = ((i * 211 + 30) % H);
            ctx.beginPath();
            ctx.arc(x, y, 1 + (i % 3), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    function drawFruit(ctx, fruit) {
        if (!fruit.active || fruit.sliced) return;

        if (fruit.isBomb) {
            drawBomb(ctx, fruit);
            return;
        }

        if (fruit.isPowerup) {
            drawPowerupItem(ctx, fruit);
            return;
        }

        const type = fruit.type;
        const col = type.colors;
        const r = type.radius;

        ctx.save();
        ctx.translate(fruit.x, fruit.y);
        ctx.rotate(fruit.rotation);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(2, 3, r, r * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Main body
        const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
        grad.addColorStop(0, col.light);
        grad.addColorStop(0.6, col.base);
        grad.addColorStop(1, col.dark);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(-r * 0.25, -r * 0.25, r * 0.35, 0, Math.PI * 2);
        ctx.fill();

        // Fruit-specific features
        if (type.name === 'apple') {
            // Leaf
            ctx.fillStyle = col.leaf;
            ctx.beginPath();
            ctx.ellipse(0, -r - 4, 6, 3, 0.3, 0, Math.PI * 2);
            ctx.fill();
            // Stem
            ctx.strokeStyle = '#664422';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -r + 2);
            ctx.lineTo(0, -r - 4);
            ctx.stroke();
        } else if (type.name === 'orange') {
            // Texture dots
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * Math.PI * 2;
                ctx.beginPath();
                ctx.arc(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (type.name === 'watermelon') {
            // Stripes
            ctx.strokeStyle = 'rgba(0,80,0,0.3)';
            ctx.lineWidth = 3;
            for (let i = -2; i <= 2; i++) {
                ctx.beginPath();
                ctx.arc(i * r * 0.3, 0, r * 0.9, -0.5, 0.5);
                ctx.stroke();
            }
        } else if (type.name === 'strawberry') {
            // Seeds
            ctx.fillStyle = '#ffdd00';
            for (let i = 0; i < 5; i++) {
                const a = (i / 5) * Math.PI * 2;
                ctx.beginPath();
                ctx.arc(Math.cos(a) * r * 0.4, Math.sin(a) * r * 0.4, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (type.name === 'pineapple') {
            // Crown
            ctx.fillStyle = '#33aa33';
            for (let i = -2; i <= 2; i++) {
                ctx.beginPath();
                ctx.moveTo(i * 4, -r + 2);
                ctx.lineTo(i * 4 - 2, -r - 8);
                ctx.lineTo(i * 4 + 2, -r - 8);
                ctx.closePath();
                ctx.fill();
            }
        } else if (type.name === 'dragonfruit') {
            // Scales
            ctx.fillStyle = 'rgba(0,180,80,0.4)';
            for (let i = 0; i < 5; i++) {
                const a = (i / 5) * Math.PI * 2 + fruit.rotation;
                ctx.beginPath();
                ctx.moveTo(Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.3);
                ctx.lineTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9);
                ctx.lineTo(Math.cos(a + 0.3) * r * 0.7, Math.sin(a + 0.3) * r * 0.7);
                ctx.closePath();
                ctx.fill();
            }
        }

        ctx.restore();
    }

    function drawBomb(ctx, bomb) {
        const r = bomb.radius;
        const pulse = 0.8 + Math.sin(bomb.pulse || 0) * 0.2;

        ctx.save();
        ctx.translate(bomb.x, bomb.y);

        // Warning glow
        ctx.fillStyle = `rgba(255,0,0,${0.1 + Math.sin(bomb.pulse || 0) * 0.05})`;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.4, 0, Math.PI * 2);
        ctx.fill();

        // Body
        const grad = ctx.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.1, 0, 0, r);
        grad.addColorStop(0, '#666');
        grad.addColorStop(0.5, '#444');
        grad.addColorStop(1, '#222');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Fuse
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.quadraticCurveTo(r * 0.5, -r - 10, r * 0.3, -r - 16);
        ctx.stroke();

        // Spark
        const sparkAlpha = 0.5 + Math.sin((bomb.pulse || 0) * 3) * 0.5;
        ctx.fillStyle = `rgba(255,255,0,${sparkAlpha})`;
        ctx.beginPath();
        ctx.arc(r * 0.3, -r - 16, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255,128,0,${sparkAlpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(r * 0.3, -r - 16, 7, 0, Math.PI * 2);
        ctx.fill();

        // Skull
        ctx.fillStyle = '#fff';
        ctx.font = `${r * 0.8}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💣', 0, 2);

        ctx.restore();
    }

    function drawPowerupItem(ctx, item) {
        const r = item.radius;
        const def = POWERUP_DEFS[item.powerupType];
        const glow = item.glow || 0;

        ctx.save();
        ctx.translate(item.x, item.y);

        // Glow
        ctx.fillStyle = `rgba(${hexToRgb(def.color)}, ${0.2 + Math.sin(glow) * 0.1})`;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Body
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        grad.addColorStop(0, '#fff');
        grad.addColorStop(0.5, def.color);
        grad.addColorStop(1, darkenColor(def.color, 0.5));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Icon
        ctx.fillStyle = '#fff';
        ctx.font = `${r}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(def.icon, 0, 1);

        ctx.restore();
    }

    function drawHalf(ctx, half) {
        const type = half.type;
        const col = type.colors;
        const r = half.radius;

        ctx.save();
        ctx.translate(half.x, half.y);
        ctx.rotate(half.rotation);
        ctx.globalAlpha = Math.max(0, half.life);

        // Clip to half
        ctx.beginPath();
        if (half.side === 'left') {
            ctx.rect(-r - 2, -r - 2, r + 2, (r + 2) * 2);
        } else {
            ctx.rect(0, -r - 2, r + 2, (r + 2) * 2);
        }
        ctx.clip();

        // Outer
        const grad = ctx.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.1, 0, 0, r);
        grad.addColorStop(0, col.light);
        grad.addColorStop(0.6, col.base);
        grad.addColorStop(1, col.dark);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Inner (cut face)
        const innerColor = col.inner || col.light;
        ctx.fillStyle = innerColor;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.75, 0, Math.PI * 2);
        ctx.fill();

        // Seeds for watermelon
        if (type.name === 'watermelon' && col.seeds) {
            ctx.fillStyle = col.seeds;
            for (let i = 0; i < 4; i++) {
                const a = (i / 4) * Math.PI * 2 + 0.3;
                ctx.beginPath();
                ctx.ellipse(Math.cos(a) * r * 0.4, Math.sin(a) * r * 0.4, 2, 3, a, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }

    function drawLives(ctx, lives, maxLives, W) {
        const startX = W - 30;
        for (let i = 0; i < maxLives; i++) {
            ctx.fillStyle = i < lives ? '#ff3344' : '#333';
            ctx.font = '20px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('❤️', startX - i * 28, 22);
        }
    }

    function drawPowerupIndicators(ctx, activeList, H) {
        let y = H - 40;
        for (const p of activeList) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(8, y - 16, 140, 24);
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 1;
            ctx.strokeRect(8, y - 16, 140, 24);

            ctx.fillStyle = p.color;
            ctx.font = '12px Rajdhani, sans-serif';
            ctx.textAlign = 'left';
            const timeStr = p.remaining > 0 ? ` ${Math.ceil(p.remaining)}s` : ' READY';
            ctx.fillText(p.icon + ' ' + p.name + timeStr, 14, y);
            y -= 30;
        }
    }

    function hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `${r},${g},${b}`;
    }

    function darkenColor(hex, factor) {
        const r = Math.floor(parseInt(hex.slice(1, 3), 16) * factor);
        const g = Math.floor(parseInt(hex.slice(3, 5), 16) * factor);
        const b = Math.floor(parseInt(hex.slice(5, 7), 16) * factor);
        return `rgb(${r},${g},${b})`;
    }

    return {
        THEMES, getRandomTheme,
        drawBackground, drawFruit, drawBomb, drawPowerupItem,
        drawHalf, drawLives, drawPowerupIndicators
    };
})();
