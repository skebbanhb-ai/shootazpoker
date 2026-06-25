import { Router } from 'express';
import { cosmeticsCatalog, leagues, newId, purchases, sponsors, tournaments } from '../stores/memoryStore.js';
import { assertNoGamblingFlow, COSMETIC_PURCHASE_DISCLOSURE } from '../services/guardrails.js';

export const adminRouter = Router();

adminRouter.get('/dashboard', (_, res) =>
  res.json({
    sponsors: [...sponsors.values()],
    tournaments: [...tournaments.values()],
    leagues: [...leagues.values()],
    shopCatalogSize: cosmeticsCatalog.length,
    cosmeticRevenueCents: purchases.reduce((sum, purchase) => sum + purchase.priceCents, 0),
    disclosure: COSMETIC_PURCHASE_DISCLOSURE,
  }),
);

adminRouter.post('/sponsors', (req, res) => {
  const id = newId('sponsor');
  const sponsor = {
    id,
    name: req.body.name,
    status: 'ACTIVE',
    budgetCents: Number(req.body.budgetCents || 0),
  };
  sponsors.set(id, sponsor);
  res.json({ ok: true, sponsor });
});

adminRouter.post('/tournaments', (req, res) => {
  const id = newId('tour');
  const { id: _, entrants: __, ...body } = req.body;
  const tournament = {
    id,
    entrants: [],
    status: 'OPEN',
    rulesVersion: '2026.1',
    entryFeeCents: 0,
    rebuyCents: 0,
    usesPlayerFunds: false,
    allowsChipCashout: false,
    ...body,
  };

  try {
    assertNoGamblingFlow(tournament);
  } catch (error) {
    return res.status(403).json({ error: error.message });
  }

  tournaments.set(id, tournament);
  return res.json({ ok: true, tournament });
});

adminRouter.post('/leagues', (req, res) => {
  const id = newId('league');
  const { id: _, ...body } = req.body;
  const league = { id, members: [], status: 'OPEN', prizeSource: 'SPONSOR', ...body };
  leagues.set(id, league);
  res.json({ ok: true, league });
});
