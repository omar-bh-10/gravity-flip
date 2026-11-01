import { C } from '../config.js';
export function drawOrb(g, x, y, t) {
  const p = 1 + Math.sin(t * 6 + x * .05) * .15;
  g.fillStyle(C.cyan, .12).fillCircle(x, y, 22 * p); g.fillStyle(C.cyan, .3).fillCircle(x, y, 15 * p);
  g.fillStyle(C.cyan, 1).fillCircle(x, y, 8); g.fillStyle(0xffffff, 1).fillCircle(x, y, 4);
}
