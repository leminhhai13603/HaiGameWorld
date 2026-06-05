/**
 * Dino Hunter - World Objects (Obstacles, Enemies, Coins, Powerups, Projectiles, Particles)
 */

// ===== OBSTACLE =====
class Obstacle {
    constructor(x, groundY, type, speed) {
        this.x = x;
        this.type = type; // 'cactusSmall', 'cactusLarge', 'rock', 'bird'
        this.active = true;
        this.speed = speed;

        switch (type) {
            case 'cactusSmall':
                this.width = 16; this.height = 34; this.y = groundY - 34; break;
            case 'cactusLarge':
                this.width = 24; this.height = 48; this.y = groundY - 48; break;
            case 'rock':
                this.width = 32; this.height = 24; this.y = groundY - 24; break;
            case 'bird':
                this.width = 34; this.height = 24;
                this.y = groundY - 60 - Math.random() * 80;
                this.wingPhase = 0; break;
        }
    }

    update(dt) {
        this.x -= this.speed * dt;
        if (this.type === 'bird') this.wingPhase = (this.wingPhase + 0.15 * dt) % 2;
        if (this.x + this.width < -20) this.active = false;
    }

    getBounds() { return { x: this.x, y: this.y, width: this.width, height: this.height }; }

    draw(ctx) {
        switch (this.type) {
            case 'cactusSmall':
                ctx.fillStyle = '#2d6b3e';
                ctx.fillRect(this.x + 4, this.y, 8, this.height);
                ctx.fillRect(this.x, this.y + 8, 6, 8);
                ctx.fillRect(this.x + 10, this.y + 14, 6, 8);
                break;
            case 'cactusLarge':
                ctx.fillStyle = '#1e5a30';
                ctx.fillRect(this.x + 6, this.y, 12, this.height);
                ctx.fillRect(this.x, this.y + 12, 8, 10);
                ctx.fillRect(this.x + 16, this.y + 20, 8, 10);
                break;
            case 'rock':
                ctx.fillStyle = '#888';
                ctx.beginPath();
                ctx.moveTo(this.x, this.y + this.height);
                ctx.lineTo(this.x + 8, this.y);
                ctx.lineTo(this.x + 24, this.y + 2);
                ctx.lineTo(this.x + this.width, this.y + this.height);
                ctx.closePath(); ctx.fill();
                ctx.fillStyle = '#999';
                ctx.fillRect(this.x + 6, this.y + 4, 12, 6);
                break;
            case 'bird':
                const wingY = Math.sin(this.wingPhase * Math.PI) * 6;
                ctx.fillStyle = '#cc4444';
                ctx.beginPath();
                ctx.ellipse(this.x + 17, this.y + 12, 15, 10, 0, 0, Math.PI * 2);
                ctx.fill();
                // Wings
                ctx.fillStyle = '#aa3333';
                ctx.beginPath();
                ctx.moveTo(this.x + 5, this.y + 10);
                ctx.lineTo(this.x - 4, this.y + wingY);
                ctx.lineTo(this.x + 10, this.y + 12);
                ctx.closePath(); ctx.fill();
                ctx.beginPath();
                ctx.moveTo(this.x + 24, this.y + 10);
                ctx.lineTo(this.x + 38, this.y + wingY);
                ctx.lineTo(this.x + 24, this.y + 12);
                ctx.closePath(); ctx.fill();
                // Eye
                ctx.fillStyle = '#fff';
                ctx.beginPath(); ctx.arc(this.x + 24, this.y + 8, 3, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.arc(this.x + 25, this.y + 8, 1.5, 0, Math.PI * 2); ctx.fill();
                break;
        }
    }
}

// ===== ENEMY =====
class Enemy {
    constructor(x, groundY, type, speed) {
        this.x = x;
        this.type = type; // 'scorpion', 'drone', 'mutantBird'
        this.active = true;
        this.speed = speed;
        this.animTimer = 0;
        this.health = 1;
        this.score = 50;

        switch (type) {
            case 'scorpion':
                this.width = 40; this.height = 28; this.y = groundY - 28; this.health = 2; this.score = 60; break;
            case 'drone':
                this.width = 32; this.height = 24; this.y = groundY - 80 - Math.random() * 60; this.score = 80; break;
            case 'mutantBird':
                this.width = 38; this.height = 28; this.y = groundY - 50 - Math.random() * 80; this.health = 2; this.score = 100; break;
        }
    }

    update(dt) {
        this.animTimer += dt;
        this.x -= this.speed * dt;
        if (this.type === 'drone') this.y += Math.sin(this.animTimer * 0.05) * 0.5;
        if (this.x + this.width < -30) this.active = false;
    }

    hit(dmg) {
        this.health -= dmg;
        if (this.health <= 0) { this.active = false; return true; }
        return false;
    }

    getBounds() { return { x: this.x, y: this.y, width: this.width, height: this.height }; }

    draw(ctx) {
        const flash = this.animTimer % 10 < 2;
        switch (this.type) {
            case 'scorpion':
                ctx.fillStyle = flash ? '#ff8844' : '#cc5500';
                ctx.fillRect(this.x, this.y + 8, 32, 16);
                ctx.fillRect(this.x + 28, this.y, 12, 12);
                // Claws
                ctx.fillStyle = '#ff6600';
                ctx.fillRect(this.x - 6, this.y + 4, 8, 6);
                ctx.fillRect(this.x - 6, this.y + 16, 8, 6);
                // Tail
                ctx.fillStyle = '#cc5500';
                ctx.fillRect(this.x + 32, this.y + 2, 4, 10);
                ctx.fillStyle = '#ff0';
                ctx.beginPath(); ctx.arc(this.x + 36, this.y + 2, 3, 0, Math.PI * 2); ctx.fill();
                // Eyes
                ctx.fillStyle = '#f00';
                ctx.beginPath(); ctx.arc(this.x + 32, this.y + 6, 2, 0, Math.PI * 2); ctx.fill();
                break;
            case 'drone':
                ctx.fillStyle = flash ? '#888' : '#666';
                ctx.fillRect(this.x + 4, this.y + 4, 24, 12);
                ctx.fillStyle = '#444';
                ctx.fillRect(this.x, this.y + 8, 32, 4);
                // Propellers
                ctx.fillStyle = '#aaa';
                const px = Math.sin(this.animTimer * 0.3) * 4;
                ctx.fillRect(this.x + 2 + px, this.y, 10, 3);
                ctx.fillRect(this.x + 20 - px, this.y, 10, 3);
                // Eye
                ctx.fillStyle = '#f00';
                ctx.beginPath(); ctx.arc(this.x + 16, this.y + 10, 3, 0, Math.PI * 2); ctx.fill();
                break;
            case 'mutantBird':
                ctx.fillStyle = flash ? '#ff44ff' : '#cc00cc';
                ctx.beginPath();
                ctx.ellipse(this.x + 19, this.y + 14, 17, 12, 0, 0, Math.PI * 2);
                ctx.fill();
                // Wings
                const wy = Math.sin(this.animTimer * 0.15) * 8;
                ctx.fillStyle = '#aa00aa';
                ctx.beginPath();
                ctx.moveTo(this.x + 6, this.y + 12);
                ctx.lineTo(this.x - 6, this.y + wy);
                ctx.lineTo(this.x + 12, this.y + 14);
                ctx.closePath(); ctx.fill();
                ctx.beginPath();
                ctx.moveTo(this.x + 26, this.y + 12);
                ctx.lineTo(this.x + 44, this.y + wy);
                ctx.lineTo(this.x + 26, this.y + 14);
                ctx.closePath(); ctx.fill();
                // Eyes
                ctx.fillStyle = '#ff0';
                ctx.beginPath(); ctx.arc(this.x + 24, this.y + 10, 3, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#f00';
                ctx.beginPath(); ctx.arc(this.x + 25, this.y + 10, 1.5, 0, Math.PI * 2); ctx.fill();
                break;
        }
    }
}

// ===== COIN =====
class Coin {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.width = 16; this.height = 16;
        this.active = true;
        this.animTimer = Math.random() * 100;
    }

    update(dt, player) {
        this.animTimer += dt;
        // Magnet pull
        if (player.hasMagnet) {
            const dx = player.x + player.width / 2 - this.x;
            const dy = player.y + player.height / 2 - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
                this.x += (dx / dist) * 5 * dt;
                this.y += (dy / dist) * 5 * dt;
            }
        }
        this.x -= (3 + Math.floor(player.animTimer / 600)) * dt;
        if (this.x < -20) this.active = false;
    }

    getBounds() { return { x: this.x - 8, y: this.y - 8, width: this.width, height: this.height }; }

    draw(ctx) {
        const scale = 0.8 + Math.sin(this.animTimer * 0.1) * 0.2;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(scale, 1);
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 0);
        ctx.restore();
    }
}

// ===== POWERUP =====
class Powerup {
    constructor(x, groundY, type) {
        this.x = x;
        this.width = 22; this.height = 22;
        this.type = type; // 'shield', 'rapidFire', 'slowMo', 'magnet', 'weapon'
        this.active = true;
        this.animTimer = 0;
        this.y = groundY - 50 - Math.random() * 40;

        const colors = { shield: '#4488ff', rapidFire: '#ff4444', slowMo: '#aa44ff', magnet: '#ffaa00', weapon: '#ffcc00' };
        const icons = { shield: '🛡', rapidFire: '⚡', slowMo: '⏱', magnet: '🧲', weapon: '🔫' };
        this.color = colors[type]; this.icon = icons[type];
    }

    update(dt) {
        this.animTimer += dt;
        this.x -= 3 * dt;
        if (this.x < -30) this.active = false;
    }

    getBounds() { return { x: this.x - 11, y: this.y - 11, width: this.width, height: this.height }; }

    draw(ctx) {
        const bob = Math.sin(this.animTimer * 0.08) * 4;
        ctx.save();
        ctx.translate(this.x, this.y + bob);
        // Glow
        ctx.shadowColor = this.color; ctx.shadowBlur = 10;
        ctx.fillStyle = this.color + '44';
        ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = this.color; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.stroke();
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(this.icon, 0, 0);
        ctx.restore();
    }
}

// ===== PROJECTILE =====
class Projectile {
    constructor(x, y, speed) {
        this.x = x; this.y = y;
        this.width = 14; this.height = 4;
        this.speed = speed;
        this.active = true;
    }

    update(dt) {
        this.x += this.speed * dt;
        if (this.x > 900) this.active = false;
    }

    getBounds() { return { x: this.x, y: this.y - 2, width: this.width, height: this.height }; }

    draw(ctx) {
        ctx.fillStyle = '#ff4400';
        ctx.fillRect(this.x, this.y - 2, this.width, this.height);
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(this.x + 2, this.y - 1, this.width - 4, 2);
    }
}

// ===== PARTICLE =====
class Particle {
    constructor(x, y, vx, vy, color, life, size) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy;
        this.color = color; this.life = life; this.maxLife = life; this.size = size;
        this.active = true;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += 0.1 * dt;
        this.life -= dt;
        if (this.life <= 0) this.active = false;
    }

    draw(ctx) {
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

// ===== WORLD MANAGER =====
class WorldManager {
    constructor(canvasW, groundY) {
        this.canvasW = canvasW;
        this.groundY = groundY;
        this.obstacles = [];
        this.enemies = [];
        this.coins = [];
        this.powerups = [];
        this.projectiles = [];
        this.particles = [];

        this.obstacleTimer = 0;
        this.enemyTimer = 0;
        this.coinTimer = 0;
        this.powerupTimer = 0;

        this.speed = 5;
        this.score = 0;
        this.distance = 0;
        this.coinsCollected = 0;
        this.enemiesKilled = 0;

        // Difficulty
        this.spawnedAt = 0;
    }

    reset() {
        this.obstacles = []; this.enemies = []; this.coins = [];
        this.powerups = []; this.projectiles = []; this.particles = [];
        this.obstacleTimer = 0; this.enemyTimer = 0;
        this.coinTimer = 0; this.powerupTimer = 0;
        this.speed = 5; this.score = 0; this.distance = 0;
        this.coinsCollected = 0; this.enemiesKilled = 0;
        this.spawnedAt = 0;
    }

    update(dt, player, hasDoubleJump) {
        // Speed increases over time
        this.speed = 5 + Math.floor(this.distance / 500) * 0.5;
        if (this.speed > 14) this.speed = 14;
        if (player.slowMo) this.speed *= 0.5;

        const spd = this.speed;

        // Distance & score
        this.distance += spd * dt * 0.1;
        this.score = Math.floor(this.distance);

        // Spawn obstacles
        this.obstacleTimer -= dt;
        if (this.obstacleTimer <= 0) {
            this._spawnObstacle(spd, hasDoubleJump);
            this.obstacleTimer = 60 + Math.random() * 60 - Math.min(30, this.distance / 100);
            if (this.obstacleTimer < 25) this.obstacleTimer = 25;
        }

        // Spawn enemies (after score 300)
        if (this.score >= 300) {
            this.enemyTimer -= dt;
            if (this.enemyTimer <= 0) {
                this._spawnEnemy(spd);
                this.enemyTimer = 120 + Math.random() * 120;
            }
        }

        // Spawn coins
        this.coinTimer -= dt;
        if (this.coinTimer <= 0) {
            this._spawnCoin(spd);
            this.coinTimer = 40 + Math.random() * 40;
        }

        // Spawn powerups
        this.powerupTimer -= dt;
        if (this.powerupTimer <= 0) {
            this._spawnPowerup(spd, player);
            this.powerupTimer = 300 + Math.random() * 300;
        }

        // Update all
        for (const o of this.obstacles) o.update(dt);
        for (const e of this.enemies) e.update(dt);
        for (const c of this.coins) c.update(dt, player);
        for (const p of this.powerups) p.update(dt);
        for (const p of this.projectiles) p.update(dt);
        for (const p of this.particles) p.update(dt);

        // Cleanup
        this.obstacles = this.obstacles.filter(o => o.active);
        this.enemies = this.enemies.filter(e => e.active);
        this.coins = this.coins.filter(c => c.active);
        this.powerups = this.powerups.filter(p => p.active);
        this.projectiles = this.projectiles.filter(p => p.active);
        this.particles = this.particles.filter(p => p.active);
    }

    _spawnObstacle(spd, hasDoubleJump) {
        const types = ['cactusSmall', 'cactusSmall', 'cactusLarge', 'rock'];
        if (this.score > 150) types.push('bird', 'bird');
        const type = types[Math.floor(Math.random() * types.length)];
        this.obstacles.push(new Obstacle(this.canvasW + 20, this.groundY, type, spd));
    }

    _spawnEnemy(spd) {
        const types = ['scorpion'];
        if (this.score > 500) types.push('drone');
        if (this.score > 800) types.push('mutantBird');
        const type = types[Math.floor(Math.random() * types.length)];
        this.enemies.push(new Enemy(this.canvasW + 20, this.groundY, type, spd));
    }

    _spawnCoin(spd) {
        const count = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
            const x = this.canvasW + 20 + i * 30;
            const y = this.groundY - 40 - Math.random() * 100;
            this.coins.push(new Coin(x, y));
        }
    }

    _spawnPowerup(spd, player) {
        if (this.score < 100) return;
        const types = ['shield'];
        if (this.score >= 100) types.push('weapon');
        if (this.score >= 200) types.push('rapidFire', 'slowMo');
        if (this.score >= 400) types.push('magnet');
        const type = types[Math.floor(Math.random() * types.length)];
        this.powerups.push(new Powerup(this.canvasW + 20, this.groundY, type));
    }

    fireWeapon(x, y) {
        this.projectiles.push(new Projectile(x, y, 12));
    }

    addExplosion(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            this.particles.push(new Particle(x, y,
                Math.cos(angle) * speed, Math.sin(angle) * speed - 2,
                color, 20 + Math.random() * 10, 2 + Math.random() * 3));
        }
    }

    draw(ctx) {
        for (const o of this.obstacles) o.draw(ctx);
        for (const e of this.enemies) e.draw(ctx);
        for (const c of this.coins) c.draw(ctx);
        for (const p of this.powerups) p.draw(ctx);
        for (const p of this.projectiles) p.draw(ctx);
        for (const p of this.particles) p.draw(ctx);
    }
}
