/**
 * Zuma Deluxe Remastered - Path Manager
 * Catmull-Rom spline system for marble tracks
 */
const PathManager = (() => {
    /**
     * Catmull-Rom interpolation
     */
    function catmullRom(p0, p1, p2, p3, t) {
        const t2 = t * t, t3 = t2 * t;
        return {
            x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
            y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
        };
    }

    /**
     * Build a smooth path from control points
     */
    function buildPath(controlPts, sampleCount) {
        sampleCount = sampleCount || 2000;
        const pts = controlPts.map(p => ({ x: p[0], y: p[1] }));
        // Pad endpoints for Catmull-Rom
        const padded = [pts[0], ...pts, pts[pts.length - 1]];
        const segments = pts.length - 1;
        const samplesPerSeg = Math.ceil(sampleCount / segments);

        const pathPts = [];
        const dists = [0];
        let totalLen = 0;

        for (let seg = 0; seg < segments; seg++) {
            const p0 = padded[seg], p1 = padded[seg + 1], p2 = padded[seg + 2], p3 = padded[seg + 3];
            for (let i = 0; i < samplesPerSeg; i++) {
                const t = i / samplesPerSeg;
                const pt = catmullRom(p0, p1, p2, p3, t);
                pathPts.push(pt);
                if (pathPts.length > 1) {
                    const prev = pathPts[pathPts.length - 2];
                    totalLen += Math.hypot(pt.x - prev.x, pt.y - prev.y);
                    dists.push(totalLen);
                }
            }
        }
        // Final point
        const last = pts[pts.length - 1];
        pathPts.push({ x: last.x, y: last.y });
        if (pathPts.length > 1) {
            const prev = pathPts[pathPts.length - 2];
            totalLen += Math.hypot(last.x - prev.x, last.y - prev.y);
            dists.push(totalLen);
        }

        return {
            points: pathPts,
            distances: dists,
            totalLength: totalLen,

            getPointAtDist(dist) {
                dist = Math.max(0, Math.min(totalLen, dist));
                let lo = 0, hi = dists.length - 1;
                while (lo < hi - 1) {
                    const mid = (lo + hi) >> 1;
                    if (dists[mid] <= dist) lo = mid; else hi = mid;
                }
                const segLen = dists[hi] - dists[lo];
                const t = segLen > 0 ? (dist - dists[lo]) / segLen : 0;
                return {
                    x: pathPts[lo].x + (pathPts[hi].x - pathPts[lo].x) * t,
                    y: pathPts[lo].y + (pathPts[hi].y - pathPts[lo].y) * t
                };
            },

            getTangentAtDist(dist) {
                const a = this.getPointAtDist(Math.max(0, dist - 2));
                const b = this.getPointAtDist(Math.min(totalLen, dist + 2));
                return Math.atan2(b.y - a.y, b.x - a.x);
            },

            getClosestDist(x, y) {
                let bestDist = 0, bestD2 = Infinity;
                // Sample at intervals for speed
                const step = totalLen / 200;
                for (let d = 0; d <= totalLen; d += step) {
                    const p = this.getPointAtDist(d);
                    const d2 = (p.x - x) ** 2 + (p.y - y) ** 2;
                    if (d2 < bestD2) { bestD2 = d2; bestDist = d; }
                }
                // Refine
                const lo = Math.max(0, bestDist - step);
                const hi = Math.min(totalLen, bestDist + step);
                for (let d = lo; d <= hi; d += step * 0.1) {
                    const p = this.getPointAtDist(d);
                    const d2 = (p.x - x) ** 2 + (p.y - y) ** 2;
                    if (d2 < bestD2) { bestD2 = d2; bestDist = d; }
                }
                return bestDist;
            }
        };
    }

    /**
     * Level path definitions (control points for each level)
     * Canvas: 800x600, playable area roughly 50-750 x 60-570
     */
    const LEVEL_PATHS = [
        // Level 1: Simple curve
        [[80, 150], [200, 80], [400, 180], [600, 100], [720, 200]],
        // Level 2: S-curve
        [[80, 120], [200, 80], [320, 200], [480, 400], [600, 280], [720, 380]],
        // Level 3: Wide wave
        [[60, 300], [160, 120], [320, 480], [480, 120], [640, 480], [740, 300]],
        // Level 4: Circle
        [[400, 100], [600, 150], [700, 320], [620, 500], [400, 540], [180, 500], [100, 320], [200, 150]],
        // Level 5 (Boss): Figure-eight
        [[400, 300], [560, 120], [700, 300], [560, 480], [400, 300], [240, 120], [100, 300], [240, 480]],
        // Level 6: Double S
        [[60, 150], [180, 80], [280, 200], [400, 80], [520, 200], [620, 80], [740, 200]],
        // Level 7: Staircase
        [[80, 500], [200, 380], [300, 500], [420, 350], [520, 480], [640, 320], [720, 200]],
        // Level 8: Diamond
        [[400, 80], [650, 300], [400, 520], [150, 300]],
        // Level 9: Loop
        [[180, 200], [350, 80], [580, 180], [640, 360], [500, 500], [280, 520], [140, 380]],
        // Level 10 (Boss): Double loop
        [[400, 80], [600, 130], [680, 300], [560, 430], [400, 360], [240, 430], [120, 300], [200, 130], [380, 220], [560, 280], [560, 440], [380, 480], [240, 380], [300, 240]],
        // Level 11: Heart
        [[400, 500], [200, 360], [130, 200], [240, 100], [400, 200], [560, 100], [670, 200], [600, 360]],
        // Level 12: Zigzag
        [[80, 100], [200, 350], [340, 80], [480, 380], [620, 80], [720, 400]],
        // Level 13: Wave cluster
        [[60, 300], [140, 180], [220, 380], [300, 180], [380, 380], [460, 180], [540, 380], [620, 180], [740, 300]],
        // Level 14: Labyrinth
        [[80, 100], [300, 100], [300, 280], [140, 280], [140, 440], [420, 440], [420, 200], [620, 200], [620, 460], [720, 460]],
        // Level 15 (Boss): Triple loop
        [[160, 300], [260, 120], [380, 300], [260, 480], [380, 300], [500, 120], [620, 300], [500, 480], [620, 300], [720, 120]],
        // Level 16: Infinity
        [[400, 300], [560, 140], [700, 300], [560, 460], [400, 300], [240, 140], [100, 300], [240, 460]],
        // Level 17: Corkscrew
        [[80, 520], [180, 400], [120, 280], [240, 160], [180, 60], [360, 120], [420, 260], [340, 380], [460, 480], [520, 360], [460, 240], [580, 140], [640, 280], [700, 420]],
        // Level 18: Extreme curves
        [[80, 300], [180, 80], [300, 520], [420, 80], [540, 520], [660, 80], [740, 420]],
        // Level 19: Snake
        [[80, 280], [200, 80], [360, 200], [420, 420], [520, 200], [640, 420], [680, 200], [720, 320], [600, 500], [380, 520], [180, 460]],
        // Level 20 (Boss): Final maze
        [[400, 60], [620, 120], [720, 300], [600, 460], [400, 540], [200, 460], [80, 300], [200, 140], [360, 260], [520, 360], [520, 200], [360, 120], [240, 240], [240, 400], [400, 400], [580, 300]]
    ];

    function getLevelPath(index) {
        const pts = LEVEL_PATHS[index % LEVEL_PATHS.length];
        return buildPath(pts);
    }

    return { buildPath, getLevelPath, LEVEL_PATHS };
})();
