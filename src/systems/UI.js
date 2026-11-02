import { W, H, C, F, QUALITY } from '../config.js';
import { AudioM } from './AudioManager.js';
export const txt = (s, x, y, str, size = 20, col = '#ffffff', glow) => {
  const t = s.add.text(x, y, str, { fontFamily: F, fontSize: size + 'px', color: col, fontStyle: 'bold', align: 'center' }).setOrigin(.5);
  if (glow) t.setShadow(0, 0, glow, 14, true, true);
  return t;
};
// Simple animated neon backdrop (used by the character shop). t in ms, off = scroll distance in px.
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
export function vignette(g) { // darkened screen edges
  for (let i = 1; i <= (QUALITY.low ? 3 : 8); i++) { g.fillStyle(0, (QUALITY.low ? .12 : .05)); g.fillRect(0, 0, W, i * 6).fillRect(0, H - i * 6, W, i * 6).fillRect(0, 0, i * 9, H).fillRect(W - i * 9, 0, i * 9, H); }
}
export function buzz(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} } // haptic feedback on phones
export function fullscreen() { // toggle fullscreen + try to lock landscape (Android; iOS Safari has no fullscreen API for pages)
  try {
    const d = document, el = d.documentElement;
    if (d.fullscreenElement || d.webkitFullscreenElement) { (d.exitFullscreen || d.webkitExitFullscreen).call(d); return; }
    const p = (el.requestFullscreen || el.webkitRequestFullscreen).call(el); const lock = () => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) {} };
    if (p && p.then) p.then(lock).catch(() => {}); else lock();
  } catch (e) {}
}
// Animated scene transition: fade to dark with a neon sweep, then start the next scene.
export function go(s, key, data) {
  if (s.leaving) return; s.leaving = true; const cam = s.cameras.main;
  cam.fadeOut(240, 8, 8, 18); cam.once('camerafadeoutcomplete', () => { s.leaving = false; s.scene.start(key, data); });
}
export function btn(s, x, y, label, cb, w = 260, col = C.cyan) {
  const c = s.add.container(x, y), g = s.add.graphics(), t = txt(s, 0, 0, label, w < 200 ? 15 : 22);
  let hov = 0;
  const draw = () => {
    g.clear(); g.fillStyle(col, .1 + .25 * hov).fillRoundedRect(-w / 2, -26, w, 52, 12); g.lineStyle(2, col, 1).strokeRoundedRect(-w / 2, -26, w, 52, 12);
    g.lineStyle(3, 0xffffff, .5 + .5 * hov); const L = 14, a = -w / 2 - 4, b = w / 2 + 4; // corner brackets
    g.lineBetween(a, -30, a + L, -30).lineBetween(a, -30, a, -30 + L).lineBetween(b, 30, b - L, 30).lineBetween(b, 30, b, 30 - L);
    const sx = -w / 2 + ((s.time.now / 18) % (w * 2)) - w * .3; if (hov > 0) g.fillStyle(0xffffff, .12 * hov).fillRect(Math.max(-w / 2, sx), -24, Math.min(40, w / 2 - sx), 48); // shine sweep
  };
  c.add([g, t]); c.setSize(w, 52).setInteractive({ useHandCursor: true }); draw();
  const upd = () => { if (c.active) draw(); }; s.events.on('update', upd); c.once('destroy', () => s.events.off('update', upd)); // no listener leaks
  c.on('pointerover', () => { s.tweens.addCounter({ from: hov, to: 1, duration: 120, onUpdate: tw => { hov = tw.getValue(); } }); s.tweens.add({ targets: c, scale: 1.06, duration: 90 }); });
  c.on('pointerout', () => { s.tweens.addCounter({ from: hov, to: 0, duration: 120, onUpdate: tw => { hov = tw.getValue(); } }); s.tweens.add({ targets: c, scale: 1, duration: 90 }); });
  c.on('pointerdown', () => { AudioM.sfx('click'); cb(); });
  c.label = t; return c;
}
