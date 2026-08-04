export const AudioManager = {
    ctx: null,
    bgmGain: null,
    sfxGain: null,
    bgm: null,
    isBgmMuted: localStorage.getItem('peanutJumpBgmMuted') === 'true',
    isSfxMuted: localStorage.getItem('peanutJumpSfxMuted') === 'true',

    init() {
        if (this.ctx) return;
        
        // Initialize AudioContext
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Master gains
        this.bgmGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();

        this.bgmGain.connect(this.ctx.destination);
        this.sfxGain.connect(this.ctx.destination);
        
        this.updateVolumes();
        
        // Setup BGM - Use the disco track instead of the old music.mp3
        this.bgm = new Audio("/assets/music/BGIG_Disco1.mp3");
        this.bgm.loop = true;
        
        const source = this.ctx.createMediaElementSource(this.bgm);
        const localGain = this.ctx.createGain();
        localGain.gain.value = 1.0; 
        source.connect(localGain);
        localGain.connect(this.bgmGain);
    },

    updateVolumes() {
        if (!this.ctx) return;
        // Adjusted per user request: BGM louder, SFX softer
        this.bgmGain.gain.value = this.isBgmMuted ? 0 : 0.6;
        this.sfxGain.gain.value = this.isSfxMuted ? 0 : 0.5;
    },

    playBGM() {
        if (!this.ctx) this.init();
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        this.bgm.play().catch(e => console.log("BGM deferred until interaction", e));
    },

    playJumpSFX() {
        if (!this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    },

    playClickSFX() {
        if (!this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1000, this.ctx.currentTime + 0.05);
        
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.4, this.ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    },

    playBreakSFX() {
        if (!this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.type = "square";
        osc.frequency.setValueAtTime(100, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.15);
        
        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    },
    
    playBoosterSFX() {
        if (!this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.type = "triangle";
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.2);
        
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.4, this.ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    },
    
    playMilestoneSFX() {
        if (!this.ctx) return;
        
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.sfxGain);
        
        osc1.type = "square";
        osc2.type = "square";
        
        // Major chord arpeggio
        osc1.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
        osc1.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.1); // E5
        osc1.frequency.setValueAtTime(783.99, this.ctx.currentTime + 0.2); // G5
        osc1.frequency.setValueAtTime(1046.50, this.ctx.currentTime + 0.3); // C6
        
        osc2.frequency.setValueAtTime(261.63, this.ctx.currentTime); // C4
        
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.6);
        
        osc1.start();
        osc2.start();
        osc1.stop(this.ctx.currentTime + 0.6);
        osc2.stop(this.ctx.currentTime + 0.6);
    },

    playSawBladeSFX() {
        if (!this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.3);
        
        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    },

    toggleBgm() {
        this.isBgmMuted = !this.isBgmMuted;
        localStorage.setItem('peanutJumpBgmMuted', this.isBgmMuted);
        this.updateVolumes();
        return this.isBgmMuted;
    },

    toggleSfx() {
        this.isSfxMuted = !this.isSfxMuted;
        localStorage.setItem('peanutJumpSfxMuted', this.isSfxMuted);
        this.updateVolumes();
        return this.isSfxMuted;
    }
};
