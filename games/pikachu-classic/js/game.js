/**
 * Pikachu Classic - Main Game Controller
 */

const GameState = {
    MENU: 'menu',
    LEVEL_SELECT: 'levelSelect',
    STATISTICS: 'statistics',
    SETTINGS: 'settings',
    LEVEL_START: 'levelStart',
    PLAYING: 'playing',
    PAUSED: 'paused',
    LEVEL_COMPLETE: 'levelComplete',
    GAME_OVER: 'gameOver',
    FINAL_VICTORY: 'finalVictory'
};

class PikachuGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.board = new Board(16, 9);
        this.ui = new UIManager(this.canvas, 16, 9);

        this.state = GameState.MENU;
        this.level = 1;
        this.score = 0;
        this.timer = 300;
        this.hints = 3;
        this.shuffles = 3;

        // Combo system
        this.combo = 0;
        this.lastMatchTime = 0;
        this.comboTimeout = 3000; // 3 seconds for combo

        // Selection
        this.selected = null;

        // Level state
        this.currentShift = null;
        this.tileVariety = 18;
        this.holes = [];

        // Stats
        this.stats = {};
        this.levelStartTimer = 0;
        this.hintsUsed = 0;
        this.shufflesUsed = 0;

        // Settings
        this.soundEnabled = true;
        this.volume = 0.5;

        this.lastTime = 0;
        this.frameInterval = 1000 / 60;
        this.maxTimer = 300;

        this._loadSave();
        this._setupInput();
        this._gameLoop(performance.now());
    }

    _loadSave() {
        const save = SaveManager.load();
        this.stats = save.stats;
        this.soundEnabled = save.settings.soundEnabled;
        this.volume = save.settings.volume;
        AudioManager.setVolume(this.volume);
        if (!this.soundEnabled) AudioManager.toggle();
    }

    _setupInput() {
        this.canvas.addEventListener('click', (e) => this._handleClick(e));
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
            const y = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
            this._handleClickAt(x, y);
        }, { passive: false });

        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'Escape':
                    if (this.state === GameState.PLAYING) {
                        this.state = GameState.PAUSED;
                    } else if (this.state === GameState.PAUSED) {
                        this.state = GameState.PLAYING;
                    } else if (this.state !== GameState.MENU) {
                        this.state = GameState.MENU;
                    }
                    break;
                case 'p': case 'P':
                    if (this.state === GameState.PLAYING) this.state = GameState.PAUSED;
                    else if (this.state === GameState.PAUSED) this.state = GameState.PLAYING;
                    break;
                case 'h': case 'H':
                    if (this.state === GameState.PLAYING) this._useHint();
                    break;
                case 's': case 'S':
                    if (this.state === GameState.PLAYING) this._useShuffle();
                    else if (this.state === GameState.SETTINGS) {
                        this.soundEnabled = !this.soundEnabled;
                        AudioManager.toggle();
                    }
                    break;
                case 'ArrowLeft':
                    if (this.state === GameState.SETTINGS) {
                        this.volume = Math.max(0, this.volume - 0.1);
                        AudioManager.setVolume(this.volume);
                    }
                    break;
                case 'ArrowRight':
                    if (this.state === GameState.SETTINGS) {
                        this.volume = Math.min(1, this.volume + 0.1);
                        AudioManager.setVolume(this.volume);
                    }
                    break;
            }
        });
    }

    _handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        this._handleClickAt(x, y);
    }

    _handleClickAt(x, y) {
        AudioManager.resume();

        switch (this.state) {
            case GameState.MENU:
                this._handleMenuClick(x, y);
                break;
            case GameState.LEVEL_SELECT:
                this._handleLevelSelectClick(x, y);
                break;
            case GameState.STATISTICS:
            case GameState.SETTINGS:
                this.state = GameState.MENU;
                break;
            case GameState.LEVEL_START:
                this.state = GameState.PLAYING;
                break;
            case GameState.PLAYING:
                this._handleBoardClick(x, y);
                break;
            case GameState.PAUSED:
                this.state = GameState.PLAYING;
                break;
            case GameState.LEVEL_COMPLETE:
                this._nextLevel();
                break;
            case GameState.GAME_OVER:
                this._retryLevel();
                break;
            case GameState.FINAL_VICTORY:
                this._restartGame();
                break;
        }
    }

    _handleMenuClick(x, y) {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const hasSave = SaveManager.hasSave();

        // Simple button detection based on y position
        const items = ['PLAY', ...(hasSave ? ['CONTINUE'] : []), 'LEVEL SELECT', 'STATISTICS'];
        const startY = h/2 + 10;
        const spacing = 35;

        for (let i = 0; i < items.length; i++) {
            const btnY = startY + i * spacing;
            if (y >= btnY - 15 && y <= btnY + 10) {
                switch (items[i]) {
                    case 'PLAY':
                        this._startGame(1);
                        break;
                    case 'CONTINUE':
                        this._continueGame();
                        break;
                    case 'LEVEL SELECT':
                        this.state = GameState.LEVEL_SELECT;
                        break;
                    case 'STATISTICS':
                        this.state = GameState.STATISTICS;
                        break;
                }
                return;
            }
        }
    }

    _handleLevelSelectClick(x, y) {
        const w = this.canvas.width;
        const cols = 5;
        const cellSize = 50;
        const gap = 10;
        const startX = w/2 - (cols * (cellSize + gap) - gap) / 2;
        const startY = 70;
        const save = SaveManager.load();

        for (let i = 0; i < 25; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const bx = startX + col * (cellSize + gap);
            const by = startY + row * (cellSize + gap);

            if (x >= bx && x <= bx + cellSize && y >= by && y <= by + cellSize) {
                if ((i + 1) <= save.maxUnlockedLevel) {
                    this._startGame(i + 1);
                }
                return;
            }
        }
    }

    _startGame(level) {
        this.level = level;
        this.score = 0;
        this.hints = 3;
        this.shuffles = 3;
        this.combo = 0;
        this._loadLevel(level);
    }

    _continueGame() {
        const save = SaveManager.load();
        this.level = save.currentLevel;
        this.score = save.score;
        this.hints = save.hints;
        this.shuffles = save.shuffles;
        this.combo = 0;
        this._loadLevel(this.level);
    }

    _loadLevel(level) {
        const def = LevelManager.getLevel(level - 1);
        this.timer = def.timer;
        this.maxTimer = def.timer;
        this.currentShift = def.shift;
        this.tileVariety = def.tileVariety;
        this.holes = def.holes || [];
        this.selected = null;
        this.combo = 0;
        this.hintsUsed = 0;
        this.shufflesUsed = 0;
        this.ui.hintPair = null;
        this.ui.connectionLine = null;
        this.ui.popAnimations = [];
        this.ui.scorePopups = [];
        this.ui.errorAnim = null;

        if (this.holes.length > 0) {
            this.board.generateWithHoles(this.holes, this.tileVariety);
        } else {
            this.board.generate(this.tileVariety);
        }

        this.state = GameState.LEVEL_START;
        this.levelStartTimer = 90;

        SaveManager.saveGameState(this.level, this.score, this.hints, this.shuffles);
    }

    _nextLevel() {
        if (this.level >= LevelManager.getTotalLevels()) {
            this._finalVictory();
            return;
        }
        this.level++;
        this._loadLevel(this.level);
    }

    _retryLevel() {
        this._loadLevel(this.level);
    }

    _restartGame() {
        SaveManager.clear();
        this._startGame(1);
    }

    _finalVictory() {
        this.state = GameState.FINAL_VICTORY;
        AudioManager.play('victory');
        SaveManager.updateStats('levelsCleared', this.level);
        SaveManager.updateStats('highestScore', this.score);
    }

    _handleBoardClick(x, y) {
        const cell = this.ui.getCellFromPos(x, y);
        if (!cell) return;
        if (!this.board.hasTile(cell.r, cell.c)) return;

        AudioManager.play('select');

        if (!this.selected) {
            // First selection
            this.selected = cell;
            this.ui.selected = cell;
            this.ui.hintPair = null;
        } else {
            // Second selection
            if (this.selected.r === cell.r && this.selected.c === cell.c) {
                // Same tile - deselect
                this.selected = null;
                this.ui.selected = null;
                return;
            }

            const path = this.board.tryMatch(this.selected.r, this.selected.c, cell.r, cell.c);
            if (path) {
                // Valid match!
                this._processMatch(this.selected, cell, path);
            } else {
                // Invalid match
                AudioManager.play('error');
                this.ui.errorAnim = { r: cell.r, c: cell.c, timer: 20 };
                this.ui.shakeTimer = 10;
                this.selected = null;
                this.ui.selected = null;
            }
        }
    }

    _processMatch(pos1, pos2, path) {
        const now = Date.now();
        const elapsed = now - this.lastMatchTime;
        this.lastMatchTime = now;

        // Combo
        if (elapsed < this.comboTimeout) {
            this.combo++;
        } else {
            this.combo = 1;
        }

        // Score
        let points = 10;
        if (this.combo >= 2) points = 20;
        if (this.combo >= 3) points = 30;
        if (this.combo >= 4) points = 50;

        this.score += points;
        this.stats.totalMatches++;

        // Audio
        if (this.combo >= 2) {
            AudioManager.play('combo');
        } else {
            AudioManager.play('match');
        }

        // Visual effects
        const x1 = this.ui.offsetX + pos1.c * this.ui.cellW + this.ui.cellW / 2;
        const y1 = this.ui.offsetY + pos1.r * this.ui.cellH + this.ui.cellH / 2;
        const x2 = this.ui.offsetX + pos2.c * this.ui.cellW + this.ui.cellW / 2;
        const y2 = this.ui.offsetY + pos2.r * this.ui.cellH + this.ui.cellH / 2;

        // Connection line
        this.ui.connectionLine = {
            points: path,
            timer: 30,
            color: this.combo >= 3 ? '#ffaa00' : this.combo >= 2 ? '#ff8844' : '#44ff88'
        };

        // Score popup
        const popupColor = this.combo >= 3 ? '#ffaa00' : this.combo >= 2 ? '#ff8844' : '#44ff88';
        const popupText = this.combo >= 2 ? `+${points} x${this.combo}` : `+${points}`;
        this.ui.scorePopups.push({ x: (x1+x2)/2, y: (y1+y2)/2 - 20, text: popupText, timer: 40, color: popupColor });

        // Pop animations
        this.ui.popAnimations.push({ r: pos1.r, c: pos1.c, timer: 20 });
        this.ui.popAnimations.push({ r: pos2.r, c: pos2.c, timer: 20 });

        // Remove tiles
        this.board.removeTile(pos1.r, pos1.c);
        this.board.removeTile(pos2.r, pos2.c);

        // Clear selection
        this.selected = null;
        this.ui.selected = null;

        // Shift tiles if needed
        if (this.currentShift) {
            setTimeout(() => {
                this.board.shift(this.currentShift);
            }, 200);
        }

        // Check deadlock
        setTimeout(() => {
            if (this.board.checkDeadlock()) {
                AudioManager.play('deadlock');
                this.ui.shakeTimer = 15;
            }
        }, 400);

        // Check win
        if (this.board.isEmpty()) {
            setTimeout(() => {
                this._onLevelComplete();
            }, 500);
        }

        // Save
        SaveManager.saveGameState(this.level, this.score, this.hints, this.shuffles);
        SaveManager.updateStats('highestCombo', this.combo);
    }

    _onLevelComplete() {
        const stars = LevelManager.getStars(this.score, this.timer, this.hintsUsed, this.shufflesUsed, this.level);
        this.state = GameState.LEVEL_COMPLETE;
        this._stars = stars;
        AudioManager.play('victory');
        SaveManager.unlockLevel(this.level + 1);
        SaveManager.updateStats('levelsCleared', this.level);
        SaveManager.updateStats('highestScore', this.score);
    }

    _useHint() {
        if (this.hints <= 0) return;
        const hint = this.board.findHint();
        if (hint) {
            this.hints--;
            this.hintsUsed++;
            this.ui.hintPair = hint;
            AudioManager.play('hint');
            setTimeout(() => { this.ui.hintPair = null; }, 3000);
        }
    }

    _useShuffle() {
        if (this.shuffles <= 0) return;
        this.shuffles--;
        this.shufflesUsed++;
        this.board.shuffle();
        this.selected = null;
        this.ui.selected = null;
        AudioManager.play('shuffle');
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
        if (this.state === GameState.LEVEL_START) {
            this.levelStartTimer--;
            if (this.levelStartTimer <= 0) this.state = GameState.PLAYING;
            return;
        }

        if (this.state === GameState.PLAYING) {
            this.timer -= 1/60;
            this.stats.totalPlayTime += 1/60;
            if (this.timer <= 0) {
                this.timer = 0;
                this.state = GameState.GAME_OVER;
                AudioManager.play('gameover');
                SaveManager.updateStats('totalGames', 1);
            }
        }
    }

    _render() {
        switch (this.state) {
            case GameState.MENU:
                this.ui.drawBoard(this.board, null, null, 0);
                this.ui.drawMenu(SaveManager.hasSave());
                break;
            case GameState.LEVEL_SELECT:
                const save = SaveManager.load();
                this.ui.drawLevelSelect(save.maxUnlockedLevel, this.level);
                break;
            case GameState.STATISTICS:
                this.ui.drawStatistics(this.stats);
                break;
            case GameState.SETTINGS:
                this.ui.drawSettings(this.soundEnabled, this.volume);
                break;
            case GameState.LEVEL_START:
                this.ui.drawBoard(this.board, null, null, 0);
                const def = LevelManager.getLevel(this.level - 1);
                this.ui.drawLevelStart(this.level, def.desc, def.timer);
                break;
            case GameState.PLAYING:
            case GameState.PAUSED:
                this.ui.drawBoard(this.board, this.selected, this.ui.hintPair, this.combo);
                this.ui.drawHUD(this.score, this.timer, this.level, this.hints, this.shuffles, this.combo, this.maxTimer);
                if (this.state === GameState.PAUSED) this.ui.drawPaused();
                break;
            case GameState.LEVEL_COMPLETE:
                this.ui.drawBoard(this.board, null, null, 0);
                this.ui.drawLevelComplete(this.score, this._stars || 1, this.timer);
                break;
            case GameState.GAME_OVER:
                this.ui.drawBoard(this.board, null, null, 0);
                this.ui.drawGameOver(this.score, this.level);
                break;
            case GameState.FINAL_VICTORY:
                this.ui.drawFinalVictory(this.score, this.stats);
                break;
        }
    }
}

window.addEventListener('load', () => { new PikachuGame(); });
