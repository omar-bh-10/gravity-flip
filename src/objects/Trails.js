// Phaser particle systems: one distinct trail per character + shared textures generated at runtime.
export function makeTextures(s) {
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
export function makeTrail(s, ch) {
  const { texture, ...cfg } = TRAILS[ch.id];
  return s.add.particles(0, 0, texture, { blendMode: 'ADD', ...cfg });
}
export const makeBoom = (s, ch) => s.add.particles(0, 0, 'dot', { lifespan: { min: 400, max: 900 }, speed: { min: 120, max: 560 }, scale: { start: 1.3, end: 0 }, alpha: { start: 1, end: 0 }, color: [0xffffff, ch.c1, ch.c1], blendMode: 'ADD', emitting: false });
