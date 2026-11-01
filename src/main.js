import { W, H } from './config.js';
import { AudioM } from './systems/AudioManager.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import SkinScene from './scenes/SkinScene.js';

// Browsers block audio until a user gesture: unlock on the first interaction.
['pointerdown', 'keydown', 'touchstart'].forEach(e => window.addEventListener(e, () => AudioM.unlock(), { passive: true }));
const start = () => new Phaser.Game({
  type: Phaser.AUTO, parent: 'game', width: W, height: H, backgroundColor: '#080812',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { activePointers: 2 }, scene: [MenuScene, GameScene, GameOverScene, SkinScene],
});
// Wait (max 1.5s) for the Orbitron font so the first menu frame looks right.
Promise.race([document.fonts.load('700 20px Orbitron'), new Promise(r => setTimeout(r, 1500))]).then(start);
