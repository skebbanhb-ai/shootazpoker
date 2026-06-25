export const PrizeSources = Object.freeze({
  SPONSOR: 'SPONSOR',
  PLATFORM_PROMO: 'PLATFORM_PROMO',
  MERCH_PARTNER: 'MERCH_PARTNER',
});

export const COSMETIC_PURCHASE_DISCLOSURE =
  'Cosmetic purchases do not affect gameplay, odds, rankings, or prize eligibility.';

export function assertNoGamblingFlow({
  entryFeeCents = 0,
  rebuyCents = 0,
  prizeSource,
  usesPlayerFunds = false,
  allowsChipCashout = false,
}) {
  if (process.env.REAL_MONEY_ENABLED === 'true') {
    throw new Error('Real-money gambling mode is not supported in this edition.');
  }
  if (Number(entryFeeCents) > 0) throw new Error('Paid tournament entry is blocked. Entry must be free.');
  if (Number(rebuyCents) > 0) throw new Error('Money-based rebuys are blocked.');
  if (usesPlayerFunds) throw new Error('Player-funded prize pools are blocked.');
  if (allowsChipCashout) throw new Error('Free chips cannot be cashed out.');
  if (!Object.values(PrizeSources).includes(prizeSource)) {
    throw new Error('Prize source must be sponsor/platform promo/merch partner.');
  }
  return true;
}

export function purchaseCannotAffectPrize() {
  return {
    affectsLeaderboardScore: false,
    affectsPrizeEligibility: false,
    affectsPokerOutcomes: false,
    freeChipsCashValue: false,
    paidEntryBlocked: true,
    disclosure: COSMETIC_PURCHASE_DISCLOSURE,
  };
}

export function assertCosmeticOnlyPurchase(item = {}) {
  if (!item || !item.id || !item.category) {
    throw new Error('Invalid cosmetic item.');
  }

  const blockedCategories = new Set(['chips', 'rebuys', 'entry', 'cashout']);
  if (blockedCategories.has(item.category)) {
    throw new Error('Only cosmetic purchases are allowed.');
  }

  return purchaseCannotAffectPrize();
}
