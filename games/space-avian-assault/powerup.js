/**
 * PowerUp - Collectible power-up items
 */
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 26;
        this.height = 26;
        this.active = true;
        this.speed = 1.5;
        this.time = 0;
        this.bobOffset = Math.random() * Math.PI * 2;

        // Visual properties based on type
        this.setVisuals();
    }

    // Set color and symbol based on type
    setVisuals() {
        switch (this.type) {
            case 'rapidFire':
                this.color = '#ffaa00';
                this.symbol = '⚡';
                this.label = 'RAPID';
                break;
            case 'doubleShot':
                this.color = '#00ff00';
                this.symbol = '◆';
                this.label = 'x2';
                break;
            case 'tripleShot':
                this.color = '#00ffff';
                this.symbol = '✦';
                this.label = 'x3';
                break;
            case 'laser':
                this.color = '#ff00ff';
                this.symbol = '║';
                this.label = 'LSR';
                break;
            case 'shield':
                this.color = '#4488ff';
                this.symbol = '◎';
                this.label = 'SHD';
                break;
            case 'health':
                this.color = '#ff4444';
                this.symbol = '+';
                this.label = 'HP';
                break;
        }
    }

    // Update power-up
    update(canvasHeight, dt = 1) {
        if (!this.active) return;

        this.y += this.speed * dt;
        this.time += 0.05 * dt;

        // Deactivate if off screen
        if (this.y > canvasHeight + 30) {
            this.active = false;
        }
    }

    // Draw power-up
    draw(ctx) {
        if (!this.active) return;

        ctx.save();

        // Bobbing effect
        const bob = Math.sin(this.time + this.bobOffset) * 4;
        const drawY = this.y + bob;

        // Glow
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 20;

        // Outer rotating border
        const angle = this.time * 2;
        const r = this.width / 2 + 4;

        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.6;

        // Rotating corners
        for (let i = 0; i < 4; i++) {
            const a = angle + (Math.PI / 2) * i;
            const sx = this.x + Math.cos(a) * r;
            const sy = drawY + Math.sin(a) * r;
            ctx.beginPath();
            ctx.arc(sx, sy, 2, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.globalAlpha = 1;

        // Main box
        ctx.fillStyle = this.color + '22';
        ctx.fillRect(
            this.x - this.width / 2,
            drawY - this.height / 2,
            this.width,
            this.height
        );

        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(
            this.x - this.width / 2,
            drawY - this.height / 2,
            this.width,
            this.height
        );

        // Symbol
        ctx.fillStyle = this.color;
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.symbol, this.x, drawY);

        // Label below
        ctx.font = 'bold 8px monospace';
        ctx.fillStyle = '#fff';
        ctx.fillText(this.label, this.x, drawY + this.height / 2 + 10);

        ctx.restore();
    }

    // Get bounding box
    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    // Apply power-up to player
    apply(player) {
        switch (this.type) {
            case 'rapidFire':
                player.setWeapon('rapidFire', 600);
                break;
            case 'doubleShot':
                player.setWeapon('doubleShot', 600);
                break;
            case 'tripleShot':
                player.setWeapon('tripleShot', 600);
                break;
            case 'laser':
                player.setWeapon('laser', 480);
                break;
            case 'shield':
                player.activateShield(600);
                break;
            case 'health':
                player.heal(2);
                break;
        }
    }
}

/**
 * PowerUpManager - Manages power-up spawning and collection
 */
class PowerUpManager {
    constructor() {
        this.powerups = [];
        this.spawnChance = 0.025;
    }

    // Spawn a random power-up at position
    spawn(x, y) {
        const types = ['rapidFire', 'doubleShot', 'tripleShot', 'laser', 'shield', 'health'];
        const weights = [25, 20, 15, 10, 15, 15];

        // Weighted random selection
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        let selectedType = types[0];

        for (let i = 0; i < types.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                selectedType = types[i];
                break;
            }
        }

        this.powerups.push(new PowerUp(x, y, selectedType));
    }

    // Update all power-ups
    update(canvasHeight, dt = 1) {
        let write = 0;
        for (let i = 0; i < this.powerups.length; i++) {
            this.powerups[i].update(canvasHeight, dt);
            if (this.powerups[i].active) this.powerups[write++] = this.powerups[i];
        }
        this.powerups.length = write;
    }

    // Draw all power-ups
    draw(ctx) {
        for (let i = 0; i < this.powerups.length; i++) {
            this.powerups[i].draw(ctx);
        }
    }

    // Check collection by player
    checkCollection(playerBounds, player) {
        const collected = [];
        let write = 0;

        for (let i = 0; i < this.powerups.length; i++) {
            const pu = this.powerups[i];
            const puBounds = pu.getBounds();

            if (this._collides(playerBounds, puBounds)) {
                pu.apply(player);
                collected.push(pu.type);
                pu.active = false;
            } else {
                this.powerups[write++] = pu;
            }
        }
        this.powerups.length = write;

        return collected;
    }

    // Collision check
    _collides(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    // Clear all power-ups
    clear() {
        this.powerups = [];
    }
}
