import { v4 as uuid } from 'uuid';
import { createFairnessCommitment } from '../services/fairness.js';
import { evaluatePlayers } from './handEvaluator.js';

const HAND_STAGES = ['PREFLOP', 'FLOP', 'TURN', 'RIVER'];

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
      currentBetToCall: 0,
      lastRaiseAmount: 0,
      minimumRaise: bigBlind,
      actedThisRound: [],
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
    const removedIndex = this.players.findIndex((player) => player.id === id);
    this.players = this.players.filter((player) => player.id !== id);
    this.actedThisRound = this.actedThisRound.filter((playerId) => playerId !== id);

    if (!this.players.length) {
      this.turn = 0;
      return;
    }

    if (removedIndex >= 0 && this.turn >= this.players.length) {
      this.turn = this.turn % this.players.length;
    }

    if (this.isHandActive() && this.players[this.turn]?.folded) {
      this.turn = this.findNextEligibleIndex(this.turn);
    }
  }

  startHand(clientSeed = 'client-seed') {
    if (this.players.length < 2) throw new Error('Need at least 2 players');
    this.fairness = createFairnessCommitment(clientSeed);
    this.deck = [...this.fairness.deck];
    this.dealtDeck = [...this.deck];
    this.community = [];
    this.pot = 0;
    this.stage = 'PREFLOP';
    this.currentBetToCall = 0;
    this.lastRaiseAmount = this.bigBlind;
    this.minimumRaise = this.bigBlind;
    this.actedThisRound = [];

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
    this.currentBetToCall = Math.max(this.currentBetToCall, bigBlindPlayer?.currentBet || 0);
    this.turn = this.findNextEligibleIndex((this.button + 2) % this.players.length);
  }

  takeBet(player, amount) {
    if (!player) return 0;
    const bet = Math.min(player.chips, Math.max(0, Number(amount) || 0));
    player.chips -= bet;
    player.currentBet += bet;
    this.pot += bet;
    return bet;
  }

  fold(id) {
    if (!this.canAct(id)) return null;
    const player = this.players[this.turn];
    player.folded = true;
    this.markActed(player.id);

    const activePlayers = this.getActivePlayers();
    if (activePlayers.length === 1) {
      return this.endHandByFold(activePlayers[0]);
    }

    return this.advanceAfterAction();
  }

  check(id) {
    if (!this.canAct(id)) return null;
    const player = this.players[this.turn];
    if (player.currentBet !== this.currentBetToCall) return null;
    this.markActed(player.id);
    return this.advanceAfterAction();
  }

  call(id) {
    if (!this.canAct(id)) return null;
    const player = this.players[this.turn];
    const toCall = Math.max(0, this.currentBetToCall - player.currentBet);
    this.takeBet(player, toCall);
    this.markActed(player.id);
    return this.advanceAfterAction();
  }

  raise(id, raiseAmount) {
    if (!this.canAct(id)) return null;
    const player = this.players[this.turn];
    const parsedRaiseAmount = Number(raiseAmount);
    if (!Number.isFinite(parsedRaiseAmount) || parsedRaiseAmount <= 0) return null;

    const toCall = Math.max(0, this.currentBetToCall - player.currentBet);
    if (player.chips < toCall + parsedRaiseAmount) return null;
    if (parsedRaiseAmount < this.minimumRaise) return null;

    const previousBetToCall = this.currentBetToCall;
    this.takeBet(player, toCall + parsedRaiseAmount);

    const raiseDelta = Math.max(0, player.currentBet - previousBetToCall);
    this.currentBetToCall = player.currentBet;
    this.lastRaiseAmount = raiseDelta;
    this.minimumRaise = Math.max(this.bigBlind, this.lastRaiseAmount);
    this.actedThisRound = [player.id];

    return this.advanceAfterAction();
  }

  advanceAfterAction() {
    const activePlayers = this.getActivePlayers();
    if (activePlayers.length === 1) {
      return this.endHandByFold(activePlayers[0]);
    }

    if (this.isBettingRoundComplete()) {
      return this.dealNextStreet({ manual: false });
    }

    this.turn = this.findNextEligibleIndex(this.turn);
    return null;
  }

  nextTurn() {
    if (!this.players.length) return;
    this.turn = this.findNextEligibleIndex(this.turn);
  }

  dealNextStreet({ manual = true } = {}) {
    if (!this.isHandActive()) return null;

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

    this.startBettingRound();

    if (!manual && this.isBettingRoundComplete()) {
      return this.dealNextStreet({ manual: false });
    }

    return null;
  }

  showdown() {
    const activePlayers = this.getActivePlayers();
    if (!activePlayers.length) return null;
    const ranking = evaluatePlayers(activePlayers, this.community);
    const winner = this.players.find((player) => player.id === ranking[0].playerId);
    if (!winner) return null;

    winner.chips += this.pot;
    winner.xp += 100;
    this.pot = 0;
    this.stage = 'COMPLETE';
    this.button = (this.button + 1) % this.players.length;
    this.currentBetToCall = 0;
    this.lastRaiseAmount = 0;
    this.minimumRaise = this.bigBlind;
    this.actedThisRound = [];

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

  isHandActive() {
    return HAND_STAGES.includes(this.stage);
  }

  endHandByFold(winner) {
    if (!winner) return null;
    winner.chips += this.pot;
    winner.xp += 100;
    this.pot = 0;
    this.stage = 'COMPLETE';
    this.button = (this.button + 1) % this.players.length;
    this.currentBetToCall = 0;
    this.lastRaiseAmount = 0;
    this.minimumRaise = this.bigBlind;
    this.actedThisRound = [];

    return {
      ranking: [],
      winnerId: winner.id,
      winnerName: winner.name,
      fairnessReveal: this.fairness ? { ...this.fairness, dealtDeck: this.dealtDeck, deck: undefined } : null,
    };
  }

  startBettingRound() {
    this.players.forEach((player) => {
      player.currentBet = 0;
    });
    this.currentBetToCall = 0;
    this.lastRaiseAmount = 0;
    this.minimumRaise = this.bigBlind;
    this.actedThisRound = [];
    this.turn = this.findNextEligibleIndex(this.button);
  }

  isBettingRoundComplete() {
    if (!this.isHandActive()) return false;
    const activePlayers = this.getActivePlayers();
    if (activePlayers.length <= 1) return true;

    const actionablePlayers = activePlayers.filter((player) => player.chips > 0);
    const allActed = actionablePlayers.every((player) => this.actedThisRound.includes(player.id));
    const allMatched = activePlayers.every((player) => player.chips === 0 || player.currentBet === this.currentBetToCall);

    return allActed && allMatched;
  }

  getActivePlayers() {
    return this.players.filter((player) => !player.folded);
  }

  canAct(id) {
    if (!this.isHandActive()) return false;
    const current = this.players[this.turn];
    if (!current) return false;
    if (current.id !== id) return false;
    const player = this.players.find((candidate) => candidate.id === id);
    if (!player || player.folded || player.chips <= 0) return false;
    return true;
  }

  markActed(id) {
    if (!this.actedThisRound.includes(id)) {
      this.actedThisRound.push(id);
    }
  }

  findNextEligibleIndex(fromIndex) {
    if (!this.players.length) return 0;

    let guard = 0;
    let nextIndex = fromIndex;
    do {
      nextIndex = (nextIndex + 1) % this.players.length;
      guard += 1;
      const player = this.players[nextIndex];
      if (player && !player.folded && player.chips > 0) {
        return nextIndex;
      }
    } while (guard < this.players.length + 1);

    return fromIndex % this.players.length;
  }
}
