/**
 * Battle City - Game Constants
 */
const TILE = 16;
const SCALE = 2;
const CELL = TILE * SCALE; // 32px
const COLS = 26;
const ROWS = 26;
const MAP_W = COLS * CELL; // 832
const MAP_H = ROWS * CELL; // 832
const HUD_H = 48;
const CANVAS_W = MAP_W;
const CANVAS_H = MAP_H + HUD_H;

// ALL game coordinates use CANVAS space (y includes HUD_H offset)
// Map grid lookup: gridRow = Math.floor((y - HUD_H) / CELL), gridCol = Math.floor(x / CELL)

const TileType = {
    EMPTY: 0, BRICK: 1, STEEL: 2, WATER: 3, FOREST: 4, ICE: 5,
    EAGLE: 9, EAGLE_DEAD: 10, BASE_WALL: 11
};

const Dir = { UP: 0, RIGHT: 1, DOWN: 2, LEFT: 3 };
const EnemyType = { BASIC: 0, FAST: 1, POWER: 2, ARMOR: 3 };
const PowerupType = { STAR: 0, GRENADE: 1, HELMET: 2, SHOVEL: 3, TANK: 4, CLOCK: 5 };
const GameState = {
    MENU: 'menu', LEVEL_SELECT: 'levelSelect', PLAYING: 'playing', PAUSED: 'paused',
    LEVEL_START: 'levelStart', LEVEL_CLEAR: 'levelClear', GAME_OVER: 'gameOver',
    VICTORY: 'victory', EDITOR: 'editor', STATISTICS: 'statistics', SETTINGS: 'settings'
};
const AIType = { PATROL: 0, AGGRESSIVE: 1, BASE_HUNTER: 2, GUARD_BREAKER: 3 };
const BOSS_LEVELS = [10, 20, 30, 35];
