/**
 * Player - Player spaceship with weapon upgrade system
 */
class Player {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        // Position and size
        this.width = 40;
        this.height = 40;
        this.x = canvasWidth / 2;
        this.y = canvasHeight - 60;

        // Movement
        this.speed = 5;

        // Weapon system - two types with levels 1-4
        this.weaponType = 'rapid'; // 'rapid' or 'spread'
        this.rapidLevel = 1; // 1-4
        this.spreadLevel = 1; // 1-4
        this.fireCooldown = 0;

        // Health
        this.maxHealth = 3;
        this.health = 3;
        this.lives = 3;
        this.invulnerable = false;
        this.invulnerableTimer = 0;

        // Visual
        this.tilt = 0;
        this.thrustAnim = 0;
        this.aimAngle = 0;

        // Input state
        this.keys = { left: false, right: false, up: false, down: false };
        this.mouse = { x: canvasWidth / 2, y: canvasHeight / 2, down: false };
    }

    // Reset player state
    reset() {
        this.x = this.canvasWidth / 2;
        this.y = this.canvasHeight - 60;
        this.health = this.maxHealth;
        this.lives = 3;
        this.weaponType = 'rapid';
        this.rapidLevel = 1;
        this.spreadLevel = 1;
        this.fireCooldown = 0;
        this.invulnerable = false;
        this.invulnerableTimer = 0;
    }

    // Get fire rate based on weapon type and level
    getFireRate() {
        if (this.weaponType === 'rapid') {
            // Rapid: faster fire rate with level
            return Math.max(3, 10 - (this.rapidLevel - 1) * 2);
        } else {
            // Spread: moderate fire rate
            return Math.max(6, 12 - (this.spreadLevel - 1) * 1);
        }
    }

    // Upgrade weapon from gift
    upgradeWeapon(type) {
        if (type === 'rapid') {
            this.weaponType = 'rapid';
            this.rapidLevel = Math.min(4, this.rapidLevel + 1);
        } else if (type === 'spread') {
            this.weaponType = 'spread';
            this.spreadLevel = Math.min(4, this.spreadLevel + 1);
        }
    }

    // Downgrade weapon (when hit by poop)
    downgradeWeapon() {
        if (this.weaponType === 'rapid') {
            this.rapidLevel = Math.max(1, this.rapidLevel - 1);
        } else {
            this.spreadLevel = Math.max(1, this.spreadLevel - 1);
        }
    }

    // Get current weapon level
    getCurrentLevel() {
        return this.weaponType === 'rapid' ? this.rapidLevel : this.spreadLevel;
    }

    // Take damage (from poop)
    takeDamage(particlePool) {
        if (this.invulnerable) return false;

        this.health--;
        this.invulnerable = true;
        this.invulnerableTimer = 120;

        // Downgrade weapon
        this.downgradeWeapon();

        // Hit effect
        particlePool.explosion(this.x, this.y, 15, '#ff4444', {
            speed: 4, maxSize: 4
        });

        AudioManager.play('playerHit');

        if (this.health <= 0) {
            this.lives--;
            if (this.lives > 0) {
                this.health = this.maxHealth;
                this.invulnerableTimer = 180;
            }
            return true; // Life lost
        }

        return false;
    }

    // Update player
    update(keys, mouse, bulletPool, dt) {
        this.keys = keys;
        this.mouse = mouse;

        // Movement
        let dx = 0;
        let dy = 0;

        if (keys.left) dx -= this.speed;
        if (keys.right) dx += this.speed;
        if (keys.up) dy -= this.speed;
        if (keys.down) dy += this.speed;

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        this.x += dx * dt;
        this.y += dy * dt;

        // Clamp to screen bounds
        this.x = Math.max(this.width / 2, Math.min(this.canvasWidth - this.width / 2, this.x));
        this.y = Math.max(this.height / 2, Math.min(this.canvasHeight - this.height / 2, this.y));

        // Tilt based on movement
        this.tilt = dx * 0.04;

        // Aim angle toward mouse
        const aimDx = mouse.x - this.x;
        const aimDy = mouse.y - this.y;
        this.aimAngle = Math.atan2(aimDy, aimDx);

        // Thrust animation
        this.thrustAnim += 0.2;

        // Invulnerability timer
        if (this.invulnerable) {
            this.invulnerableTimer -= dt;
            if (this.invulnerableTimer <= 0) {
                this.invulnerable = false;
            }
        }

        // Shooting
        if (this.fireCooldown > 0) this.fireCooldown -= dt;

        if (mouse.down && this.fireCooldown <= 0) {
            this.shoot(bulletPool);
            this.fireCooldown = this.getFireRate();
        }
    }

    // Fire bullets based on weapon type and level
    shoot(bulletPool) {
        const bx = this.x;
        const by = this.y - this.height / 2;

        // Direction toward mouse
        const dx = this.mouse.x - this.x;
        const dy = this.mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const dirX = dx / dist;
        const dirY = dy / dist;
        const speed = 10;

        if (this.weaponType === 'rapid') {
            this._shootRapid(bulletPool, bx, by, dirX, dirY, speed);
        } else {
            this._shootSpread(bulletPool, bx, by, speed);
        }

        AudioManager.play('shoot');
    }

    // Rapid fire - straight bullets, more bullets with level
    _shootRapid(bulletPool, bx, by, dirX, dirY, speed) {
        switch (this.rapidLevel) {
            case 1:
                // Single shot
                bulletPool.fire({
                    x: bx, y: by,
                    vx: dirX * speed, vy: dirY * speed,
                    width: 4, height: 12,
                    damage: 1, type: 'player', color: '#00ffff'
                });
                break;

            case 2:
                // Double shot (side by side)
                const perpX = -dirY * 6;
                const perpY = dirX * 6;
                bulletPool.fire({
                    x: bx + perpX, y: by + perpY,
                    vx: dirX * speed, vy: dirY * speed,
                    width: 4, height: 12,
                    damage: 1, type: 'player', color: '#00ffff'
                });
                bulletPool.fire({
                    x: bx - perpX, y: by - perpY,
                    vx: dirX * speed, vy: dirY * speed,
                    width: 4, height: 12,
                    damage: 1, type: 'player', color: '#00ffff'
                });
                break;

            case 3:
                // Triple shot (center + sides)
                const pX3 = -dirY * 8;
                const pY3 = dirX * 8;
                bulletPool.fire({
                    x: bx, y: by,
                    vx: dirX * speed, vy: dirY * speed,
                    width: 5, height: 14,
                    damage: 1, type: 'player', color: '#00ffff'
                });
                bulletPool.fire({
                    x: bx + pX3, y: by + pY3,
                    vx: dirX * speed, vy: dirY * speed,
                    width: 4, height: 12,
                    damage: 1, type: 'player', color: '#00ddff'
                });
                bulletPool.fire({
                    x: bx - pX3, y: by - pY3,
                    vx: dirX * speed, vy: dirY * speed,
                    width: 4, height: 12,
                    damage: 1, type: 'player', color: '#00ddff'
                });
                break;

            case 4:
                // Quad shot + laser center
                const pX4 = -dirY * 10;
                const pY4 = dirX * 10;
                const pX4b = -dirY * 5;
                const pY4b = dirX * 5;

                // Center laser
                bulletPool.fire({
                    x: bx, y: by,
                    vx: dirX * speed * 1.3, vy: dirY * speed * 1.3,
                    width: 8, height: 30,
                    damage: 2, type: 'laser', color: '#ff00ff', piercing: true
                });
                // Side bullets
                bulletPool.fire({
                    x: bx + pX4, y: by + pY4,
                    vx: dirX * speed, vy: dirY * speed,
                    width: 4, height: 12,
                    damage: 1, type: 'player', color: '#00ffff'
                });
                bulletPool.fire({
                    x: bx - pX4, y: by - pY4,
                    vx: dirX * speed, vy: dirY * speed,
                    width: 4, height: 12,
                    damage: 1, type: 'player', color: '#00ffff'
                });
                bulletPool.fire({
                    x: bx + pX4b, y: by + pY4b,
                    vx: dirX * speed, vy: dirY * speed,
                    width: 4, height: 12,
                    damage: 1, type: 'player', color: '#00aaff'
                });
                bulletPool.fire({
                    x: bx - pX4b, y: by - pY4b,
                    vx: dirX * speed, vy: dirY * speed,
                    width: 4, height: 12,
                    damage: 1, type: 'player', color: '#00aaff'
                });
                break;
        }
    }

    // Spread fire - fan pattern, wider with level
    _shootSpread(bulletPool, bx, by, speed) {
        switch (this.spreadLevel) {
            case 1:
                // Single aimed shot
                this._aimedShot(bulletPool, bx, by, speed, 0);
                break;

            case 2:
                // 2-way spread
                this._aimedShot(bulletPool, bx, by, speed, -0.15);
                this._aimedShot(bulletPool, bx, by, speed, 0.15);
                break;

            case 3:
                // 3-way spread
                this._aimedShot(bulletPool, bx, by, speed, -0.25);
                this._aimedShot(bulletPool, bx, by, speed, 0);
                this._aimedShot(bulletPool, bx, by, speed, 0.25);
                break;

            case 4:
                // 5-way spread
                this._aimedShot(bulletPool, bx, by, speed, -0.35);
                this._aimedShot(bulletPool, bx, by, speed, -0.17);
                this._aimedShot(bulletPool, bx, by, speed, 0);
                this._aimedShot(bulletPool, bx, by, speed, 0.17);
                this._aimedShot(bulletPool, bx, by, speed, 0.35);
                break;
        }
    }

    // Fire a single aimed shot
    _aimedShot(bulletPool, bx, by, speed, angleOffset) {
        const angle = this.aimAngle + angleOffset;
        bulletPool.fire({
            x: bx, y: by,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            width: 4, height: 12,
            damage: 1, type: 'player',
            color: angleOffset === 0 ? '#00ffcc' : '#00ddaa'
        });
    }

    // Draw player ship
    draw(ctx, mouse) {
        ctx.save();

        // Blink when invulnerable
        if (this.invulnerable && Math.floor(this.invulnerableTimer / 4) % 2 === 0) {
            ctx.globalAlpha = 0.4;
        }

        ctx.translate(this.x, this.y);
        ctx.rotate(this.tilt);

        // Ship body - sleek fighter
        const gradient = ctx.createLinearGradient(0, -this.height / 2, 0, this.height / 2);
        gradient.addColorStop(0, '#6699ff');
        gradient.addColorStop(0.5, '#4477dd');
        gradient.addColorStop(1, '#3355aa');
        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);
        ctx.lineTo(-this.width / 2, this.height / 4);
        ctx.lineTo(-this.width / 3, this.height / 2);
        ctx.lineTo(this.width / 3, this.height / 2);
        ctx.lineTo(this.width / 2, this.height / 4);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#88aaff';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Cockpit
        const cockpitGrad = ctx.createRadialGradient(0, -this.height / 6, 2, 0, -this.height / 6, 8);
        cockpitGrad.addColorStop(0, '#aaddff');
        cockpitGrad.addColorStop(1, '#4488cc');
        ctx.fillStyle = cockpitGrad;
        ctx.beginPath();
        ctx.ellipse(0, -this.height / 6, 6, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Engine thrust
        const thrustSize = 8 + Math.sin(this.thrustAnim) * 4;

        ctx.fillStyle = '#ff4400';
        ctx.beginPath();
        ctx.moveTo(-this.width / 4, this.height / 2);
        ctx.lineTo(0, this.height / 2 + thrustSize + 5);
        ctx.lineTo(this.width / 4, this.height / 2);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.moveTo(-this.width / 4 + 4, this.height / 2);
        ctx.lineTo(0, this.height / 2 + thrustSize);
        ctx.lineTo(this.width / 4 - 4, this.height / 2);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        // Aim line
        if (mouse) {
            ctx.save();
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.12)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 8]);
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        }
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

    // Check if alive
    isAlive() {
        return this.lives > 0;
    }
}
