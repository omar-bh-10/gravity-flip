import { Save } from './SaveManager.js';
// All audio is synthesized with WebAudio (no assets). The context is only created after a user gesture.
class AudioManager {
  constructor() { this.ctx = null; this.music = false; this.bar = 0; }
  get on() { return Save.data.sound; }
  unlock() {
    if (!this.ctx) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return; this.ctx = new A(); }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (!this.music) { this.music = true; this.loop(); }
  }
  toggle() { Save.data.sound = !Save.data.sound; Save.save(); return Save.data.sound; }
  tone(f, d, type = 'square', v = .08, slide = 0, when = 0) {
    if (!this.on || !this.ctx) return;
    const t = this.ctx.currentTime + when, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d);
    o.connect(g); g.connect(this.ctx.destination); o.start(t); o.stop(t + d);
  }
  sfx(n) {
    if (n === 'click') this.tone(660, .07, 'square', .05);
    if (n === 'flip') this.tone(280, .12, 'square', .06, 420);
    if (n === 'coin') { this.tone(988, .08, 'square', .05); this.tone(1318, .14, 'square', .05, 0, .07); }
    if (n === 'hit') { this.tone(160, .5, 'sawtooth', .15, -140); this.tone(90, .6, 'square', .12, -60); }
    if (n === 'buy') [523, 659, 784, 1046].forEach((f, i) => this.tone(f, .12, 'triangle', .07, 0, i * .07));
    if (n === 'deny') this.tone(140, .2, 'square', .06);
  }
  // One bar (3.2s) of bass + kick + arpeggio, rescheduled forever; chord roots cycle each bar.
  loop() {
    const r = [55, 43.65, 49, 41.2][this.bar++ % 4];
    for (let i = 0; i < 16; i++) {
      const w = i * .2;
      if (i % 2 === 0) this.tone(r * (i % 8 === 6 ? 1.5 : 1), .18, 'sawtooth', .04, 0, w);
      if (i % 4 === 0) this.tone(120, .12, 'sine', .12, -90, w);
      this.tone(r * 4 * [1, 1.5, 2, 1.5][i % 4] * (i > 7 ? 1.25 : 1), .1, 'triangle', .022, 0, w);
    }
    setTimeout(() => this.loop(), 3200);
  }
}
export const AudioM = new AudioManager();
