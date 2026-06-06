/**
 * Animal Kingdom Defense - Game Constants
 */
const W = 700, H = 500;
const ROWS = 5, COLS = 9;
const CELL_W = 60, CELL_H = 70;
const GRID_X = 80, GRID_Y = 60;
const HOUSE_X = 20;

const STARTING_SUN = 50;
const SUN_VALUE = 25;
const FALLING_SUN_INTERVAL = 10;
const FALLING_SUN_SPEED = 60;

// Animal Defender definitions
const PLANT_DEFS = {
    chicken:    { name:'Chicken Nest', cost:50,  cooldown:7.5,  hp:300,  sunInterval:24, unlocked:0 },
    monkey:     { name:'Monkey',       cost:100, cooldown:7.5,  hp:300,  damage:20, atkSpeed:1.5, unlocked:0 },
    bear:       { name:'Bear',         cost:50,  cooldown:30,   hp:4000, unlocked:0 },
    penguin:    { name:'Penguin',      cost:175, cooldown:7.5,  hp:300,  damage:20, atkSpeed:1.5, slow:0.5, unlocked:3 },
    pufferfish: { name:'Puffer Fish',  cost:150, cooldown:50,   hp:300,  damage:1800, radius:1.5, unlocked:5 },
    twinmonkey: { name:'Twin Monkey',  cost:200, cooldown:7.5,  hp:300,  damage:20, atkSpeed:1.5, shots:2, unlocked:8 },
    hedgehog:   { name:'Hedgehog',     cost:100, cooldown:7.5,  hp:300,  damage:20, atkSpeed:0.7, unlocked:10 }
};

const PLANT_ORDER = ['chicken','monkey','bear','penguin','pufferfish','twinmonkey','hedgehog'];

// Robot Invader definitions
const ZOMBIE_DEFS = {
    normal: { name:'Basic Robot',   hp:100, speed:20,  dps:100 },
    cone:   { name:'Scout Robot',   hp:200, speed:20,  dps:100, armor:'scout' },
    bucket: { name:'Heavy Robot',   hp:400, speed:20,  dps:100, armor:'heavy' },
    fast:   { name:'Speed Robot',   hp:50,  speed:40,  dps:100 },
    tank:   { name:'Mech Robot',    hp:800, speed:12,  dps:200 }
};

// Wave generation
function generateWave(num) {
    const list = [];
    const base = 2 + Math.floor(num * 1.2);
    list.push({ type:'normal', count:base });
    if (num >= 3) list.push({ type:'cone', count:Math.max(1, Math.floor(num/3)) });
    if (num >= 7) list.push({ type:'bucket', count:Math.max(1, Math.floor((num-5)/3)) });
    if (num >= 10) list.push({ type:'fast', count:Math.max(1, Math.floor((num-8)/2)) });
    if (num >= 15) list.push({ type:'tank', count:Math.max(1, Math.floor((num-13)/3)) });
    if (num % 10 === 0) { list.forEach(z => z.count = Math.floor(z.count * 1.5)); }
    return list;
}
