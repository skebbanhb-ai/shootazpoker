import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import { assertCosmeticOnlyPurchase } from '../src/services/guardrails.js';
import { shopRouter } from '../src/routes/shop.js';
import { users } from '../src/stores/memoryStore.js';

const BLOCKED_CATEGORIES = new Set(['chips', 'rebuys', 'entry', 'cashout']);

// Inline a representative cosmetic catalog for testing without uuid dependency
const SAMPLE_CATALOG = [
  { id: 'card-back-gold', name: 'Gold Card Back', category: 'cardBacks', priceCents: 499 },
  { id: 'frame-fire', name: 'Fire Avatar Frame', category: 'avatarFrames', priceCents: 299 },
  { id: 'badge-founder', name: 'Founder Badge', category: 'profileBadges', priceCents: 799 },
  { id: 'emote-all-in', name: 'All-In Emote', category: 'emotes', priceCents: 199 },
  { id: 'badge-vip-monthly', name: 'VIP Monthly', category: 'vipMembership', priceCents: 1499 },
];

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/shop', shopRouter);
  return app;
}

async function testRequest(app, method, path, body) {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const json = await res.json();
    return { status: res.status, body: json };
  } finally {
    if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
}

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

test('POST /shop/purchase returns 403 when ALLOW_DEMO_PURCHASES is not true', async () => {
  const original = process.env.ALLOW_DEMO_PURCHASES;
  const testUserId = 'user-test-blocked';
  users.set(testUserId, { id: testUserId, username: 'testuser-blocked' });
  try {
    for (const val of [undefined, 'false', '0', '']) {
      if (val === undefined) {
        delete process.env.ALLOW_DEMO_PURCHASES;
      } else {
        process.env.ALLOW_DEMO_PURCHASES = val;
      }
      const app = createTestApp();
      const { status } = await testRequest(app, 'POST', '/shop/purchase', {
        userId: testUserId,
        itemId: 'card-back-gold',
      });
      assert.equal(status, 403, `Expected 403 for ALLOW_DEMO_PURCHASES=${val}`);
    }
  } finally {
    users.delete(testUserId);
    if (original === undefined) {
      delete process.env.ALLOW_DEMO_PURCHASES;
    } else {
      process.env.ALLOW_DEMO_PURCHASES = original;
    }
  }
});

test('POST /shop/purchase returns 200 when ALLOW_DEMO_PURCHASES=true', async () => {
  const original = process.env.ALLOW_DEMO_PURCHASES;
  const testUserId = 'user-test-allowed';
  users.set(testUserId, { id: testUserId, username: 'testuser' });
  try {
    process.env.ALLOW_DEMO_PURCHASES = 'true';
    const app = createTestApp();
    const { status, body } = await testRequest(app, 'POST', '/shop/purchase', {
      userId: testUserId,
      itemId: 'card-back-gold',
    });
    assert.equal(status, 200, `Expected 200 but got ${status}: ${JSON.stringify(body)}`);
    assert.equal(body.ok, true);
  } finally {
    users.delete(testUserId);
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

