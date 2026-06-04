/**
 * Battle City - Map System
 * ALL coordinates in canvas space (y includes HUD_H)
 */
class MapSystem {
    constructor() {
        this.grid = [];
        this.eagleAlive = true;
        this.shovelTimer = 0;
    }

    init(levelData) {
        this.grid = [];
        this.eagleAlive = true;
        this.shovelTimer = 0;
        for (let r = 0; r < ROWS; r++) {
            this.grid[r] = [];
            for (let c = 0; c < COLS; c++) {
                this.grid[r][c] = levelData[r] ? (levelData[r][c] || 0) : 0;
            }
        }
        // Eagle at bottom center (grid rows 24-25, cols 12-13)
        this.grid[ROWS-2][COLS/2-1] = TileType.EAGLE;
        this.grid[ROWS-2][COLS/2] = TileType.EAGLE;
        this.grid[ROWS-1][COLS/2-1] = TileType.EAGLE;
        this.grid[ROWS-1][COLS/2] = TileType.EAGLE;
        this._placeEagleWalls(TileType.BRICK);
    }

    _placeEagleWalls(type) {
        const er = ROWS - 2, ec = COLS / 2 - 1;
        for (let dr = -1; dr <= 2; dr++) {
            for (let dc = -1; dc <= 2; dc++) {
                const r = er + dr, c = ec + dc;
                if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
                    if (!(r >= er && r <= er+1 && c >= ec && c <= ec+1)) {
                        if (this.grid[r][c] === 0 || this.grid[r][c] === TileType.BRICK || this.grid[r][c] === TileType.BASE_WALL) {
                            this.grid[r][c] = type;
                        }
                    }
                }
            }
        }
    }

    activateShovel() {
        this._placeEagleWalls(TileType.STEEL);
        this.shovelTimer = 600;
    }

    update() {
        if (this.shovelTimer > 0) {
            this.shovelTimer--;
            if (this.shovelTimer <= 0) this._placeEagleWalls(TileType.BRICK);
        }
    }

    // Convert canvas coords to grid
    toGrid(canvasX, canvasY) {
        return { r: Math.floor((canvasY - HUD_H) / CELL), c: Math.floor(canvasX / CELL) };
    }

    getTile(r, c) {
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return -1;
        return this.grid[r][c];
    }

    canPass(r, c) {
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false;
        const t = this.grid[r][c];
        return t === TileType.EMPTY || t === TileType.FOREST || t === TileType.ICE;
    }

    // Check if a rect (canvas coords) can move to position
    canMoveRect(x, y, w, h) {
        // Check all 4 corners
        const corners = [
            this.toGrid(x, y),
            this.toGrid(x + w - 1, y),
            this.toGrid(x, y + h - 1),
            this.toGrid(x + w - 1, y + h - 1)
        ];
        for (const g of corners) {
            if (!this.canPass(g.r, g.c)) return false;
        }
        return true;
    }

    // Bullet hits tile at canvas coords. Returns { hit, destroyed, eagleHit }
    bulletHitAt(canvasX, canvasY, strong) {
        const g = this.toGrid(canvasX, canvasY);
        return this.bulletHitGrid(g.r, g.c, strong);
    }

    bulletHitGrid(r, c, strong) {
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return { hit: true, destroyed: false, eagleHit: false };
        const tile = this.grid[r][c];

        if (tile === TileType.BRICK || tile === TileType.BASE_WALL) {
            this.grid[r][c] = TileType.EMPTY;
            return { hit: true, destroyed: true, eagleHit: false };
        }
        if (tile === TileType.STEEL) {
            if (strong) { this.grid[r][c] = TileType.EMPTY; return { hit: true, destroyed: true, eagleHit: false }; }
            return { hit: true, destroyed: false, eagleHit: false };
        }
        if (tile === TileType.EAGLE) {
            this.grid[r][c] = TileType.EAGLE_DEAD;
            this.eagleAlive = false;
            return { hit: true, destroyed: true, eagleHit: true };
        }
        if (tile === TileType.WATER || tile === TileType.FOREST || tile === TileType.ICE) return { hit: false };
        return { hit: false };
    }

    draw(ctx) {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const tile = this.grid[r][c];
                if (tile === 0) continue;
                const x = c * CELL;
                const y = r * CELL + HUD_H;

                switch (tile) {
                    case TileType.BRICK:
                    case TileType.BASE_WALL:
                        ctx.fillStyle = '#b35900';
                        ctx.fillRect(x, y, CELL, CELL);
                        ctx.fillStyle = '#8a4400';
                        ctx.fillRect(x, y, CELL/2-1, CELL/2-1);
                        ctx.fillRect(x+CELL/2, y+CELL/2, CELL/2, CELL/2);
                        break;
                    case TileType.STEEL:
                        ctx.fillStyle = '#aaa';
                        ctx.fillRect(x, y, CELL, CELL);
                        ctx.fillStyle = '#ddd';
                        ctx.fillRect(x+2, y+2, CELL-4, CELL-4);
                        ctx.strokeStyle = '#666'; ctx.lineWidth = 1;
                        ctx.strokeRect(x, y, CELL, CELL);
                        break;
                    case TileType.WATER:
                        ctx.fillStyle = '#2244aa';
                        ctx.fillRect(x, y, CELL, CELL);
                        ctx.fillStyle = '#3366cc';
                        for (let i = 0; i < 3; i++) ctx.fillRect(x+4, y+4+i*10, CELL-8, 3);
                        break;
                    case TileType.FOREST:
                        ctx.fillStyle = '#1a6b1a';
                        ctx.fillRect(x, y, CELL, CELL);
                        ctx.fillStyle = '#228b22';
                        ctx.fillRect(x+2, y+2, 8, 8);
                        ctx.fillRect(x+14, y+8, 8, 8);
                        ctx.fillRect(x+6, y+16, 8, 8);
                        break;
                    case TileType.ICE:
                        ctx.fillStyle = '#aaddff';
                        ctx.fillRect(x, y, CELL, CELL);
                        ctx.strokeStyle = '#88bbdd'; ctx.lineWidth = 1;
                        ctx.beginPath(); ctx.moveTo(x, y+CELL/2); ctx.lineTo(x+CELL, y+CELL/3); ctx.stroke();
                        break;
                    case TileType.EAGLE:
                        ctx.fillStyle = '#ffcc00';
                        ctx.fillRect(x, y, CELL, CELL);
                        ctx.fillStyle = '#000';
                        ctx.font = `${CELL-4}px sans-serif`;
                        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                        ctx.fillText('🦅', x+CELL/2, y+CELL/2);
                        break;
                    case TileType.EAGLE_DEAD:
                        ctx.fillStyle = '#444';
                        ctx.fillRect(x, y, CELL, CELL);
                        ctx.fillStyle = '#ff0000';
                        ctx.font = `${CELL-4}px sans-serif`;
                        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                        ctx.fillText('💥', x+CELL/2, y+CELL/2);
                        break;
                }
            }
        }
    }

    drawForest(ctx) {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (this.grid[r][c] === TileType.FOREST) {
                    const x = c * CELL, y = r * CELL + HUD_H;
                    ctx.fillStyle = 'rgba(26,107,26,0.7)';
                    ctx.fillRect(x, y, CELL, CELL);
                    ctx.fillStyle = 'rgba(34,139,34,0.6)';
                    ctx.fillRect(x+2, y+2, 8, 8);
                    ctx.fillRect(x+14, y+8, 8, 8);
                    ctx.fillRect(x+6, y+16, 8, 8);
                }
            }
        }
    }
}
