import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { users } from '../stores/memoryStore.js';
export const authRouter = Router();
authRouter.post('/demo-login', (req,res)=>{ const { name='Shooter' }=req.body||{}; const user={ id:`demo-${Date.now()}`, name, freeChips:1000, vip:false, cosmetics:['starter-card-back'], rulesAccepted:[] }; users.set(user.id,user); const token=jwt.sign(user,process.env.JWT_SECRET||'dev',{expiresIn:'2h'}); res.json({token,user}); });
