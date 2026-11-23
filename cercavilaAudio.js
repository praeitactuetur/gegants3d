export class CercavilaAudio {
  constructor() {
    this.ctx = null; this.enabled = true; this.playing = false; this.step = 0; this.timer = null;
    this.melody = [523.25, 659.25, 783.99, 659.25, 880.00, 783.99, 659.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 880.00, 783.99, 659.25, 523.25];
  }
  init() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); if (this.ctx.state === 'suspended') this.ctx.resume(); }
  start() { this.init(); if (this.playing) return; this.playing = true; this.timer = setInterval(() => this.tick(), 230); }
  stop() { this.playing = false; if (this.timer) { clearInterval(this.timer); this.timer = null; } }
  toggle() { this.enabled = !this.enabled; return this.enabled; }
  tick() {
    if (!this.enabled || !this.ctx || !this.playing) return;
    const now = this.ctx.currentTime, freq = this.melody[this.step % this.melody.length];
    const osc = this.ctx.createOscillator(), filter = this.ctx.createBiquadFilter(), gain = this.ctx.createGain();
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(freq, now);
    filter.type = 'bandpass'; filter.frequency.setValueAtTime(1450, now); filter.Q.setValueAtTime(2.8, now);
    gain.gain.setValueAtTime(0.001, now); gain.gain.exponentialRampToValueAtTime(0.055, now + 0.03); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.21);
    osc.connect(filter); filter.connect(gain); gain.connect(this.ctx.destination);
    osc.start(now); osc.stop(now + 0.22);
    if (this.step % 2 === 0) {
      const drumOsc = this.ctx.createOscillator(), drumGain = this.ctx.createGain();
      drumOsc.type = 'triangle'; drumOsc.frequency.setValueAtTime(135, now); drumOsc.frequency.exponentialRampToValueAtTime(48, now + 0.14);
      drumGain.gain.setValueAtTime(0.14, now); drumGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      drumOsc.connect(drumGain); drumGain.connect(this.ctx.destination); drumOsc.start(now); drumOsc.stop(now + 0.17);
    }
    this.step++;
  }
}