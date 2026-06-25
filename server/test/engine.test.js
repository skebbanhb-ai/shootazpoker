import test from 'node:test';
import assert from 'node:assert/strict';
import { PokerTable } from '../src/game/engine.js';

function createHeadsUpTable() {
  const table = new PokerTable({ smallBlind: 10, bigBlind: 20 });
  table.addPlayer({ id: 'p1', name: 'Player 1', chips: 1000 });
  table.addPlayer({ id: 'p2', name: 'Player 2', chips: 1000 });
  table.startHand('seed');
  return table;
}

test('ignores call action from non-seated player', () => {
  const table = createHeadsUpTable();
  assert.doesNotThrow(() => table.call('ghost'));
  assert.equal(table.stage, 'PREFLOP');
});

test('awards pot and completes hand when one player remains after fold', () => {
  const table = createHeadsUpTable();
  const actorId = table.players[table.turn].id;
  const foldedId = actorId;
  const winner = table.players.find((player) => player.id !== foldedId);
  const winnerChipsBefore = winner.chips;

  const result = table.fold(actorId);

  assert.equal(table.stage, 'COMPLETE');
  assert.equal(table.pot, 0);
  assert.equal(winner.chips, winnerChipsBefore + 30);
  assert.equal(result?.winnerId, winner.id);
});

test('raise matches current bet and adds raise amount', () => {
  const table = createHeadsUpTable();
  const actor = table.players[table.turn];
  const actorBefore = actor.chips;
  const actorBetBefore = actor.currentBet;
  const maxBefore = Math.max(...table.players.map((player) => player.currentBet));

  table.raise(actor.id, 50);

  assert.equal(actor.currentBet, maxBefore + 50);
  assert.equal(actor.chips, actorBefore - (maxBefore - actorBetBefore + 50));
});
