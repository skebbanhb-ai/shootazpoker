import { Router } from 'express';
import { purchases, users } from '../stores/memoryStore.js';
import { purchaseCannotAffectPrize } from '../services/guardrails.js';
export const shopRouter = Router();
const catalog=[
  { id:'gold-card-back', name:'Gold Card Back', type:'COSMETIC', priceCents:499 },
  { id:'founder-badge', name:'Founder Badge', type:'COSMETIC', priceCents:799 },
  { id:'vip-monthly', name:'VIP Monthly', type:'VIP', priceCents:999 },
  { id:'season-pass-1', name:'Season 1 Cosmetic Pass', type:'COSMETIC_PASS', priceCents:1999 }
];
shopRouter.get('/catalog',(_,res)=>res.json(catalog.map(i=>({...i, affectsPrize:false}))));
shopRouter.post('/purchase',(req,res)=>{ const { userId,itemId }=req.body; const item=catalog.find(i=>i.id===itemId); const user=users.get(userId); if(!item||!user)return res.status(404).json({error:'Item or user not found'}); purchases.push({ userId,itemId,priceCents:item.priceCents,createdAt:new Date().toISOString(),affectsPrize:false }); if(item.type==='VIP') user.vip=true; else user.cosmetics.push(item.id); res.json({ ok:true, item, user, prizeImpact:purchaseCannotAffectPrize() }); });
