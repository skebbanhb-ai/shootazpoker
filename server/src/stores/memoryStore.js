import { v4 as uuid } from 'uuid';

export const users = new Map();
export const purchases = [];
export const sponsors = new Map();
export const tournaments = new Map();
export const leagues = new Map();
export const leaderboards = new Map();

export const cosmeticsCatalog = [
  { id: 'avatar-gold-shooter', name: 'Gold Shooter', category: 'avatars', slot: 'avatar', priceCents: 0, icon: '🥇' },
  { id: 'avatar-royal-player', name: 'Royal Player', category: 'avatars', slot: 'avatar', priceCents: 0, icon: '👑' },
  { id: 'avatar-neon-ace', name: 'Neon Ace', category: 'avatars', slot: 'avatar', priceCents: 0, icon: '🎯' },
  { id: 'avatar-h-town-legend', name: 'H-Town Legend', category: 'avatars', slot: 'avatar', priceCents: 0, icon: '🤠' },
  { id: 'avatar-queen-of-clubs', name: 'Queen of Clubs', category: 'avatars', slot: 'avatar', priceCents: 0, icon: '🃛' },
  { id: 'avatar-spade-king', name: 'Spade King', category: 'avatars', slot: 'avatar', priceCents: 0, icon: '♠️' },
  { id: 'avatar-diamond-boss', name: 'Diamond Boss', category: 'avatars', slot: 'avatar', priceCents: 0, icon: '💎' },
  { id: 'avatar-club-captain', name: 'Club Captain', category: 'avatars', slot: 'avatar', priceCents: 0, icon: '♣️' },
  { id: 'gold-card-back', name: 'Gold Card Back', category: 'cardBacks', slot: 'cardBack', priceCents: 499 },
  { id: 'black-diamond-card-back', name: 'Black Diamond Card Back', category: 'cardBacks', slot: 'cardBack', priceCents: 599 },
  { id: 'neon-purple-card-back', name: 'Neon Purple Card Back', category: 'cardBacks', slot: 'cardBack', priceCents: 549 },
  { id: 'founder-badge', name: 'Founder Badge', category: 'profileBadges', slot: 'badge', priceCents: 799 },
  { id: 'vip-monthly', name: 'VIP Monthly', category: 'vipMembership', slot: 'badge', priceCents: 999, grantsVip: true },
  { id: 'season-pass-1', name: 'Season 1 Pass', category: 'vipMembership', slot: 'badge', priceCents: 1999 },
  { id: 'h-town-table-skin', name: 'H-Town Table Skin', category: 'tableSkins', slot: 'tableSkin', priceCents: 399 },
  { id: 'midnight-felt-table-skin', name: 'Midnight Felt Table Skin', category: 'tableSkins', slot: 'tableSkin', priceCents: 499 },
  { id: 'royal-gold-table-skin', name: 'Royal Gold Table Skin', category: 'tableSkins', slot: 'tableSkin', priceCents: 699 },
  { id: 'fire-avatar-frame', name: 'Fire Avatar Frame', category: 'avatarFrames', slot: 'avatarFrame', priceCents: 299 },
  { id: 'diamond-avatar-frame', name: 'Diamond Avatar Frame', category: 'avatarFrames', slot: 'avatarFrame', priceCents: 399 },
  { id: 'crown-avatar-frame', name: 'Crown Avatar Frame', category: 'avatarFrames', slot: 'avatarFrame', priceCents: 499 },
  { id: 'all-in-emote', name: 'All-In Emote', category: 'emotes', slot: 'emote', priceCents: 199, icon: '🤑' },
];

export const userInventory = new Map();
export const equippedCosmetics = new Map();

export const defaultOwnedCosmetics = [
  'avatar-gold-shooter',
  'avatar-royal-player',
  'avatar-neon-ace',
  'avatar-h-town-legend',
  'avatar-queen-of-clubs',
  'avatar-spade-king',
  'avatar-diamond-boss',
  'avatar-club-captain',
];

export const defaultEquippedCosmetics = {
  cardBack: null,
  tableSkin: null,
  avatarFrame: null,
  badge: null,
  avatar: 'avatar-gold-shooter',
  emote: null,
};

export function ensureUserCosmetics(userId) {
  if (!userInventory.has(userId)) {
    userInventory.set(userId, [...defaultOwnedCosmetics]);
  }
  if (!equippedCosmetics.has(userId)) {
    equippedCosmetics.set(userId, { ...defaultEquippedCosmetics });
  }

  return {
    inventory: userInventory.get(userId),
    equipped: equippedCosmetics.get(userId),
  };
}

sponsors.set('sponsor-001', {
  id: 'sponsor-001',
  name: 'Founders Sponsor',
  status: 'ACTIVE',
  budgetCents: 250000,
});

tournaments.set('tour-001', {
  id: 'tour-001',
  name: 'Friday Night Shooters Freeroll',
  entryFeeCents: 0,
  rebuyCents: 0,
  prizeCents: 50000,
  prizeSource: 'SPONSOR',
  sponsorId: 'sponsor-001',
  usesPlayerFunds: false,
  allowsChipCashout: false,
  status: 'OPEN',
  rulesVersion: '2026.1',
  entrants: [],
});

leagues.set('league-001', {
  id: 'league-001',
  name: 'City vs City Creator League',
  season: 'Season 1',
  sponsorId: 'sponsor-001',
  prizeCents: 100000,
  prizeSource: 'SPONSOR',
  status: 'OPEN',
  members: [],
});

leaderboards.set('league-001', []);

export const newId = (prefix) => `${prefix}-${uuid().slice(0, 8)}`;
