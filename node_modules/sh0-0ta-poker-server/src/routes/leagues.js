import { Router } from 'express';
import { leagues, leaderboards } from '../stores/memoryStore.js';
import { COSMETIC_PURCHASE_DISCLOSURE } from '../services/guardrails.js';

export const leagueRouter = Router();

leagueRouter.get('/', (_, res) => res.json([...leagues.values()]));

leagueRouter.post('/:id/join', (req, res) => {
  const league = leagues.get(req.params.id);
  if (!league) return res.status(404).json({ error: 'League not found' });

  const userId = req.body.userId || `guest-${Date.now()}`;
  if (!league.members.includes(userId)) league.members.push(userId);

  const board = leaderboards.get(league.id) || [];
  if (!board.some((entry) => entry.userId === userId)) {
    board.push({ userId, name: req.body.name || 'Shooter', xp: 0, wins: 0 });
  }
  leaderboards.set(league.id, board);

  return res.json({ ok: true, league, disclosure: COSMETIC_PURCHASE_DISCLOSURE });
});

leagueRouter.get('/:id/leaderboard', (req, res) =>
  res.json((leaderboards.get(req.params.id) || []).sort((a, b) => b.xp - a.xp)),
);

leagueRouter.post('/:id/score', (req, res) => {
  const board = leaderboards.get(req.params.id) || [];
  const row = board.find((entry) => entry.userId === req.body.userId) || {
    userId: req.body.userId,
    name: req.body.name || 'Shooter',
    xp: 0,
    wins: 0,
  };

  row.xp += Number(req.body.xp || 0);
  row.wins += Number(req.body.wins || 0);

  if (!board.includes(row)) board.push(row);
  leaderboards.set(req.params.id, board);

  return res.json({ ok: true, leaderboard: board.sort((a, b) => b.xp - a.xp) });
});
