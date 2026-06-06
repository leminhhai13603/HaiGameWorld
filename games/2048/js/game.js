/**
 * 2048 - Main Game Controller
 */

const TILE_COLORS = {
    2:    { bg: '#eee4da', fg: '#776e65' },
    4:    { bg: '#eee1c9', fg: '#776e65' },
    8:    { bg: '#f3b27a', fg: '#f9f6f2' },
    16:   { bg: '#f69664', fg: '#f9f6f2' },
    32:   { bg: '#f77c5f', fg: '#f9f6f2' },
    64:   { bg: '#f75f3b', fg: '#f9f6f2' },
    128:  { bg: '#edd073', fg: '#f9f6f2' },
    256:  { bg: '#edcc62', fg: '#f9f6f2' },
    512:  { bg: '#edc950', fg: '#f9f6f2' },
    1024: { bg: '#edc53f', fg: '#f9f6f2' },
    2048: { bg: '#edc22e', fg: '#f9f6f2' },
};

const ACHIEVEMENTS = [
    { id: '128',   value: 128,   label: '128!',    desc: 'Reached 128 tile' },
    { id: '256',   value: 256,   label: '256!',    desc: 'Reached 256 tile' },
    { id: '512',   value: 512,   label: '512!',    desc: 'Reached 512 tile' },
    { id: '1024',  value: 1024,  label: '1024!',   desc: 'Reached 1024 tile' },
    { id: '2048',  value: 2048,  label: '2048!',   desc: 'Reached 2048 tile' },
    { id: '4096',  value: 4096,  label: '4096!',   desc: 'Reached 4096 tile' },
    { id: '8192',  value: 8192,  label: '8192!',   desc: 'Reached 8192 tile' },
];

class Game2048 {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Layout constants
        this.GRID_SIZE = 4;
        this.TILE_GAP = 12;
        this.TILE_RADIUS = 8;
        this.PADDING = 16;

        // Calculate responsive size
        this._resize();
        window.addEventListener('resize', () => this._resize());

        // Game state
        this.grid = [];
        this.score = 0;
        this.bestScore = Storage.getBestScore();
        this.largestTile = 0;
        this.moves = 0;
        this.state = 'ready'; // ready, playing, gameover

        // Animations
        this.animations = []; // {r, c, type, value, progress, fromR, fromC}
        this.scorePopup = null;
        this.achievementQueue = [];
        this.currentAchievement = null;
        this.achievementTimer = 0;
        this.mergeParticles = [];

        // Input
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.inputLocked = false;

        // Frame rate
        this.lastTime = 0;
        this.frameInterval = 1000 / 60;
        this._rafId = null;
        this._handlers = {};

        this._setupInput();
        this._initGrid();
        this._spawnTile();
        this._spawnTile();
        this.state = 'playing';
        Storage.addGamePlayed();

        window.addEventListener('beforeunload', () => { AudioManager.close(); });
        this._gameLoop(performance.now());
    }

    _resize() {
        const maxW = Math.min(window.innerWidth - 32, 480);
        const maxH = window.innerHeight - 200;
        this.CANVAS_SIZE = Math.min(maxW, maxH, 480);
        this.canvas.width = this.CANVAS_SIZE;
        this.canvas.height = this.CANVAS_SIZE;
        this.TILE_SIZE = (this.CANVAS_SIZE - this.PADDING * 2 - this.TILE_GAP * (this.GRID_SIZE + 1)) / this.GRID_SIZE;
    }

    _initGrid() {
        this.grid = [];
        for (let r = 0; r < this.GRID_SIZE; r++) {
            this.grid[r] = [];
            for (let c = 0; c < this.GRID_SIZE; c++) {
                this.grid[r][c] = 0;
            }
        }
    }

    _getEmptyCells() {
        const cells = [];
        for (let r = 0; r < this.GRID_SIZE; r++)
            for (let c = 0; c < this.GRID_SIZE; c++)
                if (this.grid[r][c] === 0) cells.push({ r, c });
        return cells;
    }

    _spawnTile() {
        const empty = this._getEmptyCells();
        if (empty.length === 0) return;
        const cell = empty[Math.floor(Math.random() * empty.length)];
        const value = Math.random() < 0.9 ? 2 : 4;
        this.grid[cell.r][cell.c] = value;
        this.animations.push({
            r: cell.r, c: cell.c, type: 'spawn', value,
            progress: 0
        });
    }

    _setupInput() {
        this._handlers.keydown = (e) => {
            AudioManager.resume();
            switch (e.key) {
                case 'ArrowUp': case 'w': case 'W':
                    e.preventDefault(); this._move('up'); break;
                case 'ArrowDown': case 's': case 'S':
                    e.preventDefault(); this._move('down'); break;
                case 'ArrowLeft': case 'a': case 'A':
                    e.preventDefault(); this._move('left'); break;
                case 'ArrowRight': case 'd': case 'D':
                    e.preventDefault(); this._move('right'); break;
                case 'r': case 'R':
                    this._restart(); break;
            }
        };
        document.addEventListener('keydown', this._handlers.keydown);

        // Touch / Swipe
        this._handlers.touchstart = (e) => {
            e.preventDefault();
            AudioManager.resume();
            const t = e.touches[0];
            this.touchStartX = t.clientX;
            this.touchStartY = t.clientY;
        };
        this.canvas.addEventListener('touchstart', this._handlers.touchstart, { passive: false });

        this._handlers.touchmove = (e) => {
            e.preventDefault(); // Prevent page scroll while swiping
        };
        this.canvas.addEventListener('touchmove', this._handlers.touchmove, { passive: false });

        this._handlers.touchend = (e) => {
            e.preventDefault();
            if (e.changedTouches.length === 0) return;
            const t = e.changedTouches[0];
            const dx = t.clientX - this.touchStartX;
            const dy = t.clientY - this.touchStartY;
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);
            if (Math.max(absDx, absDy) < 30) return; // too short
            if (absDx > absDy) {
                this._move(dx > 0 ? 'right' : 'left');
            } else {
                this._move(dy > 0 ? 'down' : 'up');
            }
        }, { passive: false });

        // Mouse drag (desktop fallback)
        let mouseDown = false;
        this.canvas.addEventListener('mousedown', (e) => {
            mouseDown = true;
            this.touchStartX = e.clientX;
            this.touchStartY = e.clientY;
            AudioManager.resume();
        });
        this.canvas.addEventListener('mouseup', (e) => {
            if (!mouseDown) return;
            mouseDown = false;
            const dx = e.clientX - this.touchStartX;
            const dy = e.clientY - this.touchStartY;
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);
            if (Math.max(absDx, absDy) < 30) return;
            if (absDx > absDy) {
                this._move(dx > 0 ? 'right' : 'left');
            } else {
                this._move(dy > 0 ? 'down' : 'up');
            }
        });

        // New Game button
        document.getElementById('btn-new-game').addEventListener('click', () => this._restart());

        // Sound toggle
        const soundBtn = document.getElementById('sound-toggle');
        soundBtn.addEventListener('click', () => {
            const on = AudioManager.toggle();
            soundBtn.textContent = on ? '🔊' : '🔇';
        });

        // Update displays
        this._updateDisplays();
    }

    _move(dir) {
        if (this.state !== 'playing' || this.inputLocked) return;

        let moved = false;
        let mergeScore = 0;
        const mergedTiles = []; // for animations

        const traverse = this._getTraversalOrder(dir);

        // Track which cells have already merged this turn
        const merged = Array.from({ length: this.GRID_SIZE }, () =>
            Array(this.GRID_SIZE).fill(false)
        );

        for (const { r, c } of traverse) {
            if (this.grid[r][c] === 0) continue;

            const { farthestR, farthestC, nextR, nextC } = this._findFarthest(r, c, dir);
            const currentValue = this.grid[r][c];

            // Check if can merge with next cell
            if (
                nextR >= 0 && nextR < this.GRID_SIZE &&
                nextC >= 0 && nextC < this.GRID_SIZE &&
                this.grid[nextR][nextC] === currentValue &&
                !merged[nextR][nextC]
            ) {
                // Merge
                const newValue = currentValue * 2;
                this.grid[nextR][nextC] = newValue;
                this.grid[r][c] = 0;
                mergeScore += newValue;
                merged[nextR][nextC] = true;
                moved = true;

                if (newValue > this.largestTile) this.largestTile = newValue;

                mergedTiles.push({ r: nextR, c: nextC, value: newValue, fromR: r, fromC: c });

                this.animations.push({
                    r: nextR, c: nextC, type: 'merge', value: newValue,
                    progress: 0, fromR: r, fromC: c
                });

                // Particles
                this._addMergeParticles(nextR, nextC, newValue);
            } else if (farthestR !== r || farthestC !== c) {
                // Move without merge
                this.grid[farthestR][farthestC] = currentValue;
                this.grid[r][c] = 0;
                moved = true;

                this.animations.push({
                    r: farthestR, c: farthestC, type: 'move', value: currentValue,
                    progress: 0, fromR: r, fromC: c
                });
            }
        }

        if (!moved) return;

        this.moves++;
        this.score += mergeScore;
        if (mergeScore > 0) {
            this.scorePopup = { value: mergeScore, timer: 30, y: 0 };
            AudioManager.play('merge');
            Storage.setLargestTile(this.largestTile);
        } else {
            AudioManager.play('move');
        }

        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            Storage.setBestScore(this.score);
        }
        this._updateDisplays();

        // Check achievements
        for (const ach of ACHIEVEMENTS) {
            if (this.largestTile >= ach.value && !Storage.hasAchievement(ach.id)) {
                Storage.unlockAchievement(ach.id);
                this.achievementQueue.push(ach);
            }
        }

        // Spawn new tile after short delay
        this.inputLocked = true;
        setTimeout(() => {
            this._spawnTile();
            this.inputLocked = false;

            // Check game over
            if (!this._hasValidMoves()) {
                this.state = 'gameover';
                Storage.addMoves(this.moves);
                AudioManager.play('gameover');
            }
        }, 120);
    }

    _getTraversalOrder(dir) {
        const cells = [];
        for (let r = 0; r < this.GRID_SIZE; r++)
            for (let c = 0; c < this.GRID_SIZE; c++)
                cells.push({ r, c });

        switch (dir) {
            case 'up':    return cells.sort((a, b) => a.r - b.r);
            case 'down':  return cells.sort((a, b) => b.r - a.r);
            case 'left':  return cells.sort((a, b) => a.c - b.c);
            case 'right': return cells.sort((a, b) => b.c - a.c);
        }
    }

    _findFarthest(r, c, dir) {
        const dr = { up: -1, down: 1, left: 0, right: 0 }[dir];
        const dc = { up: 0, down: 0, left: -1, right: 1 }[dir];

        let prevR = r, prevC = c;
        let nextR = r + dr, nextC = c + dc;

        while (
            nextR >= 0 && nextR < this.GRID_SIZE &&
            nextC >= 0 && nextC < this.GRID_SIZE &&
            this.grid[nextR][nextC] === 0
        ) {
            prevR = nextR;
            prevC = nextC;
            nextR += dr;
            nextC += dc;
        }

        return { farthestR: prevR, farthestC: prevC, nextR, nextC };
    }

    _hasValidMoves() {
        // Check for empty cells
        for (let r = 0; r < this.GRID_SIZE; r++)
            for (let c = 0; c < this.GRID_SIZE; c++)
                if (this.grid[r][c] === 0) return true;

        // Check for possible merges
        for (let r = 0; r < this.GRID_SIZE; r++)
            for (let c = 0; c < this.GRID_SIZE; c++) {
                const v = this.grid[r][c];
                if (c < this.GRID_SIZE - 1 && this.grid[r][c + 1] === v) return true;
                if (r < this.GRID_SIZE - 1 && this.grid[r + 1][c] === v) return true;
            }

        return false;
    }

    _restart() {
        this._initGrid();
        this.score = 0;
        this.largestTile = 0;
        this.moves = 0;
        this.animations = [];
        this.scorePopup = null;
        this.achievementQueue = [];
        this.currentAchievement = null;
        this.mergeParticles = [];
        this.inputLocked = false;
        this._spawnTile();
        this._spawnTile();
        this.state = 'playing';
        Storage.addGamePlayed();
        this._updateDisplays();
    }

    _updateDisplays() {
        document.getElementById('score-display').textContent = this.score;
        document.getElementById('best-display').textContent = this.bestScore;
    }

    _addMergeParticles(r, c, value) {
        const x = this._tileX(c) + this.TILE_SIZE / 2;
        const y = this._tileY(r) + this.TILE_SIZE / 2;
        const color = this._getTileColor(value).bg;
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i + Math.random() * 0.5;
            this.mergeParticles.push({
                x, y, vx: Math.cos(angle) * 3, vy: Math.sin(angle) * 3,
                radius: 3 + Math.random() * 3, color, life: 20, maxLife: 20
            });
        }
    }

    _tileX(c) {
        return this.PADDING + c * (this.TILE_SIZE + this.TILE_GAP) + this.TILE_GAP;
    }

    _tileY(r) {
        return this.PADDING + r * (this.TILE_SIZE + this.TILE_GAP) + this.TILE_GAP;
    }

    _getTileColor(value) {
        if (TILE_COLORS[value]) return TILE_COLORS[value];
        // Generate for values > 2048
        const hue = (Math.log2(value) * 30) % 360;
        return { bg: `hsl(${hue}, 70%, 55%)`, fg: '#f9f6f2' };
    }

    _getFontSize(value) {
        if (value < 100) return this.TILE_SIZE * 0.5;
        if (value < 1000) return this.TILE_SIZE * 0.4;
        if (value < 10000) return this.TILE_SIZE * 0.32;
        return this.TILE_SIZE * 0.25;
    }

    destroy() {
        if (this._rafId) cancelAnimationFrame(this._rafId);
        AudioManager.close();
    }

    _gameLoop(now) {
        this._rafId = requestAnimationFrame((t) => this._gameLoop(t));
        const elapsed = now - this.lastTime;
        if (elapsed < this.frameInterval) return;
        this.lastTime = now - (elapsed % this.frameInterval);
        this._update();
        this._render();
    }

    _update() {
        // Update animations
        let animWrite = 0;
        for (let i = 0; i < this.animations.length; i++) {
            this.animations[i].progress += 0.12;
            if (this.animations[i].progress < 1) this.animations[animWrite++] = this.animations[i];
        }
        this.animations.length = animWrite;

        // Update score popup
        if (this.scorePopup) {
            this.scorePopup.y -= 1;
            this.scorePopup.timer--;
            if (this.scorePopup.timer <= 0) this.scorePopup = null;
        }

        // Update particles
        let partWrite = 0;
        for (let i = 0; i < this.mergeParticles.length; i++) {
            const p = this.mergeParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life > 0) this.mergeParticles[partWrite++] = p;
        }
        this.mergeParticles.length = partWrite;

        // Achievement popup
        if (this.currentAchievement) {
            this.achievementTimer--;
            if (this.achievementTimer <= 0) this.currentAchievement = null;
        } else if (this.achievementQueue.length > 0) {
            this.currentAchievement = this.achievementQueue.shift();
            this.achievementTimer = 120;
            AudioManager.play('achievement');
        }
    }

    _render() {
        const ctx = this.ctx;
        const S = this.CANVAS_SIZE;

        // Background
        ctx.fillStyle = '#faf8ef';
        ctx.fillRect(0, 0, S, S);

        // Grid background
        ctx.fillStyle = '#bbada0';
        this._roundRect(ctx, this.PADDING, this.PADDING,
            S - this.PADDING * 2, S - this.PADDING * 2, 12);
        ctx.fill();

        // Empty cells
        for (let r = 0; r < this.GRID_SIZE; r++) {
            for (let c = 0; c < this.GRID_SIZE; c++) {
                ctx.fillStyle = '#cdc1b4';
                this._roundRect(ctx, this._tileX(c), this._tileY(r),
                    this.TILE_SIZE, this.TILE_SIZE, this.TILE_RADIUS);
                ctx.fill();
            }
        }

        // Draw tiles
        for (let r = 0; r < this.GRID_SIZE; r++) {
            for (let c = 0; c < this.GRID_SIZE; c++) {
                const value = this.grid[r][c];
                if (value === 0) continue;

                // Check if this tile has an active animation
                const anim = this.animations.find(a => a.r === r && a.c === c && a.progress < 1);
                if (anim && anim.type === 'move') continue; // draw at destination only for moves

                let drawX = this._tileX(c);
                let drawY = this._tileY(r);
                let scale = 1;

                if (anim) {
                    if (anim.type === 'spawn') {
                        scale = 0.1 + 0.9 * this._easeOut(anim.progress);
                    } else if (anim.type === 'merge') {
                        scale = 1 + 0.2 * Math.sin(anim.progress * Math.PI);
                    }
                }

                this._drawTile(ctx, drawX, drawY, value, scale);
            }
        }

        // Particles
        for (const p of this.mergeParticles) {
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * (p.life / p.maxLife), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Score popup
        if (this.scorePopup) {
            ctx.globalAlpha = this.scorePopup.timer / 30;
            ctx.fillStyle = '#776e65';
            ctx.font = `bold ${16}px 'Rajdhani', sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText(`+${this.scorePopup.value}`, S / 2, 60 + this.scorePopup.y);
            ctx.globalAlpha = 1;
        }

        // Achievement popup
        if (this.currentAchievement) {
            const progress = this.achievementTimer > 100 ?
                (120 - this.achievementTimer) / 20 :
                this.achievementTimer < 20 ? this.achievementTimer / 20 : 1;

            ctx.globalAlpha = progress;
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this._roundRect(ctx, S / 2 - 130, S / 2 - 40, 260, 80, 12);
            ctx.fill();

            ctx.fillStyle = '#f77c5f';
            ctx.font = `bold 24px 'Orbitron', monospace`;
            ctx.textAlign = 'center';
            ctx.fillText(this.currentAchievement.label, S / 2, S / 2);

            ctx.fillStyle = '#eee';
            ctx.font = `14px 'Rajdhani', sans-serif`;
            ctx.fillText(this.currentAchievement.desc, S / 2, S / 2 + 22);

            ctx.globalAlpha = 1;
        }

        // Game over overlay
        if (this.state === 'gameover') {
            ctx.fillStyle = 'rgba(238, 228, 218, 0.73)';
            ctx.fillRect(0, 0, S, S);

            ctx.textAlign = 'center';
            ctx.fillStyle = '#776e65';
            ctx.font = `bold 48px 'Orbitron', monospace`;
            ctx.fillText('GAME OVER', S / 2, S / 2 - 50);

            ctx.font = `bold 20px 'Rajdhani', sans-serif`;
            ctx.fillText(`Score: ${this.score}`, S / 2, S / 2);
            ctx.fillText(`Best: ${this.bestScore}`, S / 2, S / 2 + 28);
            ctx.fillText(`Largest: ${this.largestTile}`, S / 2, S / 2 + 56);

            ctx.fillStyle = '#8f7a66';
            this._roundRect(ctx, S / 2 - 80, S / 2 + 75, 160, 45, 8);
            ctx.fill();
            ctx.fillStyle = '#f9f6f2';
            ctx.font = `bold 18px 'Orbitron', monospace`;
            ctx.fillText('Try Again', S / 2, S / 2 + 103);
        }
    }

    _drawTile(ctx, x, y, value, scale) {
        const colors = this._getTileColor(value);
        const s = this.TILE_SIZE;

        ctx.save();

        if (scale !== 1) {
            const cx = x + s / 2;
            const cy = y + s / 2;
            ctx.translate(cx, cy);
            ctx.scale(scale, scale);
            ctx.translate(-cx, -cy);
        }

        // Tile background
        ctx.fillStyle = colors.bg;
        this._roundRect(ctx, x, y, s, s, this.TILE_RADIUS);
        ctx.fill();

        // Tile shadow/highlight
        if (value >= 128) {
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            this._roundRect(ctx, x + 2, y + 2, s - 4, s / 2 - 2, this.TILE_RADIUS);
            ctx.fill();
        }

        // Value text
        ctx.fillStyle = colors.fg;
        ctx.font = `bold ${this._getFontSize(value)}px 'Orbitron', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(value, x + s / 2, y + s / 2);

        ctx.restore();
    }

    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    _easeOut(t) {
        return 1 - Math.pow(1 - t, 3);
    }
}

window.addEventListener('load', () => { new Game2048(); });
