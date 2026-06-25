import { Router } from 'express';
import { users } from '../stores/memoryStore.js';
export const walletRouter = Router();
walletRouter.get('/free/:userId',(req,res)=>{ const u=users.get(req.params.userId); res.json({ userId:req.params.userId, freeChips:u?.freeChips ?? 1000, cashValueCents:0, withdrawable:false }); });
walletRouter.post('/cashout',(_,res)=>res.status(403).json({ error:'Free chips have no cash value and cannot be withdrawn.' }));
walletRouter.post('/rebuy',(_,res)=>res.status(403).json({ error:'Money-based rebuys are blocked. Use daily free chips or sponsor-granted free chips only.' }));
