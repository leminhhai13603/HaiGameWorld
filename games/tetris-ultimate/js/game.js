/**
 * Tetris Ultimate - Main Game
 */

// ===== CONSTANTS =====
const COLS = 10;
const ROWS = 20;
const HIDDEN = 2;
const TOTAL_ROWS = ROWS + HIDDEN;
const CELL = 28;

const GameState = { LOADING: 'loading', READY: 'ready', PLAYING: 'playing', PAUSED: 'paused', GAME_OVER: 'gameover' };

// Tetromino shapes: [rotation][piece][row][col]
const SHAPES = {
    I: [
        [[0,0],[0,1],[0,2],[0,3]],
        [[0,0],[1,0],[2,0],[3,0]],
        [[0,0],[0,1],[0,2],[0,3]],
        [[0,0],[1,0],[2,0],[3,0]]
    ],
    O: [
        [[0,0],[0,1],[1,0],[1,1]],
        [[0,0],[0,1],[1,0],[1,1]],
        [[0,0],[0,1],[1,0],[1,1]],
        [[0,0],[0,1],[1,0],[1,1]]
    ],
    T: [
        [[0,1],[1,0],[1,1],[1,2]],
        [[0,0],[1,0],[1,1],[2,0]],
        [[0,0],[0,1],[0,2],[1,1]],
        [[0,1],[1,0],[1,1],[2,1]]
    ],
    S: [
        [[0,1],[0,2],[1,0],[1,1]],
        [[0,0],[1,0],[1,1],[2,1]],
        [[0,1],[0,2],[1,0],[1,1]],
        [[0,0],[1,0],[1,1],[2,1]]
    ],
    Z: [
        [[0,0],[0,1],[1,1],[1,2]],
        [[0,1],[1,0],[1,1],[2,0]],
        [[0,0],[0,1],[1,1],[1,2]],
        [[0,1],[1,0],[1,1],[2,0]]
    ],
    J: [
        [[0,0],[1,0],[1,1],[1,2]],
        [[0,0],[0,1],[1,0],[2,0]],
        [[0,0],[0,1],[0,2],[1,2]],
        [[0,0],[1,0],[2,0],[2,-1]]
    ],
    L: [
        [[0,2],[1,0],[1,1],[1,2]],
        [[0,0],[1,0],[2,0],[2,1]],
        [[0,0],[0,1],[0,2],[1,0]],
        [[0,0],[0,1],[1,1],[2,1]]
    ]
};

// Piece colors per theme
const PIECE_COLORS = {
    classic: { I: '#00f0f0', O: '#f0f000', T: '#a000f0', S: '#00f000', Z: '#f00000', J: '#0000f0', L: '#f0a000' },
    neon:    { I: '#00ffff', O: '#ffff00', T: '#ff00ff', S: '#00ff00', Z: '#ff0040', J: '#4040ff', L: '#ff8000' },
    cyber:   { I: '#00e5ff', O: '#ffea00', T: '#d500f9', S: '#76ff03', Z: '#ff1744', J: '#2979ff', L: '#ff9100' },
    retro:   { I: '#00aaaa', O: '#aaaa00', T: '#880088', S: '#008800', Z: '#880000', J: '#000088', L: '#884400' },
    dark:    { I: '#4dd0e1', O: '#fff176', T: '#ce93d8', S: '#81c784', Z: '#e57373', J: '#64b5f6', L: '#ffb74d' }
};

const THEMES = {
    classic: { bg: '#1a1a2e', grid: '#16213e', gridLine: '#0f3460', text: '#e0e0e0', accent: '#00e5ff', ghost: 'rgba(255,255,255,0.15)', panel: '#16213e' },
    neon:    { bg: '#0a0015', grid: '#0d0020', gridLine: '#1a0040', text: '#ffffff', accent: '#ff00ff', ghost: 'rgba(255,255,255,0.12)', panel: '#0d0020' },
    cyber:   { bg: '#0d1117', grid: '#161b22', gridLine: '#21262d', text: '#c9d1d9', accent: '#00e5ff', ghost: 'rgba(0,229,255,0.1)', panel: '#161b22' },
    retro:   { bg: '#000000', grid: '#111111', gridLine: '#222222', text: '#00ff00', accent: '#00ff00', ghost: 'rgba(0,255,0,0.1)', panel: '#0a0a0a' },
    dark:    { bg: '#121212', grid: '#1e1e1e', gridLine: '#2c2c2c', text: '#e0e0e0', accent: '#bb86fc', ghost: 'rgba(187,134,252,0.1)', panel: '#1e1e1e' }
};

const ACHIEVEMENTS = [
    { id: 'first_line', name: 'First Blood', desc: 'Xoá dòng đầu tiên', check: (s) => s.totalLines >= 1 },
    { id: 'first_tetris', name: 'Tetris!', desc: 'Xoá 4 dòng cùng lúc', check: (s) => s.hasTetris },
    { id: 'level_10', name: 'Veteran', desc: 'Đạt level 10', check: (s) => s.level >= 10 },
    { id: 'level_20', name: 'Master', desc: 'Đạt level 20', check: (s) => s.level >= 20 },
    { id: 'lines_100', name: 'Line Warrior', desc: 'Xoá 100 dòng', check: (s) => s.totalLines >= 100 },
    { id: 'lines_1000', name: 'Line Legend', desc: 'Xoá 1000 dòng', check: (s) => s.totalLines >= 1000 },
    { id: 'score_100k', name: 'Score Hunter', desc: 'Đạt 100,000 điểm', check: (s) => s.score >= 100000 },
    { id: 'score_500k', name: 'Score King', desc: 'Đạt 500,000 điểm', check: (s) => s.score >= 500000 },
    { id: 'combo_5', name: 'Combo Master', desc: 'Đạt combo x5', check: (s) => s.maxCombo >= 5 },
    { id: 'tetris_king', name: 'Tetris King', desc: '10 lần Tetris trong 1 game', check: (s) => s.tetrisCount >= 10 }
];

// ===== WALL KICKS (SRS simplified) =====
const WALL_KICKS = [
    [0, 0], [-1, 0], [1, 0], [0, -1], [-1, -1], [1, -1], [0, -2], [-2, 0], [2, 0]
];

const I_KICKS = [
    [0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2], [2, 0], [-1, 0], [2, 1], [-1, -2]
];

// ===== GAME CLASS =====
class TetrisUltimate {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.W = COLS * CELL + 240;
        this.H = ROWS * CELL + 4;
        this.canvas.width = this.W;
        this.canvas.height = this.H;

        this.theme = Storage.getTheme();
        AudioManager.setEnabled(Storage.getSoundEnabled());

        this.state = GameState.READY;
        this.lastTime = 0;
        this.frameInterval = 1000 / 60;

        this._resize();
        window.addEventListener('resize', () => this._resize());

        this._setupInput();
        this._gameLoop(performance.now());
    }

    // ===== INITIALIZATION =====
    _reset() {
        this.board = Array.from({ length: TOTAL_ROWS }, () => Array(COLS).fill(null));
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.combo = -1;
        this.maxCombo = 0;
        this.b2b = false;
        this.tetrisCount = 0;
        this.hasTetris = false;
        this.totalLinesThisGame = 0;

        this.bag = [];
        this.piece = null;
        this.pieceX = 0;
        this.pieceY = 0;
        this.pieceType = '';
        this.pieceRotation = 0;

        this.holdPiece = null;
        this.holdUsed = false;
        this.nextQueue = [];

        this.dropTimer = 0;
        this.dropInterval = 1000;
        this.lockDelay = 500;
        this.lockTimer = 0;
        this.locking = false;

        this.lineClearAnim = 0;
        this.clearingRows = [];
        this.comboAnim = 0;
        this.levelUpAnim = 0;
        this.achievementPopups = [];

        this.particles = [];

        this._fillQueue();
        this._spawnPiece();
    }

    _fillQueue() {
        while (this.nextQueue.length < 5) {
            if (this.bag.length === 0) {
                this.bag = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
                this._shuffle(this.bag);
            }
            this.nextQueue.push(this.bag.pop());
        }
    }

    _shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    // ===== PIECE MANAGEMENT =====
    _spawnPiece() {
        this.pieceType = this.nextQueue.shift();
        this._fillQueue();
        this.pieceRotation = 0;
        this.piece = SHAPES[this.pieceType][0];
        this.pieceX = Math.floor((COLS - 4) / 2);
        this.pieceY = 0;
        this.holdUsed = false;
        this.locking = false;
        this.lockTimer = 0;
        this.dropTimer = 0;

        if (!this._isValid(this.piece, this.pieceX, this.pieceY)) {
            this._gameOver();
        }
    }

    _getGhostY() {
        let gy = this.pieceY;
        while (this._isValid(this.piece, this.pieceX, gy + 1)) gy++;
        return gy;
    }

    _isValid(cells, px, py) {
        for (const [r, c] of cells) {
            const nr = py + r;
            const nc = px + c;
            if (nc < 0 || nc >= COLS || nr >= TOTAL_ROWS) return false;
            if (nr >= 0 && this.board[nr][nc]) return false;
        }
        return true;
    }

    _lock() {
        const color = PIECE_COLORS[this.theme][this.pieceType];
        for (const [r, c] of this.piece) {
            const nr = this.pieceY + r;
            const nc = this.pieceX + c;
            if (nr >= 0 && nr < TOTAL_ROWS && nc >= 0 && nc < COLS) {
                this.board[nr][nc] = color;
            }
        }
        this._checkLines();
        this._spawnPiece();
    }

    // ===== LINE CLEARING =====
    _checkLines() {
        this.clearingRows = [];
        for (let r = 0; r < TOTAL_ROWS; r++) {
            if (this.board[r].every(cell => cell !== null)) {
                this.clearingRows.push(r);
            }
        }

        if (this.clearingRows.length > 0) {
            this.lineClearAnim = 15;
            const count = this.clearingRows.length;

            // Scoring
            const base = [0, 100, 300, 500, 800][count] || 0;
            let pts = base * this.level;

            // Soft/hard drop bonuses already added
            // Combo
            this.combo++;
            if (this.combo > this.maxCombo) this.maxCombo = this.combo;
            if (this.combo > 0) {
                pts += 50 * this.combo * this.level;
                this.comboAnim = 30;
                AudioManager.play('combo');
            }

            // Back-to-back
            if (count === 4) {
                if (this.b2b) pts = Math.floor(pts * 1.5);
                this.b2b = true;
                this.tetrisCount++;
                this.hasTetris = true;
                AudioManager.play('tetris');
            } else {
                this.b2b = false;
                AudioManager.play('lineClear');
            }

            this.score += pts;
            this.lines += count;
            this.totalLinesThisGame += count;
            Storage.addLines(count);

            // Level up
            const newLevel = Math.floor(this.lines / 10) + 1;
            if (newLevel > this.level) {
                this.level = newLevel;
                this.levelUpAnim = 60;
                Storage.setHighestLevel(this.level);
                AudioManager.play('levelUp');
                this._spawnParticles(this.W / 2 - 60, this.H / 2, '#ffea00', 20);
            }

            this.dropInterval = Math.max(50, 1000 - (this.level - 1) * 80);

            // Particles for line clear
            for (const row of this.clearingRows) {
                const py = (row - HIDDEN) * CELL + 2;
                this._spawnParticles(0, py + CELL / 2, '#ffffff', 8);
            }
        } else {
            this.combo = -1;
        }
    }

    _processLineClear() {
        if (this.lineClearAnim > 0) {
            this.lineClearAnim--;
            if (this.lineClearAnim === 0) {
                for (const row of this.clearingRows.sort((a, b) => b - a)) {
                    this.board.splice(row, 1);
                    this.board.unshift(Array(COLS).fill(null));
                }
                this.clearingRows = [];
            }
        }
    }

    // ===== MOVEMENT =====
    _moveLeft() {
        if (this._isValid(this.piece, this.pieceX - 1, this.pieceY)) {
            this.pieceX--;
            AudioManager.play('move');
            if (this.locking) this.lockTimer = 0;
        }
    }

    _moveRight() {
        if (this._isValid(this.piece, this.pieceX + 1, this.pieceY)) {
            this.pieceX++;
            AudioManager.play('move');
            if (this.locking) this.lockTimer = 0;
        }
    }

    _softDrop() {
        if (this._isValid(this.piece, this.pieceX, this.pieceY + 1)) {
            this.pieceY++;
            this.score += 1;
            this.dropTimer = 0;
            AudioManager.play('softDrop');
        }
    }

    _hardDrop() {
        let dist = 0;
        while (this._isValid(this.piece, this.pieceX, this.pieceY + 1)) {
            this.pieceY++;
            dist++;
        }
        this.score += dist * 2;
        AudioManager.play('hardDrop');
        this._lock();
    }

    _rotate() {
        const newRot = (this.pieceRotation + 1) % 4;
        const newCells = SHAPES[this.pieceType][newRot];
        const kicks = this.pieceType === 'I' ? I_KICKS : WALL_KICKS;

        for (const [dx, dy] of kicks) {
            if (this._isValid(newCells, this.pieceX + dx, this.pieceY + dy)) {
                this.pieceX += dx;
                this.pieceY += dy;
                this.piece = newCells;
                this.pieceRotation = newRot;
                AudioManager.play('rotate');
                if (this.locking) this.lockTimer = 0;
                return;
            }
        }
    }

    _hold() {
        if (this.holdUsed) return;
        this.holdUsed = true;
        AudioManager.play('hold');
        if (this.holdPiece === null) {
            this.holdPiece = this.pieceType;
            this._spawnPiece();
        } else {
            const tmp = this.holdPiece;
            this.holdPiece = this.pieceType;
            this.pieceType = tmp;
            this.pieceRotation = 0;
            this.piece = SHAPES[this.pieceType][0];
            this.pieceX = Math.floor((COLS - 4) / 2);
            this.pieceY = 0;
            this.locking = false;
            this.lockTimer = 0;
        }
    }

    // ===== PARTICLES =====
    _spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 4 - 2,
                life: 20 + Math.random() * 20,
                maxLife: 40,
                color,
                size: 2 + Math.random() * 3
            });
        }
    }

    _updateParticles() {
        for (const p of this.particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.15;
            p.life--;
        }
        this.particles = this.particles.filter(p => p.life > 0);
    }

    // ===== ACHIEVEMENTS =====
    _checkAchievements() {
        const stats = {
            score: this.score,
            level: this.level,
            totalLines: Storage.getTotalLines(),
            hasTetris: this.hasTetris,
            maxCombo: this.maxCombo,
            tetrisCount: this.tetrisCount
        };
        for (const ach of ACHIEVEMENTS) {
            if (ach.check(stats)) {
                if (Storage.unlockAchievement(ach.id)) {
                    this.achievementPopups.push({ name: ach.name, desc: ach.desc, timer: 180 });
                    AudioManager.play('achievement');
                }
            }
        }
    }

    // ===== GAME STATE =====
    _start() {
        this._reset();
        this.state = GameState.PLAYING;
        Storage.addGamePlayed();
    }

    _gameOver() {
        this.state = GameState.GAME_OVER;
        AudioManager.play('gameOver');
        Storage.setBestScore(this.score);
        Storage.setHighestLevel(this.level);
        this._checkAchievements();
    }

    _togglePause() {
        if (this.state === GameState.PLAYING) this.state = GameState.PAUSED;
        else if (this.state === GameState.PAUSED) this.state = GameState.PLAYING;
    }

    // ===== UPDATE =====
    _update() {
        if (this.state !== GameState.PLAYING) return;
        if (this.lineClearAnim > 0) { this._processLineClear(); return; }

        // Drop
        this.dropTimer += this.frameInterval;
        if (this.dropTimer >= this.dropInterval) {
            this.dropTimer = 0;
            if (this._isValid(this.piece, this.pieceX, this.pieceY + 1)) {
                this.pieceY++;
                this.locking = false;
                this.lockTimer = 0;
            } else {
                this.locking = true;
            }
        }

        // Lock delay
        if (this.locking) {
            this.lockTimer += this.frameInterval;
            if (this.lockTimer >= this.lockDelay) {
                this._lock();
            }
        }

        // Anim timers
        if (this.comboAnim > 0) this.comboAnim--;
        if (this.levelUpAnim > 0) this.levelUpAnim--;
        for (const p of this.achievementPopups) p.timer--;
        this.achievementPopups = this.achievementPopups.filter(p => p.timer > 0);

        this._updateParticles();
        this._checkAchievements();
    }

    // ===== RENDER =====
    _render() {
        const ctx = this.ctx;
        const t = THEMES[this.theme];

        ctx.fillStyle = t.bg;
        ctx.fillRect(0, 0, this.W, this.H);

        if (this.state === GameState.READY) {
            this._renderReady(ctx, t);
            return;
        }

        this._renderBoard(ctx, t);
        this._renderGhost(ctx, t);
        this._renderCurrentPiece(ctx);
        this._renderGrid(ctx, t);
        this._renderSidebar(ctx, t);
        this._renderHUD(ctx, t);
        this._renderParticles(ctx);

        // Animations
        if (this.lineClearAnim > 0) this._renderLineClear(ctx);
        if (this.comboAnim > 0 && this.combo > 0) this._renderCombo(ctx);
        if (this.levelUpAnim > 0) this._renderLevelUp(ctx);
        this._renderAchievements(ctx);

        if (this.state === GameState.PAUSED) this._renderPause(ctx, t);
        if (this.state === GameState.GAME_OVER) this._renderGameOver(ctx, t);
    }

    _renderReady(ctx, t) {
        ctx.fillStyle = t.text;
        ctx.font = '900 32px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('TETRIS ULTIMATE', this.W / 2, this.H / 2 - 40);

        ctx.font = '500 18px Rajdhani, sans-serif';
        ctx.fillStyle = t.accent;
        const blink = Math.sin(Date.now() / 300) > 0;
        if (blink) ctx.fillText('Nhấn bất kỳ để bắt đầu', this.W / 2, this.H / 2 + 10);

        ctx.font = '400 14px Rajdhani, sans-serif';
        ctx.fillStyle = t.text;
        ctx.globalAlpha = 0.6;
        ctx.fillText('← → Di chuyển  |  ↑ Xoay  |  Space Thả nhanh  |  C Giữ', this.W / 2, this.H / 2 + 50);
        ctx.globalAlpha = 1;
    }

    _renderGrid(ctx, t) {
        const ox = 0, oy = 0;
        ctx.strokeStyle = t.gridLine;
        ctx.lineWidth = 0.5;
        for (let r = 0; r <= ROWS; r++) {
            ctx.beginPath();
            ctx.moveTo(ox, oy + r * CELL);
            ctx.lineTo(ox + COLS * CELL, oy + r * CELL);
            ctx.stroke();
        }
        for (let c = 0; c <= COLS; c++) {
            ctx.beginPath();
            ctx.moveTo(ox + c * CELL, oy);
            ctx.lineTo(ox + c * CELL, oy + ROWS * CELL);
            ctx.stroke();
        }
    }

    _renderBoard(ctx, t) {
        const ox = 0, oy = 0;
        // Board background
        ctx.fillStyle = t.grid;
        ctx.fillRect(ox, oy, COLS * CELL, ROWS * CELL);

        // Filled cells
        for (let r = HIDDEN; r < TOTAL_ROWS; r++) {
            if (this.clearingRows.includes(r)) continue;
            for (let c = 0; c < COLS; c++) {
                if (this.board[r][c]) {
                    this._drawCell(ctx, ox + c * CELL, oy + (r - HIDDEN) * CELL, this.board[r][c]);
                }
            }
        }

        // Board border
        ctx.strokeStyle = t.accent;
        ctx.lineWidth = 2;
        ctx.strokeRect(ox, oy, COLS * CELL, ROWS * CELL);
    }

    _renderGhost(ctx, t) {
        if (!this.piece || this.lineClearAnim > 0) return;
        const gy = this._getGhostY();
        if (gy === this.pieceY) return;
        const ox = 0, oy = 0;
        ctx.fillStyle = t.ghost;
        ctx.strokeStyle = t.ghost;
        ctx.lineWidth = 1;
        for (const [r, c] of this.piece) {
            const px = ox + (this.pieceX + c) * CELL;
            const py = oy + (gy + r - HIDDEN) * CELL;
            if (gy + r >= HIDDEN) {
                ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
                ctx.strokeRect(px + 1, py + 1, CELL - 2, CELL - 2);
            }
        }
    }

    _renderCurrentPiece(ctx) {
        if (!this.piece || this.lineClearAnim > 0) return;
        const ox = 0, oy = 0;
        const color = PIECE_COLORS[this.theme][this.pieceType];
        for (const [r, c] of this.piece) {
            const pr = this.pieceY + r;
            if (pr >= HIDDEN) {
                this._drawCell(ctx, ox + (this.pieceX + c) * CELL, oy + (pr - HIDDEN) * CELL, color);
            }
        }
    }

    _drawCell(ctx, x, y, color) {
        // Main fill
        ctx.fillStyle = color;
        ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
        // Highlight (top-left)
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(x + 1, y + 1, CELL - 2, 3);
        ctx.fillRect(x + 1, y + 1, 3, CELL - 2);
        // Shadow (bottom-right)
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(x + 1, y + CELL - 4, CELL - 2, 3);
        ctx.fillRect(x + CELL - 4, y + 1, 3, CELL - 2);
    }

    _renderSidebar(ctx, t) {
        const sx = COLS * CELL + 16;
        const panelW = 210;

        // Next queue
        ctx.fillStyle = t.text;
        ctx.font = '700 14px Orbitron, monospace';
        ctx.textAlign = 'left';
        ctx.fillText('NEXT', sx, 20);

        ctx.fillStyle = t.panel;
        ctx.fillRect(sx, 28, panelW, 5 * 60 + 10);
        ctx.strokeStyle = t.gridLine;
        ctx.lineWidth = 1;
        ctx.strokeRect(sx, 28, panelW, 5 * 60 + 10);

        for (let i = 0; i < 5; i++) {
            const type = this.nextQueue[i];
            if (type) this._renderMiniPiece(ctx, type, sx + panelW / 2, 58 + i * 60, t);
        }

        // Hold
        const hy = 5 * 60 + 50;
        ctx.fillStyle = t.text;
        ctx.font = '700 14px Orbitron, monospace';
        ctx.fillText('HOLD', sx, hy);

        ctx.fillStyle = t.panel;
        ctx.fillRect(sx, hy + 8, panelW, 68);
        ctx.strokeStyle = this.holdUsed ? '#ff4444' : t.gridLine;
        ctx.lineWidth = 1;
        ctx.strokeRect(sx, hy + 8, panelW, 68);

        if (this.holdPiece) {
            this._renderMiniPiece(ctx, this.holdPiece, sx + panelW / 2, hy + 48, t);
        }

        // Stats
        const statsY = hy + 96;
        ctx.fillStyle = t.text;
        ctx.font = '600 13px Rajdhani, sans-serif';
        ctx.fillText(`Best: ${Storage.getBestScore().toLocaleString()}`, sx, statsY);
        ctx.fillText(`Lines: ${Storage.getTotalLines().toLocaleString()}`, sx, statsY + 20);
    }

    _renderMiniPiece(ctx, type, cx, cy, t) {
        const cells = SHAPES[type][0];
        const color = PIECE_COLORS[this.theme][type];
        const miniSize = 14;

        // Center the piece
        let minR = 99, maxR = -99, minC = 99, maxC = -99;
        for (const [r, c] of cells) {
            minR = Math.min(minR, r); maxR = Math.max(maxR, r);
            minC = Math.min(minC, c); maxC = Math.max(maxC, c);
        }
        const pw = (maxC - minC + 1) * miniSize;
        const ph = (maxR - minR + 1) * miniSize;
        const ox = cx - pw / 2;
        const oy = cy - ph / 2;

        for (const [r, c] of cells) {
            const x = ox + (c - minC) * miniSize;
            const y = oy + (r - minR) * miniSize;
            ctx.fillStyle = color;
            ctx.fillRect(x, y, miniSize - 1, miniSize - 1);
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillRect(x, y, miniSize - 1, 2);
            ctx.fillRect(x, y, 2, miniSize - 1);
        }
    }

    _renderHUD(ctx, t) {
        const sx = COLS * CELL + 16;

        // Score
        ctx.fillStyle = t.accent;
        ctx.font = '900 24px Orbitron, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(this.score.toLocaleString(), sx, this.H - 80);

        ctx.fillStyle = t.text;
        ctx.font = '600 12px Rajdhani, sans-serif';
        ctx.fillText('SCORE', sx, this.H - 95);

        // Level
        ctx.fillStyle = t.accent;
        ctx.font = '700 18px Orbitron, monospace';
        ctx.fillText(`LV ${this.level}`, sx, this.H - 40);

        // Lines
        ctx.fillStyle = t.text;
        ctx.font = '600 14px Rajdhani, sans-serif';
        ctx.fillText(`Lines: ${this.lines}`, sx + 100, this.H - 40);
    }

    _renderParticles(ctx) {
        for (const p of this.particles) {
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
        ctx.globalAlpha = 1;
    }

    _renderLineClear(ctx) {
        const progress = 1 - this.lineClearAnim / 15;
        ctx.fillStyle = `rgba(255,255,255,${0.8 * (1 - progress)})`;
        for (const row of this.clearingRows) {
            const y = (row - HIDDEN) * CELL;
            ctx.fillRect(0, y, COLS * CELL * (1 - progress * 0.5), CELL);
        }
    }

    _renderCombo(ctx) {
        ctx.fillStyle = '#ffea00';
        ctx.font = '900 28px Orbitron, monospace';
        ctx.textAlign = 'center';
        const alpha = Math.min(1, this.comboAnim / 10);
        ctx.globalAlpha = alpha;
        ctx.fillText(`COMBO x${this.combo + 1}`, COLS * CELL / 2, this.H / 2 - 30);
        ctx.globalAlpha = 1;
    }

    _renderLevelUp(ctx) {
        ctx.fillStyle = '#00e5ff';
        ctx.font = '900 24px Orbitron, monospace';
        ctx.textAlign = 'center';
        const alpha = Math.min(1, this.levelUpAnim / 20);
        ctx.globalAlpha = alpha;
        ctx.fillText(`LEVEL ${this.level}`, COLS * CELL / 2, this.H / 2 + 20);
        ctx.globalAlpha = 1;
    }

    _renderAchievements(ctx) {
        let y = 60;
        for (const p of this.achievementPopups) {
            const alpha = Math.min(1, p.timer / 30);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(COLS * CELL / 2 - 120, y - 20, 240, 44);
            ctx.strokeStyle = '#ffea00';
            ctx.lineWidth = 1;
            ctx.strokeRect(COLS * CELL / 2 - 120, y - 20, 240, 44);
            ctx.fillStyle = '#ffea00';
            ctx.font = '700 13px Orbitron, monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`🏆 ${p.name}`, COLS * CELL / 2, y - 2);
            ctx.fillStyle = '#ccc';
            ctx.font = '500 11px Rajdhani, sans-serif';
            ctx.fillText(p.desc, COLS * CELL / 2, y + 14);
            y += 52;
        }
        ctx.globalAlpha = 1;
    }

    _renderPause(ctx, t) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, this.W, this.H);
        ctx.fillStyle = t.text;
        ctx.font = '900 36px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('TẠM DỪNG', this.W / 2 - 60, this.H / 2 - 10);
        ctx.font = '500 16px Rajdhani, sans-serif';
        ctx.fillStyle = t.accent;
        ctx.fillText('Nhấn P để tiếp tục', this.W / 2 - 60, this.H / 2 + 25);
    }

    _renderGameOver(ctx, t) {
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(0, 0, this.W, this.H);

        const cx = this.W / 2 - 60;
        ctx.fillStyle = '#ff4444';
        ctx.font = '900 32px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', cx, this.H / 2 - 60);

        ctx.fillStyle = t.text;
        ctx.font = '600 16px Rajdhani, sans-serif';
        ctx.fillText(`Score: ${this.score.toLocaleString()}`, cx, this.H / 2 - 20);
        ctx.fillText(`Best: ${Storage.getBestScore().toLocaleString()}`, cx, this.H / 2 + 5);
        ctx.fillText(`Level: ${this.level}  |  Lines: ${this.lines}`, cx, this.H / 2 + 30);

        const blink = Math.sin(Date.now() / 300) > 0;
        if (blink) {
            ctx.fillStyle = t.accent;
            ctx.font = '700 16px Rajdhani, sans-serif';
            ctx.fillText('Nhấn R để chơi lại', cx, this.H / 2 + 70);
        }
    }

    // ===== RESIZE =====
    _resize() {
        const container = document.getElementById('game-container');
        const cw = container.clientWidth;
        const ch = container.clientHeight - 60;
        const scale = Math.min(cw / this.W, ch / this.H, 1.5);
        this.canvas.style.width = Math.floor(this.W * scale) + 'px';
        this.canvas.style.height = Math.floor(this.H * scale) + 'px';
    }

    // ===== INPUT =====
    _setupInput() {
        // Keyboard
        document.addEventListener('keydown', (e) => {
            AudioManager.resume();

            if (this.state === GameState.READY) {
                this._start();
                return;
            }

            if (e.key === 'p' || e.key === 'P') { this._togglePause(); return; }
            if (e.key === 'r' || e.key === 'R') { if (this.state === GameState.GAME_OVER) this._start(); return; }

            if (this.state !== GameState.PLAYING) return;

            switch (e.key) {
                case 'ArrowLeft': this._moveLeft(); break;
                case 'ArrowRight': this._moveRight(); break;
                case 'ArrowDown': this._softDrop(); break;
                case 'ArrowUp': this._rotate(); break;
                case ' ': e.preventDefault(); this._hardDrop(); break;
                case 'c': case 'C': this._hold(); break;
            }
        });

        // Touch - swipe
        let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            AudioManager.resume();
            if (this.state === GameState.READY) { this._start(); return; }
            const t = e.touches[0];
            touchStartX = t.clientX;
            touchStartY = t.clientY;
            touchStartTime = Date.now();
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (this.state !== GameState.PLAYING) return;
            const t = e.changedTouches[0];
            const dx = t.clientX - touchStartX;
            const dy = t.clientY - touchStartY;
            const dt = Date.now() - touchStartTime;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 20 && dt < 200) {
                this._rotate();
            } else if (dist > 30) {
                if (Math.abs(dx) > Math.abs(dy)) {
                    dx > 0 ? this._moveRight() : this._moveLeft();
                } else {
                    if (dy > 0) this._hardDrop();
                }
            }
        }, { passive: false });

        // Mobile buttons
        const btn = (id, fn) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('touchstart', (e) => { e.preventDefault(); AudioManager.resume(); fn(); }, { passive: false });
            el.addEventListener('mousedown', (e) => { e.preventDefault(); AudioManager.resume(); fn(); });
        };

        btn('btn-left', () => { if (this.state === GameState.PLAYING) this._moveLeft(); });
        btn('btn-right', () => { if (this.state === GameState.PLAYING) this._moveRight(); });
        btn('btn-down', () => { if (this.state === GameState.PLAYING) this._softDrop(); });
        btn('btn-rotate', () => { if (this.state === GameState.PLAYING) this._rotate(); });
        btn('btn-drop', () => { if (this.state === GameState.PLAYING) this._hardDrop(); });
        btn('btn-hold', () => { if (this.state === GameState.PLAYING) this._hold(); });
        btn('btn-pause', () => { this._togglePause(); });
    }

    // ===== GAME LOOP =====
    _gameLoop(now) {
        requestAnimationFrame((t) => this._gameLoop(t));
        const elapsed = now - this.lastTime;
        if (elapsed < this.frameInterval) return;
        this.lastTime = now - (elapsed % this.frameInterval);
        this._update();
        this._render();
    }
}

window.addEventListener('load', () => { new TetrisUltimate(); });
