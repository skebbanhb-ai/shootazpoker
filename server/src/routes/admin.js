import { Router } from 'express';
import { sponsors, tournaments, leagues, purchases, newId } from '../stores/memoryStore.js';
import { assertNoGamblingFlow } from '../services/guardrails.js';
export const adminRouter = Router();
adminRouter.get('/dashboard',(_,res)=>res.json({ sponsors:[...sponsors.values()], tournaments:[...tournaments.values()], leagues:[...leagues.values()], cosmeticRevenueCents:purchases.reduce((s,p)=>s+p.priceCents,0) }));
adminRouter.post('/sponsors',(req,res)=>{ const id=newId('sponsor'); const sponsor={ id, name:req.body.name, status:'ACTIVE', budgetCents:Number(req.body.budgetCents||0) }; sponsors.set(id,sponsor); res.json({ok:true,sponsor}); });
adminRouter.post('/tournaments',(req,res)=>{ const id=newId('tour'); const t={ id, entrants:[], status:'OPEN', rulesVersion:'2026.1', entryFeeCents:0, rebuyCents:0, usesPlayerFunds:false, allowsChipCashout:false, ...req.body, id }; try{ assertNoGamblingFlow(t); }catch(e){ return res.status(403).json({error:e.message}); } tournaments.set(id,t); res.json({ok:true,tournament:t}); });
adminRouter.post('/leagues',(req,res)=>{ const id=newId('league'); const l={ id, members:[], status:'OPEN', prizeSource:'SPONSOR', ...req.body, id }; leagues.set(id,l); res.json({ok:true,league:l}); });
