import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertNoGamblingFlow,
  assertCosmeticOnlyPurchase,
  COSMETIC_PURCHASE_DISCLOSURE,
  purchaseCannotAffectPrize,
} from '../src/services/guardrails.js';

test('blocks paid entry', () =>
  assert.throws(() => assertNoGamblingFlow({ entryFeeCents: 1000, prizeSource: 'SPONSOR' })));

test('allows free sponsor tournament', () =>
  assert.equal(
    assertNoGamblingFlow({
      entryFeeCents: 0,
      rebuyCents: 0,
      prizeSource: 'SPONSOR',
      usesPlayerFunds: false,
      allowsChipCashout: false,
    }),
    true,
  ));

test('purchase guardrail disclosure remains cosmetic-only', () => {
  const result = purchaseCannotAffectPrize();
  assert.equal(result.affectsLeaderboardScore, false);
  assert.equal(result.affectsPrizeEligibility, false);
  assert.equal(result.affectsPokerOutcomes, false);
  assert.equal(result.paidEntryBlocked, true);
  assert.equal(result.disclosure, COSMETIC_PURCHASE_DISCLOSURE);
});

test('assertCosmeticOnlyPurchase allows cosmetic item', () => {
  const result = assertCosmeticOnlyPurchase({ id: 'card-back-gold', category: 'cardBacks' });
  assert.equal(result.affectsPokerOutcomes, false);
  assert.equal(result.affectsPrizeEligibility, false);
  assert.equal(result.paidEntryBlocked, true);
});

test('assertCosmeticOnlyPurchase blocks chips category', () =>
  assert.throws(
    () => assertCosmeticOnlyPurchase({ id: 'chips-1000', category: 'chips' }),
    { message: 'Only cosmetic purchases are allowed.' },
  ));

test('assertCosmeticOnlyPurchase blocks entry category', () =>
  assert.throws(
    () => assertCosmeticOnlyPurchase({ id: 'entry-fee', category: 'entry' }),
    { message: 'Only cosmetic purchases are allowed.' },
  ));

test('assertCosmeticOnlyPurchase blocks cashout category', () =>
  assert.throws(
    () => assertCosmeticOnlyPurchase({ id: 'cashout-item', category: 'cashout' }),
    { message: 'Only cosmetic purchases are allowed.' },
  ));

test('assertCosmeticOnlyPurchase blocks rebuys category', () =>
  assert.throws(
    () => assertCosmeticOnlyPurchase({ id: 'rebuy-item', category: 'rebuys' }),
    { message: 'Only cosmetic purchases are allowed.' },
  ));

test('assertCosmeticOnlyPurchase rejects invalid item', () =>
  assert.throws(
    () => assertCosmeticOnlyPurchase({ id: '', category: 'cardBacks' }),
    { message: 'Invalid cosmetic item.' },
  ));

test('assertNoGamblingFlow blocks money-based rebuy', () =>
  assert.throws(() =>
    assertNoGamblingFlow({ entryFeeCents: 0, rebuyCents: 500, prizeSource: 'SPONSOR' }),
  ));

test('assertNoGamblingFlow blocks player-funded prizes', () =>
  assert.throws(() =>
    assertNoGamblingFlow({
      entryFeeCents: 0,
      prizeSource: 'SPONSOR',
      usesPlayerFunds: true,
    }),
  ));

test('assertNoGamblingFlow blocks chip cashout', () =>
  assert.throws(() =>
    assertNoGamblingFlow({
      entryFeeCents: 0,
      prizeSource: 'SPONSOR',
      allowsChipCashout: true,
    }),
  ));
