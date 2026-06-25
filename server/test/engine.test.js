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

function createThreePlayerTable() {
  const table = new PokerTable({ smallBlind: 10, bigBlind: 20 });
  table.addPlayer({ id: 'p1', name: 'Player 1', chips: 1000 });
  table.addPlayer({ id: 'p2', name: 'Player 2', chips: 1000 });
  table.addPlayer({ id: 'p3', name: 'Player 3', chips: 1000 });
  table.startHand('seed');
  return table;
}

test('non-current player action is ignored', () => {
  const table = createHeadsUpTable();
  const currentId = table.players[table.turn].id;
  const nonCurrentId = table.players.find((player) => player.id !== currentId).id;
  const snapshot = {
    turn: table.turn,
    pot: table.pot,
    currentBetToCall: table.currentBetToCall,
    bets: table.players.map((player) => player.currentBet),
  };

  table.call(nonCurrentId);

  assert.equal(table.turn, snapshot.turn);
  assert.equal(table.pot, snapshot.pot);
  assert.equal(table.currentBetToCall, snapshot.currentBetToCall);
  assert.deepEqual(
    table.players.map((player) => player.currentBet),
    snapshot.bets,
  );
});

test('ghost player action is ignored', () => {
  const table = createHeadsUpTable();
  const snapshot = {
    turn: table.turn,
    stage: table.stage,
    pot: table.pot,
  };

  table.call('ghost');

  assert.equal(table.turn, snapshot.turn);
  assert.equal(table.stage, snapshot.stage);
  assert.equal(table.pot, snapshot.pot);
});

test('cannot check while facing a bet', () => {
  const table = createHeadsUpTable();
  const actor = table.players[table.turn];
  const beforeBet = actor.currentBet;
  const beforeTurn = table.turn;

  table.check(actor.id);

  assert.equal(table.turn, beforeTurn);
  assert.equal(actor.currentBet, beforeBet);
  assert.equal(table.currentBetToCall, 20);
});

test('current player can call the big blind', () => {
  const table = createHeadsUpTable();
  const actor = table.players[table.turn];

  table.call(actor.id);

  assert.equal(actor.currentBet, 20);
  assert.equal(table.currentBetToCall, 20);
  assert.notEqual(table.players[table.turn].id, actor.id);
});

test('raise must meet minimum raise amount', () => {
  const table = createHeadsUpTable();
  const actor = table.players[table.turn];
  const actorChips = actor.chips;

  table.raise(actor.id, 5);

  assert.equal(actor.chips, actorChips);
  assert.equal(actor.currentBet, 10);
  assert.equal(table.currentBetToCall, 20);
  assert.equal(table.minimumRaise, 20);
});

test('valid raise updates bet, pot, and turn', () => {
  const table = createHeadsUpTable();
  const actor = table.players[table.turn];
  const chipsBefore = actor.chips;
  const potBefore = table.pot;

  table.raise(actor.id, 20);

  assert.equal(actor.currentBet, 40);
  assert.equal(actor.chips, chipsBefore - 30);
  assert.equal(table.pot, potBefore + 30);
  assert.equal(table.currentBetToCall, 40);
  assert.equal(table.minimumRaise, 20);
  assert.notEqual(table.players[table.turn].id, actor.id);
});

test('awards pot and completes hand when one player remains after fold', () => {
  const table = createHeadsUpTable();
  const actorId = table.players[table.turn].id;
  const winner = table.players.find((player) => player.id !== actorId);
  const winnerChipsBefore = winner.chips;

  const result = table.fold(actorId);

  assert.equal(table.stage, 'COMPLETE');
  assert.equal(table.pot, 0);
  assert.equal(winner.chips, winnerChipsBefore + 30);
  assert.equal(result?.winnerId, winner.id);
});

test('betting round advances after all active players act and match', () => {
  const table = createThreePlayerTable();

  table.call('p1');
  table.call('p2');
  table.check('p3');

  assert.equal(table.stage, 'FLOP');
  assert.equal(table.community.length, 3);
  assert.equal(table.currentBetToCall, 0);
  assert.deepEqual(
    table.players.map((player) => player.currentBet),
    [0, 0, 0],
  );
});

test('showdown awards pot to winner', () => {
  const table = createHeadsUpTable();
  const p1 = table.players.find((player) => player.id === 'p1');
  const p2 = table.players.find((player) => player.id === 'p2');

  // This directly sets a deterministic river board to verify payout correctness.
  table.stage = 'RIVER';
  table.community = ['2H', '3H', '4H', '5H', '6C'];
  p1.cards = ['AH', 'KH'];
  p2.cards = ['7C', '7D'];
  p1.folded = false;
  p2.folded = false;
  table.pot = 200;
  const p1ChipsBefore = p1.chips;

  const result = table.showdown();

  assert.equal(table.stage, 'COMPLETE');
  assert.equal(table.pot, 0);
  assert.equal(result?.winnerId, p1.id);
  assert.equal(p1.chips, p1ChipsBefore + 200);
});
