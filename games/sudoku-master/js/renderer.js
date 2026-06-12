/**
 * Sudoku Master - Renderer
 */
const Renderer = (() => {
    const THEMES = {
        dark: {
            bg: '#1a1a2e', gridBg: '#16213e', cellBg: '#0f3460',
            given: '#e0e0ff', player: '#4fc3f7', note: '#7986cb',
            selected: '#1a73e8', highlight: 'rgba(26,115,232,0.15)',
            boxHighlight: 'rgba(26,115,232,0.08)', conflict: '#e53935',
            line: '#30475e', thickLine: '#546e7a', completed: '#4caf50',
            numpadBg: '#16213e', numpadText: '#e0e0ff', numpadActive: '#1a73e8',
            btnBg: '#16213e', btnText: '#aaa', accent: '#4fc3f7'
        },
        light: {
            bg: '#f5f5f5', gridBg: '#fff', cellBg: '#fff',
            given: '#222', player: '#1565c0', note: '#666',
            selected: '#bbdefb', highlight: 'rgba(21,101,192,0.1)',
            boxHighlight: 'rgba(21,101,192,0.05)', conflict: '#e53935',
            line: '#bdbdbd', thickLine: '#333', completed: '#388e3c',
            numpadBg: '#fff', numpadText: '#333', numpadActive: '#1565c0',
            btnBg: '#fff', btnText: '#555', accent: '#1565c0'
        },
        paper: {
            bg: '#fff8e1', gridBg: '#fff', cellBg: '#fffde7',
            given: '#333', player: '#1b5e20', note: '#888',
            selected: '#c8e6c9', highlight: 'rgba(27,94,32,0.1)',
            boxHighlight: 'rgba(27,94,32,0.05)', conflict: '#c62828',
            line: '#a1887f', thickLine: '#5d4037', completed: '#2e7d32',
            numpadBg: '#fff8e1', numpadText: '#333', numpadActive: '#2e7d32',
            btnBg: '#fff8e1', btnText: '#555', accent: '#2e7d32'
        },
        modern: {
            bg: '#121212', gridBg: '#1e1e1e', cellBg: '#2d2d2d',
            given: '#ffffff', player: '#64ffda', note: '#80cbc4',
            selected: '#004d40', highlight: 'rgba(100,255,218,0.08)',
            boxHighlight: 'rgba(100,255,218,0.04)', conflict: '#ff5252',
            line: '#333', thickLine: '#555', completed: '#69f0ae',
            numpadBg: '#1e1e1e', numpadText: '#e0e0e0', numpadActive: '#004d40',
            btnBg: '#1e1e1e', btnText: '#888', accent: '#64ffda'
        }
    };

    let _theme = THEMES.dark;

    function setTheme(name) { _theme = THEMES[name] || THEMES.dark; }
    function getTheme() { return _theme; }
    function getThemeNames() { return Object.keys(THEMES); }

    // Draw the Sudoku grid
    function drawGrid(ctx, state, W) {
        const t = _theme;
        const gridW = W - 20;
        const cellSize = Math.floor(gridW / 9);
        const gridPx = cellSize * 9;
        const ox = Math.floor((W - gridPx) / 2);
        const oy = 10;

        // Background
        ctx.fillStyle = t.gridBg;
        ctx.fillRect(ox - 2, oy - 2, gridPx + 4, gridPx + 4);

        // Cells
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const x = ox + c * cellSize;
                const y = oy + r * cellSize;

                // Cell background
                ctx.fillStyle = t.cellBg;
                ctx.fillRect(x, y, cellSize, cellSize);

                // Highlight selected row/col/box
                if (state.selected) {
                    const sr = state.selected.row, sc = state.selected.col;
                    if (r === sr || c === sc) {
                        ctx.fillStyle = t.highlight;
                        ctx.fillRect(x, y, cellSize, cellSize);
                    }
                    const sbr = Math.floor(sr / 3) * 3, sbc = Math.floor(sc / 3) * 3;
                    if (r >= sbr && r < sbr + 3 && c >= sbc && c < sbc + 3) {
                        ctx.fillStyle = t.boxHighlight;
                        ctx.fillRect(x, y, cellSize, cellSize);
                    }
                    // Highlight same number
                    if (state.board[sr][sc] !== 0 && state.board[r][c] === state.board[sr][sc]) {
                        ctx.fillStyle = t.highlight;
                        ctx.fillRect(x, y, cellSize, cellSize);
                    }
                }

                // Selected cell
                if (state.selected && r === state.selected.row && c === state.selected.col) {
                    ctx.fillStyle = t.selected;
                    ctx.globalAlpha = 0.4;
                    ctx.fillRect(x, y, cellSize, cellSize);
                    ctx.globalAlpha = 1;
                }

                // Conflict or Mistake
                if (state.board[r][c] !== 0 && !state.given[r][c]) {
                    const conflicts = PuzzleGenerator.findConflicts(state.board, r, c);
                    const isWrong = state.solution && state.board[r][c] !== state.solution[r][c];
                    
                    if (conflicts.length > 0 || isWrong) {
                        ctx.fillStyle = t.conflict;
                        ctx.globalAlpha = 0.2;
                        ctx.fillRect(x, y, cellSize, cellSize);
                        ctx.globalAlpha = 1;
                    }
                }
            }
        }

        // Numbers
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const x = ox + c * cellSize + cellSize / 2;
                const y = oy + r * cellSize + cellSize / 2;
                const num = state.board[r][c];

                if (num !== 0) {
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';

                    const conflicts = !state.given[r][c] ? PuzzleGenerator.findConflicts(state.board, r, c) : [];
                    const isWrong = !state.given[r][c] && state.solution && state.board[r][c] !== state.solution[r][c];

                    if (state.given[r][c]) {
                        ctx.fillStyle = t.given;
                        ctx.font = `bold ${Math.floor(cellSize * 0.55)}px Orbitron, monospace`;
                    } else if (conflicts.length > 0 || isWrong) {
                        ctx.fillStyle = t.conflict;
                        ctx.font = `${Math.floor(cellSize * 0.5)}px Rajdhani, sans-serif`;
                    } else {
                        ctx.fillStyle = t.player;
                        ctx.font = `${Math.floor(cellSize * 0.5)}px Rajdhani, sans-serif`;
                    }
                    ctx.fillText(String(num), x, y + 1);
                } else if (state.notes[r][c] && state.notes[r][c].size > 0) {
                    // Notes
                    ctx.fillStyle = t.note;
                    ctx.font = `${Math.floor(cellSize * 0.22)}px Rajdhani, sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    for (const n of state.notes[r][c]) {
                        const nr = Math.floor((n - 1) / 3);
                        const nc = (n - 1) % 3;
                        const nx = x + (nc - 1) * cellSize * 0.28;
                        const ny = y + (nr - 1) * cellSize * 0.28;
                        ctx.fillText(String(n), nx, ny);
                    }
                }
            }
        }

        // Grid lines
        ctx.strokeStyle = t.line;
        ctx.lineWidth = 1;
        for (let i = 0; i <= 9; i++) {
            ctx.beginPath();
            ctx.moveTo(ox + i * cellSize, oy);
            ctx.lineTo(ox + i * cellSize, oy + gridPx);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(ox, oy + i * cellSize);
            ctx.lineTo(ox + gridPx, oy + i * cellSize);
            ctx.stroke();
        }

        // Thick box lines
        ctx.strokeStyle = t.thickLine;
        ctx.lineWidth = 3;
        for (let i = 0; i <= 3; i++) {
            ctx.beginPath();
            ctx.moveTo(ox + i * cellSize * 3, oy);
            ctx.lineTo(ox + i * cellSize * 3, oy + gridPx);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(ox, oy + i * cellSize * 3);
            ctx.lineTo(ox + gridPx, oy + i * cellSize * 3);
            ctx.stroke();
        }

        return { ox, oy, cellSize, gridPx };
    }

    // Draw number pad
    function drawNumpad(ctx, state, W, gridInfo) {
        const t = _theme;
        const { ox, cellSize, gridPx } = gridInfo;
        const padY = gridInfo.oy + gridPx + 15;
        const btnW = Math.floor((gridPx - 8 * 4) / 9);
        const btnH = 44;

        // Count remaining numbers
        const counts = {};
        for (let n = 1; n <= 9; n++) counts[n] = 0;
        for (let r = 0; r < 9; r++)
            for (let c = 0; c < 9; c++)
                if (state.board[r][c] !== 0) counts[state.board[r][c]]++;

        for (let i = 0; i < 9; i++) {
            const x = ox + i * (btnW + 4);
            const y = padY;
            const n = i + 1;
            const remaining = 9 - counts[n];

            ctx.fillStyle = state.numpadSelected === n ? t.numpadActive : t.numpadBg;
            ctx.fillRect(x, y, btnW, btnH);

            ctx.strokeStyle = t.line;
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, btnW, btnH);

            ctx.fillStyle = remaining === 0 ? t.line : (state.numpadSelected === n ? '#fff' : t.numpadText);
            ctx.font = `bold ${Math.floor(btnH * 0.5)}px Orbitron, monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(n), x + btnW / 2, y + btnH / 2);

            // Remaining count
            if (remaining > 0 && remaining < 9) {
                ctx.fillStyle = t.note;
                ctx.font = `${Math.floor(btnH * 0.25)}px Rajdhani, sans-serif`;
                ctx.fillText(String(remaining), x + btnW / 2, y + btnH - 8);
            }
        }

        return { padY, btnW, btnH };
    }

    // Draw controls
    function drawControls(ctx, state, W, gridInfo, padInfo) {
        const t = _theme;
        const { ox, gridPx } = gridInfo;
        const btnY = padInfo.padY + padInfo.btnH + 12;
        const btnH = 36;
        const btns = [
            { id: 'notes', icon: '✏️', label: state.notesMode ? 'GHI CHÚ' : 'BÌNH THƯỜNG', active: state.notesMode },
            { id: 'undo', icon: '↩️', label: 'HOÀN TÁC' },
            { id: 'redo', icon: '↪️', label: 'LÀM LẠI' },
            { id: 'erase', icon: '⌫', label: 'XÓA' },
            { id: 'hint', icon: '💡', label: 'GỢI Ý' }
        ];
        const btnW = Math.floor((gridPx - (btns.length - 1) * 4) / btns.length);

        for (let i = 0; i < btns.length; i++) {
            const x = ox + i * (btnW + 4);
            const btn = btns[i];

            ctx.fillStyle = btn.active ? t.accent : t.btnBg;
            ctx.globalAlpha = btn.active ? 0.3 : 1;
            ctx.fillRect(x, btnY, btnW, btnH);
            ctx.globalAlpha = 1;

            ctx.strokeStyle = t.line;
            ctx.lineWidth = 1;
            ctx.strokeRect(x, btnY, btnW, btnH);

            ctx.fillStyle = btn.active ? t.accent : t.btnText;
            ctx.font = `${Math.floor(btnH * 0.35)}px Rajdhani, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(btn.icon + ' ' + btn.label, x + btnW / 2, btnY + btnH / 2);

            btn._x = x; btn._y = btnY; btn._w = btnW; btn._h = btnH;
        }

        return { btnY, btnH, btns };
    }

    // Draw top bar (timer, difficulty, menu)
    function drawTopBar(ctx, state, W) {
        const t = _theme;
        // Difficulty
        ctx.fillStyle = t.accent;
        ctx.font = 'bold 14px Orbitron, monospace';
        ctx.textAlign = 'left';
        const diffNames = { easy: 'DỄ', medium: 'TRUNG BÌNH', hard: 'KHÓ', expert: 'CHUYÊN GIA', evil: 'TÀI BA' };
        ctx.fillText(diffNames[state.difficulty] || 'DỄ', 12, 18);

        // Timer
        const mins = Math.floor(state.timer / 60);
        const secs = Math.floor(state.timer % 60);
        ctx.fillStyle = t.btnText;
        ctx.font = 'bold 14px Orbitron, monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`, W - 12, 18);
    }

    function drawPauseOverlay(ctx, W, H) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('TẠM DỪNG', W / 2, H / 2 - 20);
        ctx.fillStyle = '#aaa';
        ctx.font = '14px Rajdhani, sans-serif';
        ctx.fillText('Nhấn để tiếp tục', W / 2, H / 2 + 15);
    }

    function drawCompleteOverlay(ctx, state, W, H) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#4caf50';
        ctx.font = 'bold 28px Orbitron, monospace';
        ctx.fillText('HOÀN THÀNH!', W / 2, H / 2 - 80);

        ctx.fillStyle = '#fff';
        ctx.font = '16px Rajdhani, sans-serif';
        const mins = Math.floor(state.timer / 60);
        const secs = Math.floor(state.timer % 60);
        ctx.fillText(`Thời gian: ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`, W / 2, H / 2 - 30);
        ctx.fillText(`Số gợi ý: ${state.hintsUsed}`, W / 2, H / 2);
        ctx.fillText(`Độ khó: ${state.difficulty}`, W / 2, H / 2 + 30);

        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 14px Orbitron, monospace';
        ctx.fillText('[ NHẤP ĐỂ TIẾP TỤC ]', W / 2, H / 2 + 80);
    }

    return { THEMES, setTheme, getTheme, getThemeNames, drawGrid, drawNumpad, drawControls, drawTopBar, drawPauseOverlay, drawCompleteOverlay };
})();
