/**
 * GiftBox - Collectible gift that upgrades weapons
 */
class GiftBox {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 28;
        this.height = 28;
        this.active = true;
        this.speed = 2;
        this.time = 0;
        this.rotation = 0;
        this.bobOffset = Math.random() * Math.PI * 2;

        // Random gift type
        const types = ['rapid', 'spread'];
        this.type = types[Math.floor(Math.random() * types.length)];

        this.setVisuals();
    }

    setVisuals() {
        if (this.type === 'rapid') {
            this.color = '#ffaa00';
            this.label = 'RAPID';
        } else {
            this.color = '#00ffcc';
            this.label = 'SPREAD';
        }
    }

    update(canvasHeight, dt) {
        if (!this.active) return;

        this.y += this.speed * dt;
        this.time += 0.05 * dt;
        this.rotation += 0.03 * dt;

        if (this.y > canvasHeight + 40) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();

        const bob = Math.sin(this.time + this.bobOffset) * 3;
        const drawY = this.y + bob;

        ctx.translate(this.x, drawY);
        ctx.rotate(Math.sin(this.rotation) * 0.15);

        // Gift box shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(-this.width / 2 + 2, -this.height / 2 + 2, this.width, this.height);

        // Gift box body
        const gradient = ctx.createLinearGradient(0, -this.height / 2, 0, this.height / 2);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, this._darken(this.color, 0.6));
        ctx.fillStyle = gradient;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        // Ribbon horizontal
        ctx.fillStyle = '#fff';
        ctx.fillRect(-this.width / 2, -2, this.width, 4);

        // Ribbon vertical
        ctx.fillRect(-2, -this.height / 2, 4, this.height);

        // Bow on top
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(-5, -this.height / 2 - 3, 6, 4, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(5, -this.height / 2 - 3, 6, 4, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Glow
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;
        ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);

        ctx.restore();

        // Label below
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(this.label, this.x, drawY + this.height / 2 + 12);
        ctx.restore();
    }

    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    _darken(hex, factor) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgb(${Math.floor(r * factor)}, ${Math.floor(g * factor)}, ${Math.floor(b * factor)})`;
    }
}

/**
 * Poop - Enemy dropping that damages player and downgrades weapon
 */
class Poop {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = 20;
        this.active = true;
        this.speed = 3;
        this.time = 0;
        this.rotation = Math.random() * Math.PI * 2;
    }

    update(canvasHeight, dt) {
        if (!this.active) return;

        this.y += this.speed * dt;
        this.time += 0.1 * dt;
        this.rotation += 0.05 * dt;

        if (this.y > canvasHeight + 30) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Poop shape - brown splat
        ctx.fillStyle = '#8B4513';

        // Main blob
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Top drip
        ctx.beginPath();
        ctx.ellipse(0, -this.height / 3, 4, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Side drips
        ctx.beginPath();
        ctx.ellipse(-5, 2, 3, 4, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(5, 3, 3, 4, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Darker center
        ctx.fillStyle = '#5C2D0E';
        ctx.beginPath();
        ctx.ellipse(0, 1, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Stink lines
        ctx.strokeStyle = 'rgba(139, 69, 19, 0.5)';
        ctx.lineWidth = 1;
        const stinkOffset = Math.sin(this.time * 3) * 3;

        ctx.beginPath();
        ctx.moveTo(-8, -this.height / 2 - 2);
        ctx.lineTo(-10 + stinkOffset, -this.height / 2 - 8);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2 - 4);
        ctx.lineTo(2 + stinkOffset, -this.height / 2 - 10);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(8, -this.height / 2 - 2);
        ctx.lineTo(10 + stinkOffset, -this.height / 2 - 8);
        ctx.stroke();

        ctx.restore();
    }

    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }
}

/**
 * DropManager - Manages gifts and poop
 */
class DropManager {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.gifts = [];
        this.poops = [];
    }

    // Spawn gift at position
    spawnGift(x, y) {
        this.gifts.push(new GiftBox(x, y));
    }

    // Spawn poop at position
    spawnPoop(x, y) {
        this.poops.push(new Poop(x, y));
    }

    // Update all drops
    update(dt) {
        // Update gifts
        for (let i = this.gifts.length - 1; i >= 0; i--) {
            this.gifts[i].update(this.canvasHeight, dt);
            if (!this.gifts[i].active) {
                this.gifts.splice(i, 1);
            }
        }

        // Update poop
        for (let i = this.poops.length - 1; i >= 0; i--) {
            this.poops[i].update(this.canvasHeight, dt);
            if (!this.poops[i].active) {
                this.poops.splice(i, 1);
            }
        }
    }

    // Draw all drops
    draw(ctx) {
        for (const gift of this.gifts) {
            gift.draw(ctx);
        }
        for (const poop of this.poops) {
            poop.draw(ctx);
        }
    }

    // Check gift collection
    checkGiftCollection(playerBounds) {
        const collected = [];

        for (let i = this.gifts.length - 1; i >= 0; i--) {
            const gift = this.gifts[i];
            if (this._collides(playerBounds, gift.getBounds())) {
                collected.push(gift.type);
                gift.active = false;
                this.gifts.splice(i, 1);
            }
        }

        return collected;
    }

    // Check poop collision
    checkPoopCollision(playerBounds) {
        for (let i = this.poops.length - 1; i >= 0; i--) {
            const poop = this.poops[i];
            if (this._collides(playerBounds, poop.getBounds())) {
                poop.active = false;
                this.poops.splice(i, 1);
                return true;
            }
        }
        return false;
    }

    // Collision check
    _collides(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    // Clear all
    clear() {
        this.gifts = [];
        this.poops = [];
    }
}
