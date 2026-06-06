/**
 * Cyber Survivor - Audio Manager
 */
const AudioManager = (() => {
    let ctx = null, enabled = true, volume = 0.5;
    function init() { if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); }
    function resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); }
    function setVolume(v) { volume = Math.max(0, Math.min(1, v)); }
    function toggle() { enabled = !enabled; return enabled; }
    function _osc(f, t, d, v) { if (!ctx) return; const o = ctx.createOscillator(), g = ctx.createGain(); o.type = t; o.frequency.value = f; g.gain.value = (v||0.1)*volume; g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+d); o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime+d); }
    function _noise(d, v) { if (!ctx) return; const b = ctx.createBuffer(1, ctx.sampleRate*d, ctx.sampleRate), data = b.getChannelData(0); for (let i=0;i<data.length;i++) data[i] = Math.random()*2-1; const s = ctx.createBufferSource(); s.buffer = b; const g = ctx.createGain(); g.gain.value = (v||0.06)*volume; g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+d); s.connect(g).connect(ctx.destination); s.start(); s.stop(ctx.currentTime+d); }
    const sounds = {
        shoot() { _osc(1200,'sine',0.04,0.08); },
        hit() { _osc(200,'square',0.04,0.06); },
        kill() { _osc(300,'sine',0.06,0.08); _noise(0.05,0.04); },
        crit() { _osc(1500,'sine',0.06,0.1); _osc(2000,'sine',0.04,0.08); },
        levelUp() { [523,659,784,1047].forEach((f,i) => setTimeout(() => _osc(f,'sine',0.15,0.12), i*80)); },
        xpCollect() { _osc(800,'sine',0.03,0.06); },
        playerHit() { _noise(0.08,0.1); _osc(150,'sawtooth',0.1,0.08); },
        gameOver() { _osc(300,'sawtooth',0.3,0.1); setTimeout(() => _osc(200,'sawtooth',0.4,0.12), 200); },
        bossSpawn() { [200,250,300,350].forEach((f,i) => setTimeout(() => _osc(f,'sawtooth',0.2,0.1), i*100)); }
    };
    function play(type) { if (!enabled||!ctx) return; resume(); if (sounds[type]) sounds[type](); }
    return { init, resume, play, toggle, setVolume, get enabled(){return enabled;} };
})();
