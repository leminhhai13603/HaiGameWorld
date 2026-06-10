/**
 * Factory Empire - Main Game
 */
class FactoryEmpire {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = W; this.canvas.height = H;
        this.state = GS.PLAYING;
        this.lastTime = 0;
        this._rafId = null;

        // Camera
        this.camX = 0; this.camY = 0;
        this.zoom = 1;
        this.dragging = false;
        this.dragStart = { x:0, y:0 };
        this.dragCamStart = { x:0, y:0 };

        // Selection
        this.selectedBuilding = null; // building type to place
        this.selectedRecipe = {}; // recipe per building
        this.hoveredCell = null;
        this.selectedPlaced = null; // placed building clicked

        // UI
        this.activePanel = 'build'; // build, info, research, stats
        this.notifications = [];
        this.achievements = [];

        // Game data
        this.grid = []; // 2D array: { type, deposit, building, item }
        this.buildings = []; // placed buildings
        this.items = []; // moving items on conveyors
        this.particles = [];

        // Economy
        this.money = 500;
        this.income = 0;
        this.incomeHistory = [];

        // Research
        this.research = {};
        this.researchProgress = {};
        this.researchPoints = 0;
        this.activeResearch = null;

        // Stats
        this.stats = { totalEarned:0, itemsProduced:0, itemsSold:0, buildingsBuilt:0, playTime:0 };

        // Power
        this.powerGen = 0;
        this.powerUse = 0;

        // Auto-save
        this.autoSaveTimer = 30;

        this._init();
    }

    _init() {
        this._generateMap();
        this._loadSave();
        this._setupInput();
        window.addEventListener('beforeunload', () => { AudioManager.close(); this._saveGame(); });
        this._gameLoop(performance.now());
    }

    _generateMap() {
        this.grid = [];
        for (let y = 0; y < GRID_H; y++) {
            this.grid[y] = [];
            for (let x = 0; x < GRID_W; x++) {
                this.grid[y][x] = { type:'empty', deposit:null, building:null };
            }
        }
        // Place resource deposits
        const deposits = [
            { type:'ironOre',   count:8,  color:'#8B7355' },
            { type:'copperOre', count:6,  color:'#B87333' },
            { type:'coal',      count:7,  color:'#444' },
            { type:'stone',     count:6,  color:'#999' },
        ];
        for (const d of deposits) {
            for (let i = 0; i < d.count; i++) {
                let px, py, attempts = 0;
                do {
                    px = 2 + Math.floor(Math.random() * (GRID_W - 4));
                    py = 2 + Math.floor(Math.random() * (GRID_H - 4));
                    attempts++;
                } while (attempts < 100 && (this.grid[py][px].deposit || this._hasNearbyDeposit(px, py, 2)));
                this.grid[py][px].deposit = { type: d.type, amount: 500 + Math.floor(Math.random() * 500), color: d.color };
                // Cluster: add 1-3 more around
                const cluster = 1 + Math.floor(Math.random() * 3);
                for (let c = 0; c < cluster; c++) {
                    const nx = px + Math.floor(Math.random()*3) - 1;
                    const ny = py + Math.floor(Math.random()*3) - 1;
                    if (nx >= 0 && nx < GRID_W && ny >= 0 && ny < GRID_H && !this.grid[ny][nx].deposit) {
                        this.grid[ny][nx].deposit = { type: d.type, amount: 300 + Math.floor(Math.random() * 300), color: d.color };
                    }
                }
            }
        }
    }

    _hasNearbyDeposit(x, y, r) {
        for (let dy = -r; dy <= r; dy++)
            for (let dx = -r; dx <= r; dx++)
                if (x+dx >= 0 && x+dx < GRID_W && y+dy >= 0 && y+dy < GRID_H && this.grid[y+dy][x+dx].deposit)
                    return true;
        return false;
    }

    _loadSave() {
        const save = SaveManager.load();
        this.money = save.money || 500;
        this.stats = save.stats || this.stats;
        this.research = save.research || {};
        if (save.buildings && save.buildings.length > 0) {
            for (const b of save.buildings) {
                this._placeBuilding(b.type, b.x, b.y, b.dir, b.recipe, true);
            }
        }
    }

    _saveGame() {
        const save = SaveManager.load();
        save.money = this.money;
        save.stats = this.stats;
        save.research = this.research;
        save.buildings = this.buildings.map(b => ({
            type: b.type, x: b.x, y: b.y, dir: b.dir, recipe: b.recipe
        }));
        SaveManager.save(save);
    }

    _setupInput() {
        // Mouse
        this.canvas.addEventListener('mousedown', e => {
            const r = this.canvas.getBoundingClientRect();
            const mx = (e.clientX - r.left) * (W / r.width);
            const my = (e.clientY - r.top) * (H / r.height);
            if (my < MAP_OFFSET_Y) { this._handleUIClick(mx, my); return; }
            if (this.selectedBuilding) {
                const gx = Math.floor((mx / this.zoom + this.camX - MAP_OFFSET_X) / CELL);
                const gy = Math.floor((my / this.zoom + this.camY - MAP_OFFSET_Y) / CELL);
                this._tryPlaceBuilding(gx, gy);
            } else {
                this.dragging = true;
                this.dragStart = { x: mx, y: my };
                this.dragCamStart = { x: this.camX, y: this.camY };
            }
        });
        this.canvas.addEventListener('mousemove', e => {
            const r = this.canvas.getBoundingClientRect();
            const mx = (e.clientX - r.left) * (W / r.width);
            const my = (e.clientY - r.top) * (H / r.height);
            if (this.dragging) {
                this.camX = this.dragCamStart.x - (mx - this.dragStart.x) / this.zoom;
                this.camY = this.dragCamStart.y - (my - this.dragStart.y) / this.zoom;
                this._clampCam();
            }
            if (my >= MAP_OFFSET_Y) {
                const gx = Math.floor((mx / this.zoom + this.camX - MAP_OFFSET_X) / CELL);
                const gy = Math.floor((my / this.zoom + this.camY - MAP_OFFSET_Y) / CELL);
                this.hoveredCell = (gx >= 0 && gx < GRID_W && gy >= 0 && gy < GRID_H) ? { x:gx, y:gy } : null;
            } else {
                this.hoveredCell = null;
            }
        });
        this.canvas.addEventListener('mouseup', () => { this.dragging = false; });
        this.canvas.addEventListener('wheel', e => {
            e.preventDefault();
            const old = this.zoom;
            this.zoom = Math.max(0.5, Math.min(2, this.zoom + (e.deltaY < 0 ? 0.1 : -0.1)));
            this._clampCam();
        }, { passive: false });

        // Touch
        let touchStart = null;
        this.canvas.addEventListener('touchstart', e => {
            e.preventDefault();
            const t = e.touches[0];
            const r = this.canvas.getBoundingClientRect();
            const mx = (t.clientX - r.left) * (W / r.width);
            const my = (t.clientY - r.top) * (H / r.height);
            if (my < MAP_OFFSET_Y) { this._handleUIClick(mx, my); return; }
            touchStart = { x: mx, y: my, camX: this.camX, camY: this.camY };
            if (this.selectedBuilding) {
                const gx = Math.floor((mx / this.zoom + this.camX - MAP_OFFSET_X) / CELL);
                const gy = Math.floor((my / this.zoom + this.camY - MAP_OFFSET_Y) / CELL);
                this._tryPlaceBuilding(gx, gy);
            }
        }, { passive: false });
        this.canvas.addEventListener('touchmove', e => {
            e.preventDefault();
            if (!touchStart) return;
            const t = e.touches[0];
            const r = this.canvas.getBoundingClientRect();
            const mx = (t.clientX - r.left) * (W / r.width);
            const my = (t.clientY - r.top) * (H / r.height);
            this.camX = touchStart.camX - (mx - touchStart.x) / this.zoom;
            this.camY = touchStart.camY - (my - touchStart.y) / this.zoom;
            this._clampCam();
        }, { passive: false });
        this.canvas.addEventListener('touchend', () => { touchStart = null; });

        // Keyboard
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') this.selectedBuilding = null;
            if (e.key >= '1' && e.key <= '9') {
                const idx = parseInt(e.key) - 1;
                if (idx < BUILDING_ORDER.length) this.selectedBuilding = BUILDING_ORDER[idx];
            }
            if (e.key === '0') this.selectedBuilding = null;
            if (e.key === 'r' || e.key === 'R') this.activePanel = this.activePanel === 'research' ? 'build' : 'research';
        });
    }

    _clampCam() {
        const maxX = GRID_W * CELL - W / this.zoom;
        const maxY = GRID_H * CELL - H / this.zoom;
        this.camX = Math.max(0, Math.min(maxX, this.camX));
        this.camY = Math.max(0, Math.min(maxY, this.camY));
    }

    _handleUIClick(mx, my) {
        // Top bar buttons
        const btnW = 80, btnH = 30, btnY = 15;
        const panels = ['build','research','stats','settings'];
        for (let i = 0; i < panels.length; i++) {
            const bx = W - (panels.length - i) * (btnW + 5);
            if (mx >= bx && mx <= bx + btnW && my >= btnY && my <= btnY + btnH) {
                this.activePanel = panels[i];
                AudioManager.play('click');
                return;
            }
        }
        // Build menu items
        if (this.activePanel === 'build' && mx < 200) {
            const itemH = 45;
            for (let i = 0; i < BUILDING_ORDER.length; i++) {
                const by = MAP_OFFSET_Y + 5 + i * itemH;
                if (mx >= 5 && mx <= 195 && my >= by && my <= by + itemH - 2) {
                    const bKey = BUILDING_ORDER[i];
                    const def = BUILDING_DEFS[bKey];
                    if (this._isBuildingUnlocked(bKey)) {
                        this.selectedBuilding = this.selectedBuilding === bKey ? null : bKey;
                        AudioManager.play('click');
                    }
                    return;
                }
            }
        }
        // Research panel
        if (this.activePanel === 'research') {
            const itemH = 50;
            for (let i = 0; i < RESEARCH_ORDER.length; i++) {
                const by = MAP_OFFSET_Y + 5 + i * itemH;
                if (mx >= 5 && mx <= 250 && my >= by && my <= by + itemH - 2) {
                    this._startResearch(RESEARCH_ORDER[i]);
                    return;
                }
            }
        }
    }

    _isBuildingUnlocked(key) {
        if (key === 'factory') return this.research.advancedCraft;
        if (key === 'powerCoal' || key === 'powerSolar') return this.research.powerGrid;
        if (key === 'researchLab') return true;
        return true;
    }

    _tryPlaceBuilding(gx, gy) {
        if (gx < 0 || gx >= GRID_W || gy < 0 || gy >= GRID_H) return;
        if (!this.selectedBuilding) return;
        const def = BUILDING_DEFS[this.selectedBuilding];
        const cost = def.cost;
        if (this.money < cost) { this._notify('Not enough money!', '#F44336'); AudioManager.play('error'); return; }
        // Check space
        for (let dy = 0; dy < def.size; dy++) {
            for (let dx = 0; dx < def.size; dx++) {
                const nx = gx + dx, ny = gy + dy;
                if (nx >= GRID_W || ny >= GRID_H) { this._notify('Out of bounds!', '#F44336'); return; }
                if (this.grid[ny][nx].building) { this._notify('Space occupied!', '#F44336'); AudioManager.play('error'); return; }
            }
        }
        // Miner must be on deposit
        if (this.selectedBuilding === 'miner') {
            if (!this.grid[gy][gx].deposit) { this._notify('Miner needs ore deposit!', '#F44336'); AudioManager.play('error'); return; }
        }
        this.money -= cost;
        this._placeBuilding(this.selectedBuilding, gx, gy, DIR.RIGHT, null, false);
        this.stats.buildingsBuilt++;
        AudioManager.play('build');
    }

    _placeBuilding(type, x, y, dir, recipe, fromSave) {
        const def = BUILDING_DEFS[type];
        const b = {
            type, x, y, dir: dir || DIR.RIGHT, size: def.size,
            recipe: recipe || null,
            progress: 0,
            storage: {},
            power: def.powerGen || 0,
            cooldown: 0,
            id: Date.now() + Math.random()
        };
        // Set default recipe for processing buildings
        if (!b.recipe && def.recipes && def.recipes.length > 0) {
            b.recipe = def.recipes[0];
        }
        this.buildings.push(b);
        for (let dy = 0; dy < def.size; dy++) {
            for (let dx = 0; dx < def.size; dx++) {
                this.grid[y + dy][x + dx].building = b;
            }
        }
        if (!fromSave && def.cost) {
            // Already deducted in _tryPlaceBuilding
        }
    }

    _startResearch(key) {
        if (this.research[key]) { this._notify('Already researched!', '#FFD700'); return; }
        const def = RESEARCH_DEFS[key];
        for (const req of def.requires) {
            if (!this.research[req]) { this._notify('Requires: ' + RESEARCH_DEFS[req].name, '#F44336'); AudioManager.play('error'); return; }
        }
        this.activeResearch = key;
        this.researchProgress[key] = this.researchProgress[key] || 0;
        AudioManager.play('research');
    }

    _notify(text, color) {
        this.notifications.push({ text, color: color || '#FFF', timer: 3 });
    }

    // ─── Game Loop ───
    _gameLoop(now) {
        this._rafId = requestAnimationFrame(t => this._gameLoop(t));
        const elapsed = now - this.lastTime;
        if (elapsed < 33) return; // ~30fps for performance
        this.lastTime = now - (elapsed % 33);
        const dt = Math.min(elapsed / 1000, 0.1);
        try { this._update(dt); this._render(); } catch(e) { console.error('Factory error:', e); }
    }

    destroy() {
        if (this._rafId) cancelAnimationFrame(this._rafId);
        this._saveGame();
        AudioManager.close();
    }

    _update(dt) {
        if (this.state !== GS.PLAYING) return;
        this.stats.playTime += dt;

        // Auto-save
        this.autoSaveTimer -= dt;
        if (this.autoSaveTimer <= 0) { this.autoSaveTimer = 30; this._saveGame(); }

        // Update buildings
        this._updateBuildings(dt);
        // Update items on conveyors
        this._updateItems(dt);
        // Update research
        this._updateResearch(dt);
        // Update power
        this._updatePower();
        // Update particles
        this._updateParticles(dt);
        // Update notifications
        for (let i = this.notifications.length - 1; i >= 0; i--) {
            this.notifications[i].timer -= dt;
            if (this.notifications[i].timer <= 0) this.notifications.splice(i, 1);
        }
        // Calculate income
        this._calcIncome(dt);
    }

    _updateBuildings(dt) {
        const speedMul = this.research.automation ? 1.25 : 1;
        for (const b of this.buildings) {
            const def = BUILDING_DEFS[b.type];
            if (b.type === 'miner') {
                const minerSpeed = (this.research.fastMiner ? 1.5 : 1) * speedMul;
                b.progress += dt * def.speed * minerSpeed;
                if (b.progress >= 1) {
                    b.progress = 0;
                    const cell = this.grid[b.y][b.x];
                    if (cell.deposit && cell.deposit.amount > 0) {
                        const item = cell.deposit.type;
                        cell.deposit.amount--;
                        this._spawnItem(b.x, b.y, item, b);
                    }
                }
            }
            if (def.recipes && b.recipe && RECIPES[b.recipe]) {
                const recipe = RECIPES[b.recipe];
                // Check if we have inputs
                let canProcess = true;
                for (const [inp, count] of Object.entries(recipe.inputs)) {
                    if ((b.storage[inp] || 0) < count) { canProcess = false; break; }
                }
                if (canProcess) {
                    const smeltEff = (b.type === 'smelter' && this.research.efficientSmelt) ? 0.75 : 1;
                    b.progress += dt * def.speed * speedMul * (1 / smeltEff);
                    if (b.progress >= recipe.time) {
                        b.progress = 0;
                        // Consume inputs
                        for (const [inp, count] of Object.entries(recipe.inputs)) {
                            b.storage[inp] -= count;
                            if (b.storage[inp] <= 0) delete b.storage[inp];
                        }
                        // Produce outputs
                        for (const [out, count] of Object.entries(recipe.outputs)) {
                            for (let i = 0; i < count; i++) {
                                this._spawnItem(b.x, b.y, out, b);
                            }
                            this.stats.itemsProduced += count;
                        }
                    }
                }
            }
            if (b.type === 'market') {
                // Sell items in storage
                const sellRate = (this.research.autoSell ? 2 : 1) * def.sellRate;
                for (const [item, count] of Object.entries(b.storage)) {
                    if (count > 0 && ALL_ITEMS[item]) {
                        const sellCount = Math.min(count, Math.ceil(dt * sellRate));
                        const value = ALL_ITEMS[item].value * sellCount;
                        this.money += value;
                        this.stats.totalEarned += value;
                        this.stats.itemsSold += sellCount;
                        b.storage[item] -= sellCount;
                        if (b.storage[item] <= 0) delete b.storage[item];
                        AudioManager.play('sell');
                    }
                }
            }
            if (b.type === 'warehouse') {
                // Capacity check
                const capMul = this.research.megaStorage ? 3 : this.research.storageUp ? 2 : 1;
                const cap = def.capacity * capMul;
                let total = 0;
                for (const c of Object.values(b.storage)) total += c;
                if (total > cap) {
                    // Remove excess
                    for (const [item, count] of Object.entries(b.storage)) {
                        if (total <= cap) break;
                        const remove = Math.min(count, total - cap);
                        b.storage[item] -= remove;
                        total -= remove;
                        if (b.storage[item] <= 0) delete b.storage[item];
                    }
                }
            }
            // Cooldown
            if (b.cooldown > 0) b.cooldown -= dt;
        }
    }

    _spawnItem(gx, gy, type, source) {
        const item = {
            type, x: gx * CELL + CELL/2, y: gy * CELL + CELL/2 + MAP_OFFSET_Y,
            vx: 0, vy: 0, speed: 60 * (this.research.fastConveyor ? 1.5 : 1),
            source: source, target: null, onConveyor: false, life: 30
        };
        this.items.push(item);
    }

    _updateItems(dt) {
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.life -= dt;
            if (item.life <= 0) { this.items.splice(i, 1); continue; }

            if (!item.onConveyor) {
                // Find nearby conveyor or building to enter
                const gx = Math.floor(item.x / CELL);
                const gy = Math.floor((item.y - MAP_OFFSET_Y) / CELL);
                let entered = false;
                // Try to enter adjacent building
                for (const b of this.buildings) {
                    if (b === item.source) continue;
                    const bs = BUILDING_DEFS[b.type].size;
                    if (gx >= b.x && gx < b.x + bs && gy >= b.y && gy < b.y + bs) {
                        if (b.type === 'conveyor') {
                            item.onConveyor = true;
                            item.conveyor = b;
                            entered = true;
                            break;
                        } else if (b.type !== 'miner') {
                            // Enter building storage
                            b.storage[item.type] = (b.storage[item.type] || 0) + 1;
                            this.items.splice(i, 1);
                            entered = true;
                            break;
                        }
                    }
                }
                if (!entered) {
                    // Move toward nearest conveyor
                    const nearest = this._findNearestConveyor(gx, gy);
                    if (nearest) {
                        const tx = nearest.x * CELL + CELL/2;
                        const ty = nearest.y * CELL + CELL/2 + MAP_OFFSET_Y;
                        const dx = tx - item.x, dy = ty - item.y;
                        const dist = Math.sqrt(dx*dx + dy*dy);
                        if (dist > 2) {
                            item.vx = (dx / dist) * item.speed;
                            item.vy = (dy / dist) * item.speed;
                        }
                    }
                    item.x += item.vx * dt;
                    item.y += item.vy * dt;
                }
            } else {
                // On conveyor - move in conveyor direction
                const conv = item.conveyor;
                if (!conv) { item.onConveyor = false; continue; }
                const tx = conv.x * CELL + CELL/2;
                const ty = conv.y * CELL + CELL/2 + MAP_OFFSET_Y;
                const dx = DIR_DX[conv.dir] * item.speed * dt;
                const dy = DIR_DY[conv.dir] * item.speed * dt;
                item.x += dx;
                item.y += dy;
                // Check if reached end of conveyor
                const distToCenter = Math.abs(item.x - tx) + Math.abs(item.y - ty);
                if (distToCenter > CELL) {
                    item.onConveyor = false;
                    item.conveyor = null;
                    // Try to enter next building
                    const ngx = Math.floor(item.x / CELL);
                    const ngy = Math.floor((item.y - MAP_OFFSET_Y) / CELL);
                    for (const b of this.buildings) {
                        const bs = BUILDING_DEFS[b.type].size;
                        if (ngx >= b.x && ngx < b.x + bs && ngy >= b.y && ngy < b.y + bs && b.type !== 'conveyor') {
                            b.storage[item.type] = (b.storage[item.type] || 0) + 1;
                            this.items.splice(i, 1);
                            break;
                        }
                    }
                }
            }
            // Clamp to map
            item.x = Math.max(0, Math.min(GRID_W * CELL, item.x));
            item.y = Math.max(MAP_OFFSET_Y, Math.min(GRID_H * CELL + MAP_OFFSET_Y, item.y));
        }
        // Limit items for performance
        if (this.items.length > 500) {
            this.items.splice(0, this.items.length - 500);
        }
    }

    _findNearestConveyor(gx, gy) {
        for (let r = 1; r <= 3; r++) {
            for (let dy = -r; dy <= r; dy++) {
                for (let dx = -r; dx <= r; dx++) {
                    const nx = gx + dx, ny = gy + dy;
                    if (nx >= 0 && nx < GRID_W && ny >= 0 && ny < GRID_H) {
                        const cell = this.grid[ny][nx];
                        if (cell.building && cell.building.type === 'conveyor') return cell.building;
                    }
                }
            }
        }
        return null;
    }

    _updateResearch(dt) {
        if (!this.activeResearch) return;
        const def = RESEARCH_DEFS[this.activeResearch];
        const rate = this.research.fastResearch ? 2 : 1;
        this.researchProgress[this.activeResearch] = (this.researchProgress[this.activeResearch] || 0) + dt * rate;
        this.researchPoints = this.researchProgress[this.activeResearch];
        if (this.researchProgress[this.activeResearch] >= def.time) {
            this.research[this.activeResearch] = true;
            this._notify('Researched: ' + def.name, '#4CAF50');
            AudioManager.play('research');
            this.activeResearch = null;
        }
    }

    _updatePower() {
        this.powerGen = 0;
        this.powerUse = 0;
        for (const b of this.buildings) {
            if (b.power > 0) this.powerGen += b.power;
        }
    }

    _updateParticles(dt) {
        let write = 0;
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            p.x += p.vx * dt; p.y += p.vy * dt;
            p.vy += 50 * dt;
            p.life -= dt;
            if (p.life > 0) this.particles[write++] = p;
        }
        this.particles.length = write;
    }

    _calcIncome(dt) {
        // Track income per second
        this.incomeHistory.push(this.stats.totalEarned);
        if (this.incomeHistory.length > 60) this.incomeHistory.shift();
        if (this.incomeHistory.length > 1) {
            this.income = (this.incomeHistory[this.incomeHistory.length-1] - this.incomeHistory[0]) / (this.incomeHistory.length * dt);
        }
    }

    // ─── Render ───
    _render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, W, H);

        ctx.save();
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.camX, -this.camY + MAP_OFFSET_Y);

        // Grid
        this._renderGrid(ctx);
        // Buildings
        this._renderBuildings(ctx);
        // Items
        this._renderItems(ctx);
        // Hover
        this._renderHover(ctx);
        // Particles
        this._renderParticles(ctx);

        ctx.restore();

        // UI overlay
        this._renderUI(ctx);
    }

    _renderGrid(ctx) {
        const sx = Math.max(0, Math.floor(this.camX / CELL));
        const sy = Math.max(0, Math.floor(this.camY / CELL));
        const ex = Math.min(GRID_W, Math.ceil((this.camX + W / this.zoom) / CELL));
        const ey = Math.min(GRID_H, Math.ceil((this.camY + H / this.zoom) / CELL));

        for (let y = sy; y < ey; y++) {
            for (let x = sx; x < ex; x++) {
                const px = x * CELL, py = y * CELL;
                const cell = this.grid[y][x];
                // Background
                ctx.fillStyle = (x + y) % 2 === 0 ? '#16213e' : '#1a1a2e';
                ctx.fillRect(px, py, CELL, CELL);
                // Deposit
                if (cell.deposit && cell.deposit.amount > 0) {
                    ctx.fillStyle = cell.deposit.color;
                    ctx.globalAlpha = Math.min(1, cell.deposit.amount / 200);
                    ctx.beginPath();
                    ctx.arc(px + CELL/2, py + CELL/2, 10, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1;
                    // Amount text
                    ctx.fillStyle = '#FFF';
                    ctx.font = '8px Rajdhani,sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(cell.deposit.amount, px + CELL/2, py + CELL/2 + 3);
                }
                // Grid lines
                ctx.strokeStyle = 'rgba(255,255,255,0.05)';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(px, py, CELL, CELL);
            }
        }
    }

    _renderBuildings(ctx) {
        for (const b of this.buildings) {
            const def = BUILDING_DEFS[b.type];
            const px = b.x * CELL, py = b.y * CELL;
            const size = b.size * CELL;
            // Building bg
            ctx.fillStyle = def.color;
            ctx.fillRect(px + 1, py + 1, size - 2, size - 2);
            // Icon
            ctx.font = (size * 0.5) + 'px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(def.icon, px + size/2, py + size/2);
            // Progress bar
            if (b.progress > 0) {
                const recipe = b.recipe ? RECIPES[b.recipe] : null;
                const maxP = recipe ? recipe.time : 1;
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(px + 2, py + size - 6, size - 4, 4);
                ctx.fillStyle = '#4CAF50';
                ctx.fillRect(px + 2, py + size - 6, (size - 4) * (b.progress / maxP), 4);
            }
            // Storage count
            const storageCount = Object.values(b.storage).reduce((a, b) => a + b, 0);
            if (storageCount > 0) {
                ctx.fillStyle = '#FFD700';
                ctx.font = '9px Rajdhani,sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText(storageCount, px + size - 2, py + 10);
            }
            // Direction arrow for conveyors
            if (b.type === 'conveyor') {
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.font = '14px sans-serif';
                ctx.textAlign = 'center';
                const arrows = ['↑','→','↓','←'];
                ctx.fillText(arrows[b.dir], px + CELL/2, py + CELL/2);
            }
            // Recipe indicator
            if (b.recipe && def.recipes) {
                const recipe = RECIPES[b.recipe];
                if (recipe) {
                    ctx.fillStyle = 'rgba(255,255,255,0.6)';
                    ctx.font = '7px Rajdhani,sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(recipe.name, px + size/2, py + 9);
                }
            }
        }
    }

    _renderItems(ctx) {
        for (const item of this.items) {
            const info = ALL_ITEMS[item.type];
            if (!info) continue;
            ctx.fillStyle = info.color;
            ctx.beginPath();
            ctx.arc(item.x, item.y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFF';
            ctx.font = '8px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(info.icon, item.x, item.y + 3);
        }
    }

    _renderHover(ctx) {
        if (!this.hoveredCell || !this.selectedBuilding) return;
        const def = BUILDING_DEFS[this.selectedBuilding];
        const px = this.hoveredCell.x * CELL;
        const py = this.hoveredCell.y * CELL;
        const size = def.size * CELL;
        ctx.fillStyle = 'rgba(76,175,80,0.3)';
        ctx.fillRect(px, py, size, size);
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2;
        ctx.strokeRect(px, py, size, size);
    }

    _renderParticles(ctx) {
        for (const p of this.particles) {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
            ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
        }
        ctx.globalAlpha = 1;
    }

    _renderUI(ctx) {
        // Top bar
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, W, MAP_OFFSET_Y);

        // Money
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px Orbitron,monospace';
        ctx.textAlign = 'left';
        ctx.fillText('💰 ' + Math.floor(this.money).toLocaleString(), 10, 25);

        // Income
        ctx.fillStyle = '#4CAF50';
        ctx.font = '12px Rajdhani,sans-serif';
        ctx.fillText('+' + Math.floor(this.income).toLocaleString() + '/min', 10, 45);

        // Stats
        ctx.fillStyle = '#888';
        ctx.font = '11px Rajdhani,sans-serif';
        ctx.fillText('📦 ' + this.items.length + ' items  🏭 ' + this.buildings.length + ' buildings', 150, 25);
        ctx.fillText('⚡ ' + this.powerGen + ' power', 150, 45);

        // Research progress
        if (this.activeResearch) {
            const def = RESEARCH_DEFS[this.activeResearch];
            const prog = (this.researchProgress[this.activeResearch] || 0) / def.time;
            ctx.fillStyle = '#9370DB';
            ctx.fillText('🔬 ' + def.name + ' ' + Math.floor(prog * 100) + '%', 300, 25);
        }

        // Panel buttons
        const panels = [
            { key:'build', label:'🔨 Build', color:'#4CAF50' },
            { key:'research', label:'🔬 Research', color:'#9370DB' },
            { key:'stats', label:'📊 Stats', color:'#2196F3' },
            { key:'settings', label:'⚙️', color:'#666' },
        ];
        for (let i = 0; i < panels.length; i++) {
            const p = panels[i];
            const bx = W - (panels.length - i) * 85;
            ctx.fillStyle = this.activePanel === p.key ? p.color : 'rgba(255,255,255,0.1)';
            ctx.fillRect(bx, 15, 80, 30);
            ctx.fillStyle = '#FFF';
            ctx.font = '12px Rajdhani,sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(p.label, bx + 40, 35);
        }

        // Side panel
        if (this.activePanel === 'build') this._renderBuildPanel(ctx);
        if (this.activePanel === 'research') this._renderResearchPanel(ctx);
        if (this.activePanel === 'stats') this._renderStatsPanel(ctx);

        // Notifications
        for (let i = 0; i < this.notifications.length; i++) {
            const n = this.notifications[i];
            ctx.fillStyle = n.color;
            ctx.globalAlpha = Math.min(1, n.timer);
            ctx.font = 'bold 14px Rajdhani,sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(n.text, W/2, H - 100 - i * 25);
        }
        ctx.globalAlpha = 1;
    }

    _renderBuildPanel(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, MAP_OFFSET_Y, 200, H - MAP_OFFSET_Y);

        for (let i = 0; i < BUILDING_ORDER.length; i++) {
            const key = BUILDING_ORDER[i];
            const def = BUILDING_DEFS[key];
            const by = MAP_OFFSET_Y + 5 + i * 45;
            const unlocked = this._isBuildingUnlocked(key);
            const selected = this.selectedBuilding === key;
            const canAfford = this.money >= def.cost;

            ctx.fillStyle = selected ? 'rgba(76,175,80,0.3)' : unlocked ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.3)';
            ctx.fillRect(5, by, 190, 42);
            ctx.strokeStyle = selected ? '#4CAF50' : 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 1;
            ctx.strokeRect(5, by, 190, 42);

            ctx.font = '18px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillStyle = unlocked ? '#FFF' : '#555';
            ctx.fillText(def.icon, 12, by + 27);

            ctx.font = 'bold 12px Rajdhani,sans-serif';
            ctx.fillText(unlocked ? def.name : '🔒 Locked', 38, by + 18);

            ctx.font = '10px Rajdhani,sans-serif';
            ctx.fillStyle = canAfford ? '#FFD700' : '#F44336';
            ctx.fillText('$' + def.cost, 38, by + 33);

            // Hotkey
            ctx.fillStyle = '#555';
            ctx.font = '9px Rajdhani,sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('[' + (i + 1) + ']', 190, by + 33);
        }
    }

    _renderResearchPanel(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, MAP_OFFSET_Y, 260, H - MAP_OFFSET_Y);

        ctx.fillStyle = '#9370DB';
        ctx.font = 'bold 14px Orbitron,monospace';
        ctx.textAlign = 'center';
        ctx.fillText('RESEARCH TREE', 130, MAP_OFFSET_Y + 20);

        for (let i = 0; i < RESEARCH_ORDER.length; i++) {
            const key = RESEARCH_ORDER[i];
            const def = RESEARCH_DEFS[key];
            const by = MAP_OFFSET_Y + 35 + i * 50;
            const done = this.research[key];
            const active = this.activeResearch === key;
            const prog = this.researchProgress[key] || 0;
            const canResearch = !done && def.requires.every(r => this.research[r]);

            ctx.fillStyle = done ? 'rgba(76,175,80,0.2)' : active ? 'rgba(147,112,219,0.2)' : 'rgba(255,255,255,0.05)';
            ctx.fillRect(5, by, 250, 47);
            ctx.strokeStyle = done ? '#4CAF50' : active ? '#9370DB' : 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 1;
            ctx.strokeRect(5, by, 250, 47);

            ctx.fillStyle = done ? '#4CAF50' : canResearch ? '#FFF' : '#666';
            ctx.font = 'bold 11px Rajdhani,sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText((done ? '✅ ' : active ? '🔬 ' : '') + def.name, 10, by + 16);

            ctx.fillStyle = '#888';
            ctx.font = '9px Rajdhani,sans-serif';
            ctx.fillText(def.desc, 10, by + 30);

            if (!done && !active) {
                ctx.fillStyle = '#FFD700';
                ctx.font = '9px Rajdhani,sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText('Time: ' + def.time + 's', 250, by + 16);
            }

            if (active) {
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.fillRect(10, by + 38, 235, 5);
                ctx.fillStyle = '#9370DB';
                ctx.fillRect(10, by + 38, 235 * (prog / def.time), 5);
            }
        }
    }

    _renderStatsPanel(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(W - 250, MAP_OFFSET_Y, 250, 200);

        ctx.fillStyle = '#2196F3';
        ctx.font = 'bold 14px Orbitron,monospace';
        ctx.textAlign = 'center';
        ctx.fillText('STATISTICS', W - 125, MAP_OFFSET_Y + 20);

        const stats = [
            ['💰 Total Earned', Math.floor(this.stats.totalEarned).toLocaleString()],
            ['📦 Items Produced', this.stats.itemsProduced],
            ['🏪 Items Sold', this.stats.itemsSold],
            ['🏭 Buildings', this.buildings.length],
            ['⚡ Power', this.powerGen + '/' + this.powerUse],
            ['⏱️ Play Time', Math.floor(this.stats.playTime / 60) + 'm'],
        ];
        ctx.textAlign = 'left';
        for (let i = 0; i < stats.length; i++) {
            ctx.fillStyle = '#CCC';
            ctx.font = '11px Rajdhani,sans-serif';
            ctx.fillText(stats[i][0], W - 240, MAP_OFFSET_Y + 45 + i * 22);
            ctx.fillStyle = '#FFF';
            ctx.textAlign = 'right';
            ctx.fillText(String(stats[i][1]), W - 15, MAP_OFFSET_Y + 45 + i * 22);
            ctx.textAlign = 'left';
        }
    }
}
