/**
 * Gold Miner - Object Classes
 * Treasures, Junk, Hazards, Moving Objects
 */

const ObjType = {
    GOLD_SMALL: 'gold_small',
    GOLD_MEDIUM: 'gold_medium',
    GOLD_LARGE: 'gold_large',
    GOLD_GIANT: 'gold_giant',
    DIAMOND: 'diamond',
    MYSTERY_BAG: 'mystery_bag',
    ROCK_SMALL: 'rock_small',
    ROCK_LARGE: 'rock_large',
    BONE: 'bone',
    SKULL: 'skull',
    TNT: 'tnt',
    MOLE: 'mole',
    MOLE_DIAMOND: 'mole_diamond'
};

// Pull speed multipliers (higher = faster pull)
const WEIGHT = {
    [ObjType.DIAMOND]:      1.0,
    [ObjType.MYSTERY_BAG]:  0.9,
    [ObjType.BONE]:         0.85,
    [ObjType.SKULL]:        0.8,
    [ObjType.GOLD_SMALL]:   0.75,
    [ObjType.MOLE]:         0.7,
    [ObjType.MOLE_DIAMOND]: 0.7,
    [ObjType.GOLD_MEDIUM]:  0.55,
    [ObjType.ROCK_SMALL]:   0.30,
    [ObjType.GOLD_LARGE]:   0.35,
    [ObjType.TNT]:          0.5,
    [ObjType.GOLD_GIANT]:   0.20,
    [ObjType.ROCK_LARGE]:   0.15
};

const MYSTERY_REWARDS = [
    { type: 'money', value: 10, label: '$10', chance: 15 },
    { type: 'money', value: 25, label: '$25', chance: 15 },
    { type: 'money', value: 50, label: '$50', chance: 20 },
    { type: 'money', value: 100, label: '$100', chance: 15 },
    { type: 'money', value: 200, label: '$200', chance: 10 },
    { type: 'dynamite', value: 1, label: 'Dynamite!', chance: 8 },
    { type: 'strength', value: 1, label: 'Strength!', chance: 7 },
    { type: 'nothing', value: 0, label: 'Nothing...', chance: 10 }
];

function rollMysteryReward(luckyClover = false) {
    let pool = MYSTERY_REWARDS.map(r => ({ ...r }));
    if (luckyClover) {
        // Boost good rewards, reduce "nothing"
        for (const r of pool) {
            if (r.type === 'nothing') r.chance = 3;
            else if (r.type === 'money' && r.value >= 100) r.chance += 5;
            else if (r.type === 'dynamite' || r.type === 'strength') r.chance += 3;
        }
    }
    const total = pool.reduce((s, r) => s + r.chance, 0);
    let roll = Math.random() * total;
    for (const r of pool) {
        roll -= r.chance;
        if (roll <= 0) return r;
    }
    return pool[0];
}

class MineObject {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.active = true;
        this.grabbed = false;
        this.removing = false;
        this.removeTimer = 0;

        // Mole movement
        this.moveTimer = 0;
        this.movePhase = 0;
        this.originX = x;
        this.originY = y;

        this._setProps(type);
    }

    _setProps(type) {
        switch (type) {
            case ObjType.GOLD_SMALL:
                this.radius = 14; this.value = 50; this.color = '#ffcc00'; this.colorDark = '#cc9900'; break;
            case ObjType.GOLD_MEDIUM:
                this.radius = 22; this.value = 250; this.color = '#ffdd33'; this.colorDark = '#ccaa00'; break;
            case ObjType.GOLD_LARGE:
                this.radius = 30; this.value = 500; this.color = '#ffee55'; this.colorDark = '#ccbb00'; break;
            case ObjType.GOLD_GIANT:
                this.radius = 40; this.value = 1000; this.color = '#fff488'; this.colorDark = '#ddcc00'; break;
            case ObjType.DIAMOND:
                this.radius = 13; this.value = 600; this.color = '#aaeeff'; this.colorDark = '#66bbdd'; break;
            case ObjType.MYSTERY_BAG:
                this.radius = 15; this.value = 0; this.color = '#88cc44'; this.colorDark = '#669933'; break;
            case ObjType.ROCK_SMALL:
                this.radius = 17; this.value = 20; this.color = '#777788'; this.colorDark = '#555566'; break;
            case ObjType.ROCK_LARGE:
                this.radius = 27; this.value = 50; this.color = '#666677'; this.colorDark = '#444455'; break;
            case ObjType.BONE:
                this.radius = 14; this.value = 20; this.color = '#ddccaa'; this.colorDark = '#bbaa88'; break;
            case ObjType.SKULL:
                this.radius = 16; this.value = 50; this.color = '#eeddcc'; this.colorDark = '#ccbb99'; break;
            case ObjType.TNT:
                this.radius = 18; this.value = 0; this.color = '#ff3333'; this.colorDark = '#cc0000'; break;
            case ObjType.MOLE:
                this.radius = 15; this.value = 25; this.color = '#8B6914'; this.colorDark = '#6B4914'; break;
            case ObjType.MOLE_DIAMOND:
                this.radius = 16; this.value = 600; this.color = '#8B6914'; this.colorDark = '#6B4914'; break;
        }
    }

    update(dt) {
        if (!this.active) return;

        // Mole movement
        if (this.type === ObjType.MOLE || this.type === ObjType.MOLE_DIAMOND) {
            this.moveTimer += dt;
            this.x = this.originX + Math.sin(this.moveTimer * 0.03) * 40;
        }

        if (this.removing) {
            this.removeTimer--;
            if (this.removeTimer <= 0) this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        switch (this.type) {
            case ObjType.GOLD_SMALL:
            case ObjType.GOLD_MEDIUM:
            case ObjType.GOLD_LARGE:
            case ObjType.GOLD_GIANT:
                this._drawGold(ctx); break;
            case ObjType.DIAMOND:
                this._drawDiamond(ctx); break;
            case ObjType.MYSTERY_BAG:
                this._drawBag(ctx); break;
            case ObjType.ROCK_SMALL:
            case ObjType.ROCK_LARGE:
                this._drawRock(ctx); break;
            case ObjType.BONE:
                this._drawBone(ctx); break;
            case ObjType.SKULL:
                this._drawSkull(ctx); break;
            case ObjType.TNT:
                this._drawTNT(ctx); break;
            case ObjType.MOLE:
                this._drawMole(ctx, false); break;
            case ObjType.MOLE_DIAMOND:
                this._drawMole(ctx, true); break;
        }

        ctx.restore();
    }

    _drawGold(ctx) {
        const r = this.radius;
        const grad = ctx.createRadialGradient(-r*0.3, -r*0.3, r*0.1, 0, 0, r);
        grad.addColorStop(0, '#fff8aa');
        grad.addColorStop(0.4, this.color);
        grad.addColorStop(1, this.colorDark);
        ctx.fillStyle = grad;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const a = (Math.PI*2/8)*i;
            const w = r*(0.85+Math.sin(i*2.5)*0.15);
            i===0 ? ctx.moveTo(Math.cos(a)*w, Math.sin(a)*w) : ctx.lineTo(Math.cos(a)*w, Math.sin(a)*w);
        }
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath();
        ctx.ellipse(-r*0.25, -r*0.25, r*0.3, r*0.2, -0.5, 0, Math.PI*2);
        ctx.fill();
    }

    _drawDiamond(ctx) {
        const r = this.radius;
        const grad = ctx.createRadialGradient(-r*0.2, -r*0.3, r*0.1, 0, 0, r);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, this.color);
        grad.addColorStop(1, this.colorDark);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, -r); ctx.lineTo(r*0.8, -r*0.2);
        ctx.lineTo(r*0.5, r); ctx.lineTo(-r*0.5, r);
        ctx.lineTo(-r*0.8, -r*0.2); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0,-r); ctx.lineTo(0,r);
        ctx.moveTo(-r*0.8,-r*0.2); ctx.lineTo(r*0.8,-r*0.2); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath(); ctx.ellipse(-r*0.2,-r*0.4,r*0.12,r*0.08,-0.5,0,Math.PI*2); ctx.fill();
    }

    _drawBag(ctx) {
        const r = this.radius;
        const grad = ctx.createRadialGradient(-r*0.2,-r*0.2,r*0.1,0,0,r);
        grad.addColorStop(0,'#aadd55'); grad.addColorStop(0.5,this.color); grad.addColorStop(1,this.colorDark);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(-r*0.7,r*0.8);
        ctx.quadraticCurveTo(-r,0,-r*0.5,-r*0.6);
        ctx.quadraticCurveTo(0,-r*1.1,r*0.5,-r*0.6);
        ctx.quadraticCurveTo(r,0,r*0.7,r*0.8);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.floor(r*0.7)}px monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('?', 0, 0);
    }

    _drawRock(ctx) {
        const r = this.radius;
        const grad = ctx.createRadialGradient(-r*0.2,-r*0.2,r*0.1,0,0,r);
        grad.addColorStop(0,'#999aaa'); grad.addColorStop(0.5,this.color); grad.addColorStop(1,this.colorDark);
        ctx.fillStyle = grad;
        ctx.beginPath();
        for (let i = 0; i < 7; i++) {
            const a = (Math.PI*2/7)*i;
            const w = r*(0.8+Math.sin(i*3.7)*0.2);
            i===0 ? ctx.moveTo(Math.cos(a)*w,Math.sin(a)*w) : ctx.lineTo(Math.cos(a)*w,Math.sin(a)*w);
        }
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-r*0.3,-r*0.2); ctx.lineTo(r*0.1,r*0.3);
        ctx.moveTo(r*0.2,-r*0.4); ctx.lineTo(r*0.1,r*0.1);
        ctx.stroke();
    }

    _drawBone(ctx) {
        const r = this.radius;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.colorDark;
        ctx.lineWidth = r * 0.35;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-r*0.7, r*0.3);
        ctx.lineTo(r*0.7, -r*0.3);
        ctx.stroke();
        // Knobs
        ctx.fillStyle = '#eeddcc';
        [[-r*0.7,r*0.3],[r*0.7,-r*0.3]].forEach(([bx,by]) => {
            ctx.beginPath(); ctx.arc(bx,by,r*0.22,0,Math.PI*2); ctx.fill();
        });
    }

    _drawSkull(ctx) {
        const r = this.radius;
        ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(0,-r*0.1,r*0.8,0,Math.PI*2); ctx.fill();
        // Jaw
        ctx.fillStyle = this.colorDark;
        ctx.fillRect(-r*0.5, r*0.2, r, r*0.4);
        // Eyes
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(-r*0.25,-r*0.15,r*0.18,0,Math.PI*2);
        ctx.arc(r*0.25,-r*0.15,r*0.18,0,Math.PI*2);
        ctx.fill();
        // Nose
        ctx.beginPath();
        ctx.moveTo(0,0); ctx.lineTo(-r*0.1,r*0.15); ctx.lineTo(r*0.1,r*0.15);
        ctx.fill();
        // Teeth
        ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
        for (let i=-2;i<=2;i++) {
            ctx.beginPath();
            ctx.moveTo(i*r*0.18, r*0.2);
            ctx.lineTo(i*r*0.18, r*0.5);
            ctx.stroke();
        }
    }

    _drawTNT(ctx) {
        const r = this.radius;
        ctx.fillStyle = '#cc2200';
        ctx.fillRect(-r*0.7,-r*0.8,r*1.4,r*1.6);
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(-r*0.5,-r*0.3,r*1,r*0.7);
        ctx.fillStyle = '#000';
        ctx.font = `bold ${Math.floor(r*0.45)}px monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('TNT',0,0);
        // Fuse
        ctx.strokeStyle = '#666'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0,-r*0.8);
        ctx.quadraticCurveTo(r*0.5,-r*1.3,r*0.3,-r*1.5); ctx.stroke();
        ctx.fillStyle = Math.random()>0.5 ? '#ffaa00' : '#ff6600';
        ctx.beginPath(); ctx.arc(r*0.3,-r*1.5,3,0,Math.PI*2); ctx.fill();
    }

    _drawMole(ctx, hasDiamond) {
        const r = this.radius;
        // Body
        ctx.fillStyle = '#8B6914';
        ctx.beginPath(); ctx.ellipse(0,0,r,r*0.7,0,0,Math.PI*2); ctx.fill();
        // Ears
        ctx.fillStyle = '#6B4914';
        ctx.beginPath(); ctx.arc(-r*0.5,-r*0.6,r*0.25,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(r*0.5,-r*0.6,r*0.25,0,Math.PI*2); ctx.fill();
        // Nose
        ctx.fillStyle = '#ff8888';
        ctx.beginPath(); ctx.arc(0,r*0.1,r*0.2,0,Math.PI*2); ctx.fill();
        // Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-r*0.3,-r*0.15,r*0.1,0,Math.PI*2);
        ctx.arc(r*0.3,-r*0.15,r*0.1,0,Math.PI*2);
        ctx.fill();
        // Diamond on head
        if (hasDiamond) {
            ctx.fillStyle = '#aaeeff';
            ctx.beginPath();
            ctx.moveTo(0,-r*0.9); ctx.lineTo(r*0.3,-r*0.5);
            ctx.lineTo(0,-r*0.3); ctx.lineTo(-r*0.3,-r*0.5);
            ctx.closePath(); ctx.fill();
        }
    }

    getBounds() {
        return { x: this.x-this.radius, y: this.y-this.radius, width: this.radius*2, height: this.radius*2 };
    }
}
