/**
 * Cyber Survivor Phase 4 - Balanced Constants
 * Weapon roles, tags, synergies, rarity
 */
const W = 800, H = 600;
const MAX_WEAPONS = 6, MAX_PASSIVES = 6, MAX_PETS = 3;
const PLAYER_BASE = { speed:150, hp:100, damage:10, atkSpeed:2, critChance:0.05, projCount:1, projSpeed:350, atkRange:250 };

// ─── CHARACTERS ───
const CHARACTERS = {
    vanguard: { name:'Vanguard',      desc:'+10% HP',                  icon:'🛡️', hpMul:1.1, dmgMul:1,    spdMul:1,   critAdd:0,    xpMul:1,    cdMul:1,    startWeapon:'blaster', unlock:0 },
    assassin: { name:'Assassin',      desc:'+25% Crit, -15% HP',       icon:'🗡️', hpMul:0.85,dmgMul:1,    spdMul:1,   critAdd:0.25, xpMul:1,    cdMul:1,    startWeapon:'blaster', unlock:10 },
    engineer: { name:'Engineer',      desc:'Bắt đầu với Orbit Drone',  icon:'🔧', hpMul:1,   dmgMul:1,    spdMul:1,   critAdd:0,    xpMul:1,    cdMul:1,    startWeapon:'orbit',   unlock:500 },
    heavy:    { name:'Heavy Gunner',  desc:'+25% DMG, -20% Speed',     icon:'🔫', hpMul:1,   dmgMul:1.25, spdMul:0.8, critAdd:0,    xpMul:1,    cdMul:1,    startWeapon:'blaster', unlock:1 },
    monk:     { name:'Cyber Monk',    desc:'+20% XP Gain',             icon:'🧘', hpMul:1,   dmgMul:1,    spdMul:1,   critAdd:0,    xpMul:1.2,  cdMul:1,    startWeapon:'blaster', unlock:20 },
    pilot:    { name:'Mech Pilot',    desc:'+30% HP, +15% Armor',      icon:'🤖', hpMul:1.3, dmgMul:1,    spdMul:0.9, critAdd:0,    xpMul:1,    cdMul:1,    startWeapon:'blaster', unlock:900 },
    hacker:   { name:'Quantum Hacker',desc:'-25% Cooldown',            icon:'💻', hpMul:0.9, dmgMul:1,    spdMul:1.1, critAdd:0,    xpMul:1,    cdMul:0.75, startWeapon:'blaster', unlock:100 }
};
const CHAR_ORDER = ['vanguard','assassin','engineer','heavy','monk','pilot','hacker'];

// ─── WEAPONS (Rebalanced) ───
const WEAPONS = {
    blaster:   { name:'Energy Blaster',   icon:'🔫', dmg:10,  cd:0.5, maxLv:5, type:'proj',   projSpd:350, evolve:'atkSpeed',  evoTo:'hyperBlaster',
        tags:['Balanced','Reliable'], role:'Starter', strong:'Mọi tình huống', weak:'Không chuyên', bestVs:'Nhóm nhỏ', worstVs:'—' },
    laser:     { name:'Laser Beam',       icon:'🔴', dmg:6,   cd:0.08,maxLv:5, type:'beam',   range:200,   evolve:'critChance',evoTo:'quantumBeam',
        tags:['Piercing','Crowd Control'], role:'CC', strong:'Địch xếp hàng', weak:'Sát thương đơn thấp', bestVs:'Nhóm lớn', worstVs:'Boss' },
    rocket:    { name:'Rocket Launcher',  icon:'🚀', dmg:30,  cd:1.0, maxLv:5, type:'rocket', projSpd:220, explodeR:80, evolve:'damage', evoTo:'nuke',
        tags:['AOE','Explosion','Burst'], role:'AOE Burst', strong:'Diệt nhóm lớn', weak:'Chậm, có thể miss', bestVs:'Nhóm lớn', worstVs:'Địch nhanh' },
    lightning: { name:'Lightning Strike',  icon:'⚡', dmg:18,  cd:0.7, maxLv:5, type:'chain',  chainCount:3, chainR:120, evolve:'cooldown', evoTo:'stormCall',
        tags:['Chain','Multi-Target'], role:'Chain DPS', strong:'Phủ diện rộng', weak:'Kém vs boss', bestVs:'Địch phân tán', worstVs:'Boss đơn' },
    orbit:     { name:'Orbit Drones',     icon:'🛸', dmg:5,   cd:0.04,maxLv:5, type:'orbit',  orbitR:80,  orbitCount:2, evolve:'moveSpeed', evoTo:'vortex',
        tags:['Defensive','Zone','Passive'], role:'Phòng thủ', strong:'Bảo vệ liên tục', weak:'Tầm ngắn', bestVs:'Địch áp sát', worstVs:'Địch xa' },
    saw:       { name:'Energy Saw',       icon:'⚙️', dmg:10,  cd:0.03,maxLv:5, type:'saw',    sawR:60, evolve:'projCount', evoTo:'sawStorm',
        tags:['AOE','Zone','Melee'], role:'Vùng sát thương', strong:'Diệt địch áp sát', weak:'Phải đứng gần', bestVs:'Địch đông', worstVs:'Địch ranged' },
    plasma:    { name:'Plasma Cannon',    icon:'💜', dmg:70,  cd:1.8, maxLv:5, type:'proj',   projSpd:200, evolve:'damage', evoTo:'megaPlasma',
        tags:['Boss Killer','Single Target','Heavy'], role:'Diệt Boss', strong:'Sát thương cực mạnh', weak:'Rất chậm', bestVs:'Boss', worstVs:'Địch đông nhanh' },
    ice:       { name:'Ice Launcher',     icon:'❄️', dmg:10,  cd:0.5, maxLv:5, type:'proj',   projSpd:300, slow:0.5, slowDur:2, evolve:'cooldown', evoTo:'absoluteZero',
        tags:['Crowd Control','Slow','Utility'], role:'CC', strong:'Làm chậm diện rộng', weak:'DPS thấp', bestVs:'Địch nhanh', worstVs:'Boss' },
    missiles:  { name:'Nano Missiles',    icon:'🎯', dmg:12,  cd:0.6, maxLv:5, type:'homing', projSpd:250, evolve:'atkSpeed', evoTo:'swarm',
        tags:['Auto-Track','Reliable','Easy'], role:'Tự dẫn', strong:'Dễ dùng, không miss', weak:'DPS trung bình', bestVs:'Địch di chuyển', worstVs:'—' }
};
const WEAPON_ORDER = ['blaster','laser','rocket','lightning','orbit','saw','plasma','ice','missiles'];

// ─── PASSIVES ───
const PASSIVES = {
    damage:     { name:'Damage Module',     icon:'⚔️', maxLv:5, tags:['Damage'], desc:'+15% sát thương mỗi cấp' },
    atkSpeed:   { name:'Speed Chip',        icon:'⚡', maxLv:5, tags:['Speed'], desc:'+12% tốc đánh mỗi cấp' },
    moveSpeed:  { name:'Move Booster',      icon:'🏃', maxLv:5, tags:['Mobility'], desc:'+8% tốc chạy mỗi cấp' },
    critChance: { name:'Critical Core',     icon:'💥', maxLv:5, tags:['Crit'], desc:'+5% chí mạng mỗi cấp' },
    shield:     { name:'Shield Generator',  icon:'🛡️', maxLv:5, tags:['Defense'], desc:'+10% giảm sát thương mỗi cấp' },
    magnet:     { name:'Magnet Core',       icon:'🧲', maxLv:5, tags:['Utility'], desc:'+25% phạm vi thu mỗi cấp' },
    cooldown:   { name:'Cooldown Reducer',  icon:'⏱️', maxLv:5, tags:['Speed'], desc:'-8% hồi chiêu mỗi cấp' },
    maxHp:      { name:'Health Booster',    icon:'❤️', maxLv:5, tags:['Defense'], desc:'+20 máu mỗi cấp' },
    xpGain:     { name:'XP Amplifier',      icon:'📈', maxLv:5, tags:['Progression'], desc:'+15% XP mỗi cấp' },
    projCount:  { name:'Proj Amplifier',    icon:'🔫', maxLv:3, tags:['Damage','Scale'], desc:'+1 đạn mỗi cấp' }
};
const PASSIVE_ORDER = ['damage','atkSpeed','moveSpeed','critChance','shield','magnet','cooldown','maxHp','xpGain','projCount'];

// ─── SYNERGIES ───
const SYNERGIES = {
    blaster:  ['atkSpeed','damage','projCount'],
    laser:    ['critChance','cooldown','damage'],
    rocket:   ['damage','projCount','atkSpeed'],
    lightning:['cooldown','damage','atkSpeed'],
    orbit:    ['moveSpeed','damage','shield'],
    saw:      ['moveSpeed','damage','shield'],
    plasma:   ['damage','critChance','maxHp'],
    ice:      ['cooldown','atkSpeed','magnet'],
    missiles: ['atkSpeed','damage','projCount']
};

// ─── EVOLUTIONS ───
const EVOLUTIONS = {
    hyperBlaster:  { name:'Hyper Blaster',   icon:'⚡', dmg:16, cd:0.18, tags:['Rapid Fire','Speed'] },
    quantumBeam:   { name:'Quantum Beam',     icon:'🌟', dmg:12, cd:0.05, critMul:3, tags:['Piercing','Crit','AOE'] },
    nuke:          { name:'Nuclear Launcher',  icon:'☢️', dmg:100, cd:1.3, explodeR:130, tags:['AOE','Nuke','Burst'] },
    stormCall:     { name:'Storm Caller',      icon:'🌩️', dmg:30, cd:0.4, chainCount:5, tags:['Chain','AOE','Crowd Control'] },
    vortex:        { name:'Vortex Drones',     icon:'🌀', dmg:10, orbitR:110, orbitCount:4, tags:['Zone','Defensive','AOE'] },
    sawStorm:      { name:'Saw Storm',         icon:'💀', dmg:16, sawR:90, tags:['Zone','AOE','Melee'] },
    megaPlasma:    { name:'Mega Cannon',       icon:'💜', dmg:180, cd:2.2, tags:['Boss Killer','Heavy','Nuke'] },
    absoluteZero:  { name:'Absolute Zero',     icon:'🧊', dmg:18, cd:0.35, slow:0.8, slowDur:3.5, tags:['CC','Slow','Freeze'] },
    swarm:         { name:'Nano Swarm',        icon:'🐝', dmg:18, cd:0.25, projCount:4, tags:['Homing','Mass','Auto'] }
};

// ─── PETS ───
const PETS = {
    attack:  { name:'Attack Drone',  desc:'Bắn kẻ thù',      icon:'🔫', behavior:'attack',  baseDmg:5,  baseCd:1.0 },
    heal:    { name:'Heal Drone',    desc:'Hồi máu',          icon:'💚', behavior:'heal',    healRate:1.5 },
    shield:  { name:'Shield Drone',  desc:'Chặn sát thương',  icon:'🛡️', behavior:'shield',  shieldChance:0.08 },
    xp:      { name:'XP Drone',      desc:'Thu hút XP',      icon:'📈', behavior:'xp',      attractRange:80 },
    missile: { name:'Missile Drone', desc:'Tên lửa tự dẫn',  icon:'🚀', behavior:'missile', baseDmg:12, baseCd:2.0 }
};
const PET_ORDER = ['attack','heal','shield','xp','missile'];

// ─── ULTIMATES ───
const ULTIMATES = {
    vanguard: { name:'Energy Nova',   desc:'Nổ năng lượng diện rộng', icon:'💥', cd:60, chargeRate:1,  effect:'nova',    dmg:200, radius:200 },
    assassin: { name:'Shadow Burst',  desc:'Bất tử + chí mạng 100%',  icon:'👤', cd:45, chargeRate:1.2,effect:'shadow',  dur:5 },
    engineer: { name:'Drone Swarm',   desc:'Triệu hồi drone',          icon:'🛸', cd:50, chargeRate:1,  effect:'swarm',   count:8, dur:10 },
    heavy:    { name:'Bullet Storm',  desc:'Bão đạn',                  icon:'🌧️', cd:55, chargeRate:0.8,effect:'storm',   dur:6, atkSpeedMul:5 },
    monk:     { name:'XP Surge',      desc:'XP cực lớn',              icon:'🌟', cd:70, chargeRate:0.6,effect:'xpSurge', xpAmount:500 },
    pilot:    { name:'Overdrive',     desc:'Bất tử + sát thương x3',  icon:'⚡', cd:60, chargeRate:1,  effect:'overdrive',dur:8, dmgMul:3 },
    hacker:   { name:'Time Slow',     desc:'Làm chậm thời gian',      icon:'⏱️', cd:40, chargeRate:1.5,effect:'timeSlow', slowMul:0.2, dur:6 }
};

// ─── RELICS ───
const RELICS = {
    ancientCore:   { name:'Ancient Core',   desc:'+15% sát thương', icon:'🔮', effect:'damage',    value:0.15 },
    quantumChip:   { name:'Quantum Chip',   desc:'-20% hồi chiêu', icon:'💎', effect:'cooldown',   value:0.20 },
    dragonBattery: { name:'Dragon Battery', desc:'+100 HP',         icon:'🔋', effect:'maxHp',      value:100 },
    neuralMatrix:  { name:'Neural Matrix',  desc:'+30% XP',         icon:'🧠', effect:'xpGain',     value:0.30 },
    voidEngine:    { name:'Void Engine',    desc:'+20% tốc chạy',   icon:'🌀', effect:'moveSpeed',  value:0.20 }
};
const RELIC_ORDER = ['ancientCore','quantumChip','dragonBattery','neuralMatrix','voidEngine'];

// ─── RARITY ───
const RARITY = {
    common:    { name:'Common',    color:'#AAAAAA', glow:'none',      weight:50 },
    rare:      { name:'Rare',      color:'#4488FF', glow:'#4488FF',   weight:25 },
    epic:      { name:'Epic',      color:'#AA44FF', glow:'#AA44FF',   weight:15 },
    legendary: { name:'Legendary', color:'#FF8800', glow:'#FF8800',   weight:8 },
    mythic:    { name:'Mythic',    color:'#FF4444', glow:'#FF0000',   weight:2 }
};

function getRarity() {
    const r = Math.random() * 100;
    if (r < 2) return 'mythic';
    if (r < 10) return 'legendary';
    if (r < 25) return 'epic';
    if (r < 50) return 'rare';
    return 'common';
}

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
    warMech:   { name:'War Mech',       hp:200,  speed:25,  dmg:20, xp:60,  size:22, color:'#880000' },
    teleport:  { name:'Teleport Bot',   hp:50,   speed:80,  dmg:8,  xp:20,  size:12, color:'#8800FF', teleport:true },
    reflect:   { name:'Reflect Bot',    hp:100,  speed:50,  dmg:10, xp:30,  size:15, color:'#00FF88', reflect:true },
    emp:       { name:'EMP Bot',        hp:60,   speed:60,  dmg:6,  xp:18,  size:13, color:'#0088FF', emp:true },
    nanoHive:  { name:'Nano Hive',      hp:150,  speed:30,  dmg:5,  xp:40,  size:20, color:'#FF8800', spawns:true },
    hunter:    { name:'Hunter Drone',   hp:40,   speed:150, dmg:12, xp:25,  size:11, color:'#FF0088', hunter:true },
    voidWalk:  { name:'Void Walker',    hp:70,   speed:70,  dmg:10, xp:22,  size:14, color:'#440088', phase:true }
};

const ELITE_TYPES = {
    elite_drone:   { base:'drone',   hpMul:3, spdMul:1.3, xpMul:3, color:'#FF0000', glow:'#FF4444' },
    elite_heavy:   { base:'heavy',   hpMul:3, spdMul:1.0, xpMul:3, color:'#FF2200', glow:'#FF6644', shoots:true },
    elite_fast:    { base:'fast',    hpMul:2, spdMul:1.5, xpMul:3, color:'#FF4400', glow:'#FFAA44' },
    elite_warMech: { base:'warMech', hpMul:4, spdMul:1.0, xpMul:4, color:'#FF0044', glow:'#FF4488', shoots:true }
};

const BOSS_TYPES = {
    mechCrusher:  { name:'Mecha Crusher',  hp:2500,  speed:45, dmg:25, xp:500,  size:45, color:'#FF6600', time:180 },
    plasmaTitan:  { name:'Plasma Titan',   hp:4000,  speed:30, dmg:20, xp:800,  size:55, color:'#8800FF', time:360, shoots:true },
    cyberDragon:  { name:'Cyber Dragon',   hp:6000,  speed:50, dmg:30, xp:1200, size:50, color:'#00FF88', time:600, shoots:true, flies:true },
    omegaCore:    { name:'Omega Core',     hp:10000, speed:35, dmg:35, xp:2000, size:65, color:'#FF0044', time:900, shoots:true, phases:3 },
    titanMech:    { name:'Titan Mech',     hp:15000, speed:40, dmg:40, xp:3000, size:70, color:'#FF8800', time:1200, shoots:true, phases:3 },
    voidEmperor:  { name:'Void Emperor',   hp:20000, speed:45, dmg:45, xp:5000, size:75, color:'#8800FF', time:1500, shoots:true, phases:4 }
};

const EVENTS = [
    { id:'rush',       name:'Enemy Rush',      desc:'Địch tràn ngập!',  icon:'🏃', dur:15, effect:'rush' },
    { id:'doubleXp',   name:'Double XP',       desc:'XP x2!',           icon:'📈', dur:20, effect:'doubleXp' },
    { id:'overload',   name:'Weapon Overload',  desc:'Tấn công nhanh!', icon:'⚡', dur:15, effect:'overload' },
    { id:'meteors',    name:'Meteor Storm',     desc:'Mưa thiên thạch!', icon:'☄️', dur:12, effect:'meteors' },
    { id:'powerSurge', name:'Power Surge',      desc:'Sát thương x2!',  icon:'💪', dur:10, effect:'powerSurge' }
];

const ENDGAME_MODES = {
    normal:    { name:'Normal',    desc:'Chơi thường',       icon:'🎮' },
    bossRush:  { name:'Boss Rush', desc:'Đánh tất cả boss',  icon:'👑' },
    endless:   { name:'Endless',   desc:'Sống sót vô hạn',   icon:'♾️' },
    nightmare: { name:'Nightmare', desc:'Cực khó',           icon:'💀' },
    chaos:     { name:'Chaos',     desc:'Ngẫu nhiên',        icon:'🎲' }
};
const MODE_ORDER = ['normal','bossRush','endless','nightmare','chaos'];

const DAILY_MODIFIERS = [
    { name:'Double Enemies', desc:'Gấp đôi kẻ thù', icon:'👥', effect:'doubleEnemies' },
    { name:'Half HP',        desc:'Máu giảm một nửa',icon:'💔', effect:'halfHp' },
    { name:'Infinite Crit',  desc:'Chí mạng 100%',   icon:'💥', effect:'infiniteCrit' },
    { name:'Boss Rush',      desc:'Boss mỗi 2 phút', icon:'👹', effect:'bossRush' },
    { name:'Speed Run',      desc:'Mọi thứ nhanh x2',icon:'⚡', effect:'speedRun' }
];

const META_UPGRADES = {
    damage:    { name:'Sát Thương',    icon:'⚔️', maxLv:5, cost:[10,25,50,100,200] },
    health:    { name:'Máu',           icon:'❤️', maxLv:5, cost:[10,25,50,100,200] },
    xpGain:    { name:'XP',            icon:'📈', maxLv:5, cost:[15,30,60,120,240] },
    pickup:    { name:'Thu Thập',      icon:'🧲', maxLv:5, cost:[10,20,40,80,160] },
    critChance:{ name:'Chí Mạng',     icon:'💥', maxLv:5, cost:[20,40,80,160,320] }
};
const META_ORDER = ['damage','health','xpGain','pickup','critChance'];

function xpForLevel(lv) { return Math.floor(80 * Math.pow(1.15, lv - 1)); }

function getSpawnConfig(time, mode) {
    const min = time / 60;
    const mult = mode === 'nightmare' ? 1.5 : mode === 'chaos' ? 1.3 : 1;
    const types = ['drone'];
    if (min >= 0.5) types.push('fast');
    if (min >= 1.5) types.push('heavy','spider');
    if (min >= 2.5) types.push('flying','exploder');
    if (min >= 4) types.push('shield','sniper');
    if (min >= 6) types.push('cloaked','warMech');
    if (min >= 8) types.push('teleport','hunter');
    if (min >= 10) types.push('reflect','emp','nanoHive','voidWalk');
    return { interval: Math.max(0.1, (1.2 - min * 0.06) / mult), types };
}

function getDailyModifiers() {
    const seed = new Date().toISOString().slice(0, 10);
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    const idx = Math.abs(hash) % DAILY_MODIFIERS.length;
    return [DAILY_MODIFIERS[idx]];
}
