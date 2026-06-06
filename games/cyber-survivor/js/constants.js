/**
 * Cyber Survivor Phase 2 - Complete Game Constants
 */
const W = 800, H = 600;
const MAX_WEAPONS = 6, MAX_PASSIVES = 6;
const PLAYER_BASE = { speed:150, hp:100, damage:10, atkSpeed:2, critChance:0.05, projCount:1, projSpeed:350, atkRange:250 };

// ─── WEAPONS ───
const WEAPONS = {
    blaster:   { name:'Energy Blaster',   desc:'Bắn năng lượng',         icon:'🔫', dmg:10,  cd:0.5, maxLv:8, type:'proj',   projSpd:350, evolve:'atkSpeed',  evoTo:'hyperBlaster' },
    laser:     { name:'Laser Beam',       desc:'Tia laser xuyên thấu',  icon:'🔴', dmg:8,   cd:0.1, maxLv:8, type:'beam',   range:200,   evolve:'critChance',evoTo:'quantumBeam' },
    rocket:    { name:'Rocket Launcher',  desc:'Tên lửa nổ diện rộng',  icon:'🚀', dmg:35,  cd:1.2, maxLv:8, type:'rocket', projSpd:200, explodeR:80, evolve:'damage', evoTo:'nuke' },
    lightning: { name:'Lightning Strike',  desc:'Sét đánh lan',           icon:'⚡', dmg:20,  cd:0.8, maxLv:8, type:'chain',  chainCount:3, chainR:120, evolve:'cooldown', evoTo:'stormCall' },
    orbit:     { name:'Orbit Drones',     desc:'Drone xoay quanh',       icon:'🛸', dmg:6,   cd:0.05,maxLv:8, type:'orbit',  orbitR:80,  orbitCount:2, evolve:'moveSpeed', evoTo:'vortex' },
    saw:       { name:'Energy Saw',       desc:'Lưỡi cưa xoay',          icon:'⚙️', dmg:12,  cd:0.03,maxLv:8, type:'saw',    sawR:60, evolve:'projCount', evoTo:'sawStorm' },
    plasma:    { name:'Plasma Cannon',    desc:'Pháo plasma cực mạnh',   icon:'💜', dmg:80,  cd:2.0, maxLv:8, type:'proj',   projSpd:200, evolve:'damage', evoTo:'megaPlasma' },
    ice:       { name:'Ice Launcher',     desc:'Đóng băng kẻ thù',       icon:'❄️', dmg:12,  cd:0.6, maxLv:8, type:'proj',   projSpd:300, slow:0.5, slowDur:2, evolve:'cooldown', evoTo:'absoluteZero' },
    missiles:  { name:'Nano Missiles',    desc:'Tên lửa tự dẫn đường',    icon:'🎯', dmg:15,  cd:0.7, maxLv:8, type:'homing', projSpd:250, evolve:'atkSpeed', evoTo:'swarm' }
};
const WEAPON_ORDER = ['blaster','laser','rocket','lightning','orbit','saw','plasma','ice','missiles'];

// ─── PASSIVES ───
const PASSIVES = {
    damage:     { name:'Damage Module',     desc:'+15% sát thương',   icon:'⚔️', maxLv:5 },
    atkSpeed:   { name:'Speed Chip',        desc:'+12% tốc đánh',     icon:'⚡', maxLv:5 },
    moveSpeed:  { name:'Move Booster',      desc:'+8% tốc chạy',      icon:'🏃', maxLv:5 },
    critChance: { name:'Critical Core',     desc:'+5% chí mạng',      icon:'💥', maxLv:5 },
    shield:     { name:'Shield Generator',  desc:'+10% giảm sát thương',icon:'🛡️', maxLv:5 },
    magnet:     { name:'Magnet Core',       desc:'+25% phạm vi thu',  icon:'🧲', maxLv:5 },
    cooldown:   { name:'Cooldown Reducer',  desc:'-8% hồi chiêu',     icon:'⏱️', maxLv:5 },
    maxHp:      { name:'Health Booster',    desc:'+20 máu',           icon:'❤️', maxLv:5 },
    xpGain:     { name:'XP Amplifier',      desc:'+15% XP',           icon:'📈', maxLv:5 },
    projCount:  { name:'Proj Amplifier',    desc:'+1 đạn',            icon:'🔫', maxLv:3 }
};
const PASSIVE_ORDER = ['damage','atkSpeed','moveSpeed','critChance','shield','magnet','cooldown','maxHp','xpGain','projCount'];

// ─── EVOLUTIONS ───
const EVOLUTIONS = {
    hyperBlaster:  { name:'Hyper Blaster',   icon:'⚡', dmg:18, cd:0.15, desc:'Bắn cực nhanh' },
    quantumBeam:   { name:'Quantum Beam',     icon:'🌟', dmg:15, cd:0.05, desc:'Laser chí mạng', critMul:3 },
    nuke:          { name:'Nuclear Launcher',  icon:'☢️', dmg:120, cd:1.5, explodeR:140, desc:'Nổ hủy diệt' },
    stormCall:     { name:'Storm Caller',      icon:'🌩️', dmg:35, cd:0.5, chainCount:6, desc:'Bão sét' },
    vortex:        { name:'Vortex Drones',     icon:'🌀', dmg:12, orbitR:120, orbitCount:5, desc:'Xoáy hủy diệt' },
    sawStorm:      { name:'Saw Storm',         icon:'💀', dmg:20, sawR:100, desc:'Bão cưa' },
    megaPlasma:    { name:'Mega Cannon',       icon:'💜', dmg:200, cd:2.5, desc:'Pháo khổng lồ' },
    absoluteZero:  { name:'Absolute Zero',     icon:'🧊', dmg:20, cd:0.4, slow:0.8, slowDur:4, desc:'Đóng băng tuyệt đối' },
    swarm:         { name:'Nano Swarm',        icon:'🐝', dmg:20, cd:0.3, projCount:4, desc:'Đàn tên lửa' }
};

// ─── ENEMIES ───
const ENEMY_TYPES = {
    drone:     { name:'Drone',          hp:30,   speed:60,  dmg:5,  xp:10,  size:12, color:'#FF4444' },
    heavy:     { name:'Heavy Drone',    hp:80,   speed:40,  dmg:10, xp:25,  size:18, color:'#CC2222' },
    fast:      { name:'Fast Drone',     hp:15,   speed:120, dmg:3,  xp:8,   size:10, color:'#FF8844' },
    flying:    { name:'Flying Drone',   hp:25,   speed:80,  dmg:6,  xp:12,  size:11, color:'#FF44FF' },
    spider:    { name:'Spider Bot',     hp:40,   speed:70,  dmg:8,  xp:15,  size:14, color:'#44FF44' },
    shield:    { name:'Shield Bot',     hp:120,  speed:35,  dmg:12, xp:30,  size:16, color:'#4488FF' },
    exploder:  { name:'Exploder',       hp:20,   speed:90,  dmg:25, xp:20,  size:13, color:'#FF8800', explode:true },
    sniper:    { name:'Sniper Bot',     hp:25,   speed:30,  dmg:15, xp:18,  size:12, color:'#FF00FF', ranged:true },
    cloaked:   { name:'Cloaked Bot',    hp:35,   speed:75,  dmg:10, xp:22,  size:11, color:'#888888', cloak:true },
    warMech:   { name:'War Mech',       hp:200,  speed:25,  dmg:20, xp:60,  size:22, color:'#880000' }
};

// ─── ELITE VARIANTS ───
const ELITE_TYPES = {
    elite_drone:   { base:'drone',   hpMul:3, spdMul:1.3, xpMul:3, color:'#FF0000', glow:'#FF4444' },
    elite_heavy:   { base:'heavy',   hpMul:3, spdMul:1.0, xpMul:3, color:'#FF2200', glow:'#FF6644', shoots:true },
    elite_fast:    { base:'fast',    hpMul:2, spdMul:1.5, xpMul:3, color:'#FF4400', glow:'#FFAA44' },
    elite_warMech: { base:'warMech', hpMul:4, spdMul:1.0, xpMul:4, color:'#FF0044', glow:'#FF4488', shoots:true }
};

// ─── BOSSES ───
const BOSS_TYPES = {
    mechCrusher: { name:'Mecha Crusher',  hp:2500, speed:45, dmg:25, xp:500,  size:45, color:'#FF6600', time:180 },
    plasmaTitan: { name:'Plasma Titan',   hp:4000, speed:30, dmg:20, xp:800,  size:55, color:'#8800FF', time:360, shoots:true },
    cyberDragon: { name:'Cyber Dragon',   hp:6000, speed:50, dmg:30, xp:1200, size:50, color:'#00FF88', time:600, shoots:true, flies:true },
    omegaCore:   { name:'Omega Core',     hp:10000,speed:35, dmg:35, xp:2000, size:65, color:'#FF0044', time:900, shoots:true, phases:3 }
};

// ─── EVENTS ───
const EVENTS = [
    { id:'rush',       name:'Enemy Rush',      desc:'Địch tràn ngập!',  icon:'🏃', dur:15, effect:'rush' },
    { id:'doubleXp',   name:'Double XP',       desc:'XP x2!',           icon:'📈', dur:20, effect:'doubleXp' },
    { id:'overload',   name:'Weapon Overload',  desc:'Tấn công nhanh!', icon:'⚡', dur:15, effect:'overload' },
    { id:'meteors',    name:'Meteor Storm',     desc:'Mưa thiên thạch!', icon:'☄️', dur:12, effect:'meteors' },
    { id:'powerSurge', name:'Power Surge',      desc:'Sát thương x2!',  icon:'💪', dur:10, effect:'powerSurge' }
];

// ─── META PROGRESSION ───
const META_UPGRADES = {
    damage:    { name:'Sát Thương',    desc:'+5% sát thương',   icon:'⚔️', maxLv:5, cost:[10,25,50,100,200] },
    health:    { name:'Máu',           desc:'+10 máu',          icon:'❤️', maxLv:5, cost:[10,25,50,100,200] },
    xpGain:    { name:'XP',            desc:'+10% XP',          icon:'📈', maxLv:5, cost:[15,30,60,120,240] },
    pickup:    { name:'Thu Thập',      desc:'+15% phạm vi',     icon:'🧲', maxLv:5, cost:[10,20,40,80,160] },
    critChance:{ name:'Chí Mạng',     desc:'+3% chí mạng',     icon:'💥', maxLv:5, cost:[20,40,80,160,320] }
};
const META_ORDER = ['damage','health','xpGain','pickup','critChance'];

function xpForLevel(lv) { return Math.floor(80 * Math.pow(1.15, lv - 1)); }

function getSpawnConfig(time) {
    const min = time / 60;
    const types = ['drone'];
    if (min >= 0.5) types.push('fast');
    if (min >= 1.5) types.push('heavy','spider');
    if (min >= 2.5) types.push('flying','exploder');
    if (min >= 4) types.push('shield','sniper');
    if (min >= 6) types.push('cloaked','warMech');
    return { interval: Math.max(0.15, 1.2 - min * 0.06), types };
}
