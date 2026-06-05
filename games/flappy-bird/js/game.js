/**
 * Flappy Bird - Main Game Controller
 */
// roundRect polyfill for older browsers
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
        const r = typeof radii === 'number' ? radii : (radii && radii[0]) || 0;
        this.moveTo(x + r, y);
        this.lineTo(x + w - r, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r);
        this.lineTo(x + w, y + h - r);
        this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.lineTo(x + r, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r);
        this.lineTo(x, y + r);
        this.quadraticCurveTo(x, y, x + r, y);
        this.closePath();
    };
}

const GameState = {
    READY: 'ready',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver'
};

class FlappyGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Game dimensions
        this.W = 400;
        this.H = 600;
        this.canvas.width = this.W;
        this.canvas.height = this.H;

        this.state = GameState.READY;
        this.score = 0;
        this.highScore = Storage.getHighScore();

        // Bird
        this.bird = new Bird(80, this.H / 2 - 20);

        // Pipes
        this.pipes = [];
        this.pipeWidth = 52;
        this.pipeGap = 150;
        this.pipeSpeed = 3;
        this.pipeSpawnTimer = 0;
        this.pipeSpawnInterval = 180;

        // Ground
        this.groundY = this.H - 80;
        this.groundOffset = 0;

        // Background
        this.cloudX = [];
        for (let i = 0; i < 4; i++) {
            this.cloudX.push({ x: i * 120 + Math.random() * 60, y: 40 + Math.random() * 80 });
        }

        // Animation
        this.flashTimer = 0;
        this.gameOverTimer = 0;
        this.scorePopups = [];

        // Frame rate
        this.lastTime = 0;
        this.frameInterval = 1000 / 60;

        // Dead bird bounce
        this.deadVelocity = 0;
        this.deadBounced = false;

        this._setupInput();
        this._gameLoop(performance.now());
    }

    _setupInput() {
        const action = () => {
            AudioManager.resume();
            switch (this.state) {
                case GameState.READY:
                    this.state = GameState.PLAYING;
                    this.bird.flap();
                    AudioManager.play('flap');
                    break;
                case GameState.PLAYING:
                    this.bird.flap();
                    AudioManager.play('flap');
                    break;
                case GameState.GAME_OVER:
                    if (this.gameOverTimer > 30) this._restart();
                    break;
            }
        };

        this.canvas.addEventListener('click', action);
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            action();
        }, { passive: false });

        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    action();
                    break;
                case 'p': case 'P':
                    if (this.state === GameState.PLAYING) this.state = GameState.PAUSED;
                    else if (this.state === GameState.PAUSED) this.state = GameState.PLAYING;
                    break;
                case 'r': case 'R':
                    if (this.state === GameState.GAME_OVER) this._restart();
                    break;
                case 'Escape':
                    if (this.state === GameState.PAUSED) this.state = GameState.PLAYING;
                    break;
            }
        });
    }

    _restart() {
        this.bird.reset();
        this.pipes = [];
        this.score = 0;
        this.pipeSpawnTimer = 0;
        this.flashTimer = 0;
        this.gameOverTimer = 0;
        this.deadVelocity = 0;
        this.deadBounced = false;
        this.scorePopups = [];
        this.state = GameState.READY;
    }

    _spawnPipe() {
        const minY = 80;
        const maxY = this.groundY - this.pipeGap - 80;
        const gapY = minY + Math.random() * (maxY - minY);
        this.pipes.push({
            x: this.W + 10,
            gapY: gapY,
            scored: false
        });
    }

    _gameLoop(now) {
        requestAnimationFrame((t) => this._gameLoop(t));
        const elapsed = now - this.lastTime;
        if (elapsed < this.frameInterval) return;
        this.lastTime = now - (elapsed % this.frameInterval);
        this._update();
        this._render();
    }

    _update() {
        // Ground scrolling (always)
        if (this.state !== GameState.GAME_OVER) {
            this.groundOffset = (this.groundOffset + 2) % 24;
        }

        // Cloud movement
        for (const c of this.cloudX) {
            c.x -= 0.3;
            if (c.x < -80) c.x = this.W + 20 + Math.random() * 40;
        }

        // Score popups
        for (let i = this.scorePopups.length - 1; i >= 0; i--) {
            this.scorePopups[i].y -= 1;
            this.scorePopups[i].timer--;
            if (this.scorePopups[i].timer <= 0) this.scorePopups.splice(i, 1);
        }

        if (this.state === GameState.READY) {
            // Bob bird
            this.bird.y = this.H / 2 - 20 + Math.sin(Date.now() * 0.004) * 10;
            this.bird.animTimer += 1;
            this.bird.wingPhase = Math.floor(this.bird.animTimer / 5) % 3;
            return;
        }

        if (this.state === GameState.GAME_OVER) {
            this.gameOverTimer++;
            // Bird falls after death
            if (this.bird.y < this.groundY - this.bird.height) {
                this.deadVelocity += 0.5;
                this.bird.y += this.deadVelocity;
                this.bird.rotation = Math.min(1.5, this.bird.rotation + 0.05);
                if (this.bird.y >= this.groundY - this.bird.height) {
                    this.bird.y = this.groundY - this.bird.height;
                    this.deadVelocity = 0;
                }
            }
            if (this.flashTimer > 0) this.flashTimer--;
            return;
        }

        if (this.state !== GameState.PLAYING) return;

        // Update bird
        this.bird.update(1);

        // Spawn pipes
        this.pipeSpawnTimer++;
        if (this.pipeSpawnTimer >= this.pipeSpawnInterval / this.pipeSpeed) {
            this._spawnPipe();
            this.pipeSpawnTimer = 0;
        }

        // Update pipes
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const p = this.pipes[i];
            p.x -= this.pipeSpeed;

            // Score
            if (!p.scored && p.x + this.pipeWidth < this.bird.x) {
                p.scored = true;
                this.score++;
                AudioManager.play('score');
                this.scorePopups.push({
                    x: this.bird.x + 30,
                    y: this.bird.y - 10,
                    text: '+1',
                    timer: 30
                });
            }

            // Remove offscreen
            if (p.x + this.pipeWidth < -10) {
                this.pipes.splice(i, 1);
            }
        }

        // Collision detection
        if (this._checkCollision()) {
            this._onDeath();
        }
    }

    _checkCollision() {
        const bb = this.bird.getBounds();

        // Ground
        if (this.bird.y + this.bird.height >= this.groundY) return true;

        // Ceiling
        if (this.bird.y < 0) return true;

        // Pipes
        for (const p of this.pipes) {
            // Top pipe
            if (this._rectsOverlap(bb, {
                x: p.x, y: 0,
                width: this.pipeWidth, height: p.gapY
            })) return true;

            // Bottom pipe
            if (this._rectsOverlap(bb, {
                x: p.x, y: p.gapY + this.pipeGap,
                width: this.pipeWidth, height: this.groundY - p.gapY - this.pipeGap
            })) return true;
        }

        return false;
    }

    _rectsOverlap(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    _onDeath() {
        this.bird.alive = false;
        this.state = GameState.GAME_OVER;
        this.gameOverTimer = 0;
        this.flashTimer = 8;
        this.deadVelocity = -4;
        AudioManager.play('hit');
        setTimeout(() => AudioManager.play('swoosh'), 200);

        const isNew = Storage.setHighScore(this.score);
        this.highScore = Storage.getHighScore();
        Storage.addGamePlayed();
    }

    _render() {
        const ctx = this.ctx;

        // Sky background
        const skyGrad = ctx.createLinearGradient(0, 0, 0, this.groundY);
        skyGrad.addColorStop(0, '#4ec0ca');
        skyGrad.addColorStop(0.7, '#71d4db');
        skyGrad.addColorStop(1, '#b8e8b0');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, this.W, this.groundY);

        // Clouds
        for (const c of this.cloudX) {
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.beginPath();
            ctx.ellipse(c.x, c.y, 40, 18, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(c.x - 20, c.y + 6, 25, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(c.x + 22, c.y + 4, 28, 14, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Pipes
        for (const p of this.pipes) {
            this._drawPipe(ctx, p);
        }

        // Ground
        this._drawGround(ctx);

        // Bird
        this.bird.draw(ctx);

        // Score popups
        for (const sp of this.scorePopups) {
            ctx.globalAlpha = sp.timer / 30;
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px Orbitron, monospace';
            ctx.textAlign = 'center';
            ctx.fillText(sp.text, sp.x, sp.y);
            ctx.globalAlpha = 1;
        }

        // Score display (during play)
        if (this.state === GameState.PLAYING || this.state === GameState.READY) {
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.font = 'bold 48px Orbitron, monospace';
            ctx.textAlign = 'center';
            ctx.strokeText(`${this.score}`, this.W / 2, 70);
            ctx.fillText(`${this.score}`, this.W / 2, 70);
        }

        // Overlays
        switch (this.state) {
            case GameState.READY:
                this._drawReady(ctx);
                break;
            case GameState.PAUSED:
                this._drawPaused(ctx);
                break;
            case GameState.GAME_OVER:
                this._drawGameOver(ctx);
                break;
        }

        // Flash effect
        if (this.flashTimer > 0) {
            ctx.fillStyle = '#fff';
            ctx.globalAlpha = this.flashTimer / 8;
            ctx.fillRect(0, 0, this.W, this.H);
            ctx.globalAlpha = 1;
        }
    }

    _drawPipe(ctx, pipe) {
        const capH = 26;
        const capOverhang = 4;
        const x = pipe.x;
        const w = this.pipeWidth;
        const gapY = pipe.gapY;

        // Top pipe body
        const pipeGrad = ctx.createLinearGradient(x, 0, x + w, 0);
        pipeGrad.addColorStop(0, '#5a3a1a');
        pipeGrad.addColorStop(0.15, '#74b233');
        pipeGrad.addColorStop(0.5, '#8fd048');
        pipeGrad.addColorStop(0.85, '#74b233');
        pipeGrad.addColorStop(1, '#5a3a1a');
        ctx.fillStyle = pipeGrad;
        ctx.fillRect(x, 0, w, gapY);

        // Top pipe cap
        ctx.fillStyle = pipeGrad;
        ctx.fillRect(x - capOverhang, gapY - capH, w + capOverhang * 2, capH);
        ctx.strokeStyle = '#3a6a1a';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - capOverhang, gapY - capH, w + capOverhang * 2, capH);

        // Top pipe border
        ctx.strokeStyle = '#3a6a1a';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, 0, w, gapY);

        // Bottom pipe body
        const bottomY = gapY + this.pipeGap;
        ctx.fillStyle = pipeGrad;
        ctx.fillRect(x, bottomY, w, this.groundY - bottomY);

        // Bottom pipe cap
        ctx.fillRect(x - capOverhang, bottomY, w + capOverhang * 2, capH);
        ctx.strokeRect(x - capOverhang, bottomY, w + capOverhang * 2, capH);

        // Bottom pipe border
        ctx.strokeRect(x, bottomY, w, this.groundY - bottomY);

        // Highlight streaks
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(x + 8, 0, 6, gapY - capH);
        ctx.fillRect(x + 8, bottomY + capH, 6, this.groundY - bottomY - capH);
    }

    _drawGround(ctx) {
        const y = this.groundY;
        const h = this.H - y;

        // Ground base
        ctx.fillStyle = '#deb887';
        ctx.fillRect(0, y, this.W, h);

        // Ground top strip (darker)
        ctx.fillStyle = '#c8a060';
        ctx.fillRect(0, y, this.W, 4);

        // Ground grass line
        ctx.fillStyle = '#5db83a';
        ctx.fillRect(0, y - 2, this.W, 6);

        // Ground texture (scrolling stripes)
        ctx.fillStyle = '#c8a060';
        for (let i = -1; i < this.W / 24 + 2; i++) {
            const sx = i * 24 - this.groundOffset;
            ctx.fillRect(sx, y + 12, 14, 3);
            ctx.fillRect(sx + 10, y + 30, 14, 3);
            ctx.fillRect(sx + 4, y + 50, 14, 3);
        }
    }

    _drawReady(ctx) {
        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(0, 0, this.W, this.H);

        ctx.textAlign = 'center';

        // Title
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.font = 'bold 36px Orbitron, monospace';
        ctx.strokeText('FLAPPY', this.W / 2, this.H / 2 - 80);
        ctx.fillText('FLAPPY', this.W / 2, this.H / 2 - 80);

        ctx.font = 'bold 28px Orbitron, monospace';
        ctx.strokeText('BIRD', this.W / 2, this.H / 2 - 45);
        ctx.fillText('BIRD', this.W / 2, this.H / 2 - 45);

        // Tap instruction
        const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px Rajdhani, sans-serif';
        ctx.fillText('Tap or Press SPACE', this.W / 2, this.H / 2 + 30);
        ctx.globalAlpha = 1;

        // Best score
        if (this.highScore > 0) {
            ctx.fillStyle = '#ffcc00';
            ctx.font = '14px Rajdhani, sans-serif';
            ctx.fillText(`Best: ${this.highScore}`, this.W / 2, this.H / 2 + 65);
        }
    }

    _drawPaused(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, this.W, this.H);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 32px Orbitron, monospace';
        ctx.fillText('PAUSED', this.W / 2, this.H / 2 - 10);

        ctx.fillStyle = '#aaa';
        ctx.font = '15px Rajdhani, sans-serif';
        ctx.fillText('Press P to resume', this.W / 2, this.H / 2 + 25);
    }

    _drawGameOver(ctx) {
        // Slide-in panel
        const progress = Math.min(1, this.gameOverTimer / 20);
        const panelH = 220;
        const panelY = (this.H / 2 - panelH / 2) + (1 - progress) * 50;

        ctx.globalAlpha = progress;

        // Panel background
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth = 2;
        const px = this.W / 2 - 130;
        ctx.beginPath();
        ctx.roundRect(px, panelY, 260, panelH, 12);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';

        // Game Over text
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 28px Orbitron, monospace';
        ctx.fillText('GAME OVER', this.W / 2, panelY + 40);

        // Score panel
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.roundRect(px + 20, panelY + 55, 220, 70, 8);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = '14px Rajdhani, sans-serif';
        ctx.fillText('SCORE', this.W / 2, panelY + 75);

        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 30px Orbitron, monospace';
        ctx.fillText(`${this.score}`, this.W / 2, panelY + 105);

        // Best score
        ctx.fillStyle = '#fff';
        ctx.font = '14px Rajdhani, sans-serif';
        ctx.fillText('BEST', this.W / 2, panelY + 140);

        ctx.fillStyle = '#44ff88';
        ctx.font = 'bold 22px Orbitron, monospace';
        ctx.fillText(`${this.highScore}`, this.W / 2, panelY + 165);

        // New record badge
        if (this.score === this.highScore && this.score > 0) {
            ctx.fillStyle = '#ff6600';
            ctx.font = 'bold 12px Orbitron, monospace';
            ctx.fillText('NEW RECORD!', this.W / 2, panelY + 185);
        }

        // Restart hint
        if (this.gameOverTimer > 30) {
            const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
            ctx.globalAlpha = progress * pulse;
            ctx.fillStyle = '#aaa';
            ctx.font = '15px Rajdhani, sans-serif';
            ctx.fillText('Tap or Press R to Restart', this.W / 2, panelY + panelH - 15);
        }

        ctx.globalAlpha = 1;
    }
}

window.addEventListener('load', () => { new FlappyGame(); });
