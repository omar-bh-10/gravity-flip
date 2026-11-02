// Generated from src/ (classic script so index.html also works from file://)
(function(){
// ---- config ----
const W = 960, H = 540, FLOOR = H - 56, CEIL = 56, HALF = 17; // HALF = player half-size
const PX = 190, G = 3800; // player screen x, gravity strength (a full flip takes ~0.4s)
const F = 'Orbitron, sans-serif';
const C = { bg: 0x080812, purple: 0xA855F7, blue: 0x3B82F6, cyan: 0x00F5FF, white: 0xFFFFFF, red: 0xFF3366 };
const RARITY = {
  COMMON: { col: 0x94a3b8, hex: '#94a3b8' }, RARE: { col: 0x3B82F6, hex: '#3B82F6' },
  EPIC: { col: 0xA855F7, hex: '#A855F7' }, LEGENDARY: { col: 0xFFC800, hex: '#FFC800' },
};
// 8 characters. Each has its own silhouette + animation (objects/Player.js) and particle trail (objects/Trails.js).
// c1/c2 = main/accent colour (UI + particles). noflip: rotates instead of flipping upside-down on the ceiling.
const SKINS = [
  { id: 'cyber', name: 'CYBER', rarity: 'COMMON', price: 0, c1: 0xA855F7, c2: 0xF0DBFF, noflip: true, blurb: 'Spinning purple data-cube with a pulsing core. Free for everyone.' },
  { id: 'volt', name: 'VOLT', rarity: 'RARE', price: 100, c1: 0x00F5FF, c2: 0xFFFFFF, blurb: 'Cyan combat robot. Piston legs, scanning visor, jittery electric trail.' },
  { id: 'slime', name: 'SLIME', rarity: 'COMMON', price: 50, c1: 0x39FF14, c2: 0xE8FFE0, blurb: 'Squishy neon blob that stretches mid-flip and leaves dripping goo.' },
  { id: 'inferno', name: 'INFERNO', rarity: 'RARE', price: 160, c1: 0xFF5A1F, c2: 0xFFD23F, blurb: 'A living fireball. Flickering flames and a rising ember trail.' },
  { id: 'aurum', name: 'AURUM', rarity: 'LEGENDARY', price: 500, c1: 0xFFC800, c2: 0xFFF5C2, blurb: 'Rotating golden gem with a travelling glint and a sparkling trail.' },
  { id: 'phantom', name: 'PHANTOM', rarity: 'EPIC', price: 250, c1: 0x9D6BFF, c2: 0xE9DDFF, blurb: 'Floating violet ghost. Bobs, waves and leaves a soft spectral mist.' },
  { id: 'thunder', name: 'THUNDER', rarity: 'EPIC', price: 350, c1: 0x4AA8FF, c2: 0xFFFFFF, blurb: 'A crackling lightning bolt that flickers and streaks across the screen.' },
  { id: 'glitch', name: 'GLITCH', rarity: 'LEGENDARY', price: 700, c1: 0xFF2BD6, c2: 0x00F5FF, noflip: true, blurb: 'Corrupted cube with RGB split, sliced rows and scattered pixel noise.' },
];

// ---- systems/SaveManager ----
// Persistent data in LocalStorage (guarded: private mode / blocked storage must not crash the game).
const KEY = 'gravityflip.v3';
const Save = {
  data: { best: 0, coins: 0, owned: [0], skin: 0, sound: true },
  load() { try { Object.assign(this.data, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) {} SKINS.forEach((k, i) => { if (!k.price && !this.data.owned.includes(i)) this.data.owned.push(i); }); // free characters are always owned
    return this; },
  save() { try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) {} },
};
Save.load();

// ---- systems/AudioManager ----
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
    if (n === 'warn') { this.tone(880, .09, 'square', .07); this.tone(880, .09, 'square', .07, 0, .14); }
    if (n === 'lock') { this.tone(1500, .05, 'square', .06); this.tone(1100, .08, 'square', .06, 0, .07); }
    if (n === 'boom') this.tone(200, .3, 'sawtooth', .09, -150);
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
const AudioM = new AudioManager();

// ---- systems/Ads ----
// Monetization hooks. Everything is a no-op so the game is 100% free/playable today.
// Later: plug an ad SDK into rewarded()/interstitial(), set enabled=true, and offer a
// "revive once" button in GameOverScene when Ads.canRevive(). `removed` = "remove ads" purchase flag.
const Ads = {
  enabled: false, removed: false,
  canRevive() { return this.enabled && !this.removed; },
  async rewarded() { return false; },      // resolve true when the player finished watching
  async interstitial() { /* call between sessions, never mid-run */ },
};

// ---- systems/ScoreManager ----
// Score = distance * multiplier (+0.5x every 20s survived, max 2.5x). Coins are banked on death.
const ScoreManager = {
  multiplier(t) { return 1 + Math.min(3, Math.floor(t / 20)) * .5; },
  commit(score, coins) {
    const newBest = score > Save.data.best;
    if (newBest) Save.data.best = Math.floor(score);
    Save.data.coins += coins; Save.save();
    return newBest;
  },
};

// ---- objects/Player ----
// Character renderer. Every character is hand-drawn with Phaser Graphics (no images) inside the same
// ~34px box as the hitbox, so none has a gameplay advantage (collision is fixed in GameScene).
// s = { t (sec), fl (1 floor .. -1 ceiling, smoothed), rot, vy, sc (scale), dim (alpha mult, locked previews) }
const rnd = n => Math.abs(Math.sin(n * 12.9898) * 43758.5453) % 1;
const halo = (g, c, a, r = 24) => { g.fillStyle(c, .10 * a).fillCircle(0, 0, r + 9); g.fillStyle(c, .14 * a).fillCircle(0, 0, r); };
const W_ = 0xffffff;

const DRAW = {
  // CYBER: spinning rounded cube, pulsing core, corner nodes
  cyber(g, s) {
    const a = s.dim, k = 1 + Math.sin(s.t * 6) * .12; g.rotateCanvas(s.rot);
    g.fillStyle(0xA855F7, .16 * a).fillRoundedRect(-25, -25, 50, 50, 12);
    g.fillStyle(0xA855F7, a).fillRoundedRect(-17, -17, 34, 34, 6);
    g.lineStyle(2, W_, a).strokeRoundedRect(-17, -17, 34, 34, 6);
    g.fillStyle(0xF0DBFF, a).fillRect(-8 * k, -8 * k, 16 * k, 16 * k);
    g.fillStyle(W_, a); [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([x, y]) => g.fillCircle(x * 17, y * 17, 3));
  },
  // VOLT: boxy robot, antenna, scanning visor, alternating piston legs
  volt(g, s) {
    const a = s.dim, ph = Math.sin(s.t * 18);
    halo(g, 0x00F5FF, a);
    g.lineStyle(2, W_, a).lineBetween(0, -12, 0, -20); g.fillStyle(W_, a * (.6 + .4 * Math.sin(s.t * 12))).fillCircle(0, -21, 3);
    g.fillStyle(0x0aa9b8, a).fillRect(-10, 10, 6, 6 + ph * 1.5).fillRect(4, 10, 6, 6 - ph * 1.5);
    g.fillStyle(0x00F5FF, a).fillRoundedRect(-15, -13, 30, 24, 5); g.lineStyle(2, W_, a).strokeRoundedRect(-15, -13, 30, 24, 5);
    g.fillStyle(0x062a33, a).fillRect(-11, -8, 22, 9); g.fillStyle(W_, a).fillRect(-9 + (Math.sin(s.t * 5) + 1) * 5, -6, 7, 5);
    g.fillStyle(W_, a).fillRect(-18, -3, 3, 8).fillRect(15, -3, 3, 8);
  },
  // SLIME: squash & stretch blob with eyes, stretches with vertical speed
  slime(g, s) {
    const a = s.dim, b = Math.sin(s.t * 9), v = Math.min(1, Math.abs(s.vy) / 1500);
    const w = 36 * (1 + .09 * b - .12 * v), h = 30 * (1 - .09 * b + .25 * v), cy = 17 - h / 2;
    halo(g, 0x39FF14, a, 22);
    g.fillStyle(0x39FF14, a).fillEllipse(0, cy, w, h).fillRoundedRect(-w * .46, cy + h * .1, w * .92, h * .4, 4);
    g.lineStyle(2, W_, a).strokeEllipse(0, cy, w, h);
    g.fillStyle(0xE8FFE0, .6 * a).fillEllipse(-w * .2, cy - h * .25, w * .22, h * .16);
    g.fillStyle(W_, a).fillCircle(-6, cy - 2, 4.5).fillCircle(6, cy - 2, 4.5);
    g.fillStyle(0x062a06, a).fillCircle(-5, cy - 1, 2).fillCircle(7, cy - 1, 2);
  },
  // INFERNO: round core with flickering flame tongues on top
  inferno(g, s) {
    const a = s.dim, t = s.t; halo(g, 0xFF5A1F, a, 24);
    for (let i = 0; i < 7; i++) {
      const ang = -Math.PI / 2 + (i - 3) * .45 + Math.sin(t * 10 + i * 2) * .12, L = 12 + Math.sin(t * 14 + i * 1.7) * 5 + (i === 3 ? 7 : 0);
      const bx = Math.cos(ang), by = Math.sin(ang);
      g.fillStyle(i % 2 ? 0xFF2A00 : 0xFF6A00, a).fillTriangle(bx * 9 - by * 6, by * 9 + bx * 6, bx * 9 + by * 6, by * 9 - bx * 6, bx * (9 + L), by * (9 + L));
    }
    g.fillStyle(0xFF5A1F, a).fillCircle(0, 2, 14); g.fillStyle(0xFFB300, a).fillCircle(0, 3, 10); g.fillStyle(0xFFF3A0, a).fillCircle(0, 4, 5 + Math.sin(t * 12));
  },
  // AURUM: tall faceted gem that "turns" (width oscillates) with a travelling glint
  aurum(g, s) {
    const a = s.dim, k = .55 + .45 * Math.abs(Math.cos(s.t * 2.2)); halo(g, 0xFFC800, a, 22);
    const P = [[-9, -17], [9, -17], [16, -3], [0, 20], [-16, -3]].map(([x, y]) => ({ x: x * k, y }));
    g.fillStyle(0xFFC800, a).fillPoints(P, true); g.lineStyle(2, W_, a).strokePoints(P, true);
    g.lineStyle(1, W_, .6 * a).lineBetween(-16 * k, -3, 16 * k, -3).lineBetween(-9 * k, -17, -4 * k, -3).lineBetween(9 * k, -17, 4 * k, -3).lineBetween(-4 * k, -3, 0, 20).lineBetween(4 * k, -3, 0, 20);
    g.fillStyle(0xFFF5C2, .5 * a).fillPoints([{ x: -9 * k, y: -17 }, { x: 9 * k, y: -17 }, { x: 4 * k, y: -3 }, { x: -4 * k, y: -3 }], true);
    const p = (s.t * 1.4) % 1; g.fillStyle(W_, a * Math.sin(p * Math.PI)).fillCircle(-10 * k + p * 20 * k, -8 + p * 6, 3 * Math.sin(p * Math.PI) + 1);
  },
  // PHANTOM: bobbing ghost with wavy hem, waving arms, hollow eyes
  phantom(g, s) {
    const a = s.dim * .9, t = s.t; g.translateCanvas(0, Math.sin(t * 4) * 3); halo(g, 0x9D6BFF, a, 22);
    g.fillStyle(0x9D6BFF, a).fillCircle(0, -4, 14).fillRect(-14, -4, 28, 14);
    for (let i = 0; i < 4; i++) g.fillCircle(-10.5 + i * 7, 10 + Math.sin(t * 8 + i) * 1.6, 3.6);
    g.fillCircle(-16, 3 + Math.sin(t * 6) * 3, 3.2).fillCircle(16, 3 - Math.sin(t * 6) * 3, 3.2);
    g.fillStyle(0xE9DDFF, .35 * a).fillEllipse(-5, -10, 8, 5);
    g.fillStyle(0x1b0b3a, a).fillEllipse(-5, -4, 5, 8).fillEllipse(5, -4, 5, 8).fillCircle(0, 5, 2);
  },
  // THUNDER: lightning bolt that flickers, jitters and throws tiny arcs
  thunder(g, s) {
    const a = s.dim, f = .8 + .2 * Math.sin(s.t * 50), k = Math.floor(s.t * 20);
    g.translateCanvas(Math.sin(s.t * 60) * 1.2, 0); halo(g, 0x4AA8FF, a, 24);
    const B = [[3, -20], [-11, 3], [-2, 3], [-6, 20], [12, -5], [2, -5], [9, -20]];
    g.fillStyle(0x4AA8FF, a * f).fillPoints(B.map(([x, y]) => ({ x, y })), true);
    g.lineStyle(2, W_, a).strokePoints(B.map(([x, y]) => ({ x, y })), true);
    g.fillStyle(W_, a).fillPoints(B.map(([x, y]) => ({ x: x * .5, y: y * .6 })), true);
    g.lineStyle(2, 0xBFE0FF, a * .9);
    for (let i = 0; i < 3; i++) { const sx = (rnd(k + i) - .5) * 30, sy = (rnd(k + i + 9) - .5) * 36; g.lineBetween(sx, sy, sx + (rnd(k + i + 3) - .5) * 12, sy + (rnd(k + i + 6) - .5) * 12); }
  },
  // GLITCH: magenta cube with RGB split, randomly displaced slices and noise pixels (re-rolled ~14x/sec)
  glitch(g, s) {
    const a = s.dim, k = Math.floor(s.t * 14), R = i => rnd(k * 7 + i);
    g.fillStyle(0x00F5FF, .5 * a).fillRect(-21 - (R(20) > .7 ? 4 : 0), -17, 34, 34);
    g.fillStyle(0xFF2BD6, a).fillRect(-17, -17, 34, 34);
    for (let i = 0; i < 5; i++) { const dx = R(i) > .55 ? (R(i + 9) - .5) * 16 : 0; g.fillStyle(i % 2 ? 0xFF2BD6 : 0xFF86EA, a).fillRect(-17 + dx, -17 + i * 6.8, 34, 6.8); }
    g.fillStyle(0x15001a, a); for (let i = 0; i < 4; i++) g.fillRect(-15 + R(30 + i) * 26, -15 + R(40 + i) * 26, 4, 4);
    g.fillStyle(W_, .55 * a).fillRect(-17, -17 + ((s.t * 70) % 34), 34, 2);
    g.lineStyle(2, W_, a).strokeRect(-17, -17, 34, 34);
  },
};

function drawChar(g, x, y, ch, st = {}) {
  const s = { t: 0, fl: 1, rot: 0, vy: 0, sc: 1, dim: 1, ...st };
  const f = ch.noflip ? 1 : (s.fl < 0 ? Math.min(s.fl, -.2) : Math.max(s.fl, .2)); // flip upside-down on ceiling
  g.save(); g.translateCanvas(x, y); g.scaleCanvas(s.sc, s.sc * f); DRAW[ch.id](g, s); g.restore();
}

// ---- objects/Trails ----
// Phaser particle systems: one distinct trail per character + shared textures generated at runtime.
function makeTextures(s) {
  if (s.textures.exists('dot')) return;
  const g = s.make.graphics({ x: 0, y: 0, add: false }), mk = (k, w, h, f) => { g.clear(); f(); g.generateTexture(k, w, h); };
  mk('dot', 16, 16, () => g.fillStyle(0xffffff, 1).fillCircle(8, 8, 8));
  mk('sq', 12, 12, () => g.fillStyle(0xffffff, 1).fillRect(0, 0, 12, 12));
  mk('dia', 14, 14, () => g.fillStyle(0xffffff, 1).fillPoints([{ x: 7, y: 0 }, { x: 14, y: 7 }, { x: 7, y: 14 }, { x: 0, y: 7 }], true));
  mk('bolt', 12, 16, () => g.lineStyle(3, 0xffffff, 1).strokePoints([{ x: 2, y: 1 }, { x: 9, y: 7 }, { x: 3, y: 9 }, { x: 10, y: 15 }], false));
  mk('line', 28, 3, () => g.fillStyle(0xffffff, 1).fillRect(0, 0, 28, 3));
  g.destroy();
}
const TRAILS = {
  cyber: { texture: 'sq', lifespan: 450, speedX: { min: -260, max: -180 }, speedY: { min: -15, max: 15 }, scale: { start: .7, end: 0 }, alpha: { start: .8, end: 0 }, rotate: { start: 0, end: 180 }, color: [0xA855F7, 0x6d28d9], frequency: 28 },
  volt: { texture: 'bolt', lifespan: 220, speedX: { min: -380, max: -220 }, speedY: { min: -150, max: 150 }, scale: { start: 1.1, end: .3 }, alpha: { start: 1, end: 0 }, rotate: { min: -40, max: 40 }, color: [0xffffff, 0x00F5FF], frequency: 20 },
  slime: { texture: 'dot', blendMode: 'NORMAL', lifespan: 650, speedX: { min: -120, max: -40 }, speedY: { min: -10, max: 30 }, gravityY: 900, scale: { start: .9, end: .15 }, alpha: { start: .8, end: 0 }, color: [0x39FF14, 0x0a8a00], frequency: 45 },
  inferno: { texture: 'dot', lifespan: 500, speedX: { min: -200, max: -100 }, speedY: { min: -90, max: -10 }, scale: { start: 1, end: 0 }, alpha: { start: .9, end: 0 }, color: [0xFFEE55, 0xFF7A00, 0xFF2200], frequency: 14, quantity: 2 },
  aurum: { texture: 'dia', lifespan: 700, speedX: { min: -160, max: -60 }, speedY: { min: -50, max: 50 }, scale: { start: 1, end: 0 }, alpha: { start: 1, end: 0 }, rotate: { min: 0, max: 360 }, color: [0xffffff, 0xFFD700, 0xFFA000], frequency: 40 },
  phantom: { texture: 'dot', lifespan: 900, speedX: { min: -90, max: -30 }, speedY: { min: -25, max: 25 }, scale: { start: 1.6, end: .2 }, alpha: { start: .35, end: 0 }, color: [0x9D6BFF, 0x4c1d95], frequency: 35 },
  thunder: { texture: 'line', lifespan: 200, speedX: { min: -520, max: -380 }, speedY: { min: -6, max: 6 }, scaleX: { start: 1.8, end: .2 }, scaleY: 1, alpha: { start: 1, end: 0 }, color: [0xffffff, 0x4AA8FF], frequency: 12, quantity: 2 },
  glitch: { texture: 'sq', lifespan: 260, speedX: { min: -300, max: -120 }, speedY: { min: -70, max: 70 }, scale: { start: .5, end: .1 }, alpha: { start: 1, end: 0 }, color: [0xFF2BD6, 0x00F5FF, 0xffffff], frequency: 25 },
};
function makeTrail(s, ch) {
  const { texture, ...cfg } = TRAILS[ch.id];
  return s.add.particles(0, 0, texture, { blendMode: 'ADD', ...cfg });
}
const makeBoom = (s, ch) => s.add.particles(0, 0, 'dot', { lifespan: { min: 400, max: 900 }, speed: { min: 120, max: 560 }, scale: { start: 1.3, end: 0 }, alpha: { start: 1, end: 0 }, color: [0xffffff, ch.c1, ch.c1], blendMode: 'ADD', emitting: false });

// ---- objects/Obstacle ----
// side: 1 = floor, -1 = ceiling. kinds: spike | block | mover (vertical sweeping hazard).
const ob = (k, x, side, w, h, ph = 0) => ({ k, x, side, w, h, ph, y: 0 });
function updateObstacle(o, t) {
  if (o.k === 'mover') o.y = (CEIL + FLOOR) / 2 + Math.sin(t * 2.2 + o.ph) * ((FLOOR - CEIL) / 2 - 20);
}
// Forgiving hitboxes: spikes use a narrower/shorter box than they look.
function box(o) {
  if (o.k === 'block') return { x: o.x, y: o.side === 1 ? FLOOR - o.h : CEIL, w: o.w, h: o.h };
  const sh = o.h * .7;
  return { x: o.x + o.w * .25, y: o.side === 1 ? FLOOR - sh : CEIL, w: o.w * .5, h: sh };
}
function collides(o, r) {
  if (o.k === 'mover') { // circle vs rect
    const cx = o.x + 16, nx = Math.max(r.x, Math.min(cx, r.x + r.w)), ny = Math.max(r.y, Math.min(o.y, r.y + r.h));
    return (cx - nx) ** 2 + (o.y - ny) ** 2 < 169;
  }
  const b = box(o);
  return r.x < b.x + b.w && r.x + r.w > b.x && r.y < b.y + b.h && r.y + r.h > b.y;
}
function drawObstacle(g, o) {
  if (o.k === 'mover') {
    const cx = o.x + 16;
    g.lineStyle(1, C.red, .25).lineBetween(cx, CEIL, cx, FLOOR);
    for (let i = 3; i > 0; i--) g.fillStyle(C.red, .08 * i).fillCircle(cx, o.y, 16 + i * 5);
    g.fillStyle(C.red, 1).fillCircle(cx, o.y, 13); g.fillStyle(0xffffff, 1).fillCircle(cx, o.y, 5);
    return;
  }
  const up = o.side === 1, y0 = up ? FLOOR : CEIL, dir = up ? -1 : 1;
  if (o.k === 'block') {
    const top = up ? FLOOR - o.h : CEIL;
    g.fillStyle(C.purple, .15).fillRect(o.x - 6, top - 6, o.w + 12, o.h + 12);
    g.fillStyle(0x1a1030, 1).fillRect(o.x, top, o.w, o.h);
    g.lineStyle(2, C.purple, 1).strokeRect(o.x, top, o.w, o.h);
    return;
  }
  const a = [o.x, y0, o.x + o.w / 2, y0 + dir * o.h, o.x + o.w, y0];
  g.fillStyle(C.red, .2).fillTriangle(a[0] - 7, y0, a[2], a[3] + dir * 10, a[4] + 7, y0);
  g.fillStyle(0x2a0a18, 1).fillTriangle(...a);
  g.lineStyle(2, C.red, 1).strokeTriangle(...a);
}

// ---- objects/Collectible ----
function drawOrb(g, x, y, t) {
  const p = 1 + Math.sin(t * 6 + x * .05) * .15;
  g.fillStyle(C.cyan, .12).fillCircle(x, y, 22 * p); g.fillStyle(C.cyan, .3).fillCircle(x, y, 15 * p);
  g.fillStyle(C.cyan, 1).fillCircle(x, y, 8); g.fillStyle(0xffffff, 1).fillCircle(x, y, 4);
}

// ---- objects/RobotEnemy ----
// Reusable (pooled) flying robot. Behaviour lives in systems/RobotAI.js, spawning in EnemySpawnManager.js.
// Robots attack along a "lane" (the floor or ceiling line the player runs on), so the player dodges by flipping to the other lane.
const SPAWN_X = W + 40;
const laneY = l => (l === 1 ? FLOOR - HALF : CEIL + HALF);
const TYPE_COL = { scout: 0x00F5FF, hunter: 0xA855F7, destroyer: 0xFF3366, phantom: 0x9D6BFF };
// r = hit radius (slightly smaller than the art), base/cap = approach speed px/s, warn = warning time before it enters
const DEF = {
  scout: { r: 13, base: 330, cap: 520, warn: 1.0 }, hunter: { r: 15, base: 420, cap: 620, warn: 1.1 },
  destroyer: { r: 25, base: 540, cap: 780, warn: 1.2 }, phantom: { r: 14, base: 300, cap: 420, warn: 1.2 },
};
const POOL = [];
const hex = r => [0, 1, 2, 3, 4, 5].map(i => ({ x: Math.cos(i * 1.047) * r, y: Math.sin(i * 1.047) * r }));

class RobotEnemy {
  static acquire() { return POOL.pop() || new RobotEnemy(); }
  static release(rb) { rb.alive = false; POOL.push(rb); }
  init(type, lane, mul, py, rng) {
    const d = DEF[type], ap = Math.min(d.cap, d.base * mul);
    Object.assign(this, { type, r: d.r, alive: true, lane, lane2: lane, state: 'warn', t: 0, anim: rng() * 6, warnLeft: d.warn, approach: ap,
      x: SPAWN_X, vx: 0, vy: 0, alpha: 1, acc: 0, vt: 0, vanished: false, vanishX: 0, fresh: false, lockX: PX + ap * 1.05 + 40 });
    this.y = type === 'hunter' ? Math.max(CEIL + HALF, Math.min(FLOOR - HALF, py)) : laneY(lane);
    if (type === 'phantom') { // plan: re-appear >= 1s of travel from the player, possibly in the other lane
      this.lane2 = rng() < .65 ? -lane : lane;
      this.vanishX = Math.min(SPAWN_X - 60, PX + ap + 80 + rng() * 100 + ap * .45);
    }
    return this;
  }
  get lethal() { return this.state === 'fly' || this.state === 'dash'; }
  eta() { return (this.state === 'warn' ? this.warnLeft : 0) + (this.x - PX) / this.approach; } // seconds until it reaches the player column
  unknownLane() { return this.type === 'phantom' || (this.type === 'hunter' && this.state !== 'dash'); }
  hits(r) { // circle vs player box
    if (!this.lethal) return false;
    const nx = Math.max(r.x, Math.min(this.x, r.x + r.w)), ny = Math.max(r.y, Math.min(this.y, r.y + r.h));
    return (this.x - nx) ** 2 + (this.y - ny) ** 2 < this.r * this.r;
  }
  draw(g, t) { g.save(); g.translateCanvas(this.x, this.y); DRAWS[this.type](g, this, this.alpha, this.anim); g.restore(); }
}

const DRAWS = {
  // SCOUT: small round drone, spinning rotor, twin pods, two glowing cyan eyes
  scout(g, rb, a, T) {
    g.fillStyle(0x00F5FF, .1 * a).fillCircle(0, 0, 22);
    g.fillStyle(0x7fefff, a).fillEllipse(0, -15, 26 * Math.abs(Math.cos(T * 34)) + 3, 3); g.lineStyle(2, 0x0aa6b5, a).lineBetween(0, -12, 0, -15);
    g.fillStyle(0x0aa6b5, a).fillRoundedRect(-18, -3, 6, 11, 2).fillRoundedRect(12, -3, 6, 11, 2);
    g.fillStyle(0x0c1c2e, a).fillCircle(0, 0, 12); g.lineStyle(2, 0x00F5FF, a).strokeCircle(0, 0, 12);
    g.fillStyle(0x00F5FF, .35 * a).fillCircle(-5, -1, 7).fillCircle(3, -1, 7);
    g.fillStyle(0xffffff, a * (.7 + .3 * Math.sin(T * 9))).fillCircle(-5, -1, 3).fillCircle(3, -1, 3);
    g.lineStyle(2, 0x0aa6b5, a).lineBetween(-5, 11, -8, 16).lineBetween(5, 11, 8, 16);
  },
  // HUNTER: sleek purple arrowhead, flapping swept wings, scanning eye (turns red when locked on)
  hunter(g, rb, a, T) {
    const f = Math.sin(T * 10) * 3, d = rb.state === 'dash', B = [{ x: -26, y: 0 }, { x: 4, y: -10 }, { x: 16, y: -5 }, { x: 16, y: 5 }, { x: 4, y: 10 }];
    g.fillStyle(0xA855F7, .1 * a).fillCircle(0, 0, 28);
    g.fillStyle(0x4c1d95, a).fillTriangle(2, -8, 20, -24 - f, 16, -5).fillTriangle(2, 8, 20, 24 + f, 16, 5);
    g.lineStyle(2, 0xA855F7, a).strokeTriangle(2, -8, 20, -24 - f, 16, -5).strokeTriangle(2, 8, 20, 24 + f, 16, 5);
    g.fillStyle(0x1b0a33, a).fillPoints(B, true); g.lineStyle(2, d ? 0xFF3366 : 0xA855F7, a).strokePoints(B, true);
    g.fillStyle(d ? 0xFF3366 : 0x00F5FF, a).fillRect(-16 + (Math.sin(T * 8) + 1) * 6, -2, 6, 4);
    g.fillStyle(0xA855F7, .8 * a).fillCircle(18, 0, 3 + Math.sin(T * 20));
    if (d) g.lineStyle(2, 0xFF3366, .7 * a).strokeCircle(0, 0, 26 + 3 * Math.sin(T * 16));
  },
  // DESTROYER: big armoured red brute, snapping jaws, spikes, shoulder cannons, vents; shakes
  destroyer(g, rb, a, T) {
    const j = (Math.sin(T * 12) + 1) * 3, sh = (Math.random() - .5) * 1.6, B = [[-26, -6], [-14, -22], [14, -22], [28, -6], [28, 10], [12, 22], [-12, 22], [-26, 10]].map(([x, y]) => ({ x, y }));
    g.translateCanvas(sh, sh); g.fillStyle(0xFF3366, .12 * a).fillCircle(0, 0, 40);
    g.fillStyle(0x7a0f26, a).fillTriangle(-8, -22, -2, -36, 4, -22).fillTriangle(6, -22, 12, -38, 18, -22).fillTriangle(-20, -18, -18, -30, -10, -22);
    g.fillStyle(0x6b0f24, a).fillRect(-4, -29, 16, 6).fillRect(-4, 23, 16, 6);
    g.fillStyle(0x2a0510, a).fillPoints(B, true); g.lineStyle(3, 0xFF3366, a).strokePoints(B, true);
    g.fillStyle(0xFF3366, a).fillTriangle(-24, -5, -40, -9 - j, -24, 0).fillTriangle(-24, 5, -40, 9 + j, -24, 0);
    g.fillStyle(0xFF3366, .4 * a).fillCircle(-10, -4, 11); g.fillStyle(0xFFE0E0, a).fillCircle(-10, -4, 5); g.fillStyle(0xFF0033, a).fillCircle(-11, -4, 3);
    g.lineStyle(2, 0xFF8A00, a * (.5 + .5 * Math.sin(T * 15))); for (let i = -1; i <= 1; i++) g.lineBetween(14, i * 10, 24, i * 10);
  },
  // PHANTOM: dark hex shell, glowing violet core, orbiting shards, wavy tendrils; fades out while "phasing"
  phantom(g, rb, a, T) {
    const pl = .8 + .2 * Math.sin(T * 7), ga = Math.max(a, .35), B = hex(13);
    g.fillStyle(0x9D6BFF, .14 * ga).fillCircle(0, 0, 26);
    g.lineStyle(2, 0x6d28d9, a * .8); for (let k = -1; k <= 1; k++) { let px = 8, py = k * 5; for (let i = 1; i <= 5; i++) { const nx = 8 + i * 5, ny = k * 5 + Math.sin(T * 8 + i + k * 2) * 4; g.lineBetween(px, py, nx, ny); px = nx; py = ny; } }
    g.fillStyle(0x120a22, a).fillPoints(B, true); g.lineStyle(2, 0x9D6BFF, Math.max(a, .5)).strokePoints(B, true);
    g.fillStyle(0x9D6BFF, .5 * ga).fillCircle(0, 0, 9 * pl); g.fillStyle(0xF3E8FF, Math.max(a, .5)).fillCircle(0, 0, 4);
    for (let i = 0; i < 3; i++) { const an = T * 3 + i * 2.094, sx = Math.cos(an) * 21, sy = Math.sin(an) * 14; g.fillStyle(0x9D6BFF, a).fillTriangle(sx - 4, sy, sx, sy - 5, sx + 4, sy).fillTriangle(sx - 4, sy, sx, sy + 5, sx + 4, sy); }
  },
};

// Red warning telegraphs (drawn under the robots). Direction arrow + "!" at the screen edge, lane stripe, lock-on reticle.
function drawWarning(g, rb, t) {
  const p = .5 + .5 * Math.sin(t * 14), red = 0xFF3366;
  const stripe = (y, col = red) => { g.lineStyle(10, col, .1 * p).lineBetween(PX + 40, y, W - 70, y); g.lineStyle(2, col, .5 * p).lineBetween(PX + 40, y, W - 70, y); };
  if (rb.state === 'warn') {
    const y = Math.max(40, Math.min(H - 40, rb.y)), x = W - 66;
    if (rb.type !== 'hunter') stripe(y);
    g.fillStyle(red, .18 + .22 * p).fillRoundedRect(x, y - 22, 60, 44, 8); g.lineStyle(2, red, 1).strokeRoundedRect(x, y - 22, 60, 44, 8);
    g.fillStyle(TYPE_COL[rb.type], 1).fillRect(x + 2, y - 20, 4, 40);
    g.fillStyle(0xffffff, 1).fillTriangle(x + 12, y, x + 26, y - 11, x + 26, y + 11).fillRect(x + 38, y - 11, 5, 14).fillCircle(x + 40.5, y + 11, 3);
  } else if (rb.state === 'dash') { // hunter locked on: red lane + reticle on the target lane, laser sight
    const y = laneY(rb.lane); stripe(y);
    g.lineStyle(2, red, .8).strokeCircle(PX, y, 26 + 6 * p); g.lineStyle(1, red, .5).lineBetween(rb.x - 26, rb.y, PX + 30, y);
  } else if (rb.state === 'vanish') { // phantom: shows where it will re-appear
    const y = laneY(rb.lane2), x = rb.x - rb.approach * rb.vt; stripe(y, 0xC084FC);
    g.lineStyle(2, red, .4 + .5 * p).strokeCircle(x, y, 20 + 4 * p); g.fillStyle(red, .8).fillRect(x - 2, y - 9, 4, 11).fillCircle(x, y + 9, 2.5);
  }
}

// ---- systems/DifficultyManager ----
// Difficulty is a pure function of survival time: smooth interpolation between the 7 tiers, then a slow ramp to a cap.
const PTS = [0, 15, 30, 45, 60, 90, 120];
const NAMES = ['EASY', 'NORMAL', 'MEDIUM', 'HARD', 'VERY HARD', 'EXTREME', 'INSANE'];
const SPEED = [330, 370, 410, 450, 500, 560, 620];
const GAP = [1.15, 1.05, .98, .92, .86, .80, .76];      // obstacle spacing, in seconds of travel (>= flip time + reaction)
const RINT = [9, 9, 7.5, 6.2, 5, 4, 3.2];                // seconds between robot spawns
const RMUL = [1, 1, 1.08, 1.18, 1.3, 1.45, 1.6];         // robot speed multiplier
const UNL = [['scout', 15], ['hunter', 40], ['destroyer', 70], ['phantom', 100]];
const interp = (a, t) => { let i = 0; while (PTS[i + 1] <= t) i++; const k = (t - PTS[i]) / (PTS[i + 1] - PTS[i]); return a[i] + (a[i + 1] - a[i]) * k; };
const Difficulty = {
  firstRobot: 15,
  tier(t) { let i = 0; while (i < 6 && t >= PTS[i + 1]) i++; return i; },
  name(t) { return NAMES[this.tier(t)]; },
  speed(t) { return t < 120 ? interp(SPEED, t) : Math.min(760, 620 + (t - 120) * .5); },        // cap 760
  gap(t) { return t < 120 ? interp(GAP, t) : Math.max(.74, .76 - (t - 120) * .0002); },
  robotInterval(t) { return t < 120 ? interp(RINT, t) : Math.max(2.6, 3.2 - (t - 120) * .004); },
  robotMul(t) { return t < 120 ? interp(RMUL, t) : Math.min(1.9, 1.6 + (t - 120) * .0015); },
  robotSpacing(t) { return Math.max(1.1, 1.5 - t * .003); },   // min seconds between two robot arrivals
  unlocked(t) { return UNL.filter(u => t >= u[1]).map(u => u[0]); },
  patterns(t) { const p = [0, 2]; if (t > 8) p.push(1); if (t > 15) p.push(3); if (t > 22) p.push(4); if (t > 32) p.push(5); if (t > 48) p.push(6); if (t > 70) p.push(7); return p; },
};

// ---- systems/RobotAI ----
// Movement + particle trails. c = { py, gdir, fx(x,y,vx,vy,life,color,size), onWarn(rb, relock) }.
// SCOUT/DESTROYER: straight along a lane.  HUNTER: tracks the player's height, then LOCKS a lane and dashes.
// PHANTOM: vanishes, then re-appears (maybe in the other lane) with >= 1s of warning.
function updateRobot(rb, dt, c) {
  rb.t += dt; rb.anim += dt;
  if (rb.type === 'hunter' && (rb.state === 'warn' || rb.state === 'fly')) { const d = c.py - rb.y; rb.y += Math.sign(d) * Math.min(Math.abs(d), 300 * dt); }
  if (rb.state === 'warn') { rb.warnLeft -= dt; if (rb.warnLeft <= 0) { rb.state = 'fly'; rb.vx = -rb.approach; } return; }
  rb.x += rb.vx * dt; rb.y += rb.vy * dt;
  if (rb.type === 'scout') rb.y = laneY(rb.lane) + Math.sin(rb.anim * 6) * 5;
  else if (rb.type === 'destroyer') rb.y = laneY(rb.lane) + Math.sin(rb.anim * 11) * 3;
  else if (rb.type === 'hunter') hunterAI(rb, c);
  else phantomAI(rb, dt, c);
  trail(rb, dt, c.fx);
}
function hunterAI(rb, c) {
  if (rb.state === 'fly' && rb.x <= rb.lockX) { // lock the lane the player is heading to; reach it before the player column
    rb.state = 'dash'; rb.lane = c.gdir;
    rb.vy = (laneY(rb.lane) - rb.y) / Math.max(.3, (rb.x - (PX + 110)) / rb.approach); c.onWarn(rb, true);
  } else if (rb.state === 'dash') {
    const ty = laneY(rb.lane); if (rb.vy === 0 || (rb.vy > 0 && rb.y >= ty) || (rb.vy < 0 && rb.y <= ty)) { rb.y = ty; rb.vy = 0; }
  }
}
function puff(rb, c) { for (let i = 0; i < 12; i++) c.fx(rb.x, rb.y, (Math.random() - .5) * 360, (Math.random() - .5) * 360, .5, 0x9D6BFF, 3); }
function phantomAI(rb, dt, c) {
  if (rb.state === 'fly') {
    rb.y = laneY(rb.lane) + Math.sin(rb.anim * 5) * 4;
    if (!rb.vanished && rb.x <= rb.vanishX) { rb.state = 'vanish'; rb.vt = .45; puff(rb, c); c.onWarn(rb, true); }
  } else if (rb.state === 'vanish') {
    rb.vt -= dt; rb.y += (laneY(rb.lane2) - rb.y) * Math.min(1, dt * 6) + (Math.random() - .5) * 6;
    if (rb.vt <= 0) { rb.state = 'fly'; rb.vanished = true; rb.lane = rb.lane2; rb.y = laneY(rb.lane); puff(rb, c); }
  }
  rb.alpha += ((rb.state === 'vanish' ? .08 : 1) - rb.alpha) * Math.min(1, dt * 14);
}
const RATE = { scout: 45, hunter: 70, destroyer: 100, phantom: 40 };
function trail(rb, dt, fx) { // unique particle trail per robot
  rb.acc += dt * RATE[rb.type]; const r = Math.random;
  while (rb.acc >= 1) {
    rb.acc--; const x = rb.x, y = rb.y;
    if (rb.type === 'scout') fx(x + 12, y + (r() - .5) * 6, 70, (r() - .5) * 40, .35, 0x00F5FF, 2.5);                                    // cyan sparks
    else if (rb.type === 'hunter') fx(x + 18, y + (r() - .5) * 14, 190, 0, .3, r() < .7 ? 0xA855F7 : 0x3B82F6, 3);                     // purple streaks
    else if (rb.type === 'destroyer') fx(x + 26, y + (r() - .5) * 28, 120 + r() * 120, (r() - .5) * 90, .5, r() < .5 ? 0xFF3366 : 0xFF8A00, 3 + r() * 3); // red embers
    else fx(x + 10, y + (r() - .5) * 22, 40, -30 + r() * 60, .8, 0x9D6BFF, 2 + r() * 3);                                              // violet wisps
  }
}

// ---- systems/EnemySpawnManager ----

// Owns every hazard: obstacle patterns, orbs and robots. Fairness rule (see conflict()):
// a robot is only accepted if, around its arrival time, the lane the player must flee to is obstacle-free,
// and obstacles are only generated if they don't violate the same rule for robots already on the field.
const pass = (a, f) => { let n = 0; for (const x of a) if (f(x)) a[n++] = x; a.length = n; };
// time window (seconds from now) during which obstacle o overlaps the player column
const winOf = (o, sp) => { const s = o.k === 'spike', bx = s ? o.x + o.w * .25 : o.x, bw = s ? o.w * .5 : o.w; return [(bx - (PX + HALF)) / sp, (bx + bw - (PX - HALF)) / sp]; };

class EnemySpawnManager {
  constructor(rng = Math.random) { this.rng = rng; this.robots = []; this.obs = []; this.orbs = []; this.reset(); }
  reset() { // clears all enemy state (used on every restart)
    this.robots.forEach(r => RobotEnemy.release(r)); this.robots = []; this.obs = []; this.orbs = [];
    this.nextX = W + 500; this.nextRobot = Difficulty.firstRobot; this.seen = new Set();
  }
  update(dt, t, speed, ctx) {
    const dx = speed * dt; this.nextX -= dx;
    for (const o of this.obs) { o.x -= dx; updateObstacle(o, t); } for (const o of this.orbs) o.x -= dx;
    for (let i = this.robots.length - 1; i >= 0; i--) {
      const rb = this.robots[i]; updateRobot(rb, dt, ctx);
      if (rb.state !== 'warn' && rb.x < PX - 90) { ctx.onPass(rb); RobotEnemy.release(rb); this.robots.splice(i, 1); } // dodged: robot burns out
    }
    this.spawnRobot(t, speed, ctx);
    for (let n = 0; this.nextX < W + 200 && n < 8; n++) this.spawnObstacle(t, speed);
    pass(this.obs, o => o.x + o.w > -60); pass(this.orbs, o => o.x > -40 && !o.got);
  }
  hitsRobot(r) { return this.robots.find(rb => rb.hits(r)); }
  conflict(rb, o, arr, sp) {
    if (o.k !== 'mover' && !rb.unknownLane() && o.side === rb.lane) return false; // obstacle in the robot's own lane: player is in the other lane anyway
    const [a, b] = winOf(o, sp); return b > arr - .85 && a < arr + 1.0;             // else it must clear before the player has to flee (flip ~0.4s) and not follow too soon
  }
  pickType(t) {
    const un = Difficulty.unlocked(t), fresh = un.find(u => !this.seen.has(u)); if (fresh) return fresh; // newly unlocked robot appears first
    const W_ = { scout: 3, hunter: 2.5, destroyer: 2, phantom: 1.5 }; let r = this.rng() * un.reduce((s, u) => s + W_[u], 0);
    for (const u of un) { r -= W_[u]; if (r <= 0) return u; } return un[0];
  }
  spawnRobot(t, speed, ctx) {
    if (t < this.nextRobot) return;
    const type = this.pickType(t), rng = this.rng;
    const rb = RobotEnemy.acquire().init(type, rng() < .5 ? 1 : -1, Difficulty.robotMul(t), ctx.py, rng), arr = rb.eta(), sp = Difficulty.robotSpacing(t);
    if (this.robots.some(o => Math.abs(o.eta() - arr) < sp) || this.obs.some(o => this.conflict(rb, o, arr, speed))) { RobotEnemy.release(rb); this.nextRobot = t + .35; return; }
    rb.fresh = !this.seen.has(type); this.seen.add(type); this.robots.push(rb);
    this.nextRobot = t + Difficulty.robotInterval(t) * (.8 + .4 * rng()); ctx.onWarn(rb, false);
  }
  build(p, x, side, sp) {
    const O = [], gp = sp * .8; let w = 40;
    if (p === 0) O.push(ob('spike', x, side, 40, 40));
    else if (p === 1) { O.push(ob('spike', x, side, 40, 40), ob('spike', x + 40, side, 40, 40)); w = 80; }
    else if (p === 2) { O.push(ob('block', x, side, 56, 60 + (this.rng() * 60 | 0))); w = 56; }
    else if (p === 3) { for (let i = 0; i < 3; i++) O.push(ob('spike', x + i * 40, side, 40, 40)); w = 120; }
    else if (p === 4) { O.push(ob('mover', x, 1, 32, 0, this.rng() * 6.3)); w = 32; }
    else if (p === 5) { const g = sp * .72; O.push(ob('spike', x, side, 40, 40), ob('block', x + 40 + g, -side, 50, 70)); w = 90 + g; }
    else if (p === 6) { O.push(ob('spike', x, side, 40, 40), ob('spike', x + 40 + gp, -side, 40, 40)); w = 80 + gp; }
    else { for (let i = 0; i < 3; i++) O.push(ob('spike', x + i * (40 + gp), i % 2 ? -side : side, 40, 40)); w = 120 + 2 * gp; }
    return { O, w };
  }
  valid(list, sp) {
    return this.robots.every(rb => { const arr = rb.eta(); return arr < -1.2 || !list.some(o => this.conflict(rb, o, arr, sp)); });
  }
  spawnObstacle(t, sp) {
    const pats = Difficulty.patterns(t), rng = this.rng, gap = sp * Difficulty.gap(t);
    for (let k = 0; k < 5; k++) {
      const p = pats[rng() * pats.length | 0], pad = p === 4 ? sp * .5 : 0, x = this.nextX + pad, { O, w } = this.build(p, x, rng() < .5 ? 1 : -1, sp); // movers get extra room before/after
      if (!this.valid(O, sp)) continue;
      this.obs.push(...O);
      if (rng() < .75) { const q = rng(), y = q < .33 ? FLOOR - 34 : q < .66 ? CEIL + 34 : (FLOOR + CEIL) / 2; for (let i = -1; i <= 1; i++) this.orbs.push({ x: x + w + gap / 2 + i * 44, y: y + (q >= .66 ? i * 30 : 0) }); }
      this.nextX = x + w + gap + pad; return;
    }
    this.nextX += 150; // nothing fits right now (a robot needs the space): leave a gap and retry shortly
  }
}

// ---- systems/UI ----
const txt = (s, x, y, str, size = 20, col = '#ffffff', glow) => {
  const t = s.add.text(x, y, str, { fontFamily: F, fontSize: size + 'px', color: col, fontStyle: 'bold', align: 'center' }).setOrigin(.5);
  if (glow) t.setShadow(0, 0, glow, 14, true, true);
  return t;
};
// Animated neon backdrop: parallax grid + twinkling stars. t in ms, off = scroll distance in px.
function drawBg(g, t, off = 0) {
  g.clear(); g.fillStyle(C.bg, 1).fillRect(0, 0, W, H);
  g.fillStyle(C.purple, .06).fillRect(0, H * .35 + Math.sin(t / 1500) * 20, W, H * .3);
  g.lineStyle(1, C.blue, .14);
  for (let i = 0; i <= W / 80; i++) { const x = (((i * 80 - off * .35) % W) + W) % W; g.lineBetween(x, 0, x, H); }
  g.lineStyle(1, C.blue, .08);
  for (let j = 0; j < 7; j++) g.lineBetween(0, j * 90, W, j * 90);
  for (let i = 0; i < 36; i++) {
    const x = (((i * 151 - off * (.05 + .04 * (i % 4))) % W) + W) % W;
    g.fillStyle(0xffffff, .25 + .35 * Math.abs(Math.sin(t / 700 + i))).fillCircle(x, (i * 97) % H, 1 + (i % 3) * .6);
  }
}
function btn(s, x, y, label, cb, w = 260, col = C.cyan) {
  const c = s.add.container(x, y), g = s.add.graphics(), t = txt(s, 0, 0, label, w < 200 ? 15 : 22);
  const draw = h => { g.clear(); g.fillStyle(col, h ? .35 : .12).fillRoundedRect(-w / 2, -26, w, 52, 12); g.lineStyle(2, col, 1).strokeRoundedRect(-w / 2, -26, w, 52, 12); };
  draw(0); c.add([g, t]); c.setSize(w, 52).setInteractive({ useHandCursor: true });
  c.on('pointerover', () => { draw(1); s.tweens.add({ targets: c, scale: 1.06, duration: 90 }); });
  c.on('pointerout', () => { draw(0); s.tweens.add({ targets: c, scale: 1, duration: 90 }); });
  c.on('pointerdown', () => { AudioM.sfx('click'); cb(); });
  c.label = t; return c;
}

// ---- scenes/MenuScene ----
class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }
  create() {
    this.cameras.main.fadeIn(300);
    this.bg = this.add.graphics(); this.pg = this.add.graphics();
    const sh = txt(this, W / 2 + 4, 112, 'GRAVITY//FLIP', 68, '#A855F7', '#A855F7');
    txt(this, W / 2, 108, 'GRAVITY//FLIP', 68, '#ffffff', '#00F5FF');
    this.tweens.add({ targets: sh, x: W / 2 - 4, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    txt(this, W / 2, 168, 'FLIP  ·  SURVIVE  ·  COLLECT', 15, '#8b8bd0');
    txt(this, W / 2, 205, `BEST ${Math.floor(Save.data.best)}     ◆ ${Save.data.coins}`, 20, '#00F5FF', '#00F5FF');
    btn(this, W / 2, 268, 'PLAY', () => this.scene.start('Game'));
    btn(this, W / 2, 336, 'HOW TO PLAY', () => this.help(), 260, C.blue);
    btn(this, W / 2, 404, 'CHARACTERS', () => this.scene.start('Skin'), 260, C.purple);
    const sb = btn(this, W - 110, 40, '', () => { AudioM.toggle(); this.setLabel(sb); }, 180, C.purple);
    this.setLabel(sb);
    this.input.keyboard.on('keydown-SPACE', () => { if (!this.helpOpen) this.scene.start('Game'); });
  }
  setLabel(b) { b.label.setText('SOUND: ' + (Save.data.sound ? 'ON' : 'OFF')); }
  help() {
    this.helpOpen = true;
    const c = this.add.container(0, 0).setDepth(20);
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0, .85).setInteractive();
    const g = this.add.graphics().fillStyle(0x12122a, 1).fillRoundedRect(180, 70, 600, 400, 16).lineStyle(2, C.cyan, 1).strokeRoundedRect(180, 70, 600, 400, 16);
    const L = ['HOW TO PLAY', '', 'SPACE / CLICK / TAP  =  FLIP GRAVITY', '', 'Your cube runs automatically.', 'Flip between floor and ceiling', 'to dodge spikes, blocks and red orbs.', 'Collect ◆ orbs to unlock skins.', 'Survive longer for a bigger multiplier.', '', 'After 15s, robots hunt you: RED WARNING = switch lane!', 'One hit = game over.'];
    const t = txt(this, W / 2, 255, L.join('\n'), 18, '#ffffff').setLineSpacing(8);
    const close = btn(this, W / 2, 430, 'CLOSE', () => { this.helpOpen = false; c.destroy(true); }, 200);
    c.add([dim, g, t, close]);
  }
  update(time) {
    drawBg(this.bg, time, time * .15);
    const g = this.pg.clear(), sk = SKINS[Save.data.skin];
    drawChar(g, 150, 300 + Math.sin(time / 500) * 18, sk, { t: time / 1000, rot: time / 400, sc: 1.6 });
    drawChar(g, W - 150, 300 - Math.sin(time / 500) * 18, sk, { t: time / 1000, rot: -time / 400, sc: 1.6, fl: -1 });
  }
}

// ---- scenes/SkinScene ----
// Character selection: big animated preview, name / rarity / price, equip or unlock, thumbnail strip.
class SkinScene extends Phaser.Scene {
  constructor() { super('Skin'); }
  create() {
    makeTextures(this); this.cameras.main.fadeIn(250);
    this.sel = Save.data.skin; this.busy = false; this.big = null;
    this.bg = this.add.graphics(); this.pg = this.add.graphics().setDepth(5);
    txt(this, W / 2, 38, 'CHARACTERS', 32, '#ffffff', '#A855F7');
    this.coinT = txt(this, W - 90, 38, '', 20, '#00F5FF');
    btn(this, 100, 38, '‹ BACK', () => this.scene.start('Menu'), 150, C.purple);
    this.ui = this.add.container(0, 0); this.build();
    this.input.keyboard.on('keydown-LEFT', () => this.move(-1));
    this.input.keyboard.on('keydown-RIGHT', () => this.move(1));
    this.input.keyboard.on('keydown-ENTER', () => { if (!this.busy) this.act(); });
  }
  move(d) { if (this.busy) return; this.sel = (this.sel + d + SKINS.length) % SKINS.length; AudioM.sfx('click'); this.build(); }
  build() {
    this.ui.removeAll(true); const d = Save.data, c = SKINS[this.sel], R = RARITY[c.rarity], own = d.owned.includes(this.sel), eq = d.skin === this.sel;
    this.coinT.setText('◆ ' + d.coins);
    const add = (...o) => { this.ui.add(o); return o[0]; };
    add(this.add.graphics().fillStyle(0x12122a, .9).fillRoundedRect(50, 80, 400, 300, 16).lineStyle(2, R.col, 1).strokeRoundedRect(50, 80, 400, 300, 16));
    add(txt(this, 700, 125, c.name, 40, '#ffffff', R.hex));
    add(txt(this, 700, 172, c.rarity, 18, R.hex));
    add(this.add.text(700, 232, c.blurb, { fontFamily: F, fontSize: '15px', color: '#b8b8e0', align: 'center', wordWrap: { width: 380 } }).setOrigin(.5));
    add(txt(this, 700, 300, own ? (eq ? 'EQUIPPED' : 'UNLOCKED') : c.price ? `LOCKED  ·  ◆ ${c.price}` : 'FREE', 18, own ? '#00F5FF' : '#FFC800'));
    add(btn(this, 700, 350, eq ? 'EQUIPPED ✓' : own ? 'EQUIP' : `UNLOCK  ◆ ${c.price}`, () => this.act(), 280, eq ? 0x3a3a5c : R.col));
    this.msg = add(txt(this, 700, 395, '', 15, '#FF3366'));
    add(btn(this, 100, 270, '‹', () => this.move(-1), 60, C.blue)); add(btn(this, 400, 270, '›', () => this.move(1), 60, C.blue)); // arrows (keys also work)
    SKINS.forEach((k, i) => {
      const x = 92 + i * 111, o = d.owned.includes(i), r = RARITY[k.rarity];
      add(this.add.graphics().fillStyle(0x12122a, 1).fillRoundedRect(x - 50, 415, 100, 100, 12).lineStyle(i === this.sel ? 3 : 1.5, i === this.sel ? 0xffffff : r.col, i === this.sel ? 1 : .6).strokeRoundedRect(x - 50, 415, 100, 100, 12));
      add(txt(this, x, 495, d.skin === i ? 'EQUIPPED' : o ? k.name : '◆ ' + k.price, 11, d.skin === i ? '#00F5FF' : o ? '#ffffff' : '#FFC800'));
      add(this.add.zone(x, 465, 100, 100).setInteractive({ useHandCursor: true }).on('pointerdown', () => { if (!this.busy) { this.sel = i; AudioM.sfx('click'); this.build(); } }));
    });
  }
  act() {
    const c = SKINS[this.sel], d = Save.data;
    if (d.owned.includes(this.sel)) { d.skin = this.sel; Save.save(); AudioM.sfx('click'); return this.build(); }
    if (d.coins < c.price) { AudioM.sfx('deny'); this.cameras.main.shake(120, .004); this.msg.setText(`NEED ${c.price - d.coins} MORE ◆`); return; }
    d.coins -= c.price; d.owned.push(this.sel); d.skin = this.sel; Save.save(); AudioM.sfx('buy');
    this.build(); this.unlockFx(c);
  }
  // Unlock cinematic: dim, shockwave rings, particle burst, character zooms in, tap to continue.
  unlockFx(c) {
    this.busy = true; const col = RARITY[c.rarity].col, hex = RARITY[c.rarity].hex, cx = W / 2, cy = 250;
    const o = this.add.container(0, 0).setDepth(50), dim = this.add.rectangle(W / 2, H / 2, W, H, 0, .9).setInteractive();
    const ring = this.add.graphics(), bigG = this.add.graphics(); this.bigG = bigG; this.big = { ch: c, sc: 0 };
    const t1 = txt(this, cx, 70, 'UNLOCKED!', 20, hex, hex).setScale(.1), t2 = txt(this, cx, 395, c.name, 44, '#ffffff', hex).setAlpha(0);
    const t3 = txt(this, cx, 445, c.rarity, 20, hex).setAlpha(0), t4 = txt(this, cx, 495, 'TAP TO CONTINUE', 14, '#8b8bd0').setAlpha(0);
    o.add([dim, ring, bigG, t1, t2, t3, t4]);
    this.cameras.main.flash(250, 255, 255, 255);
    this.tweens.add({ targets: this.big, sc: 4.2, duration: 750, ease: 'Back.out' });
    this.tweens.add({ targets: t1, scale: 2.2, duration: 600, ease: 'Back.out' });
    this.tweens.add({ targets: [t2, t3], alpha: 1, duration: 400, delay: 500 });
    this.tweens.addCounter({ from: 0, to: 1, duration: 1100, onUpdate: t => { const v = t.getValue(); ring.clear(); for (let i = 0; i < 3; i++) { const p = Math.max(0, v - i * .12); ring.lineStyle(4, col, (1 - p) * .9).strokeCircle(cx, cy, p * 460); } } });
    const em = this.add.particles(cx, cy, 'dot', { lifespan: { min: 600, max: 1400 }, speed: { min: 150, max: 650 }, scale: { start: 1.4, end: 0 }, alpha: { start: 1, end: 0 }, color: [0xffffff, col, col], blendMode: 'ADD', emitting: false }).setDepth(51);
    em.explode(90); this.time.delayedCall(350, () => em.explode(50));
    this.time.delayedCall(900, () => { t4.setAlpha(1); this.tweens.add({ targets: t4, alpha: .3, duration: 500, yoyo: true, repeat: -1 }); dim.once('pointerdown', () => { this.big = null; o.destroy(true); em.destroy(); this.busy = false; }); });
  }
  update(time) {
    const t = time / 1000, d = Save.data; drawBg(this.bg, time, time * .1);
    const g = this.pg.clear(), c = SKINS[this.sel];
    drawChar(g, 250, 230, c, { t, rot: t * 1.2, sc: 3.2, fl: Math.cos(t * 1.5) > .92 ? -1 : 1, dim: d.owned.includes(this.sel) ? 1 : .45 });
    SKINS.forEach((k, i) => drawChar(g, 92 + i * 111, 452, k, { t, rot: t * 1.2, sc: .95, dim: d.owned.includes(i) ? 1 : .35 }));
    if (this.big) { this.bigG.clear(); drawChar(this.bigG, W / 2, 250, this.big.ch, { t, rot: t * 1.5, sc: this.big.sc }); }
  }
}

// ---- scenes/GameOverScene ----
class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }
  init(d) { this.r = d; }
  create() {
    const r = this.r; this.cameras.main.fadeIn(300);
    this.bg = this.add.graphics();
    Ads.interstitial(); // no-op hook; a rewarded "revive" button would also go here (see Ads.js)
    const t = txt(this, W / 2, 85, 'GAME OVER', 64, '#FF3366', '#FF3366').setScale(.2);
    this.tweens.add({ targets: t, scale: 1, duration: 450, ease: 'Back.out' });
    const sc = txt(this, W / 2, 175, 'SCORE 0', 38, '#ffffff', '#00F5FF');
    this.tweens.addCounter({ from: 0, to: r.score, duration: 900, onUpdate: c => sc.setText('SCORE ' + Math.floor(c.getValue())) });
    if (r.newBest) this.tweens.add({ targets: txt(this, W / 2, 222, '★ NEW BEST ★', 22, '#FFC800', '#FFC800'), alpha: .3, duration: 400, yoyo: true, repeat: -1 });
    else txt(this, W / 2, 222, 'BEST ' + Save.data.best, 20, '#A855F7');
    txt(this, W / 2, 262, `◆ +${r.coins}      TOTAL ◆ ${Save.data.coins}`, 18, '#00F5FF');
    btn(this, W / 2, 340, 'PLAY AGAIN', () => this.scene.start('Game'));
    btn(this, W / 2, 410, 'MAIN MENU', () => this.scene.start('Menu'), 260, C.purple);
    this.time.delayedCall(450, () => { // short delay avoids an accidental instant restart
      const go = () => this.scene.start('Game');
      this.input.keyboard.on('keydown-SPACE', go); this.input.keyboard.on('keydown-ENTER', go);
    });
  }
  update(time) { drawBg(this.bg, time, time * .05); }
}

// ---- scenes/GameScene ----

const TIER_COL = ['#7CFC9A', '#00F5FF', '#3B82F6', '#A855F7', '#FF8A00', '#FF3366', '#FF0044'];
class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }
  create() {
    // All state is reset here, so scene.start('Game') restarts cleanly (robots/obstacles/particles included).
    Object.assign(this, { t: 0, clock: 0, off: 0, speed: 330, score: 0, coins: 0, gdir: 1, py: FLOOR - HALF, vy: 0, rot: 0, fl: 1,
      alive: true, parts: [], free: this.free || [], skin: SKINS[Save.data.skin], warning: false });
    if (!this.mgr) this.mgr = new EnemySpawnManager(); this.mgr.reset();
    this.aic = { py: this.py, gdir: 1, fx: (...a) => this.pfx(...a), onWarn: (rb, relock) => this.onWarn(rb, relock), onPass: rb => this.onPass(rb) };
    this.cameras.main.fadeIn(200); makeTextures(this);
    this.bg = this.add.graphics().setDepth(-1);
    this.trail = makeTrail(this, this.skin); this.boom = makeBoom(this, this.skin); // created before g so they draw behind
    this.g = this.add.graphics();
    const st = { fontFamily: F, fontSize: '24px', color: '#ffffff', fontStyle: 'bold' };
    this.hudS = this.add.text(24, 14, '', st).setDepth(10).setShadow(0, 0, '#00F5FF', 10, true, true);
    this.hudD = this.add.text(24, 46, '', { ...st, fontSize: '14px' }).setDepth(10);
    this.hudC = this.add.text(W - 24, 14, '', st).setOrigin(1, 0).setDepth(10).setColor('#00F5FF');
    this.hudM = this.add.text(W / 2, 18, '', { ...st, fontSize: '18px', color: '#A855F7' }).setOrigin(.5, 0).setDepth(10);
    this.hint = this.add.text(W / 2, H / 2, 'SPACE / CLICK / TAP  =  FLIP', { ...st, fontSize: '22px', color: '#8b8bd0' }).setOrigin(.5);
    this.banner = this.add.text(W / 2, 100, '', { ...st, fontSize: '22px', color: '#FF3366' }).setOrigin(.5).setAlpha(0).setDepth(10).setShadow(0, 0, '#FF3366', 12, true, true);
    this.input.on('pointerdown', () => this.flip());
    this.input.keyboard.on('keydown-SPACE', e => { if (!e.repeat) this.flip(); });
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('Menu'));
  }
  flip() {
    if (!this.alive) return;
    this.gdir *= -1; this.vy = this.gdir * 220; AudioM.sfx('flip'); this.burst(PX, this.py, 8, this.skin.c1, 260);
  }
  // pooled particles: reuse objects instead of allocating
  pfx(x, y, vx, vy, life, c, s) {
    if (this.parts.length > 500) return;
    const p = this.free.pop() || {}; p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.life = 1; p.decay = 1 / life; p.c = c; p.s = s; this.parts.push(p);
  }
  burst(x, y, n, c, spd) { for (let i = 0; i < n; i++) this.pfx(x, y, (Math.random() - .5) * spd * 2, (Math.random() - .5) * spd * 2, .45 + Math.random() * .6, c, 2 + Math.random() * 4); }
  onWarn(rb, relock) { // sound + "new threat" banner the first time a robot type shows up
    AudioM.sfx(relock ? 'lock' : 'warn');
    if (rb.fresh) { rb.fresh = false; this.banner.setText('NEW THREAT: ' + rb.type.toUpperCase()).setAlpha(1); this.tweens.add({ targets: this.banner, alpha: 0, delay: 1500, duration: 700 }); }
  }
  onPass(rb) { // dodged robot burns out in an explosion + bonus
    this.score += 25 * ScoreManager.multiplier(this.t); AudioM.sfx('boom'); this.cameras.main.shake(90, .003);
    this.burst(rb.x, rb.y, rb.type === 'destroyer' ? 40 : 22, TYPE_COL[rb.type], 320); this.burst(rb.x, rb.y, 8, 0xffffff, 240);
  }
  update(_, delta) {
    const dt = Math.min(delta / 1000, .05); this.clock += dt;
    if (this.alive) this.step(dt);
    let n = 0; for (const p of this.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= p.decay * dt; if (p.life > 0) this.parts[n++] = p; else this.free.push(p); }
    this.parts.length = n; this.draw();
  }
  step(dt) {
    this.t += dt; const t = this.t, speed = Difficulty.speed(t); this.speed = speed; // difficulty is a function of survival time
    const mult = ScoreManager.multiplier(t), dx = speed * dt; this.score += dx / 10 * mult; this.off += dx;
    // --- gravity physics with floor/ceiling clamp ---
    this.vy += this.gdir * G * dt; this.py += this.vy * dt;
    const lo = FLOOR - HALF, hi = CEIL + HALF;
    if (this.py > lo) { this.py = lo; this.vy = 0; } if (this.py < hi) { this.py = hi; this.vy = 0; }
    const grounded = (this.py === lo && this.gdir === 1) || (this.py === hi && this.gdir === -1);
    if (grounded) this.rot += (Math.round(this.rot / (Math.PI / 2)) * Math.PI / 2 - this.rot) * Math.min(1, dt * 20); else this.rot += this.gdir * dt * 7;
    // --- obstacles, orbs and robots (spawning, AI, fairness) ---
    this.aic.py = this.py; this.aic.gdir = this.gdir; this.mgr.update(dt, t, speed, this.aic);
    this.warning = this.mgr.robots.some(r => r.state === 'warn');
    // --- collisions (identical hitbox for every character) ---
    const r = { x: PX - HALF + 4, y: this.py - HALF + 4, w: HALF * 2 - 8, h: HALF * 2 - 8 };
    for (const o of this.mgr.obs) if (collides(o, r)) return this.die();
    const rb = this.mgr.hitsRobot(r); if (rb) return this.die(rb);
    for (const o of this.mgr.orbs) if (Math.hypot(o.x - PX, o.y - this.py) < HALF + 16) { o.got = true; this.coins++; AudioM.sfx('coin'); this.burst(o.x, o.y, 10, C.cyan, 220); }
    this.fl += (this.gdir - this.fl) * Math.min(1, dt * 18); this.trail.setPosition(PX - 10, this.py);
    if (this.skin.id === 'slime' && this.trail.setGravity) this.trail.setGravity(0, 900 * this.gdir);
    this.hint.setAlpha(Math.max(0, 1 - t / 2.5));
  }
  die(rb) {
    this.alive = false; AudioM.sfx('hit');
    this.cameras.main.shake(rb ? 450 : 350, rb ? .02 : .012); this.cameras.main.flash(150, 255, 51, 102);
    this.trail.stop(); this.boom.explode(60, PX, this.py); this.burst(PX, this.py, 20, 0xffffff, 300);
    if (rb) { this.burst(rb.x, rb.y, 36, TYPE_COL[rb.type], 420); this.mgr.robots.splice(this.mgr.robots.indexOf(rb), 1); }
    const score = Math.floor(this.score), coins = this.coins, newBest = ScoreManager.commit(score, coins);
    this.time.delayedCall(850, () => this.scene.start('GameOver', { score, coins, newBest }));
  }
  draw() {
    const ck = this.clock; drawBg(this.bg, ck * 1000, this.off);
    const g = this.g.clear();
    g.fillStyle(C.purple, .08).fillRect(0, FLOOR, W, H - FLOOR).fillRect(0, 0, W, CEIL);
    for (const y of [FLOOR, CEIL]) { g.lineStyle(10, C.purple, .15).lineBetween(0, y, W, y); g.lineStyle(3, C.purple, 1).lineBetween(0, y, W, y); }
    g.lineStyle(2, C.purple, .4);
    for (let i = 0; i < 17; i++) { const x = (((i * 60 - this.off) % W) + W) % W; g.lineBetween(x, FLOOR + 6, x, FLOOR + 14); g.lineBetween(x, CEIL - 6, x, CEIL - 14); }
    this.mgr.obs.forEach(o => drawObstacle(g, o)); this.mgr.orbs.forEach(o => drawOrb(g, o.x, o.y, ck));
    if (this.warning) g.fillStyle(0xFF3366, .05 + .05 * Math.sin(ck * 14)).fillRect(W - 90, 0, 90, H); // edge flash while a robot is incoming
    this.mgr.robots.forEach(rb => drawWarning(g, rb, ck)); this.mgr.robots.forEach(rb => rb.draw(g, ck));
    for (const p of this.parts) g.fillStyle(p.c, Math.min(1, p.life)).fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
    if (this.alive) drawChar(g, PX, this.py, this.skin, { t: ck, fl: this.fl, rot: this.rot, vy: this.vy });
    this.hudS.setText(String(Math.floor(this.score))); this.hudC.setText('◆ ' + (Save.data.coins + this.coins));
    this.hudD.setText(Difficulty.name(this.t)).setColor(TIER_COL[Difficulty.tier(this.t)]);
    const m = ScoreManager.multiplier(this.t); this.hudM.setText(m > 1 ? 'x' + m.toFixed(1) : '');
  }
}

// ---- main ----

// Browsers block audio until a user gesture: unlock on the first interaction.
['pointerdown', 'keydown', 'touchstart'].forEach(e => window.addEventListener(e, () => AudioM.unlock(), { passive: true }));
const start = () => new Phaser.Game({
  type: Phaser.AUTO, parent: 'game', width: W, height: H, backgroundColor: '#080812',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { activePointers: 2 }, scene: [MenuScene, GameScene, GameOverScene, SkinScene],
});
// Wait (max 1.5s) for the Orbitron font so the first menu frame looks right.
Promise.race([document.fonts.load('700 20px Orbitron'), new Promise(r => setTimeout(r, 1500))]).then(start);

})();
