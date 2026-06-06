/**
 * Zuma Deluxe Remastered - Audio Manager
 * Web Audio API synthesis (no external files)
 */
const AudioManager = (() => {
    let ctx = null;
    let enabled = true;
    let volume = 0.5;

    function init() {
        if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === 'suspended') ctx.resume();
    }

    function resume() {
        if (ctx && ctx.state === 'suspended') ctx.resume();
    }

    function setVolume(v) { volume = Math.max(0, Math.min(1, v)); }
    function toggle() { enabled = !enabled; return enabled; }

    function _osc(freq, type, dur, vol) {
        if (!ctx) return;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = type;
        o.frequency.value = freq;
        g.gain.value = (vol || 0.2) * volume;
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
        o.connect(g).connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + dur);
    }

    function _noise(dur, vol) {
        if (!ctx) return;
        const bufSize = ctx.sampleRate * dur;
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const g = ctx.createGain();
        g.gain.value = (vol || 0.1) * volume;
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
        src.connect(g).connect(ctx.destination);
        src.start();
        src.stop(ctx.currentTime + dur);
    }

    const sounds = {
        shoot() {
            _osc(900, 'sine', 0.08, 0.15);
            _osc(600, 'sine', 0.06, 0.1);
        },
        hit() {
            _osc(180, 'square', 0.06, 0.12);
            _noise(0.04, 0.08);
        },
        match() {
            _osc(523, 'sine', 0.12, 0.2);
            setTimeout(() => _osc(659, 'sine', 0.12, 0.2), 70);
            setTimeout(() => _osc(784, 'sine', 0.18, 0.25), 140);
        },
        chain() {
            _osc(440, 'sine', 0.08, 0.15);
            setTimeout(() => _osc(554, 'sine', 0.08, 0.15), 50);
            setTimeout(() => _osc(659, 'sine', 0.08, 0.15), 100);
            setTimeout(() => _osc(880, 'sine', 0.18, 0.2), 150);
        },
        combo() {
            _osc(660, 'triangle', 0.12, 0.18);
            setTimeout(() => _osc(880, 'triangle', 0.12, 0.18), 80);
            setTimeout(() => _osc(1100, 'triangle', 0.2, 0.22), 160);
        },
        powerup() {
            for (let i = 0; i < 5; i++) {
                setTimeout(() => _osc(400 + i * 150, 'sine', 0.08, 0.15), i * 50);
            }
        },
        levelComplete() {
            [523, 587, 659, 784, 880, 1047].forEach((f, i) => {
                setTimeout(() => _osc(f, 'sine', 0.18, 0.22), i * 90);
            });
        },
        gameOver() {
            _osc(440, 'sawtooth', 0.25, 0.12);
            setTimeout(() => _osc(330, 'sawtooth', 0.25, 0.12), 180);
            setTimeout(() => _osc(220, 'sawtooth', 0.4, 0.15), 360);
        },
        achievement() {
            _osc(880, 'sine', 0.08, 0.18);
            setTimeout(() => _osc(1100, 'sine', 0.08, 0.18), 80);
            setTimeout(() => _osc(1320, 'sine', 0.25, 0.22), 160);
        },
        swap() {
            _osc(500, 'sine', 0.05, 0.12);
            setTimeout(() => _osc(700, 'sine', 0.05, 0.12), 30);
        },
        special() {
            _osc(300, 'sawtooth', 0.12, 0.15);
            _osc(600, 'sine', 0.12, 0.1);
            setTimeout(() => _osc(900, 'sine', 0.18, 0.18), 80);
        },
        pause() {
            _osc(400, 'sine', 0.06, 0.1);
        }
    };

    function play(type) {
        if (!enabled || !ctx) return;
        resume();
        if (sounds[type]) sounds[type]();
    }

    function close() { if (ctx) { ctx.close().catch(()=>{}); ctx = null; } }
    return {
        init, resume, play, toggle, setVolume, close,
        get enabled() { return enabled; },
        get volume() { return volume; }
    };
})();
