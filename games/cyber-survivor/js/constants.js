/**
 * Cyber Survivor - Game Constants
 */
const W = 800, H = 600;

const PLAYER_BASE = {
    speed: 150, hp: 100, damage: 10, atkSpeed: 2, critChance: 0.05,
    projCount: 1, projSpeed: 350, atkRange: 250, atkCooldown: 0.5
};

const ENEMY_TYPES = {
    drone:  { name:'Drone',        hp:30,  speed:60,  dmg:5,  xp:10,  size:12, color:'#FF4444' },
    heavy:  { name:'Heavy Drone',  hp:80,  speed:40,  dmg:10, xp:25,  size:18, color:'#CC2222' },
    fast:   { name:'Fast Drone',   hp:15,  speed:120, dmg:3,  xp:8,   size:10, color:'#FF8844' },
    boss:   { name:'Boss Drone',   hp:1200,speed:35,  dmg:20, xp:300, size:35, color:'#FF0000' }
};

const UPGRADES = [
    { id:'damage',    name:'Sát Thương',   desc:'+20% sát thương',  icon:'⚔️', apply:p => { p.damage *= 1.2; } },
    { id:'atkSpeed',  name:'Tốc Đánh',     desc:'+15% tốc đánh',    icon:'⚡', apply:p => { p.atkSpeed *= 1.15; p.atkCooldown = 1/p.atkSpeed; } },
    { id:'moveSpeed', name:'Tốc Độ',        desc:'+10% tốc chạy',    icon:'🏃', apply:p => { p.speed *= 1.1; } },
    { id:'projCount', name:'Đạn',           desc:'+1 đạn',           icon:'🔫', apply:p => { p.projCount++; } },
    { id:'critChance',name:'Chí Mạng',     desc:'+5% chí mạng',     icon:'💥', apply:p => { p.critChance += 0.05; } },
    { id:'maxHp',     name:'Máu',           desc:'+20 máu tối đa',   icon:'❤️', apply:p => { p.maxHp += 20; p.hp = Math.min(p.hp + 20, p.maxHp); } },
    { id:'atkRange',  name:'Tầm Đánh',     desc:'+30 tầm đánh',     icon:'🎯', apply:p => { p.atkRange += 30; } }
];

function xpForLevel(lv) { return Math.floor(80 * Math.pow(1.15, lv - 1)); }

function getSpawnConfig(time) {
    const min = time / 60;
    return {
        interval: Math.max(0.3, 1.5 - min * 0.1),
        types: min < 1 ? ['drone'] :
               min < 2 ? ['drone','drone','fast'] :
               min < 3 ? ['drone','fast','heavy'] :
               ['drone','fast','heavy','heavy']
    };
}
