import 'dotenv/config';
import http from 'node:http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { createGameSocket } from './sockets/gameSocket.js';
import { authRouter } from './routes/auth.js';
import { walletRouter } from './routes/wallet.js';
import { tournamentRouter } from './routes/tournaments.js';
import { leagueRouter } from './routes/leagues.js';
import { shopRouter } from './routes/shop.js';
import { paymentRouter } from './routes/payments.js';
import { adminRouter } from './routes/admin.js';

const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : [];

const app = express();
app.use(helmet());
app.use(cors({ origin: allowedOrigins.length > 0 ? allowedOrigins : false }));
app.use(express.json());

app.get('/health', (_, res) => res.json({ ok: true, app: 'ShootazPokerHouse Creator League API' }));
app.use('/auth', authRouter);
app.use('/wallet', walletRouter);
app.use('/tournaments', tournamentRouter);
app.use('/leagues', leagueRouter);
app.use('/shop', shopRouter);
app.use('/payments', paymentRouter);
app.use('/admin', adminRouter);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: allowedOrigins.length > 0 ? allowedOrigins : false } });

async function attachRedisAdapter() {
  if (!process.env.REDIS_URL) return;
  try {
    const pub = createClient({ url: process.env.REDIS_URL });
    const sub = pub.duplicate();
    await Promise.all([pub.connect(), sub.connect()]);
    io.adapter(createAdapter(pub, sub));
    console.log('Redis adapter enabled');
  } catch (err) {
    console.warn('Redis unavailable; using in-memory Socket.IO adapter:', err.message);
  }
}

await attachRedisAdapter();
createGameSocket(io);

const port = Number(process.env.PORT || 3000);
server.listen(port, () => console.log(`🔥 ShootazPokerHouse Creator League API running on ${port}`));
