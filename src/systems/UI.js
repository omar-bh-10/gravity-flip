import { W, H, C, F } from '../config.js';
import { AudioM } from './AudioManager.js';
export const txt = (s, x, y, str, size = 20, col = '#ffffff', glow) => {
  const t = s.add.text(x, y, str, { fontFamily: F, fontSize: size + 'px', color: col, fontStyle: 'bold', align: 'center' }).setOrigin(.5);
  if (glow) t.setShadow(0, 0, glow, 14, true, true);
  return t;
};
// Animated neon backdrop: parallax grid + twinkling stars. t in ms, off = scroll distance in px.
export function drawBg(g, t, off = 0) {
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
export function btn(s, x, y, label, cb, w = 260, col = C.cyan) {
  const c = s.add.container(x, y), g = s.add.graphics(), t = txt(s, 0, 0, label, w < 200 ? 15 : 22);
  const draw = h => { g.clear(); g.fillStyle(col, h ? .35 : .12).fillRoundedRect(-w / 2, -26, w, 52, 12); g.lineStyle(2, col, 1).strokeRoundedRect(-w / 2, -26, w, 52, 12); };
  draw(0); c.add([g, t]); c.setSize(w, 52).setInteractive({ useHandCursor: true });
  c.on('pointerover', () => { draw(1); s.tweens.add({ targets: c, scale: 1.06, duration: 90 }); });
  c.on('pointerout', () => { draw(0); s.tweens.add({ targets: c, scale: 1, duration: 90 }); });
  c.on('pointerdown', () => { AudioM.sfx('click'); cb(); });
  c.label = t; return c;
}
