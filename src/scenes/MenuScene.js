import { W, H, C, SKINS, STAGES } from '../config.js';
import { Save } from '../systems/SaveManager.js';
import { AudioM } from '../systems/AudioManager.js';
import { txt, btn, vignette, go, fullscreen } from '../systems/UI.js';
import { World, css, PAL } from '../systems/World.js';
import { drawChar } from '../objects/Player.js';
export default class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }
  create() {
    this.cameras.main.fadeIn(350, 8, 8, 18); this.leaving = false; this.helpOpen = false; this.mt = 0; this.shown = -1;
    if (!this.world) this.world = new World(); this.world.reset(0); AudioM.setStage(0); AudioM.setIntensity(0);
    this.bg = this.add.graphics(); this.pg = this.add.graphics(); this.ov = this.add.graphics().setDepth(4);
    const a = txt(this, W / 2 + 5, 113, 'GRAVITY//FLIP', 68, '#FF2BD6', '#FF2BD6'), b = txt(this, W / 2 - 5, 113, 'GRAVITY//FLIP', 68, '#00F5FF', '#00F5FF'); // chromatic title
    txt(this, W / 2, 108, 'GRAVITY//FLIP', 68, '#ffffff', '#ffffff');
    this.tweens.add({ targets: a, x: W / 2 - 5, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.inOut' }); this.tweens.add({ targets: b, x: W / 2 + 5, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    txt(this, W / 2, 168, 'FLIP  ·  SURVIVE  ·  BURN', 15, '#c8c8f0');
    txt(this, W / 2, 205, `BEST ${Math.floor(Save.data.best)}     ◆ ${Save.data.coins}`, 20, '#00F5FF', '#00F5FF');
    btn(this, W / 2, 268, 'PLAY', () => go(this, 'Game'));
    btn(this, W / 2, 336, 'HOW TO PLAY', () => this.help(), 260, C.blue);
    btn(this, W / 2, 404, 'CHARACTERS', () => go(this, 'Skin'), 260, C.purple);
    const sb = btn(this, W - 110, 40, '', () => { AudioM.toggle(); this.setLabel(sb); }, 180, C.purple); this.setLabel(sb);
    if (typeof document !== 'undefined' && (document.fullscreenEnabled || document.webkitFullscreenEnabled)) btn(this, 110, 40, 'FULLSCREEN', () => fullscreen(), 180, C.blue);
    this.worldTag = txt(this, W / 2, H - 34, '', 13, '#c8c8f0'); txt(this, W / 2, H - 14, 'v7 · MOBILE READY · 5 WORLDS', 11, '#6b6b9a');
    this.input.keyboard.on('keydown-SPACE', () => { if (!this.helpOpen) go(this, 'Game'); });
  }
  setLabel(b) { b.label.setText('SOUND: ' + (Save.data.sound ? 'ON' : 'OFF')); }
  help() {
    this.helpOpen = true; const c = this.add.container(0, 0).setDepth(20), dim = this.add.rectangle(W / 2, H / 2, W, H, 0, .85).setInteractive();
    const g = this.add.graphics().fillStyle(0x12122a, 1).fillRoundedRect(180, 70, 600, 400, 16).lineStyle(2, C.cyan, 1).strokeRoundedRect(180, 70, 600, 400, 16);
    const L = ['HOW TO PLAY', '', 'TAP / CLICK / SPACE  =  FLIP GRAVITY', 'FIRE BUTTON / F / RIGHT-CLICK  =  FIREBALL', '', 'Dodge spikes, lasers, saws and hunting robots.', 'Burn robots, ice crates and explosive barrels.', 'Near misses and kills build your COMBO.', 'A new world every 30s - and the speed never stops rising!', '', 'One hit = game over.'];
    const t = txt(this, W / 2, 255, L.join('\n'), 15, '#ffffff').setLineSpacing(8);
    c.add([dim, g, t, btn(this, W / 2, 430, 'CLOSE', () => { this.helpOpen = false; c.destroy(true); }, 200)]);
  }
  update(time, delta) {
    const dt = delta / 1000; this.mt += dt * 5; const wt = this.mt % 150; // fast-forward through the five worlds as a live preview
    this.world.update(dt, wt, null); this.world.draw(this.bg, time * .25, time / 1000);
    if (this.world.stage !== this.shown) { this.shown = this.world.stage; this.worldTag.setText('WORLD ' + (this.shown + 1) + ' · ' + STAGES[this.shown].name).setColor(css(PAL[this.shown].glow)); }
    this.ov.clear(); vignette(this.ov);
    const g = this.pg.clear(), sk = SKINS[Save.data.skin], vic = Math.max(0, 1 - ((time / 1000) % 5) / 1.2);
    drawChar(g, 150, 300 + Math.sin(time / 500) * 18, sk, { t: time / 1000, rot: time / 400, sc: 1.6, vic });
    drawChar(g, W - 150, 300 - Math.sin(time / 500) * 18, sk, { t: time / 1000, rot: -time / 400, sc: 1.6, fl: -1, vic });
  }
}
