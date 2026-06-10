/**
 * Factory Empire - Game Constants
 */
const W = 960, H = 640;
const GRID_W = 30, GRID_H = 20;
const CELL = 32;
const MAP_OFFSET_X = 0, MAP_OFFSET_Y = 60;

// Game states
const GS = { LOADING:'loading', PLAYING:'playing', PAUSED:'paused', RESEARCH:'research', STATS:'stats', SETTINGS:'settings' };

// Resources
const RESOURCES = {
    ironOre:   { name:'Iron Ore',   icon:'🪨', color:'#8B7355', value:5 },
    copperOre: { name:'Copper Ore', icon:'🟤', color:'#B87333', value:6 },
    coal:      { name:'Coal',       icon:'⬛', color:'#333',    value:3 },
    stone:     { name:'Stone',      icon:'⬜', color:'#999',    value:2 },
};
const RESOURCE_ORDER = ['ironOre','copperOre','coal','stone'];

// Processed items
const ITEMS = {
    ironIngot:   { name:'Iron Ingot',   icon:'🔩', color:'#708090', value:15 },
    copperIngot: { name:'Copper Ingot', icon:'🟠', color:'#CD7F32', value:18 },
    steel:       { name:'Steel',        icon:'⚙️', color:'#4682B4', value:30 },
    wire:        { name:'Wire',         icon:'〰️', color:'#DAA520', value:20 },
    tools:       { name:'Tools',        icon:'🔧', color:'#C0C0C0', value:50 },
    circuits:    { name:'Circuits',     icon:'💚', color:'#00FF00', value:80 },
    machines:    { name:'Machines',     icon:'🏭', color:'#FFD700', value:150 },
    electronics: { name:'Electronics',  icon:'💻', color:'#00CED1', value:200 },
};
const ITEM_ORDER = ['ironIngot','copperIngot','steel','wire','tools','circuits','machines','electronics'];

// All transportable items
const ALL_ITEMS = { ...RESOURCES, ...ITEMS };

// Recipes: { inputs: {item: count}, outputs: {item: count}, time: seconds }
const RECIPES = {
    smeltIron:   { name:'Smelt Iron',   inputs:{ironOre:1,coal:1},    outputs:{ironIngot:1},   time:3 },
    smeltCopper: { name:'Smelt Copper', inputs:{copperOre:1,coal:1},  outputs:{copperIngot:1}, time:3 },
    makeSteel:   { name:'Make Steel',   inputs:{ironIngot:2,coal:2},  outputs:{steel:1},       time:5 },
    makeWire:    { name:'Make Wire',    inputs:{copperIngot:1},       outputs:{wire:2},        time:2 },
    makeTools:   { name:'Make Tools',   inputs:{ironIngot:2,steel:1}, outputs:{tools:1},       time:4 },
    makeCircuits:{ name:'Make Circuits',inputs:{wire:3,copperIngot:1},outputs:{circuits:1},    time:5 },
    makeMachines:{ name:'Make Machines',inputs:{steel:2,tools:1,circuits:1},outputs:{machines:1},time:8 },
    makeElectronics:{name:'Make Electronics',inputs:{circuits:2,wire:2},outputs:{electronics:1},time:6},
};
const RECIPE_ORDER = ['smeltIron','smeltCopper','makeSteel','makeWire','makeTools','makeCircuits','makeMachines','makeElectronics'];

// Buildings
const BUILDING_DEFS = {
    miner:     { name:'Miner',        icon:'⛏️', cost:100,  size:1, desc:'Extracts ore from deposits', color:'#8B4513',
                 outputItems:['ironOre','copperOre','coal','stone'], speed:1 },
    conveyor:  { name:'Conveyor',     icon:'➡️', cost:10,   size:1, desc:'Moves items', color:'#555', speed:2 },
    smelter:   { name:'Smelter',      icon:'🔥', cost:200,  size:1, desc:'Smelts ore into ingots', color:'#FF4500',
                 recipes:['smeltIron','smeltCopper'], speed:1 },
    workshop:  { name:'Workshop',     icon:'🔨', cost:300,  size:1, desc:'Crafts products', color:'#4169E1',
                 recipes:['makeWire','makeTools','makeCircuits'], speed:1 },
    factory:   { name:'Factory',      icon:'🏗️', cost:500,  size:2, desc:'Advanced manufacturing', color:'#8B0000',
                 recipes:['makeSteel','makeMachines','makeElectronics'], speed:1 },
    warehouse: { name:'Warehouse',    icon:'📦', cost:150,  size:2, desc:'Stores items', color:'#8B6914', capacity:50 },
    market:    { name:'Market',       icon:'🏪', cost:250,  size:2, desc:'Sells products for money', color:'#228B22',
                 sellRate:1 },
    powerCoal: { name:'Coal Gen',     icon:'⚡', cost:200,  size:1, desc:'Generates power from coal', color:'#FFD700',
                 powerGen:10, fuelType:'coal', fuelRate:0.5 },
    powerSolar:{ name:'Solar Panel',  icon:'☀️', cost:400,  size:1, desc:'Generates power from sun', color:'#FFD700',
                 powerGen:5 },
    researchLab:{name:'Research Lab', icon:'🔬', cost:500,  size:2, desc:'Generates research points', color:'#9370DB',
                 researchRate:1 },
};
const BUILDING_ORDER = ['miner','conveyor','smelter','workshop','factory','warehouse','market','powerCoal','powerSolar','researchLab'];

// Conveyor directions
const DIR = { UP:0, RIGHT:1, DOWN:2, LEFT:3 };
const DIR_DX = [0,1,0,-1];
const DIR_DY = [-1,0,1,0];

// Research tree
const RESEARCH_DEFS = {
    fastMiner:    { name:'Fast Mining',       desc:'+50% Miner speed', cost:10, time:30,  requires:[], effect:{minerSpeed:1.5} },
    fastConveyor: { name:'Fast Conveyors',    desc:'+50% Conveyor speed', cost:15, time:45, requires:[], effect:{conveyorSpeed:1.5} },
    efficientSmelt:{name:'Efficient Smelting',desc:'-25% Smelter fuel', cost:20, time:60,  requires:['fastMiner'], effect:{smelterEff:0.75} },
    autoSell:     { name:'Auto Selling',      desc:'Markets sell 2x faster', cost:25, time:60, requires:[], effect:{sellRate:2} },
    storageUp:    { name:'Storage Expansion',  desc:'+100% Warehouse capacity', cost:15, time:40, requires:[], effect:{warehouseCap:2} },
    advancedCraft:{ name:'Advanced Crafting',  desc:'Unlocks Factory', cost:30, time:90,  requires:['efficientSmelt'], effect:{unlockFactory:true} },
    powerGrid:    { name:'Power Grid',        desc:'Unlocks power buildings', cost:25, time:75, requires:[], effect:{unlockPower:true} },
    fastResearch: { name:'Fast Research',      desc:'+100% research speed', cost:40, time:120, requires:['advancedCraft'], effect:{researchSpeed:2} },
    megaStorage:  { name:'Mega Storage',       desc:'+200% Warehouse capacity', cost:50, time:150, requires:['storageUp','advancedCraft'], effect:{warehouseCap:3} },
    automation:   { name:'Full Automation',    desc:'All buildings +25% speed', cost:60, time:180, requires:['fastResearch'], effect:{allSpeed:1.25} },
};
const RESEARCH_ORDER = ['fastMiner','fastConveyor','efficientSmelt','autoSell','storageUp','advancedCraft','powerGrid','fastResearch','megaStorage','automation'];

// Map deposit types
const DEPOSIT_TYPES = ['ironOre','copperOre','coal','stone'];
