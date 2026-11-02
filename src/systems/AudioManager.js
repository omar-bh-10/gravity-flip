import { Save } from './SaveManager.js';
// All audio is synthesized with WebAudio (no assets). The context is only created after a user gesture.
// Each world has its own music (tempo, bass, arp, extra textures); music gets denser as `intensity` (0..1) rises.
const MUSIC = [
  { step: .2, roots: [55, 43.65, 49, 41.2], bass: 'sawtooth', arp: 'triangle', m: [1, 1.5, 2, 1.5] },       // CYBER CITY: dreamy synth
  { step: .17, roots: [49, 49, 55, 41.2], bass: 'square', arp: 'sawtooth', m: [1, 1, 1.5, 2] },             // INDUSTRIAL: clanking
  { step: .16, roots: [58.3, 46.2, 51.9, 43.7], bass: 'sawtooth', arp: 'sine', m: [1, 1.2, 1.5, 1.8] },     // VOID: glitchy
  { step: .14, roots: [41.2, 41.2, 49, 46.2], bass: 'sawtooth', arp: 'square', m: [1, 1.5, 1.2, 2] },       // APOCALYPSE: heavy
  { step: .125, roots: [55, 61.7, 49, 58.3], bass: 'sawtooth', arp: 'square', m: [1, 2, 1.5, 3] },          // FINAL: frantic
];
class AudioManager {
  constructor() { this.ctx = null; this.music = false; this.bar = 0; this.stage = 0; this.inten = 0; this.bus = null; this.timer = 0; this.chain = 0; this.chainT = 0; }
  get on() { return Save.data.sound; }
  unlock() {
    if (!this.ctx) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return; this.ctx = new A(); }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (!this.music) { this.music = true; this.newBus(); this.loop(); }
  }
  newBus() { this.bus = this.ctx.createGain(); this.bus.connect(this.ctx.destination); }
  setStage(s) { // crossfade to the new world's music
    if (s === this.stage) return; this.stage = s; if (!this.ctx || !this.music) return;
    this.bus.gain.setTargetAtTime(0, this.ctx.currentTime, .12); this.newBus(); clearTimeout(this.timer); this.bar = 0; this.loop();
  }
  setIntensity(i) { this.inten = i; }
  suspend(b) { if (!this.ctx) return; try { if (b) this.ctx.suspend(); else if (this.on) this.ctx.resume(); } catch (e) {} } // app switched away / phone in portrait
  toggle() { Save.data.sound = !Save.data.sound; Save.save(); return Save.data.sound; }
  tone(f, d, type = 'square', v = .08, slide = 0, when = 0, dest) {
    if (!this.on || !this.ctx) return;
    const t = this.ctx.currentTime + when, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d);
    o.connect(g); g.connect(dest || this.ctx.destination); o.start(t); o.stop(t + d);
  }
  sfx(n, lvl = 1) {
    const T = (...a) => this.tone(...a);
    if (n === 'click') T(660, .07, 'square', .05);
    else if (n === 'flip') T(280, .12, 'square', .06, 420);
    else if (n === 'coin') { const now = performance.now(); this.chain = now - this.chainT < 900 ? Math.min(this.chain + 1, 9) : 0; this.chainT = now; const f = 988 * (1 + this.chain * .07); T(f, .08, 'square', .05); T(f * 1.34, .14, 'square', .05, 0, .07); } // rising pitch on coin chains
    else if (n === 'rare') [660, 880, 1100, 1320, 1760].forEach((f, i) => T(f, .12, 'triangle', .07, 0, i * .05));
    else if (n === 'hit') { T(160, .5, 'sawtooth', .15, -140); T(90, .6, 'square', .12, -60); }
    else if (n === 'death') { T(300, .9, 'sawtooth', .13, -250); T(80, 1, 'square', .12, -50, .05); T(1200, .3, 'square', .05, -1000); }
    else if (n === 'buy') [523, 659, 784, 1046].forEach((f, i) => T(f, .12, 'triangle', .07, 0, i * .07));
    else if (n === 'warn' || n === 'warn_scout') { T(1100, .07, 'square', .06); T(1100, .07, 'square', .06, 0, .12); }                      // SCOUT: quick high beeps
    else if (n === 'warn_hunter') T(500, .4, 'sawtooth', .06, 900);                                                                         // HUNTER: rising scan sweep
    else if (n === 'warn_destroyer') { T(90, .6, 'sawtooth', .1, -30); T(180, .6, 'square', .05, -60); }                                  // DESTROYER: low horn
    else if (n === 'warn_phantom') { T(600, .5, 'sine', .07, 400); T(900, .5, 'sine', .05, -450, .1); }                                    // PHANTOM: eerie wobble
    else if (n === 'lock') { T(1500, .05, 'square', .06); T(1100, .08, 'square', .06, 0, .07); }
    else if (n === 'boom') T(200, .3, 'sawtooth', .09, -150);
    else if (n.startsWith('kill_')) { const b = { scout: 500, hunter: 380, destroyer: 120, phantom: 700 }[n.slice(5)] || 300; T(b, .35, 'sawtooth', .1, -b * .7); T(b * 2, .2, 'square', .05, 0, .05); }
    else if (n === 'fire') { T(520, .16, 'sawtooth', .05, -330); T(900, .1, 'square', .03, -500); }
    else if (n === 'break') T(320, .12, 'square', .06, -220);
    else if (n === 'explode') { T(90, .5, 'sawtooth', .14, -60); T(220, .3, 'square', .08, -160); }
    else if (n === 'portal') T(300, .25, 'triangle', .08, 600);
    else if (n === 'near') { T(1400, .12, 'sine', .06, -900); T(700, .1, 'triangle', .05, 300, .03); }                                      // whoosh
    else if (n === 'combo') { const b = 440 * (1 + Math.min(lvl, 20) * .04); [1, 1.25, 1.5, 2].forEach((m, i) => T(b * m, .1, 'square', .05, 0, i * .05)); }
    else if (n === 'stage') { T(120, 1.2, 'sawtooth', .12, 900); T(60, 1.4, 'square', .14, -20, .6); [523, 659, 784, 1046].forEach((f, i) => T(f, .3, 'triangle', .06, 0, .9 + i * .08)); } // transition riser + hit
    else if (n === 'milestone') [784, 988, 1175, 1568].forEach((f, i) => T(f, .18, 'triangle', .07, 0, i * .08));
    else if (n === 'surge') { T(200, .6, 'sawtooth', .08, 700); T(100, .8, 'square', .08, 300); }
    else if (n === 'deny') T(140, .2, 'square', .06);
  }
  loop() {
    if (this.ctx.state !== 'running') { this.timer = setTimeout(() => this.loop(), 400); return; } // don't queue bars while suspended (iOS/background)
    const S = MUSIC[this.stage], bus = this.bus, r = S.roots[this.bar++ % 4], st = S.step, I = this.inten, T = (...a) => this.tone(...a);
    for (let i = 0; i < 16; i++) {
      const w = i * st;
      if (i % 2 === 0) T(r * (i % 8 === 6 ? 1.5 : 1), st * .9, S.bass, .04, 0, w, bus);
      if (i % 4 === 0 || (I > .5 && this.stage >= 3 && i % 4 === 2)) T(120, .12, 'sine', .12, -90, w, bus);                       // kick (double-time late)
      T(r * 4 * S.m[i % 4] * (i > 7 ? 1.25 : 1), st * .55, S.arp, .022, 0, w, bus);
      if (I > .25 && i % 2 === 1) T(7000, .03, 'square', .01, 0, w, bus);                                                        // hats join as difficulty rises
      if (I > .55 && i % 2 === 0) T(r * 8 * S.m[(i + 1) % 4], st * .4, S.arp, .014, 0, w, bus);                                  // extra high arp layer
      if (this.stage === 1 && i % 4 === 3) T(180, .05, 'square', .05, -100, w, bus);                                             // machinery clank
      if (this.stage === 2 && Math.random() < .12) T(400 + Math.random() * 1200, .06, 'square', .02, 0, w, bus);                  // glitch blips
      if (this.stage === 3 && i === 0) T(300, st * 8, 'sawtooth', .02, 500, w, bus);                                             // siren rise
      if (this.stage === 4 && i % 3 === 0) T(r * 6 * (1 + Math.floor(Math.random() * 3) * .25), st * .5, 'square', .016, 0, w, bus); // frantic random arps
    }
    this.timer = setTimeout(() => this.loop(), st * 16 * 1000 - 30);
  }
}
export const AudioM = new AudioManager();
