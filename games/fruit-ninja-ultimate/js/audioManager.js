/**
 * Fruit Ninja Ultimate - Audio Manager
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
        slice() {
            _osc(800, 'sine', 0.06, 0.15);
            _osc(1200, 'sine', 0.04, 0.1);
            _noise(0.03, 0.08);
        },
        combo() {
            _osc(600, 'sine', 0.08, 0.15);
            setTimeout(() => _osc(800, 'sine', 0.08, 0.15), 50);
            setTimeout(() => _osc(1000, 'sine', 0.12, 0.18), 100);
        },
        critical() {
            _osc(1200, 'sine', 0.08, 0.2);
            _osc(1800, 'sine', 0.06, 0.15);
            setTimeout(() => _osc(2400, 'sine', 0.12, 0.2), 60);
        },
        powerup() {
            for (let i = 0; i < 4; i++) {
                setTimeout(() => _osc(400 + i * 200, 'sine', 0.08, 0.15), i * 40);
            }
        },
        bomb() {
            _osc(80, 'sawtooth', 0.4, 0.25);
            _noise(0.3, 0.2);
            setTimeout(() => _osc(60, 'sawtooth', 0.3, 0.15), 100);
        },
        gameOver() {
            _osc(400, 'sawtooth', 0.2, 0.12);
            setTimeout(() => _osc(300, 'sawtooth', 0.2, 0.12), 150);
            setTimeout(() => _osc(200, 'sawtooth', 0.3, 0.15), 300);
        },
        achievement() {
            _osc(880, 'sine', 0.08, 0.18);
            setTimeout(() => _osc(1100, 'sine', 0.08, 0.18), 80);
            setTimeout(() => _osc(1320, 'sine', 0.25, 0.22), 160);
        },
        frenzy() {
            for (let i = 0; i < 6; i++) {
                setTimeout(() => _osc(300 + i * 100, 'triangle', 0.05, 0.12), i * 30);
            }
        },
        freeze() {
            _osc(2000, 'sine', 0.15, 0.12);
            _osc(2500, 'sine', 0.12, 0.1);
        },
        shield() {
            _osc(500, 'triangle', 0.1, 0.15);
            setTimeout(() => _osc(700, 'triangle', 0.15, 0.18), 60);
        },
        miss() {
            _osc(200, 'square', 0.15, 0.1);
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
