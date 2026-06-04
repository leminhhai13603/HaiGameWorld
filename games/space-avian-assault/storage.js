/**
 * Storage - LocalStorage manager for high scores
 */
const Storage = {
    KEYS: {
        HIGH_SCORE: 'spaceAvian_highScore',
        HIGH_WAVE: 'spaceAvian_highWave'
    },

    // Get high score
    getHighScore() {
        try {
            return parseInt(localStorage.getItem(this.KEYS.HIGH_SCORE)) || 0;
        } catch (e) {
            return 0;
        }
    },

    // Set high score if new score is higher
    setHighScore(score) {
        try {
            const current = this.getHighScore();
            if (score > current) {
                localStorage.setItem(this.KEYS.HIGH_SCORE, score.toString());
                return true; // New record
            }
            return false;
        } catch (e) {
            return false;
        }
    },

    // Get highest wave reached
    getHighWave() {
        try {
            return parseInt(localStorage.getItem(this.KEYS.HIGH_WAVE)) || 0;
        } catch (e) {
            return 0;
        }
    },

    // Set highest wave
    setHighWave(wave) {
        try {
            const current = this.getHighWave();
            if (wave > current) {
                localStorage.setItem(this.KEYS.HIGH_WAVE, wave.toString());
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    },

    // Clear all data
    clear() {
        try {
            localStorage.removeItem(this.KEYS.HIGH_SCORE);
            localStorage.removeItem(this.KEYS.HIGH_WAVE);
        } catch (e) {
            // Silent fail
        }
    }
};
