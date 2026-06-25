import { Router } from 'express';
import { tournaments, users } from '../stores/memoryStore.js';
import { assertNoGamblingFlow } from '../services/guardrails.js';
export const tournamentRouter = Router();
tournamentRouter.get('/',(_,res)=>res.json([...tournaments.values()]));
tournamentRouter.post('/:id/enter',(req,res)=>{ const t=tournaments.get(req.params.id); if(!t)return res.status(404).json({error:'Tournament not found'}); try{ assertNoGamblingFlow(t); }catch(e){ return res.status(403).json({error:e.message}); } const userId=req.body.userId||`guest-${Date.now()}`; if(!t.entrants.includes(userId)) t.entrants.push(userId); res.json({ ok:true, tournament:t, disclosure:'No purchase necessary. Purchases do not improve chances of winning.' }); });
tournamentRouter.post('/:id/accept-rules',(req,res)=>{ const t=tournaments.get(req.params.id); const u=users.get(req.body.userId); if(!t||!u)return res.status(404).json({error:'Not found'}); u.rulesAccepted.push({ type:'TOURNAMENT', id:t.id, rulesVersion:t.rulesVersion, acceptedAt:new Date().toISOString() }); res.json({ok:true,user:u}); });
