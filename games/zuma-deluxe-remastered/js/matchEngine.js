/**
 * Zuma Deluxe Remastered - Match Engine
 * Match detection, chain reactions, scoring
 */
const MatchEngine = (() => {
    /**
     * Find consecutive same-color run around an index
     * Returns { start, count } or null
     */
    function findMatch(marbles, index) {
        if (index < 0 || index >= marbles.length) return null;
        const color = marbles[index].color;

        // Rainbow special matches any color
        const isRainbow = marbles[index].special === SPECIAL_TYPES.RAINBOW;
        const matchColor = isRainbow ? null : color;

        let start = index;
        let end = index;

        // Expand backward
        while (start > 0) {
            const prev = marbles[start - 1];
            if (matchColor === null) {
                if (prev.color !== color && prev.special !== SPECIAL_TYPES.RAINBOW) break;
            } else {
                if (prev.color !== matchColor && prev.special !== SPECIAL_TYPES.RAINBOW) break;
            }
            start--;
        }

        // Expand forward
        while (end < marbles.length - 1) {
            const next = marbles[end + 1];
            if (matchColor === null) {
                if (next.color !== color && next.special !== SPECIAL_TYPES.RAINBOW) break;
            } else {
                if (next.color !== matchColor && next.special !== SPECIAL_TYPES.RAINBOW) break;
            }
            end++;
        }

        const count = end - start + 1;
        if (count >= 3) {
            return { start, count };
        }
        return null;
    }

    /**
     * Remove matched marbles and calculate score
     * Returns { removed: [], score, hasBomb, hasLightning, hasFreeze, hasReverse }
     */
    function removeMatch(marbles, match) {
        const removed = [];
        let score = 0;
        let hasBomb = false, hasLightning = false, hasFreeze = false, hasReverse = false;

        // Base score: 100 for 3, 200 for 4, 500 for 5+
        if (match.count >= 5) score = 500;
        else if (match.count >= 4) score = 200;
        else score = 100;

        // Mark for removal
        for (let i = match.start; i < match.start + match.count; i++) {
            const m = marbles[i];
            removed.push({ dist: m.dist, color: m.color, special: m.special });
            if (m.special === SPECIAL_TYPES.BOMB) hasBomb = true;
            if (m.special === SPECIAL_TYPES.LIGHTNING) hasLightning = true;
            if (m.special === SPECIAL_TYPES.FREEZE) hasFreeze = true;
            if (m.special === SPECIAL_TYPES.REVERSE) hasReverse = true;
            m.removing = true;
            m.removeTimer = 0.3;
        }

        return { removed, score, hasBomb, hasLightning, hasFreeze, hasReverse };
    }

    /**
     * Process bomb special - remove marbles near the bomb
     */
    function processBomb(marbles, bombIndex, path) {
        const bombPos = path.getPointAtDist(marbles[bombIndex].dist);
        const radius = MarbleManager.SPACING * 3;
        const removed = [];

        for (let i = marbles.length - 1; i >= 0; i--) {
            if (i === bombIndex) continue;
            if (marbles[i].removing) continue;
            const pos = path.getPointAtDist(marbles[i].dist);
            const d = Math.hypot(pos.x - bombPos.x, pos.y - bombPos.y);
            if (d < radius) {
                removed.push({ dist: marbles[i].dist, color: marbles[i].color });
                marbles[i].removing = true;
                marbles[i].removeTimer = 0.3;
            }
        }
        return removed;
    }

    /**
     * Process lightning special - remove marbles in a line
     */
    function processLightning(marbles, lightIndex) {
        const removed = [];
        const start = Math.max(0, lightIndex - 5);
        const end = Math.min(marbles.length - 1, lightIndex + 5);

        for (let i = start; i <= end; i++) {
            if (marbles[i].removing) continue;
            removed.push({ dist: marbles[i].dist, color: marbles[i].color });
            marbles[i].removing = true;
            marbles[i].removeTimer = 0.3;
        }
        return removed;
    }

    /**
     * Check for chain reactions after gap closes
     * Look for marbles that are now adjacent and same color
     * Returns the match info or null
     */
    function checkChainReaction(marbles) {
        for (let i = 0; i < marbles.length - 2; i++) {
            if (marbles[i].removing) continue;
            const match = findMatch(marbles, i);
            if (match) return match;
        }
        return null;
    }

    /**
     * Calculate score with combo multiplier
     */
    function calcScore(baseScore, combo) {
        return baseScore * Math.max(1, combo);
    }

    return { findMatch, removeMatch, processBomb, processLightning, checkChainReaction, calcScore };
})();
