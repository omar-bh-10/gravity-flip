// Monetization hooks. Everything is a no-op so the game is 100% free/playable today.
// Later: plug an ad SDK into rewarded()/interstitial(), set enabled=true, and offer a
// "revive once" button in GameOverScene when Ads.canRevive(). `removed` = "remove ads" purchase flag.
export const Ads = {
  enabled: false, removed: false,
  canRevive() { return this.enabled && !this.removed; },
  async rewarded() { return false; },      // resolve true when the player finished watching
  async interstitial() { /* call between sessions, never mid-run */ },
};
