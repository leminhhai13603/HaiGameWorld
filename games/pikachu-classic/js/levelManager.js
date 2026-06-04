/**
 * Pikachu Classic - Level Manager
 * 25 handcrafted levels with different mechanics
 */

const LevelDefs = [
    // Level 1: Classic static
    { timer: 300, tileVariety: 18, shift: null, holes: [], desc: 'Classic Mode' },
    // Level 2: Slide left
    { timer: 280, tileVariety: 18, shift: 'left', holes: [], desc: 'Tiles slide LEFT' },
    // Level 3: Slide right
    { timer: 280, tileVariety: 18, shift: 'right', holes: [], desc: 'Tiles slide RIGHT' },
    // Level 4: Slide up
    { timer: 270, tileVariety: 18, shift: 'up', holes: [], desc: 'Tiles slide UP' },
    // Level 5: Slide down
    { timer: 270, tileVariety: 18, shift: 'down', holes: [], desc: 'Tiles slide DOWN' },
    // Level 6: Mixed left/right
    { timer: 260, tileVariety: 20, shift: 'left', holes: [], desc: 'Mixed movement' },
    // Level 7: Mixed up/down
    { timer: 260, tileVariety: 20, shift: 'up', holes: [], desc: 'Mixed movement' },
    // Level 8: Slide left + more variety
    { timer: 250, tileVariety: 22, shift: 'left', holes: [], desc: 'More variety' },
    // Level 9: Slide right + faster
    { timer: 240, tileVariety: 22, shift: 'right', holes: [], desc: 'Faster pace' },
    // Level 10: Slide down + hard
    { timer: 230, tileVariety: 24, shift: 'down', holes: [], desc: 'Getting harder' },
    // Level 11: Fast timer + more variety
    { timer: 220, tileVariety: 24, shift: null, holes: [], desc: 'Speed round' },
    // Level 12: Slide left + high variety
    { timer: 210, tileVariety: 26, shift: 'left', holes: [], desc: 'Many icons' },
    // Level 13: Slide up + fast
    { timer: 200, tileVariety: 26, shift: 'up', holes: [], desc: 'Quick thinking' },
    // Level 14: Slide right + variety
    { timer: 190, tileVariety: 28, shift: 'right', holes: [], desc: 'Icon overload' },
    // Level 15: Static + max variety
    { timer: 180, tileVariety: 30, shift: null, holes: [], desc: 'Static challenge' },
    // Level 16: Holes in board
    { timer: 200, tileVariety: 24, shift: null,
      holes: this._generateHoles ? [] : [
        {r:4,c:7},{r:4,c:8}
      ],
      desc: 'Blocked areas' },
    // Level 17: More holes
    { timer: 190, tileVariety: 24, shift: 'left',
      holes: [
        {r:3,c:7},{r:3,c:8},{r:6,c:7},{r:6,c:8}
      ],
      desc: 'Obstacles' },
    // Level 18: L-shaped holes
    { timer: 180, tileVariety: 26, shift: 'right',
      holes: [
        {r:2,c:7},{r:2,c:8},{r:3,c:7},{r:3,c:8},
        {r:6,c:3},{r:6,c:4}
      ],
      desc: 'Complex layout' },
    // Level 19: Cross pattern
    { timer: 170, tileVariety: 26, shift: 'up',
      holes: [
        {r:4,c:7},{r:4,c:8},
        {r:0,c:3},{r:0,c:12},
        {r:8,c:3},{r:8,c:12}
      ],
      desc: 'Cross pattern' },
    // Level 20: Many holes
    { timer: 160, tileVariety: 28, shift: 'down',
      holes: [
        {r:1,c:4},{r:1,c:11},
        {r:4,c:0},{r:4,c:15},
        {r:4,c:7},{r:4,c:8},
        {r:7,c:4},{r:7,c:11}
      ],
      desc: 'Maze' },
    // Level 21: Chaos - left shift + holes
    { timer: 150, tileVariety: 28, shift: 'left',
      holes: [
        {r:2,c:5},{r:2,c:10},
        {r:6,c:5},{r:6,c:10}
      ],
      desc: 'Chaos mine' },
    // Level 22: Chaos - right shift + holes
    { timer: 145, tileVariety: 30, shift: 'right',
      holes: [
        {r:0,c:7},{r:0,c:8},
        {r:4,c:3},{r:4,c:12},
        {r:8,c:7},{r:8,c:8}
      ],
      desc: 'Maximum chaos' },
    // Level 23: Speed + variety
    { timer: 140, tileVariety: 32, shift: 'up',
      holes: [
        {r:3,c:7},{r:3,c:8},
        {r:5,c:3},{r:5,c:4},{r:5,c:11},{r:5,c:12}
      ],
      desc: 'Speed demon' },
    // Level 24: Near final
    { timer: 130, tileVariety: 34, shift: 'down',
      holes: [
        {r:1,c:7},{r:1,c:8},
        {r:4,c:0},{r:4,c:15},
        {r:7,c:7},{r:7,c:8}
      ],
      desc: 'Final stretch' },
    // Level 25: FINAL - max everything
    { timer: 120, tileVariety: 36, shift: 'left',
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
        return 25;
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
