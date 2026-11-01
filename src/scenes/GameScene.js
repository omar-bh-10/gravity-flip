import { W, H, C, F, SKINS, FLOOR, CEIL, HALF } from '../config.js';
import { Save } from '../systems/SaveManager.js';
import { AudioM } from '../systems/AudioManager.js';
import { ScoreManager } from '../systems/ScoreManager.js';
import { drawBg } from '../systems/UI.js';
import { drawChar } from '../objects/Player.js';
import { makeTextures, makeTrail, makeBoom } from '../objects/Trails.js';
import { ob, updateObstacle, collides, drawObstacle } from '../objects/Obstacle.js';
import { drawOrb } from '../objects/Collectible.js';

const PX = 190, G = 3800; // player screen x, gravity strength (a full flip takes ~0.45s)
export default class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }
  create() {
    // All state is reset here, so scene.start('Game') restarts cleanly without a page refresh.
    Object.assign(this, { t: 0, clock: 0, off: 0, speed: 330, score: 0, coins: 0, gdir: 1, py: FLOOR - HALF, vy: 0, rot: 0, fl: 1,
      alive: true, obs: [], orbs: [], parts: [], nextX: W + 500, skin: SKINS[Save.data.skin] });
    this.cameras.main.fadeIn(200);
    makeTextures(this); this.bg = this.add.graphics().setDepth(-1);
    this.trail = makeTrail(this, this.skin); this.boom = makeBoom(this, this.skin); // created before g so they draw behind the character
    this.g = this.add.graphics();
    const st = { fontFamily: F, fontSize: '24px', color: '#ffffff', fontStyle: 'bold' };
    this.hudS = this.add.text(24, 14, '', st).setDepth(10).setShadow(0, 0, '#00F5FF', 10, true, true);
    this.hudC = this.add.text(W - 24, 14, '', st).setOrigin(1, 0).setDepth(10).setColor('#00F5FF');
    this.hudM = this.add.text(W / 2, 18, '', { ...st, fontSize: '18px', color: '#A855F7' }).setOrigin(.5, 0).setDepth(10);
    this.hint = this.add.text(W / 2, H / 2, 'SPACE / CLICK / TAP  =  FLIP', { ...st, fontSize: '22px', color: '#8b8bd0' }).setOrigin(.5);
    this.input.on('pointerdown', () => this.flip());
    this.input.keyboard.on('keydown-SPACE', e => { if (!e.repeat) this.flip(); });
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('Menu'));
  }
  flip() {
    if (!this.alive) return;
    this.gdir *= -1; this.vy = this.gdir * 220; AudioM.sfx('flip');
    this.burst(PX, this.py, 8, this.skin.c1, 260);
  }
  update(_, delta) {
    const dt = Math.min(delta / 1000, .05); this.clock += dt;
    if (this.alive) this.step(dt);
    this.parts = this.parts.filter(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= p.decay * dt; return p.life > 0; });
    this.draw();
  }
  step(dt) {
    this.t += dt; const d = Math.min(1, this.t / 80); this.speed = 330 + 300 * d; // difficulty ramps over ~80s
    const mult = ScoreManager.multiplier(this.t), dx = this.speed * dt;
    this.score += dx / 10 * mult; this.off += dx;
    // --- gravity physics with floor/ceiling clamp ---
    this.vy += this.gdir * G * dt; this.py += this.vy * dt;
    const lo = FLOOR - HALF, hi = CEIL + HALF;
    if (this.py > lo) { this.py = lo; this.vy = 0; }
    if (this.py < hi) { this.py = hi; this.vy = 0; }
    const grounded = (this.py === lo && this.gdir === 1) || (this.py === hi && this.gdir === -1);
    if (grounded) this.rot += (Math.round(this.rot / (Math.PI / 2)) * Math.PI / 2 - this.rot) * Math.min(1, dt * 20);
    else this.rot += this.gdir * dt * 7;
    // --- world scroll + spawning ---
    this.nextX -= dx; this.obs.forEach(o => o.x -= dx); this.orbs.forEach(o => o.x -= dx);
    while (this.nextX < W + 200) this.spawn(d);
    this.obs = this.obs.filter(o => o.x + o.w > -60); this.orbs = this.orbs.filter(o => o.x > -40 && !o.got);
    // --- collisions ---
    const r = { x: PX - HALF + 4, y: this.py - HALF + 4, w: HALF * 2 - 8, h: HALF * 2 - 8 };
    for (const o of this.obs) { updateObstacle(o, this.t); if (collides(o, r)) return this.die(); }
    for (const o of this.orbs) if (Math.hypot(o.x - PX, o.y - this.py) < HALF + 16) {
      o.got = true; this.coins++; AudioM.sfx('coin'); this.burst(o.x, o.y, 10, C.cyan, 220);
    }
    // --- character animation state + particle trail ---
    this.fl += (this.gdir - this.fl) * Math.min(1, dt * 18);
    this.trail.setPosition(PX - 10, this.py);
    if (this.skin.id === 'slime' && this.trail.setGravity) this.trail.setGravity(0, 900 * this.gdir);
    if (this.parts.length > 400) this.parts.splice(0, 100);
    this.hint.setAlpha(Math.max(0, 1 - this.t / 2.5));
  }
  /* Procedural patterns. Gaps scale with speed (>= ~0.75s) so a full gravity flip (~0.45s) is always possible. */
  spawn(d) {
    const x = this.nextX, s = this.speed, side = Math.random() < .5 ? 1 : -1, O = this.obs;
    const pool = [0, 2]; if (d > .1) pool.push(1); if (d > .2) pool.push(3, 4); if (d > .35) pool.push(5);
    const p = Phaser.Utils.Array.GetRandom(pool); let w = 40;
    if (p === 1) { O.push(ob('spike', x, side, 40, 40), ob('spike', x + 40, side, 40, 40)); w = 80; }
    else if (p === 2) { O.push(ob('block', x, side, 56, 60 + (Math.random() * 60 | 0))); w = 56; }
    else if (p === 3) { for (let i = 0; i < 3; i++) O.push(ob('spike', x + i * 40, side, 40, 40)); w = 120; }
    else if (p === 4) { O.push(ob('mover', x, 1, 32, 0, Math.random() * 6.3)); w = 32; }
    else if (p === 5) { const gp = s * .72; O.push(ob('spike', x, side, 40, 40), ob('block', x + 40 + gp, -side, 50, 70)); w = 40 + gp + 50; }
    else O.push(ob('spike', x, side, 40, 40));
    const gap = s * (1.05 - .3 * d);
    if (Math.random() < .75) { // orb trio in the middle of the gap (floor, ceiling or mid-air)
      const k = Math.random(), y = k < .33 ? FLOOR - 34 : k < .66 ? CEIL + 34 : (FLOOR + CEIL) / 2;
      for (let i = -1; i <= 1; i++) this.orbs.push({ x: x + w + gap / 2 + i * 44, y: y + (k >= .66 ? i * 30 : 0) });
    }
    this.nextX = x + w + gap;
  }
  burst(x, y, n, c, spd) {
    for (let i = 0; i < n; i++) this.parts.push({ x, y, vx: (Math.random() - .5) * spd * 2, vy: (Math.random() - .5) * spd * 2, life: 1, decay: 1.5 + Math.random(), c, s: 2 + Math.random() * 4 });
  }
  die() {
    this.alive = false; AudioM.sfx('hit');
    this.cameras.main.shake(350, .012); this.cameras.main.flash(150, 255, 51, 102);
    this.trail.stop(); this.boom.explode(60, PX, this.py); this.burst(PX, this.py, 20, 0xffffff, 300);
    const score = Math.floor(this.score), coins = this.coins, newBest = ScoreManager.commit(score, coins);
    this.time.delayedCall(850, () => this.scene.start('GameOver', { score, coins, newBest }));
  }
  draw() {
    drawBg(this.bg, this.clock * 1000, this.off);
    const g = this.g.clear();
    g.fillStyle(C.purple, .08).fillRect(0, FLOOR, W, H - FLOOR).fillRect(0, 0, W, CEIL);
    for (const y of [FLOOR, CEIL]) { g.lineStyle(10, C.purple, .15).lineBetween(0, y, W, y); g.lineStyle(3, C.purple, 1).lineBetween(0, y, W, y); }
    g.lineStyle(2, C.purple, .4);
    for (let i = 0; i < 17; i++) { const x = (((i * 60 - this.off) % W) + W) % W; g.lineBetween(x, FLOOR + 6, x, FLOOR + 14); g.lineBetween(x, CEIL - 6, x, CEIL - 14); }
    this.obs.forEach(o => drawObstacle(g, o)); this.orbs.forEach(o => drawOrb(g, o.x, o.y, this.clock));
    for (const p of this.parts) g.fillStyle(p.c, Math.min(1, p.life)).fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
    if (this.alive) drawChar(g, PX, this.py, this.skin, { t: this.clock, fl: this.fl, rot: this.rot, vy: this.vy });
    this.hudS.setText(String(Math.floor(this.score)));
    this.hudC.setText('◆ ' + (Save.data.coins + this.coins));
    const m = ScoreManager.multiplier(this.t); this.hudM.setText(m > 1 ? 'x' + m.toFixed(1) : '');
  }
}
