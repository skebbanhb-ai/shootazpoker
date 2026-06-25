import { PokerTable } from '../game/engine.js';
import { verifyShuffle } from '../services/fairness.js';
import { cosmeticsCatalog, ensureUserCosmetics, users } from '../stores/memoryStore.js';

const tables = new Map();
const main = new PokerTable({ id: 'main-free', mode: 'FREE_PLAY' });
tables.set(main.id, main);

export function createGameSocket(io) {
  io.on('connection', (socket) => {
    socket.on(
      'table:join',
      ({ tableId = 'main-free', name = 'Shooter', userId = null, cosmeticProfile = {} } = {}) => {
      const table = tables.get(tableId) || main;
      const safeProfile = sanitizeCosmeticProfile(userId, cosmeticProfile);
      socket.join(table.id);
      table.addPlayer({
        id: socket.id,
        name,
        avatar: safeProfile.avatar,
        avatarFrame: safeProfile.avatarFrame,
        badge: safeProfile.badge,
        cardBack: safeProfile.cardBack,
        tableSkin: safeProfile.tableSkin,
        watch: safeProfile.watch,
        chain: safeProfile.chain,
        ring: safeProfile.ring,
        vehicle: safeProfile.vehicle,
        home: safeProfile.home,
        outfit: safeProfile.outfit,
        background: safeProfile.background,
        vip: Boolean(safeProfile.vip),
      });
      emit(io, table);
    },
    );

    socket.on('hand:start', ({ tableId = 'main-free', clientSeed = socket.id } = {}) => {
      const table = tables.get(tableId);
      try {
        table.startHand(clientSeed);
        emit(io, table);
      } catch (error) {
        socket.emit('error:game', error.message);
      }
    });

    socket.on('action:fold', ({ tableId = 'main-free' } = {}) => {
      const table = tables.get(tableId);
      const result = table?.fold(socket.id);
      emit(io, table);
      if (result) io.to(table.id).emit('hand:result', result);
    });

    socket.on('action:check', ({ tableId = 'main-free' } = {}) => {
      const table = tables.get(tableId);
      const result = table?.check(socket.id);
      emit(io, table);
      if (result) io.to(table.id).emit('hand:result', result);
    });

    socket.on('action:call', ({ tableId = 'main-free' } = {}) => {
      const table = tables.get(tableId);
      const result = table?.call(socket.id);
      emit(io, table);
      if (result) io.to(table.id).emit('hand:result', result);
    });

    socket.on('action:raise', ({ tableId = 'main-free', amount = 20 } = {}) => {
      const table = tables.get(tableId);
      const result = table?.raise(socket.id, amount);
      emit(io, table);
      if (result) io.to(table.id).emit('hand:result', result);
    });

    socket.on('street:next', ({ tableId = 'main-free' } = {}) => {
      const table = tables.get(tableId);
      const result = table?.dealNextStreet();
      emit(io, table);
      if (result) io.to(table.id).emit('hand:result', result);
    });

    socket.on('fairness:verify', (payload, cb = () => {}) => cb({ ok: verifyShuffle(payload) }));

    socket.on('disconnect', () => {
      for (const table of tables.values()) {
        table.removePlayer(socket.id);
        emit(io, table);
      }
    });
  });
}

function emit(io, table) {
  if (!table) return;
  for (const player of table.players) io.to(player.id).emit('table:update', table.publicState(player.id));
}

function sanitizeCosmeticProfile(userId, cosmeticProfile = {}) {
  if (!userId || !users.has(userId)) return {};
  const { inventory } = ensureUserCosmetics(userId);
  const owned = new Set(inventory);
  const byId = new Map(cosmeticsCatalog.map((item) => [item.id, item]));
  const safe = {};

  const slots = [
    'avatar',
    'avatarFrame',
    'badge',
    'cardBack',
    'tableSkin',
    'emote',
    'watch',
    'chain',
    'ring',
    'vehicle',
    'home',
    'outfit',
    'background',
  ];
  for (const slot of slots) {
    const itemId = cosmeticProfile[slot];
    if (!itemId || !owned.has(itemId)) continue;
    const item = byId.get(itemId);
    if (!item || item.slot !== slot) continue;
    safe[slot] = itemId;
  }

  safe.vip =
    (safe.badge === 'badge-vip-monthly' && owned.has('badge-vip-monthly')) ||
    users.get(userId)?.vip === true;
  return safe;
}
