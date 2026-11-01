import { Save } from './SaveManager.js';
// Score = distance * multiplier (+0.5x every 20s survived, max 2.5x). Coins are banked on death.
export const ScoreManager = {
  multiplier(t) { return 1 + Math.min(3, Math.floor(t / 20)) * .5; },
  commit(score, coins) {
    const newBest = score > Save.data.best;
    if (newBest) Save.data.best = Math.floor(score);
    Save.data.coins += coins; Save.save();
    return newBest;
  },
};
