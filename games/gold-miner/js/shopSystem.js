/**
 * Gold Miner - Shop System
 * Appears after each successful level
 */

const SHOP_ITEMS = [
    {
        id: 'dynamite', name: 'Dynamite', icon: '🧨',
        desc: 'Press UP while pulling to destroy grabbed object',
        priceMin: 75, priceMax: 225, stackable: true
    },
    {
        id: 'strength', name: 'Strength Drink', icon: '💪',
        desc: '+25% pull speed for next level',
        priceMin: 200, priceMax: 400, stackable: false
    },
    {
        id: 'lucky_clover', name: 'Lucky Clover', icon: '🍀',
        desc: 'Better Mystery Bag rewards',
        priceMin: 300, priceMax: 600, stackable: false
    },
    {
        id: 'rock_book', name: 'Rock Collector Book', icon: '📖',
        desc: 'Rock values x3 for next level',
        priceMin: 400, priceMax: 700, stackable: false
    },
    {
        id: 'diamond_polish', name: 'Diamond Polish', icon: '💎',
        desc: 'Diamond values x2 for next level',
        priceMin: 500, priceMax: 900, stackable: false
    },
    {
        id: 'bone_book', name: 'Bone Book', icon: '🦴',
        desc: 'Bone & Skull values x3 for next level',
        priceMin: 300, priceMax: 500, stackable: false
    }
];

class ShopSystem {
    constructor() {
        this.items = [];
        this.selectedIndex = 0;
        this.money = 0;
        this.dynamite = 0;
        this.active = false;
        this.boughtStrength = false;
        this.boughtLuckyClover = false;
        this.boughtRockBook = false;
        this.boughtDiamondPolish = false;
        this.boughtBoneBook = false;
    }

    open(money) {
        this.money = money;
        this.active = true;
        this.selectedIndex = 0;
        this._generateItems();
    }

    _generateItems() {
        this.items = [];
        const shuffled = [...SHOP_ITEMS].sort(() => Math.random() - 0.5);
        const count = 3 + Math.floor(Math.random() * 2); // 3-4 items
        for (let i = 0; i < count && i < shuffled.length; i++) {
            const def = shuffled[i];
            const price = def.priceMin + Math.floor(Math.random() * (def.priceMax - def.priceMin));
            this.items.push({
                ...def,
                price,
                bought: false
            });
        }
    }

    buy(index) {
        if (index < 0 || index >= this.items.length) return null;
        const item = this.items[index];
        if (item.bought || this.money < item.price) return null;

        this.money -= item.price;
        item.bought = true;

        switch (item.id) {
            case 'dynamite':
                this.dynamite++;
                break;
            case 'strength':
                this.boughtStrength = true;
                break;
            case 'lucky_clover':
                this.boughtLuckyClover = true;
                break;
            case 'rock_book':
                this.boughtRockBook = true;
                break;
            case 'diamond_polish':
                this.boughtDiamondPolish = true;
                break;
            case 'bone_book':
                this.boughtBoneBook = true;
                break;
        }

        AudioSystem.play('buy');
        return item;
    }

    close() {
        this.active = false;
        const result = {
            money: this.money,
            dynamite: this.dynamite,
            strength: this.boughtStrength,
            luckyClover: this.boughtLuckyClover,
            rockBook: this.boughtRockBook,
            diamondPolish: this.boughtDiamondPolish,
            boneBook: this.boughtBoneBook
        };
        // Reset non-stackable purchases
        this.boughtStrength = false;
        this.boughtLuckyClover = false;
        this.boughtRockBook = false;
        this.boughtDiamondPolish = false;
        this.boughtBoneBook = false;
        return result;
    }

    draw(ctx, canvasW, canvasH) {
        if (!this.active) return;

        // Overlay
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, canvasW, canvasH);

        // Title
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 28px Orbitron, monospace';
        ctx.fillText('SHOP', canvasW / 2, 50);

        // Money
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px Rajdhani, sans-serif';
        ctx.fillText(`Money: $${this.money}`, canvasW / 2, 80);

        // Items
        const startY = 110;
        const itemH = 70;

        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            const y = startY + i * itemH;
            const isSelected = i === this.selectedIndex;

            // Background
            ctx.fillStyle = isSelected ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.05)';
            ctx.strokeStyle = isSelected ? '#00e5ff' : 'rgba(255,255,255,0.1)';
            ctx.lineWidth = isSelected ? 2 : 1;

            const boxW = 400;
            const boxX = canvasW / 2 - boxW / 2;
            ctx.fillRect(boxX, y, boxW, itemH - 8);
            ctx.strokeRect(boxX, y, boxW, itemH - 8);

            // Icon + Name
            ctx.textAlign = 'left';
            ctx.fillStyle = item.bought ? '#666' : '#fff';
            ctx.font = '18px sans-serif';
            ctx.fillText(item.icon, boxX + 12, y + 28);

            ctx.font = 'bold 15px Rajdhani, sans-serif';
            ctx.fillText(item.name, boxX + 45, y + 25);

            // Description
            ctx.fillStyle = '#888';
            ctx.font = '12px Rajdhani, sans-serif';
            ctx.fillText(item.desc, boxX + 45, y + 45);

            // Price
            ctx.textAlign = 'right';
            if (item.bought) {
                ctx.fillStyle = '#666';
                ctx.font = 'bold 14px Rajdhani, sans-serif';
                ctx.fillText('SOLD', boxX + boxW - 12, y + 30);
            } else {
                const canAfford = this.money >= item.price;
                ctx.fillStyle = canAfford ? '#44ff44' : '#ff4444';
                ctx.font = 'bold 16px Rajdhani, sans-serif';
                ctx.fillText(`$${item.price}`, boxX + boxW - 12, y + 30);
            }
        }

        // Instructions
        ctx.textAlign = 'center';
        ctx.fillStyle = '#aaa';
        ctx.font = '14px Rajdhani, sans-serif';
        const instrY = startY + this.items.length * itemH + 20;
        ctx.fillText('↑↓ Select  |  ENTER Buy  |  SPACE Continue', canvasW / 2, instrY);

        // Dynamite count
        if (this.dynamite > 0) {
            ctx.fillStyle = '#ff8844';
            ctx.font = 'bold 14px Rajdhani, sans-serif';
            ctx.fillText(`🧨 Dynamite: ${this.dynamite}`, canvasW / 2, instrY + 25);
        }
    }
}
