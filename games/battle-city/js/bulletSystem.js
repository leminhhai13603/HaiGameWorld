/**
 * Battle City - Bullet System
 * ALL coordinates in canvas space
 */
class Bullet {
    constructor(x, y, dir, speed, owner, strong) {
        this.x = x; this.y = y;
        this.dir = dir; this.speed = speed;
        this.owner = owner; this.strong = strong || false;
        this.active = true; this.size = 6;
    }

    update(map) {
        if (!this.active) return;
        const s = this.speed;
        this.x += [0, s, 0, -s][this.dir];
        this.y += [-s, 0, s, 0][this.dir];

        // Out of bounds
        if (this.x < 0 || this.x > MAP_W || this.y < HUD_H || this.y > CANVAS_H) {
            this.active = false;
            return;
        }

        // Check tile collision at bullet center
        const result = map.bulletHitAt(this.x, this.y, this.strong);
        if (result.hit) {
            if (result.eagleHit) {
                // Don't deactivate here — game manager handles eagle death
            }
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.fillStyle = this.strong ? '#ffaa00' : '#fff';
        ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
    }

    getBounds() {
        return { x: this.x - this.size/2, y: this.y - this.size/2, w: this.size, h: this.size };
    }
}

class BulletSystem {
    constructor() { this.bullets = []; }

    fire(x, y, dir, speed, owner, strong) {
        const active = this.bullets.filter(b => b.active && b.owner === owner).length;
        if (owner.startsWith('player') && active >= (strong ? 2 : 1)) return null;
        if (owner === 'enemy' && active >= 1) return null;
        const b = new Bullet(x, y, dir, speed, owner, strong);
        this.bullets.push(b);
        return b;
    }

    update(map) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].update(map);
            if (!this.bullets[i].active) this.bullets.splice(i, 1);
        }
    }

    draw(ctx) {
        for (const b of this.bullets) b.draw(ctx);
    }

    clear() { this.bullets = []; }

    getActive(owner) {
        return this.bullets.filter(b => b.active && b.owner === owner);
    }
}
