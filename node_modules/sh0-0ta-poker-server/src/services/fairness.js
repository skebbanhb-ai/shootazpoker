import crypto from 'node:crypto';
import { createDeck, deterministicShuffle } from '../game/deck.js';
export const sha256 = v => crypto.createHash('sha256').update(v).digest('hex');
export function createFairnessCommitment(clientSeed = 'client-seed', nonce = Date.now()) {
  const serverSeed = crypto.randomBytes(32).toString('hex');
  const serverSeedHash = sha256(serverSeed);
  const deck = deterministicShuffle(createDeck(), `${serverSeed}:${clientSeed}:${nonce}`);
  return { serverSeed, serverSeedHash, clientSeed, nonce, deck };
}
export function verifyShuffle({ serverSeed, serverSeedHash, clientSeed, nonce, dealtDeck }) {
  return sha256(serverSeed) === serverSeedHash && JSON.stringify(deterministicShuffle(createDeck(), `${serverSeed}:${clientSeed}:${nonce}`)) === JSON.stringify(dealtDeck);
}
