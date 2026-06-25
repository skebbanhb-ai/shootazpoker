import { Router } from 'express';
import { tournaments, users } from '../stores/memoryStore.js';
import { assertNoGamblingFlow, COSMETIC_PURCHASE_DISCLOSURE } from '../services/guardrails.js';

export const tournamentRouter = Router();

tournamentRouter.get('/', (_, res) => res.json([...tournaments.values()]));

tournamentRouter.post('/:id/enter', (req, res) => {
  const tournament = tournaments.get(req.params.id);
  if (!tournament) return res.status(404).json({ error: 'Tournament not found' });

  try {
    assertNoGamblingFlow(tournament);
  } catch (error) {
    return res.status(403).json({ error: error.message });
  }

  const userId = req.body.userId || `guest-${Date.now()}`;
  if (!tournament.entrants.includes(userId)) tournament.entrants.push(userId);

  return res.json({
    ok: true,
    tournament,
    disclosure: `No purchase necessary. ${COSMETIC_PURCHASE_DISCLOSURE}`,
  });
});

tournamentRouter.post('/:id/accept-rules', (req, res) => {
  const tournament = tournaments.get(req.params.id);
  const user = users.get(req.body.userId);
  if (!tournament || !user) return res.status(404).json({ error: 'Not found' });

  user.rulesAccepted.push({
    type: 'TOURNAMENT',
    id: tournament.id,
    rulesVersion: tournament.rulesVersion,
    acceptedAt: new Date().toISOString(),
  });

  return res.json({ ok: true, user });
});
