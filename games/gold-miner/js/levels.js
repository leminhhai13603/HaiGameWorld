/**
 * Gold Miner - 25 Handcrafted Level Definitions
 * Reduced object counts to match original game difficulty
 * Original Gold Miner: ~12-28 objects per level
 */

const LEVEL_TARGETS = [
    650, 1195, 2010, 3095, 4450, 6075, 7970, 10135, 12570, 15275,
    18000, 21000, 24500, 28000, 32000, 36000, 40500, 45000, 50000, 55500,
    61500, 68000, 75000, 82500, 90000
];

const TIMER = 60;

// Helper: scatter objects avoiding overlap
function scatter(items, canvasW, canvasH, topY = 100) {
    const placed = [];
    for (const it of items) {
        let tries = 0;
        let x, y;
        do {
            x = 60 + Math.random() * (canvasW - 120);
            y = topY + Math.random() * (canvasH - topY - 40);
            tries++;
        } while (tries < 50 && placed.some(p => Math.hypot(p.x-x,p.y-y) < (p.r+it.r+10)));
        placed.push({ x, y, r: it.r, type: it.type });
    }
    return placed;
}

const LEVELS = [];

// ===== LEVEL 1: Tutorial (12 objects) =====
LEVELS.push({
    target: LEVEL_TARGETS[0], timer: TIMER,
    objects: [
        ...Array(5).fill(null).map(() => ({ type: ObjType.GOLD_SMALL, r: 14 })),
        ...Array(3).fill(null).map(() => ({ type: ObjType.GOLD_MEDIUM, r: 22 })),
        ...Array(1).fill(null).map(() => ({ type: ObjType.GOLD_LARGE, r: 30 })),
        ...Array(2).fill(null).map(() => ({ type: ObjType.ROCK_SMALL, r: 17 })),
        { type: ObjType.MYSTERY_BAG, r: 15 }
    ]
});

// ===== LEVEL 2 (14 objects) =====
LEVELS.push({
    target: LEVEL_TARGETS[1], timer: TIMER,
    objects: [
        ...Array(6).fill(null).map(() => ({ type: ObjType.GOLD_SMALL, r: 14 })),
        ...Array(3).fill(null).map(() => ({ type: ObjType.GOLD_MEDIUM, r: 22 })),
        ...Array(2).fill(null).map(() => ({ type: ObjType.GOLD_LARGE, r: 30 })),
        ...Array(2).fill(null).map(() => ({ type: ObjType.ROCK_SMALL, r: 17 })),
        { type: ObjType.MYSTERY_BAG, r: 15 }
    ]
});

// ===== LEVEL 3 (16 objects) =====
LEVELS.push({
    target: LEVEL_TARGETS[2], timer: TIMER,
    objects: [
        ...Array(6).fill(null).map(() => ({ type: ObjType.GOLD_SMALL, r: 14 })),
        ...Array(4).fill(null).map(() => ({ type: ObjType.GOLD_MEDIUM, r: 22 })),
        ...Array(2).fill(null).map(() => ({ type: ObjType.GOLD_LARGE, r: 30 })),
        ...Array(2).fill(null).map(() => ({ type: ObjType.ROCK_SMALL, r: 17 })),
        { type: ObjType.MYSTERY_BAG, r: 15 },
        { type: ObjType.DIAMOND, r: 13 }
    ]
});

// ===== LEVEL 4 (18 objects) =====
LEVELS.push({
    target: LEVEL_TARGETS[3], timer: TIMER,
    objects: [
        ...Array(5).fill(null).map(() => ({ type: ObjType.GOLD_SMALL, r: 14 })),
        ...Array(4).fill(null).map(() => ({ type: ObjType.GOLD_MEDIUM, r: 22 })),
        ...Array(3).fill(null).map(() => ({ type: ObjType.GOLD_LARGE, r: 30 })),
        { type: ObjType.GOLD_GIANT, r: 40 },
        ...Array(3).fill(null).map(() => ({ type: ObjType.ROCK_SMALL, r: 17 })),
        { type: ObjType.MYSTERY_BAG, r: 15 },
        { type: ObjType.DIAMOND, r: 13 }
    ]
});

// ===== LEVEL 5 (20 objects) =====
LEVELS.push({
    target: LEVEL_TARGETS[4], timer: TIMER,
    objects: [
        ...Array(5).fill(null).map(() => ({ type: ObjType.GOLD_SMALL, r: 14 })),
        ...Array(4).fill(null).map(() => ({ type: ObjType.GOLD_MEDIUM, r: 22 })),
        ...Array(3).fill(null).map(() => ({ type: ObjType.GOLD_LARGE, r: 30 })),
        { type: ObjType.GOLD_GIANT, r: 40 },
        ...Array(3).fill(null).map(() => ({ type: ObjType.ROCK_SMALL, r: 17 })),
        { type: ObjType.MYSTERY_BAG, r: 15 },
        ...Array(2).fill(null).map(() => ({ type: ObjType.DIAMOND, r: 13 }))
    ]
});

// ===== LEVELS 6-10: Rock Trap (20-24 objects) =====
LEVELS.push({
    target: LEVEL_TARGETS[5], timer: TIMER,
    objects: [
        ...Array(4).fill(null).map(() => ({ type: ObjType.GOLD_SMALL, r: 14 })),
        ...Array(3).fill(null).map(() => ({ type: ObjType.GOLD_MEDIUM, r: 22 })),
        ...Array(2).fill(null).map(() => ({ type: ObjType.GOLD_LARGE, r: 30 })),
        { type: ObjType.GOLD_GIANT, r: 40 },
        ...Array(4).fill(null).map(() => ({ type: ObjType.ROCK_SMALL, r: 17 })),
        ...Array(2).fill(null).map(() => ({ type: ObjType.ROCK_LARGE, r: 27 })),
        { type: ObjType.BONE, r: 14 },
        { type: ObjType.MYSTERY_BAG, r: 15 },
        { type: ObjType.DIAMOND, r: 13 }
    ]
});

LEVELS.push({
    target: LEVEL_TARGETS[6], timer: TIMER,
    objects: [
        ...Array(4).fill(null).map(() => ({ type: ObjType.GOLD_SMALL, r: 14 })),
        ...Array(3).fill(null).map(() => ({ type: ObjType.GOLD_MEDIUM, r: 22 })),
        ...Array(2).fill(null).map(() => ({ type: ObjType.GOLD_LARGE, r: 30 })),
        { type: ObjType.GOLD_GIANT, r: 40 },
        ...Array(4).fill(null).map(() => ({ type: ObjType.ROCK_SMALL, r: 17 })),
        ...Array(2).fill(null).map(() => ({ type: ObjType.ROCK_LARGE, r: 27 })),
        ...Array(2).fill(null).map(() => ({ type: ObjType.BONE, r: 14 })),
        { type: ObjType.SKULL, r: 16 },
        { type: ObjType.MYSTERY_BAG, r: 15 },
        ...Array(2).fill(null).map(() => ({ type: ObjType.DIAMOND, r: 13 }))
    ]
});

LEVELS.push({
    target: LEVEL_TARGETS[7], timer: TIMER,
    objects: [
        ...Array(4).fill(null).map(() => ({ type: ObjType.GOLD_SMALL, r: 14 })),
        ...Array(3).fill(null).map(() => ({ type: ObjType.GOLD_MEDIUM, r: 22 })),
        ...Array(2).fill(null).map(() => ({ type: ObjType.GOLD_LARGE, r: 30 })),
        ...Array(2).fill(null).map(() => ({ type: ObjType.GOLD_GIANT, r: 40 })),
        ...Array(4).fill(null).map(() => ({ type: ObjType.ROCK_SMALL, r: 17 })),
        ...Array(2).fill(null).map(() => ({ type: ObjType.ROCK_LARGE, r: 27 })),
        ...Array(2).fill(null).map(() => ({ type: ObjType.BONE, r: 14 })),
        { type: ObjType.SKULL, r: 16 },
        ...Array(2).fill(null).map(() => ({ type: ObjType.MYSTERY_BAG, r: 15 })),
        ...Array(2).fill(null).map(() => ({ type: ObjType.DIAMOND, r: 13 }))
    ]
});

LEVELS.push({
    target: LEVEL_TARGETS[8], timer: TIMER,
    objects: [
        ...Array(3).fill(null).map(() => ({ type: ObjType.GOLD_SMALL, r: 14 })),
        ...Array(3).fill(null).map(() => ({ type: ObjType.GOLD_MEDIUM, r: 22 })),
        ...Array(2).fill(null).map(() => ({ type: ObjType.GOLD_LARGE, r: 30 })),
        ...Array(2).fill(null).map(() => ({ type: ObjType.GOLD_GIANT, r: 40 })),
        ...Array(5).fill(null).map(() => ({ type: ObjType.ROCK_SMALL, r: 17 })),
        ...Array(3).fill(null).map(() => ({ type: ObjType.ROCK_LARGE, r: 27 })),
        ...Array(2).fill(null).map(() => ({ type: ObjType.BONE, r: 14 })),
        { type: ObjType.SKULL, r: 16 },
        ...Array(2).fill(null).map(() => ({ type: ObjType.MYSTERY_BAG, r: 15 })),
        ...Array(3).fill(null).map(() => ({ type: ObjType.DIAMOND, r: 13 }))
    ]
});

LEVELS.push({
    target: LEVEL_TARGETS[9], timer: TIMER,
    objects: [
        ...Array(3).fill(null).map(() => ({ type: ObjType.GOLD_SMALL, r: 14 })),
        ...Array(3).fill(null).map(() => ({ type: ObjType.GOLD_MEDIUM, r: 22 })),
        ...Array(2).fill(null).map(() => ({ type: ObjType.GOLD_LARGE, r: 30 })),
        ...Array(2).fill(null).map(() => ({ type: ObjType.GOLD_GIANT, r: 40 })),
        ...Array(4).fill(null).map(() => ({ type: ObjType.ROCK_SMALL, r: 17 })),
        ...Array(2).fill(null).map(() => ({ type: ObjType.ROCK_LARGE, r: 27 })),
        ...Array(2).fill(null).map(() => ({ type: ObjType.BONE, r: 14 })),
        { type: ObjType.SKULL, r: 16 },
        ...Array(2).fill(null).map(() => ({ type: ObjType.MYSTERY_BAG, r: 15 })),
        ...Array(3).fill(null).map(() => ({ type: ObjType.DIAMOND, r: 13 }))
    ]
});

// ===== LEVELS 11-15: Diamond Rush (20-26 objects) =====
for (let i = 10; i < 15; i++) {
    const diamondCount = 2 + (i - 10);
    const moleCount = i >= 12 ? 1 + (i - 12) : 0;
    const moleDiamondCount = i >= 13 ? 1 : 0;
    LEVELS.push({
        target: LEVEL_TARGETS[i], timer: TIMER,
        objects: [
            ...Array(4).fill(null).map(() => ({ type: ObjType.GOLD_SMALL, r: 14 })),
            ...Array(3).fill(null).map(() => ({ type: ObjType.GOLD_MEDIUM, r: 22 })),
            ...Array(2).fill(null).map(() => ({ type: ObjType.GOLD_LARGE, r: 30 })),
            { type: ObjType.GOLD_GIANT, r: 40 },
            ...Array(4).fill(null).map(() => ({ type: ObjType.ROCK_SMALL, r: 17 })),
            ...Array(2).fill(null).map(() => ({ type: ObjType.ROCK_LARGE, r: 27 })),
            { type: ObjType.BONE, r: 14 },
            { type: ObjType.SKULL, r: 16 },
            { type: ObjType.MYSTERY_BAG, r: 15 },
            ...Array(diamondCount).fill(null).map(() => ({ type: ObjType.DIAMOND, r: 13 })),
            ...Array(moleCount).fill(null).map(() => ({ type: ObjType.MOLE, r: 15 })),
            ...Array(moleDiamondCount).fill(null).map(() => ({ type: ObjType.MOLE_DIAMOND, r: 16 }))
        ]
    });
}

// ===== LEVELS 16-20: Risk vs Reward - TNT introduced (22-28 objects) =====
for (let i = 15; i < 20; i++) {
    const tntCount = 1 + Math.floor((i - 15) / 2);
    const diamondCount = 3 + (i - 15);
    const giantCount = 1 + Math.floor((i - 15) / 2);
    const moleCount = 1 + Math.floor((i - 15) / 2);
    const moleDiamondCount = i >= 17 ? 1 : 0;
    LEVELS.push({
        target: LEVEL_TARGETS[i], timer: TIMER,
        objects: [
            ...Array(3).fill(null).map(() => ({ type: ObjType.GOLD_SMALL, r: 14 })),
            ...Array(3).fill(null).map(() => ({ type: ObjType.GOLD_MEDIUM, r: 22 })),
            ...Array(2).fill(null).map(() => ({ type: ObjType.GOLD_LARGE, r: 30 })),
            ...Array(giantCount).fill(null).map(() => ({ type: ObjType.GOLD_GIANT, r: 40 })),
            ...Array(4).fill(null).map(() => ({ type: ObjType.ROCK_SMALL, r: 17 })),
            ...Array(2).fill(null).map(() => ({ type: ObjType.ROCK_LARGE, r: 27 })),
            { type: ObjType.BONE, r: 14 },
            { type: ObjType.SKULL, r: 16 },
            ...Array(1 + Math.floor((i-15)/3)).fill(null).map(() => ({ type: ObjType.MYSTERY_BAG, r: 15 })),
            ...Array(diamondCount).fill(null).map(() => ({ type: ObjType.DIAMOND, r: 13 })),
            ...Array(tntCount).fill(null).map(() => ({ type: ObjType.TNT, r: 18 })),
            ...Array(moleCount).fill(null).map(() => ({ type: ObjType.MOLE, r: 15 })),
            ...Array(moleDiamondCount).fill(null).map(() => ({ type: ObjType.MOLE_DIAMOND, r: 16 }))
        ]
    });
}

// ===== LEVELS 21-24: Chaos Mine (26-32 objects) =====
for (let i = 20; i < 24; i++) {
    const chaos = i - 20;
    LEVELS.push({
        target: LEVEL_TARGETS[i], timer: TIMER,
        objects: [
            ...Array(3).fill(null).map(() => ({ type: ObjType.GOLD_SMALL, r: 14 })),
            ...Array(3).fill(null).map(() => ({ type: ObjType.GOLD_MEDIUM, r: 22 })),
            ...Array(3).fill(null).map(() => ({ type: ObjType.GOLD_LARGE, r: 30 })),
            ...Array(2 + chaos).fill(null).map(() => ({ type: ObjType.GOLD_GIANT, r: 40 })),
            ...Array(4).fill(null).map(() => ({ type: ObjType.ROCK_SMALL, r: 17 })),
            ...Array(2 + chaos).fill(null).map(() => ({ type: ObjType.ROCK_LARGE, r: 27 })),
            ...Array(2).fill(null).map(() => ({ type: ObjType.BONE, r: 14 })),
            { type: ObjType.SKULL, r: 16 },
            ...Array(2).fill(null).map(() => ({ type: ObjType.MYSTERY_BAG, r: 15 })),
            ...Array(5 + chaos).fill(null).map(() => ({ type: ObjType.DIAMOND, r: 13 })),
            ...Array(2 + chaos).fill(null).map(() => ({ type: ObjType.TNT, r: 18 })),
            ...Array(2 + chaos).fill(null).map(() => ({ type: ObjType.MOLE, r: 15 })),
            ...Array(1 + chaos).fill(null).map(() => ({ type: ObjType.MOLE_DIAMOND, r: 16 }))
        ]
    });
}

// ===== LEVEL 25: FINAL LEVEL (35 objects) =====
LEVELS.push({
    target: LEVEL_TARGETS[24], timer: TIMER,
    objects: [
        ...Array(4).fill(null).map(() => ({ type: ObjType.GOLD_SMALL, r: 14 })),
        ...Array(4).fill(null).map(() => ({ type: ObjType.GOLD_MEDIUM, r: 22 })),
        ...Array(3).fill(null).map(() => ({ type: ObjType.GOLD_LARGE, r: 30 })),
        ...Array(3).fill(null).map(() => ({ type: ObjType.GOLD_GIANT, r: 40 })),
        ...Array(5).fill(null).map(() => ({ type: ObjType.DIAMOND, r: 13 })),
        ...Array(3).fill(null).map(() => ({ type: ObjType.MOLE, r: 15 })),
        ...Array(2).fill(null).map(() => ({ type: ObjType.MOLE_DIAMOND, r: 16 })),
        ...Array(2).fill(null).map(() => ({ type: ObjType.MYSTERY_BAG, r: 15 })),
        ...Array(4).fill(null).map(() => ({ type: ObjType.ROCK_SMALL, r: 17 })),
        ...Array(2).fill(null).map(() => ({ type: ObjType.ROCK_LARGE, r: 27 })),
        ...Array(2).fill(null).map(() => ({ type: ObjType.BONE, r: 14 })),
        { type: ObjType.SKULL, r: 16 },
        { type: ObjType.TNT, r: 18 }
    ]
});

function getLevelData(index, canvasW, canvasH) {
    const def = LEVELS[Math.min(index, LEVELS.length - 1)];
    const placed = scatter(def.objects, canvasW, canvasH, 100);
    return {
        target: def.target,
        timer: def.timer,
        objects: placed.map(p => ({ x: p.x, y: p.y, type: p.type }))
    };
}
