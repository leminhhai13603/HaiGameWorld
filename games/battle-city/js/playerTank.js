/**
 * Battle City - Player Tank
 * ALL coordinates in canvas space (y includes HUD_H)
 */
class PlayerTank {
    constructor(playerNum, x, y) {
        this.playerNum = playerNum;
        this.x = x; this.y = y; // canvas coords
        this.w = CELL - 4; this.h = CELL - 4;
        this.dir = Dir.UP;
        this.speed = 2;
        this.bulletSpeed = 5;
        this.active = true;
        this.lives = 3;
        this.level = 0;
        this.shieldTimer = 120;
        this.spawnTimer = 60;
        this.frozen = false;
        this.frozenTimer = 0;
        this.color = playerNum === 1 ? '#ffcc00' : '#00ccff';
        this.strongBullets = false;
    }

    upgrade() {
        this.level = Math.min(4, this.level + 1);
        if (this.level >= 3) this.strongBullets = true;
        this.bulletSpeed = this.level >= 2 ? 7 : this.level >= 1 ? 6 : 5;
    }

    resetAfterDeath() {
        this.level = 0;
        this.strongBullets = false;
        this.bulletSpeed = 5;
        this.shieldTimer = 120;
    }

    update(keys, map, bulletSys) {
        if (!this.active) return;
        if (this.spawnTimer > 0) { this.spawnTimer--; return; }
        if (this.frozen) { this.frozenTimer--; if (this.frozenTimer <= 0) this.frozen = false; return; }
        if (this.shieldTimer > 0) this.shieldTimer--;

        let dx = 0, dy = 0, moved = false;

        if (this.playerNum === 1) {
            if (keys['w'] || keys['W']) { dy = -this.speed; this.dir = Dir.UP; moved = true; }
            else if (keys['s'] || keys['S']) { dy = this.speed; this.dir = Dir.DOWN; moved = true; }
            else if (keys['a'] || keys['A']) { dx = -this.speed; this.dir = Dir.LEFT; moved = true; }
            else if (keys['d'] || keys['D']) { dx = this.speed; this.dir = Dir.RIGHT; moved = true; }
        } else {
            if (keys['ArrowUp']) { dy = -this.speed; this.dir = Dir.UP; moved = true; }
            else if (keys['ArrowDown']) { dy = this.speed; this.dir = Dir.DOWN; moved = true; }
            else if (keys['ArrowLeft']) { dx = -this.speed; this.dir = Dir.LEFT; moved = true; }
            else if (keys['ArrowRight']) { dx = this.speed; this.dir = Dir.RIGHT; moved = true; }
        }

        if (moved) {
            let nx = Math.max(0, Math.min(MAP_W - this.w, this.x + dx));
            let ny = Math.max(HUD_H, Math.min(CANVAS_H - this.h, this.y + dy));
            if (map.canMoveRect(nx, ny, this.w, this.h)) {
                this.x = nx; this.y = ny;
            }
        }

        // Shoot
        const shootKey = this.playerNum === 1 ? ' ' : 'Enter';
        if (keys[shootKey]) {
            keys[shootKey] = false;
            this._shoot(bulletSys);
        }
    }

    _shoot(bulletSys) {
        const maxBullets = this.level >= 2 ? 2 : 1;
        if (bulletSys.getActive(`player${this.playerNum}`).length >= maxBullets) return;

        let bx = this.x + this.w / 2;
        let by = this.y + this.h / 2;
        const off = this.w / 2 + 4;

        switch (this.dir) {
            case Dir.UP: by -= off; break;
            case Dir.DOWN: by += off; break;
            case Dir.LEFT: bx -= off; break;
            case Dir.RIGHT: bx += off; break;
        }

        bulletSys.fire(bx, by, this.dir, this.bulletSpeed, `player${this.playerNum}`, this.strongBullets);
        AudioManager.play('shoot');
    }

    draw(ctx) {
        if (!this.active) return;
        const x = this.x, y = this.y; // already canvas coords

        if (this.spawnTimer > 0) {
            const pulse = Math.sin(this.spawnTimer * 0.3) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(255,255,255,${pulse})`;
            ctx.fillRect(x, y, this.w, this.h);
            return;
        }

        // Shield
        if (this.shieldTimer > 0) {
            ctx.strokeStyle = this.shieldTimer % 4 < 2 ? '#fff' : '#00ffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x + this.w/2, y + this.h/2, this.w/2 + 3, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Body
        ctx.fillStyle = this.color;
        ctx.fillRect(x + 4, y + 2, this.w - 8, this.h - 4);
        ctx.fillRect(x + 2, y + 6, this.w - 4, this.h - 12);

        // Turret
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x + this.w/2, y + this.h/2, 5, 0, Math.PI * 2);
        ctx.fill();

        // Barrel
        ctx.fillStyle = this.color;
        const cx = x + this.w/2, cy = y + this.h/2;
        switch (this.dir) {
            case Dir.UP: ctx.fillRect(cx-2, y-2, 4, cy-y+2); break;
            case Dir.DOWN: ctx.fillRect(cx-2, cy, 4, y+this.h-cy+2); break;
            case Dir.LEFT: ctx.fillRect(x-2, cy-2, cx-x+2, 4); break;
            case Dir.RIGHT: ctx.fillRect(cx, cy-2, x+this.w-cx+2, 4); break;
        }

        // Level dots
        if (this.level > 0) {
            ctx.fillStyle = '#ff4444';
            for (let i = 0; i < this.level; i++) ctx.fillRect(x+2+i*4, y+this.h-4, 3, 3);
        }

        // Frozen
        if (this.frozen) {
            ctx.fillStyle = 'rgba(100,150,255,0.3)';
            ctx.fillRect(x, y, this.w, this.h);
        }
    }

    getBounds() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
}
