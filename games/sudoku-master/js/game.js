/**
 * Sudoku Master - Main Game Controller
 */
const GameState = { MENU: 'menu', PLAYING: 'playing', PAUSED: 'paused', COMPLETE: 'complete', STATS: 'stats', SETTINGS: 'settings' };

class SudokuGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.W = 480;
        this.H = 720;
        this.canvas.width = this.W;
        this.canvas.height = this.H;

        this.state = GameState.MENU;
        this.board = null;
        this.solution = null;
        this.given = null;
        this.notes = null;
        this.selected = null;
        this.numpadSelected = 0;
        this.notesMode = false;
        this.history = [];
        this.historyIdx = -1;
        this.timer = 0;
        this.paused = false;
        this.hintsUsed = 0;
        this.difficulty = 'easy';
        this.gridInfo = null;
        this.padInfo = null;
        this.controlBtns = [];
        this.loading = false;
        this.loadingMsg = '';

        this.lastTime = 0;
        this.frameInterval = 1000 / 60;

        this._loadSettings();
        this._setupInput();
        window.addEventListener('beforeunload', () => { AudioManager.close(); });
        this._gameLoop(performance.now());
    }

    _loadSettings() {
        const s = SaveManager.load().settings;
        AudioManager.setVolume(s.volume);
        if (!s.soundEnabled) AudioManager.toggle();
        Renderer.setTheme(s.theme);
    }

    _setupInput() {
        // Mouse
        this.canvas.addEventListener('click', (e) => {
            AudioManager.init(); AudioManager.resume();
            const r = this.canvas.getBoundingClientRect();
            const x = (e.clientX - r.left) * (this.W / r.width);
            const y = (e.clientY - r.top) * (this.H / r.height);
            this._handleClick(x, y);
        });

        // Touch
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); AudioManager.init(); AudioManager.resume();
            const t = e.touches[0], r = this.canvas.getBoundingClientRect();
            const x = (t.clientX - r.left) * (this.W / r.width);
            const y = (t.clientY - r.top) * (this.H / r.height);
            this._handleClick(x, y);
        }, { passive: false });

        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (this.state !== GameState.PLAYING) {
                if (e.key === 'Escape' && this.state === GameState.STATS) this.state = GameState.MENU;
                if (e.key === 'Escape' && this.state === GameState.SETTINGS) this.state = GameState.MENU;
                if (e.key === 'Escape' && this.state === GameState.COMPLETE) this.state = GameState.MENU;
                return;
            }
            const s = this.selected;
            switch (e.key) {
                case 'ArrowUp': if (s) this._select(s.row > 0 ? s.row - 1 : 8, s.col); break;
                case 'ArrowDown': if (s) this._select(s.row < 8 ? s.row + 1 : 0, s.col); break;
                case 'ArrowLeft': if (s) this._select(s.row, s.col > 0 ? s.col - 1 : 8); break;
                case 'ArrowRight': if (s) this._select(s.row, s.col < 8 ? s.col + 1 : 0); break;
                case '1': case '2': case '3': case '4': case '5':
                case '6': case '7': case '8': case '9':
                    this._placeNumber(parseInt(e.key)); break;
                case 'Backspace': case 'Delete': case '0': this._erase(); break;
                case 'n': case 'N': this.notesMode = !this.notesMode; break;
                case 'z': case 'Z': if (e.ctrlKey) this._undo(); break;
                case 'y': case 'Y': if (e.ctrlKey) this._redo(); break;
                case 'h': case 'H': this._hint(); break;
                case 'p': case 'P': this.state = GameState.PAUSED; break;
                case 'Escape': this.state = GameState.PAUSED; break;
            }
        });
    }

    _handleClick(x, y) {
        if (this.state === GameState.MENU) { this._handleMenuClick(x, y); return; }
        if (this.state === GameState.STATS) { this.state = GameState.MENU; return; }
        if (this.state === GameState.SETTINGS) { this._handleSettingsClick(x, y); return; }
        if (this.state === GameState.PAUSED) { this.state = GameState.PLAYING; return; }
        if (this.state === GameState.COMPLETE) { this.state = GameState.MENU; return; }
        if (this.state !== GameState.PLAYING || !this.gridInfo) return;

        const { ox, oy, cellSize, gridPx } = this.gridInfo;

        // Check grid click
        if (x >= ox && x < ox + gridPx && y >= oy && y < oy + gridPx) {
            const c = Math.floor((x - ox) / cellSize);
            const r = Math.floor((y - oy) / cellSize);
            if (r >= 0 && r < 9 && c >= 0 && c < 9) {
                this._select(r, c);
            }
            return;
        }

        // Check numpad click
        if (this.padInfo) {
            const { padY, btnW, btnH } = this.padInfo;
            for (let i = 0; i < 9; i++) {
                const bx = ox + i * (btnW + 4);
                if (x >= bx && x < bx + btnW && y >= padY && y < padY + btnH) {
                    this._placeNumber(i + 1);
                    return;
                }
            }
        }

        // Check control buttons
        for (const btn of this.controlBtns) {
            if (x >= btn._x && x < btn._x + btn._w && y >= btn._y && y < btn._y + btn._h) {
                switch (btn.id) {
                    case 'notes': this.notesMode = !this.notesMode; break;
                    case 'undo': this._undo(); break;
                    case 'redo': this._redo(); break;
                    case 'erase': this._erase(); break;
                    case 'hint': this._hint(); break;
                }
                return;
            }
        }
    }

    _handleMenuClick(x, y) {
        const cx = this.W / 2;
        const diffs = ['easy', 'medium', 'hard', 'expert', 'evil'];
        const labels = ['DỄ', 'TRUNG BÌNH', 'KHÓ', 'CHUYÊN GIA', 'TÀI BA'];
        const startY = 250;
        const spacing = 48;

        for (let i = 0; i < diffs.length; i++) {
            const by = startY + i * spacing;
            if (x >= cx - 120 && x <= cx + 120 && y >= by - 16 && y <= by + 20) {
                this._startGame(diffs[i]);
                return;
            }
        }

        // Stats button
        if (x >= cx - 120 && x <= cx + 120 && y >= 520 && y <= 555) {
            this.state = GameState.STATS;
            return;
        }
        // Settings button
        if (x >= cx - 120 && x <= cx + 120 && y >= 570 && y <= 605) {
            this.state = GameState.SETTINGS;
            return;
        }
        // Continue button
        if (SaveManager.getCurrentGame() && x >= cx - 120 && x <= cx + 120 && y >= 195 && y <= 225) {
            this._continueGame();
            return;
        }
    }

    _handleSettingsClick(x, y) {
        const cx = this.W / 2;
        const themes = Renderer.getThemeNames();
        const labels = ['TỐI', 'SÁNG', 'GIẤY', 'HIỆN ĐẠI'];
        const s = SaveManager.load().settings;

        // Theme selection
        for (let i = 0; i < themes.length; i++) {
            const by = 120 + i * 40;
            if (x >= cx - 100 && x <= cx + 100 && y >= by - 12 && y <= by + 16) {
                Renderer.setTheme(themes[i]);
                SaveManager.updateSettings({ theme: themes[i] });
                return;
            }
        }

        // Sound toggle
        if (x >= cx - 100 && x <= cx + 100 && y >= 300 && y <= 330) {
            const enabled = AudioManager.toggle();
            SaveManager.updateSettings({ soundEnabled: enabled });
            return;
        }

        // Back
        if (x >= cx - 60 && x <= cx + 60 && y >= 400 && y <= 430) {
            this.state = GameState.MENU;
        }
    }

    _startGame(difficulty) {
        this.difficulty = difficulty;
        this.loading = true;
        this.loadingMsg = 'Đang tạo puzzle...';
        this.state = GameState.PLAYING;

        setTimeout(() => {
            const { puzzle, solution } = PuzzleGenerator.generatePuzzle(difficulty);
            this.board = puzzle;
            this.solution = solution;
            this.given = puzzle.map(r => r.map(c => c !== 0));
            this.notes = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set()));
            this.selected = null;
            this.numpadSelected = 0;
            this.notesMode = false;
            this.history = [];
            this.historyIdx = -1;
            this.timer = 0;
            this.hintsUsed = 0;
            this.loading = false;

            SaveManager.updateStats(difficulty, 0, 0, false);
        }, 50);
    }

    _continueGame() {
        const saved = SaveManager.getCurrentGame();
        if (!saved) return;
        this.board = saved.board;
        this.solution = saved.solution;
        this.given = saved.given;
        this.notes = saved.notes.map(r => r.map(n => new Set(n)));
        this.selected = saved.selected;
        this.notesMode = false;
        this.history = [];
        this.historyIdx = -1;
        this.timer = saved.timer || 0;
        this.hintsUsed = saved.hintsUsed || 0;
        this.difficulty = saved.difficulty;
        this.numpadSelected = 0;
        this.state = GameState.PLAYING;
    }

    _select(r, c) {
        if (this.given[r][c]) {
            this.selected = { row: r, col: c };
            this.numpadSelected = this.board[r][c] || 0;
            AudioManager.play('select');
        } else {
            this.selected = { row: r, col: c };
            this.numpadSelected = this.board[r][c] || 0;
            AudioManager.play('select');
        }
    }

    _saveHistory() {
        this.history = this.history.slice(0, this.historyIdx + 1);
        this.history.push({
            board: this.board.map(r => [...r]),
            notes: this.notes.map(r => r.map(s => new Set(s)))
        });
        this.historyIdx = this.history.length - 1;
        if (this.history.length > 200) { this.history.shift(); this.historyIdx--; }
    }

    _undo() {
        if (this.historyIdx <= 0) return;
        this.historyIdx--;
        const h = this.history[this.historyIdx];
        this.board = h.board.map(r => [...r]);
        this.notes = h.notes.map(r => r.map(s => new Set(s)));
        AudioManager.play('undo');
    }

    _redo() {
        if (this.historyIdx >= this.history.length - 1) return;
        this.historyIdx++;
        const h = this.history[this.historyIdx];
        this.board = h.board.map(r => [...r]);
        this.notes = h.notes.map(r => r.map(s => new Set(s)));
        AudioManager.play('undo');
    }

    _placeNumber(num) {
        if (!this.selected) return;
        const { row, col } = this.selected;
        if (this.given[row][col]) return;

        this.numpadSelected = num;

        if (this.notesMode) {
            this._saveHistory();
            if (this.notes[row][col].has(num)) {
                this.notes[row][col].delete(num);
            } else {
                this.notes[row][col].add(num);
            }
            this.board[row][col] = 0;
            AudioManager.play('note');
        } else {
            this._saveHistory();
            this.board[row][col] = num;
            this.notes[row][col].clear();
            AudioManager.play('place');

            // Mistake check (relaxed mode)
            const s = SaveManager.load().settings;
            if (s.mistakeMode === 'relaxed' && this.solution[row][col] !== num) {
                AudioManager.play('error');
            }

            // Check completion
            if (PuzzleGenerator.isComplete(this.board)) {
                this._onComplete();
            }
        }

        this._autoSave();
    }

    _erase() {
        if (!this.selected) return;
        const { row, col } = this.selected;
        if (this.given[row][col]) return;
        this._saveHistory();
        this.board[row][col] = 0;
        this.notes[row][col].clear();
        this.numpadSelected = 0;
        AudioManager.play('erase');
        this._autoSave();
    }

    _hint() {
        if (!this.selected) return;
        const { row, col } = this.selected;

        // If cell is empty, try to find hint for it
        if (this.board[row][col] === 0) {
            const hint = PuzzleGenerator.findHint(this.board);
            if (hint) {
                this._saveHistory();
                if (hint.num > 0) {
                    this.board[row][col] = hint.num;
                    this.notes[row][col].clear();
                } else {
                    // Reveal from solution
                    this.board[row][col] = this.solution[row][col];
                    this.notes[row][col].clear();
                }
                this.hintsUsed++;
                AudioManager.play('hint');
                if (PuzzleGenerator.isComplete(this.board)) this._onComplete();
                this._autoSave();
            }
        }
    }

    _onComplete() {
        this.state = GameState.COMPLETE;
        AudioManager.play('complete');

        SaveManager.updateStats(this.difficulty, this.timer, this.hintsUsed, true);
        SaveManager.clearCurrentGame();

        const stats = SaveManager.load().stats;
        AchievementManager.checkAll(stats);

        if (this.hintsUsed === 0) AchievementManager.tryUnlock('no_hint');
        if (this.hintsUsed === 0 && ['hard', 'expert', 'evil'].includes(this.difficulty)) {
            AchievementManager.tryUnlock('perfect');
        }
    }

    _autoSave() {
        SaveManager.saveCurrentGame({
            board: this.board.map(r => [...r]),
            solution: this.solution,
            given: this.given,
            notes: this.notes.map(r => r.map(s => [...s])),
            selected: this.selected,
            timer: this.timer,
            hintsUsed: this.hintsUsed,
            difficulty: this.difficulty
        });
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
        const dt = Math.min(elapsed / 1000, 0.05);
        try {
            this._update(dt);
            this._render();
        } catch (e) { console.error('Sudoku error:', e); }
    }

    _update(dt) {
        if (this.state === GameState.PLAYING && !this.loading) {
            this.timer += dt;
        }
        AchievementManager.update(dt);
    }

    _render() {
        const ctx = this.ctx;
        const t = Renderer.getTheme();

        ctx.fillStyle = t.bg;
        ctx.fillRect(0, 0, this.W, this.H);

        if (this.state === GameState.MENU) {
            this._renderMenu(ctx);
            return;
        }

        if (this.state === GameState.STATS) {
            this._renderStats(ctx);
            return;
        }

        if (this.state === GameState.SETTINGS) {
            this._renderSettings(ctx);
            return;
        }

        if (this.loading) {
            ctx.fillStyle = t.given;
            ctx.font = '18px Rajdhani, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.loadingMsg, this.W / 2, this.H / 2);
            return;
        }

        if (!this.board) return;

        // Draw game
        Renderer.drawTopBar(ctx, { difficulty: this.difficulty, timer: this.timer }, this.W);
        this.gridInfo = Renderer.drawGrid(ctx, {
            board: this.board, given: this.given, notes: this.notes,
            selected: this.selected, notesMode: this.notesMode
        }, this.W);
        this.padInfo = Renderer.drawNumpad(ctx, { board: this.board, numpadSelected: this.numpadSelected }, this.W, this.gridInfo);
        const ctrl = Renderer.drawControls(ctx, { notesMode: this.notesMode }, this.W, this.gridInfo, this.padInfo);
        this.controlBtns = ctrl.btns;

        AchievementManager.drawToast(ctx, this.W);

        if (this.state === GameState.PAUSED) Renderer.drawPauseOverlay(ctx, this.W, this.H);
        if (this.state === GameState.COMPLETE) Renderer.drawCompleteOverlay(ctx, { timer: this.timer, hintsUsed: this.hintsUsed, difficulty: this.difficulty }, this.W, this.H);
    }

    _renderMenu(ctx) {
        const t = Renderer.getTheme();
        const cx = this.W / 2;

        ctx.fillStyle = t.accent;
        ctx.font = 'bold 36px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SUDOKU', cx, 80);

        ctx.fillStyle = t.player;
        ctx.font = 'bold 18px Orbitron, monospace';
        ctx.fillText('MASTER', cx, 110);

        // Mini grid decoration
        ctx.strokeStyle = t.line;
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= 9; i++) {
            ctx.beginPath(); ctx.moveTo(cx - 90 + i * 20, 130); ctx.lineTo(cx - 90 + i * 20, 210); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx - 90, 130 + i * 20); ctx.lineTo(cx + 90, 130 + i * 20); ctx.stroke();
        }
        ctx.strokeStyle = t.thickLine;
        ctx.lineWidth = 2;
        for (let i = 0; i <= 3; i++) {
            ctx.beginPath(); ctx.moveTo(cx - 90 + i * 60, 130); ctx.lineTo(cx - 90 + i * 60, 210); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx - 90, 130 + i * 60); ctx.lineTo(cx + 90, 130 + i * 60); ctx.stroke();
        }

        // Continue button
        const saved = SaveManager.getCurrentGame();
        if (saved) {
            ctx.fillStyle = t.accent;
            ctx.font = 'bold 15px Rajdhani, sans-serif';
            ctx.fillText('▶ TIẾP TỤC VÁN CŨ', cx, 210);
        }

        // Difficulty buttons
        const diffs = ['easy', 'medium', 'hard', 'expert', 'evil'];
        const labels = ['DỄ', 'TRUNG BÌNH', 'KHÓ', 'CHUYÊN GIA', 'TÀI BA'];
        const startY = 260;
        for (let i = 0; i < diffs.length; i++) {
            const y = startY + i * 48;
            ctx.fillStyle = t.numpadBg;
            ctx.fillRect(cx - 120, y - 16, 240, 36);
            ctx.strokeStyle = t.line;
            ctx.lineWidth = 1;
            ctx.strokeRect(cx - 120, y - 16, 240, 36);
            ctx.fillStyle = t.numpadText;
            ctx.font = 'bold 15px Rajdhani, sans-serif';
            ctx.fillText(labels[i], cx, y + 3);
        }

        // Stats button
        ctx.fillStyle = t.btnBg;
        ctx.fillRect(cx - 120, 520, 240, 32);
        ctx.strokeStyle = t.line;
        ctx.strokeRect(cx - 120, 520, 240, 32);
        ctx.fillStyle = t.btnText;
        ctx.font = '14px Rajdhani, sans-serif';
        ctx.fillText('📊 THỐNG KÊ', cx, 537);

        // Settings button
        ctx.fillStyle = t.btnBg;
        ctx.fillRect(cx - 120, 570, 240, 32);
        ctx.strokeStyle = t.line;
        ctx.strokeRect(cx - 120, 570, 240, 32);
        ctx.fillStyle = t.btnText;
        ctx.fillText('⚙ CÀI ĐẶT', cx, 587);

        // Controls hint
        ctx.fillStyle = t.note;
        ctx.font = '11px Rajdhani, sans-serif';
        ctx.fillText('Phím số 1-9: Nhập | Mũi tên: Di chuyển | N: Ghi chú', cx, 660);
        ctx.fillText('Z: Hoàn tác | H: Gợi ý | ESC: Tạm dừng', cx, 678);
    }

    _renderStats(ctx) {
        const t = Renderer.getTheme();
        const cx = this.W / 2;
        const stats = SaveManager.load().stats;

        ctx.fillStyle = t.accent;
        ctx.font = 'bold 22px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('THỐNG KÊ', cx, 40);

        const items = [
            ['Ván đã chơi', stats.gamesPlayed],
            ['Ván hoàn thành', stats.gamesCompleted],
            ['Tỷ lệ thắng', stats.gamesPlayed ? Math.round(stats.gamesCompleted / stats.gamesPlayed * 100) + '%' : '—'],
            ['Chuỗi hiện tại', stats.currentStreak],
            ['Chuỗi dài nhất', stats.longestStreak],
            ['Tổng gợi ý', stats.hintsUsed],
            ['Thời gian TB', stats.gamesCompleted ? Math.floor(stats.totalTime / stats.gamesCompleted / 60) + 'm' : '—'],
        ];

        ctx.textAlign = 'left';
        const sx = 80;
        items.forEach(([label, val], i) => {
            ctx.fillStyle = t.btnText;
            ctx.font = '14px Rajdhani, sans-serif';
            ctx.fillText(label, sx, 80 + i * 32);
            ctx.fillStyle = t.player;
            ctx.font = 'bold 14px Rajdhani, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(String(val), this.W - sx, 80 + i * 32);
            ctx.textAlign = 'left';
        });

        // Best times
        ctx.fillStyle = t.accent;
        ctx.font = 'bold 16px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('THỜI GIAN TỐT NHẤT', cx, 330);

        const bestTimes = [
            ['Dễ', stats.bestTimeEasy], ['TB', stats.bestTimeMedium], ['Khó', stats.bestTimeHard],
            ['CG', stats.bestTimeExpert], ['TB', stats.bestTimeEvil]
        ];
        const diffLabels = ['Dễ', 'TB', 'Khó', 'CG', 'Tài BA'];
        bestTimes.forEach(([label, time], i) => {
            const bx = 50 + i * 80;
            ctx.fillStyle = t.btnText;
            ctx.font = '12px Rajdhani, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(diffLabels[i], bx + 30, 360);
            ctx.fillStyle = t.player;
            ctx.font = 'bold 14px Rajdhani, sans-serif';
            ctx.fillText(time ? Math.floor(time / 60) + ':' + String(Math.floor(time % 60)).padStart(2, '0') : '—', bx + 30, 382);
        });

        ctx.fillStyle = t.note;
        ctx.font = '13px Rajdhani, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Nhấn ESC hoặc click để quay lại', cx, 680);
    }

    _renderSettings(ctx) {
        const t = Renderer.getTheme();
        const cx = this.W / 2;
        const s = SaveManager.load().settings;
        const themes = Renderer.getThemeNames();
        const labels = ['TỐI', 'SÁNG', 'GIẤY', 'HIỆN ĐẠI'];

        ctx.fillStyle = t.accent;
        ctx.font = 'bold 22px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CÀI ĐẶT', cx, 40);

        // Theme
        ctx.fillStyle = t.given;
        ctx.font = 'bold 14px Rajdhani, sans-serif';
        ctx.fillText('GIAO DIỆN', cx, 80);

        for (let i = 0; i < themes.length; i++) {
            const y = 120 + i * 40;
            const isSelected = s.theme === themes[i];
            ctx.fillStyle = isSelected ? t.accent : t.numpadBg;
            ctx.globalAlpha = isSelected ? 0.3 : 1;
            ctx.fillRect(cx - 100, y - 12, 200, 28);
            ctx.globalAlpha = 1;
            ctx.strokeStyle = t.line;
            ctx.strokeRect(cx - 100, y - 12, 200, 28);
            ctx.fillStyle = isSelected ? t.accent : t.numpadText;
            ctx.font = '14px Rajdhani, sans-serif';
            ctx.fillText(labels[i], cx, y + 4);
        }

        // Sound
        ctx.fillStyle = t.given;
        ctx.font = 'bold 14px Rajdhani, sans-serif';
        ctx.fillText('ÂM THANH', cx, 290);

        ctx.fillStyle = t.numpadBg;
        ctx.fillRect(cx - 100, 300, 200, 28);
        ctx.strokeStyle = t.line;
        ctx.strokeRect(cx - 100, 300, 200, 28);
        ctx.fillStyle = t.numpadText;
        ctx.font = '14px Rajdhani, sans-serif';
        ctx.fillText(s.soundEnabled ? '🔊 BẬT' : '🔇 TẮT', cx, 316);

        // Back
        ctx.fillStyle = t.btnBg;
        ctx.fillRect(cx - 60, 400, 120, 28);
        ctx.strokeStyle = t.line;
        ctx.strokeRect(cx - 60, 400, 120, 28);
        ctx.fillStyle = t.btnText;
        ctx.font = '14px Rajdhani, sans-serif';
        ctx.fillText('← QUAY LẠI', cx, 416);

        ctx.fillStyle = t.note;
        ctx.font = '11px Rajdhani, sans-serif';
        ctx.fillText('Nhấn ESC để quay lại', cx, 680);
    }
}

window.addEventListener('load', () => { new SudokuGame(); });
