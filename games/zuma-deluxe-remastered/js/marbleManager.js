/**
 * Zuma Deluxe Remastered - Marble Manager
 * Marble chain movement, insertion, removal
 */
const MarbleManager = (() => {
    const MARBLE_RADIUS = 14;
    const MARBLE_DIAMETER = MARBLE_RADIUS * 2;
    const SPACING = MARBLE_DIAMETER; // distance between marble centers along path
    const CATCH_UP_SPEED_MULT = 2.5; // how fast marbles close gaps

    function createMarble(dist, color, special) {
        return {
            dist: dist,
            color: color,      // 0-5 index into MARBLE_COLORS
            special: special || null, // SPECIAL_TYPES value or null
            removing: false,
            removeTimer: 0,
            scale: 1,
            flash: 0
        };
    }

    function createTrain(marbleCount, colorCount, specialFreq) {
        const marbles = [];
        for (let i = marbleCount - 1; i >= 0; i--) {
            const color = Math.floor(Math.random() * colorCount);
            const special = Math.random() < specialFreq ? randomSpecial() : null;
            marbles.push(createMarble(-i * SPACING, color, special));
        }
        return marbles; // sorted by dist ascending (lead is last)
    }

    function randomSpecial() {
        const types = [SPECIAL_TYPES.BOMB, SPECIAL_TYPES.LIGHTNING, SPECIAL_TYPES.FREEZE, SPECIAL_TYPES.REVERSE];
        return types[Math.floor(Math.random() * types.length)];
    }

    /**
     * Update marble train positions
     * Lead marble (highest dist) moves forward at speed
     * Followers maintain spacing from marble in front
     * Returns true if lead marble reached end of path
     */
    function update(marbles, speed, dt, path, freezeTimer) {
        if (marbles.length === 0) return false;

        const effectiveSpeed = freezeTimer > 0 ? speed * 0.4 : speed;
        const catchUpSpeed = effectiveSpeed * CATCH_UP_SPEED_MULT;

        // Move lead marble forward
        const lead = marbles[marbles.length - 1];
        lead.dist += effectiveSpeed * dt;

        // Propagate spacing constraint from lead backward
        for (let i = marbles.length - 2; i >= 0; i--) {
            const target = marbles[i + 1].dist - SPACING;
            const diff = target - marbles[i].dist;
            if (diff > 0.5) {
                // Gap exists, close it
                marbles[i].dist += Math.min(catchUpSpeed * dt, diff);
            } else if (diff < -0.5) {
                // Marble is ahead of target (shouldn't happen normally)
                marbles[i].dist = target;
            }
        }

        // Update remove animations
        for (let i = marbles.length - 1; i >= 0; i--) {
            if (marbles[i].removing) {
                marbles[i].removeTimer -= dt;
                marbles[i].scale = Math.max(0, marbles[i].removeTimer / 0.3);
                if (marbles[i].removeTimer <= 0) {
                    marbles.splice(i, 1);
                }
            }
        }

        // Update flash effects
        for (const m of marbles) {
            if (m.flash > 0) m.flash -= dt * 4;
        }

        // Check if lead reached end
        return lead.dist >= path.totalLength;
    }

    /**
     * Insert a marble into the train at the given index
     */
    function insert(marbles, index, dist, color, special) {
        const newMarble = createMarble(dist, color, special);
        newMarble.flash = 1;
        marbles.splice(index, 0, newMarble);
        return index;
    }

    /**
     * Find the best insertion index for a projectile hitting the train
     */
    function findInsertIndex(marbles, hitX, hitY, path) {
        if (marbles.length === 0) return 0;

        let closestIdx = 0;
        let closestD2 = Infinity;

        for (let i = 0; i < marbles.length; i++) {
            const pos = path.getPointAtDist(marbles[i].dist);
            const d2 = (pos.x - hitX) ** 2 + (pos.y - hitY) ** 2;
            if (d2 < closestD2) {
                closestD2 = d2;
                closestIdx = i;
            }
        }

        // Determine side using path tangent
        const tangent = path.getTangentAtDist(marbles[closestIdx].dist);
        const marblePos = path.getPointAtDist(marbles[closestIdx].dist);
        const dx = hitX - marblePos.x;
        const dy = hitY - marblePos.y;
        const dot = dx * Math.cos(tangent) + dy * Math.sin(tangent);

        // dot > 0: hit is ahead (toward higher dist) → insert before
        // dot < 0: hit is behind → insert after
        return dot > 0 ? closestIdx : closestIdx + 1;
    }

    /**
     * Get marble position on canvas
     */
    function getPos(marble, path) {
        return path.getPointAtDist(marble.dist);
    }

    /**
     * Push marbles backward (for reverse special)
     */
    function pushBack(marbles, amount) {
        for (const m of marbles) {
            m.dist -= amount;
        }
    }

    return {
        MARBLE_RADIUS, MARBLE_DIAMETER, SPACING,
        createMarble, createTrain, update, insert,
        findInsertIndex, getPos, pushBack
    };
})();
