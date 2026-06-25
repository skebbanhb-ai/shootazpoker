import { v4 as uuid } from 'uuid';
export const users = new Map();
export const purchases = [];
export const sponsors = new Map();
export const tournaments = new Map();
export const leagues = new Map();
export const leaderboards = new Map();

sponsors.set('sponsor-001', { id:'sponsor-001', name:'Founders Sponsor', status:'ACTIVE', budgetCents:250000 });
tournaments.set('tour-001', { id:'tour-001', name:'Friday Night Shooters Freeroll', entryFeeCents:0, rebuyCents:0, prizeCents:50000, prizeSource:'SPONSOR', sponsorId:'sponsor-001', usesPlayerFunds:false, allowsChipCashout:false, status:'OPEN', rulesVersion:'2026.1', entrants:[] });
leagues.set('league-001', { id:'league-001', name:'City vs City Creator League', season:'Season 1', sponsorId:'sponsor-001', prizeCents:100000, prizeSource:'SPONSOR', status:'OPEN', members:[] });
leaderboards.set('league-001', []);
export const newId = prefix => `${prefix}-${uuid().slice(0,8)}`;
