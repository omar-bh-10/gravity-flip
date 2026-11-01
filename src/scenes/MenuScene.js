import { W, H, C, SKINS } from '../config.js';
import { Save } from '../systems/SaveManager.js';
import { AudioM } from '../systems/AudioManager.js';
import { txt, btn, drawBg } from '../systems/UI.js';
import { drawChar } from '../objects/Player.js';
export default class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }
  create() {
    this.cameras.main.fadeIn(300);
    this.bg = this.add.graphics(); this.pg = this.add.graphics();
    const sh = txt(this, W / 2 + 4, 112, 'GRAVITY//FLIP', 68, '#A855F7', '#A855F7');
    txt(this, W / 2, 108, 'GRAVITY//FLIP', 68, '#ffffff', '#00F5FF');
    this.tweens.add({ targets: sh, x: W / 2 - 4, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    txt(this, W / 2, 168, 'FLIP  ·  SURVIVE  ·  COLLECT', 15, '#8b8bd0');
    txt(this, W / 2, 205, `BEST ${Math.floor(Save.data.best)}     ◆ ${Save.data.coins}`, 20, '#00F5FF', '#00F5FF');
    btn(this, W / 2, 268, 'PLAY', () => this.scene.start('Game'));
    btn(this, W / 2, 336, 'HOW TO PLAY', () => this.help(), 260, C.blue);
    btn(this, W / 2, 404, 'CHARACTERS', () => this.scene.start('Skin'), 260, C.purple);
    const sb = btn(this, W - 110, 40, '', () => { AudioM.toggle(); this.setLabel(sb); }, 180, C.purple);
    this.setLabel(sb);
    this.input.keyboard.on('keydown-SPACE', () => { if (!this.helpOpen) this.scene.start('Game'); });
  }
  setLabel(b) { b.label.setText('SOUND: ' + (Save.data.sound ? 'ON' : 'OFF')); }
  help() {
    this.helpOpen = true;
    const c = this.add.container(0, 0).setDepth(20);
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0, .85).setInteractive();
    const g = this.add.graphics().fillStyle(0x12122a, 1).fillRoundedRect(180, 70, 600, 400, 16).lineStyle(2, C.cyan, 1).strokeRoundedRect(180, 70, 600, 400, 16);
    const L = ['HOW TO PLAY', '', 'SPACE / CLICK / TAP  =  FLIP GRAVITY', '', 'Your cube runs automatically.', 'Flip between floor and ceiling', 'to dodge spikes, blocks and red orbs.', 'Collect ◆ orbs to unlock skins.', 'Survive longer for a bigger multiplier.', '', 'One hit = game over.'];
    const t = txt(this, W / 2, 255, L.join('\n'), 18, '#ffffff').setLineSpacing(8);
    const close = btn(this, W / 2, 430, 'CLOSE', () => { this.helpOpen = false; c.destroy(true); }, 200);
    c.add([dim, g, t, close]);
  }
  update(time) {
    drawBg(this.bg, time, time * .15);
    const g = this.pg.clear(), sk = SKINS[Save.data.skin];
    drawChar(g, 150, 300 + Math.sin(time / 500) * 18, sk, { t: time / 1000, rot: time / 400, sc: 1.6 });
    drawChar(g, W - 150, 300 - Math.sin(time / 500) * 18, sk, { t: time / 1000, rot: -time / 400, sc: 1.6, fl: -1 });
  }
}
