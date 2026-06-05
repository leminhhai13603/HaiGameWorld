/**
 * Flappy Bird - Audio Manager (Web Audio API)
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
                case 'flap': {
                    const o = c.createOscillator();
                    const g = c.createGain();
                    o.type = 'sine';
                    o.frequency.setValueAtTime(400, now);
                    o.frequency.exponentialRampToValueAtTime(600, now + 0.08);
                    g.gain.setValueAtTime(v * 0.12, now);
                    g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                    o.connect(g).connect(c.destination);
                    o.start(now); o.stop(now + 0.1);
                    break;
                }
                case 'score': {
                    const notes = [587, 784];
                    notes.forEach((f, i) => {
                        const o = c.createOscillator();
                        const g = c.createGain();
                        o.type = 'sine';
                        o.frequency.value = f;
                        g.gain.setValueAtTime(v * 0.1, now + i * 0.07);
                        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.12);
                        o.connect(g).connect(c.destination);
                        o.start(now + i * 0.07); o.stop(now + i * 0.07 + 0.12);
                    });
                    break;
                }
                case 'hit': {
                    const bs = c.sampleRate * 0.15;
                    const buf = c.createBuffer(1, bs, c.sampleRate);
                    const d = buf.getChannelData(0);
                    for (let i = 0; i < bs; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / bs);
                    const s = c.createBufferSource();
                    const g = c.createGain();
                    s.buffer = buf;
                    g.gain.setValueAtTime(v * 0.2, now);
                    g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                    s.connect(g).connect(c.destination);
                    s.start(now);
                    break;
                }
                case 'swoosh': {
                    const o = c.createOscillator();
                    const g = c.createGain();
                    o.type = 'sine';
                    o.frequency.setValueAtTime(300, now);
                    o.frequency.exponentialRampToValueAtTime(100, now + 0.3);
                    g.gain.setValueAtTime(v * 0.08, now);
                    g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                    o.connect(g).connect(c.destination);
                    o.start(now); o.stop(now + 0.3);
                    break;
                }
            }
        } catch (e) {}
    }

    function toggle() { enabled = !enabled; return enabled; }
    function setVolume(v) { volume = Math.max(0, Math.min(1, v)); }

    return { play, toggle, setVolume, resume, get enabled() { return enabled; }, get volume() { return volume; } };
})();
