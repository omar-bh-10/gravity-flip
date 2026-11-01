import { FLOOR, CEIL, C } from '../config.js';
// side: 1 = floor, -1 = ceiling. kinds: spike | block | mover (vertical sweeping hazard).
export const ob = (k, x, side, w, h, ph = 0) => ({ k, x, side, w, h, ph, y: 0 });
export function updateObstacle(o, t) {
  if (o.k === 'mover') o.y = (CEIL + FLOOR) / 2 + Math.sin(t * 2.2 + o.ph) * ((FLOOR - CEIL) / 2 - 20);
}
// Forgiving hitboxes: spikes use a narrower/shorter box than they look.
function box(o) {
  if (o.k === 'block') return { x: o.x, y: o.side === 1 ? FLOOR - o.h : CEIL, w: o.w, h: o.h };
  const sh = o.h * .7;
  return { x: o.x + o.w * .25, y: o.side === 1 ? FLOOR - sh : CEIL, w: o.w * .5, h: sh };
}
export function collides(o, r) {
  if (o.k === 'mover') { // circle vs rect
    const cx = o.x + 16, nx = Math.max(r.x, Math.min(cx, r.x + r.w)), ny = Math.max(r.y, Math.min(o.y, r.y + r.h));
    return (cx - nx) ** 2 + (o.y - ny) ** 2 < 169;
  }
  const b = box(o);
  return r.x < b.x + b.w && r.x + r.w > b.x && r.y < b.y + b.h && r.y + r.h > b.y;
}
export function drawObstacle(g, o) {
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
