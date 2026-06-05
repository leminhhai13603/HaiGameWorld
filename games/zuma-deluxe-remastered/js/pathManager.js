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
        // Level 1: Long gentle curve
        [[60, 200], [150, 100], [300, 180], [450, 100], [600, 180], [700, 120], [750, 250]],
        // Level 2: Long S-curve
        [[60, 100], [150, 60], [250, 180], [350, 350], [450, 450], [550, 350], [650, 200], [740, 300]],
        // Level 3: Wide wave (longer)
        [[50, 300], [120, 100], [240, 450], [360, 100], [480, 450], [600, 100], [720, 350]],
        // Level 4: Big circle
        [[400, 80], [580, 100], [700, 200], [720, 350], [650, 480], [450, 540], [250, 520], [120, 400], [80, 250], [150, 120]],
        // Level 5 (Boss): Figure-eight (longer)
        [[400, 300], [520, 120], [660, 180], [720, 300], [660, 420], [520, 480], [400, 300], [280, 120], [140, 180], [80, 300], [140, 420], [280, 480]],
        // Level 6: Triple S
        [[50, 120], [130, 60], [210, 180], [290, 60], [370, 180], [450, 60], [530, 180], [610, 60], [690, 180], [750, 120]],
        // Level 7: Long staircase
        [[60, 520], [150, 400], [240, 520], [330, 380], [420, 500], [510, 360], [600, 480], [690, 340], [750, 200]],
        // Level 8: Diamond (longer with loops)
        [[400, 60], [550, 120], [680, 250], [700, 380], [600, 500], [450, 560], [300, 520], [150, 400], [100, 260], [180, 130], [300, 70]],
        // Level 9: Double loop
        [[120, 200], [200, 80], [350, 100], [480, 180], [550, 320], [480, 450], [350, 500], [220, 450], [150, 320], [220, 200], [350, 150], [500, 200], [620, 320], [680, 450], [740, 350]],
        // Level 10 (Boss): Double loop (longer)
        [[400, 60], [560, 80], [680, 180], [720, 320], [650, 450], [500, 500], [350, 480], [220, 400], [150, 280], [180, 150], [280, 80], [400, 120], [520, 180], [580, 300], [560, 420], [450, 480], [320, 450], [250, 340], [280, 220], [380, 160]],
        // Level 11: Heart (longer)
        [[400, 520], [280, 450], [180, 350], [120, 240], [140, 140], [220, 80], [340, 100], [400, 180], [460, 100], [580, 80], [660, 140], [680, 240], [620, 350], [520, 450]],
        // Level 12: Long zigzag
        [[60, 80], [160, 350], [260, 80], [360, 380], [460, 80], [560, 380], [660, 80], [740, 350]],
        // Level 13: Dense wave
        [[50, 300], [100, 150], [170, 400], [240, 150], [310, 400], [380, 150], [450, 400], [520, 150], [590, 400], [660, 150], [740, 300]],
        // Level 14: Complex labyrinth
        [[60, 80], [200, 80], [280, 80], [280, 250], [120, 250], [120, 420], [300, 420], [300, 200], [480, 200], [480, 400], [620, 400], [620, 180], [720, 180], [720, 460]],
        // Level 15 (Boss): Triple loop (longer)
        [[100, 300], [180, 120], [300, 150], [380, 300], [300, 450], [380, 300], [480, 120], [600, 150], [660, 300], [580, 450], [660, 300], [740, 120]],
        // Level 16: Infinity (longer)
        [[400, 300], [520, 140], [660, 160], [720, 300], [660, 440], [520, 460], [400, 300], [280, 140], [140, 160], [80, 300], [140, 440], [280, 460]],
        // Level 17: Corkscrew (longer)
        [[60, 530], [140, 420], [100, 300], [180, 180], [120, 80], [250, 100], [340, 200], [280, 320], [360, 430], [440, 350], [400, 230], [500, 140], [560, 250], [640, 380], [700, 480], [740, 380]],
        // Level 18: Extreme curves
        [[60, 300], [140, 80], [240, 480], [340, 80], [440, 480], [540, 80], [640, 480], [740, 300]],
        // Level 19: Long snake
        [[60, 280], [150, 80], [280, 150], [350, 350], [420, 150], [520, 380], [580, 150], [660, 350], [720, 200], [650, 480], [450, 540], [250, 500], [120, 400]],
        // Level 20 (Boss): Final maze (longer)
        [[400, 50], [560, 80], [680, 160], [740, 300], [680, 440], [560, 520], [400, 560], [240, 520], [120, 440], [60, 300], [120, 160], [240, 80], [350, 180], [480, 280], [560, 380], [560, 220], [440, 140], [320, 200], [240, 320], [240, 440], [380, 440], [520, 360], [620, 260]]
    ];

    function getLevelPath(index) {
        const pts = LEVEL_PATHS[index % LEVEL_PATHS.length];
        return buildPath(pts);
    }

    return { buildPath, getLevelPath, LEVEL_PATHS };
})();
