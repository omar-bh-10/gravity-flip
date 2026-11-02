import { W, H, QUALITY } from './config.js';
import { AudioM } from './systems/AudioManager.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import SkinScene from './scenes/SkinScene.js';

// Phones: start in lite mode on weak devices (it also switches on automatically if the frame rate drops).
if (typeof navigator !== 'undefined') {
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && window.innerWidth < 1100);
  if (mobile && ((navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 3)) QUALITY.low = true;
}
// Browsers block audio until a user gesture. iOS only allows it from touchend/click, so listen to all of them.
['pointerdown', 'touchstart', 'touchend', 'click', 'keydown'].forEach(e => window.addEventListener(e, () => AudioM.unlock(), { passive: true }));
window.addEventListener('contextmenu', e => e.preventDefault()); // long-press / right-click must not open a menu (right-click = fire)
const start = () => {
  const game = new Phaser.Game({
    type: Phaser.AUTO, parent: 'game', width: W, height: H, backgroundColor: '#080812',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, // fills any phone/tablet/desktop screen, keeps 16:9
    input: { activePointers: 3, touch: { capture: true } }, render: { powerPreference: 'high-performance' }, fps: { target: 60 },
    scene: [MenuScene, GameScene, GameOverScene, SkinScene],
  });
  // pause everything when the app is backgrounded or the phone is held in portrait (a "rotate your phone" overlay is shown by CSS)
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => AudioM.suspend(document.hidden));
  if (typeof matchMedia === 'function' && game.loop) {
    const mq = matchMedia('(orientation: portrait) and (max-width: 900px)'), sync = () => { try { if (mq.matches) { game.loop.sleep(); AudioM.suspend(true); } else { game.loop.wake(); AudioM.suspend(false); } } catch (e) {} };
    if (mq.addEventListener) mq.addEventListener('change', sync); sync();
  }
};
// Wait (max 1.5s) for the Orbitron font so the first menu frame looks right.
Promise.race([document.fonts.load('700 20px Orbitron'), new Promise(r => setTimeout(r, 1500))]).then(start);
