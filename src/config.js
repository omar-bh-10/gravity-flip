export const W = 960, H = 540, FLOOR = H - 56, CEIL = 56, HALF = 17; // HALF = player half-size
export const F = 'Orbitron, sans-serif';
export const C = { bg: 0x080812, purple: 0xA855F7, blue: 0x3B82F6, cyan: 0x00F5FF, white: 0xFFFFFF, red: 0xFF3366 };
export const RARITY = {
  COMMON: { col: 0x94a3b8, hex: '#94a3b8' }, RARE: { col: 0x3B82F6, hex: '#3B82F6' },
  EPIC: { col: 0xA855F7, hex: '#A855F7' }, LEGENDARY: { col: 0xFFC800, hex: '#FFC800' },
};
// 8 characters. Each has its own silhouette + animation (objects/Player.js) and particle trail (objects/Trails.js).
// c1/c2 = main/accent colour (UI + particles). noflip: rotates instead of flipping upside-down on the ceiling.
export const SKINS = [
  { id: 'cyber', name: 'CYBER', rarity: 'COMMON', price: 0, c1: 0xA855F7, c2: 0xF0DBFF, noflip: true, blurb: 'Spinning purple data-cube with a pulsing core. Free for everyone.' },
  { id: 'volt', name: 'VOLT', rarity: 'RARE', price: 100, c1: 0x00F5FF, c2: 0xFFFFFF, blurb: 'Cyan combat robot. Piston legs, scanning visor, jittery electric trail.' },
  { id: 'slime', name: 'SLIME', rarity: 'COMMON', price: 50, c1: 0x39FF14, c2: 0xE8FFE0, blurb: 'Squishy neon blob that stretches mid-flip and leaves dripping goo.' },
  { id: 'inferno', name: 'INFERNO', rarity: 'RARE', price: 160, c1: 0xFF5A1F, c2: 0xFFD23F, blurb: 'A living fireball. Flickering flames and a rising ember trail.' },
  { id: 'aurum', name: 'AURUM', rarity: 'LEGENDARY', price: 500, c1: 0xFFC800, c2: 0xFFF5C2, blurb: 'Rotating golden gem with a travelling glint and a sparkling trail.' },
  { id: 'phantom', name: 'PHANTOM', rarity: 'EPIC', price: 250, c1: 0x9D6BFF, c2: 0xE9DDFF, blurb: 'Floating violet ghost. Bobs, waves and leaves a soft spectral mist.' },
  { id: 'thunder', name: 'THUNDER', rarity: 'EPIC', price: 350, c1: 0x4AA8FF, c2: 0xFFFFFF, blurb: 'A crackling lightning bolt that flickers and streaks across the screen.' },
  { id: 'glitch', name: 'GLITCH', rarity: 'LEGENDARY', price: 700, c1: 0xFF2BD6, c2: 0x00F5FF, noflip: true, blurb: 'Corrupted cube with RGB split, sliced rows and scattered pixel noise.' },
];
