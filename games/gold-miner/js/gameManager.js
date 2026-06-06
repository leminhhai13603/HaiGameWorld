/**
 * Gold Miner - Game Manager (Main Controller)
 */

const GameState = {
    MENU: 'menu',
    LEVEL_START: 'levelStart',
    PLAYING: 'playing',
    LEVEL_WIN: 'levelWin',
    LEVEL_LOSE: 'levelLose',
    SHOP: 'shop',
    GAME_OVER: 'gameOver',
    VICTORY: 'victory'
};

class GameManager {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 780;
        this.canvas.height = 560;

        this.state = GameState.MENU;
        this.level = 0;
        this.score = 0;
        this.money = 0;
        this.dynamite = 0;
        this.time = 0;
        this.target = 0;

        this.objects = [];
        this.hook = null;
        this.particles = new ParticleSystem();
        this.ui = new UIManager(this.canvas.width, this.canvas.height);
        this.shop = new ShopSystem();

        this.minerX = this.canvas.width / 2;
        this.minerY = 52;

        this.levelStartTimer = 0;
        this.flash = { active: false, color: '#fff', alpha: 0 };

        // Statistics
        this.stats = {
            totalGold: 0,
            totalDiamonds: 0,
            totalRocks: 0,
            totalBones: 0,
            totalMoney: 0,
            bestLevel: 0,
            playTime: 0
        };

        this.lastTime = 0;
        this.frameInterval = 1000 / 60;

        this._setupInput();
        window.addEventListener('beforeunload', () => { AudioManager.close(); });
        this._gameLoop(performance.now());
    }

    _setupInput() {
        const action = () => {
            AudioSystem.resume();
            switch (this.state) {
                case GameState.MENU:
                    this._startGame();
                    break;
                case GameState.LEVEL_START:
                    this.state = GameState.PLAYING;
                    break;
                case GameState.PLAYING:
                    if (this.hook) this.hook.launch();
                    break;
                case GameState.LEVEL_WIN:
                    this._openShop();
                    break;
                case GameState.SHOP:
                    // Handled by shop keys
                    break;
                case GameState.LEVEL_LOSE:
                    this._gameOver();
                    break;
                case GameState.GAME_OVER:
                case GameState.VICTORY:
                    this._startGame();
                    break;
            }
        };

        this.canvas.addEventListener('click', action);
        this.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); action(); }, { passive: false });

        document.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); action(); }
            if (e.key === 'm' || e.key === 'M') AudioSystem.toggle();

            // Dynamite
            if (e.key === 'ArrowUp' && this.state === GameState.PLAYING) {
                if (this.hook && this.dynamite > 0) {
                    if (this.hook.useDynamite()) {
                        this.dynamite--;
                        this.ui.shake(8, 15);
                        this._triggerFlash('#ff8800', 8);
                    }
                }
            }

            // Shop navigation
            if (this.state === GameState.SHOP) {
                if (e.key === 'ArrowUp') {
                    this.shop.selectedIndex = Math.max(0, this.shop.selectedIndex - 1);
                }
                if (e.key === 'ArrowDown') {
                    this.shop.selectedIndex = Math.min(this.shop.items.length - 1, this.shop.selectedIndex + 1);
                }
                if (e.key === 'Enter') {
                    this.shop.buy(this.shop.selectedIndex);
                }
                if (e.key === ' ') {
                    this._closeShop();
                }
            }
        });
    }

    _startGame() {
        this.level = 0;
        this.score = 0;
        this.money = 0;
        this.dynamite = 0;
        this.stats = { totalGold: 0, totalDiamonds: 0, totalRocks: 0, totalBones: 0, totalMoney: 0, bestLevel: 0, playTime: 0 };
        this._loadLevel(0);
    }

    _loadLevel(lvl) {
        this.level = lvl;
        const data = getLevelData(lvl, this.canvas.width, this.canvas.height);
        this.target = data.target;
        this.time = data.timer;
        this.objects = data.objects.map(d => new MineObject(d.x, d.y, d.type));

        // Preserve buffs from old hook before creating new one
        const oldBuffs = this.hook ? {
            strengthBuff: this.hook.strengthBuff,
            _luckyClover: this.hook._luckyClover,
            _rockBook: this.hook._rockBook,
            _diamondPolish: this.hook._diamondPolish,
            _boneBook: this.hook._boneBook
        } : null;

        this.hook = new HookSystem(this.minerX, this.minerY);

        // Transfer buffs to new hook
        if (oldBuffs) {
            this.hook.strengthBuff = oldBuffs.strengthBuff;
            this.hook._luckyClover = oldBuffs._luckyClover;
            this.hook._rockBook = oldBuffs._rockBook;
            this.hook._diamondPolish = oldBuffs._diamondPolish;
            this.hook._boneBook = oldBuffs._boneBook;
        }

        this.particles.clear();
        this.state = GameState.LEVEL_START;
        this.levelStartTimer = 100;
    }

    _openShop() {
        this.shop.open(this.money);
        this.state = GameState.SHOP;
    }

    _closeShop() {
        const result = this.shop.close();
        this.money = result.money;
        this.dynamite += result.dynamite;

        // Apply buffs to hook for next level
        if (this.hook) {
            this.hook.strengthBuff = result.strength;
            this.hook._luckyClover = result.luckyClover;
            this.hook._rockBook = result.rockBook;
            this.hook._diamondPolish = result.diamondPolish;
            this.hook._boneBook = result.boneBook;
        }

        // Next level
        if (this.level + 1 >= 25) {
            this._victory();
        } else {
            this._loadLevel(this.level + 1);
        }
    }

    _gameOver() {
        this.state = GameState.GAME_OVER;
        AudioSystem.play('fail');
    }

    _victory() {
        this.state = GameState.VICTORY;
        AudioSystem.play('victory');
    }

    _triggerFlash(color, duration) {
        this.flash = { active: true, color, alpha: 0.3, duration };
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
        this.stats.playTime += 1 / 60;
        this._update();
        this._render();
    }

    _update() {
        this.ui.updateShake();
        this.particles.update();

        if (this.flash.active) {
            this.flash.alpha -= 0.03;
            if (this.flash.alpha <= 0) this.flash.active = false;
        }

        if (this.state === GameState.LEVEL_START) {
            this.levelStartTimer--;
            if (this.levelStartTimer <= 0) this.state = GameState.PLAYING;
            return;
        }

        if (this.state !== GameState.PLAYING) return;

        // Timer
        this.time -= 1 / 60;
        if (this.time <= 0) {
            this.time = 0;
            if (this.score >= this.target) {
                this.state = GameState.LEVEL_WIN;
                this.stats.bestLevel = Math.max(this.stats.bestLevel, this.level + 1);
                AudioSystem.play('victory');
            } else {
                this._gameOver();
            }
            return;
        }

        // Update objects
        for (const obj of this.objects) obj.update(1);

        // Update hook
        if (this.hook) {
            this.hook._objects = this.objects;
            this.hook.update(this.objects, this.particles, 1);

            // Delivery
            if (this.hook.state === HookState.GRABBING && this.hook.ropeLength <= 30) {
                const result = this.hook.deliverItem(this.particles);
                if (result) {
                    this.score += result.money;
                    this.money += result.money;
                    this.stats.totalMoney += result.money;
                    if (result.gold) this.stats.totalGold += result.gold;
                    if (result.diamond) this.stats.totalDiamonds += result.diamond;
                    if (result.rock) this.stats.totalRocks += result.rock;
                    if (result.bone) this.stats.totalBones += result.bone;
                    if (result.rewardType === 'dynamite') this.dynamite++;
                    if (result.rewardType === 'strength') this.hook.strengthBuff = true;
                }
                // Chain items from TNT
                for (const ci of this.hook.chainItems) {
                    this.score += ci.value;
                    this.money += ci.value;
                    this.stats.totalMoney += ci.value;
                    if (ci.type === ObjType.ROCK_SMALL || ci.type === ObjType.ROCK_LARGE) this.stats.totalRocks++;
                }
                this.hook.chainItems = [];
                if (this.hook.grabbedItem) {
                    this.hook.grabbedItem.active = false;
                    this.hook.grabbedItem = null;
                }
                this.hook.ropeLength = 30;
                this.hook.state = HookState.IDLE;
            }

            // Empty retract done
            if (this.hook.state === HookState.RETRACTING && this.hook.ropeLength <= 30) {
                this.hook.ropeLength = 30;
                this.hook.state = HookState.IDLE;
            }
        }
    }

    _render() {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(this.ui.shakeX, this.ui.shakeY);

        this._drawBackground(ctx);

        // Objects
        for (const obj of this.objects) obj.draw(ctx);

        // Miner
        this.ui.drawMiner(ctx, this.minerX, this.minerY);

        // Hook
        if (this.hook) this.hook.draw(ctx);

        // Particles
        this.particles.draw(ctx);

        // HUD
        if (this.state !== GameState.MENU) {
            this.ui.drawHUD(ctx, this.score, this.target, this.time, this.level, this.dynamite);
        }

        // Flash
        if (this.flash.active) {
            ctx.fillStyle = this.flash.color;
            ctx.globalAlpha = this.flash.alpha;
            ctx.fillRect(-10, -10, this.canvas.width + 20, this.canvas.height + 20);
            ctx.globalAlpha = 1;
        }

        // Overlays
        switch (this.state) {
            case GameState.MENU: this.ui.drawMenu(ctx); break;
            case GameState.LEVEL_START: this.ui.drawStartScreen(ctx, this.level, this.target, this.time); break;
            case GameState.LEVEL_WIN: this.ui.drawWinScreen(ctx, this.score, this.level); break;
            case GameState.LEVEL_LOSE: this.ui.drawLoseScreen(ctx, this.score, this.target, this.level); break;
            case GameState.SHOP: this.shop.draw(ctx, this.canvas.width, this.canvas.height); break;
            case GameState.GAME_OVER: this.ui.drawGameOver(ctx, this.score, this.level, this.stats); break;
            case GameState.VICTORY: this.ui.drawVictoryScreen(ctx, this.score, this.stats); break;
        }

        ctx.restore();
    }

    _drawBackground(ctx) {
        const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grad.addColorStop(0, '#2a1a0a');
        grad.addColorStop(0.3, '#1a1008');
        grad.addColorStop(1, '#0a0804');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Rock texture
        ctx.fillStyle = 'rgba(255,255,255,0.015)';
        for (let i = 0; i < 40; i++) {
            ctx.beginPath();
            ctx.arc((i*137+50) % this.canvas.width, (i*89+30) % this.canvas.height, 1+(i%3), 0, Math.PI*2);
            ctx.fill();
        }

        // Support beams
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(0, 0, 15, this.canvas.height);
        ctx.fillRect(this.canvas.width - 15, 0, 15, this.canvas.height);
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(0, 42, this.canvas.width, 8);

        // Dirt
        ctx.fillStyle = '#3a2810';
        ctx.fillRect(0, this.canvas.height - 30, this.canvas.width, 30);
        ctx.fillStyle = '#2a1a08';
        ctx.fillRect(0, this.canvas.height - 15, this.canvas.width, 15);
    }
}

window.addEventListener('load', () => { new GameManager(); });
