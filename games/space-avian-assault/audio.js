/**
 * AudioManager - Manages sound effects with Web Audio API
 * Supports easy replacement of sound files
 */
const AudioManager = {
    ctx: null,
    sounds: {},
    enabled: true,
    masterVolume: 0.5,

    // Initialize audio context
    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    },

    // Resume audio context (required after user interaction)
    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    // Register a sound (for future file replacement)
    register(name, config) {
        this.sounds[name] = config;
    },

    // Play a synthesized sound effect
    play(name) {
        if (!this.enabled || !this.ctx) return;
        this.resume();

        switch (name) {
            case 'shoot': this._playShoot(); break;
            case 'enemyHit': this._playEnemyHit(); break;
            case 'playerHit': this._playPlayerHit(); break;
            case 'explosion': this._playExplosion(); break;
            case 'powerup': this._playPowerup(); break;
            case 'bossHit': this._playBossHit(); break;
            case 'bossDeath': this._playBossDeath(); break;
            case 'laser': this._playLaser(); break;
            case 'shield': this._playShield(); break;
            case 'gameOver': this._playGameOver(); break;
            case 'victory': this._playVictory(); break;
            case 'combo': this._playCombo(); break;
        }
    },

    // Create oscillator helper
    _createOsc(type, freq, duration, volume = 0.3) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(volume * this.masterVolume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration);
    },

    // Create noise helper
    _createNoise(duration, volume = 0.2) {
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const source = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        source.buffer = buffer;
        gain.gain.setValueAtTime(volume * this.masterVolume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        source.connect(gain);
        gain.connect(this.ctx.destination);
        source.start(this.ctx.currentTime);
    },

    // Sound effects
    _playShoot() {
        this._createOsc('square', 800, 0.1, 0.15);
        this._createOsc('sawtooth', 600, 0.05, 0.1);
    },

    _playEnemyHit() {
        this._createOsc('square', 300, 0.1, 0.2);
        this._createNoise(0.05, 0.15);
    },

    _playPlayerHit() {
        this._createOsc('sawtooth', 200, 0.3, 0.3);
        this._createNoise(0.2, 0.2);
    },

    _playExplosion() {
        this._createNoise(0.4, 0.4);
        this._createOsc('sine', 100, 0.3, 0.3);
    },

    _playPowerup() {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.15);
        osc.frequency.linearRampToValueAtTime(1200, now + 0.3);
        gain.gain.setValueAtTime(0.2 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
    },

    _playBossHit() {
        this._createOsc('square', 150, 0.2, 0.25);
        this._createNoise(0.1, 0.2);
    },

    _playBossDeath() {
        this._createNoise(0.8, 0.5);
        this._createOsc('sine', 80, 0.6, 0.4);
        setTimeout(() => this._createNoise(0.5, 0.3), 200);
        setTimeout(() => this._createNoise(0.3, 0.2), 400);
    },

    _playLaser() {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1000, now);
        osc.frequency.linearRampToValueAtTime(200, now + 0.3);
        gain.gain.setValueAtTime(0.15 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
    },

    _playShield() {
        this._createOsc('sine', 600, 0.2, 0.15);
        this._createOsc('sine', 900, 0.15, 0.1);
    },

    _playGameOver() {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.8);
        gain.gain.setValueAtTime(0.3 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.8);
    },

    _playVictory() {
        const now = this.ctx.currentTime;
        const notes = [523, 659, 784, 1047]; // C E G C
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.15);
            gain.gain.setValueAtTime(0.2 * this.masterVolume, now + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.3);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + i * 0.15);
            osc.stop(now + i * 0.15 + 0.3);
        });
    },

    _playCombo() {
        this._createOsc('sine', 1000, 0.1, 0.15);
        setTimeout(() => this._createOsc('sine', 1200, 0.1, 0.12), 50);
    },

    // Toggle sound on/off
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    },

    // Close audio context
    close() {
        if (this.ctx) { this.ctx.close().catch(()=>{}); this.ctx = null; }
    }
};
