/**
 * Cyber Survivor Phase 2 - Audio Manager
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
        shoot() { _osc(1200,'sine',0.03,0.06); },
        laser() { _osc(2000,'sine',0.08,0.04); },
        rocket() { _osc(150,'sawtooth',0.15,0.08); },
        lightning() { _osc(800,'square',0.05,0.06); _osc(1600,'square',0.03,0.04); },
        orbit() { _osc(600,'sine',0.04,0.04); },
        saw() { _noise(0.03,0.04); },
        plasma() { _osc(300,'sine',0.15,0.08); _osc(600,'sine',0.1,0.06); },
        ice() { _osc(2400,'sine',0.06,0.05); },
        missiles() { _osc(900,'sine',0.04,0.05); },
        hit() { _osc(200,'square',0.03,0.05); },
        kill() { _osc(300,'sine',0.05,0.06); _noise(0.04,0.03); },
        crit() { _osc(1500,'sine',0.05,0.08); _osc(2000,'sine',0.03,0.06); },
        levelUp() { [523,659,784,1047].forEach((f,i) => setTimeout(() => _osc(f,'sine',0.12,0.1), i*70)); },
        evolve() { [400,500,600,800,1000].forEach((f,i) => setTimeout(() => _osc(f,'sine',0.15,0.12), i*60)); },
        xpCollect() { _osc(800,'sine',0.02,0.04); },
        playerHit() { _noise(0.06,0.08); _osc(150,'sawtooth',0.08,0.06); },
        gameOver() { _osc(300,'sawtooth',0.25,0.08); setTimeout(() => _osc(200,'sawtooth',0.35,0.1), 180); },
        bossSpawn() { [150,200,250,300,350].forEach((f,i) => setTimeout(() => _osc(f,'sawtooth',0.15,0.08), i*80)); },
        bossDie() { [300,400,500,600,800].forEach((f,i) => setTimeout(() => _osc(f,'sine',0.2,0.1), i*60)); },
        event() { _osc(800,'triangle',0.1,0.08); _osc(1000,'triangle',0.1,0.08); },
        explosion() { _noise(0.2,0.12); _osc(80,'sawtooth',0.15,0.08); },
        metaUpgrade() { _osc(500,'sine',0.08,0.08); setTimeout(() => _osc(700,'sine',0.1,0.1), 80); }
    };
    function play(type) { if (!enabled||!ctx) return; resume(); if (sounds[type]) sounds[type](); }
    return { init, resume, play, toggle, setVolume, get enabled(){return enabled;} };
})();
