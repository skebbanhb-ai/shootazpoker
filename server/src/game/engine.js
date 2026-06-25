import { v4 as uuid } from 'uuid';
import { createFairnessCommitment } from '../services/fairness.js';
import { evaluatePlayers } from './handEvaluator.js';

export class PokerTable {
  constructor({ id = uuid(), mode = 'FREE_PLAY', smallBlind = 10, bigBlind = 20 } = {}) {
    Object.assign(this, {
      id,
      mode,
      smallBlind,
      bigBlind,
      players: [],
      community: [],
      pot: 0,
      stage: 'LOBBY',
      button: 0,
      turn: 0,
      deck: [],
      fairness: null,
      dealtDeck: [],
    });
  }

  addPlayer({
    id,
    name,
    chips = 1000,
    avatar = '🥇',
    avatarFrame = null,
    badge = null,
    cardBack = null,
    tableSkin = null,
    watch = null,
    chain = null,
    ring = null,
    vehicle = null,
    home = null,
    outfit = null,
    background = null,
    vip = false,
  }) {
    if (!this.players.some((player) => player.id === id)) {
      this.players.push({
        id,
        name,
        chips,
        cards: [],
        folded: false,
        currentBet: 0,
        xp: 0,
        avatar,
        avatarFrame,
        badge,
        cardBack,
        tableSkin,
        watch,
        chain,
        ring,
        vehicle,
        home,
        outfit,
        background,
        vip,
      });
    }
  }

  removePlayer(id) {
    this.players = this.players.filter((player) => player.id !== id);
  }

  startHand(clientSeed = 'client-seed') {
    if (this.players.length < 2) throw new Error('Need at least 2 players');
    this.fairness = createFairnessCommitment(clientSeed);
    this.deck = [...this.fairness.deck];
    this.dealtDeck = [...this.deck];
    this.community = [];
    this.pot = 0;
    this.stage = 'PREFLOP';
    this.players.forEach((player) => {
      player.cards = [this.deck.pop(), this.deck.pop()];
      player.folded = false;
      player.currentBet = 0;
    });
    this.postBlinds();
  }

  postBlinds() {
    const smallBlindPlayer = this.players[(this.button + 1) % this.players.length];
    const bigBlindPlayer = this.players[(this.button + 2) % this.players.length];
    this.takeBet(smallBlindPlayer, this.smallBlind);
    this.takeBet(bigBlindPlayer, this.bigBlind);
    this.turn = (this.button + 3) % this.players.length;
  }

  takeBet(player, amount) {
    if (!player) return;
    const bet = Math.min(player.chips, Math.max(0, Number(amount) || 0));
    player.chips -= bet;
    player.currentBet += bet;
    this.pot += bet;
  }

  fold(id) {
    const player = this.players.find((candidate) => candidate.id === id);
    if (player) player.folded = true;
    this.nextTurn();
  }

  check() {
    this.nextTurn();
  }

  call(id) {
    const player = this.players.find((candidate) => candidate.id === id);
    const maxBet = Math.max(...this.players.map((candidate) => candidate.currentBet));
    this.takeBet(player, maxBet - player.currentBet);
    this.nextTurn();
  }

  raise(id, amount) {
    const player = this.players.find((candidate) => candidate.id === id);
    this.takeBet(player, amount);
    this.nextTurn();
  }

  nextTurn() {
    if (!this.players.length) return;
    let guard = 0;
    do {
      this.turn = (this.turn + 1) % this.players.length;
      guard += 1;
    } while (this.players[this.turn]?.folded && guard < 20);
  }

  dealNextStreet() {
    if (this.stage === 'PREFLOP') {
      this.community.push(this.deck.pop(), this.deck.pop(), this.deck.pop());
      this.stage = 'FLOP';
    } else if (this.stage === 'FLOP') {
      this.community.push(this.deck.pop());
      this.stage = 'TURN';
    } else if (this.stage === 'TURN') {
      this.community.push(this.deck.pop());
      this.stage = 'RIVER';
    } else if (this.stage === 'RIVER') {
      return this.showdown();
    }
    this.players.forEach((player) => {
      player.currentBet = 0;
    });
  }

  showdown() {
    const activePlayers = this.players.filter((player) => !player.folded);
    const ranking = evaluatePlayers(activePlayers, this.community);
    const winner = this.players.find((player) => player.id === ranking[0].playerId);
    winner.chips += this.pot;
    winner.xp += 100;
    this.pot = 0;
    this.stage = 'COMPLETE';
    this.button = (this.button + 1) % this.players.length;
    return {
      ranking,
      winnerId: winner.id,
      winnerName: winner.name,
      fairnessReveal: { ...this.fairness, dealtDeck: this.dealtDeck, deck: undefined },
    };
  }

  publicState(forPlayerId) {
    return {
      ...this,
      deck: undefined,
      fairness: this.fairness
        ? {
            serverSeedHash: this.fairness.serverSeedHash,
            clientSeed: this.fairness.clientSeed,
            nonce: this.fairness.nonce,
          }
        : null,
      players: this.players.map((player) => ({
        ...player,
        cards: player.id === forPlayerId || this.stage === 'COMPLETE' ? player.cards : ['🂠', '🂠'],
      })),
    };
  }
}
