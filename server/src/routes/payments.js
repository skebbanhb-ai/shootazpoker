import { Router } from 'express';
import Stripe from 'stripe';
import { cosmeticsCatalog, ensureUserCosmetics } from '../stores/memoryStore.js';
import { COSMETIC_PURCHASE_DISCLOSURE, assertCosmeticOnlyPurchase } from '../services/guardrails.js';

export const paymentRouter = Router();

const ALLOWED_CATEGORIES = new Set([
  'cardBacks',
  'tableSkins',
  'avatarFrames',
  'profileBadges',
  'emotes',
  'vipMembership',
  'avatars',
]);

function isStripeConfigured(secretKey) {
  if (!secretKey) return false;
  const normalized = secretKey.trim();
  if (!normalized) return false;
  if (/replace_me|placeholder|changeme|your_key_here/i.test(normalized)) return false;
  if (normalized.startsWith('sk_test_replace') || normalized.startsWith('sk_live_replace')) return false;
  return normalized.startsWith('sk_test_') || normalized.startsWith('sk_live_');
}

function buildPublicBaseUrl() {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL;
  if (process.env.CLIENT_ORIGIN) {
    const firstOrigin = process.env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim()).find(Boolean);
    if (firstOrigin) return firstOrigin;
  }
  return 'http://localhost:5173';
}

function validateCosmeticItem(item) {
  assertCosmeticOnlyPurchase(item);
  if (!ALLOWED_CATEGORIES.has(item.category)) {
    throw new Error('Only cosmetic/VIP shop items are allowed.');
  }
  if (Number(item.priceCents || 0) <= 0) {
    throw new Error('This item is free and does not require checkout.');
  }
}

paymentRouter.post('/checkout/cosmetic', async (req, res) => {
  const { userId, itemId, bundleId } = req.body || {};
  const targetId = itemId || bundleId;
  if (!userId || !targetId) {
    return res.status(400).json({ error: 'userId and itemId (or bundleId) are required' });
  }

  const item = cosmeticsCatalog.find((candidate) => candidate.id === targetId);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  try {
    validateCosmeticItem(item);
  } catch (error) {
    return res.status(403).json({ error: error.message });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!isStripeConfigured(secretKey)) {
    return res
      .status(503)
      .json({ error: 'Checkout is not configured yet. Please try again later.' });
  }

  try {
    ensureUserCosmetics(userId);

    const stripe = new Stripe(secretKey, { apiVersion: '2025-02-24.acacia' });
    const baseUrl = buildPublicBaseUrl();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: Number(item.priceCents),
            product_data: {
              name: item.name,
              description: COSMETIC_PURCHASE_DISCLOSURE,
              metadata: {
                itemId: item.id,
                category: item.category,
                purchaseType: 'cosmetic',
              },
            },
          },
        },
      ],
      metadata: {
        userId,
        itemId: targetId,
        purchaseType: 'cosmetic',
        affectsGameplay: 'false',
        affectsOdds: 'false',
        affectsRankings: 'false',
        affectsTournamentOutcomes: 'false',
        affectsPrizeEligibility: 'false',
      },
      success_url: `${baseUrl}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}?payment=cancelled`,
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout creation failed:', error);
    return res.status(500).json({ error: 'Unable to create checkout session right now.' });
  }
});
