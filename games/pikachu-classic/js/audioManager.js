/**
 * Pikachu Classic - Audio Manager (Web Audio API)
 */
const AudioManager = (() => {
    let ctx = null;
    let enabled = true;
    let volume = 0.5;

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
            const v = volume;

            switch (type) {
                case 'select': {
                    const o = c.createOscillator();
                    const g = c.createGain();
                    o.type = 'sine';
                    o.frequency.setValueAtTime(600, now);
                    o.frequency.exponentialRampToValueAtTime(800, now + 0.08);
                    g.gain.setValueAtTime(v * 0.15, now);
                    g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                    o.connect(g).connect(c.destination);
                    o.start(now); o.stop(now + 0.1);
                    break;
                }
                case 'match': {
                    const notes = [523, 659, 784];
                    notes.forEach((f, i) => {
                        const o = c.createOscillator();
                        const g = c.createGain();
                        o.type = 'sine';
                        o.frequency.value = f;
                        g.gain.setValueAtTime(v * 0.1, now + i * 0.06);
                        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.15);
                        o.connect(g).connect(c.destination);
                        o.start(now + i * 0.06); o.stop(now + i * 0.06 + 0.15);
                    });
                    break;
                }
                case 'combo': {
                    const notes = [523, 659, 784, 1047];
                    notes.forEach((f, i) => {
                        const o = c.createOscillator();
                        const g = c.createGain();
                        o.type = 'triangle';
                        o.frequency.value = f;
                        g.gain.setValueAtTime(v * 0.12, now + i * 0.07);
                        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.2);
                        o.connect(g).connect(c.destination);
                        o.start(now + i * 0.07); o.stop(now + i * 0.07 + 0.2);
                    });
                    break;
                }
                case 'error': {
                    const o = c.createOscillator();
                    const g = c.createGain();
                    o.type = 'sawtooth';
                    o.frequency.setValueAtTime(200, now);
                    o.frequency.exponentialRampToValueAtTime(100, now + 0.15);
                    g.gain.setValueAtTime(v * 0.1, now);
                    g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                    o.connect(g).connect(c.destination);
                    o.start(now); o.stop(now + 0.2);
                    break;
                }
                case 'shuffle': {
                    for (let i = 0; i < 5; i++) {
                        const o = c.createOscillator();
                        const g = c.createGain();
                        o.type = 'sine';
                        o.frequency.setValueAtTime(300 + i * 100, now + i * 0.04);
                        g.gain.setValueAtTime(v * 0.06, now + i * 0.04);
                        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.1);
                        o.connect(g).connect(c.destination);
                        o.start(now + i * 0.04); o.stop(now + i * 0.04 + 0.1);
                    }
                    break;
                }
                case 'victory': {
                    const notes = [523, 659, 784, 1047, 1319];
                    notes.forEach((f, i) => {
                        const o = c.createOscillator();
                        const g = c.createGain();
                        o.type = 'sine';
                        o.frequency.value = f;
                        g.gain.setValueAtTime(v * 0.1, now + i * 0.1);
                        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.25);
                        o.connect(g).connect(c.destination);
                        o.start(now + i * 0.1); o.stop(now + i * 0.1 + 0.25);
                    });
                    break;
                }
                case 'gameover': {
                    const notes = [400, 350, 300, 200];
                    notes.forEach((f, i) => {
                        const o = c.createOscillator();
                        const g = c.createGain();
                        o.type = 'sawtooth';
                        o.frequency.value = f;
                        g.gain.setValueAtTime(v * 0.08, now + i * 0.15);
                        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.3);
                        o.connect(g).connect(c.destination);
                        o.start(now + i * 0.15); o.stop(now + i * 0.15 + 0.3);
                    });
                    break;
                }
                case 'hint': {
                    const o = c.createOscillator();
                    const g = c.createGain();
                    o.type = 'sine';
                    o.frequency.setValueAtTime(800, now);
                    o.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
                    g.gain.setValueAtTime(v * 0.08, now);
                    g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                    o.connect(g).connect(c.destination);
                    o.start(now); o.stop(now + 0.15);
                    break;
                }
                case 'deadlock': {
                    const o = c.createOscillator();
                    const g = c.createGain();
                    o.type = 'square';
                    o.frequency.setValueAtTime(150, now);
                    o.frequency.exponentialRampToValueAtTime(80, now + 0.3);
                    g.gain.setValueAtTime(v * 0.08, now);
                    g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                    o.connect(g).connect(c.destination);
                    o.start(now); o.stop(now + 0.4);
                    break;
                }
            }
        } catch(e) {}
    }

    function toggle() { enabled = !enabled; return enabled; }
    function setVolume(v) { volume = Math.max(0, Math.min(1, v)); }

    return { play, toggle, setVolume, resume, get enabled() { return enabled; }, get volume() { return volume; } };
})();
