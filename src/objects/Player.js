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

export function drawChar(g, x, y, ch, st = {}) {
  const s = { t: 0, fl: 1, rot: 0, vy: 0, sc: 1, dim: 1, ...st };
  const f = ch.noflip ? 1 : (s.fl < 0 ? Math.min(s.fl, -.2) : Math.max(s.fl, .2)); // flip upside-down on ceiling
  g.save(); g.translateCanvas(x, y); g.scaleCanvas(s.sc, s.sc * f); DRAW[ch.id](g, s); g.restore();
}
