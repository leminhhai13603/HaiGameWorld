/**
 * Boss - Optimized boss with fewer bullets
 */
class Boss {
    constructor(canvasWidth, canvasHeight, waveNumber) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        this.x = canvasWidth / 2;
        this.y = -100;
        this.targetY = 80;

        const tier = Math.floor(waveNumber / 5);
        this.width = 80 + tier * 8;
        this.height = 60 + tier * 6;

        this.maxHealth = 30 + waveNumber * 12;
        this.health = this.maxHealth;
        this.speed = 1;
        this.score = 1500 + waveNumber * 250;

        this.active = true;
        this.entering = true;
        this.phase = 0;
        this.phaseTimer = 0;
        this.attackTimer = 0;
        this.moveDir = 1;
        this.time = 0;

        this.patterns = ['spread', 'aimed', 'spiral', 'rain'];
        this.currentPattern = 0;

        this.phaseThresholds = [0.75, 0.5, 0.25];
        this.currentPhaseIndex = 0;
        this.enraged = false;

        this.hitFlash = 0;
        this.pulseTime = 0;
        this.tier = tier;

        // Cached bounds object (reused, never reallocated)
        this._bounds = { x: 0, y: 0, width: 0, height: 0 };

        this.setTierVisuals();
    }

    setTierVisuals() {
        const colors = [
            { body: '#ff0044', accent: '#cc0033', eye: '#ffcc00' },
            { body: '#8800ff', accent: '#6600cc', eye: '#00ffcc' },
            { body: '#ff6600', accent: '#cc4400', eye: '#ffff00' },
            { body: '#00ff88', accent: '#00cc66', eye: '#ff00ff' },
            { body: '#ff00ff', accent: '#cc00cc', eye: '#00ffff' }
        ];
        const c = colors[Math.min(this.tier || 0, colors.length - 1)];
        this.color = c.body;
        this.accentColor = c.accent;
        this.eyeColor = c.eye;
    }

    update(playerX, playerY, bulletPool, dt) {
        if (!this.active) return;

        this.time += 0.02 * dt;
        this.pulseTime += 0.05 * dt;

        if (this.entering) {
            this.y += 1.5 * dt;
            if (this.y >= this.targetY) {
                this.y = this.targetY;
                this.entering = false;
            }
            return;
        }

        if (this.hitFlash > 0) this.hitFlash -= dt;

        this._checkPhaseTransition();

        this.phaseTimer += dt;
        if (this.phaseTimer > 200) {
            this.phaseTimer = 0;
            this.currentPattern = (this.currentPattern + 1) % this.patterns.length;
            this.phase++;
        }

        this._updateMovement(dt);
        this.attackTimer += dt;
        this._attack(playerX, playerY, bulletPool);
    }

    _checkPhaseTransition() {
        const hp = this.health / this.maxHealth;
        if (this.currentPhaseIndex < this.phaseThresholds.length && hp <= this.phaseThresholds[this.currentPhaseIndex]) {
            this.currentPhaseIndex++;
            if (hp <= 0.25 && !this.enraged) this.enraged = true;
        }
    }

    _updateMovement(dt) {
        const s = this.speed * dt;
        // Simple horizontal bounce only - no sine wave, no tracking
        this.x += s * this.moveDir;
        if (this.x > this.canvasWidth - this.width / 2 - 20) this.moveDir = -1;
        else if (this.x < this.width / 2 + 20) this.moveDir = 1;
        this.x = Math.max(this.width / 2, Math.min(this.canvasWidth - this.width / 2, this.x));
    }

    _attack(playerX, playerY, bulletPool) {
        const pattern = this.patterns[this.currentPattern];
        const spd = this.enraged ? 0.8 : 1;

        switch (pattern) {
            case 'spread':
                if (this.attackTimer % (40 * spd) < 1) this._spreadShot(bulletPool);
                break;
            case 'aimed':
                if (this.attackTimer % (50 * spd) < 1) this._aimedShot(playerX, playerY, bulletPool);
                break;
            case 'spiral':
                if (this.attackTimer % (25 * spd) < 1) this._spiralShot(bulletPool);
                break;
            case 'rain':
                // Slowed down significantly: 25 instead of 12 (enraged: 20 instead of 9.6)
                if (this.attackTimer % (25 * spd) < 1) this._rainShot(bulletPool);
                break;
        }
    }

    _spreadShot(bulletPool) {
        const count = this.enraged ? 5 : 3;
        const spread = Math.PI / 4;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI / 2) - spread / 2 + (spread / Math.max(1, count - 1)) * i;
            bulletPool.fire({
                x: this.x, y: this.y + this.height / 2,
                vx: Math.cos(angle) * 3.5, vy: Math.sin(angle) * 3.5,
                width: 7, height: 7, damage: 1, type: 'enemy', color: '#ff4444'
            });
        }
    }

    _aimedShot(playerX, playerY, bulletPool) {
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const count = this.enraged ? 3 : 2;
        const spread = 0.12;

        for (let i = 0; i < count; i++) {
            const offset = (i - Math.floor(count / 2)) * spread;
            const angle = Math.atan2(dy, dx) + offset;
            bulletPool.fire({
                x: this.x, y: this.y + this.height / 2,
                vx: Math.cos(angle) * 4, vy: Math.sin(angle) * 4,
                width: 7, height: 7, damage: 1, type: 'enemy', color: '#ffaa00'
            });
        }
    }

    _spiralShot(bulletPool) {
        const angle = this.time * 6;
        bulletPool.fire({
            x: this.x, y: this.y + this.height / 2,
            vx: Math.cos(angle) * 2.5, vy: Math.sin(angle) * 2.5 + 1.5,
            width: 5, height: 5, damage: 1, type: 'enemy', color: '#ff88ff'
        });
        if (this.enraged) {
            bulletPool.fire({
                x: this.x, y: this.y + this.height / 2,
                vx: Math.cos(angle + Math.PI) * 2.5, vy: Math.sin(angle + Math.PI) * 2.5 + 1.5,
                width: 5, height: 5, damage: 1, type: 'enemy', color: '#ff88ff'
            });
        }
    }

    _rainShot(bulletPool) {
        const count = this.enraged ? 3 : 2;
        for (let i = 0; i < count; i++) {
            bulletPool.fire({
                x: this.x + (Math.random() - 0.5) * this.width,
                y: this.y + this.height / 2,
                vx: (Math.random() - 0.5) * 1, vy: 3 + Math.random() * 1.5,
                width: 5, height: 5, damage: 1, type: 'enemy', color: '#ff4444'
            });
        }
    }

    takeDamage(damage) {
        this.health -= damage;
        this.hitFlash = 6;
        if (this.health <= 0) { this.active = false; return true; }
        return false;
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        const bodyColor = this.hitFlash > 0 ? '#fff' : this.color;
        const accentColor = this.hitFlash > 0 ? '#ddd' : this.accentColor;

        // Body
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);
        ctx.lineTo(-this.width / 2, 0);
        ctx.lineTo(-this.width / 3, this.height / 2);
        ctx.lineTo(this.width / 3, this.height / 2);
        ctx.lineTo(this.width / 2, 0);
        ctx.closePath();
        ctx.fill();

        // Inner diamond
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 3);
        ctx.lineTo(-this.width / 3, 0);
        ctx.lineTo(0, this.height / 3);
        ctx.lineTo(this.width / 3, 0);
        ctx.closePath();
        ctx.fill();

        // Wings
        const wing = Math.sin(this.time * 5) * 6;
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.moveTo(-this.width / 3, 0);
        ctx.lineTo(-this.width / 2 - 18, -10 + wing);
        ctx.lineTo(-this.width / 2 - 14, 15);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(this.width / 3, 0);
        ctx.lineTo(this.width / 2 + 18, -10 - wing);
        ctx.lineTo(this.width / 2 + 14, 15);
        ctx.closePath();
        ctx.fill();

        // Eyes
        ctx.fillStyle = this.eyeColor;
        ctx.beginPath();
        ctx.arc(-this.width / 5, -this.height / 6, 8, 0, Math.PI * 2);
        ctx.arc(this.width / 5, -this.height / 6, 8, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = '#f00';
        ctx.beginPath();
        ctx.arc(-this.width / 5 + 2, -this.height / 6, 4, 0, Math.PI * 2);
        ctx.arc(this.width / 5 + 2, -this.height / 6, 4, 0, Math.PI * 2);
        ctx.fill();

        // Mouth
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.moveTo(-this.width / 4, this.height / 6);
        ctx.quadraticCurveTo(0, this.height / 4 + Math.sin(this.time * 3) * 3, this.width / 4, this.height / 6);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        // Health bar
        this._drawHealthBar(ctx);
    }

    _drawHealthBar(ctx) {
        const barW = 200;
        const barH = 12;
        const barX = this.canvasWidth / 2 - barW / 2;
        const barY = 20;

        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);

        const hp = this.health / this.maxHealth;
        ctx.fillStyle = this.enraged ? '#ff2222' : '#ff4444';
        ctx.fillRect(barX, barY, barW * hp, barH);

        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX - 2, barY - 2, barW + 4, barH + 4);

        ctx.fillStyle = this.enraged ? '#f44' : '#fff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        const name = this.patterns[this.currentPattern].toUpperCase();
        ctx.fillText(`BOSS - ${name}${this.enraged ? ' [ENRAGED]' : ''}`, this.canvasWidth / 2, barY - 5);
    }

    getBounds() {
        this._bounds.x = this.x - this.width / 2;
        this._bounds.y = this.y - this.height / 2;
        this._bounds.width = this.width;
        this._bounds.height = this.height;
        return this._bounds;
    }
}
