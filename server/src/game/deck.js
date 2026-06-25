import crypto from 'node:crypto';
export const SUITS = ['H', 'D', 'C', 'S'];
export const RANKS = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'];
export function createDeck() { return SUITS.flatMap(s => RANKS.map(r => `${r}${s}`)); }
export function deterministicShuffle(deck, seedMaterial) {
  const copy = [...deck]; let counter = 0;
  const rand = max => crypto.createHash('sha256').update(`${seedMaterial}:${counter++}`).digest().readUInt32BE(0) % max;
  for (let i = copy.length - 1; i > 0; i--) { const j = rand(i + 1); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy;
}
