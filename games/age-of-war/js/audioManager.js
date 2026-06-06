/**
 * Age of War - Audio Manager
 */
const AudioManager = (() => {
    let ctx = null, enabled = true, volume = 0.5;
    function init() { if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); }
    function resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); }
    function setVolume(v) { volume = Math.max(0, Math.min(1, v)); }
    function toggle() { enabled = !enabled; return enabled; }
    function _osc(f, t, d, v) { if (!ctx) return; const o = ctx.createOscillator(), g = ctx.createGain(); o.type = t; o.frequency.value = f; g.gain.value = (v || 0.12) * volume; g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + d); o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + d); }
    function _noise(d, v) { if (!ctx) return; const b = ctx.createBuffer(1, ctx.sampleRate * d, ctx.sampleRate), data = b.getChannelData(0); for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1; const s = ctx.createBufferSource(); s.buffer = b; const g = ctx.createGain(); g.gain.value = (v || 0.08) * volume; g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + d); s.connect(g).connect(ctx.destination); s.start(); s.stop(ctx.currentTime + d); }
    const sounds = {
        spawn() { _osc(300, 'sine', 0.08, 0.1); _osc(450, 'sine', 0.06, 0.08); },
        hit() { _osc(150, 'square', 0.05, 0.08); },
        die() { _osc(200, 'sawtooth', 0.12, 0.08); },
        shoot() { _osc(800, 'sine', 0.04, 0.08); },
        explosion() { _noise(0.2, 0.12); _osc(80, 'sawtooth', 0.2, 0.1); },
        upgrade() { _osc(500, 'sine', 0.08, 0.1); setTimeout(() => _osc(700, 'sine', 0.1, 0.1), 80); },
        ageUp() { [400, 500, 600, 800].forEach((f, i) => setTimeout(() => _osc(f, 'sine', 0.15, 0.12), i * 100)); },
        victory() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => _osc(f, 'sine', 0.2, 0.15), i * 120)); },
        defeat() { _osc(300, 'sawtooth', 0.3, 0.1); setTimeout(() => _osc(200, 'sawtooth', 0.4, 0.12), 200); },
        click() { _osc(600, 'sine', 0.04, 0.08); }
    };
    function play(type) { if (!enabled || !ctx) return; resume(); if (sounds[type]) sounds[type](); }
    return { init, resume, play, toggle, setVolume, get enabled() { return enabled; } };
})();
