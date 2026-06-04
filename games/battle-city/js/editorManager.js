/**
 * Battle City - Level Editor
 */
class EditorManager {
    constructor() {
        this.grid = [];
        this.selectedTile = TileType.BRICK;
        this.isActive = false;
        this.mapName = 'Custom Map';
        this._initEmpty();
    }

    _initEmpty() {
        this.grid = [];
        for (let r = 0; r < ROWS; r++) {
            this.grid[r] = [];
            for (let c = 0; c < COLS; c++) this.grid[r][c] = 0;
        }
    }

    activate() {
        this.isActive = true;
        this._initEmpty();
    }

    deactivate() { this.isActive = false; }

    handleClick(x, y) {
        const c = Math.floor(x / CELL);
        const r = Math.floor((y - HUD_H) / CELL);
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
            this.grid[r][c] = this.selectedTile;
        }
    }

    handleRightClick(x, y) {
        const c = Math.floor(x / CELL);
        const r = Math.floor((y - HUD_H) / CELL);
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
            this.grid[r][c] = 0;
        }
    }

    cycleTile(dir) {
        const tiles = [0, 1, 2, 3, 4, 5];
        const idx = tiles.indexOf(this.selectedTile);
        this.selectedTile = tiles[(idx + dir + tiles.length) % tiles.length];
    }

    save(name) {
        this.mapName = name || 'Custom Map';
        const data = SaveManager.load();
        if (!data.customMaps) data.customMaps = [];
        data.customMaps.push({ name: this.mapName, grid: this.grid, date: Date.now() });
        if (data.customMaps.length > 10) data.customMaps.shift();
        SaveManager.save(data);
    }

    load(index) {
        const data = SaveManager.load();
        if (data.customMaps && data.customMaps[index]) {
            this.grid = data.customMaps[index].grid;
            this.mapName = data.customMaps[index].name;
            return true;
        }
        return false;
    }

    getCustomMaps() {
        const data = SaveManager.load();
        return data.customMaps || [];
    }

    getGrid() { return this.grid; }

    draw(ctx) {
        if (!this.isActive) return;

        // Draw grid
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const tile = this.grid[r][c];
                const x = c * CELL;
                const y = r * CELL + HUD_H;
                ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, CELL, CELL);

                if (tile !== 0) {
                    const colors = { 1: '#b35900', 2: '#aaa', 3: '#2244aa', 4: '#1a6b1a', 5: '#aaddff' };
                    ctx.fillStyle = colors[tile] || '#444';
                    ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
                }
            }
        }

        // Selected tile indicator
        const tileNames = ['Empty', 'Brick', 'Steel', 'Water', 'Forest', 'Ice'];
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, CANVAS_H - 30, 300, 30);
        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Selected: ${tileNames[this.selectedTile]}  [Scroll to change]`, 10, CANVAS_H - 10);
    }
}
