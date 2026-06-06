/**
 * Animal Kingdom Defense - Game Constants
 */
const W = 700, H = 500;
const ROWS = 5, COLS = 9;
const CELL_W = 60, CELL_H = 70;
const GRID_X = 80, GRID_Y = 60;
const HOUSE_X = 20;

const STARTING_SUN = 75;
const SUN_VALUE = 25;
const FALLING_SUN_INTERVAL = 10;
const FALLING_SUN_SPEED = 60;

// Animal Defender definitions
const PLANT_DEFS = {
    chicken:    { name:'Chicken Nest', cost:50,  cooldown:7.5,  hp:300,  sunInterval:20, unlocked:0 },
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
    // Early waves: fewer enemies to let player build up
    let base;
    if (num <= 2) {
        base = num; // wave 1: 1 robot, wave 2: 2 robots
    } else if (num <= 5) {
        base = 2 + Math.floor((num - 2) * 0.8); // wave 3-5: 2-4 robots
    } else {
        base = 4 + Math.floor((num - 5) * 1.0); // wave 6+: gradual increase
    }
    list.push({ type:'normal', count:base });
    if (num >= 4) list.push({ type:'cone', count:Math.max(1, Math.floor((num-2)/4)) });
    if (num >= 8) list.push({ type:'bucket', count:Math.max(1, Math.floor((num-6)/3)) });
    if (num >= 11) list.push({ type:'fast', count:Math.max(1, Math.floor((num-9)/2)) });
    if (num >= 16) list.push({ type:'tank', count:Math.max(1, Math.floor((num-14)/3)) });
    if (num % 10 === 0) { list.forEach(z => z.count = Math.floor(z.count * 1.5)); }
    return list;
}
