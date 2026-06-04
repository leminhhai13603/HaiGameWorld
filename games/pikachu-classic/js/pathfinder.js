/**
 * Pikachu Classic - Pathfinder
 * BFS-based pathfinding with max 2 turns (3 segments)
 * Path CAN travel outside board boundaries
 */
class Pathfinder {
    constructor(cols, rows) {
        this.cols = cols;
        this.rows = rows;
    }

    /**
     * Find a valid path between two positions
     * Returns array of points [{x,y}, ...] or null if no path
     * Path can go outside board bounds
     * Max 2 turns (3 line segments)
     */
    findPath(r1, c1, r2, c2, board) {
        // Must be different positions
        if (r1 === r2 && c1 === c2) return null;

        // Both must be same tile type
        if (board[r1][c1] !== board[r2][c2]) return null;
        if (board[r1][c1] === 0) return null;

        // Try direct line (0 turns)
        const direct = this._checkDirect(r1, c1, r2, c2, board);
        if (direct) return direct;

        // Try 1 turn paths
        const oneTurn = this._findOneTurn(r1, c1, r2, c2, board);
        if (oneTurn) return oneTurn;

        // Try 2 turn paths
        const twoTurn = this._findTwoTurn(r1, c1, r2, c2, board);
        if (twoTurn) return twoTurn;

        return null;
    }

    /**
     * Check if direct line exists (0 turns)
     */
    _checkDirect(r1, c1, r2, c2, board) {
        if (r1 !== r2 && c1 !== c2) return null; // Not aligned

        if (this._isLineClear(r1, c1, r2, c2, board)) {
            return [{ r: r1, c: c1 }, { r: r2, c: c2 }];
        }
        return null;
    }

    /**
     * Find path with exactly 1 turn
     */
    _findOneTurn(r1, c1, r2, c2, board) {
        // Try corner at (r1, c2)
        if (this._isValidCorner(r1, c2, board) &&
            this._isLineClear(r1, c1, r1, c2, board) &&
            this._isLineClear(r1, c2, r2, c2, board)) {
            return [{ r: r1, c: c1 }, { r: r1, c: c2 }, { r: r2, c: c2 }];
        }

        // Try corner at (r2, c1)
        if (this._isValidCorner(r2, c1, board) &&
            this._isLineClear(r1, c1, r2, c1, board) &&
            this._isLineClear(r2, c1, r2, c2, board)) {
            return [{ r: r1, c: c1 }, { r: r2, c: c1 }, { r: r2, c: c2 }];
        }

        return null;
    }

    /**
     * Find path with exactly 2 turns
     * Scan all possible intermediate points
     */
    _findTwoTurn(r1, c1, r2, c2, board) {
        const maxR = this.rows + 1; // Allow -1 and rows
        const maxC = this.cols + 1;

        // Scan horizontal lines from r1
        for (let c = -1; c <= this.cols; c++) {
            if (c === c1) continue;
            // Corner 1: (r1, c), Corner 2: (r2, c)
            if (c === c2 && r1 === r2) continue; // Would be direct
            if (this._isValidCorner(r1, c, board) &&
                this._isValidCorner(r2, c, board) &&
                this._isLineClear(r1, c1, r1, c, board) &&
                this._isLineClear(r1, c, r2, c, board) &&
                this._isLineClear(r2, c, r2, c2, board)) {
                return [{ r: r1, c: c1 }, { r: r1, c: c }, { r: r2, c: c }, { r: r2, c: c2 }];
            }
        }

        // Scan vertical lines from c1
        for (let r = -1; r <= this.rows; r++) {
            if (r === r1) continue;
            if (r === r2 && c1 === c2) continue;
            if (this._isValidCorner(r, c1, board) &&
                this._isValidCorner(r, c2, board) &&
                this._isLineClear(r1, c1, r, c1, board) &&
                this._isLineClear(r, c1, r, c2, board) &&
                this._isLineClear(r, c2, r2, c2, board)) {
                return [{ r: r1, c: c1 }, { r: r, c: c1 }, { r: r, c: c2 }, { r: r2, c: c2 }];
            }
        }

        return null;
    }

    /**
     * Check if a cell is valid as a corner point
     * Corner must be empty (or outside board)
     */
    _isValidCorner(r, c, board) {
        if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return true; // Outside = valid
        return board[r][c] === 0;
    }

    /**
     * Check if a line between two points is clear
     * Supports horizontal, vertical, and out-of-bounds paths
     */
    _isLineClear(r1, c1, r2, c2, board) {
        if (r1 !== r2 && c1 !== c2) return false; // Not a straight line

        if (r1 === r2) {
            // Horizontal line
            const minC = Math.min(c1, c2);
            const maxC = Math.max(c1, c2);
            for (let c = minC + 1; c < maxC; c++) {
                if (c >= 0 && c < this.cols && r1 >= 0 && r1 < this.rows) {
                    if (board[r1][c] !== 0) return false;
                }
            }
        } else {
            // Vertical line
            const minR = Math.min(r1, r2);
            const maxR = Math.max(r1, r2);
            for (let r = minR + 1; r < maxR; r++) {
                if (r >= 0 && r < this.rows && c1 >= 0 && c1 < this.cols) {
                    if (board[r][c1] !== 0) return false;
                }
            }
        }
        return true;
    }

    /**
     * Check if any valid pair exists on the board
     */
    hasValidPairs(board) {
        const tiles = [];
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (board[r][c] !== 0) {
                    tiles.push({ r, c, type: board[r][c] });
                }
            }
        }

        for (let i = 0; i < tiles.length; i++) {
            for (let j = i + 1; j < tiles.length; j++) {
                if (tiles[i].type === tiles[j].type) {
                    if (this.findPath(tiles[i].r, tiles[i].c, tiles[j].r, tiles[j].c, board)) {
                        return { t1: tiles[i], t2: tiles[j] };
                    }
                }
            }
        }
        return null;
    }
}
