/**
 * Sudoku Master - Audio Manager
 */
const AudioManager = (() => {
    let ctx = null;
    let enabled = true;
    let volume = 0.5;

    function init() {
        if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === 'suspended') ctx.resume();
    }
    function resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); }
    function setVolume(v) { volume = Math.max(0, Math.min(1, v)); }
    function toggle() { enabled = !enabled; return enabled; }

    function _osc(freq, type, dur, vol) {
        if (!ctx) return;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = type;
        o.frequency.value = freq;
        g.gain.value = (vol || 0.15) * volume;
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
        o.connect(g).connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + dur);
    }

    const sounds = {
        select() { _osc(600, 'sine', 0.05, 0.1); },
        place() { _osc(800, 'sine', 0.08, 0.12); _osc(1000, 'sine', 0.06, 0.08); },
        erase() { _osc(300, 'sine', 0.06, 0.08); },
        note() { _osc(500, 'triangle', 0.05, 0.1); },
        error() { _osc(200, 'square', 0.15, 0.1); },
        complete() {
            [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => _osc(f, 'sine', 0.2, 0.15), i * 100));
        },
        hint() { _osc(880, 'sine', 0.1, 0.12); _osc(1100, 'sine', 0.08, 0.1); },
        undo() { _osc(400, 'sine', 0.06, 0.08); },
        achievement() {
            _osc(880, 'sine', 0.08, 0.12);
            setTimeout(() => _osc(1100, 'sine', 0.08, 0.12), 80);
            setTimeout(() => _osc(1320, 'sine', 0.2, 0.15), 160);
        }
    };

    function play(type) {
        if (!enabled || !ctx) return;
        resume();
        if (sounds[type]) sounds[type]();
    }

    function close() { if (ctx) { ctx.close().catch(()=>{}); ctx = null; } }
    return { init, resume, play, toggle, setVolume, close, get enabled() { return enabled; } };
})();
