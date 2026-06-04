/**
 * Battle City - Level Manager (35 Levels)
 * Map data: 26x26 grid
 * 0=empty, 1=brick, 2=steel, 3=water, 4=forest, 5=ice
 */
const LevelManager = (() => {
    // Helper: create a base layout with walls around eagle
    function baseLayout(brickDensity, steelChance, waterChance) {
        const map = [];
        for (let r = 0; r < ROWS; r++) {
            map[r] = [];
            for (let c = 0; c < COLS; c++) map[r][c] = 0;
        }
        // Scatter random tiles
        for (let r = 2; r < ROWS - 4; r++) {
            for (let c = 0; c < COLS; c++) {
                if (Math.random() < brickDensity) {
                    map[r][c] = 1;
                    if (Math.random() < steelChance) map[r][c] = 2;
                    if (Math.random() < waterChance) map[r][c] = 3;
                }
            }
        }
        // Clear spawn points
        clearSpawn(map, 0, 0); clearSpawn(map, 0, 12); clearSpawn(map, 0, 24);
        // Clear player spawn
        clearSpawn(map, 24, 8); clearSpawn(map, 24, 16);
        return map;
    }

    function clearSpawn(map, r, c) {
        for (let dr = 0; dr < 2; dr++)
            for (let dc = 0; dc < 2; dc++)
                if (r + dr < ROWS && c + dc < COLS) map[r + dr][c + dc] = 0;
    }

    function addWalls(map, r, c, w, h, type) {
        for (let dr = 0; dr < h; dr++)
            for (let dc = 0; dc < w; dc++)
                if (r + dr < ROWS && c + dc < COLS) map[r + dr][c + dc] = type;
    }

    // Enemy definitions per level: [basic, fast, power, armor]
    const LEVEL_ENEMIES = [
        [20,0,0,0],     // 1
        [15,5,0,0],     // 2
        [12,5,3,0],     // 3
        [10,5,3,2],     // 4
        [8,5,5,2],      // 5
        [8,5,5,2],      // 6
        [6,5,5,4],      // 7
        [5,5,5,5],      // 8
        [4,5,5,6],      // 9
        [4,4,4,8],      // 10 (boss)
        [3,5,5,7],      // 11
        [3,4,5,8],      // 12
        [2,4,5,9],      // 13
        [2,4,4,10],     // 14
        [2,3,4,11],     // 15
        [2,3,4,11],     // 16
        [2,3,3,12],     // 17
        [1,3,3,13],     // 18
        [1,3,3,13],     // 19
        [1,2,3,14],     // 20 (boss)
        [1,2,3,14],     // 21
        [1,2,3,14],     // 22
        [0,2,3,15],     // 23
        [0,2,3,15],     // 24
        [0,2,2,16],     // 25
        [0,2,2,16],     // 26
        [0,1,2,17],     // 27
        [0,1,2,17],     // 28
        [0,1,2,17],     // 29
        [0,0,2,18],     // 30 (boss)
        [0,0,2,18],     // 31
        [0,0,1,19],     // 32
        [0,0,1,19],     // 33
        [0,0,1,19],     // 34
        [0,0,0,20],     // 35 (final boss)
    ];

    function getLevel(index) {
        const idx = Math.min(index, LEVEL_ENEMIES.length - 1);
        const enemies = LEVEL_ENEMIES[idx];
        const levelNum = index + 1;

        let map;
        if (index < 5) {
            // Levels 1-5: Tutorial, mostly brick
            map = baseLayout(0.3, 0, 0);
        } else if (index < 10) {
            // Levels 6-10: Introduce water and steel
            map = baseLayout(0.3, 0.08, 0.05);
        } else if (index < 15) {
            // Levels 11-15: Introduce ice
            map = baseLayout(0.3, 0.1, 0.05);
            // Add ice patches
            for (let r = 8; r < 16; r++)
                for (let c = 8; c < 18; c++)
                    if (Math.random() < 0.15) map[r][c] = 5;
        } else if (index < 20) {
            // Levels 16-20: Mixed
            map = baseLayout(0.35, 0.12, 0.08);
        } else if (index < 25) {
            // Levels 21-25: Dense
            map = baseLayout(0.4, 0.15, 0.08);
            addWalls(map, 10, 10, 6, 1, 2); // Steel barrier
        } else if (index < 30) {
            // Levels 26-30: Advanced
            map = baseLayout(0.4, 0.18, 0.1);
            addWalls(map, 8, 6, 1, 8, 2);
            addWalls(map, 8, 19, 1, 8, 2);
        } else {
            // Levels 31-35: Final
            map = baseLayout(0.45, 0.2, 0.1);
            addWalls(map, 6, 4, 1, 10, 2);
            addWalls(map, 6, 21, 1, 10, 2);
            addWalls(map, 12, 8, 10, 1, 2);
        }

        return {
            map,
            enemies,
            hasBoss: BOSS_LEVELS.includes(levelNum),
            timer: null // No time limit
        };
    }

    return { getLevel, clearSpawn };
})();
