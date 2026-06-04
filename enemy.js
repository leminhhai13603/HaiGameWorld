/**
 * Enemy - Alien birds that form formations and stay on screen
 * Enemies move into position, then attack from formation
 */
class Enemy {
    constructor(x, y, type, targetX, targetY, delay) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.active = true;

        // Target position in formation
        this.targetX = targetX;
        this.targetY = targetY;
        this.enterDelay = delay || 0; // Frames before this enemy starts moving
        this.entering = true; // Still moving into formation
        this.inFormation = false;

        // Set properties based on type
        this.setTypeProperties(type);

        // Animation
        this.animTimer = 0;
        this.wingAngle = 0;
        this.hitFlash = 0;

        // Shooting
        this.shootTimer = 60 + Math.random() * 120;

        // Movement offset (for formation movement)
        this.formationOffsetX = 0;
        this.formationOffsetY = 0;
    }

    // Set properties based on enemy type
    setTypeProperties(type) {
        switch (type) {
            case 'chick':
                this.width = 28;
                this.height = 24;
                this.health = 1;
                this.maxHealth = 1;
                this.score = 100;
                this.color = '#ffcc00';
                this.canShoot = true;
                this.shootChance = 0.003;
                this.dropRate = 0.08;
                break;

            case 'hen':
                this.width = 34;
                this.height = 30;
                this.health = 2;
                this.maxHealth = 2;
                this.score = 200;
                this.color = '#ff8844';
                this.canShoot = true;
                this.shootChance = 0.005;
                this.dropRate = 0.12;
                break;

            case 'rooster':
                this.width = 40;
                this.height = 36;
                this.health = 4;
                this.maxHealth = 4;
                this.score = 400;
                this.color = '#ff4444';
                this.canShoot = true;
                this.shootChance = 0.008;
                this.dropRate = 0.18;
                break;

            case 'eagle':
                this.width = 36;
                this.height = 28;
                this.health = 3;
                this.maxHealth = 3;
                this.score = 300;
                this.color = '#8888ff';
                this.canShoot = true;
                this.shootChance = 0.006;
                this.dropRate = 0.15;
                break;

            case 'phoenix':
                this.width = 44;
                this.height = 38;
                this.health = 6;
                this.maxHealth = 6;
                this.score = 500;
                this.color = '#ff00ff';
                this.canShoot = true;
                this.shootChance = 0.01;
                this.dropRate = 0.25;
                break;
        }
    }

    // Update enemy
    update(canvasWidth, canvasHeight, formationDirX, formationDirY, dt) {
        if (!this.active) return;

        this.animTimer += dt;
        if (this.hitFlash > 0) this.hitFlash -= dt;

        // Wing flap
        if (this.animTimer % 8 < 1) {
            this.wingAngle = this.wingAngle === 0 ? 1 : 0;
        }

        // Enter delay
        if (this.enterDelay > 0) {
            this.enterDelay -= dt;
            return;
        }

        // Moving into formation
        if (this.entering) {
            const dx = this.targetX + this.formationOffsetX - this.x;
            const dy = this.targetY + this.formationOffsetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 3) {
                this.x = this.targetX + this.formationOffsetX;
                this.y = this.targetY + this.formationOffsetY;
                this.entering = false;
                this.inFormation = true;
            } else {
                this.x += (dx / dist) * 4 * dt;
                this.y += (dy / dist) * 4 * dt;
            }
            return;
        }

        // In formation - move with formation
        if (this.inFormation) {
            this.formationOffsetX += formationDirX * dt;
            this.formationOffsetY += formationDirY * dt;

            this.x = this.targetX + this.formationOffsetX;
            this.y = this.targetY + this.formationOffsetY;
        }

        // Shooting
        this.shootTimer -= dt;
    }

    // Check if should shoot
    shouldShoot() {
        if (!this.canShoot || this.entering || this.enterDelay > 0) return false;
        if (this.shootTimer > 0) return false;

        if (Math.random() < this.shootChance) {
            this.shootTimer = 30 + Math.random() * 90;
            return true;
        }
        return false;
    }

    // Check if should drop gift
    shouldDropGift() {
        return Math.random() < this.dropRate;
    }

    // Check if should drop poop
    shouldDropPoop() {
        if (this.entering || this.enterDelay > 0) return false;
        return Math.random() < 0.002;
    }

    // Take damage
    takeDamage(damage) {
        this.health -= damage;
        this.hitFlash = 6;
        if (this.health <= 0) {
            this.active = false;
            return true;
        }
        return false;
    }

    // Draw enemy (optimized)
    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        const baseColor = this.hitFlash > 0 ? '#ffffff' : this.color;

        // Body (single path for efficiency)
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Belly
        ctx.fillStyle = this.hitFlash > 0 ? '#eee' : this._lighten(this.color, 0.25);
        ctx.beginPath();
        ctx.ellipse(0, 2, this.width / 2.8, this.height / 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wings (simplified)
        const wingY = this.wingAngle === 0 ? -4 : 4;
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.moveTo(-this.width / 3, 0);
        ctx.lineTo(-this.width / 2 - 6, wingY - 3);
        ctx.lineTo(-this.width / 3 + 3, 3);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(this.width / 3, 0);
        ctx.lineTo(this.width / 2 + 6, wingY - 3);
        ctx.lineTo(this.width / 3 - 3, 3);
        ctx.closePath();
        ctx.fill();

        // Eyes + pupils (single draw)
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-5, -4, 4, 0, Math.PI * 2);
        ctx.arc(5, -4, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(-4, -4, 2, 0, Math.PI * 2);
        ctx.arc(6, -4, 2, 0, Math.PI * 2);
        ctx.fill();

        // Beak
        ctx.fillStyle = '#ff8800';
        ctx.beginPath();
        ctx.moveTo(0, 1);
        ctx.lineTo(-3, 7);
        ctx.lineTo(3, 7);
        ctx.closePath();
        ctx.fill();

        // Type details (minimal)
        if (this.type === 'rooster') {
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.moveTo(-2, -this.height / 2);
            ctx.lineTo(0, -this.height / 2 - 6);
            ctx.lineTo(2, -this.height / 2);
            ctx.closePath();
            ctx.fill();
        }

        // Health bar
        if (this.maxHealth > 1 && this.health < this.maxHealth) {
            this._drawHealthBar(ctx);
        }

        ctx.restore();
    }

    // Draw type-specific details
    _drawTypeDetails(ctx, baseColor) {
        switch (this.type) {
            case 'rooster':
                // Comb on top
                ctx.fillStyle = this.hitFlash > 0 ? '#fff' : '#ff0000';
                ctx.beginPath();
                ctx.moveTo(-3, -this.height / 2);
                ctx.lineTo(0, -this.height / 2 - 8);
                ctx.lineTo(3, -this.height / 2);
                ctx.closePath();
                ctx.fill();
                break;

            case 'eagle':
                // Sharp wings
                ctx.strokeStyle = this.hitFlash > 0 ? '#fff' : '#aaaaff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-this.width / 2 - 8, -2);
                ctx.lineTo(-this.width / 2 - 15, -8);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(this.width / 2 + 8, -2);
                ctx.lineTo(this.width / 2 + 15, -8);
                ctx.stroke();
                break;

            case 'phoenix':
                // Flame aura
                ctx.fillStyle = `rgba(255, 100, 0, ${0.3 + Math.sin(this.animTimer * 0.1) * 0.15})`;
                ctx.beginPath();
                ctx.arc(0, 0, this.width / 2 + 5, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
    }

    // Draw health bar
    _drawHealthBar(ctx) {
        const barWidth = this.width + 6;
        const barHeight = 3;
        const barY = -this.height / 2 - 8;

        ctx.fillStyle = '#333';
        ctx.fillRect(-barWidth / 2, barY, barWidth, barHeight);

        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffaa00' : '#ff0000';
        ctx.fillRect(-barWidth / 2, barY, barWidth * healthPercent, barHeight);
    }

    // Lighten color
    _lighten(hex, factor) {
        const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + 255 * factor);
        const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + 255 * factor);
        const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + 255 * factor);
        return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
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

/**
 * FormationManager - Manages enemy formations
 * Enemies move into position and stay in formation
 */
class FormationManager {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.enemies = [];

        // Formation movement
        this.dirX = 1;
        this.dirY = 0;
        this.moveSpeed = 0.5;
        this.moveTimer = 0;
        this.dropTimer = 0; // Periodic formation drop

        // Formation bounds
        this.formationLeft = 0;
        this.formationRight = 0;
        this.formationTop = 0;
        this.formationBottom = 0;
    }

    // Generate a full formation for the wave
    generateFormation(waveNumber) {
        this.enemies = [];
        this.dirX = 1;
        this.moveTimer = 0;
        this.dropTimer = 0;

        const isBossWave = waveNumber % 5 === 0;

        if (isBossWave) {
            return this._generateBossMinions(waveNumber);
        }

        // Calculate formation size based on wave (optimized for performance)
        const cols = Math.min(6 + Math.floor(waveNumber / 3), 10);
        const rows = Math.min(2 + Math.floor(waveNumber / 4), 4);
        const types = this._getWaveTypes(waveNumber);

        // Spacing
        const spacingX = 55;
        const spacingY = 45;
        const startX = this.canvasWidth / 2 - ((cols - 1) * spacingX) / 2;
        const startY = 40;

        let delay = 0;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const targetX = startX + col * spacingX;
                const targetY = startY + row * spacingY;

                // Enemies spawn from top
                const spawnX = startX + col * spacingX + (Math.random() - 0.5) * 100;
                const spawnY = -30 - Math.random() * 200;

                // Type based on row (back rows are tougher)
                const typeIndex = Math.min(Math.floor(row / 2), types.length - 1);
                const type = types[typeIndex];

                const enemy = new Enemy(spawnX, spawnY, type, targetX, targetY, delay);
                this.enemies.push(enemy);

                delay += 2; // Stagger entry
            }
        }

        return this.enemies;
    }

    // Generate boss wave minions
    _generateBossMinions(waveNumber) {
        const count = 6 + Math.floor(waveNumber / 5);
        const types = this._getWaveTypes(waveNumber);
        const spacingX = 60;
        const startX = this.canvasWidth / 2 - ((count - 1) * spacingX) / 2;

        let delay = 0;
        for (let i = 0; i < count; i++) {
            const targetX = startX + i * spacingX;
            const targetY = 200 + (i % 2) * 40;
            const spawnX = targetX + (Math.random() - 0.5) * 150;
            const spawnY = -30 - Math.random() * 100;

            const type = types[i % types.length];
            const enemy = new Enemy(spawnX, spawnY, type, targetX, targetY, delay);
            this.enemies.push(enemy);
            delay += 5;
        }

        return this.enemies;
    }

    // Get enemy types for wave
    _getWaveTypes(waveNumber) {
        if (waveNumber <= 2) return ['chick'];
        if (waveNumber <= 4) return ['chick', 'hen'];
        if (waveNumber <= 7) return ['chick', 'hen', 'eagle'];
        if (waveNumber <= 10) return ['chick', 'hen', 'eagle', 'rooster'];
        return ['chick', 'hen', 'eagle', 'rooster', 'phoenix'];
    }

    // Update formation
    update(dt) {
        // Update formation movement direction
        this.moveTimer += dt;

        // Calculate formation bounds
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        for (const enemy of this.enemies) {
            if (!enemy.active) continue;
            if (enemy.entering) continue;

            const left = enemy.x - enemy.width / 2;
            const right = enemy.x + enemy.width / 2;
            const top = enemy.y - enemy.height / 2;
            const bottom = enemy.y + enemy.height / 2;

            if (left < minX) minX = left;
            if (right > maxX) maxX = right;
            if (top < minY) minY = top;
            if (bottom > maxY) maxY = bottom;
        }

        // Bounce formation off edges
        if (maxX > this.canvasWidth - 20) {
            this.dirX = -1;
        } else if (minX < 20) {
            this.dirX = 1;
        }

        // Periodic drop (formation moves down slightly)
        this.dropTimer += dt;
        if (this.dropTimer > 600) { // Every 10 seconds
            this.dropTimer = 0;
            // All enemies shift down
            for (const enemy of this.enemies) {
                if (enemy.active) {
                    enemy.targetY += 20;
                }
            }
        }

        // Update each enemy
        for (const enemy of this.enemies) {
            enemy.update(this.canvasWidth, this.canvasHeight, this.dirX * this.moveSpeed, 0, dt);
        }

        // Remove dead enemies
        this.enemies = this.enemies.filter(e => e.active);
    }

    // Draw all enemies
    draw(ctx) {
        for (const enemy of this.enemies) {
            enemy.draw(ctx);
        }
    }

    // Get all enemies
    getEnemies() {
        return this.enemies;
    }

    // Check if formation is cleared
    isCleared() {
        return this.enemies.length === 0;
    }

    // Get alive count
    getAliveCount() {
        return this.enemies.filter(e => e.active).length;
    }

    // Clear all
    clear() {
        this.enemies = [];
    }
}
