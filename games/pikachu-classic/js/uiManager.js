/**
 * Pikachu Classic - UI Manager
 * HUD, menus, tile rendering, connection lines
 */

// Tile emoji icons (36 unique)
const TILE_ICONS = [
    '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼',
    '🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔',
    '🐧','🐦','🦆','🦅','🦉','🦇','🐺','🐗',
    '🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜',
    '🐢','🐍','🦎','🐙'
];

const TILE_COLORS = [
    '#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD','#98D8C8','#F7DC6F',
    '#BB8FCE','#85C1E9','#82E0AA','#F8C471','#D7BDE2','#A3E4D7','#FAD7A0','#AED6F1',
    '#A9DFBF','#F5CBA7','#D5F5E3','#E8DAEF','#D6EAF8','#FCF3CF','#FADBD8','#D4E6F1',
    '#D5D8DC','#F9E79F','#ABEBC6','#F5B7B1','#AED6F1','#D7BDE2','#82E0AA','#F8C471',
    '#85C1E9','#BB8FCE','#96CEB4','#FF6B6B'
];

class UIManager {
    constructor(canvas, cols, rows) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cols = cols;
        this.rows = rows;

        this.cellW = 48;
        this.cellH = 54;
        this.offsetX = 20;
        this.offsetY = 60;

        // Animation state
        this.selected = null; // {r, c}
        this.hintPair = null;
        this.hintTimer = 0;
        this.connectionLine = null; // {points, timer, color}
        this.popAnimations = []; // [{r, c, timer}]
        this.scorePopups = []; // [{x, y, text, timer, color}]
        this.errorAnim = null; // {r, c, timer}
        this.shakeTimer = 0;

        // Resize canvas to fit board
        this.resize();
    }

    resize() {
        this.canvas.width = this.offsetX * 2 + this.cols * this.cellW;
        this.canvas.height = this.offsetY + this.rows * this.cellH + 80;
    }

    /**
     * Get cell from mouse position
     */
    getCellFromPos(x, y) {
        const c = Math.floor((x - this.offsetX) / this.cellW);
        const r = Math.floor((y - this.offsetY) / this.cellH);
        if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
            return { r, c };
        }
        return null;
    }

    /**
     * Draw the game board
     */
    drawBoard(board, selected, hintPair, combo) {
        const ctx = this.ctx;
        ctx.save();

        // Shake
        if (this.shakeTimer > 0) {
            this.shakeTimer--;
            ctx.translate((Math.random()-0.5)*4, (Math.random()-0.5)*4);
        }

        // Background
        const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grad.addColorStop(0, '#1a5c2e');
        grad.addColorStop(1, '#0d3318');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Board background
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(this.offsetX - 4, this.offsetY - 4,
            this.cols * this.cellW + 8, this.rows * this.cellH + 8);

        // Draw tiles
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const type = board.getTile(r, c);
                if (type !== 0) {
                    this._drawTile(r, c, type, selected);
                }
            }
        }

        // Draw hint glow
        if (hintPair) {
            this._drawHintGlow(hintPair.t1.r, hintPair.t1.c);
            this._drawHintGlow(hintPair.t2.r, hintPair.t2.c);
        }

        // Draw connection line
        if (this.connectionLine && this.connectionLine.timer > 0) {
            this._drawConnectionLine(this.connectionLine);
            this.connectionLine.timer -= 2;
        }

        // Draw pop animations
        for (let i = this.popAnimations.length - 1; i >= 0; i--) {
            const anim = this.popAnimations[i];
            anim.timer--;
            if (anim.timer <= 0) {
                this.popAnimations.splice(i, 1);
            } else {
                this._drawPopAnim(anim);
            }
        }

        // Draw score popups
        for (let i = this.scorePopups.length - 1; i >= 0; i--) {
            const p = this.scorePopups[i];
            p.timer--;
            p.y -= 1;
            if (p.timer <= 0) {
                this.scorePopups.splice(i, 1);
            } else {
                ctx.globalAlpha = p.timer / 40;
                ctx.fillStyle = p.color || '#fff';
                ctx.font = 'bold 18px Rajdhani, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(p.text, p.x, p.y);
                ctx.globalAlpha = 1;
            }
        }

        // Error animation
        if (this.errorAnim) {
            this.errorAnim.timer--;
            if (this.errorAnim.timer <= 0) {
                this.errorAnim = null;
            } else {
                this._drawErrorAnim(this.errorAnim);
            }
        }

        ctx.restore();
    }

    _drawTile(r, c, type, selected) {
        const ctx = this.ctx;
        const x = this.offsetX + c * this.cellW;
        const y = this.offsetY + r * this.cellH;
        const w = this.cellW - 2;
        const h = this.cellH - 2;
        const isSelected = selected && selected.r === r && selected.c === c;
        const isError = this.errorAnim && this.errorAnim.r === r && this.errorAnim.c === c;

        // Tile background
        ctx.fillStyle = isSelected ? '#2a7a3e' : isError ? '#7a2a2a' : '#1e6b30';
        ctx.fillRect(x, y, w, h);

        // Border
        ctx.strokeStyle = isSelected ? '#44ff88' : isError ? '#ff4444' : '#2a8a40';
        ctx.lineWidth = isSelected ? 3 : 1;
        ctx.strokeRect(x, y, w, h);

        // Selected glow
        if (isSelected) {
            ctx.shadowColor = '#44ff88';
            ctx.shadowBlur = 10;
            ctx.strokeRect(x, y, w, h);
            ctx.shadowBlur = 0;
        }

        // Icon
        const iconIdx = (type - 1) % TILE_ICONS.length;
        const icon = TILE_ICONS[iconIdx];

        // Scale animation for selected
        ctx.save();
        if (isSelected) {
            const scale = 1.1;
            const cx = x + w/2;
            const cy = y + h/2;
            ctx.translate(cx, cy);
            ctx.scale(scale, scale);
            ctx.translate(-cx, -cy);
        }

        ctx.font = `${Math.floor(this.cellW * 0.55)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.fillText(icon, x + w/2, y + h/2);

        ctx.restore();
    }

    _drawHintGlow(r, c) {
        const ctx = this.ctx;
        const x = this.offsetX + c * this.cellW;
        const y = this.offsetY + r * this.cellH;
        const w = this.cellW - 2;
        const h = this.cellH - 2;

        const pulse = Math.sin(Date.now() * 0.008) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(255, 255, 0, ${pulse})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 12;
        ctx.strokeRect(x, y, w, h);
        ctx.shadowBlur = 0;
    }

    _drawConnectionLine(line) {
        const ctx = this.ctx;
        const points = line.points;
        const alpha = Math.min(1, line.timer / 20);

        ctx.strokeStyle = line.color || '#44ff88';
        ctx.lineWidth = 4;
        ctx.globalAlpha = alpha;
        ctx.shadowColor = line.color || '#44ff88';
        ctx.shadowBlur = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        for (let i = 0; i < points.length; i++) {
            const x = this.offsetX + points[i].c * this.cellW + this.cellW / 2;
            const y = this.offsetY + points[i].r * this.cellH + this.cellH / 2;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }

    _drawPopAnim(anim) {
        const ctx = this.ctx;
        const x = this.offsetX + anim.c * this.cellW + this.cellW / 2;
        const y = this.offsetY + anim.r * this.cellH + this.cellH / 2;
        const progress = 1 - (anim.timer / 20);
        const scale = 1 + progress * 0.5;

        ctx.globalAlpha = 1 - progress;
        ctx.strokeStyle = '#44ff88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, this.cellW * scale * 0.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    _drawErrorAnim(anim) {
        const ctx = this.ctx;
        const x = this.offsetX + anim.c * this.cellW;
        const y = this.offsetY + anim.r * this.cellH;
        const w = this.cellW - 2;
        const h = this.cellH - 2;

        const flash = Math.sin(anim.timer * 0.5) * 0.3;
        ctx.fillStyle = `rgba(255, 0, 0, ${Math.abs(flash)})`;
        ctx.fillRect(x, y, w, h);
    }

    /**
     * Draw HUD
     */
    drawHUD(score, timer, level, hints, shuffles, combo, maxTimer = 300) {
        const ctx = this.ctx;
        const w = this.canvas.width;

        // Top bar
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, w, 52);

        // Level
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 16px Orbitron, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Level ${level}`, 12, 20);

        // Score
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Rajdhani, sans-serif';
        ctx.fillText(`Score: ${score}`, 12, 40);

        // Timer
        const timerColor = timer <= 30 ? '#ff4444' : timer <= 60 ? '#ffaa00' : '#fff';
        ctx.fillStyle = timerColor;
        ctx.font = 'bold 18px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.ceil(timer)}s`, w / 2, 22);

        // Timer bar
        const barW = 120;
        const barX = w / 2 - barW / 2;
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, 30, barW, 6);
        ctx.fillStyle = timer <= 30 ? '#ff4444' : '#00ccff';
        ctx.fillRect(barX, 30, barW * Math.max(0, timer / maxTimer), 6);

        // Hints + Shuffles
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 13px Rajdhani, sans-serif';
        ctx.fillText(`💡 ${hints}  🔀 ${shuffles}`, w - 12, 20);

        // Combo
        if (combo > 1) {
            ctx.fillStyle = '#ff8844';
            ctx.font = 'bold 16px Rajdhani, sans-serif';
            ctx.fillText(`x${combo} COMBO!`, w - 12, 40);
        }

        // Sound indicator
        ctx.fillStyle = '#555';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(AudioManager.enabled ? '🔊' : '🔇', w - 50, 48);
    }

    /**
     * Draw main menu
     */
    drawMenu(hasSave) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, w, h);

        ctx.textAlign = 'center';

        // Title
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 36px Orbitron, monospace';
        ctx.fillText('PIKACHU', w/2, h/2 - 120);

        ctx.fillStyle = '#44ff88';
        ctx.font = 'bold 18px Orbitron, monospace';
        ctx.fillText('CLASSIC', w/2, h/2 - 85);

        // Decorative icons
        ctx.font = '28px sans-serif';
        ctx.fillText('🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼', w/2, h/2 - 45);

        // Menu items
        const items = [
            { text: 'PLAY', y: h/2 + 10 },
            ...(hasSave ? [{ text: 'CONTINUE', y: h/2 + 45 }] : []),
            { text: 'LEVEL SELECT', y: h/2 + (hasSave ? 80 : 45) },
            { text: 'STATISTICS', y: h/2 + (hasSave ? 115 : 80) }
        ];

        for (const item of items) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px Rajdhani, sans-serif';
            ctx.fillText(item.text, w/2, item.y);
        }

        // Instructions
        ctx.fillStyle = '#888';
        ctx.font = '12px Rajdhani, sans-serif';
        ctx.fillText('Click matching tiles to clear the board!', w/2, h - 30);
    }

    /**
     * Draw level select screen
     */
    drawLevelSelect(maxUnlocked, currentLevel) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.fillStyle = 'rgba(0,0,0,0.9)';
        ctx.fillRect(0, 0, w, h);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 24px Orbitron, monospace';
        ctx.fillText('LEVEL SELECT', w/2, 40);

        const cols = 5;
        const cellSize = 50;
        const gap = 10;
        const startX = w/2 - (cols * (cellSize + gap) - gap) / 2;
        const startY = 70;

        for (let i = 0; i < 25; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = startX + col * (cellSize + gap);
            const y = startY + row * (cellSize + gap);
            const unlocked = (i + 1) <= maxUnlocked;

            ctx.fillStyle = unlocked ? (i + 1 === currentLevel ? '#2a7a3e' : '#1a4a28') : '#222';
            ctx.fillRect(x, y, cellSize, cellSize);
            ctx.strokeStyle = unlocked ? '#44ff88' : '#444';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, cellSize, cellSize);

            ctx.fillStyle = unlocked ? '#fff' : '#555';
            ctx.font = 'bold 18px Orbitron, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${i+1}`, x + cellSize/2, y + cellSize/2);
        }

        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#aaa';
        ctx.font = '13px Rajdhani, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Click a level to play  |  ESC to go back', w/2, h - 20);
    }

    /**
     * Draw statistics screen
     */
    drawStatistics(stats) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.fillStyle = 'rgba(0,0,0,0.9)';
        ctx.fillRect(0, 0, w, h);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 24px Orbitron, monospace';
        ctx.fillText('STATISTICS', w/2, 50);

        const items = [
            ['Total Matches', stats.totalMatches],
            ['Total Games', stats.totalGames],
            ['Play Time', `${Math.floor(stats.totalPlayTime / 60)}m`],
            ['Highest Score', stats.highestScore],
            ['Best Combo', `x${stats.highestCombo}`],
            ['Levels Cleared', stats.levelsCleared]
        ];

        ctx.textAlign = 'left';
        const startX = w/2 - 120;
        items.forEach(([label, value], i) => {
            ctx.fillStyle = '#aaa';
            ctx.font = '14px Rajdhani, sans-serif';
            ctx.fillText(label, startX, 100 + i * 35);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px Rajdhani, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`${value}`, startX + 240, 100 + i * 35);
            ctx.textAlign = 'left';
        });

        ctx.fillStyle = '#aaa';
        ctx.font = '13px Rajdhani, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ESC to go back', w/2, h - 20);
    }

    /**
     * Draw settings screen
     */
    drawSettings(soundEnabled, volume) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.fillStyle = 'rgba(0,0,0,0.9)';
        ctx.fillRect(0, 0, w, h);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 24px Orbitron, monospace';
        ctx.fillText('SETTINGS', w/2, 60);

        ctx.fillStyle = '#fff';
        ctx.font = '16px Rajdhani, sans-serif';
        ctx.fillText(`Sound: ${soundEnabled ? 'ON' : 'OFF'}  [S]`, w/2, 120);
        ctx.fillText(`Volume: ${Math.round(volume * 100)}%  [←/→]`, w/2, 155);

        ctx.fillStyle = '#aaa';
        ctx.font = '13px Rajdhani, sans-serif';
        ctx.fillText('ESC to go back', w/2, h - 20);
    }

    /**
     * Draw level start overlay
     */
    drawLevelStart(level, desc, timer) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(0, 0, w, h);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 28px Orbitron, monospace';
        ctx.fillText(`Level ${level}`, w/2, h/2 - 40);

        ctx.fillStyle = '#fff';
        ctx.font = '16px Rajdhani, sans-serif';
        ctx.fillText(desc, w/2, h/2);

        ctx.fillStyle = '#aaa';
        ctx.font = '14px Rajdhani, sans-serif';
        ctx.fillText(`Time: ${timer}s`, w/2, h/2 + 30);

        ctx.fillStyle = '#44ff88';
        ctx.font = 'bold 16px Orbitron, monospace';
        if (Math.floor(Date.now() / 500) % 2 === 0)
            ctx.fillText('[ CLICK TO START ]', w/2, h/2 + 80);
    }

    /**
     * Draw victory overlay
     */
    drawLevelComplete(score, stars, timeRemaining) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, w, h);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#44ff88';
        ctx.font = 'bold 30px Orbitron, monospace';
        ctx.fillText('LEVEL COMPLETE!', w/2, h/2 - 60);

        // Stars
        ctx.font = '36px sans-serif';
        const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
        ctx.fillText(starStr, w/2, h/2 - 10);

        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 18px Orbitron, monospace';
        ctx.fillText(`Score: ${score}`, w/2, h/2 + 30);

        ctx.fillStyle = '#aaa';
        ctx.font = '14px Rajdhani, sans-serif';
        ctx.fillText(`Time remaining: ${Math.ceil(timeRemaining)}s`, w/2, h/2 + 55);

        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 14px Orbitron, monospace';
        ctx.fillText('[ CLICK TO CONTINUE ]', w/2, h/2 + 90);
    }

    /**
     * Draw game over overlay
     */
    drawGameOver(score, level) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, w, h);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 30px Orbitron, monospace';
        ctx.fillText('GAME OVER', w/2, h/2 - 50);

        ctx.fillStyle = '#fff';
        ctx.font = '16px Rajdhani, sans-serif';
        ctx.fillText(`Score: ${score}`, w/2, h/2);
        ctx.fillText(`Level: ${level}`, w/2, h/2 + 25);

        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 14px Orbitron, monospace';
        ctx.fillText('[ CLICK TO RETRY ]', w/2, h/2 + 70);
    }

    /**
     * Draw final victory (all 25 levels)
     */
    drawFinalVictory(score, stats) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.fillStyle = 'rgba(0,0,0,0.9)';
        ctx.fillRect(0, 0, w, h);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#44ff88';
        ctx.font = 'bold 30px Orbitron, monospace';
        ctx.fillText('YOU WIN!', w/2, h/2 - 110);

        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 20px Orbitron, monospace';
        ctx.fillText('All 25 Levels Complete!', w/2, h/2 - 75);

        ctx.fillStyle = '#fff';
        ctx.font = '15px Rajdhani, sans-serif';
        ctx.fillText(`Total Score: ${score}`, w/2, h/2 - 35);
        ctx.fillText(`Total Matches: ${stats.totalMatches}`, w/2, h/2 - 10);
        ctx.fillText(`Best Combo: x${stats.highestCombo}`, w/2, h/2 + 15);
        ctx.fillText(`Play Time: ${Math.floor(stats.totalPlayTime / 60)}min`, w/2, h/2 + 40);

        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 14px Orbitron, monospace';
        ctx.fillText('[ CLICK TO PLAY AGAIN ]', w/2, h/2 + 90);
    }

    /**
     * Draw pause overlay
     */
    drawPaused() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, w, h);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 28px Orbitron, monospace';
        ctx.fillText('PAUSED', w/2, h/2 - 20);

        ctx.fillStyle = '#aaa';
        ctx.font = '14px Rajdhani, sans-serif';
        ctx.fillText('Press ESC or P to resume', w/2, h/2 + 20);
    }
}
