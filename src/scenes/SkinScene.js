import { W, H, C, F, SKINS, RARITY } from '../config.js';
import { Save } from '../systems/SaveManager.js';
import { AudioM } from '../systems/AudioManager.js';
import { txt, btn, drawBg } from '../systems/UI.js';
import { drawChar } from '../objects/Player.js';
import { makeTextures } from '../objects/Trails.js';
// Character selection: big animated preview, name / rarity / price, equip or unlock, thumbnail strip.
export default class SkinScene extends Phaser.Scene {
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
