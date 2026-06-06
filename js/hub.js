/**
 * Mini Game Hub - Core Logic
 */
const Hub = {
    games: [
        {
            id: 'space-avian-assault',
            name: 'Space Avian Assault',
            desc: 'Bắn gà không gian — tiêu diệt đàn gà alien, săn boss, nâng cấp vũ khí.',
            tag: 'Shooter',
            thumb: '🚀',
            thumbClass: 'space-thumb',
            path: 'games/space-avian-assault/index.html',
            featured: true
        },
        {
            id: 'gold-miner',
            name: 'Gold Miner',
            desc: 'Kéo vàng cổ điển — quăng dây kéo vàng, kim cương, vượt qua mỗi màn!',
            tag: 'Arcade',
            thumb: '⛏️',
            thumbClass: 'gold-thumb',
            path: 'games/gold-miner/index.html',
            featured: false
        },
        {
            id: 'pikachu-classic',
            name: 'Pikachu Classic',
            desc: 'Ghép hình Pikachu — nối 2 hình giống nhau trong tối đa 2 đường gấp. 25 màn!',
            tag: 'Puzzle',
            thumb: '🐶',
            thumbClass: 'pikachu-thumb',
            path: 'games/pikachu-classic/index.html',
            featured: false
        },
        {
            id: 'battle-city',
            name: 'Battle City',
            desc: 'Tank 1990 — bảo vệ căn cứ Đại Bàng! 35 màn, đấu boss, chơi 2 người!',
            tag: 'Action',
            thumb: '🎯',
            thumbClass: 'battle-thumb',
            path: 'games/battle-city/index.html',
            featured: false
        },
        {
            id: 'flappy-bird',
            name: 'Flappy Bird',
            desc: 'Chim bay bất tận — né ống nước, đạt điểm cao nhất!',
            tag: 'Arcade',
            thumb: '🐦',
            thumbClass: 'flappy-thumb',
            path: 'games/flappy-bird/index.html',
            featured: false
        },
        {
            id: '2048',
            name: '2048',
            desc: 'Ghép số — cộng các ô giống nhau để tạo số lớn hơn, đạt điểm cao nhất!',
            tag: 'Puzzle',
            thumb: '🔢',
            thumbClass: 'thumb-2048',
            path: 'games/2048/index.html',
            featured: false
        },
        {
            id: 'dino-hunter',
            name: 'Dino Hunter',
            desc: 'Chạy bất tận kiểu Chrome Dino — chạy, nhảy, né chướng ngại, thu thập, sống sót!',
            tag: 'Arcade',
            thumb: '🦖',
            thumbClass: 'dino-thumb',
            path: 'games/dino-hunter/index.html',
            featured: false
        },
        {
            id: 'dx-ball-remastered',
            name: 'DX-Ball Remastered',
            desc: 'Phá gạch cổ điển — đập gạch, nhặt power-up, vượt 20 màn!',
            tag: 'Arcade',
            thumb: '🧱',
            thumbClass: 'dxbal-thumb',
            path: 'games/dx-ball-remastered/index.html',
            featured: false
        },
        {
            id: 'tetris-ultimate',
            name: 'Tetris Ultimate',
            desc: 'Xếp gạch cổ điển — sắp xếp tetromino, xoá dòng, combo, sống sót càng lâu càng tốt!',
            tag: 'Puzzle',
            thumb: '🟦',
            thumbClass: 'tetris-thumb',
            path: 'games/tetris-ultimate/index.html',
            featured: false
        },
        {
            id: 'zuma-deluxe-remastered',
            name: 'Zuma Deluxe Remastered',
            desc: 'Bắn bi cổ điển — ngắm, bắn, ghép 3+ viên bi cùng màu, phá chuỗi, combo, vượt 20 màn!',
            tag: 'Arcade',
            thumb: '🐸',
            thumbClass: 'zuma-thumb',
            path: 'games/zuma-deluxe-remastered/index.html',
            featured: false
        },
        {
            id: 'fruit-ninja-ultimate',
            name: 'Fruit Ninja Ultimate',
            desc: 'Chém trái cây — vuốt chém, combo, tránh bom, power-ups, 3 chế độ chơi!',
            tag: 'Arcade',
            thumb: '🍉',
            thumbClass: 'fruit-thumb',
            path: 'games/fruit-ninja-ultimate/index.html',
            featured: false
        },
        {
            id: 'sudoku-master',
            name: 'Sudoku Master',
            desc: 'Sudoku cổ điển — điền số 1-9 vào lưới, 5 độ khó, gợi ý, hoàn tác!',
            tag: 'Puzzle',
            thumb: '🔢',
            thumbClass: 'sudoku-thumb',
            path: 'games/sudoku-master/index.html',
            featured: false
        },
        {
            id: 'age-of-war',
            name: 'Age of War: Ultimate Edition',
            desc: 'Chiến thuật — tiến hóa qua 5 thời đại, huấn luyện quân đội, bảo vệ căn cứ, tiêu diệt kẻ thù!',
            tag: 'Strategy',
            thumb: '⚔️',
            thumbClass: 'ageofwar-thumb',
            path: 'games/age-of-war/index.html',
            featured: false
        },
        {
            id: 'pvz-lite',
            name: 'Plants vs Zombies Lite',
            desc: 'Tháp phòng thủ — trồng cây, bảo vệ nhà, tiêu diệt zombie qua 20 wave!',
            tag: 'Strategy',
            thumb: '🌻',
            thumbClass: 'pvz-thumb',
            path: 'games/pvz-lite/index.html',
            featured: false
        }
    ],

    _carouselIndex: 0,
    _carouselTimer: null,

    init() {
        this.renderFeatured();
        this.renderGrid();
        this.loadStats();
    },

    renderFeatured() {
        const el = document.getElementById('featured-game');
        const games = this.games;

        el.innerHTML = `
            <div class="carousel">
                <div class="carousel-track" id="carousel-track">
                    ${games.map((g, i) => `
                        <a href="${g.path}" class="featured carousel-slide" style="text-decoration:none;color:inherit;" data-index="${i}">
                            <div class="featured-inner">
                                <div class="featured-thumb ${g.thumbClass}">${g.thumb}</div>
                                <div class="featured-info">
                                    <div class="featured-badge">${g.tag}</div>
                                    <h2 class="featured-name">${g.name}</h2>
                                    <p class="featured-desc">${g.desc}</p>
                                    <span class="btn-play">▶ Play Now</span>
                                </div>
                            </div>
                        </a>
                    `).join('')}
                </div>
                <button class="carousel-btn carousel-prev" id="carousel-prev">‹</button>
                <button class="carousel-btn carousel-next" id="carousel-next">›</button>
                <div class="carousel-dots" id="carousel-dots">
                    ${games.map((_, i) => `<span class="carousel-dot${i === 0 ? ' active' : ''}" data-index="${i}"></span>`).join('')}
                </div>
            </div>
        `;

        this._carouselIndex = 0;
        this._updateCarousel();

        // Buttons
        document.getElementById('carousel-prev').addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation();
            this._carouselIndex = (this._carouselIndex - 1 + games.length) % games.length;
            this._updateCarousel(); this._resetAutoplay();
        });
        document.getElementById('carousel-next').addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation();
            this._carouselIndex = (this._carouselIndex + 1) % games.length;
            this._updateCarousel(); this._resetAutoplay();
        });

        // Dots
        document.querySelectorAll('.carousel-dot').forEach(dot => {
            dot.addEventListener('click', (e) => {
                e.preventDefault(); e.stopPropagation();
                this._carouselIndex = parseInt(dot.dataset.index);
                this._updateCarousel(); this._resetAutoplay();
            });
        });

        // Touch swipe
        let touchStartX = 0;
        const track = document.getElementById('carousel-track');
        track.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
        track.addEventListener('touchend', (e) => {
            const dx = e.changedTouches[0].clientX - touchStartX;
            if (Math.abs(dx) > 40) {
                this._carouselIndex = (this._carouselIndex + (dx > 0 ? -1 : 1) + games.length) % games.length;
                this._updateCarousel(); this._resetAutoplay();
            }
        }, { passive: true });

        // Autoplay
        this._startAutoplay();
    },

    _updateCarousel() {
        const track = document.getElementById('carousel-track');
        if (!track) return;
        track.style.transform = `translateX(-${this._carouselIndex * 100}%)`;

        document.querySelectorAll('.carousel-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === this._carouselIndex);
        });
    },

    _startAutoplay() {
        this._carouselTimer = setInterval(() => {
            this._carouselIndex = (this._carouselIndex + 1) % this.games.length;
            this._updateCarousel();
        }, 4000);
    },

    _resetAutoplay() {
        clearInterval(this._carouselTimer);
        this._startAutoplay();
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

        // DX-Ball stats
        try {
            const dx = JSON.parse(localStorage.getItem('dxBallRemastered') || '{}');
            if (dx.bestScore) highScores.push({ game: 'DX-Ball', score: dx.bestScore });
            if (dx.gamesPlayed) totalPlays += dx.gamesPlayed;
        } catch(e) {}

        // Tetris Ultimate stats
        try {
            const tu = JSON.parse(localStorage.getItem('tetrisUltimate') || '{}');
            if (tu.bestScore) highScores.push({ game: 'Tetris Ultimate', score: tu.bestScore });
            if (tu.gamesPlayed) totalPlays += tu.gamesPlayed;
        } catch(e) {}

        // Zuma Deluxe Remastered stats
        try {
            const zuma = JSON.parse(localStorage.getItem('zumaDeluxeRemastered') || '{}');
            if (zuma.bestScore) highScores.push({ game: 'Zuma Deluxe Remastered', score: zuma.bestScore });
            if (zuma.gamesPlayed) totalPlays += zuma.gamesPlayed;
        } catch(e) {}

        // Fruit Ninja Ultimate stats
        try {
            const fn = JSON.parse(localStorage.getItem('fruitNinjaUltimate') || '{}');
            const fnBest = Math.max(fn.bestScoreClassic || 0, fn.bestScoreArcade || 0, fn.bestScoreZen || 0);
            if (fnBest) highScores.push({ game: 'Fruit Ninja Ultimate', score: fnBest });
            if (fn.gamesPlayed) totalPlays += fn.gamesPlayed;
        } catch(e) {}

        // Sudoku Master stats
        try {
            const sudoku = JSON.parse(localStorage.getItem('sudokuMaster') || '{}');
            if (sudoku.stats && sudoku.stats.gamesCompleted) totalPlays += sudoku.stats.gamesCompleted;
        } catch(e) {}

        // Age of War stats
        try {
            const aow = JSON.parse(localStorage.getItem('ageOfWar') || '{}');
            if (aow.stats && aow.stats.gamesPlayed) totalPlays += aow.stats.gamesPlayed;
        } catch(e) {}

        // PvZ Lite stats
        try {
            const pvz = JSON.parse(localStorage.getItem('pvzLite') || '{}');
            if (pvz.gamesPlayed) totalPlays += pvz.gamesPlayed;
        } catch(e) {}

        document.getElementById('stat-games').textContent = this.games.length;
        document.getElementById('stat-plays').textContent = totalPlays;
        document.getElementById('stat-best').textContent = highScores.length
            ? Math.max(...highScores.map(h => h.score)).toLocaleString()
            : '—';
    }
};

document.addEventListener('DOMContentLoaded', () => Hub.init());
