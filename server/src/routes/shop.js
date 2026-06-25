import { Router } from 'express';
import {
  cosmeticsCatalog,
  equippedCosmetics,
  ensureUserCosmetics,
  purchases,
  userInventory,
  users,
} from '../stores/memoryStore.js';
import {
  assertCosmeticOnlyPurchase,
  COSMETIC_PURCHASE_DISCLOSURE,
  purchaseCannotAffectPrize,
} from '../services/guardrails.js';

export const shopRouter = Router();

const EQUIP_SLOTS = new Set(['cardBack', 'tableSkin', 'avatarFrame', 'badge', 'avatar', 'emote']);

export function groupCatalogByCategory(catalog = cosmeticsCatalog) {
  return catalog.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push({ ...item, affectsPrize: false });
    return acc;
  }, {});
}

export function getShopInventoryPayload(userId) {
  const { inventory, equipped } = ensureUserCosmetics(userId);
  const ownedItems = cosmeticsCatalog.filter((item) => inventory.includes(item.id));
  return {
    userId,
    ownedItemIds: inventory,
    equipped,
    ownedItems,
    disclosure: COSMETIC_PURCHASE_DISCLOSURE,
    guardrails: purchaseCannotAffectPrize(),
  };
}

shopRouter.get('/catalog', (_, res) => {
  res.json({
    categories: groupCatalogByCategory(),
    disclosure: COSMETIC_PURCHASE_DISCLOSURE,
    guardrails: purchaseCannotAffectPrize(),
  });
});

shopRouter.get('/inventory/:userId', (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: 'userId is required' });
  return res.json(getShopInventoryPayload(userId));
});

shopRouter.post('/purchase', (req, res) => {
  const { userId, itemId } = req.body || {};
  const item = cosmeticsCatalog.find((candidate) => candidate.id === itemId);
  const user = users.get(userId);
  if (!item || !userId) return res.status(404).json({ error: 'Item or user not found' });
  if (user) ensureUserCosmetics(userId);

  try {
    assertCosmeticOnlyPurchase(item);
  } catch (error) {
    return res.status(403).json({ error: error.message });
  }

  const { inventory } = ensureUserCosmetics(userId);
  const alreadyOwned = inventory.includes(itemId);

  if (!alreadyOwned) {
    inventory.push(itemId);
    purchases.push({
      userId,
      itemId,
      priceCents: Number(item.priceCents || 0),
      createdAt: new Date().toISOString(),
      affectsPrize: false,
      affectsLeaderboardScore: false,
      affectsPokerOutcomes: false,
      affectsPrizeEligibility: false,
      paymentMode: process.env.STRIPE_SECRET_KEY ? 'checkout-ready' : 'demo',
    });
  }

  if (item.grantsVip && user) {
    user.vip = true;
  }

  userInventory.set(userId, inventory);

  return res.json({
    ok: true,
    alreadyOwned,
    item,
    inventory: getShopInventoryPayload(userId),
    payment: {
      mode: process.env.STRIPE_SECRET_KEY ? 'checkout-ready' : 'demo',
      stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
    },
    disclosure: COSMETIC_PURCHASE_DISCLOSURE,
    guardrails: purchaseCannotAffectPrize(),
  });
});

shopRouter.post('/equip', (req, res) => {
  const { userId, itemId } = req.body || {};
  if (!userId || !itemId) return res.status(400).json({ error: 'userId and itemId are required' });

  const item = cosmeticsCatalog.find((candidate) => candidate.id === itemId);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  if (!EQUIP_SLOTS.has(item.slot)) return res.status(400).json({ error: 'Item cannot be equipped' });

  const { inventory, equipped } = ensureUserCosmetics(userId);
  if (!inventory.includes(itemId)) return res.status(403).json({ error: 'Item is not owned' });

  equipped[item.slot] = itemId;
  equippedCosmetics.set(userId, equipped);

  const user = users.get(userId);
  if (user && item.grantsVip) user.vip = true;

  return res.json({
    ok: true,
    equipped,
    inventory: getShopInventoryPayload(userId),
    disclosure: COSMETIC_PURCHASE_DISCLOSURE,
    guardrails: purchaseCannotAffectPrize(),
  });
});
