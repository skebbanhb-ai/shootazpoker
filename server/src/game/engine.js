import { v4 as uuid } from 'uuid';
import { createFairnessCommitment } from '../services/fairness.js';
import { evaluatePlayers } from './handEvaluator.js';

export class PokerTable {
  constructor({ id = uuid(), mode = 'FREE_PLAY', smallBlind = 10, bigBlind = 20 } = {}) {
    Object.assign(this, { id, mode, smallBlind, bigBlind, players: [], community: [], pot: 0, stage: 'LOBBY', button: 0, turn: 0, deck: [], fairness: null, dealtDeck: [] });
  }
  addPlayer({ id, name, chips = 1000 }) { if (!this.players.some(p=>p.id===id)) this.players.push({ id, name, chips, cards: [], folded: false, currentBet: 0, xp: 0 }); }
  removePlayer(id){ this.players = this.players.filter(p=>p.id!==id); }
  startHand(clientSeed='client-seed') { if (this.players.length < 2) throw new Error('Need at least 2 players'); this.fairness = createFairnessCommitment(clientSeed); this.deck = [...this.fairness.deck]; this.dealtDeck = [...this.deck]; this.community=[]; this.pot=0; this.stage='PREFLOP'; this.players.forEach(p=>{p.cards=[this.deck.pop(),this.deck.pop()];p.folded=false;p.currentBet=0;}); this.postBlinds(); }
  postBlinds(){ const sb=this.players[(this.button+1)%this.players.length]; const bb=this.players[(this.button+2)%this.players.length]; this.takeBet(sb,this.smallBlind); this.takeBet(bb,this.bigBlind); this.turn=(this.button+3)%this.players.length; }
  takeBet(p, amount){ if(!p)return; const bet=Math.min(p.chips,Math.max(0,Number(amount)||0)); p.chips-=bet;p.currentBet+=bet;this.pot+=bet; }
  fold(id){ const p=this.players.find(x=>x.id===id); if(p)p.folded=true; this.nextTurn(); }
  check(){ this.nextTurn(); }
  call(id){ const p=this.players.find(x=>x.id===id); const max=Math.max(...this.players.map(x=>x.currentBet)); this.takeBet(p,max-p.currentBet); this.nextTurn(); }
  raise(id,amount){ const p=this.players.find(x=>x.id===id); this.takeBet(p,amount); this.nextTurn(); }
  nextTurn(){ if(!this.players.length)return; let guard=0; do { this.turn=(this.turn+1)%this.players.length; guard++; } while(this.players[this.turn]?.folded && guard<20); }
  dealNextStreet(){ if(this.stage==='PREFLOP'){this.community.push(this.deck.pop(),this.deck.pop(),this.deck.pop());this.stage='FLOP';} else if(this.stage==='FLOP'){this.community.push(this.deck.pop());this.stage='TURN';} else if(this.stage==='TURN'){this.community.push(this.deck.pop());this.stage='RIVER';} else if(this.stage==='RIVER'){return this.showdown();} this.players.forEach(p=>p.currentBet=0); }
  showdown(){ const active=this.players.filter(p=>!p.folded); const ranking=evaluatePlayers(active,this.community); const winner=this.players.find(p=>p.id===ranking[0].playerId); winner.chips+=this.pot; winner.xp+=100; this.pot=0; this.stage='COMPLETE'; this.button=(this.button+1)%this.players.length; return { ranking, winnerId:winner.id, winnerName:winner.name, fairnessReveal:{...this.fairness, dealtDeck:this.dealtDeck, deck:undefined} }; }
  publicState(forPlayerId){ return {...this, deck:undefined, fairness:this.fairness?{serverSeedHash:this.fairness.serverSeedHash,clientSeed:this.fairness.clientSeed,nonce:this.fairness.nonce}:null, players:this.players.map(p=>({...p,cards:p.id===forPlayerId||this.stage==='COMPLETE'?p.cards:['🂠','🂠']}))}; }
}
