import { W, H, C, F, SKINS, STAGES, THEME, FLOOR, CEIL, HALF, PX, G, QUALITY } from '../config.js';
import { Save } from '../systems/SaveManager.js';
import { AudioM } from '../systems/AudioManager.js';
import { ScoreManager } from '../systems/ScoreManager.js';
import { Difficulty } from '../systems/DifficultyManager.js';
import { EnemySpawnManager } from '../systems/EnemySpawnManager.js';
import { FireSystem } from '../systems/FireSystem.js';
import { World, stageOf, PAL, css, rgb } from '../systems/World.js';
import { vignette, go, buzz } from '../systems/UI.js';
import { drawChar } from '../objects/Player.js';
import { makeTextures, makeTrail, makeBoom } from '../objects/Trails.js';
import { collides, drawObstacle, hitbox } from '../objects/Obstacle.js';
import { drawOrb } from '../objects/Collectible.js';
import { drawWarning, TYPE_COL, DEF } from '../objects/RobotEnemy.js';

const MILES = [30, 60, 90, 120];
export default class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }
  create() {
    // All state is reset here, so scene.start('Game') restarts cleanly (robots, obstacles, particles, combo, stage...).
    const q = parseFloat(new URLSearchParams(location.search).get('t')) || 0; // test shortcut: index.html?t=40 starts at 40s
    Object.assign(this, { t: q, clock: 0, off: 0, speed: 360, score: 0, coins: 0, gdir: 1, py: FLOOR - HALF, vy: 0, rot: 0, fl: 1, alive: true, leaving: false,
      parts: [], free: this.free || [], shards: [], rings: [], skin: SKINS[Save.data.skin], warning: false, deadT: 0, vic: 0, combo: 0, comboT: 0, maxCombo: 0,
      nearCount: 0, kills: 0, slowS: 0, fA: 0, fN: 0, surgeOn: false, surgeWarn: false, stage: stageOf(q), miles: new Set(MILES.filter(m => m <= q)) });
    if (!this.mgr) this.mgr = new EnemySpawnManager(); this.mgr.reset();
    if (!this.fire) this.fire = new FireSystem(); this.fire.reset();
    if (!this.world) this.world = new World(); this.world.reset(q); this.wcb = s => this.onStage(s);
    AudioM.setStage(this.stage); AudioM.setIntensity(Math.min(1, q / 150));
    this.aic = { py: this.py, gdir: 1, surge: false, fx: (...a) => this.pfx(...a), onWarn: (rb, relock) => this.onWarn(rb, relock), onPass: rb => this.onPass(rb),
      onPortal: () => this.onPortal(), onFireHit: rb => { AudioM.sfx('break'); this.burst(rb.x, rb.y, 6, 0xFF8A00, 200); }, onKill: rb => this.onKill(rb),
      onBreak: o => this.onBreak(o), onExplode: (x, y) => this.onExplode(x, y), onSpark: (x, y) => this.burst(x, y, 5, 0xFF8A00, 140) };
    const cam = this.cameras.main; cam.setZoom(1); cam.fadeIn(350, 8, 8, 18); makeTextures(this);
    this.bg = this.add.graphics().setDepth(-1);
    this.trail = makeTrail(this, this.skin); this.boom = makeBoom(this, this.skin); // created before g so they draw behind
    this.g = this.add.graphics(); this.hudG = this.add.graphics().setDepth(9);
    const touch = !!(this.sys && this.sys.game && this.sys.game.device && this.sys.game.device.input.touch); // phone/tablet: show touch hints
    const st = { fontFamily: F, fontSize: '24px', color: '#ffffff', fontStyle: 'bold' }, T = (x, y, s, o, extra = {}) => this.add.text(x, y, s, { ...st, ...extra }).setOrigin(...o).setDepth(10);
    this.hudL = T(28, 14, 'SCORE', [0, 0], { fontSize: '12px', color: '#8b8bd0' }); this.hudS = T(28, 26, '0', [0, 0], { fontSize: '28px' }).setShadow(0, 0, '#00F5FF', 10, true, true);
    this.hudStage = T(28, 62, '', [0, 0], { fontSize: '13px' }); this.hudC = T(W - 24, 14, '', [1, 0], { fontSize: '22px', color: '#00F5FF' }); this.hudB = T(W - 24, 40, '', [1, 0], { fontSize: '13px', color: '#8b8bd0' });
    this.hudM = T(W / 2, 12, '', [.5, 0], { fontSize: '20px', color: '#FFD23F' }); this.hudX = T(W / 2, 36, '', [.5, 0], { fontSize: '13px', color: '#c8c8f0' });
    this.hint = this.add.text(W / 2, H / 2 + 40, touch ? 'TAP = FLIP GRAVITY      FIRE BUTTON = FIREBALL' : 'SPACE / CLICK = FLIP     F / RIGHT-CLICK = FIRE', { ...st, fontSize: '16px', color: '#8b8bd0' }).setOrigin(.5);
    this.banner = T(W / 2, 120, '', [.5, .5], { fontSize: '22px', color: '#FF3366' }).setAlpha(0).setShadow(0, 0, '#FF3366', 12, true, true);
    this.stageS = T(W / 2, H / 2 - 84, '', [.5, .5], { fontSize: '16px' }).setAlpha(0); this.stageT = T(W / 2, H / 2 - 38, '', [.5, .5], { fontSize: '44px' }).setAlpha(0).setShadow(0, 0, '#ffffff', 16, true, true);
    this.mileT = T(W / 2, H / 2 + 14, '', [.5, .5], { fontSize: '20px', color: '#FFD23F' }).setAlpha(0); this.surgeT = T(W / 2, 150, '', [.5, .5], { fontSize: '24px', color: '#FF3366' }).setAlpha(0);
    this.hudStage.setText(`STAGE ${this.stage + 1} · ${STAGES[this.stage].name}`).setColor(css(PAL[this.stage].glow));
    if (this.input.mouse) this.input.mouse.disableContextMenu();
    this.fireZone = this.add.zone(88, 446, 130, 130).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.shoot()); // big on-screen FIRE button (left thumb)
    this.input.on('pointerdown', (p, over) => this.onPointer(p, over)); // tap anywhere (right thumb) = flip; the fire button handles itself
    this.input.keyboard.on('keydown-SPACE', e => { if (!e.repeat) this.flip(); });
    ['F', 'X'].forEach(k => this.input.keyboard.on('keydown-' + k, e => { if (!e.repeat) this.shoot(); }));
    this.input.keyboard.on('keydown-ESC', () => go(this, 'Menu'));
  }
  onPointer(p, over) { if (p.rightButtonDown && p.rightButtonDown()) return this.shoot(); if (!over.length) this.flip(); } // left click/tap = flip, right click = fire
  flip() { if (!this.alive) return; this.gdir *= -1; this.vy = this.gdir * 220; AudioM.sfx('flip'); this.burst(PX, this.py, 8, this.skin.c1, 260); }
  shoot() { if (!this.alive) return; if (this.fire.fire(this.py)) { AudioM.sfx('fire'); buzz(8); this.burst(PX + 22, this.py, 6, 0xFF8A00, 160); } else AudioM.sfx('deny'); }
  // ---- pooled particles / shards / rings ----
  pfx(x, y, vx, vy, life, c, s) { if (this.parts.length > (QUALITY.low ? 260 : 520)) return; const p = this.free.pop() || {}; p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.life = 1; p.decay = 1 / life; p.c = c; p.s = s; this.parts.push(p); }
  burst(x, y, n, c, spd) { for (let i = 0; i < n; i++) this.pfx(x, y, (Math.random() - .5) * spd * 2, (Math.random() - .5) * spd * 2, .45 + Math.random() * .6, c, 2 + Math.random() * 4); }
  ring(x, y, col, max = 420, life = .7) { this.rings.push({ x, y, col, max, life, l0: life }); }
  pop(x, y, str, col) { const t = this.add.text(x, y, str, { fontFamily: F, fontSize: '18px', color: col, fontStyle: 'bold' }).setOrigin(.5).setDepth(10); this.tweens.add({ targets: t, y: y - 40, alpha: 0, duration: 800, onComplete: () => t.destroy() }); }
  // ---- scoring / combo ----
  addCombo(n = 1) { this.combo += n; this.comboT = 3.5; this.maxCombo = Math.max(this.maxCombo, this.combo); if (this.combo % 3 === 0) AudioM.sfx('combo', this.combo); }
  bonus(base) { const p = Math.round((base + this.combo * 5) * ScoreManager.multiplier(this.t)); this.score += p; return p; }
  nearMiss(x, y) { this.addCombo(1); this.nearCount++; const p = this.bonus(20); AudioM.sfx('near'); buzz(25); this.cameras.main.shake(110, .004); this.burst(PX, this.py, 10, C.cyan, 300); this.pop(x + 50, y - 34, 'CLOSE! +' + p, '#00F5FF'); }
  // ---- events from the systems ----
  onWarn(rb, relock) {
    AudioM.sfx(relock ? 'lock' : 'warn_' + rb.type);
    if (rb.fresh) { rb.fresh = false; this.banner.setText('NEW THREAT: ' + rb.type.toUpperCase()).setAlpha(1); this.tweens.add({ targets: this.banner, alpha: 0, delay: 1500, duration: 700 }); }
  }
  onPass(rb) { this.addCombo(1); this.bonus(25); AudioM.sfx('boom'); this.cameras.main.shake(90, .003); this.burst(rb.x, rb.y, rb.type === 'destroyer' ? 40 : 22, TYPE_COL[rb.type], 320); this.burst(rb.x, rb.y, 8, 0xffffff, 240); }
  onKill(rb) {
    const d = DEF[rb.type]; this.addCombo(2); this.kills++; const pts = this.bonus(d.score); this.coins += d.coins;
    AudioM.sfx('kill_' + rb.type); buzz(25); this.cameras.main.shake(160, .007); this.burst(rb.x, rb.y, 40, TYPE_COL[rb.type], 420); this.burst(rb.x, rb.y, 14, 0xFFD23F, 300); this.ring(rb.x, rb.y, TYPE_COL[rb.type], 200, .45);
    this.pop(rb.x, rb.y - 20, '+' + pts + '  ◆' + d.coins, '#FFD23F');
  }
  onBreak(o) { this.score += 15; AudioM.sfx('break'); this.burst(o.x + o.w / 2, o.side === 1 ? FLOOR - o.h / 2 : CEIL + o.h / 2, 14, o.k === 'crate' ? 0x7dd3fc : 0xFF8A00, 260); }
  onExplode(x, y) { this.addCombo(1); this.score += 30; AudioM.sfx('explode'); buzz(40); this.cameras.main.shake(240, .01); this.burst(x, y, 50, 0xFF5A1F, 520); this.burst(x, y, 20, 0xFFD23F, 380); this.ring(x, y, 0xFF8A00, 260, .5); }
  onPortal() { this.gdir *= -1; this.vy = this.gdir * 220; AudioM.sfx('portal'); this.cameras.main.flash(180, 0, 245, 255); this.burst(PX, this.py, 24, C.cyan, 380); this.ring(PX, this.py, C.cyan, 240, .5); }
  onStage(s) { // spectacular world transition: flash, shake, shockwaves, particle storm, banner, new music
    this.stage = s; AudioM.setStage(s); AudioM.sfx('stage'); buzz(90); const c = PAL[s].glow, a = PAL[s].acc, cam = this.cameras.main;
    cam.flash(380, ...rgb(c)); cam.shake(650, .013);
    this.stageT.setText(STAGES[s].name).setColor(css(c)).setShadow(0, 0, css(c), 18, true, true).setAlpha(0).setScale(1.7); this.stageS.setText('— STAGE ' + (s + 1) + ' —').setColor(css(a)).setAlpha(0);
    this.tweens.killTweensOf([this.stageT, this.stageS]);
    this.tweens.add({ targets: this.stageT, alpha: 1, scale: 1, duration: 500, ease: 'Back.out' }); this.tweens.add({ targets: this.stageS, alpha: 1, duration: 500 });
    this.tweens.add({ targets: [this.stageT, this.stageS], alpha: 0, delay: 2300, duration: 700 });
    for (let i = 0; i < 3; i++) this.time.delayedCall(i * 180, () => this.ring(W / 2, H / 2, i % 2 ? a : c, 700, .9));
    for (let i = 0; i < 50; i++) this.pfx(Math.random() * W, Math.random() * H, (Math.random() - .5) * 700, (Math.random() - .5) * 700, .9, i % 2 ? c : a, 3);
    this.hudStage.setText(`STAGE ${s + 1} · ${STAGES[s].name}`).setColor(css(c));
  }
  milestone(m) {
    const b = 250 * (MILES.indexOf(m) + 1); this.score += b; this.vic = 1; AudioM.sfx('milestone'); this.tweens.killTweensOf(this.mileT);
    this.mileT.setText(`★ ${m} SECONDS  +${b}`).setAlpha(1); this.tweens.add({ targets: this.mileT, alpha: 0, delay: 1900, duration: 600 }); this.ring(PX, this.py, 0xFFD23F, 300, .7);
  }
  // ---- per-frame ----
  update(_, delta) {
    let dt = Math.min(delta / 1000, .05);
    this.fA += delta; this.fN++; if (this.fN >= 60) { if (this.fA / this.fN > 24) { if (++this.slowS >= 3) QUALITY.low = true; } else this.slowS = 0; this.fA = this.fN = 0; } // auto lite mode if < ~42 fps for 3s
    if (!this.alive) { this.deadT += dt; const k = Math.min(1, this.deadT / .7); dt *= .22 + .78 * k * k; if (this.deadT > 1.25 && !this.leaving) go(this, 'GameOver', this.res); } // slow-motion death
    this.clock += dt; if (this.alive) this.step(dt);
    this.world.update(dt, this.t, this.alive ? this.wcb : null);
    let n = 0; for (const p of this.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= p.decay * dt; if (p.life > 0) this.parts[n++] = p; else this.free.push(p); } this.parts.length = n;
    n = 0; for (const s of this.shards) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += s.gv * dt; s.rot += s.vr * dt; s.life -= dt; if (s.life > 0) this.shards[n++] = s; } this.shards.length = n;
    n = 0; for (const r of this.rings) { r.life -= dt; if (r.life > 0) this.rings[n++] = r; } this.rings.length = n;
    this.draw();
  }
  step(dt) {
    this.t += dt; const t = this.t, sg = Difficulty.surge(t);
    if (sg.warn && !this.surgeWarn) { this.surgeWarn = true; AudioM.sfx('warn'); } else if (!sg.warn) this.surgeWarn = false;
    const on = sg.f > 1.01; if (on && !this.surgeOn) { AudioM.sfx('surge'); this.cameras.main.shake(300, .006); } this.surgeOn = on; this.aic.surge = on;
    const speed = Difficulty.speed(t) * sg.f; this.speed = speed; // speed grows with survival time + periodic surges
    const dx = speed * dt; this.score += dx / 10 * ScoreManager.multiplier(t) * (1 + Math.min(.5, this.combo * .04)); this.off += dx; AudioM.setIntensity(Math.min(1, t / 150));
    for (const m of MILES) if (t >= m && !this.miles.has(m)) { this.miles.add(m); this.milestone(m); }
    if (this.comboT > 0) { this.comboT -= dt; if (this.comboT <= 0) this.combo = 0; } this.vic = Math.max(0, this.vic - dt * .8);
    // --- gravity physics with floor/ceiling clamp ---
    this.vy += this.gdir * G * dt; this.py += this.vy * dt;
    const lo = FLOOR - HALF, hi = CEIL + HALF;
    if (this.py > lo) { this.py = lo; this.vy = 0; } if (this.py < hi) { this.py = hi; this.vy = 0; }
    const grounded = (this.py === lo && this.gdir === 1) || (this.py === hi && this.gdir === -1);
    if (grounded) this.rot += (Math.round(this.rot / (Math.PI / 2)) * Math.PI / 2 - this.rot) * Math.min(1, dt * 20); else this.rot += this.gdir * dt * 7;
    // --- hazards ---
    this.aic.py = this.py; this.aic.gdir = this.gdir; this.mgr.update(dt, t, speed, this.aic); this.fire.update(dt, this.mgr, this.aic);
    this.warning = this.mgr.robots.some(r => r.state === 'warn');
    const r = { x: PX - HALF + 4, y: this.py - HALF + 4, w: HALF * 2 - 8, h: HALF * 2 - 8 }; // identical hitbox for every character
    for (const o of this.mgr.obs) if (collides(o, r)) return this.die();
    const rb = this.mgr.hitsRobot(r); if (rb) return this.die(rb);
    // --- near misses ---
    for (const o of this.mgr.obs) {
      if (o.nm || o.dead || o.k === 'portal' || (o.k === 'rail' && !o.on)) continue; let gap;
      if (o.k === 'mover') { if (Math.abs(o.x + 16 - PX) > HALF + 21) continue; gap = Math.abs(o.y - Math.max(r.y, Math.min(o.y, r.y + r.h))) - 13; }
      else { const b = hitbox(o); if (!b || b.x > PX + HALF + 3 || b.x + b.w < PX - HALF - 3) continue; gap = b.y >= r.y + r.h ? b.y - (r.y + r.h) : r.y >= b.y + b.h ? r.y - (b.y + b.h) : 0; }
      if (gap > 0 && gap < 16) { o.nm = true; this.nearMiss(PX, this.py); }
    }
    for (const q of this.mgr.robots) if (!q.nm && q.lethal) { const d = Math.hypot(q.x - Math.max(r.x, Math.min(q.x, r.x + r.w)), q.y - Math.max(r.y, Math.min(q.y, r.y + r.h))) - q.r; if (d > 0 && d < 14) { q.nm = true; this.nearMiss(PX, this.py); } }
    // --- orbs ---
    for (const o of this.mgr.orbs) if (!o.got && Math.hypot(o.x - PX, o.y - this.py) < (o.rare ? HALF + 24 : HALF + 16)) {
      o.got = true;
      if (o.rare) { this.coins += 5; this.fire.addCharge(3); this.addCombo(2); AudioM.sfx('rare'); this.burst(o.x, o.y, 30, 0xFFD23F, 400); this.ring(o.x, o.y, 0xFFD23F, 160, .4); this.pop(o.x, o.y - 24, 'ENERGY  +5 ◆', '#FFD23F'); }
      else { this.coins++; this.fire.addCharge(.2); AudioM.sfx('coin'); this.burst(o.x, o.y, 10, C.cyan, 220); }
    }
    this.fl += (this.gdir - this.fl) * Math.min(1, dt * 18); this.trail.setPosition(PX - 10, this.py);
    if (this.skin.id === 'slime' && this.trail.setGravity) this.trail.setGravity(0, 900 * this.gdir);
    this.hint.setAlpha(Math.max(0, 1 - t / 3));
  }
  die(rb) {
    this.alive = false; this.deadT = 0; AudioM.sfx('death'); buzz([70, 40, 140]); const cam = this.cameras.main;
    cam.shake(rb ? 500 : 400, rb ? .022 : .014); cam.flash(180, 255, 51, 102); cam.zoomTo(1.12, 220); // impact punch
    this.trail.stop(); this.boom.explode(60, PX, this.py); this.burst(PX, this.py, 24, 0xffffff, 320); this.ring(PX, this.py, this.skin.c1, 520, .8); this.ring(PX, this.py, 0xFF3366, 340, .55);
    if (rb) { this.burst(rb.x, rb.y, 36, TYPE_COL[rb.type], 420); this.mgr.robots.splice(this.mgr.robots.indexOf(rb), 1); }
    this.deathFx();
    const score = Math.floor(this.score), coins = this.coins, newBest = ScoreManager.commit(score, coins);
    this.res = { score, coins, newBest, stage: this.stage, time: this.t, combo: this.maxCombo, kills: this.kills, near: this.nearCount };
  }
  deathFx() { // character-specific death: TITAN scatters armour plates, PHANTOM X shatters into glitch slices
    const id = this.skin.id, R = Math.random, add = (w, h, c, sp, gv, life) => this.shards.push({ x: PX, y: this.py, vx: (R() - .5) * sp, vy: (R() - .5) * sp, gv, rot: R() * 6, vr: (R() - .5) * 14, w, h, c, life });
    if (id === 'titan') { for (let i = 0; i < 12; i++) add(8 + R() * 9, 5 + R() * 7, i % 3 ? 0x1c2230 : 0x3B82F6, 800, 600, 1.3); this.burst(PX, this.py, 30, 0x3B82F6, 520); this.ring(PX, this.py, 0xBFE9FF, 380, .5); }
    else if (id === 'phantomx') { for (let i = 0; i < 14; i++) add(26, 2 + R() * 4, i % 2 ? 0xFF2BD6 : 0x7c3aed, 700, 0, 1); for (let i = 0; i < 20; i++) this.pfx(PX, this.py, (R() - .5) * 600, (R() - .5) * 600, .8, i % 2 ? 0x00F5FF : 0xFF2BD6, 3); }
    else for (let i = 0; i < 8; i++) add(5 + R() * 6, 5 + R() * 6, this.skin.c1, 700, 400, 1);
  }
  draw() {
    const ck = this.clock, g = this.g.clear(), A = THEME.accent; this.world.draw(this.bg, this.off, ck);
    g.fillStyle(A, .08).fillRect(0, FLOOR, W, H - FLOOR).fillRect(0, 0, W, CEIL);
    for (const y of [FLOOR, CEIL]) { g.lineStyle(10, A, .15).lineBetween(0, y, W, y); g.lineStyle(3, A, 1).lineBetween(0, y, W, y); }
    g.lineStyle(2, A, .4); for (let i = 0; i < 17; i++) { const x = (((i * 60 - this.off) % W) + W) % W; g.lineBetween(x, FLOOR + 6, x, FLOOR + 14); g.lineBetween(x, CEIL - 6, x, CEIL - 14); }
    if (this.speed > 520 && !QUALITY.low) { const len = 30 + this.speed * .05; g.lineStyle(1, 0xffffff, .08 + Math.min(.12, (this.speed - 520) / 2500)); for (let i = 0; i < 10; i++) { const x = (((i * 131 - this.off * 2.2) % (W + 100)) + W + 100) % (W + 100) - 50, y = 40 + (i * 97) % 440; g.lineBetween(x, y, x + len, y); } } // speed lines
    this.mgr.obs.forEach(o => drawObstacle(g, o, ck)); this.mgr.orbs.forEach(o => drawOrb(g, o.x, o.y, ck, o.rare));
    if (this.warning) g.fillStyle(0xFF3366, .05 + .05 * Math.sin(ck * 14)).fillRect(W - 90, 0, 90, H);
    this.mgr.robots.forEach(rb => drawWarning(g, rb, ck)); this.mgr.robots.forEach(rb => rb.draw(g, ck));
    for (const p of this.parts) g.fillStyle(p.c, Math.min(1, p.life)).fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
    this.fire.draw(g);
    for (const s of this.shards) { g.save(); g.translateCanvas(s.x, s.y); g.rotateCanvas(s.rot); g.fillStyle(s.c, Math.min(1, s.life * 1.5)).fillRect(-s.w / 2, -s.h / 2, s.w, s.h); g.restore(); }
    if (this.alive) drawChar(g, PX, this.py, this.skin, { t: ck, fl: this.fl, rot: this.rot, vy: this.vy, vic: this.vic });
    for (const r of this.rings) { const k = 1 - r.life / r.l0; g.lineStyle(4 * (1 - k) + 1, r.col, 1 - k).strokeCircle(r.x, r.y, r.max * (1 - (1 - k) * (1 - k))); }
    this.drawHud();
  }
  set(t, s) { if (t._v !== s) { t._v = s; t.setText(s); } }
  drawHud() {
    const g = this.hudG.clear(), A = THEME.accent, t = this.t; vignette(g);
    g.fillStyle(0x080818, .66).fillRoundedRect(14, 8, 236, 86, 10); g.lineStyle(2, A, .9).strokeRoundedRect(14, 8, 236, 86, 10); g.fillStyle(A, 1).fillRect(14, 20, 3, 36);
    const s = this.stage, t0 = STAGES[s].t, nx = STAGES[s + 1], k = nx ? Math.min(1, (t - t0) / (nx.t - t0)) : 1;
    g.fillStyle(0x222244, 1).fillRect(28, 80, 208, 6); g.fillStyle(A, 1).fillRect(28, 80, 208 * k, 6);
    g.fillStyle(0x080818, .66).fillRoundedRect(W - 196, 8, 182, 54, 10); g.lineStyle(2, 0x00F5FF, .9).strokeRoundedRect(W - 196, 8, 182, 54, 10);
    if (this.combo > 0) { g.fillStyle(0x080818, .66).fillRoundedRect(W / 2 - 90, 6, 180, 54, 10); g.lineStyle(2, 0xFFD23F, .9).strokeRoundedRect(W / 2 - 90, 6, 180, 54, 10); g.fillStyle(0xFFD23F, 1).fillRect(W / 2 - 80, 52, 160 * (this.comboT / 3.5), 4); }
    this.set(this.hudS, String(Math.floor(this.score))); this.set(this.hudC, '◆ ' + (Save.data.coins + this.coins)); this.set(this.hudB, 'BEST ' + Save.data.best + '   ' + Difficulty.name(t));
    this.set(this.hudM, this.combo > 0 ? 'COMBO x' + this.combo : ''); this.set(this.hudX, this.combo > 0 ? 'x' + (ScoreManager.multiplier(t) * (1 + Math.min(.5, this.combo * .04))).toFixed(1) + ' SCORE' : '');
    this.surgeT.setText(this.surgeOn ? 'SPEED SURGE!' : this.surgeWarn ? 'SURGE INCOMING' : '').setAlpha(this.surgeOn || this.surgeWarn ? .55 + .45 * Math.sin(this.clock * 16) : 0);
    const bx = 88, by = 446, ch = this.fire.charges, ready = ch >= 1; // fire button + charge ring
    g.fillStyle(0xFF5A1F, ready ? .28 : .08).fillCircle(bx, by, 34); g.lineStyle(3, ready ? 0xFF8A00 : 0x555577, 1).strokeCircle(bx, by, 30);
    g.fillStyle(ready ? 0xFF5A1F : 0x555577, 1).fillTriangle(bx - 9, by + 8, bx, by - 17, bx + 9, by + 8).fillCircle(bx, by + 7, 10); g.fillStyle(ready ? 0xFFD23F : 0x777799, 1).fillTriangle(bx - 4, by + 8, bx, by - 6, bx + 4, by + 8).fillCircle(bx, by + 8, 5);
    g.lineStyle(4, 0xFFD23F, .9).beginPath().arc(bx, by, 38, -Math.PI / 2, -Math.PI / 2 + ch / 3 * Math.PI * 2, false).strokePath();
  }
}
