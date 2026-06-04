/**
 * Boss - Large enemy boss with complex attack patterns and phases
 */
class Boss {
    constructor(canvasWidth, canvasHeight, waveNumber) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        // Position
        this.x = canvasWidth / 2;
        this.y = -120;
        this.targetY = 90;

        // Size scales with wave
        const tier = Math.floor(waveNumber / 5);
        this.width = 90 + tier * 10;
        this.height = 70 + tier * 8;

        // Stats scale with wave
        this.maxHealth = 40 + waveNumber * 15;
        this.health = this.maxHealth;
        this.speed = 1.2;
        this.score = 1500 + waveNumber * 300;

        // State
        this.active = true;
        this.entering = true;
        this.phase = 0;
        this.phaseTimer = 0;
        this.attackTimer = 0;
        this.moveDir = 1;
        this.time = 0;

        // Attack patterns
        this.patterns = ['spread', 'aimed', 'spiral', 'rain', 'cross', 'burst'];
        this.currentPattern = 0;

        // Phase thresholds
        this.phaseThresholds = [0.75, 0.5, 0.25]; // Health % to trigger phase change
        this.currentPhaseIndex = 0;
        this.enraged = false;

        // Visual
        this.tier = tier;
        this.hitFlash = 0;
        this.animFrame = 0;
        this.pulseTime = 0;

        // Color based on tier
        this.setTierVisuals();
    }

    // Set visuals based on tier
    setTierVisuals() {
        const tierColors = [
            { body: '#ff0044', accent: '#cc0033', eye: '#ffcc00' },
            { body: '#8800ff', accent: '#6600cc', eye: '#00ffcc' },
            { body: '#ff6600', accent: '#cc4400', eye: '#ffff00' },
            { body: '#00ff88', accent: '#00cc66', eye: '#ff00ff' },
            { body: '#ff00ff', accent: '#cc00cc', eye: '#00ffff' }
        ];

        const colors = tierColors[Math.min(this.tier, tierColors.length - 1)];
        this.color = colors.body;
        this.accentColor = colors.accent;
        this.eyeColor = colors.eye;
    }

    // Update boss
    update(playerX, playerY, bulletPool, dt = 1) {
        if (!this.active) return;

        this.time += 0.02 * dt;
        this.animFrame += dt;
        this.pulseTime += 0.05 * dt;

        // Entry animation
        if (this.entering) {
            this.y += 1.5 * dt;
            if (this.y >= this.targetY) {
                this.y = this.targetY;
                this.entering = false;
            }
            return;
        }

        // Hit flash
        if (this.hitFlash > 0) this.hitFlash -= dt;

        // Check phase transitions
        this._checkPhaseTransition();

        // Phase timer
        this.phaseTimer += dt;
        if (this.phaseTimer > 240) {
            this.phaseTimer = 0;
            this.currentPattern = (this.currentPattern + 1) % this.patterns.length;
            this.phase++;
        }

        // Movement
        this._updateMovement(dt);

        // Attack
        this.attackTimer += dt;
        this._attack(playerX, playerY, bulletPool);
    }

    // Check if should transition to next phase
    _checkPhaseTransition() {
        const healthPercent = this.health / this.maxHealth;

        if (this.currentPhaseIndex < this.phaseThresholds.length &&
            healthPercent <= this.phaseThresholds[this.currentPhaseIndex]) {
            this.currentPhaseIndex++;
            this.speed += 0.3;

            // Enrage at 25% health
            if (healthPercent <= 0.25 && !this.enraged) {
                this.enraged = true;
            }
        }
    }

    // Update movement pattern
    _updateMovement(dt) {
        const moveSpeed = this.speed * dt;

        switch (this.phase % 4) {
            case 0: // Side to side
                this.x += moveSpeed * this.moveDir;
                if (this.x > this.canvasWidth - this.width / 2 - 30) {
                    this.moveDir = -1;
                } else if (this.x < this.width / 2 + 30) {
                    this.moveDir = 1;
                }
                break;

            case 1: // Figure eight
                this.x = this.canvasWidth / 2 + Math.sin(this.time * 1.5) * 180;
                this.y = this.targetY + Math.sin(this.time * 3) * 35;
                break;

            case 2: // Chase player
                const dx = playerX - this.x;
                this.x += Math.sign(dx) * Math.min(Math.abs(dx) * 0.02, moveSpeed);
                break;

            case 3: // Circular motion
                this.x = this.canvasWidth / 2 + Math.cos(this.time * 2) * 150;
                this.y = this.targetY + Math.sin(this.time * 2) * 25;
                break;
        }

        // Clamp position
        this.x = Math.max(this.width / 2 + 10, Math.min(this.canvasWidth - this.width / 2 - 10, this.x));
    }

    // Attack patterns
    _attack(playerX, playerY, bulletPool) {
        const pattern = this.patterns[this.currentPattern];
        const attackSpeed = this.enraged ? 0.7 : 1; // Faster attacks when enraged

        switch (pattern) {
            case 'spread':
                if (this.attackTimer % (25 * attackSpeed) < 1) {
                    this._spreadShot(bulletPool);
                }
                break;

            case 'aimed':
                if (this.attackTimer % (35 * attackSpeed) < 1) {
                    this._aimedShot(playerX, playerY, bulletPool);
                }
                break;

            case 'spiral':
                if (this.attackTimer % (10 * attackSpeed) < 1) {
                    this._spiralShot(bulletPool);
                }
                break;

            case 'rain':
                if (this.attackTimer % (8 * attackSpeed) < 1) {
                    this._rainShot(bulletPool);
                }
                break;

            case 'cross':
                if (this.attackTimer % (30 * attackSpeed) < 1) {
                    this._crossShot(bulletPool);
                }
                break;

            case 'burst':
                if (this.attackTimer % (50 * attackSpeed) < 1) {
                    this._burstShot(playerX, playerY, bulletPool);
                }
                break;
        }
    }

    // Spread shot - fan of bullets
    _spreadShot(bulletPool) {
        const count = this.enraged ? 7 : 5;
        const spread = Math.PI / 3;

        for (let i = 0; i < count; i++) {
            const angle = (Math.PI / 2) - spread / 2 + (spread / (count - 1)) * i;
            bulletPool.fire({
                x: this.x,
                y: this.y + this.height / 2,
                vx: Math.cos(angle) * 4,
                vy: Math.sin(angle) * 4,
                width: 8,
                height: 8,
                damage: 1,
                type: 'enemy',
                color: '#ff4444'
            });
        }
    }

    // Aimed shot - bullets aimed at player
    _aimedShot(playerX, playerY, bulletPool) {
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = 5;

        const count = this.enraged ? 5 : 3;
        const spread = 0.15;

        for (let i = 0; i < count; i++) {
            const offset = (i - Math.floor(count / 2)) * spread;
            const angle = Math.atan2(dy, dx) + offset;

            bulletPool.fire({
                x: this.x,
                y: this.y + this.height / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                width: 8,
                height: 8,
                damage: 1,
                type: 'enemy',
                color: '#ffaa00'
            });
        }
    }

    // Spiral shot - rotating pattern
    _spiralShot(bulletPool) {
        const angle = this.time * 8;
        const count = this.enraged ? 3 : 2;

        for (let i = 0; i < count; i++) {
            const a = angle + (Math.PI * 2 / count) * i;
            bulletPool.fire({
                x: this.x,
                y: this.y + this.height / 2,
                vx: Math.cos(a) * 3,
                vy: Math.sin(a) * 3 + 2,
                width: 6,
                height: 6,
                damage: 1,
                type: 'enemy',
                color: '#ff88ff'
            });
        }
    }

    // Rain shot - bullets falling down
    _rainShot(bulletPool) {
        const count = this.enraged ? 4 : 3;
        for (let i = 0; i < count; i++) {
            const offsetX = (Math.random() - 0.5) * this.width;
            bulletPool.fire({
                x: this.x + offsetX,
                y: this.y + this.height / 2,
                vx: (Math.random() - 0.5) * 1.5,
                vy: 3 + Math.random() * 2,
                width: 6,
                height: 6,
                damage: 1,
                type: 'enemy',
                color: '#ff4444'
            });
        }
    }

    // Cross shot - bullets in cross pattern
    _crossShot(bulletPool) {
        const directions = [
            { vx: 0, vy: 4 },
            { vx: 0, vy: -4 },
            { vx: 4, vy: 0 },
            { vx: -4, vy: 0 }
        ];

        if (this.enraged) {
            directions.push(
                { vx: 3, vy: 3 },
                { vx: -3, vy: 3 },
                { vx: 3, vy: -3 },
                { vx: -3, vy: -3 }
            );
        }

        for (const dir of directions) {
            bulletPool.fire({
                x: this.x,
                y: this.y,
                vx: dir.vx,
                vy: dir.vy,
                width: 8,
                height: 8,
                damage: 1,
                type: 'enemy',
                color: '#ffaa00'
            });
        }
    }

    // Burst shot - rapid burst of bullets
    _burstShot(playerX, playerY, bulletPool) {
        const count = this.enraged ? 12 : 8;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            const speed = 3 + Math.sin(this.time * 5 + i) * 1;
            bulletPool.fire({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                width: 7,
                height: 7,
                damage: 1,
                type: 'enemy',
                color: '#ff6688'
            });
        }
    }

    // Take damage
    takeDamage(damage) {
        this.health -= damage;
        this.hitFlash = 8;

        if (this.health <= 0) {
            this.active = false;
            return true;
        }
        return false;
    }

    // Draw boss
    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Enrage aura
        if (this.enraged) {
            ctx.fillStyle = `rgba(255, 0, 0, ${0.1 + Math.sin(this.pulseTime * 3) * 0.05})`;
            ctx.beginPath();
            ctx.arc(0, 0, this.width / 2 + 20, 0, Math.PI * 2);
            ctx.fill();
        }

        // Hit flash
        const bodyColor = this.hitFlash > 0 ? '#ffffff' : this.color;
        const accentColor = this.hitFlash > 0 ? '#dddddd' : this.accentColor;

        // Main body - menacing shape
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2); // Top
        ctx.lineTo(-this.width / 2, 0); // Left
        ctx.lineTo(-this.width / 3, this.height / 2); // Bottom left
        ctx.lineTo(this.width / 3, this.height / 2); // Bottom right
        ctx.lineTo(this.width / 2, 0); // Right
        ctx.closePath();
        ctx.fill();

        // Body border
        ctx.strokeStyle = this.hitFlash > 0 ? '#fff' : '#ffffff44';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Body details - inner diamond
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 3);
        ctx.lineTo(-this.width / 3, 0);
        ctx.lineTo(0, this.height / 3);
        ctx.lineTo(this.width / 3, 0);
        ctx.closePath();
        ctx.fill();

        // Wings
        const wingFlap = Math.sin(this.time * 5) * 8;

        ctx.fillStyle = accentColor;
        // Left wing
        ctx.beginPath();
        ctx.moveTo(-this.width / 3, 0);
        ctx.lineTo(-this.width / 2 - 25, -15 + wingFlap);
        ctx.lineTo(-this.width / 2 - 20, 20);
        ctx.closePath();
        ctx.fill();

        // Right wing
        ctx.beginPath();
        ctx.moveTo(this.width / 3, 0);
        ctx.lineTo(this.width / 2 + 25, -15 - wingFlap);
        ctx.lineTo(this.width / 2 + 20, 20);
        ctx.closePath();
        ctx.fill();

        // Eyes
        ctx.fillStyle = this.eyeColor;
        ctx.shadowColor = this.eyeColor;
        ctx.shadowBlur = 15;

        // Left eye
        ctx.beginPath();
        ctx.ellipse(-this.width / 5, -this.height / 6, 10, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Right eye
        ctx.beginPath();
        ctx.ellipse(this.width / 5, -this.height / 6, 10, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = '#ff0000';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(-this.width / 5 + 2, -this.height / 6, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.width / 5 + 2, -this.height / 6, 5, 0, Math.PI * 2);
        ctx.fill();

        // Mouth
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.moveTo(-this.width / 4, this.height / 6);
        ctx.quadraticCurveTo(0, this.height / 4 + Math.sin(this.time * 3) * 5, this.width / 4, this.height / 6);
        ctx.closePath();
        ctx.fill();

        // Teeth
        ctx.fillStyle = '#fff';
        const teethCount = 5;
        const teethWidth = (this.width / 2) / teethCount;
        for (let i = 0; i < teethCount; i++) {
            const tx = -this.width / 4 + i * teethWidth + 2;
            ctx.fillRect(tx, this.height / 6, teethWidth - 4, 7);
        }

        ctx.restore();

        // Health bar
        this._drawHealthBar(ctx);

        // Phase indicator
        this._drawPhaseIndicator(ctx);
    }

    // Draw health bar at top of screen
    _drawHealthBar(ctx) {
        const barWidth = 250;
        const barHeight = 14;
        const barX = this.canvasWidth / 2 - barWidth / 2;
        const barY = 22;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(barX - 3, barY - 3, barWidth + 6, barHeight + 6);

        // Health segments
        const healthPercent = this.health / this.maxHealth;
        const segmentCount = 10;
        const segmentWidth = barWidth / segmentCount;

        for (let i = 0; i < segmentCount; i++) {
            const segX = barX + i * segmentWidth;
            const segHealth = Math.min(1, Math.max(0, healthPercent * segmentCount - i));

            if (segHealth > 0) {
                const gradient = ctx.createLinearGradient(segX, barY, segX + segmentWidth - 2, barY);
                gradient.addColorStop(0, this.enraged ? '#ff0000' : this.color);
                gradient.addColorStop(1, this.enraged ? '#ff4444' : this.accentColor);
                ctx.fillStyle = gradient;
                ctx.fillRect(segX, barY, (segmentWidth - 2) * segHealth, barHeight);
            }

            // Segment divider
            if (i > 0) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(barX + i * segmentWidth - 1, barY, 2, barHeight);
            }
        }

        // Border
        ctx.strokeStyle = this.enraged ? '#ff4444' : '#888';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX - 3, barY - 3, barWidth + 6, barHeight + 6);

        // Boss name and pattern
        ctx.fillStyle = this.enraged ? '#ff4444' : '#fff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        const patternName = this.patterns[this.currentPattern].toUpperCase();
        const enragedText = this.enraged ? ' [ENRAGED]' : '';
        ctx.fillText(`BOSS - ${patternName}${enragedText}`, this.canvasWidth / 2, barY - 7);
    }

    // Draw phase indicator
    _drawPhaseIndicator(ctx) {
        const pulse = Math.sin(this.pulseTime) * 0.3 + 0.7;

        ctx.save();
        ctx.globalAlpha = pulse * 0.2;
        ctx.strokeStyle = this.enraged ? '#ff0000' : this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width / 2 + 15 + Math.sin(this.pulseTime * 2) * 5, 0, Math.PI * 2);
        ctx.stroke();
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
}
