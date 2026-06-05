/**
 * Tetris Ultimate - Audio Manager
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

    function _tone(freq, dur, type, vol) {
        const c = getCtx();
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = type || 'square';
        osc.frequency.setValueAtTime(freq, c.currentTime);
        gain.gain.setValueAtTime((vol || 0.15) * volume, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(c.currentTime);
        osc.stop(c.currentTime + dur);
    }

    function _noise(dur, vol) {
        const c = getCtx();
        const bufSize = c.sampleRate * dur;
        const buf = c.createBuffer(1, bufSize, c.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
        const src = c.createBufferSource();
        const gain = c.createGain();
        src.buffer = buf;
        gain.gain.setValueAtTime((vol || 0.1) * volume, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
        src.connect(gain);
        gain.connect(c.destination);
        src.start();
    }

    function play(type) {
        if (!enabled) return;
        try {
            resume();
            switch (type) {
                case 'move':
                    _tone(200, 0.05, 'square', 0.08);
                    break;
                case 'rotate':
                    _tone(400, 0.08, 'square', 0.1);
                    break;
                case 'softDrop':
                    _tone(150, 0.04, 'triangle', 0.06);
                    break;
                case 'hardDrop':
                    _noise(0.12, 0.15);
                    _tone(100, 0.15, 'sine', 0.12);
                    break;
                case 'hold':
                    _tone(300, 0.06, 'sine', 0.1);
                    _tone(450, 0.06, 'sine', 0.1);
                    break;
                case 'lineClear':
                    _tone(523, 0.1, 'square', 0.12);
                    setTimeout(() => _tone(659, 0.1, 'square', 0.12), 60);
                    setTimeout(() => _tone(784, 0.15, 'square', 0.12), 120);
                    break;
                case 'tetris':
                    _tone(523, 0.08, 'square', 0.15);
                    setTimeout(() => _tone(659, 0.08, 'square', 0.15), 50);
                    setTimeout(() => _tone(784, 0.08, 'square', 0.15), 100);
                    setTimeout(() => _tone(1047, 0.2, 'square', 0.15), 150);
                    break;
                case 'combo':
                    _tone(880, 0.06, 'sawtooth', 0.1);
                    _tone(1100, 0.1, 'sawtooth', 0.08);
                    break;
                case 'levelUp':
                    _tone(440, 0.1, 'square', 0.12);
                    setTimeout(() => _tone(554, 0.1, 'square', 0.12), 80);
                    setTimeout(() => _tone(659, 0.1, 'square', 0.12), 160);
                    setTimeout(() => _tone(880, 0.2, 'square', 0.15), 240);
                    break;
                case 'gameOver':
                    _tone(440, 0.3, 'sawtooth', 0.12);
                    setTimeout(() => _tone(349, 0.3, 'sawtooth', 0.12), 200);
                    setTimeout(() => _tone(293, 0.4, 'sawtooth', 0.12), 400);
                    setTimeout(() => _tone(220, 0.6, 'sawtooth', 0.15), 600);
                    break;
                case 'achievement':
                    _tone(659, 0.1, 'sine', 0.12);
                    setTimeout(() => _tone(784, 0.1, 'sine', 0.12), 80);
                    setTimeout(() => _tone(1047, 0.15, 'sine', 0.12), 160);
                    setTimeout(() => _tone(1318, 0.2, 'sine', 0.15), 260);
                    break;
            }
        } catch (e) { /* ignore audio errors */ }
    }

    function toggle() {
        enabled = !enabled;
        return enabled;
    }

    function setEnabled(v) { enabled = !!v; }
    function isEnabled() { return enabled; }

    return { play, toggle, setEnabled, isEnabled, resume };
})();
