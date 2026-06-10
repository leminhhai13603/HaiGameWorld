/**
 * Pikachu Classic - Level Manager
 * 27 levels across 3 phases:
 *   Phase 1 (1-7):   Introduce all 6 shift types (null/left/right/up/down/inward/outward)
 *   Phase 2 (8-15):  Revisit all types with increasing tile variety & speed
 *   Phase 3 (16-27): All types combined with board holes
 */

const LevelDefs = [
    // === PHASE 1: Introduction ===
    // Level 1: Classic static
    { timer: 360, tileVariety: 16, shift: null,     holes: [], desc: 'Classic Mode' },
    // Level 2: Left
    { timer: 340, tileVariety: 16, shift: 'left',   holes: [], desc: 'Tiles slide LEFT' },
    // Level 3: Right
    { timer: 340, tileVariety: 16, shift: 'right',  holes: [], desc: 'Tiles slide RIGHT' },
    // Level 4: Up
    { timer: 320, tileVariety: 17, shift: 'up',     holes: [], desc: 'Tiles slide UP' },
    // Level 5: Down
    { timer: 320, tileVariety: 17, shift: 'down',   holes: [], desc: 'Tiles slide DOWN' },
    // Level 6: Inward — first encounter, generous timer
    { timer: 310, tileVariety: 18, shift: 'inward', holes: [], desc: 'Tiles suck IN' },
    // Level 7: Outward — first encounter, generous timer
    { timer: 310, tileVariety: 18, shift: 'outward',holes: [], desc: 'Tiles burst OUT' },

    // === PHASE 2: Variety & Speed ===
    // Level 8: Left faster
    { timer: 290, tileVariety: 20, shift: 'left',   holes: [], desc: 'Faster LEFT' },
    // Level 9: Inward + more icons
    { timer: 290, tileVariety: 20, shift: 'inward', holes: [], desc: 'Inward — more icons' },
    // Level 10: Down + tighter timer
    { timer: 270, tileVariety: 22, shift: 'down',   holes: [], desc: 'Getting harder' },
    // Level 11: Speed round (no shift, test memory)
    { timer: 260, tileVariety: 22, shift: null,     holes: [], desc: 'Speed round' },
    // Level 12: Outward + high variety
    { timer: 250, tileVariety: 24, shift: 'outward',holes: [], desc: 'Outward — many icons' },
    // Level 13: Up fast
    { timer: 240, tileVariety: 24, shift: 'up',     holes: [], desc: 'Quick thinking' },
    // Level 14: Inward + high variety
    { timer: 230, tileVariety: 25, shift: 'inward', holes: [], desc: 'Inward overload' },
    // Level 15: Outward + max variety before holes
    { timer: 220, tileVariety: 26, shift: 'outward',holes: [], desc: 'Outward overload' },

    // === PHASE 3: Holes ===
    // Level 16: Null + small holes
    { timer: 250, tileVariety: 22, shift: null,
      holes: [{r:4,c:7},{r:4,c:8}],
      desc: 'Blocked areas' },
    // Level 17: Left + holes
    { timer: 240, tileVariety: 22, shift: 'left',
      holes: [{r:3,c:7},{r:3,c:8},{r:6,c:7},{r:6,c:8}],
      desc: 'LEFT + obstacles' },
    // Level 18: Inward + holes
    { timer: 230, tileVariety: 24, shift: 'inward',
      holes: [{r:2,c:7},{r:2,c:8},{r:6,c:7},{r:6,c:8}],
      desc: 'Inward + obstacles' },
    // Level 19: Right + L-holes
    { timer: 220, tileVariety: 24, shift: 'right',
      holes: [
        {r:2,c:7},{r:2,c:8},{r:3,c:7},{r:3,c:8},
        {r:6,c:3},{r:6,c:4}
      ],
      desc: 'RIGHT + complex' },
    // Level 20: Outward + cross holes
    { timer: 210, tileVariety: 24, shift: 'outward',
      holes: [
        {r:4,c:7},{r:4,c:8},
        {r:0,c:3},{r:0,c:12},
        {r:8,c:3},{r:8,c:12}
      ],
      desc: 'Outward + cross' },
    // Level 21: Down + maze holes
    { timer: 200, tileVariety: 26, shift: 'down',
      holes: [
        {r:1,c:4},{r:1,c:11},
        {r:4,c:0},{r:4,c:15},
        {r:4,c:7},{r:4,c:8},
        {r:7,c:4},{r:7,c:11}
      ],
      desc: 'Maze — DOWN' },
    // Level 22: Inward + chaos holes
    { timer: 195, tileVariety: 26, shift: 'inward',
      holes: [
        {r:2,c:5},{r:2,c:10},
        {r:6,c:5},{r:6,c:10}
      ],
      desc: 'Inward chaos' },
    // Level 23: Outward + chaos holes
    { timer: 190, tileVariety: 27, shift: 'outward',
      holes: [
        {r:0,c:7},{r:0,c:8},
        {r:4,c:3},{r:4,c:12},
        {r:8,c:7},{r:8,c:8}
      ],
      desc: 'Outward chaos' },
    // Level 24: Up + speed holes
    { timer: 180, tileVariety: 28, shift: 'up',
      holes: [
        {r:3,c:7},{r:3,c:8},
        {r:5,c:3},{r:5,c:4},{r:5,c:11},{r:5,c:12}
      ],
      desc: 'Speed demon' },
    // Level 25: Inward + heavy holes
    { timer: 175, tileVariety: 30, shift: 'inward',
      holes: [
        {r:1,c:7},{r:1,c:8},
        {r:4,c:0},{r:4,c:15},
        {r:7,c:7},{r:7,c:8}
      ],
      desc: 'Inward — final stretch' },
    // Level 26: Outward + heavy holes
    { timer: 170, tileVariety: 30, shift: 'outward',
      holes: [
        {r:0,c:7},{r:0,c:8},
        {r:2,c:3},{r:2,c:12},
        {r:6,c:3},{r:6,c:12},
        {r:8,c:7},{r:8,c:8}
      ],
      desc: 'Outward — final stretch' },
    // Level 27: FINAL — inward + max everything
    { timer: 160, tileVariety: 32, shift: 'inward',
      holes: [
        {r:0,c:7},{r:0,c:8},
        {r:2,c:3},{r:2,c:12},
        {r:4,c:0},{r:4,c:15},
        {r:4,c:7},{r:4,c:8},
        {r:6,c:3},{r:6,c:12},
        {r:8,c:7},{r:8,c:8}
      ],
      desc: 'FINAL LEVEL' }
];

class LevelManager {
    static getLevel(index) {
        if (index >= LevelDefs.length) {
            // Generate harder levels beyond 25
            const base = LevelDefs[LevelDefs.length - 1];
            return {
                timer: Math.max(60, base.timer - (index - 24) * 5),
                tileVariety: Math.min(36, base.tileVariety),
                shift: ['left', 'right', 'up', 'down'][index % 4],
                holes: base.holes,
                desc: `Level ${index + 1}`
            };
        }
        return LevelDefs[index];
    }

    static getTotalLevels() {
        return 27;
    }

    static getTimerForLevel(index) {
        return LevelDefs[Math.min(index, LevelDefs.length - 1)].timer;
    }

    static getStars(score, timeRemaining, hintsUsed, shufflesUsed, level) {
        let stars = 1;
        if (timeRemaining > 30 && hintsUsed <= 1 && shufflesUsed <= 1) stars = 3;
        else if (timeRemaining > 10 && hintsUsed <= 2) stars = 2;
        return stars;
    }
}
