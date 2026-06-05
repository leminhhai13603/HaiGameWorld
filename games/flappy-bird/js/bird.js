/**
 * Flappy Bird - Bird Class
 */
class Bird {
    constructor(x, y) {
        this.startX = x;
        this.startY = y;
        this.x = x;
        this.y = y;
        this.width = 34;
        this.height = 24;
        this.velocity = 0;
        this.gravity = 0.38;
        this.flapForce = -7;
        this.maxFallSpeed = 8;
        this.rotation = 0;
        this.animTimer = 0;
        this.wingPhase = 0;
        this.alive = true;
    }

    flap() {
        if (!this.alive) return;
        this.velocity = this.flapForce;
        this.animTimer = 0;
    }

    update(dt) {
        this.animTimer += dt;
        this.wingPhase = Math.floor(this.animTimer / 5) % 3;

        this.velocity += this.gravity * dt;
        if (this.velocity > this.maxFallSpeed) this.velocity = this.maxFallSpeed;
        this.y += this.velocity * dt;

        // Rotation based on velocity
        if (this.velocity < 0) {
            this.rotation = Math.max(-0.5, this.velocity * 0.06);
        } else {
            this.rotation = Math.min(0.9, this.velocity * 0.08);
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);

        const hw = this.width / 2;
        const hh = this.height / 2;

        // Body (yellow)
        ctx.fillStyle = '#f8c62c';
        ctx.beginPath();
        ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2);
        ctx.fill();

        // Belly (lighter yellow)
        ctx.fillStyle = '#fce76e';
        ctx.beginPath();
        ctx.ellipse(2, 3, hw * 0.6, hh * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wing
        const wingOffsets = [-2, 2, -2]; // up, mid, down
        const wingY = wingOffsets[this.wingPhase];
        ctx.fillStyle = '#e8a820';
        ctx.beginPath();
        ctx.ellipse(-4, wingY, 10, 6, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Eye (white)
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(8, -5, 5, 0, Math.PI * 2);
        ctx.fill();

        // Pupil
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(10, -5, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Beak (orange)
        ctx.fillStyle = '#ff6633';
        ctx.beginPath();
        ctx.moveTo(12, -1);
        ctx.lineTo(22, 1);
        ctx.lineTo(12, 5);
        ctx.closePath();
        ctx.fill();

        // Beak bottom
        ctx.fillStyle = '#cc4422';
        ctx.beginPath();
        ctx.moveTo(12, 3);
        ctx.lineTo(20, 3);
        ctx.lineTo(12, 6);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    getBounds() {
        // Slightly smaller hitbox for fairness
        return {
            x: this.x + 3,
            y: this.y + 3,
            width: this.width - 6,
            height: this.height - 6
        };
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.velocity = 0;
        this.rotation = 0;
        this.animTimer = 0;
        this.alive = true;
    }
}
