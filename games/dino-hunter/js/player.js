/**
 * Dino Hunter - Player Class
 */
class Player {
    constructor(groundY) {
        this.x = 80;
        this.groundY = groundY;
        this.width = 44;
        this.height = 48;
        this.y = groundY - this.height;

        // Physics
        this.velocityY = 0;
        this.gravity = 0.6;
        this.jumpForce = -12;
        this.isGrounded = true;
        this.canDoubleJump = false;
        this.hasDoubleJumped = false;

        // State
        this.state = 'run'; // run, jump, doubleJump, fall, duck, hit, dead
        this.animTimer = 0;
        this.runFrame = 0;
        this.ducking = false;
        this.duckWidth = 56;
        this.duckHeight = 30;

        // Combat
        this.hasShield = false;
        this.shieldTimer = 0;
        this.hasWeapon = false;
        this.weaponTimer = 0;
        this.weaponType = 'laser';
        this.fireTimer = 0;
        this.fireRate = 12; // frames between shots
        this.rapidFire = false;
        this.rapidFireTimer = 0;

        // Magnet
        this.hasMagnet = false;
        this.magnetTimer = 0;

        // Slow mo
        this.slowMo = false;
        this.slowMoTimer = 0;

        // Invulnerable after hit
        this.invulnerable = false;
        this.invulnerableTimer = 0;

        this.alive = true;
    }

    jump() {
        if (!this.alive) return false;
        if (this.state === 'dead') return false;

        if (this.isGrounded) {
            this.velocityY = this.jumpForce;
            this.isGrounded = false;
            this.state = 'jump';
            this.hasDoubleJumped = false;
            return 'jump';
        } else if (this.canDoubleJump && !this.hasDoubleJumped) {
            this.velocityY = this.jumpForce * 0.85;
            this.hasDoubleJumped = true;
            this.state = 'doubleJump';
            return 'doubleJump';
        }
        return false;
    }

    duck(active) {
        if (!this.alive || !this.isGrounded) return;
        this.ducking = active;
        if (active) {
            this.state = 'duck';
            this.height = this.duckHeight;
            this.y = this.groundY - this.height;
        } else {
            this.state = 'run';
            this.height = 48;
            this.y = this.groundY - this.height;
        }
    }

    update(dt) {
        this.animTimer += dt;
        if (this.animTimer % 8 < dt) this.runFrame = (this.runFrame + 1) % 2;

        // Gravity
        if (!this.isGrounded) {
            this.velocityY += this.gravity * dt;
            this.y += this.velocityY * dt;

            if (this.velocityY > 0 && this.state !== 'fall' && this.state !== 'dead') {
                this.state = 'fall';
            }

            if (this.y >= this.groundY - this.height) {
                this.y = this.groundY - this.height;
                this.velocityY = 0;
                this.isGrounded = true;
                if (this.state !== 'dead') {
                    this.state = this.ducking ? 'duck' : 'run';
                }
            }
        }

        // Weapon timer
        if (this.hasWeapon) {
            this.weaponTimer -= dt;
            if (this.weaponTimer <= 0) { this.hasWeapon = false; this.rapidFire = false; }
        }

        // Rapid fire timer
        if (this.rapidFire) {
            this.rapidFireTimer -= dt;
            if (this.rapidFireTimer <= 0) this.rapidFire = false;
        }

        // Shield timer
        if (this.hasShield) {
            this.shieldTimer -= dt;
            if (this.shieldTimer <= 0) this.hasShield = false;
        }

        // Magnet timer
        if (this.hasMagnet) {
            this.magnetTimer -= dt;
            if (this.magnetTimer <= 0) this.hasMagnet = false;
        }

        // Slow mo timer
        if (this.slowMo) {
            this.slowMoTimer -= dt;
            if (this.slowMoTimer <= 0) this.slowMo = false;
        }

        // Invulnerability
        if (this.invulnerable) {
            this.invulnerableTimer -= dt;
            if (this.invulnerableTimer <= 0) this.invulnerable = false;
        }

        // Fire timer
        if (this.hasWeapon) this.fireTimer -= dt;
    }

    getBounds() {
        if (this.ducking && this.isGrounded) {
            return { x: this.x, y: this.y, width: this.duckWidth, height: this.duckHeight };
        }
        return { x: this.x + 4, y: this.y + 4, width: this.width - 8, height: this.height - 8 };
    }

    die() {
        this.alive = false;
        this.state = 'dead';
        this.velocityY = -8;
    }

    hit() {
        if (this.invulnerable) return false;
        if (this.hasShield) { this.hasShield = false; this.invulnerable = true; this.invulnerableTimer = 60; return false; }
        return true; // real hit
    }

    draw(ctx) {
        if (!this.alive && this.state === 'dead') {
            this._drawDino(ctx, '#888');
            return;
        }

        // Invulnerable blink
        if (this.invulnerable && Math.floor(this.invulnerableTimer / 3) % 2 === 0) return;

        const color = '#4a8c5c';
        this._drawDino(ctx, color);

        // Shield visual
        if (this.hasShield) {
            ctx.strokeStyle = 'rgba(100,200,255,0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2 + 8, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Weapon indicator
        if (this.hasWeapon) {
            ctx.fillStyle = '#ff0';
            ctx.fillRect(this.x, this.y - 8, this.width * (this.weaponTimer / 600), 3);
        }

        // Magnet indicator
        if (this.hasMagnet) {
            ctx.strokeStyle = 'rgba(255,200,0,0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 60, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    _drawDino(ctx, color) {
        const x = this.x;
        const y = this.y;
        const dark = '#2d6b3e';
        const light = '#6adb8a';
        const belly = '#c8f0d0';

        if (this.ducking && this.isGrounded) {
            // Ducking - low profile T-Rex
            ctx.save();
            // Body (flattened)
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.ellipse(x + 28, y + 14, 28, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = dark; ctx.lineWidth = 1.5; ctx.stroke();
            // Belly
            ctx.fillStyle = belly;
            ctx.beginPath();
            ctx.ellipse(x + 28, y + 16, 20, 7, 0, 0, Math.PI * 2);
            ctx.fill();
            // Head
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.ellipse(x + 50, y + 8, 10, 10, -0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = dark; ctx.stroke();
            // Jaw
            ctx.fillStyle = color;
            ctx.fillRect(x + 52, y + 12, 10, 5);
            ctx.fillStyle = '#fff';
            ctx.fillRect(x + 56, y + 13, 4, 1);
            // Eye
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(x + 52, y + 5, 4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#111';
            ctx.beginPath(); ctx.arc(x + 53, y + 5, 2, 0, Math.PI * 2); ctx.fill();
            // Spine bumps
            ctx.fillStyle = light;
            for (let i = 0; i < 5; i++) {
                ctx.beginPath(); ctx.arc(x + 10 + i * 9, y + 3, 3, 0, Math.PI * 2); ctx.fill();
            }
            // Legs
            const legOff = this.runFrame * 4;
            ctx.fillStyle = color;
            ctx.fillRect(x + 14 + legOff, y + 22, 6, 8);
            ctx.fillRect(x + 32 - legOff, y + 22, 6, 8);
            ctx.fillStyle = dark;
            ctx.fillRect(x + 14 + legOff, y + 26, 7, 4);
            ctx.fillRect(x + 31 - legOff, y + 26, 7, 4);
            // Tail
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(x, y + 10);
            ctx.lineTo(x - 8, y + 6);
            ctx.lineTo(x - 6, y + 14);
            ctx.lineTo(x, y + 16);
            ctx.closePath(); ctx.fill();
            ctx.restore();
            return;
        }

        ctx.save();

        // Tail
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 16);
        ctx.lineTo(x - 10, y + 10);
        ctx.lineTo(x - 12, y + 14);
        ctx.lineTo(x - 8, y + 20);
        ctx.lineTo(x + 2, y + 22);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = dark; ctx.lineWidth = 1; ctx.stroke();

        // Body (oval)
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(x + 20, y + 22, 16, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = dark; ctx.lineWidth = 1.5; ctx.stroke();

        // Belly
        ctx.fillStyle = belly;
        ctx.beginPath();
        ctx.ellipse(x + 20, y + 26, 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Spine ridges
        ctx.fillStyle = light;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.arc(x + 6 + i * 7, y + 9, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Head
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(x + 36, y + 8, 14, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = dark; ctx.lineWidth = 1.5; ctx.stroke();

        // Snout / jaw
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x + 40, y + 10);
        ctx.lineTo(x + 54, y + 8);
        ctx.lineTo(x + 54, y + 16);
        ctx.lineTo(x + 40, y + 18);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = dark; ctx.stroke();

        // Teeth
        ctx.fillStyle = '#fff';
        ctx.fillRect(x + 44, y + 14, 2, 3);
        ctx.fillRect(x + 48, y + 14, 2, 3);
        ctx.fillRect(x + 52, y + 14, 2, 3);

        // Upper teeth
        ctx.fillRect(x + 44, y + 9, 2, 2);
        ctx.fillRect(x + 48, y + 9, 2, 2);

        // Nostril
        ctx.fillStyle = dark;
        ctx.beginPath(); ctx.arc(x + 52, y + 10, 1.5, 0, Math.PI * 2); ctx.fill();

        // Eye (white)
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(x + 40, y + 4, 5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = dark; ctx.lineWidth = 1; ctx.stroke();
        // Pupil
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.arc(x + 41, y + 4, 2.5, 0, Math.PI * 2); ctx.fill();
        // Eye highlight
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(x + 42, y + 3, 1, 0, Math.PI * 2); ctx.fill();

        // Brow ridge
        ctx.fillStyle = dark;
        ctx.beginPath();
        ctx.moveTo(x + 34, y - 1);
        ctx.lineTo(x + 44, y - 2);
        ctx.lineTo(x + 44, y + 1);
        ctx.lineTo(x + 34, y + 2);
        ctx.closePath(); ctx.fill();

        // Arms (tiny T-Rex arms)
        ctx.fillStyle = color;
        const armAngle = this.state === 'jump' ? -0.5 : 0.3;
        ctx.save();
        ctx.translate(x + 14, y + 20);
        ctx.rotate(armAngle);
        ctx.fillRect(0, 0, 4, 10);
        // Claws
        ctx.fillStyle = '#fff';
        ctx.fillRect(-1, 10, 3, 3);
        ctx.fillRect(2, 10, 3, 3);
        ctx.restore();

        // Legs
        ctx.fillStyle = color;
        if (this.isGrounded && this.state !== 'dead') {
            const legOff = this.runFrame * 6;
            // Left leg
            ctx.fillRect(x + 10 + legOff, y + 32, 8, 14);
            ctx.fillStyle = dark;
            ctx.fillRect(x + 8 + legOff, y + 42, 10, 5);
            // Right leg
            ctx.fillStyle = color;
            ctx.fillRect(x + 24 - legOff, y + 32, 8, 14);
            ctx.fillStyle = dark;
            ctx.fillRect(x + 22 - legOff, y + 42, 10, 5);
        } else {
            // Airborne legs
            ctx.fillRect(x + 10, y + 32, 8, 12);
            ctx.fillStyle = dark;
            ctx.fillRect(x + 8, y + 40, 10, 5);
            ctx.fillStyle = color;
            ctx.fillRect(x + 24, y + 32, 8, 12);
            ctx.fillStyle = dark;
            ctx.fillRect(x + 22, y + 40, 10, 5);
        }

        // Weapon visual
        if (this.hasWeapon) {
            ctx.fillStyle = '#ffcc00';
            ctx.fillRect(x + w - 2, y + 12, 12, 4);
            ctx.fillStyle = '#ff6600';
            ctx.fillRect(x + w + 8, y + 11, 5, 6);
            // Glow
            ctx.fillStyle = 'rgba(255,100,0,0.3)';
            ctx.beginPath(); ctx.arc(x + w + 12, y + 14, 6, 0, Math.PI * 2); ctx.fill();
        }

        ctx.restore();
    }
}
