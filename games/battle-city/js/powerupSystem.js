/**
 * Battle City - Powerup System
 */
class Powerup {
    constructor(type, x, y) {
        this.type = type; this.x = x; this.y = y;
        this.w = CELL; this.h = CELL;
        this.active = true;
        this.timer = 600; // 10 seconds
        this.flashTimer = 0;
    }

    update() {
        this.timer--;
        this.flashTimer++;
        if (this.timer <= 0) this.active = false;
    }

    draw(ctx) {
        if (!this.active) return;
        if (this.timer < 120 && this.flashTimer % 8 < 4) return; // Blink when expiring

        const x = this.x;
        const y = this.y + HUD_H;
        const icons = ['⭐', '💣', '🛡️', '🧱', '🏆', '⏰'];
        const colors = ['#ffcc00', '#ff4444', '#00ccff', '#886622', '#44ff44', '#aa88ff'];

        ctx.fillStyle = colors[this.type];
        ctx.fillRect(x, y, this.w, this.h);
        ctx.fillStyle = '#000';
        ctx.font = `${this.w - 4}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icons[this.type], x + this.w / 2, y + this.h / 2);
    }

    getBounds() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
}

class PowerupSystem {
    constructor() { this.powerups = []; }

    spawn(x, y) {
        const type = Math.floor(Math.random() * 6);
        this.powerups.push(new Powerup(type, x, y));
    }

    update() {
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            this.powerups[i].update();
            if (!this.powerups[i].active) this.powerups.splice(i, 1);
        }
    }

    draw(ctx) {
        for (const p of this.powerups) p.draw(ctx);
    }

    checkCollision(player) {
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            if (!p.active) continue;
            if (this._collides(player.getBounds(), p.getBounds())) {
                p.active = false;
                this.powerups.splice(i, 1);
                return p.type;
            }
        }
        return null;
    }

    _collides(a, b) {
        return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }

    clear() { this.powerups = []; }
}
