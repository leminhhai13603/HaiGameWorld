/**
 * Battle City - Enemy Tank
 * ALL coordinates in canvas space
 */
class EnemyTank {
    constructor(type, x, y, aiType, hasPowerup) {
        this.type = type;
        this.x = x; this.y = y;
        this.w = CELL - 4; this.h = CELL - 4;
        this.dir = Dir.DOWN;
        this.active = true;
        this.hasPowerup = hasPowerup || false;
        this.aiType = aiType || AIType.PATROL;
        this.flashTimer = 0;
        this.spawnTimer = 60;
        this.shootTimer = 60 + Math.random() * 60;
        this.dirChangeTimer = 60 + Math.random() * 120;
        this.stuckTimer = 0;
        this._setType(type);
    }

    _setType(type) {
        switch (type) {
            case EnemyType.BASIC: this.health=1; this.speed=1.2; this.bulletSpeed=3; this.color='#aaa'; this.score=100; break;
            case EnemyType.FAST: this.health=1; this.speed=2.5; this.bulletSpeed=3; this.color='#ff6666'; this.score=200; break;
            case EnemyType.POWER: this.health=1; this.speed=1.5; this.bulletSpeed=6; this.color='#66ff66'; this.score=300; break;
            case EnemyType.ARMOR: this.health=4; this.speed=1.0; this.bulletSpeed=3; this.color='#ffaa00'; this.score=400; break;
        }
    }

    hit() {
        this.health--;
        this.flashTimer = 10;
        if (this.health <= 0) { this.active = false; return true; }
        return false;
    }

    update(map, bulletSys, enemies) {
        if (!this.active) return;
        if (this.spawnTimer > 0) { this.spawnTimer--; return; }
        if (this.flashTimer > 0) this.flashTimer--;
        this.shootTimer--;
        this.dirChangeTimer--;

        // AI direction change
        if (this.dirChangeTimer <= 0 || this.stuckTimer > 15) {
            this.dir = Math.floor(Math.random() * 4);
            this.dirChangeTimer = 40 + Math.random() * 80;
            this.stuckTimer = 0;
        }

        // Move
        const dx = [0, this.speed, 0, -this.speed][this.dir];
        const dy = [-this.speed, 0, this.speed, 0][this.dir];
        let nx = Math.max(0, Math.min(MAP_W - this.w, this.x + dx));
        let ny = Math.max(HUD_H, Math.min(CANVAS_H - this.h, this.y + dy));

        if (map.canMoveRect(nx, ny, this.w, this.h) && !this._collidesEnemies(nx, ny, enemies)) {
            this.x = nx; this.y = ny;
            this.stuckTimer = 0;
        } else {
            this.stuckTimer++;
        }

        // Shoot
        if (this.shootTimer <= 0) {
            this._shoot(bulletSys);
            this.shootTimer = 60 + Math.random() * 60;
        }
    }

    _collidesEnemies(nx, ny, enemies) {
        for (const e of enemies) {
            if (e === this || !e.active || e.spawnTimer > 0) continue;
            if (nx < e.x + e.w && nx + this.w > e.x && ny < e.y + e.h && ny + this.h > e.y) return true;
        }
        return false;
    }

    _shoot(bulletSys) {
        let bx = this.x + this.w / 2;
        let by = this.y + this.h / 2;
        const off = this.w / 2 + 4;
        switch (this.dir) {
            case Dir.UP: by -= off; break;
            case Dir.DOWN: by += off; break;
            case Dir.LEFT: bx -= off; break;
            case Dir.RIGHT: bx += off; break;
        }
        bulletSys.fire(bx, by, this.dir, this.bulletSpeed, 'enemy', false);
    }

    draw(ctx) {
        if (!this.active) return;
        const x = this.x, y = this.y;

        if (this.spawnTimer > 0) {
            const pulse = Math.sin(this.spawnTimer * 0.3) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(255,255,255,${pulse})`;
            ctx.fillRect(x, y, this.w, this.h);
            return;
        }

        const color = this.flashTimer > 0 ? '#fff' : this.color;

        // Body
        ctx.fillStyle = color;
        ctx.fillRect(x + 4, y + 2, this.w - 8, this.h - 4);
        ctx.fillRect(x + 2, y + 6, this.w - 4, this.h - 12);

        // Turret
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.arc(x + this.w/2, y + this.h/2, 5, 0, Math.PI * 2);
        ctx.fill();

        // Barrel
        ctx.fillStyle = color;
        const cx = x + this.w/2, cy = y + this.h/2;
        switch (this.dir) {
            case Dir.UP: ctx.fillRect(cx-2, y-2, 4, cy-y+2); break;
            case Dir.DOWN: ctx.fillRect(cx-2, cy, 4, y+this.h-cy+2); break;
            case Dir.LEFT: ctx.fillRect(x-2, cy-2, cx-x+2, 4); break;
            case Dir.RIGHT: ctx.fillRect(cx, cy-2, x+this.w-cx+2, 4); break;
        }

        // Powerup flash
        if (this.hasPowerup) {
            ctx.strokeStyle = Math.floor(Date.now()/200) % 2 ? '#ff0' : '#f00';
            ctx.lineWidth = 2;
            ctx.strokeRect(x-1, y-1, this.w+2, this.h+2);
        }

        // Armor HP
        if (this.type === EnemyType.ARMOR && this.health > 1) {
            ctx.fillStyle = '#fff';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`${this.health}`, cx, y + this.h + 10);
        }
    }

    getBounds() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
}
