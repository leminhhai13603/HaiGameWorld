/**
 * DX-Ball Remastered - Audio Manager (Web Audio API)
 */
const AudioManager = (() => {
    let ctx = null;
    let enabled = true;
    let volume = 0.4;

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
            const v = volume;

            switch (type) {
                case 'paddleHit': {
                    const o = c.createOscillator(); const g = c.createGain();
                    o.type = 'sine'; o.frequency.setValueAtTime(300, t);
                    o.frequency.exponentialRampToValueAtTime(500, t + 0.06);
                    g.gain.setValueAtTime(v * 0.12, t);
                    g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
                    o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.08);
                    break;
                }
                case 'brickBreak': {
                    const o = c.createOscillator(); const g = c.createGain();
                    o.type = 'square'; o.frequency.setValueAtTime(600, t);
                    o.frequency.exponentialRampToValueAtTime(200, t + 0.08);
                    g.gain.setValueAtTime(v * 0.1, t);
                    g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
                    o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.1);
                    break;
                }
                case 'strongBreak': {
                    [400, 500, 600].forEach((f, i) => {
                        const o = c.createOscillator(); const g = c.createGain();
                        o.type = 'triangle'; o.frequency.value = f;
                        g.gain.setValueAtTime(v * 0.1, t + i * 0.04);
                        g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.04 + 0.1);
                        o.connect(g).connect(c.destination);
                        o.start(t + i * 0.04); o.stop(t + i * 0.04 + 0.1);
                    });
                    break;
                }
                case 'powerup': {
                    [500, 700, 900, 1100].forEach((f, i) => {
                        const o = c.createOscillator(); const g = c.createGain();
                        o.type = 'sine'; o.frequency.value = f;
                        g.gain.setValueAtTime(v * 0.08, t + i * 0.05);
                        g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.12);
                        o.connect(g).connect(c.destination);
                        o.start(t + i * 0.05); o.stop(t + i * 0.05 + 0.12);
                    });
                    break;
                }
                case 'laser': {
                    const o = c.createOscillator(); const g = c.createGain();
                    o.type = 'sawtooth'; o.frequency.setValueAtTime(1200, t);
                    o.frequency.exponentialRampToValueAtTime(400, t + 0.06);
                    g.gain.setValueAtTime(v * 0.08, t);
                    g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
                    o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.08);
                    break;
                }
                case 'explosion': {
                    const bs = c.sampleRate * 0.15;
                    const buf = c.createBuffer(1, bs, c.sampleRate);
                    const d = buf.getChannelData(0);
                    for (let i = 0; i < bs; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / bs);
                    const s = c.createBufferSource(); const g = c.createGain();
                    s.buffer = buf; g.gain.setValueAtTime(v * 0.2, t);
                    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
                    s.connect(g).connect(c.destination); s.start(t);
                    break;
                }
                case 'levelComplete': {
                    [523, 659, 784, 1047].forEach((f, i) => {
                        const o = c.createOscillator(); const g = c.createGain();
                        o.type = 'triangle'; o.frequency.value = f;
                        g.gain.setValueAtTime(v * 0.12, t + i * 0.1);
                        g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.25);
                        o.connect(g).connect(c.destination);
                        o.start(t + i * 0.1); o.stop(t + i * 0.1 + 0.25);
                    });
                    break;
                }
                case 'gameover': {
                    [400, 350, 300, 200].forEach((f, i) => {
                        const o = c.createOscillator(); const g = c.createGain();
                        o.type = 'sawtooth'; o.frequency.value = f;
                        g.gain.setValueAtTime(v * 0.06, t + i * 0.12);
                        g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.25);
                        o.connect(g).connect(c.destination);
                        o.start(t + i * 0.12); o.stop(t + i * 0.12 + 0.25);
                    });
                    break;
                }
            }
        } catch (e) {}
    }

    function toggle() { enabled = !enabled; return enabled; }
    function setVolume(v) { volume = Math.max(0, Math.min(1, v)); }
    return { play, toggle, setVolume, resume, get enabled() { return enabled; } };
})();
