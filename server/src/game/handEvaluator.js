const RANKS = '23456789TJQKA';
const value = c => RANKS.indexOf(c[0]) + 2;
const suit = c => c[1];
function combos(cards, k, start = 0, acc = [], out = []) { if (acc.length === k) { out.push([...acc]); return out; } for (let i=start;i<cards.length;i++) combos(cards,k,i+1,[...acc,cards[i]],out); return out; }
function evalFive(cards) {
  const vals = cards.map(value).sort((a,b)=>b-a); const counts = new Map(); vals.forEach(v=>counts.set(v,(counts.get(v)||0)+1));
  const groups = [...counts.entries()].sort((a,b)=>b[1]-a[1]||b[0]-a[0]); const flush = cards.every(c=>suit(c)===suit(cards[0]));
  const unique = [...new Set(vals)].sort((a,b)=>a-b); const wheel = JSON.stringify(unique) === JSON.stringify([2,3,4,5,14]);
  const straight = wheel || (unique.length===5 && unique[4]-unique[0]===4); const high = wheel ? 5 : unique[4];
  if (flush && straight && high===14) return { rank:9, name:'Royal Flush', tiebreakers:[14] };
  if (flush && straight) return { rank:8, name:'Straight Flush', tiebreakers:[high] };
  if (groups[0][1]===4) return { rank:7, name:'Four of a Kind', tiebreakers:[groups[0][0],groups[1][0]] };
  if (groups[0][1]===3 && groups[1][1]===2) return { rank:6, name:'Full House', tiebreakers:[groups[0][0],groups[1][0]] };
  if (flush) return { rank:5, name:'Flush', tiebreakers:vals };
  if (straight) return { rank:4, name:'Straight', tiebreakers:[high] };
  if (groups[0][1]===3) return { rank:3, name:'Three of a Kind', tiebreakers:[groups[0][0],...groups.slice(1).map(g=>g[0]).sort((a,b)=>b-a)] };
  if (groups[0][1]===2 && groups[1][1]===2) return { rank:2, name:'Two Pair', tiebreakers:[groups[0][0],groups[1][0],groups[2][0]] };
  if (groups[0][1]===2) return { rank:1, name:'Pair', tiebreakers:[groups[0][0],...groups.slice(1).map(g=>g[0]).sort((a,b)=>b-a)] };
  return { rank:0, name:'High Card', tiebreakers: vals };
}
export function compareHands(a,b){ if(a.rank!==b.rank)return a.rank-b.rank; for(let i=0;i<Math.max(a.tiebreakers.length,b.tiebreakers.length);i++){ if((a.tiebreakers[i]||0)!==(b.tiebreakers[i]||0)) return (a.tiebreakers[i]||0)-(b.tiebreakers[i]||0);} return 0; }
export function evaluateSeven(cards){ if(cards.length!==7) throw new Error('evaluateSeven requires 7 cards'); return combos(cards,5).map(evalFive).sort(compareHands).at(-1); }
export function evaluatePlayers(players, community){ return players.map(p=>({ playerId:p.id, name:p.name, result:evaluateSeven([...p.cards,...community]) })).sort((a,b)=>compareHands(b.result,a.result)); }
