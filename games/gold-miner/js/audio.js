/**
 * Gold Miner - Audio System (Web Audio API)
 */
const AudioSystem = (() => {
    let ctx = null;
    let enabled = true;

    function getCtx() {
        if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
        return ctx;
    }

    function resume() {
        if (ctx && ctx.state === 'suspended') ctx.resume();
    }

    function play(type) {
        if (!enabled) return;
        try {
            resume();
            const c = getCtx();
            const now = c.currentTime;

            switch (type) {
                case 'launch': {
                    const o = c.createOscillator();
                    const g = c.createGain();
                    o.type = 'sine';
                    o.frequency.setValueAtTime(600, now);
                    o.frequency.exponentialRampToValueAtTime(200, now + 0.15);
                    g.gain.setValueAtTime(0.12, now);
                    g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                    o.connect(g).connect(c.destination);
                    o.start(now); o.stop(now + 0.2);
                    break;
                }
                case 'grab': {
                    const o = c.createOscillator();
                    const g = c.createGain();
                    o.type = 'square';
                    o.frequency.setValueAtTime(300, now);
                    o.frequency.exponentialRampToValueAtTime(800, now + 0.08);
                    g.gain.setValueAtTime(0.1, now);
                    g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                    o.connect(g).connect(c.destination);
                    o.start(now); o.stop(now + 0.15);
                    break;
                }
                case 'gold': {
                    const o = c.createOscillator();
                    const g = c.createGain();
                    o.type = 'sine';
                    o.frequency.setValueAtTime(800, now);
                    o.frequency.exponentialRampToValueAtTime(1600, now + 0.2);
                    g.gain.setValueAtTime(0.12, now);
                    g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                    o.connect(g).connect(c.destination);
                    o.start(now); o.stop(now + 0.3);
                    break;
                }
                case 'diamond': {
                    for (let i = 0; i < 3; i++) {
                        const o = c.createOscillator();
                        const g = c.createGain();
                        o.type = 'sine';
                        o.frequency.setValueAtTime(1000 + i * 400, now + i * 0.08);
                        g.gain.setValueAtTime(0.08, now + i * 0.08);
                        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.15);
                        o.connect(g).connect(c.destination);
                        o.start(now + i * 0.08); o.stop(now + i * 0.08 + 0.15);
                    }
                    break;
                }
                case 'rock': {
                    const o = c.createOscillator();
                    const g = c.createGain();
                    o.type = 'triangle';
                    o.frequency.setValueAtTime(150, now);
                    o.frequency.exponentialRampToValueAtTime(60, now + 0.2);
                    g.gain.setValueAtTime(0.12, now);
                    g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                    o.connect(g).connect(c.destination);
                    o.start(now); o.stop(now + 0.25);
                    break;
                }
                case 'bone': {
                    const o = c.createOscillator();
                    const g = c.createGain();
                    o.type = 'triangle';
                    o.frequency.setValueAtTime(200, now);
                    o.frequency.exponentialRampToValueAtTime(80, now + 0.15);
                    g.gain.setValueAtTime(0.1, now);
                    g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                    o.connect(g).connect(c.destination);
                    o.start(now); o.stop(now + 0.2);
                    break;
                }
                case 'tnt': {
                    const o = c.createOscillator();
                    const g1 = c.createGain();
                    o.type = 'sine';
                    o.frequency.setValueAtTime(80, now);
                    o.frequency.exponentialRampToValueAtTime(20, now + 0.3);
                    g1.gain.setValueAtTime(0.25, now);
                    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                    o.connect(g1).connect(c.destination);
                    o.start(now); o.stop(now + 0.4);
                    const bufSize = c.sampleRate * 0.5;
                    const buf = c.createBuffer(1, bufSize, c.sampleRate);
                    const data = buf.getChannelData(0);
                    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 2);
                    const src = c.createBufferSource();
                    const g2 = c.createGain();
                    src.buffer = buf;
                    g2.gain.setValueAtTime(0.2, now);
                    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                    src.connect(g2).connect(c.destination);
                    src.start(now);
                    break;
                }
                case 'explosion': {
                    const bufSize = c.sampleRate * 0.3;
                    const buf = c.createBuffer(1, bufSize, c.sampleRate);
                    const data = buf.getChannelData(0);
                    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
                    const src = c.createBufferSource();
                    const g = c.createGain();
                    src.buffer = buf;
                    g.gain.setValueAtTime(0.15, now);
                    g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                    src.connect(g).connect(c.destination);
                    src.start(now);
                    break;
                }
                case 'mole': {
                    const o = c.createOscillator();
                    const g = c.createGain();
                    o.type = 'sawtooth';
                    o.frequency.setValueAtTime(200, now);
                    o.frequency.exponentialRampToValueAtTime(400, now + 0.05);
                    o.frequency.exponentialRampToValueAtTime(150, now + 0.15);
                    g.gain.setValueAtTime(0.08, now);
                    g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                    o.connect(g).connect(c.destination);
                    o.start(now); o.stop(now + 0.2);
                    break;
                }
                case 'buy': {
                    const o = c.createOscillator();
                    const g = c.createGain();
                    o.type = 'sine';
                    o.frequency.setValueAtTime(500, now);
                    o.frequency.exponentialRampToValueAtTime(800, now + 0.1);
                    g.gain.setValueAtTime(0.1, now);
                    g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                    o.connect(g).connect(c.destination);
                    o.start(now); o.stop(now + 0.15);
                    break;
                }
                case 'victory': {
                    const notes = [523, 659, 784, 1047];
                    notes.forEach((freq, i) => {
                        const o = c.createOscillator();
                        const g = c.createGain();
                        o.type = 'sine';
                        o.frequency.value = freq;
                        g.gain.setValueAtTime(0.1, now + i * 0.12);
                        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.3);
                        o.connect(g).connect(c.destination);
                        o.start(now + i * 0.12); o.stop(now + i * 0.12 + 0.3);
                    });
                    break;
                }
                case 'fail': {
                    const o = c.createOscillator();
                    const g = c.createGain();
                    o.type = 'sawtooth';
                    o.frequency.setValueAtTime(400, now);
                    o.frequency.exponentialRampToValueAtTime(100, now + 0.5);
                    g.gain.setValueAtTime(0.1, now);
                    g.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
                    o.connect(g).connect(c.destination);
                    o.start(now); o.stop(now + 0.6);
                    break;
                }
                case 'levelup': {
                    const notes = [440, 554, 659, 880];
                    notes.forEach((freq, i) => {
                        const o = c.createOscillator();
                        const g = c.createGain();
                        o.type = 'triangle';
                        o.frequency.value = freq;
                        g.gain.setValueAtTime(0.08, now + i * 0.1);
                        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.25);
                        o.connect(g).connect(c.destination);
                        o.start(now + i * 0.1); o.stop(now + i * 0.1 + 0.25);
                    });
                    break;
                }
                case 'dynamite': {
                    const o = c.createOscillator();
                    const g = c.createGain();
                    o.type = 'sawtooth';
                    o.frequency.setValueAtTime(100, now);
                    o.frequency.exponentialRampToValueAtTime(30, now + 0.4);
                    g.gain.setValueAtTime(0.2, now);
                    g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                    o.connect(g).connect(c.destination);
                    o.start(now); o.stop(now + 0.5);
                    break;
                }
                case 'strength': {
                    const o = c.createOscillator();
                    const g = c.createGain();
                    o.type = 'sine';
                    o.frequency.setValueAtTime(400, now);
                    o.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
                    g.gain.setValueAtTime(0.1, now);
                    g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                    o.connect(g).connect(c.destination);
                    o.start(now); o.stop(now + 0.2);
                    break;
                }
            }
        } catch(e) {}
    }

    function toggle() { enabled = !enabled; return enabled; }

    function close() { if (ctx) { ctx.close().catch(()=>{}); ctx = null; } }
    return { play, toggle, resume, close, get enabled() { return enabled; } };
})();
