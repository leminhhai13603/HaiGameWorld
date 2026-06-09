/**
 * Pikachu Classic - Board Manager
 * 16x9 grid, pair generation, tile management
 */
class Board {
    constructor(cols = 16, rows = 9) {
        this.cols = cols;
        this.rows = rows;
        this.grid = []; // 2D array of tile type IDs (0 = empty)
        for (let r = 0; r < rows; r++) {
            this.grid[r] = new Array(cols).fill(0);
        }
        this.pathfinder = new Pathfinder(cols, rows);
        this.tileTypes = 36; // Number of unique tile types
    }

    /**
     * Generate a new board filled with pairs
     */
    generate(tileVariety = null) {
        const variety = tileVariety || Math.min(20, this.tileTypes);
        const totalCells = this.cols * this.rows;
        const pairCount = Math.floor(totalCells / 2);

        // Create pairs
        let tiles = [];
        for (let i = 0; i < pairCount; i++) {
            const type = 1 + Math.floor(Math.random() * variety);
            tiles.push(type, type);
        }

        // Shuffle
        for (let i = tiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
        }

        // Fill grid
        this.grid = [];
        let idx = 0;
        for (let r = 0; r < this.rows; r++) {
            this.grid[r] = [];
            for (let c = 0; c < this.cols; c++) {
                this.grid[r][c] = idx < tiles.length ? tiles[idx++] : 0;
            }
        }

        // Ensure at least one valid pair exists
        if (!this.pathfinder.hasValidPairs(this.grid)) {
            this.shuffle();
        }
    }

    /**
     * Generate board with holes (for levels 16-20)
     */
    generateWithHoles(holes, tileVariety = null) {
        this.generate(tileVariety);
        for (const h of holes) {
            if (h.r >= 0 && h.r < this.rows && h.c >= 0 && h.c < this.cols) {
                this.grid[h.r][h.c] = 0;
            }
        }
        // Ensure even number of remaining tiles (keep pairs balanced)
        let remaining = 0;
        for (let r = 0; r < this.rows; r++)
            for (let c = 0; c < this.cols; c++)
                if (this.grid[r][c] !== 0) remaining++;
        if (remaining % 2 !== 0) {
            // Remove one more tile to make count even
            outer:
            for (let r = 0; r < this.rows; r++)
                for (let c = 0; c < this.cols; c++)
                    if (this.grid[r][c] !== 0) {
                        this.grid[r][c] = 0;
                        break outer;
                    }
        }
    }

    /**
     * Get tile type at position
     */
    getTile(r, c) {
        if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return 0;
        return this.grid[r][c];
    }

    /**
     * Remove tile at position
     */
    removeTile(r, c) {
        this.grid[r][c] = 0;
    }

    /**
     * Check if tile exists at position
     */
    hasTile(r, c) {
        return this.grid[r][c] !== 0;
    }

    /**
     * Try to match two tiles
     * Returns path if valid, null otherwise
     */
    tryMatch(r1, c1, r2, c2) {
        return this.pathfinder.findPath(r1, c1, r2, c2, this.grid);
    }

    /**
     * Find a hint (valid pair)
     */
    findHint() {
        return this.pathfinder.hasValidPairs(this.grid);
    }

    /**
     * Check if board is empty (all tiles removed)
     */
    isEmpty() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c] !== 0) return false;
            }
        }
        return true;
    }

    /**
     * Check if any valid pairs exist
     */
    hasValidPairs() {
        return this.pathfinder.hasValidPairs(this.grid) !== null;
    }

    /**
     * Get count of remaining tiles
     */
    getRemainingCount() {
        let count = 0;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c] !== 0) count++;
            }
        }
        return count;
    }

    /**
     * Shuffle remaining tiles (preserving pairs)
     */
    shuffle() {
        const remaining = [];
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c] !== 0) {
                    remaining.push(this.grid[r][c]);
                }
            }
        }

        // Shuffle
        for (let i = remaining.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
        }

        // Refill
        let idx = 0;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c] !== 0) {
                    this.grid[r][c] = idx < remaining.length ? remaining[idx++] : 0;
                }
            }
        }

        // Ensure valid pairs exist
        if (!this.hasValidPairs()) {
            // Re-shuffle up to 100 times
            for (let attempt = 0; attempt < 100; attempt++) {
                for (let i = remaining.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
                }
                idx = 0;
                for (let r = 0; r < this.rows; r++) {
                    for (let c = 0; c < this.cols; c++) {
                        if (this.grid[r][c] !== 0) {
                            this.grid[r][c] = remaining[idx++];
                        }
                    }
                }
                if (this.hasValidPairs()) break;
            }
        }
    }

    /**
     * Shift tiles in a direction (for level mechanics)
     * dir: 'left', 'right', 'up', 'down'
     */
    shift(dir) {
        switch (dir) {
            case 'left':
                for (let r = 0; r < this.rows; r++) {
                    const row = this.grid[r].filter(v => v !== 0);
                    while (row.length < this.cols) row.push(0);
                    this.grid[r] = row;
                }
                break;
            case 'right':
                for (let r = 0; r < this.rows; r++) {
                    const row = this.grid[r].filter(v => v !== 0);
                    while (row.length < this.cols) row.unshift(0);
                    this.grid[r] = row;
                }
                break;
            case 'up':
                for (let c = 0; c < this.cols; c++) {
                    const col = [];
                    for (let r = 0; r < this.rows; r++) col.push(this.grid[r][c]);
                    const filled = col.filter(v => v !== 0);
                    while (filled.length < this.rows) filled.push(0);
                    for (let r = 0; r < this.rows; r++) this.grid[r][c] = filled[r];
                }
                break;
            case 'down':
                for (let c = 0; c < this.cols; c++) {
                    const col = [];
                    for (let r = 0; r < this.rows; r++) col.push(this.grid[r][c]);
                    const filled = col.filter(v => v !== 0);
                    while (filled.length < this.rows) filled.unshift(0);
                    for (let r = 0; r < this.rows; r++) this.grid[r][c] = filled[r];
                }
                break;
            case 'inward': {
                // Each row: left half slides right toward center, right half slides left toward center
                const mid = Math.floor(this.cols / 2);
                for (let r = 0; r < this.rows; r++) {
                    const left = this.grid[r].slice(0, mid).filter(v => v !== 0);
                    while (left.length < mid) left.unshift(0);
                    const right = this.grid[r].slice(mid).filter(v => v !== 0);
                    while (right.length < this.cols - mid) right.push(0);
                    this.grid[r] = [...left, ...right];
                }
                break;
            }
            case 'outward': {
                // Each row: left half slides left toward edge, right half slides right toward edge
                const mid = Math.floor(this.cols / 2);
                for (let r = 0; r < this.rows; r++) {
                    const left = this.grid[r].slice(0, mid).filter(v => v !== 0);
                    while (left.length < mid) left.push(0);
                    const right = this.grid[r].slice(mid).filter(v => v !== 0);
                    while (right.length < this.cols - mid) right.unshift(0);
                    this.grid[r] = [...left, ...right];
                }
                break;
            }
        }

        // Ensure valid pairs after shift
        if (!this.hasValidPairs()) {
            this.shuffle();
        }
    }

    /**
     * Auto-shuffle if deadlocked
     * Returns true if shuffle was needed
     */
    checkDeadlock() {
        if (this.getRemainingCount() === 0) return false;
        if (!this.hasValidPairs()) {
            this.shuffle();
            return true;
        }
        return false;
    }
}
