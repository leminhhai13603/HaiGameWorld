/**
 * Flappy Bird - Storage Manager (localStorage)
 */
const Storage = (() => {
    const KEY = 'flappyBird';

    function _load() {
        try {
            const raw = localStorage.getItem(KEY);
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return { highScore: 0, gamesPlayed: 0 };
    }

    function _save(data) {
        try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
    }

    function getHighScore() {
        return _load().highScore || 0;
    }

    function setHighScore(score) {
        const data = _load();
        if (score > (data.highScore || 0)) {
            data.highScore = score;
            _save(data);
            return true;
        }
        return false;
    }

    function getGamesPlayed() {
        return _load().gamesPlayed || 0;
    }

    function addGamePlayed() {
        const data = _load();
        data.gamesPlayed = (data.gamesPlayed || 0) + 1;
        _save(data);
    }

    return { getHighScore, setHighScore, getGamesPlayed, addGamePlayed };
})();
