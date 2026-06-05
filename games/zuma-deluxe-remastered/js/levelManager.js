/**
 * Zuma Deluxe Remastered - Level Manager
 * 20 handcrafted levels + endless mode
 */

const THEMES = {
    temple: {
        name: 'Ancient Temple',
        bg1: '#1a0f0a', bg2: '#2d1810', path: '#4a3020', pathBorder: '#8b6914',
        accent: '#d4a017', particles: '#ffd700', stone: '#3d2b1f'
    },
    jungle: {
        name: 'Jungle Ruins',
        bg1: '#0a1a0a', bg2: '#0d2818', path: '#1a3a1a', pathBorder: '#3d8b37',
        accent: '#44ff44', particles: '#88ff88', stone: '#2d4a2d'
    },
    volcano: {
        name: 'Volcano',
        bg1: '#1a0500', bg2: '#2d0a00', path: '#4a1a0a', pathBorder: '#ff4400',
        accent: '#ff6600', particles: '#ffaa00', stone: '#3d1a0a'
    },
    ice: {
        name: 'Ice Cavern',
        bg1: '#0a1520', bg2: '#0d1f30', path: '#1a3050', pathBorder: '#4488cc',
        accent: '#00ccff', particles: '#88ddff', stone: '#2a4060'
    },
    cyber: {
        name: 'Cyber Temple',
        bg1: '#0a0a1a', bg2: '#1a0a2a', path: '#2a1a3a', pathBorder: '#8844cc',
        accent: '#aa66ff', particles: '#cc88ff', stone: '#3a2a4a'
    }
};

const MARBLE_COLORS = [
    { name: 'red', fill: '#ff3333', light: '#ff8888', dark: '#cc0000', glow: '#ff0000' },
    { name: 'blue', fill: '#3388ff', light: '#88bbff', dark: '#0044cc', glow: '#0066ff' },
    { name: 'green', fill: '#33cc33', light: '#88ff88', dark: '#009900', glow: '#00ff00' },
    { name: 'yellow', fill: '#ffcc00', light: '#ffee66', dark: '#cc9900', glow: '#ffdd00' },
    { name: 'purple', fill: '#cc44ff', light: '#dd88ff', dark: '#8800cc', glow: '#aa00ff' },
    { name: 'cyan', fill: '#00cccc', light: '#66ffff', dark: '#008888', glow: '#00ffcc' }
];

const SPECIAL_TYPES = {
    BOMB: 'bomb',
    LIGHTNING: 'lightning',
    RAINBOW: 'rainbow',
    FREEZE: 'freeze',
    REVERSE: 'reverse'
};

const LevelDefs = [
    { speed: 12, colors: 3, marbles: 35, specialFreq: 0, theme: 'temple', desc: 'Làm quen — đường đơn giản' },
    { speed: 14, colors: 3, marbles: 38, specialFreq: 0, theme: 'temple', desc: 'Đường cong chữ S' },
    { speed: 16, colors: 4, marbles: 40, specialFreq: 0.02, theme: 'jungle', desc: 'Sóng rộng — nhiều màu hơn' },
    { speed: 18, colors: 4, marbles: 42, specialFreq: 0.03, theme: 'jungle', desc: 'Vòng tròn hoàn hảo' },
    { speed: 20, colors: 4, marbles: 48, specialFreq: 0.05, theme: 'jungle', desc: 'BOSS: Số 8 khổng lồ', boss: true },
    { speed: 18, colors: 4, marbles: 42, specialFreq: 0.03, theme: 'volcano', desc: 'Chữ S đôi' },
    { speed: 20, colors: 5, marbles: 45, specialFreq: 0.04, theme: 'volcano', desc: 'Cầu thang zigzag' },
    { speed: 22, colors: 5, marbles: 48, specialFreq: 0.04, theme: 'volcano', desc: 'Hình thoi' },
    { speed: 24, colors: 5, marbles: 50, specialFreq: 0.05, theme: 'ice', desc: 'Vòng lặp kép' },
    { speed: 26, colors: 5, marbles: 54, specialFreq: 0.06, theme: 'ice', desc: 'BOSS: Hai vòng xoắn', boss: true },
    { speed: 22, colors: 5, marbles: 48, specialFreq: 0.05, theme: 'ice', desc: 'Hình trái tim' },
    { speed: 24, colors: 5, marbles: 50, specialFreq: 0.05, theme: 'cyber', desc: 'Zigzag cực đại' },
    { speed: 26, colors: 5, marbles: 52, specialFreq: 0.06, theme: 'cyber', desc: 'Sóng liên tục' },
    { speed: 28, colors: 6, marbles: 55, specialFreq: 0.06, theme: 'cyber', desc: 'Mê cung phức tạp' },
    { speed: 30, colors: 6, marbles: 58, specialFreq: 0.07, theme: 'cyber', desc: 'BOSS: Ba vòng lặp', boss: true },
    { speed: 26, colors: 5, marbles: 52, specialFreq: 0.06, theme: 'temple', desc: 'Vô cực' },
    { speed: 28, colors: 6, marbles: 55, specialFreq: 0.07, theme: 'jungle', desc: 'Xoắn ốc' },
    { speed: 30, colors: 6, marbles: 58, specialFreq: 0.07, theme: 'volcano', desc: 'Đường cong cực đoan' },
    { speed: 32, colors: 6, marbles: 60, specialFreq: 0.08, theme: 'ice', desc: 'Rắn uốn lượn' },
    { speed: 35, colors: 6, marbles: 65, specialFreq: 0.1, theme: 'cyber', desc: 'BOSS: Mê cung cuối cùng', boss: true }
];

const LevelManager = {
    getLevel(index) {
        if (index >= LevelDefs.length) {
            const base = LevelDefs[LevelDefs.length - 1];
            return {
                ...base,
                speed: Math.min(50, base.speed + (index - 19) * 2),
                marbles: Math.min(80, base.marbles + (index - 19) * 3),
                desc: 'Level ' + (index + 1) + ' — Endless'
            };
        }
        return LevelDefs[index];
    },

    getTotalLevels() { return LevelDefs.length; },

    getTheme(themeName) {
        return THEMES[themeName] || THEMES.temple;
    },

    getStars(score, timeUsed, maxTime) {
        const ratio = timeUsed / maxTime;
        if (ratio < 0.4) return 3;
        if (ratio < 0.7) return 2;
        return 1;
    }
};
