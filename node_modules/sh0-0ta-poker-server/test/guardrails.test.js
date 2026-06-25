import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertNoGamblingFlow,
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
