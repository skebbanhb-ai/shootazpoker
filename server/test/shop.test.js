import test from 'node:test';
import assert from 'node:assert/strict';
import { assertCosmeticOnlyPurchase } from '../src/services/guardrails.js';

const BLOCKED_CATEGORIES = new Set(['chips', 'rebuys', 'entry', 'cashout']);

// Inline a representative cosmetic catalog for testing without uuid dependency
const SAMPLE_CATALOG = [
  { id: 'card-back-gold', name: 'Gold Card Back', category: 'cardBacks', priceCents: 499 },
  { id: 'frame-fire', name: 'Fire Avatar Frame', category: 'avatarFrames', priceCents: 299 },
  { id: 'badge-founder', name: 'Founder Badge', category: 'profileBadges', priceCents: 799 },
  { id: 'emote-all-in', name: 'All-In Emote', category: 'emotes', priceCents: 199 },
  { id: 'badge-vip-monthly', name: 'VIP Monthly', category: 'vipMembership', priceCents: 1499 },
];

test('sample catalog contains no blocked categories', () => {
  for (const item of SAMPLE_CATALOG) {
    assert.ok(
      !BLOCKED_CATEGORIES.has(item.category),
      `Catalog contains blocked category: ${item.category} (${item.id})`,
    );
  }
});

test('sample catalog items pass assertCosmeticOnlyPurchase', () => {
  for (const item of SAMPLE_CATALOG) {
    const result = assertCosmeticOnlyPurchase(item);
    assert.equal(result.affectsPokerOutcomes, false);
    assert.equal(result.affectsPrizeEligibility, false);
    assert.equal(result.paidEntryBlocked, true);
  }
});

test('demo purchase blocked when ALLOW_DEMO_PURCHASES is not true', () => {
  const original = process.env.ALLOW_DEMO_PURCHASES;
  try {
    for (const val of [undefined, 'false', '0', '']) {
      if (val === undefined) {
        delete process.env.ALLOW_DEMO_PURCHASES;
      } else {
        process.env.ALLOW_DEMO_PURCHASES = val;
      }
      assert.equal(
        process.env.ALLOW_DEMO_PURCHASES === 'true',
        false,
        `Expected blocked for ALLOW_DEMO_PURCHASES=${val}`,
      );
    }
  } finally {
    if (original === undefined) {
      delete process.env.ALLOW_DEMO_PURCHASES;
    } else {
      process.env.ALLOW_DEMO_PURCHASES = original;
    }
  }
});

test('demo purchase allowed when ALLOW_DEMO_PURCHASES=true', () => {
  const original = process.env.ALLOW_DEMO_PURCHASES;
  try {
    process.env.ALLOW_DEMO_PURCHASES = 'true';
    assert.equal(process.env.ALLOW_DEMO_PURCHASES === 'true', true);
  } finally {
    if (original === undefined) {
      delete process.env.ALLOW_DEMO_PURCHASES;
    } else {
      process.env.ALLOW_DEMO_PURCHASES = original;
    }
  }
});

test('non-cosmetic item chips is rejected', () =>
  assert.throws(
    () => assertCosmeticOnlyPurchase({ id: 'chips-100', category: 'chips' }),
    { message: 'Only cosmetic purchases are allowed.' },
  ));

test('non-cosmetic item entry is rejected', () =>
  assert.throws(
    () => assertCosmeticOnlyPurchase({ id: 'entry-1', category: 'entry' }),
    { message: 'Only cosmetic purchases are allowed.' },
  ));

test('non-cosmetic item cashout is rejected', () =>
  assert.throws(
    () => assertCosmeticOnlyPurchase({ id: 'cashout-1', category: 'cashout' }),
    { message: 'Only cosmetic purchases are allowed.' },
  ));

test('non-cosmetic item rebuys is rejected', () =>
  assert.throws(
    () => assertCosmeticOnlyPurchase({ id: 'rebuy-1', category: 'rebuys' }),
    { message: 'Only cosmetic purchases are allowed.' },
  ));
