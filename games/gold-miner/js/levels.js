/**
 * Gold Miner - 25 Handcrafted Level Definitions
 * Each level: target, timer, object placements
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

// ===== LEVEL 1: Tutorial =====
LEVELS.push({
    target: LEVEL_TARGETS[0], timer: TIMER,
    objects: [
        ...Array(8).fill(null).map((_,i) => ({ type: ObjType.GOLD_SMALL, r: 14 })),
        ...Array(3).fill(null).map((_,i) => ({ type: ObjType.GOLD_MEDIUM, r: 22 })),
        ...Array(2).fill(null).map((_,i) => ({ type: ObjType.GOLD_LARGE, r: 30 })),
        ...Array(2).fill(null).map((_,i) => ({ type: ObjType.ROCK_SMALL, r: 17 })),
        { type: ObjType.MYSTERY_BAG, r: 15 }
    ]
});

// ===== LEVEL 2 =====
LEVELS.push({
    target: LEVEL_TARGETS[1], timer: TIMER,
    objects: [
        ...Array(10).fill(null).map(() => ({ type: ObjType.GOLD_SMALL, r: 14 })),
        ...Array(4).fill(null).map(() => ({ type: ObjType.GOLD_MEDIUM, r: 22 })),
        ...Array(2).fill(null).map(() => ({ type: ObjType.GOLD_LARGE, r: 30 })),
        ...Array(3).fill(null).map(() => ({ type: ObjType.ROCK_SMALL, r: 17 })),
        ...Array(2).fill(null).map(() => ({ type: ObjType.MYSTERY_BAG, r: 15 }))
    ]
});

// ===== LEVEL 3 =====
LEVELS.push({
    target: LEVEL_TARGETS[2], timer: TIMER,
    objects: [
        ...Array(10).fill(null).map(() => ({ type: ObjType.GOLD_SMALL, r: 14 })),
        ...Array(6).fill(null).map(() => ({ type: ObjType.GOLD_MEDIUM, r: 22 })),
        ...Array(3).fill(null).map(() => ({ type: ObjType.GOLD_LARGE, r: 30 })),
        ...Array(4).fill(null).map(() => ({ type: ObjType.ROCK_SMALL, r: 17 })),
        ...Array(2).fill(null).map(() => ({ type: ObjType.MYSTERY_BAG, r: 15 })),
        { type: ObjType.DIAMOND, r: 13 }
    ]
});

// ===== LEVEL 4 =====
LEVELS.push({
    target: LEVEL_TARGETS[3], timer: TIMER,
    objects: [
        ...Array(8).fill(null).map(() => ({ type: ObjType.GOLD_SMALL, r: 14 })),
        ...Array(6).fill(null).map(() => ({ type: ObjType.GOLD_MEDIUM, r: 22 })),
        ...Array(4).fill(null).map(() => ({ type: ObjType.GOLD_LARGE, r: 30 })),
        ...Array(2).fill(null).map(() => ({ type: ObjType.GOLD_GIANT, r: 40 })),
        ...Array(5).fill(null).map(() => ({ type: ObjType.ROCK_SMALL, r: 17 })),
        ...Array(2).fill(null).map(() => ({ type: ObjType.MYSTERY_BAG, r: 15 })),
        ...Array(2).fill(null).map(() => ({ type: ObjType.DIAMOND, r: 13 }))
    ]
});

// ===== LEVEL 5 =====
LEVELS.push({
    target: LEVEL_TARGETS[4], timer: TIMER,
    objects: [
        ...Array(10).fill(null).map(() => ({ type: ObjType.GOLD_SMALL, r: 14 })),
        ...Array(8).fill(null).map(() => ({ type: ObjType.GOLD_MEDIUM, r: 22 })),
        ...Array(5).fill(null).map(() => ({ type: ObjType.GOLD_LARGE, r: 30 })),
        ...Array(2).fill(null).map(() => ({ type: ObjType.GOLD_GIANT, r: 40 })),
        ...Array(6).fill(null).map(() => ({ type: ObjType.ROCK_SMALL, r: 17 })),
        ...Array(3).fill(null).map(() => ({ type: ObjType.MYSTERY_BAG, r: 15 })),
        ...Array(3).fill(null).map(() => ({ type: ObjType.DIAMOND, r: 13 }))
    ]
});

// ===== LEVELS 6-10: Rock Trap =====
LEVELS.push({
    target: LEVEL_TARGETS[5], timer: TIMER,
    objects: [
        ...Array(8).fill(null).map(() => ({ type: ObjType.GOLD_SMALL, r: 14 })),
        ...Array(6).fill(null).map(() => ({ type: ObjType.GOLD_MEDIUM, r: 22 })),
        ...Array(4).fill(null).map(() => ({ type: ObjType.GOLD_LARGE, r: 30 })),
        ...Array(2).fill(null).map(() => ({ type: ObjType.GOLD_GIANT, r: 40 })),
        ...Array(6).fill(null).map(() => ({ type: ObjType.ROCK_SMALL, r: 17 })),
        ...Array(3).fill(null).map(() => ({ type: ObjType.ROCK_LARGE, r: 27 })),
        ...Array(2).fill(null).map(() => ({ type: ObjType.BONE, r: 14 })),
        ...Array(2).fill(null).map(() => ({ type: ObjType.MYSTERY_BAG, r: 15 })),
        ...Array(2).fill(null).map(() => ({ type: ObjType.DIAMOND, r: 13 }))
    ]
});

LEVELS.push({
    target: LEVEL_TARGETS[6], timer: TIMER,
    objects: [
        ...Array(6).fill(null).map(() => ({ type: ObjType.GOLD_SMALL, r: 14 })),
        ...Array(6).fill(null).map(() => ({ type: ObjType.GOLD_MEDIUM, r: 22 })),
        ...Array(4).fill(null).map(() => ({ type: ObjType.GOLD_LARGE, r: 30 })),
        ...Array(2).fill(null).map(() => ({ type: ObjType.GOLD_GIANT, r: 40 })),
        ...Array(7).fill(null).map(() => ({ type: ObjType.ROCK_SMALL, r: 17 })),
        ...Array(4).fill(null).map(() => ({ type: ObjType.ROCK_LARGE, r: 27 })),
        ...Array(3).fill(null).map(() => ({ type: ObjType.BONE, r: 14 })),
        ...Array(2).fill(null).map(() => ({ type: ObjType.SKULL, r: 16 })),
        ...Array(2).fill(null).map(() => ({ type: ObjType.MYSTERY_BAG, r: 15 })),
        ...Array(3).fill(null).map(() => ({ type: ObjType.DIAMOND, r: 13 }))
    ]
});

LEVELS.push({
    target: LEVEL_TARGETS[7], timer: TIMER,
    objects: [
        ...Array(6).fill(null).map(() => ({ type: ObjType.GOLD_SMALL, r: 14 })),
        ...Array(5).fill(null).map(() => ({ type: ObjType.GOLD_MEDIUM, r: 22 })),
        ...Array(4).fill(null).map(() => ({ type: ObjType.GOLD_LARGE, r: 30 })),
        ...Array(3).fill(null).map(() => ({ type: ObjType.GOLD_GIANT, r: 40 })),
        ...Array(8).fill(null).map(() => ({ type: ObjType.ROCK_SMALL, r: 17 })),
        ...Array(4).fill(null).map(() => ({ type: ObjType.ROCK_LARGE, r: 27 })),
        ...Array(3).fill(null).map(() => ({ type: ObjType.BONE, r: 14 })),
        ...Array(2).fill(null).map(() => ({ type: ObjType.SKULL, r: 16 })),
        ...Array(3).fill(null).map(() => ({ type: ObjType.MYSTERY_BAG, r: 15 })),
        ...Array(3).fill(null).map(() => ({ type: ObjType.DIAMOND, r: 13 }))
    ]
});

LEVELS.push({
    target: LEVEL_TARGETS[8], timer: TIMER,
    objects: [
        ...Array(5).fill(null).map(() => ({ type: ObjType.GOLD_SMALL, r: 14 })),
        ...Array(5).fill(null).map(() => ({ type: ObjType.GOLD_MEDIUM, r: 22 })),
        ...Array(4).fill(null).map(() => ({ type: ObjType.GOLD_LARGE, r: 30 })),
        ...Array(3).fill(null).map(() => ({ type: ObjType.GOLD_GIANT, r: 40 })),
        ...Array(9).fill(null).map(() => ({ type: ObjType.ROCK_SMALL, r: 17 })),
        ...Array(5).fill(null).map(() => ({ type: ObjType.ROCK_LARGE, r: 27 })),
        ...Array(3).fill(null).map(() => ({ type: ObjType.BONE, r: 14 })),
        ...Array(3).fill(null).map(() => ({ type: ObjType.SKULL, r: 16 })),
        ...Array(3).fill(null).map(() => ({ type: ObjType.MYSTERY_BAG, r: 15 })),
        ...Array(4).fill(null).map(() => ({ type: ObjType.DIAMOND, r: 13 }))
    ]
});

LEVELS.push({
    target: LEVEL_TARGETS[9], timer: TIMER,
    objects: [
        ...Array(5).fill(null).map(() => ({ type: ObjType.GOLD_SMALL, r: 14 })),
        ...Array(4).fill(null).map(() => ({ type: ObjType.GOLD_MEDIUM, r: 22 })),
        ...Array(4).fill(null).map(() => ({ type: ObjType.GOLD_LARGE, r: 30 })),
        ...Array(3).fill(null).map(() => ({ type: ObjType.GOLD_GIANT, r: 40 })),
        ...Array(6).fill(null).map(() => ({ type: ObjType.ROCK_SMALL, r: 17 })),
        ...Array(4).fill(null).map(() => ({ type: ObjType.ROCK_LARGE, r: 27 })),
        ...Array(3).fill(null).map(() => ({ type: ObjType.BONE, r: 14 })),
        ...Array(3).fill(null).map(() => ({ type: ObjType.SKULL, r: 16 })),
        ...Array(4).fill(null).map(() => ({ type: ObjType.MYSTERY_BAG, r: 15 })),
        ...Array(4).fill(null).map(() => ({ type: ObjType.DIAMOND, r: 13 }))
    ]
});

// ===== LEVELS 11-15: Diamond Rush =====
for (let i = 10; i < 15; i++) {
    const diamondCount = 4 + (i - 10) * 2;
    const moleCount = i >= 12 ? 2 + (i - 12) : 0;
    const moleDiamondCount = i >= 13 ? 1 + (i - 13) : 0;
    LEVELS.push({
        target: LEVEL_TARGETS[i], timer: TIMER,
        objects: [
            ...Array(6).fill(null).map(() => ({ type: ObjType.GOLD_SMALL, r: 14 })),
            ...Array(5).fill(null).map(() => ({ type: ObjType.GOLD_MEDIUM, r: 22 })),
            ...Array(4).fill(null).map(() => ({ type: ObjType.GOLD_LARGE, r: 30 })),
            ...Array(2).fill(null).map(() => ({ type: ObjType.GOLD_GIANT, r: 40 })),
            ...Array(6).fill(null).map(() => ({ type: ObjType.ROCK_SMALL, r: 17 })),
            ...Array(4).fill(null).map(() => ({ type: ObjType.ROCK_LARGE, r: 27 })),
            ...Array(2).fill(null).map(() => ({ type: ObjType.BONE, r: 14 })),
            ...Array(2).fill(null).map(() => ({ type: ObjType.SKULL, r: 16 })),
            ...Array(3).fill(null).map(() => ({ type: ObjType.MYSTERY_BAG, r: 15 })),
            ...Array(diamondCount).fill(null).map(() => ({ type: ObjType.DIAMOND, r: 13 })),
            ...Array(moleCount).fill(null).map(() => ({ type: ObjType.MOLE, r: 15 })),
            ...Array(moleDiamondCount).fill(null).map(() => ({ type: ObjType.MOLE_DIAMOND, r: 16 }))
        ]
    });
}

// ===== LEVELS 16-20: Risk vs Reward (TNT introduced) =====
for (let i = 15; i < 20; i++) {
    const tntCount = 2 + (i - 15);
    const diamondCount = 5 + (i - 15);
    const giantCount = 2 + (i - 15);
    const moleCount = 2 + (i - 15);
    const moleDiamondCount = 2 + (i - 15);
    LEVELS.push({
        target: LEVEL_TARGETS[i], timer: TIMER,
        objects: [
            ...Array(5).fill(null).map(() => ({ type: ObjType.GOLD_SMALL, r: 14 })),
            ...Array(5).fill(null).map(() => ({ type: ObjType.GOLD_MEDIUM, r: 22 })),
            ...Array(4).fill(null).map(() => ({ type: ObjType.GOLD_LARGE, r: 30 })),
            ...Array(giantCount).fill(null).map(() => ({ type: ObjType.GOLD_GIANT, r: 40 })),
            ...Array(6).fill(null).map(() => ({ type: ObjType.ROCK_SMALL, r: 17 })),
            ...Array(4).fill(null).map(() => ({ type: ObjType.ROCK_LARGE, r: 27 })),
            ...Array(2).fill(null).map(() => ({ type: ObjType.BONE, r: 14 })),
            ...Array(2).fill(null).map(() => ({ type: ObjType.SKULL, r: 16 })),
            ...Array(3 + (i-15)).fill(null).map(() => ({ type: ObjType.MYSTERY_BAG, r: 15 })),
            ...Array(diamondCount).fill(null).map(() => ({ type: ObjType.DIAMOND, r: 13 })),
            ...Array(tntCount).fill(null).map(() => ({ type: ObjType.TNT, r: 18 })),
            ...Array(moleCount).fill(null).map(() => ({ type: ObjType.MOLE, r: 15 })),
            ...Array(moleDiamondCount).fill(null).map(() => ({ type: ObjType.MOLE_DIAMOND, r: 16 }))
        ]
    });
}

// ===== LEVELS 21-24: Chaos Mine =====
for (let i = 20; i < 24; i++) {
    const chaos = i - 20;
    LEVELS.push({
        target: LEVEL_TARGETS[i], timer: TIMER,
        objects: [
            ...Array(4).fill(null).map(() => ({ type: ObjType.GOLD_SMALL, r: 14 })),
            ...Array(5).fill(null).map(() => ({ type: ObjType.GOLD_MEDIUM, r: 22 })),
            ...Array(5).fill(null).map(() => ({ type: ObjType.GOLD_LARGE, r: 30 })),
            ...Array(5 + chaos).fill(null).map(() => ({ type: ObjType.GOLD_GIANT, r: 40 })),
            ...Array(6).fill(null).map(() => ({ type: ObjType.ROCK_SMALL, r: 17 })),
            ...Array(5).fill(null).map(() => ({ type: ObjType.ROCK_LARGE, r: 27 })),
            ...Array(3).fill(null).map(() => ({ type: ObjType.BONE, r: 14 })),
            ...Array(3).fill(null).map(() => ({ type: ObjType.SKULL, r: 16 })),
            ...Array(8).fill(null).map(() => ({ type: ObjType.MYSTERY_BAG, r: 15 })),
            ...Array(10 + chaos).fill(null).map(() => ({ type: ObjType.DIAMOND, r: 13 })),
            ...Array(5 + chaos).fill(null).map(() => ({ type: ObjType.TNT, r: 18 })),
            ...Array(4 + chaos).fill(null).map(() => ({ type: ObjType.MOLE, r: 15 })),
            ...Array(3 + chaos).fill(null).map(() => ({ type: ObjType.MOLE_DIAMOND, r: 16 }))
        ]
    });
}

// ===== LEVEL 25: FINAL LEVEL =====
LEVELS.push({
    target: LEVEL_TARGETS[24], timer: TIMER,
    objects: [
        ...Array(10).fill(null).map(() => ({ type: ObjType.GOLD_SMALL, r: 14 })),
        ...Array(10).fill(null).map(() => ({ type: ObjType.GOLD_MEDIUM, r: 22 })),
        ...Array(10).fill(null).map(() => ({ type: ObjType.GOLD_LARGE, r: 30 })),
        ...Array(8).fill(null).map(() => ({ type: ObjType.GOLD_GIANT, r: 40 })),
        ...Array(12).fill(null).map(() => ({ type: ObjType.DIAMOND, r: 13 })),
        ...Array(8).fill(null).map(() => ({ type: ObjType.MOLE, r: 15 })),
        ...Array(8).fill(null).map(() => ({ type: ObjType.MOLE_DIAMOND, r: 16 })),
        ...Array(10).fill(null).map(() => ({ type: ObjType.MYSTERY_BAG, r: 15 })),
        ...Array(10).fill(null).map(() => ({ type: ObjType.ROCK_SMALL, r: 17 })),
        ...Array(10).fill(null).map(() => ({ type: ObjType.ROCK_LARGE, r: 27 })),
        ...Array(8).fill(null).map(() => ({ type: ObjType.BONE, r: 14 })),
        ...Array(6).fill(null).map(() => ({ type: ObjType.SKULL, r: 16 })),
        ...Array(6).fill(null).map(() => ({ type: ObjType.TNT, r: 18 }))
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
