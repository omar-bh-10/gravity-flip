// Persistent data in LocalStorage (guarded: private mode / blocked storage must not crash the game).
import { SKINS } from '../config.js';
const KEY = 'gravityflip.v3';
export const Save = {
  data: { best: 0, coins: 0, owned: [0], skin: 0, sound: true },
  load() { try { Object.assign(this.data, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) {} SKINS.forEach((k, i) => { if (!k.price && !this.data.owned.includes(i)) this.data.owned.push(i); }); // free characters are always owned
    return this; },
  save() { try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) {} },
};
Save.load();
