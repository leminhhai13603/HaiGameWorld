/**
 * 2048 - Audio Manager (Web Audio API)
 */
const AudioManager = (() => {
    let ctx = null;
    let enabled = true;
    let volume = 0.4;

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
                case 'move': {
                    const o = c.createOscillator();
                    const g = c.createGain();
                    o.type = 'sine';
                    o.frequency.setValueAtTime(300, now);
                    o.frequency.exponentialRampToValueAtTime(200, now + 0.06);
                    g.gain.setValueAtTime(v * 0.08, now);
                    g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                    o.connect(g).connect(c.destination);
                    o.start(now); o.stop(now + 0.08);
                    break;
                }
                case 'merge': {
                    const notes = [440, 554, 659];
                    notes.forEach((f, i) => {
                        const o = c.createOscillator();
                        const g = c.createGain();
                        o.type = 'sine';
                        o.frequency.value = f;
                        g.gain.setValueAtTime(v * 0.1, now + i * 0.04);
                        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.1);
                        o.connect(g).connect(c.destination);
                        o.start(now + i * 0.04); o.stop(now + i * 0.04 + 0.1);
                    });
                    break;
                }
                case 'achievement': {
                    const notes = [523, 659, 784, 1047];
                    notes.forEach((f, i) => {
                        const o = c.createOscillator();
                        const g = c.createGain();
                        o.type = 'triangle';
                        o.frequency.value = f;
                        g.gain.setValueAtTime(v * 0.12, now + i * 0.08);
                        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2);
                        o.connect(g).connect(c.destination);
                        o.start(now + i * 0.08); o.stop(now + i * 0.08 + 0.2);
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
                        g.gain.setValueAtTime(v * 0.06, now + i * 0.12);
                        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.25);
                        o.connect(g).connect(c.destination);
                        o.start(now + i * 0.12); o.stop(now + i * 0.12 + 0.25);
                    });
                    break;
                }
            }
        } catch (e) {}
    }

    function toggle() { enabled = !enabled; return enabled; }
    function setVolume(v) { volume = Math.max(0, Math.min(1, v)); }

    function close() { if (ctx) { ctx.close().catch(()=>{}); ctx = null; } }

    return { play, toggle, setVolume, resume, close, get enabled() { return enabled; } };
})();
