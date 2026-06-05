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

        if (this.ducking && this.isGrounded) {
            // Ducking dino - wider, shorter
            ctx.fillStyle = color;
            ctx.fillRect(x, y, 56, 20);
            ctx.fillRect(x + 46, y - 8, 12, 12);
            // Eye
            ctx.fillStyle = '#fff';
            ctx.fillRect(x + 50, y - 6, 4, 4);
            ctx.fillStyle = '#000';
            ctx.fillRect(x + 51, y - 5, 2, 2);
            // Legs
            ctx.fillStyle = color;
            const legOff = this.runFrame * 4;
            ctx.fillRect(x + 10 + legOff, y + 20, 6, 8);
            ctx.fillRect(x + 30 - legOff, y + 20, 6, 8);
            return;
        }

        const w = this.width;
        const h = this.height;

        // Body
        ctx.fillStyle = color;
        ctx.fillRect(x + 8, y + 4, w - 16, h - 16);

        // Head
        ctx.fillRect(x + 20, y - 4, w - 20, 18);

        // Mouth/jaw
        ctx.fillRect(x + 30, y + 10, 16, 6);

        // Eye
        ctx.fillStyle = '#fff';
        ctx.fillRect(x + 32, y, 6, 6);
        ctx.fillStyle = '#000';
        ctx.fillRect(x + 34, y + 1, 3, 3);

        // Arms
        ctx.fillStyle = color;
        if (this.state === 'jump' || this.state === 'doubleJump') {
            ctx.fillRect(x + 4, y + 12, 6, 10);
        } else {
            ctx.fillRect(x + 6, y + 14, 5, 8);
        }

        // Tail
        ctx.fillRect(x, y + 8, 10, 6);

        // Legs
        ctx.fillStyle = color;
        if (this.isGrounded && this.state !== 'dead') {
            const legOff = this.runFrame * 5;
            ctx.fillRect(x + 12 + legOff, y + h - 14, 7, 14);
            ctx.fillRect(x + 26 - legOff, y + h - 14, 7, 14);
        } else {
            ctx.fillRect(x + 12, y + h - 14, 7, 14);
            ctx.fillRect(x + 26, y + h - 14, 7, 14);
        }

        // Weapon visual
        if (this.hasWeapon) {
            ctx.fillStyle = '#ffcc00';
            ctx.fillRect(x + w - 4, y + 10, 10, 4);
            ctx.fillStyle = '#ff6600';
            ctx.fillRect(x + w + 4, y + 9, 4, 6);
        }
    }
}
