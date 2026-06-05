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
        const c = color || "#4a8c5c";
        const o = color === "#888" ? "#555" : "#2d6b3e";
        const b = color === "#888" ? "#bbb" : "#c8f0d0";
        const duck = this.ducking && this.isGrounded;
        const f = this.runFrame || 0;

        ctx.save();
        ctx.translate(x + 48, y);
        ctx.scale(-1, 1);
        ctx.lineWidth = 1.8;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        if (duck) {
            // --- tail ---
            ctx.fillStyle = c; ctx.strokeStyle = o;
            ctx.beginPath();
            ctx.moveTo(44, 20);
            ctx.quadraticCurveTo(48, 16, 46, 18);
            ctx.lineTo(48, 22);
            ctx.quadraticCurveTo(46, 28, 40, 26);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            // --- body ---
            ctx.beginPath();
            ctx.moveTo(14, 16);
            ctx.quadraticCurveTo(28, 14, 38, 18);
            ctx.quadraticCurveTo(44, 22, 40, 30);
            ctx.quadraticCurveTo(36, 36, 22, 36);
            ctx.quadraticCurveTo(12, 36, 10, 30);
            ctx.quadraticCurveTo(8, 22, 14, 16);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            // --- belly ---
            ctx.fillStyle = b;
            ctx.beginPath();
            ctx.moveTo(16, 26);
            ctx.quadraticCurveTo(26, 24, 34, 26);
            ctx.quadraticCurveTo(36, 32, 24, 34);
            ctx.quadraticCurveTo(16, 34, 14, 30);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = c;
            // --- head ---
            ctx.beginPath();
            ctx.moveTo(8, 14);
            ctx.quadraticCurveTo(14, 10, 20, 14);
            ctx.quadraticCurveTo(22, 20, 20, 28);
            ctx.quadraticCurveTo(14, 34, 6, 30);
            ctx.quadraticCurveTo(2, 24, 4, 18);
            ctx.quadraticCurveTo(4, 14, 8, 14);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            // --- snout ---
            ctx.beginPath();
            ctx.moveTo(6, 22);
            ctx.quadraticCurveTo(2, 20, 0, 22);
            ctx.quadraticCurveTo(-2, 26, 2, 30);
            ctx.quadraticCurveTo(6, 32, 10, 28);
            ctx.quadraticCurveTo(8, 24, 6, 22);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            // --- jaw line ---
            ctx.strokeStyle = o;
            ctx.beginPath();
            ctx.moveTo(2, 28);
            ctx.quadraticCurveTo(6, 30, 12, 28);
            ctx.stroke();
            // --- eye ---
            ctx.fillStyle = "#fff";
            ctx.beginPath(); ctx.arc(14, 18, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#111";
            ctx.beginPath(); ctx.arc(14.5, 18, 1, 0, Math.PI * 2); ctx.fill();
            // --- legs ---
            ctx.fillStyle = c; ctx.strokeStyle = o;
            const dl = f * 3;
            ctx.beginPath();
            ctx.moveTo(20 + dl, 34);
            ctx.quadraticCurveTo(18 + dl, 38, 19 + dl, 42);
            ctx.quadraticCurveTo(20 + dl, 46, 24 + dl, 46);
            ctx.quadraticCurveTo(26 + dl, 44, 24 + dl, 40);
            ctx.quadraticCurveTo(24 + dl, 36, 22 + dl, 34);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(30 - dl, 34);
            ctx.quadraticCurveTo(28 - dl, 38, 29 - dl, 42);
            ctx.quadraticCurveTo(30 - dl, 46, 34 - dl, 46);
            ctx.quadraticCurveTo(36 - dl, 44, 34 - dl, 40);
            ctx.quadraticCurveTo(34 - dl, 36, 32 - dl, 34);
            ctx.closePath(); ctx.fill(); ctx.stroke();
        } else {
            // --- tail ---
            ctx.fillStyle = c; ctx.strokeStyle = o;
            ctx.beginPath();
            ctx.moveTo(34, 17);
            ctx.quadraticCurveTo(40, 12, 46, 10);
            ctx.quadraticCurveTo(48, 14, 44, 20);
            ctx.quadraticCurveTo(38, 22, 34, 20);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            // --- body ---
            ctx.beginPath();
            ctx.moveTo(18, 10);
            ctx.quadraticCurveTo(28, 8, 34, 14);
            ctx.quadraticCurveTo(38, 20, 34, 30);
            ctx.quadraticCurveTo(28, 38, 20, 36);
            ctx.quadraticCurveTo(12, 32, 14, 22);
            ctx.quadraticCurveTo(14, 14, 18, 10);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            // --- belly ---
            ctx.fillStyle = b;
            ctx.beginPath();
            ctx.moveTo(20, 24);
            ctx.quadraticCurveTo(28, 22, 32, 26);
            ctx.quadraticCurveTo(32, 32, 26, 34);
            ctx.quadraticCurveTo(20, 34, 18, 30);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = c;
            // --- head ---
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.quadraticCurveTo(18, -2, 22, 2);
            ctx.quadraticCurveTo(26, 6, 24, 14);
            ctx.quadraticCurveTo(22, 22, 14, 22);
            ctx.quadraticCurveTo(6, 20, 4, 14);
            ctx.quadraticCurveTo(2, 6, 6, 2);
            ctx.quadraticCurveTo(8, 0, 10, 0);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            // --- snout ---
            ctx.beginPath();
            ctx.moveTo(6, 10);
            ctx.quadraticCurveTo(2, 8, 0, 10);
            ctx.quadraticCurveTo(-2, 14, 0, 18);
            ctx.quadraticCurveTo(2, 22, 8, 20);
            ctx.quadraticCurveTo(8, 14, 6, 10);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            // --- jaw line ---
            ctx.strokeStyle = o;
            ctx.beginPath();
            ctx.moveTo(0, 17);
            ctx.quadraticCurveTo(4, 20, 10, 18);
            ctx.stroke();
            // --- eye ---
            ctx.fillStyle = "#fff";
            ctx.beginPath(); ctx.arc(16, 8, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#111";
            ctx.beginPath(); ctx.arc(16.5, 8, 1, 0, Math.PI * 2); ctx.fill();
            // --- arm ---
            ctx.fillStyle = c; ctx.strokeStyle = o;
            ctx.beginPath();
            ctx.moveTo(26, 18);
            ctx.quadraticCurveTo(30, 20, 28, 24);
            ctx.quadraticCurveTo(26, 26, 24, 24);
            ctx.quadraticCurveTo(22, 22, 24, 18);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            // --- legs ---
            if (f === 0) {
                ctx.beginPath();
                ctx.moveTo(20, 34);
                ctx.quadraticCurveTo(16, 38, 17, 44);
                ctx.quadraticCurveTo(18, 48, 22, 48);
                ctx.quadraticCurveTo(26, 46, 24, 42);
                ctx.quadraticCurveTo(24, 36, 22, 34);
                ctx.closePath(); ctx.fill(); ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(28, 30);
                ctx.quadraticCurveTo(26, 36, 27, 42);
                ctx.quadraticCurveTo(28, 48, 32, 48);
                ctx.quadraticCurveTo(36, 46, 34, 40);
                ctx.quadraticCurveTo(32, 34, 30, 30);
                ctx.closePath(); ctx.fill(); ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.moveTo(20, 30);
                ctx.quadraticCurveTo(16, 36, 17, 42);
                ctx.quadraticCurveTo(18, 48, 22, 48);
                ctx.quadraticCurveTo(26, 46, 24, 40);
                ctx.quadraticCurveTo(24, 34, 22, 30);
                ctx.closePath(); ctx.fill(); ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(28, 34);
                ctx.quadraticCurveTo(26, 38, 27, 44);
                ctx.quadraticCurveTo(28, 48, 32, 48);
                ctx.quadraticCurveTo(36, 46, 34, 42);
                ctx.quadraticCurveTo(32, 36, 30, 34);
                ctx.closePath(); ctx.fill(); ctx.stroke();
            }
        }

        // --- weapon ---
        if (this.hasWeapon) {
            ctx.fillStyle = "#555"; ctx.strokeStyle = "#222";
            const wy = duck ? 24 : 14;
            ctx.beginPath();
            ctx.moveTo(-2, wy - 2);
            ctx.lineTo(6, wy - 3);
            ctx.lineTo(8, wy);
            ctx.lineTo(6, wy + 3);
            ctx.lineTo(-2, wy + 2);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-6, wy - 1);
            ctx.lineTo(-2, wy - 2);
            ctx.lineTo(-2, wy + 2);
            ctx.lineTo(-6, wy + 1);
            ctx.closePath(); ctx.fill(); ctx.stroke();
        }

        // --- dead X eye ---
        if (this.state === "dead") {
            const ex = duck ? 14 : 16;
            const ey = duck ? 18 : 8;
            ctx.strokeStyle = "#000"; ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(ex - 2, ey - 2); ctx.lineTo(ex + 2, ey + 2);
            ctx.moveTo(ex + 2, ey - 2); ctx.lineTo(ex - 2, ey + 2);
            ctx.stroke();
        }

        ctx.restore();
    }
}
