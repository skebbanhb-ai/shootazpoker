import { PokerTable } from '../game/engine.js';
import { verifyShuffle } from '../services/fairness.js';

const tables = new Map();
const main = new PokerTable({ id: 'main-free', mode: 'FREE_PLAY' });
tables.set(main.id, main);

export function createGameSocket(io) {
  io.on('connection', (socket) => {
    socket.on('table:join', ({ tableId = 'main-free', name = 'Shooter', cosmeticProfile = {} } = {}) => {
      const table = tables.get(tableId) || main;
      socket.join(table.id);
      table.addPlayer({
        id: socket.id,
        name,
        avatar: cosmeticProfile.avatar,
        avatarFrame: cosmeticProfile.avatarFrame,
        badge: cosmeticProfile.badge,
        cardBack: cosmeticProfile.cardBack,
        tableSkin: cosmeticProfile.tableSkin,
        vip: Boolean(cosmeticProfile.vip),
      });
      emit(io, table);
    });

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
      table?.fold(socket.id);
      emit(io, table);
    });

    socket.on('action:check', ({ tableId = 'main-free' } = {}) => {
      const table = tables.get(tableId);
      table?.check();
      emit(io, table);
    });

    socket.on('action:call', ({ tableId = 'main-free' } = {}) => {
      const table = tables.get(tableId);
      table?.call(socket.id);
      emit(io, table);
    });

    socket.on('action:raise', ({ tableId = 'main-free', amount = 20 } = {}) => {
      const table = tables.get(tableId);
      table?.raise(socket.id, amount);
      emit(io, table);
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
