/**
 * Factory Empire - Audio Manager
 */
const AudioManager = (() => {
    let ctx = null;
    let enabled = true;
    let volume = 0.4;
    const sounds = {};

    function getCtx() {
        if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
        return ctx;
    }

    function resume() {
        if (ctx && ctx.state === 'suspended') ctx.resume();
    }

    function play(type) {
        if (!enabled || !ctx) return;
        try {
            resume();
            const c = getCtx();
            const now = c.currentTime;
            const v = volume;
            switch(type) {
                case 'build': {
                    const o = c.createOscillator(); const g = c.createGain();
                    o.type = 'square'; o.frequency.setValueAtTime(200, now);
                    o.frequency.linearRampToValueAtTime(400, now+0.1);
                    g.gain.setValueAtTime(v*0.2, now); g.gain.linearRampToValueAtTime(0, now+0.15);
                    o.connect(g); g.connect(c.destination); o.start(now); o.stop(now+0.15);
                    break;
                }
                case 'sell': {
                    const o = c.createOscillator(); const g = c.createGain();
                    o.type = 'sine'; o.frequency.setValueAtTime(800, now);
                    o.frequency.linearRampToValueAtTime(1200, now+0.1);
                    g.gain.setValueAtTime(v*0.15, now); g.gain.linearRampToValueAtTime(0, now+0.15);
                    o.connect(g); g.connect(c.destination); o.start(now); o.stop(now+0.15);
                    break;
                }
                case 'research': {
                    const o = c.createOscillator(); const g = c.createGain();
                    o.type = 'sine'; o.frequency.setValueAtTime(600, now);
                    o.frequency.linearRampToValueAtTime(900, now+0.2);
                    g.gain.setValueAtTime(v*0.1, now); g.gain.linearRampToValueAtTime(0, now+0.3);
                    o.connect(g); g.connect(c.destination); o.start(now); o.stop(now+0.3);
                    break;
                }
                case 'error': {
                    const o = c.createOscillator(); const g = c.createGain();
                    o.type = 'sawtooth'; o.frequency.setValueAtTime(150, now);
                    g.gain.setValueAtTime(v*0.2, now); g.gain.linearRampToValueAtTime(0, now+0.2);
                    o.connect(g); g.connect(c.destination); o.start(now); o.stop(now+0.2);
                    break;
                }
                case 'click': {
                    const o = c.createOscillator(); const g = c.createGain();
                    o.type = 'sine'; o.frequency.setValueAtTime(500, now);
                    g.gain.setValueAtTime(v*0.08, now); g.gain.linearRampToValueAtTime(0, now+0.05);
                    o.connect(g); g.connect(c.destination); o.start(now); o.stop(now+0.05);
                    break;
                }
            }
        } catch(e) {}
    }

    function toggle() { enabled = !enabled; return enabled; }
    function setVolume(v) { volume = Math.max(0, Math.min(1, v)); }
    function close() { if (ctx) { ctx.close().catch(()=>{}); ctx = null; } }

    return { play, toggle, setVolume, resume, close, get enabled(){ return enabled; } };
})();
