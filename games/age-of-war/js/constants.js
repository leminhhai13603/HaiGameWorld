/**
 * Age of War - Game Constants & Balance Data
 */
const W = 900, H = 500;
const BASE_X_PLAYER = 30, BASE_X_ENEMY = 830, BASE_W = 50;
const SPAWN_X_PLAYER = 85, SPAWN_X_ENEMY = 815;
const BATTLE_LEFT = 80, BATTLE_RIGHT = 820;

const BASE_HP = 500;
const BASE_INCOME = 10;
const TURRET_RANGE = 555;      // 3/4 of battlefield width
const TURRET_UNLOCK_COST = 150; // Cost to buy first turret from shop

// Turret tiers per age (auto-fire stats)
const TURRET_TIERS = [
    { name: 'Pháo Đá',         dmg: 18,  cooldown: 5.0 },
    { name: 'Pháo Trung Cổ',   dmg: 30,  cooldown: 4.2 },
    { name: 'Pháo Công Nghiệp', dmg: 50, cooldown: 3.5 },
    { name: 'Pháo Hiện Đại',   dmg: 80,  cooldown: 2.8 },
    { name: 'Pháo Tương Lai',  dmg: 120, cooldown: 2.2 }
];

// Age definitions
const AGE_DEFS = [
    { name: 'Đồ Đá', icon: '🪨', xpRequired: 0, color: '#8B7355' },
    { name: 'Trung Cổ', icon: '⚔️', xpRequired: 120, color: '#708090' },
    { name: 'Công Nghiệp', icon: '⚙️', xpRequired: 350, color: '#556B2F' },
    { name: 'Hiện Đại', icon: '🚁', xpRequired: 700, color: '#2F4F4F' },
    { name: 'Tương Lai', icon: '🤖', xpRequired: 1200, color: '#4B0082' }
];

// Unit definitions: { hp, dmg, atkSpeed, range, moveSpeed, cost, type, name, size }
const UNIT_DEFS = {
    // Age 0 - Stone
    clubman:   { age:0, name:'Gậy Đá',    hp:60,  dmg:12, atkSpeed:0.8, range:28,  moveSpeed:55, cost:20,  type:'melee',  size:10 },
    spear:     { age:0, name:'Giáo Đá',   hp:35,  dmg:18, atkSpeed:0.55, range:130, moveSpeed:45, cost:35,  type:'ranged', size:9, projSpeed:200 },
    // Age 1 - Medieval
    swordsman: { age:1, name:'Kiếm Sĩ',   hp:90,  dmg:22, atkSpeed:0.8, range:28,  moveSpeed:55, cost:45,  type:'melee',  size:11 },
    archer:    { age:1, name:'Cung Thủ',  hp:50,  dmg:28, atkSpeed:0.55, range:160, moveSpeed:45, cost:60,  type:'ranged', size:9, projSpeed:250 },
    knight:    { age:1, name:'Hiệp Sĩ',   hp:140, dmg:32, atkSpeed:0.9, range:30,  moveSpeed:70, cost:90,  type:'melee',  size:13 },
    // Age 2 - Industrial
    rifleman:  { age:2, name:'Lính Súng', hp:75,  dmg:38, atkSpeed:0.65, range:190, moveSpeed:45, cost:75,  type:'ranged', size:10, projSpeed:350 },
    grenadier: { age:2, name:'Lựu Đạn',   hp:65,  dmg:55, atkSpeed:0.4, range:140, moveSpeed:40, cost:100, type:'ranged', size:11, projSpeed:180, splash:30 },
    heavy:     { age:2, name:'Bộ Binh',   hp:180, dmg:28, atkSpeed:0.7, range:30,  moveSpeed:35, cost:110, type:'melee',  size:14 },
    // Age 3 - Modern
    marine:    { age:3, name:'Thuỷ Quân',  hp:110, dmg:45, atkSpeed:0.7, range:190, moveSpeed:50, cost:110, type:'ranged', size:10, projSpeed:400 },
    rocket:    { age:3, name:'Tên Lửa',    hp:85,  dmg:75, atkSpeed:0.3, range:220, moveSpeed:38, cost:160, type:'ranged', size:11, projSpeed:250, splash:35 },
    tank:      { age:3, name:'Xe Tăng',    hp:280, dmg:55, atkSpeed:0.55, range:160, moveSpeed:30, cost:220, type:'ranged', size:16, projSpeed:300 },
    // Age 4 - Future
    laser:     { age:4, name:'Laser',      hp:130, dmg:65, atkSpeed:0.8, range:210, moveSpeed:50, cost:170, type:'ranged', size:10, projSpeed:600 },
    mech:      { age:4, name:'Cơ Giáp',   hp:350, dmg:90, atkSpeed:0.65, range:100, moveSpeed:35, cost:280, type:'melee',  size:16 },
    plasma:    { age:4, name:'Plasma',     hp:450, dmg:110,atkSpeed:0.5, range:190, moveSpeed:25, cost:380, type:'ranged', size:18, projSpeed:350, splash:40 }
};

// Units per age for UI
const AGE_UNITS = [
    ['clubman', 'spear'],
    ['swordsman', 'archer', 'knight'],
    ['rifleman', 'grenadier', 'heavy'],
    ['marine', 'rocket', 'tank'],
    ['laser', 'mech', 'plasma']
];

// Upgrade definitions
const UPGRADE_DEFS = {
    income:  { name:'Kinh Tế',     icon:'💰', maxLv:5, costs:[100,220,450,900,1800],  effect:5 },
    dmg:     { name:'Sát Thương',  icon:'⚔️', maxLv:5, costs:[80,180,360,720,1440],   effect:0.12 },
    hp:      { name:'Máu',         icon:'❤️', maxLv:5, costs:[80,180,360,720,1440],   effect:0.12 },
    baseHp:  { name:'Căn Cứ',     icon:'🏰', maxLv:5, costs:[120,260,520,1040,2080],  effect:100 },
    turret:  { name:'Pháo',       icon:'🔫', maxLv:5, costs:[150,220,450,900,1800],  effect:0 }
};

// AI difficulty multipliers
const AI_DIFF = {
    easy:   { goldMul:0.6,  spawnDelay:2.5, upgradeChance:0.3, ageDelay:1.5 },
    normal: { goldMul:1.0,  spawnDelay:1.8, upgradeChance:0.5, ageDelay:1.0 },
    hard:   { goldMul:1.4,  spawnDelay:1.2, upgradeChance:0.7, ageDelay:0.7 },
    insane: { goldMul:2.0,  spawnDelay:0.7, upgradeChance:0.9, ageDelay:0.4 }
};

// Campaign stage definitions
const CAMPAIGN_STAGES = [];
for (let i = 0; i < 20; i++) {
    CAMPAIGN_STAGES.push({
        stage: i + 1,
        name: 'Stage ' + (i + 1),
        aiAge: Math.min(4, Math.floor(i / 4)),
        aiDifficulty: i < 5 ? 'easy' : i < 10 ? 'normal' : i < 15 ? 'hard' : 'insane',
        aiGoldBonus: i * 5
    });
}
