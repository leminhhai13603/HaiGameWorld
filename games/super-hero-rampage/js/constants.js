/**
 * SUPER HERO RAMPAGE - Game Constants
 */
const W = 960, H = 540;
const GROUND_Y = 420;
const GRAVITY = 1200;
const STAGE_SPEED = 60;

// Game states
const GS = { MENU:'menu', PLAYING:'playing', PAUSED:'paused', SHOP:'shop', GAMEOVER:'gameover', VICTORY:'victory' };

// Player base stats
const PLAYER_BASE = {
    hp: 100, maxHp: 100,
    damage: 15, comboDamage: 25,
    speed: 200, jumpForce: 500,
    energy: 100, maxEnergy: 100,
    energyRegen: 5,
    critChance: 0.1,
    xpMul: 1
};

// Combo definitions
const COMBOS = {
    punchPunchKick:   { name:'Punch Kick',       keys:['p','p','k'], damage:40,  unlock:0 },
    punchKickUpper:   { name:'Uppercut Combo',    keys:['p','k','k'], damage:55,  unlock:3 },
    dashPunch:        { name:'Dash Punch',        keys:['d','p'],     damage:35,  unlock:1 },
    airCombo:         { name:'Air Combo',         keys:['j','p','p'], damage:50,  unlock:2 },
    groundSlam:       { name:'Ground Slam',       keys:['d','k'],     damage:70,  unlock:5 },
    energyBurst:      { name:'Energy Burst',      keys:['p','p','p','k'], damage:90, unlock:8 },
    launcherCombo:    { name:'Launcher',          keys:['k','k','p'], damage:60,  unlock:6 },
    ultimateCombo:    { name:'Ultimate Combo',    keys:['p','k','p','k'], damage:120, unlock:10 },
};
const COMBO_ORDER = ['punchPunchKick','punchKickUpper','dashPunch','airCombo','groundSlam','energyBurst','launcherCombo','ultimateCombo'];

// Super powers
const POWERS = {
    energyBlast:   { name:'Energy Blast',   icon:'💥', damage:80,  cooldown:5,  cost:0,   unlock:0 },
    shockwave:     { name:'Shockwave',      icon:'🌊', damage:60,  cooldown:8,  cost:100, unlock:2 },
    dashStrike:    { name:'Dash Strike',     icon:'⚡', damage:70,  cooldown:6,  cost:150, unlock:4 },
    lightningPunch:{ name:'Lightning Punch', icon:'🤜', damage:100, cooldown:10, cost:200, unlock:6 },
    rocketJump:    { name:'Rocket Jump',     icon:'🚀', damage:50,  cooldown:7,  cost:150, unlock:3 },
    heroMode:      { name:'Hero Mode',       icon:'⭐', damage:0,   cooldown:30, cost:300, unlock:8, duration:10 },
    ultimateBeam:  { name:'Ultimate Beam',   icon:'🔥', damage:200, cooldown:20, cost:500, unlock:10 },
};
const POWER_ORDER = ['energyBlast','shockwave','dashStrike','lightningPunch','rocketJump','heroMode','ultimateBeam'];

// Enemy types
const ENEMY_TYPES = {
    streetRobot:   { name:'Street Robot',   hp:40,  damage:8,  speed:80,  xp:10, color:'#888',   size:20 },
    flyingDrone:   { name:'Flying Drone',   hp:25,  damage:6,  speed:120, xp:15, color:'#4AF',   size:15, flying:true },
    heavyMech:     { name:'Heavy Mech',     hp:120, damage:20, speed:40,  xp:30, color:'#666',   size:30 },
    shieldBot:     { name:'Shield Bot',     hp:80,  damage:12, speed:60,  xp:25, color:'#484',   size:22, shield:true },
    sniperBot:     { name:'Sniper Bot',     hp:35,  damage:25, speed:50,  xp:20, color:'#A44',   size:18, ranged:true },
    rocketBot:     { name:'Rocket Bot',     hp:50,  damage:30, speed:45,  xp:25, color:'#C64',   size:24, ranged:true },
    spiderMech:    { name:'Spider Mech',    hp:90,  damage:15, speed:100, xp:35, color:'#484',   size:26 },
    eliteCommander:{ name:'Elite Commander',hp:150, damage:25, speed:70,  xp:50, color:'#F80',   size:28 },
};

// Boss types
const BOSS_TYPES = {
    crusherMech:   { name:'Crusher Mech',    hp:500,  damage:30, speed:60,  xp:200, color:'#F44', size:50, attacks:['slam','charge','throw'] },
    tankCommander: { name:'Tank Commander',  hp:800,  damage:40, speed:40,  xp:350, color:'#48F', size:55, attacks:['cannon','missile','ram'] },
    warDrone:      { name:'War Drone',       hp:600,  damage:35, speed:100, xp:300, color:'#4F4', size:45, attacks:['laser','dive','bomb'] },
    titanWalker:   { name:'Titan Walker',    hp:1200, damage:50, speed:30,  xp:500, color:'#84F', size:65, attacks:['stomp','beam','minions'] },
    aiOverlord:    { name:'AI Overlord',     hp:2000, damage:60, speed:50,  xp:1000,color:'#F0F', size:70, attacks:['laser','shield','summon','beam'] },
};

// Weapon pickups
const WEAPONS = {
    pipe:        { name:'Pipe',        damage:25, duration:15, color:'#888' },
    bat:         { name:'Bat',         damage:30, duration:12, color:'#864' },
    hammer:      { name:'Hammer',      damage:45, duration:8,  color:'#666' },
    energyBlade: { name:'Energy Blade', damage:50, duration:10, color:'#4FF' },
    laserRifle:  { name:'Laser Rifle', damage:35, duration:8,  color:'#F44', ranged:true },
};

// Stages
const STAGES = [
    {
        id:1, name:'City Streets', bgColor:'#1a1a2e',
        waves: [
            { enemies:['streetRobot','streetRobot','streetRobot'], delay:2 },
            { enemies:['streetRobot','flyingDrone','streetRobot'], delay:3 },
            { enemies:['streetRobot','streetRobot','flyingDrone','streetRobot'], delay:2 },
        ],
        boss:'crusherMech',
        bgElements: [
            { type:'building', x:100, h:200, color:'#2a2a4e' },
            { type:'building', x:300, h:250, color:'#3a3a5e' },
            { type:'building', x:600, h:180, color:'#2a2a4e' },
            { type:'building', x:800, h:220, color:'#3a3a5e' },
        ]
    },
    {
        id:2, name:'Military Base', bgColor:'#1a2e1a',
        waves: [
            { enemies:['streetRobot','shieldBot','streetRobot'], delay:2 },
            { enemies:['sniperBot','streetRobot','shieldBot'], delay:3 },
            { enemies:['shieldBot','shieldBot','sniperBot','streetRobot'], delay:2 },
        ],
        boss:'tankCommander',
        bgElements: [
            { type:'wall', x:0, w:960, h:60, color:'#3a5a3a' },
            { type:'tower', x:200, h:150, color:'#4a6a4a' },
            { type:'tower', x:700, h:150, color:'#4a6a4a' },
        ]
    },
    {
        id:3, name:'Industrial Factory', bgColor:'#2e1a1a',
        waves: [
            { enemies:['heavyMech','streetRobot','streetRobot'], delay:3 },
            { enemies:['spiderMech','flyingDrone','heavyMech'], delay:2 },
            { enemies:['heavyMech','spiderMech','streetRobot','flyingDrone'], delay:2 },
        ],
        boss:'warDrone',
        bgElements: [
            { type:'pipe', x:50, h:300, color:'#644' },
            { type:'pipe', x:400, h:250, color:'#644' },
            { type:'pipe', x:800, h:280, color:'#644' },
            { type:'machine', x:200, h:100, color:'#864' },
            { type:'machine', x:600, h:120, color:'#864' },
        ]
    },
    {
        id:4, name:'Sky Fortress', bgColor:'#1a1a3e',
        waves: [
            { enemies:['flyingDrone','flyingDrone','rocketBot','flyingDrone'], delay:2 },
            { enemies:['rocketBot','eliteCommander','flyingDrone','flyingDrone'], delay:3 },
            { enemies:['eliteCommander','rocketBot','rocketBot','flyingDrone','flyingDrone'], delay:2 },
        ],
        boss:'titanWalker',
        bgElements: [
            { type:'platform', x:0, w:960, h:20, color:'#446' },
            { type:'tower', x:150, h:200, color:'#446' },
            { type:'tower', x:750, h:200, color:'#446' },
        ]
    },
    {
        id:5, name:'AI Citadel', bgColor:'#2e0a2e',
        waves: [
            { enemies:['eliteCommander','eliteCommander','shieldBot','rocketBot'], delay:2 },
            { enemies:['spiderMech','heavyMech','eliteCommander','eliteCommander'], delay:3 },
            { enemies:['eliteCommander','eliteCommander','eliteCommander','heavyMech','spiderMech'], delay:2 },
        ],
        boss:'aiOverlord',
        bgElements: [
            { type:'core', x:430, y:100, w:100, h:100, color:'#F0F' },
            { type:'wall', x:0, w:960, h:40, color:'#404' },
        ]
    },
];

// Shop items
const SHOP_ITEMS = [
    { id:'hpUp',      name:'Health +20',       cost:100, effect:{maxHp:20} },
    { id:'dmgUp',     name:'Damage +5',        cost:150, effect:{damage:5} },
    { id:'speedUp',   name:'Speed +20',        cost:120, effect:{speed:20} },
    { id:'energyUp',  name:'Energy +20',       cost:130, effect:{maxEnergy:20} },
    { id:'critUp',    name:'Crit +5%',         cost:200, effect:{critChance:0.05} },
    { id:'regenUp',   name:'Energy Regen +2',  cost:180, effect:{energyRegen:2} },
];

// XP required per level
function xpForLevel(lv) { return Math.floor(50 * Math.pow(lv, 1.5)); }
