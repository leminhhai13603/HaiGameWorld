/**
 * Gold Miner - Hook System
 * Swing, launch, grab, retract with weight-based physics
 */

const HookState = { IDLE: 'idle', LAUNCHING: 'launching', GRABBING: 'grabbing', RETRACTING: 'retracting' };

class HookSystem {
    constructor(minerX, minerY) {
        this.minerX = minerX;
        this.minerY = minerY;
        this.x = minerX;
        this.y = minerY;
        this.ropeLength = 30;
        this.maxRopeLength = 580;
        this.baseLaunchSpeed = 7;
        this.baseRetractSpeed = 4;
        this.retractSpeed = 4;
        this.angle = Math.PI / 2;
        this.swingSpeed = 0.018;
        this.swingDir = 1;
        this.state = HookState.IDLE;
        this.grabbedItem = null;
        this.strengthBuff = false;
        this.chainItems = [];
    }

    launch() {
        if (this.state !== HookState.IDLE) return;
        this.state = HookState.LAUNCHING;
        this.ropeLength = 30;
        AudioSystem.play('launch');
    }

    useDynamite() {
        if (this.state !== HookState.GRABBING || !this.grabbedItem) return false;
        const item = this.grabbedItem;
        AudioSystem.play('dynamite');
        item.active = false;
        this.grabbedItem = null;
        this.state = HookState.RETRACTING;
        this.retractSpeed = this.baseLaunchSpeed;
        return true;
    }

    update(objects, particles, dt) {
        switch (this.state) {
            case HookState.IDLE:
                this._updateSwing(dt);
                break;
            case HookState.LAUNCHING:
                this._updateLaunch(objects, particles);
                break;
            case HookState.GRABBING:
                this._updateGrabbing();
                break;
            case HookState.RETRACTING:
                this._updateRetracting();
                break;
        }
        this.x = this.minerX + Math.cos(this.angle) * this.ropeLength;
        this.y = this.minerY + Math.sin(this.angle) * this.ropeLength;
    }

    _updateSwing(dt) {
        this.angle += this.swingSpeed * this.swingDir;
        if (this.angle > Math.PI * 0.88) this.swingDir = -1;
        if (this.angle < Math.PI * 0.12) this.swingDir = 1;
        this.ropeLength = 30;
    }

    _updateLaunch(objects, particles) {
        this.ropeLength += this.baseLaunchSpeed;
        if (this.ropeLength >= this.maxRopeLength || this.x < -10 || this.x > 810 || this.y > 610) {
            this.state = HookState.RETRACTING;
            return;
        }
        for (const obj of objects) {
            if (!obj.active || obj.grabbed) continue;
            const dx = this.x - obj.x;
            const dy = this.y - obj.y;
            if (Math.sqrt(dx*dx+dy*dy) < obj.radius + 8) {
                this._grabItem(obj, particles);
                return;
            }
        }
    }

    _grabItem(item, particles) {
        item.grabbed = true;
        this.grabbedItem = item;
        AudioSystem.play('grab');

        const weight = WEIGHT[item.type] || 0.5;
        let speed = this.baseRetractSpeed * weight;
        if (this.strengthBuff) speed *= 1.25;
        this.retractSpeed = Math.max(1.2, speed);

        this.state = HookState.GRABBING;

        if (item.type === ObjType.TNT) {
            this._handleTNT(item, particles);
        }

        if (item.type === ObjType.MOLE || item.type === ObjType.MOLE_DIAMOND) {
            AudioSystem.play('mole');
        }
    }

    _handleTNT(tntItem, particles) {
        AudioSystem.play('tnt');
        particles.explosion(tntItem.x, tntItem.y);
        tntItem.removing = true;
        tntItem.removeTimer = 20;
        this.chainItems = [];
        const blastRadius = 100;
        for (const obj of (this._objects || [])) {
            if (!obj.active || obj === tntItem) continue;
            if (Math.hypot(obj.x-tntItem.x, obj.y-tntItem.y) < blastRadius) {
                if (obj.type === ObjType.ROCK_SMALL || obj.type === ObjType.ROCK_LARGE ||
                    obj.type === ObjType.BONE || obj.type === ObjType.SKULL) {
                    obj.active = false;
                    particles.rockBurst(obj.x, obj.y);
                    this.chainItems.push(obj);
                }
            }
        }
        this.grabbedItem = null;
        this.state = HookState.RETRACTING;
        this.retractSpeed = this.baseLaunchSpeed;
    }

    _updateGrabbing() {
        this.ropeLength -= this.retractSpeed;
        if (this.grabbedItem) {
            this.grabbedItem.x = this.x;
            this.grabbedItem.y = this.y;
        }
        if (this.ropeLength <= 30) this.ropeLength = 30;
    }

    _updateRetracting() {
        this.ropeLength -= this.baseLaunchSpeed;
        if (this.ropeLength <= 30) {
            this.ropeLength = 30;
            this.state = HookState.IDLE;
        }
    }

    deliverItem(particles) {
        if (!this.grabbedItem) return null;
        const item = this.grabbedItem;
        let value = item.value;

        // Apply buffs
        if (item.type === ObjType.DIAMOND && this._diamondPolish) value *= 2;
        if ((item.type === ObjType.ROCK_SMALL || item.type === ObjType.ROCK_LARGE) && this._rockBook) value *= 3;
        if ((item.type === ObjType.BONE || item.type === ObjType.SKULL) && this._boneBook) value *= 3;

        let rewardType = 'money';
        let label = `+$${value}`;
        let color = '#ffcc00';

        if (item.type === ObjType.MYSTERY_BAG) {
            const reward = rollMysteryReward(this._luckyClover);
            if (reward.type === 'money') {
                value = reward.value;
                label = reward.label;
            } else if (reward.type === 'dynamite') {
                rewardType = 'dynamite';
                label = reward.label;
                value = 0;
            } else if (reward.type === 'strength') {
                rewardType = 'strength';
                label = reward.label;
                value = 0;
            } else {
                rewardType = 'nothing';
                label = reward.label;
                value = 0;
            }
            color = '#88cc44';
        } else if (item.type === ObjType.DIAMOND || item.type === ObjType.MOLE_DIAMOND) {
            color = '#aaeeff';
            AudioSystem.play('diamond');
            particles.diamondSparkle(this.minerX, this.minerY);
        } else if (item.type >= ObjType.GOLD_SMALL && item.type <= ObjType.GOLD_GIANT) {
            AudioSystem.play('gold');
            particles.goldSparkle(this.minerX, this.minerY);
        } else if (item.type === ObjType.ROCK_SMALL || item.type === ObjType.ROCK_LARGE) {
            AudioSystem.play('rock');
            particles.rockBurst(this.minerX, this.minerY);
            color = '#888';
        } else if (item.type === ObjType.BONE || item.type === ObjType.SKULL) {
            AudioSystem.play('bone');
            particles.boneBurst(this.minerX, this.minerY);
            color = '#ddccaa';
        } else if (item.type === ObjType.MOLE) {
            AudioSystem.play('mole');
            color = '#8B6914';
        }

        particles.scorePopup(this.minerX, this.minerY - 40, label, color);

        // Track stats
        const stats = { money: value, rewardType };
        if (item.type >= ObjType.GOLD_SMALL && item.type <= ObjType.GOLD_GIANT) stats.gold = 1;
        if (item.type === ObjType.DIAMOND || item.type === ObjType.MOLE_DIAMOND) stats.diamond = 1;
        if (item.type === ObjType.ROCK_SMALL || item.type === ObjType.ROCK_LARGE) stats.rock = 1;
        if (item.type === ObjType.BONE || item.type === ObjType.SKULL) stats.bone = 1;

        item.active = false;
        this.grabbedItem = null;
        this.ropeLength = 30;
        this.state = HookState.IDLE;

        return stats;
    }

    reset(minerX, minerY) {
        this.minerX = minerX;
        this.minerY = minerY;
        this.state = HookState.IDLE;
        this.grabbedItem = null;
        this.ropeLength = 30;
        this.angle = Math.PI / 2;
        this.chainItems = [];
        this.strengthBuff = false;
        this._diamondPolish = false;
        this._rockBook = false;
        this._boneBook = false;
        this._luckyClover = false;
    }

    draw(ctx) {
        // Rope
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.minerX, this.minerY);
        ctx.lineTo(this.x, this.y);
        ctx.stroke();

        // Hook
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2);
        ctx.strokeStyle = '#aaaacc';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0,0); ctx.lineTo(-8,-5); ctx.lineTo(-6,-14);
        ctx.moveTo(0,0); ctx.lineTo(8,-5); ctx.lineTo(6,-14);
        ctx.stroke();
        ctx.fillStyle = '#ddd';
        ctx.beginPath(); ctx.arc(0,-2,4,0,Math.PI*2); ctx.fill();
        ctx.restore();
    }
}
