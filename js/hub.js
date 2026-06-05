/**
 * Mini Game Hub - Core Logic
 */
const Hub = {
    games: [
        {
            id: 'space-avian-assault',
            name: 'Space Avian Assault',
            desc: 'Bắn gà không gian — tiêu diệt waves of alien birds, săn boss, nâng cấp vũ khí.',
            tag: 'Shooter',
            thumb: '🚀',
            thumbClass: 'space-thumb',
            path: 'games/space-avian-assault/index.html',
            featured: true
        },
        {
            id: 'gold-miner',
            name: 'Gold Miner',
            desc: 'Kéo vàng cổ điển — swing your hook, grab gold, diamonds and beat the clock!',
            tag: 'Arcade',
            thumb: '⛏️',
            thumbClass: 'gold-thumb',
            path: 'games/gold-miner/index.html',
            featured: false
        },
        {
            id: 'pikachu-classic',
            name: 'Pikachu Classic',
            desc: 'Onet Connect — match identical tiles with max 2 turns. 25 levels, combo system!',
            tag: 'Puzzle',
            thumb: '🐶',
            thumbClass: 'pikachu-thumb',
            path: 'games/pikachu-classic/index.html',
            featured: false
        },
        {
            id: 'battle-city',
            name: 'Battle City',
            desc: 'Tank 1990 remake — protect the Eagle Base! 35 levels, boss battles, co-op mode!',
            tag: 'Action',
            thumb: '🎯',
            thumbClass: 'battle-thumb',
            path: 'games/battle-city/index.html',
            featured: false
        },
        {
            id: 'flappy-bird',
            name: 'Flappy Bird',
            desc: 'Classic endless flying game. Avoid pipes and achieve the highest score.',
            tag: 'Arcade',
            thumb: '🐦',
            thumbClass: 'flappy-thumb',
            path: 'games/flappy-bird/index.html',
            featured: false
        },
        {
            id: '2048',
            name: '2048',
            desc: 'Combine matching tiles to create larger numbers and achieve the highest score possible.',
            tag: 'Puzzle',
            thumb: '🔢',
            thumbClass: 'thumb-2048',
            path: 'games/2048/index.html',
            featured: false
        },
        {
            id: 'dino-hunter',
            name: 'Dino Hunter',
            desc: 'Modern endless runner inspired by Chrome Dino. Run, jump, dodge, collect, survive!',
            tag: 'Arcade',
            thumb: '🦖',
            thumbClass: 'dino-thumb',
            path: 'games/dino-hunter/index.html',
            featured: false
        }
    ],

    init() {
        this.renderFeatured();
        this.renderGrid();
        this.loadStats();
    },

    renderFeatured() {
        const featured = this.games.find(g => g.featured);
        if (!featured) return;

        const el = document.getElementById('featured-game');
        el.innerHTML = `
            <a href="${featured.path}" class="featured" style="text-decoration:none;color:inherit;">
                <div class="featured-inner">
                    <div class="featured-thumb">${featured.thumb}</div>
                    <div class="featured-info">
                        <div class="featured-badge">Featured</div>
                        <h2 class="featured-name">${featured.name}</h2>
                        <p class="featured-desc">${featured.desc}</p>
                        <span class="btn-play">▶ Play Now</span>
                    </div>
                </div>
            </a>
        `;
    },

    renderGrid() {
        const grid = document.getElementById('games-grid');
        grid.innerHTML = this.games.map(game => `
            <a href="${game.path}" class="game-card animate-in delay-${this.games.indexOf(game) + 1}" style="text-decoration:none;color:inherit;">
                <div class="card-thumb ${game.thumbClass}">${game.thumb}</div>
                <div class="card-body">
                    <div class="card-name">${game.name}</div>
                    <div class="card-desc">${game.desc}</div>
                    <div class="card-footer">
                        <span class="card-tag">${game.tag}</span>
                        <span class="btn-card-play">▶ Play</span>
                    </div>
                </div>
            </a>
        `).join('');
    },

    loadStats() {
        let totalPlays = 0;
        let highScores = [];

        // Space Avian Assault stats
        try {
            const saa = JSON.parse(localStorage.getItem('spaceAvianAssault') || '{}');
            if (saa.highScore) highScores.push({ game: 'Space Avian Assault', score: saa.highScore });
            if (saa.gamesPlayed) totalPlays += saa.gamesPlayed;
        } catch(e) {}

        // Gold Miner stats
        try {
            const gm = JSON.parse(localStorage.getItem('goldMiner') || '{}');
            if (gm.highScore) highScores.push({ game: 'Gold Miner', score: gm.highScore });
            if (gm.gamesPlayed) totalPlays += gm.gamesPlayed;
        } catch(e) {}

        // Flappy Bird stats
        try {
            const fb = JSON.parse(localStorage.getItem('flappyBird') || '{}');
            if (fb.highScore) highScores.push({ game: 'Flappy Bird', score: fb.highScore });
            if (fb.gamesPlayed) totalPlays += fb.gamesPlayed;
        } catch(e) {}

        // 2048 stats
        try {
            const g2048 = JSON.parse(localStorage.getItem('game2048') || '{}');
            if (g2048.bestScore) highScores.push({ game: '2048', score: g2048.bestScore });
            if (g2048.gamesPlayed) totalPlays += g2048.gamesPlayed;
        } catch(e) {}

        // Dino Hunter stats
        try {
            const dh = JSON.parse(localStorage.getItem('dinoHunter') || '{}');
            if (dh.bestScore) highScores.push({ game: 'Dino Hunter', score: dh.bestScore });
            if (dh.gamesPlayed) totalPlays += dh.gamesPlayed;
        } catch(e) {}

        document.getElementById('stat-games').textContent = this.games.length;
        document.getElementById('stat-plays').textContent = totalPlays;
        document.getElementById('stat-best').textContent = highScores.length
            ? Math.max(...highScores.map(h => h.score)).toLocaleString()
            : '—';
    }
};

document.addEventListener('DOMContentLoaded', () => Hub.init());
