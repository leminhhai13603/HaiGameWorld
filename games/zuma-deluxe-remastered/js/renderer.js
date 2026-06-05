/**
 * Zuma Deluxe Remastered - Renderer
 * Canvas rendering for all visual elements
 */
const Renderer = (() => {
    let _bgCache = null;
    let _bgTheme = null;

    /**
     * Draw themed background
     */
    function drawBackground(ctx, W, H, theme) {
        // Cache background gradient
        if (_bgTheme !== theme.name || !_bgCache) {
            _bgTheme = theme.name;
            _bgCache = ctx.createLinearGradient(0, 0, 0, H);
            _bgCache.addColorStop(0, theme.bg1);
            _bgCache.addColorStop(1, theme.bg2);
        }
        ctx.fillStyle = _bgCache;
        ctx.fillRect(0, 0, W, H);

        // Decorative dots
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = theme.accent;
        for (let i = 0; i < 30; i++) {
            const x = ((i * 137 + 50) % W);
            const y = ((i * 211 + 30) % H);
            const r = 1 + (i % 3);
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    /**
     * Draw the marble track path
     */
    function drawPath(ctx, path, theme) {
        const pts = path.points;
        if (pts.length < 2) return;

        // Outer border
        ctx.strokeStyle = theme.pathBorder;
        ctx.lineWidth = MarbleManager.MARBLE_DIAMETER + 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i += 3) {
            ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.stroke();

        // Inner path
        ctx.strokeStyle = theme.path;
        ctx.lineWidth = MarbleManager.MARBLE_DIAMETER;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i += 3) {
            ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.stroke();

        // End marker (skull)
        const endPt = path.getPointAtDist(path.totalLength);
        ctx.fillStyle = '#ff3333';
        ctx.globalAlpha = 0.6 + Math.sin(Date.now() * 0.005) * 0.2;
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💀', endPt.x, endPt.y);
        ctx.globalAlpha = 1;
    }

    /**
     * Draw all marbles in the train
     */
    function drawMarbles(ctx, marbles, path, theme) {
        for (let i = marbles.length - 1; i >= 0; i--) {
            const m = marbles[i];
            if (m.removing && m.scale <= 0) continue;
            const pos = path.getPointAtDist(m.dist);
            drawSingleMarble(ctx, pos.x, pos.y, m, theme);
        }
    }

    /**
     * Draw a single marble
     */
    function drawSingleMarble(ctx, x, y, marble, theme) {
        const col = MARBLE_COLORS[marble.color] || MARBLE_COLORS[0];
        const r = MarbleManager.MARBLE_RADIUS * (marble.scale || 1);

        if (r <= 0) return;

        ctx.save();

        // Glow for special marbles
        if (marble.special && !marble.removing) {
            ctx.shadowColor = col.glow;
            ctx.shadowBlur = 12;
        }

        // Flash effect
        if (marble.flash > 0) {
            ctx.globalAlpha = 0.5 + marble.flash * 0.5;
        }

        // Main circle
        const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
        grad.addColorStop(0, col.light);
        grad.addColorStop(0.6, col.fill);
        grad.addColorStop(1, col.dark);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath();
        ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.35, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Special marble icon
        if (marble.special && !marble.removing) {
            ctx.font = `${Math.floor(r)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const icons = { bomb: '💣', lightning: '⚡', rainbow: '🌈', freeze: '❄️', reverse: '↩️' };
            ctx.fillText(icons[marble.special] || '✨', x, y);
        }

        ctx.restore();
    }

    /**
     * Draw the launcher (frog/totem)
     */
    function drawLauncher(ctx, launcher, theme) {
        const { x, y, angle, recoilTimer, swapAnim } = launcher;

        ctx.save();
        ctx.translate(x, y);

        // Base glow
        const pulse = 0.3 + Math.sin(Date.now() * 0.003) * 0.1;
        ctx.fillStyle = `rgba(${hexToRgb(theme.accent)}, ${pulse})`;
        ctx.beginPath();
        ctx.arc(0, 0, Launcher.LAUNCHER_RADIUS + 8, 0, Math.PI * 2);
        ctx.fill();

        // Base circle
        const baseGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, Launcher.LAUNCHER_RADIUS);
        baseGrad.addColorStop(0, '#4a6a3a');
        baseGrad.addColorStop(0.7, '#2d4a1a');
        baseGrad.addColorStop(1, '#1a3010');
        ctx.fillStyle = baseGrad;
        ctx.beginPath();
        ctx.arc(0, 0, Launcher.LAUNCHER_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = theme.accent;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Barrel
        const recoil = recoilTimer > 0 ? Math.sin(recoilTimer * Math.PI) * 6 : 0;
        ctx.rotate(angle);
        ctx.fillStyle = '#3d5a2a';
        ctx.fillRect(10 - recoil, -6, 24, 12);
        ctx.strokeStyle = theme.accent;
        ctx.lineWidth = 1;
        ctx.strokeRect(10 - recoil, -6, 24, 12);

        // Barrel tip marble preview
        const curCol = MARBLE_COLORS[launcher.currentColor];
        if (curCol) {
            ctx.fillStyle = curCol.fill;
            ctx.beginPath();
            ctx.arc(32 - recoil, 0, 6, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.rotate(-angle);

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-8, -8, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(8, -8, 6, 0, Math.PI * 2);
        ctx.fill();

        // Pupils (follow aim direction)
        const px = Math.cos(angle) * 2;
        const py = Math.sin(angle) * 2;
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(-8 + px, -8 + py, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(8 + px, -8 + py, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Next marble preview (below launcher)
        if (swapAnim > 0) ctx.globalAlpha = 0.5 + swapAnim * 0.5;
        const nextCol = MARBLE_COLORS[launcher.nextColor];
        if (nextCol) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.beginPath();
            ctx.arc(x, y + Launcher.LAUNCHER_RADIUS + 16, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = nextCol.fill;
            ctx.beginPath();
            ctx.arc(x, y + Launcher.LAUNCHER_RADIUS + 16, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath();
            ctx.arc(x - 3, y + Launcher.LAUNCHER_RADIUS + 13, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    /**
     * Draw fired projectile
     */
    function drawProjectile(ctx, launcher) {
        const p = launcher.projectile;
        if (!p) return;
        const col = MARBLE_COLORS[p.color];
        if (!col) return;

        const r = MarbleManager.MARBLE_RADIUS * 0.8;
        const grad = ctx.createRadialGradient(p.x - r * 0.2, p.y - r * 0.2, r * 0.1, p.x, p.y, r);
        grad.addColorStop(0, col.light);
        grad.addColorStop(0.7, col.fill);
        grad.addColorStop(1, col.dark);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();

        // Trail
        ctx.fillStyle = col.fill;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(p.x - p.vx * 0.02, p.y - p.vy * 0.02, r * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    /**
     * Draw aim line
     */
    function drawAimLine(ctx, launcher, theme) {
        if (launcher.projectile) return;
        const { x, y, angle } = launcher;
        ctx.strokeStyle = theme.accent;
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(angle) * 40, y + Math.sin(angle) * 40);
        ctx.lineTo(x + Math.cos(angle) * 120, y + Math.sin(angle) * 120);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
    }

    /**
     * Draw freeze effect overlay
     */
    function drawFreezeEffect(ctx, W, H) {
        ctx.fillStyle = 'rgba(100,200,255,0.08)';
        ctx.fillRect(0, 0, W, H);
    }

    /**
     * Draw screen shake offset (call before drawing)
     */
    function applyShake(ctx, shakeTimer) {
        if (shakeTimer > 0) {
            const intensity = shakeTimer * 3;
            ctx.translate(
                (Math.random() - 0.5) * intensity,
                (Math.random() - 0.5) * intensity
            );
        }
    }

    function hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `${r},${g},${b}`;
    }

    return {
        drawBackground, drawPath, drawMarbles, drawSingleMarble,
        drawLauncher, drawProjectile, drawAimLine,
        drawFreezeEffect, applyShake
    };
})();
