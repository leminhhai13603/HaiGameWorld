/**
 * Battle City - Boss Manager
 * ALL coordinates in canvas space
 */
class BossTank {
    constructor(level, x, y) {
        this.x = x; this.y = y;
        this.w = CELL * 2 - 4; this.h = CELL * 2 - 4;
        this.dir = Dir.DOWN;
        this.active = true;
        this.speed = 1; this.bulletSpeed = 4;
        this.score = 2000; this.phase = 0;
        this.shootTimer = 30; this.dirChangeTimer = 60;
        this.flashTimer = 0; this.spawnTimer = 90;
        this.stuckTimer = 0;
        this.tier = Math.floor(level / 10);
        this._setStats(level);
    }

    _setStats(level) {
        switch (level) {
            case 10: this.maxHealth=10; this.color='#ff4444'; this.name='IRON TANK'; this.phases=2; break;
            case 20: this.maxHealth=15; this.color='#aa44ff'; this.name='DARK TANK'; this.phases=3; break;
            case 30: this.maxHealth=20; this.color='#44aaff'; this.name='ICE TANK'; this.phases=3; break;
            case 35: this.maxHealth=30; this.color='#ff8800'; this.name='FINAL BOSS'; this.phases=4; break;
            default: this.maxHealth=10; this.color='#ff4444'; this.name='BOSS'; this.phases=2;
        }
        this.health = this.maxHealth;
    }

    hit(strong) {
        this.health -= strong ? 2 : 1;
        this.flashTimer = 10;
        if (this.health <= 0) { this.active = false; return true; }
        const newPhase = Math.floor((1 - this.health / this.maxHealth) * this.phases);
        if (newPhase > this.phase) { this.phase = newPhase; this.speed += 0.3; this.bulletSpeed += 1; }
        return false;
    }

    update(map, bulletSys) {
        if (!this.active) return;
        if (this.spawnTimer > 0) { this.spawnTimer--; return; }
        if (this.flashTimer > 0) this.flashTimer--;
        this.shootTimer--; this.dirChangeTimer--;

        if (this.dirChangeTimer <= 0 || this.stuckTimer > 15) {
            this.dir = Math.floor(Math.random() * 4);
            this.dirChangeTimer = 40 + Math.random() * 60;
            this.stuckTimer = 0;
        }

        const dx = [0, this.speed, 0, -this.speed][this.dir];
        const dy = [-this.speed, 0, this.speed, 0][this.dir];
        let nx = Math.max(0, Math.min(MAP_W - this.w, this.x + dx));
        let ny = Math.max(HUD_H, Math.min(CANVAS_H - this.h, this.y + dy));

        if (map.canMoveRect(nx, ny, this.w, this.h)) { this.x = nx; this.y = ny; this.stuckTimer = 0; }
        else { this.stuckTimer++; }

        if (this.shootTimer <= 0) {
            this._shoot(bulletSys);
            if (this.phase >= 2) this._shootSpread(bulletSys);
            this.shootTimer = Math.max(15, 40 - this.phase * 8);
        }
    }

    _shoot(bulletSys) {
        let bx = this.x + this.w/2, by = this.y + this.h/2;
        const off = this.w/2 + 4;
        switch (this.dir) {
            case Dir.UP: by -= off; break; case Dir.DOWN: by += off; break;
            case Dir.LEFT: bx -= off; break; case Dir.RIGHT: bx += off; break;
        }
        bulletSys.fire(bx, by, this.dir, this.bulletSpeed, 'enemy', false);
    }

    _shootSpread(bulletSys) {
        for (const d of [Dir.UP, Dir.DOWN, Dir.LEFT, Dir.RIGHT]) {
            if (d === this.dir) continue;
            let bx = this.x + this.w/2, by = this.y + this.h/2;
            const off = this.w/2 + 4;
            switch (d) {
                case Dir.UP: by -= off; break; case Dir.DOWN: by += off; break;
                case Dir.LEFT: bx -= off; break; case Dir.RIGHT: bx += off; break;
            }
            bulletSys.fire(bx, by, d, this.bulletSpeed - 1, 'enemy', false);
        }
    }

    draw(ctx) {
        if (!this.active) return;
        const x = this.x, y = this.y;
        if (this.spawnTimer > 0) {
            const pulse = Math.sin(this.spawnTimer * 0.3) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(255,0,0,${pulse})`;
            ctx.fillRect(x, y, this.w, this.h); return;
        }
        const color = this.flashTimer > 0 ? '#fff' : this.color;
        ctx.fillStyle = color;
        ctx.fillRect(x+6, y+4, this.w-12, this.h-8);
        ctx.fillRect(x+4, y+8, this.w-8, this.h-16);
        ctx.fillStyle = '#222';
        ctx.beginPath(); ctx.arc(x+this.w/2, y+this.h/2, 8, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = color;
        const cx = x+this.w/2, cy = y+this.h/2;
        switch (this.dir) {
            case Dir.UP: ctx.fillRect(cx-3, y-2, 6, cy-y+2); break;
            case Dir.DOWN: ctx.fillRect(cx-3, cy, 6, y+this.h-cy+2); break;
            case Dir.LEFT: ctx.fillRect(x-2, cy-3, cx-x+2, 6); break;
            case Dir.RIGHT: ctx.fillRect(cx, cy-3, x+this.w-cx+2, 6); break;
        }
        // HP bar
        ctx.fillStyle = '#333'; ctx.fillRect(x, y-8, this.w, 4);
        ctx.fillStyle = this.health > this.maxHealth*0.3 ? '#44ff44' : '#ff4444';
        ctx.fillRect(x, y-8, this.w * (this.health/this.maxHealth), 4);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
        ctx.fillText(this.name, cx, y-12);
    }

    getBounds() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
}
