/**
 * Sudoku Master - Puzzle Generator & Solver
 * Backtracking solver with constraint propagation
 */
const PuzzleGenerator = (() => {
    // Shuffle array in place
    function shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    // Deep clone a 9x9 board
    function clone(board) {
        return board.map(r => [...r]);
    }

    // Check if placing num at (row, col) is valid
    function isValid(board, row, col, num) {
        for (let i = 0; i < 9; i++) {
            if (board[row][i] === num) return false;
            if (board[i][col] === num) return false;
        }
        const br = Math.floor(row / 3) * 3;
        const bc = Math.floor(col / 3) * 3;
        for (let r = br; r < br + 3; r++) {
            for (let c = bc; c < bc + 3; c++) {
                if (board[r][c] === num) return false;
            }
        }
        return true;
    }

    // Get candidates for a cell
    function getCandidates(board, row, col) {
        if (board[row][col] !== 0) return [];
        const used = new Set();
        for (let i = 0; i < 9; i++) {
            used.add(board[row][i]);
            used.add(board[i][col]);
        }
        const br = Math.floor(row / 3) * 3;
        const bc = Math.floor(col / 3) * 3;
        for (let r = br; r < br + 3; r++) {
            for (let c = bc; c < bc + 3; c++) {
                used.add(board[r][c]);
            }
        }
        const result = [];
        for (let n = 1; n <= 9; n++) {
            if (!used.has(n)) result.push(n);
        }
        return result;
    }

    // Find empty cell with fewest candidates (MRV heuristic)
    function findBestCell(board) {
        let best = null;
        let bestLen = 10;
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (board[r][c] === 0) {
                    const len = getCandidates(board, r, c).length;
                    if (len === 0) return null; // dead end
                    if (len < bestLen) {
                        bestLen = len;
                        best = [r, c];
                        if (len === 1) return best; // can't do better
                    }
                }
            }
        }
        return best;
    }

    // Solve board in place, return true if solved
    function solve(board) {
        const cell = findBestCell(board);
        if (!cell) {
            // Check if complete
            for (let r = 0; r < 9; r++)
                for (let c = 0; c < 9; c++)
                    if (board[r][c] === 0) return false;
            return true;
        }
        const [row, col] = cell;
        const cands = shuffle([...getCandidates(board, row, col)]);
        for (const num of cands) {
            board[row][col] = num;
            if (solve(board)) return true;
            board[row][col] = 0;
        }
        return false;
    }

    // Count solutions up to limit (for uniqueness check)
    function countSolutions(board, limit) {
        let count = 0;
        const b = clone(board);

        function solveCount() {
            if (count >= limit) return;
            const cell = findBestCell(b);
            if (!cell) {
                for (let r = 0; r < 9; r++)
                    for (let c = 0; c < 9; c++)
                        if (b[r][c] === 0) return;
                count++;
                return;
            }
            const [row, col] = cell;
            const cands = getCandidates(b, row, col);
            for (const num of cands) {
                if (count >= limit) return;
                b[row][col] = num;
                solveCount();
                b[row][col] = 0;
            }
        }

        solveCount();
        return count;
    }

    // Generate a random solved board
    function generateSolved() {
        const board = Array.from({ length: 9 }, () => Array(9).fill(0));
        solve(board);
        return board;
    }

    // Get target clue count for difficulty
    function getCluesTarget(diff) {
        switch (diff) {
            case 'easy': return 36 + Math.floor(Math.random() * 10); // 36-45
            case 'medium': return 32 + Math.floor(Math.random() * 4); // 32-35
            case 'hard': return 28 + Math.floor(Math.random() * 4); // 28-31
            case 'expert': return 24 + Math.floor(Math.random() * 4); // 24-27
            case 'evil': return 17 + Math.floor(Math.random() * 7); // 17-23
            default: return 38;
        }
    }

    // Generate a puzzle with given difficulty
    function generatePuzzle(difficulty) {
        const solved = generateSolved();
        const puzzle = clone(solved);
        const target = getCluesTarget(difficulty);
        const toRemove = 81 - target;

        // Create symmetric position pairs
        const pairs = [];
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const mr = 8 - r, mc = 8 - c;
                if (r < mr || (r === mr && c <= mc)) {
                    pairs.push([r, c, mr, mc]);
                }
            }
        }
        shuffle(pairs);

        let removed = 0;
        const startTime = Date.now();
        const timeout = difficulty === 'evil' ? 8000 : 5000;

        for (const [r1, c1, r2, c2] of pairs) {
            if (removed >= toRemove) break;
            if (Date.now() - startTime > timeout) break;

            const b1 = puzzle[r1][c1];
            const b2 = puzzle[r2][c2];
            puzzle[r1][c1] = 0;
            if (r1 !== r2 || c1 !== c2) puzzle[r2][c2] = 0;

            if (countSolutions(puzzle, 2) === 1) {
                removed += (r1 === r2 && c1 === c2) ? 1 : 2;
            } else {
                puzzle[r1][c1] = b1;
                puzzle[r2][c2] = b2;
            }
        }

        return { puzzle, solution: solved };
    }

    // Validate a complete board
    function isComplete(board) {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (board[r][c] === 0) return false;
                if (findConflicts(board, r, c).length > 0) return false;
            }
        }
        return true;
    }

    // Find conflicts for a specific cell
    function findConflicts(board, row, col) {
        const num = board[row][col];
        if (num === 0) return [];
        const conflicts = [];
        for (let i = 0; i < 9; i++) {
            if (i !== col && board[row][i] === num) conflicts.push([row, i]);
            if (i !== row && board[i][col] === num) conflicts.push([i, col]);
        }
        const br = Math.floor(row / 3) * 3;
        const bc = Math.floor(col / 3) * 3;
        for (let r = br; r < br + 3; r++) {
            for (let c = bc; c < bc + 3; c++) {
                if (r !== row || c !== col) {
                    if (board[r][c] === num) conflicts.push([r, c]);
                }
            }
        }
        return conflicts;
    }

    // Find a hint (one solvable cell using naked/hidden singles)
    function findHint(board) {
        // Naked single: cell with only one candidate
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (board[r][c] === 0) {
                    const cands = getCandidates(board, r, c);
                    if (cands.length === 1) return { row: r, col: c, num: cands[0], reason: 'Naked Single' };
                }
            }
        }
        // Hidden single: number that can only go in one place in row/col/box
        for (let n = 1; n <= 9; n++) {
            // Check rows
            for (let r = 0; r < 9; r++) {
                const spots = [];
                for (let c = 0; c < 9; c++) {
                    if (board[r][c] === 0 && isValid(board, r, c, n)) spots.push(c);
                }
                if (spots.length === 1) return { row: r, col: spots[0], num: n, reason: 'Hidden Single (row)' };
            }
            // Check columns
            for (let c = 0; c < 9; c++) {
                const spots = [];
                for (let r = 0; r < 9; r++) {
                    if (board[r][c] === 0 && isValid(board, r, c, n)) spots.push(r);
                }
                if (spots.length === 1) return { row: spots[0], col: c, num: n, reason: 'Hidden Single (col)' };
            }
            // Check boxes
            for (let br = 0; br < 3; br++) {
                for (let bc = 0; bc < 3; bc++) {
                    const spots = [];
                    for (let r = br * 3; r < br * 3 + 3; r++) {
                        for (let c = bc * 3; c < bc * 3 + 3; c++) {
                            if (board[r][c] === 0 && isValid(board, r, c, n)) spots.push([r, c]);
                        }
                    }
                    if (spots.length === 1) return { row: spots[0][0], col: spots[0][1], num: n, reason: 'Hidden Single (box)' };
                }
            }
        }
        // Fallback: reveal from solution
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (board[r][c] === 0) return { row: r, col: c, num: 0, reason: 'Reveal' };
            }
        }
        return null;
    }

    return {
        generatePuzzle, generateSolved, solve, countSolutions,
        isValid, getCandidates, isComplete, findConflicts, findHint, clone, shuffle
    };
})();
