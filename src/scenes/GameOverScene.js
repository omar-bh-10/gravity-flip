import { W, C } from '../config.js';
import { Save } from '../systems/SaveManager.js';
import { Ads } from '../systems/Ads.js';
import { txt, btn, drawBg } from '../systems/UI.js';
export default class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }
  init(d) { this.r = d; }
  create() {
    const r = this.r; this.cameras.main.fadeIn(300);
    this.bg = this.add.graphics();
    Ads.interstitial(); // no-op hook; a rewarded "revive" button would also go here (see Ads.js)
    const t = txt(this, W / 2, 85, 'GAME OVER', 64, '#FF3366', '#FF3366').setScale(.2);
    this.tweens.add({ targets: t, scale: 1, duration: 450, ease: 'Back.out' });
    const sc = txt(this, W / 2, 175, 'SCORE 0', 38, '#ffffff', '#00F5FF');
    this.tweens.addCounter({ from: 0, to: r.score, duration: 900, onUpdate: c => sc.setText('SCORE ' + Math.floor(c.getValue())) });
    if (r.newBest) this.tweens.add({ targets: txt(this, W / 2, 222, '★ NEW BEST ★', 22, '#FFC800', '#FFC800'), alpha: .3, duration: 400, yoyo: true, repeat: -1 });
    else txt(this, W / 2, 222, 'BEST ' + Save.data.best, 20, '#A855F7');
    txt(this, W / 2, 262, `◆ +${r.coins}      TOTAL ◆ ${Save.data.coins}`, 18, '#00F5FF');
    btn(this, W / 2, 340, 'PLAY AGAIN', () => this.scene.start('Game'));
    btn(this, W / 2, 410, 'MAIN MENU', () => this.scene.start('Menu'), 260, C.purple);
    this.time.delayedCall(450, () => { // short delay avoids an accidental instant restart
      const go = () => this.scene.start('Game');
      this.input.keyboard.on('keydown-SPACE', go); this.input.keyboard.on('keydown-ENTER', go);
    });
  }
  update(time) { drawBg(this.bg, time, time * .05); }
}
