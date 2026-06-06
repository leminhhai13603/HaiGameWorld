/**
 * Battle City - Audio Manager
 */
const AudioManager = (() => {
    let ctx = null;
    let enabled = true;
    let sfxVol = 0.4;
    let musicVol = 0.3;

    function getCtx() {
        if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
        return ctx;
    }
    function resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); }

    function play(type) {
        if (!enabled) return;
        try {
            resume();
            const c = getCtx();
            const t = c.currentTime;
            const v = sfxVol;

            switch(type) {
                case 'shoot': {
                    const o = c.createOscillator(); const g = c.createGain();
                    o.type = 'square'; o.frequency.setValueAtTime(800, t);
                    o.frequency.exponentialRampToValueAtTime(200, t + 0.08);
                    g.gain.setValueAtTime(v * 0.15, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
                    o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.1);
                    break;
                }
                case 'hit': {
                    const o = c.createOscillator(); const g = c.createGain();
                    o.type = 'sawtooth'; o.frequency.setValueAtTime(200, t);
                    o.frequency.exponentialRampToValueAtTime(80, t + 0.1);
                    g.gain.setValueAtTime(v * 0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
                    o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.15);
                    break;
                }
                case 'explode': {
                    const bs = c.sampleRate * 0.3; const buf = c.createBuffer(1, bs, c.sampleRate);
                    const d = buf.getChannelData(0);
                    for (let i = 0; i < bs; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / bs);
                    const s = c.createBufferSource(); const g = c.createGain();
                    s.buffer = buf; g.gain.setValueAtTime(v * 0.25, t);
                    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
                    s.connect(g).connect(c.destination); s.start(t);
                    break;
                }
                case 'powerup': {
                    [600, 800, 1000, 1200].forEach((f, i) => {
                        const o = c.createOscillator(); const g = c.createGain();
                        o.type = 'sine'; o.frequency.value = f;
                        g.gain.setValueAtTime(v * 0.08, t + i * 0.05);
                        g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.12);
                        o.connect(g).connect(c.destination); o.start(t + i * 0.05); o.stop(t + i * 0.05 + 0.12);
                    });
                    break;
                }
                case 'life': {
                    [440, 554, 659, 880].forEach((f, i) => {
                        const o = c.createOscillator(); const g = c.createGain();
                        o.type = 'triangle'; o.frequency.value = f;
                        g.gain.setValueAtTime(v * 0.1, t + i * 0.08);
                        g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.2);
                        o.connect(g).connect(c.destination); o.start(t + i * 0.08); o.stop(t + i * 0.08 + 0.2);
                    });
                    break;
                }
                case 'gameover': {
                    [400, 350, 300, 200, 150].forEach((f, i) => {
                        const o = c.createOscillator(); const g = c.createGain();
                        o.type = 'sawtooth'; o.frequency.value = f;
                        g.gain.setValueAtTime(v * 0.08, t + i * 0.15);
                        g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.15 + 0.3);
                        o.connect(g).connect(c.destination); o.start(t + i * 0.15); o.stop(t + i * 0.15 + 0.3);
                    });
                    break;
                }
                case 'victory': {
                    [523, 659, 784, 1047].forEach((f, i) => {
                        const o = c.createOscillator(); const g = c.createGain();
                        o.type = 'sine'; o.frequency.value = f;
                        g.gain.setValueAtTime(v * 0.1, t + i * 0.12);
                        g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.25);
                        o.connect(g).connect(c.destination); o.start(t + i * 0.12); o.stop(t + i * 0.12 + 0.25);
                    });
                    break;
                }
                case 'pause': {
                    const o = c.createOscillator(); const g = c.createGain();
                    o.type = 'sine'; o.frequency.value = 440;
                    g.gain.setValueAtTime(v * 0.1, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
                    o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.15);
                    break;
                }
                case 'boss': {
                    const o = c.createOscillator(); const g = c.createGain();
                    o.type = 'sawtooth'; o.frequency.setValueAtTime(100, t);
                    o.frequency.exponentialRampToValueAtTime(50, t + 0.5);
                    g.gain.setValueAtTime(v * 0.15, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
                    o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.6);
                    break;
                }
            }
        } catch(e) {}
    }

    function toggle() { enabled = !enabled; return enabled; }
    function setSfx(v) { sfxVol = Math.max(0, Math.min(1, v)); }
    function setMusic(v) { musicVol = Math.max(0, Math.min(1, v)); }

    function close() { if (ctx) { ctx.close().catch(()=>{}); ctx = null; } }
    return { play, toggle, setSfx, setMusic, resume, close, get enabled() { return enabled; }, get sfxVol() { return sfxVol; }, get musicVol() { return musicVol; } };
})();
