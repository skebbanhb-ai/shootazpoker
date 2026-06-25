import { PokerTable } from '../game/engine.js';
import { verifyShuffle } from '../services/fairness.js';
const tables = new Map(); const main = new PokerTable({ id:'main-free', mode:'FREE_PLAY' }); tables.set(main.id,main);
export function createGameSocket(io){ io.on('connection',socket=>{
  socket.on('table:join',({tableId='main-free',name='Shooter'}={})=>{ const t=tables.get(tableId)||main; socket.join(t.id); t.addPlayer({id:socket.id,name}); emit(io,t); });
  socket.on('hand:start',({tableId='main-free',clientSeed=socket.id}={})=>{ const t=tables.get(tableId); try{t.startHand(clientSeed); emit(io,t);}catch(e){socket.emit('error:game',e.message);} });
  socket.on('action:fold',({tableId='main-free'}={})=>{ const t=tables.get(tableId); t?.fold(socket.id); emit(io,t); });
  socket.on('action:check',({tableId='main-free'}={})=>{ const t=tables.get(tableId); t?.check(); emit(io,t); });
  socket.on('action:call',({tableId='main-free'}={})=>{ const t=tables.get(tableId); t?.call(socket.id); emit(io,t); });
  socket.on('action:raise',({tableId='main-free',amount=20}={})=>{ const t=tables.get(tableId); t?.raise(socket.id,amount); emit(io,t); });
  socket.on('street:next',({tableId='main-free'}={})=>{ const t=tables.get(tableId); const result=t?.dealNextStreet(); emit(io,t); if(result)io.to(t.id).emit('hand:result',result); });
  socket.on('fairness:verify',(payload,cb=()=>{})=>cb({ok:verifyShuffle(payload)}));
  socket.on('disconnect',()=>{ for(const t of tables.values()){ t.removePlayer(socket.id); emit(io,t); } });
});}
function emit(io,t){ if(!t)return; for(const p of t.players) io.to(p.id).emit('table:update',t.publicState(p.id)); }
