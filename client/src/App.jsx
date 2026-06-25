import React, { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import {
  AlertCircle,
  CheckCircle2,
  CircleDashed,
  Crown,
  Flame,
  LayoutDashboard,
  LoaderCircle,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trophy,
  User,
} from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";
const COSMETICS_VERSION = 'v1';
const socket = io(API);
const MAX_SEATS = 6;
const COSMETICS_STORAGE_KEY = 'shootaz-cosmetics-v1';

const AVATAR_PRESETS = [
  { id: 'avatar-gold-shooter', name: 'Gold Shooter', icon: '🥇' },
  { id: 'avatar-royal-player', name: 'Royal Player', icon: '👑' },
  { id: 'avatar-neon-ace', name: 'Neon Ace', icon: '🎯' },
  { id: 'avatar-h-town-legend', name: 'H-Town Legend', icon: '🤠' },
  { id: 'avatar-queen-of-clubs', name: 'Queen of Clubs', icon: '🃛' },
  { id: 'avatar-spade-king', name: 'Spade King', icon: '♠️' },
  { id: 'avatar-diamond-boss', name: 'Diamond Boss', icon: '💎' },
  { id: 'avatar-club-captain', name: 'Club Captain', icon: '♣️' },
];

const DEFAULT_COSMETICS = {
  userId: 'demo-user-local',
  displayName: 'Shooter',
  ownedItemIds: AVATAR_PRESETS.map((preset) => preset.id),
  equipped: {
    avatar: AVATAR_PRESETS[0].id,
    cardBack: null,
    tableSkin: null,
    avatarFrame: null,
    badge: null,
    emote: null,
    watch: null,
    chain: null,
    ring: null,
    vehicle: null,
    home: null,
    outfit: null,
    background: null,
  },
};
const LOCAL_FREE_ITEM_IDS = new Set(AVATAR_PRESETS.map((preset) => preset.id));

function slug(value) {
  return (value || 'default').toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function readStoredCosmetics() {
  if (typeof window === 'undefined') return DEFAULT_COSMETICS;
  try {
    const raw = window.localStorage.getItem(COSMETICS_STORAGE_KEY);
    if (!raw) return DEFAULT_COSMETICS;
    const parsed = JSON.parse(raw);
    const trustedOwned = (parsed.ownedItemIds || []).filter((id) => LOCAL_FREE_ITEM_IDS.has(id));
    const ownedItemIds = Array.from(new Set([...trustedOwned, ...DEFAULT_COSMETICS.ownedItemIds]));
    const equipped = { ...DEFAULT_COSMETICS.equipped, ...(parsed.equipped || {}) };
    return {
      ...DEFAULT_COSMETICS,
      ...parsed,
      ownedItemIds,
      equipped: sanitizeEquipped(ownedItemIds, equipped),
    };
  } catch {
    return DEFAULT_COSMETICS;
  }
}

function Card({ c, cardTheme }) {
  const hidden = c === '🂠';
  const red = c?.includes('H') || c?.includes('D') || c?.includes('♥') || c?.includes('♦');
  const rank = hidden ? '' : c?.slice(0, -1);
  const suit = hidden ? '' : c?.slice(-1);
  return (
    <span className={`cardx ${red ? 'red' : ''} ${hidden ? 'is-hidden' : ''} theme-${slug(cardTheme)}`}>
      {hidden ? (
        <span className="card-back-mark">SH0 0TA</span>
      ) : (
        <>
          <span className="card-rank">{rank}</span>
          <span className="card-suit">{suit}</span>
        </>
      )}
    </span>
  );
}

function useApi(path, initial = []) {
  const [data, setData] = useState(initial);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const load = () => {
    setLoading(true);
    setError('');
    return fetch(API + path)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load ${path}`);
        return r.json();
      })
      .then(setData)
      .catch(() => setError('Service temporarily unavailable. Please try again in a moment.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);
  return [data, load, setData, { error, loading }];
}

function buildSeatData(players = [], maxSeats = MAX_SEATS) {
  return Array.from({ length: maxSeats }, (_, index) => players[index] || null);
}

function avatarById(id) {
  return AVATAR_PRESETS.find((preset) => preset.id === id) || AVATAR_PRESETS[0];
}

function itemNameById(catalogIndex, id, fallback = 'None') {
  return catalogIndex.get(id)?.name || fallback;
}

function buildUrlFromParams(params) {
  const query = params.toString();
  return `${window.location.pathname}${query ? `?${query}` : ''}`;
}

function mergeEquipped(remote = {}, local = {}) {
  const merged = { ...remote };
  for (const [slot, localValue] of Object.entries(local)) {
    if (localValue) merged[slot] = localValue;
  }
  return merged;
}

function sanitizeEquipped(ownedItemIds, equipped = {}) {
  const owned = new Set(ownedItemIds || []);
  const next = { ...DEFAULT_COSMETICS.equipped, ...equipped };
  for (const [slot, value] of Object.entries(next)) {
    if (!value) continue;
    if (slot === 'avatar' && LOCAL_FREE_ITEM_IDS.has(value)) continue;
    if (!owned.has(value)) next[slot] = null;
  }
  return next;
}

function TableTab({
  table,
  name,
  join,
  ev,
  log,
  cosmetics,
  catalogIndex,
  connectionState,
  apiError,
  retryApi,
}) {
  const players = table?.players || [];
  const seats = useMemo(() => buildSeatData(players), [players]);
  const currentTurnName = players[table?.turn]?.name || 'Waiting for hand start';
  const tableSkin = cosmetics?.equipped?.tableSkin;
  const cardBack = cosmetics?.equipped?.cardBack;
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [raiseAmount, setRaiseAmount] = useState(50);
  const selectedPlayer = players.find((player) => player.id === selectedPlayerId);

  return (
    <div className="table-layout">
      <section className="panel p-4 md:p-5">
        <div className={`connection-pill ${connectionState}`}>
          {connectionState === 'connected' ? <CheckCircle2 size={14} /> : null}
          {connectionState === 'connecting' ? <LoaderCircle size={14} className="spin" /> : null}
          {connectionState === 'sleeping' ? <CircleDashed size={14} /> : null}
          {connectionState === 'error' ? <AlertCircle size={14} /> : null}
          <span>
            {connectionState === 'connected' && 'Connected'}
            {connectionState === 'connecting' && 'Connecting...'}
            {connectionState === 'sleeping' && 'Backend sleeping / retrying...'}
            {connectionState === 'error' && 'Connection unavailable'}
          </span>
        </div>
        {apiError ? (
          <div className="api-error-banner">
            {apiError}
            <button className="btn dark ml-2" onClick={retryApi}>
              Retry
            </button>
          </div>
        ) : null}
        <div className="premium-table-wrap">
          <div className={`table-felt skin-${slug(tableSkin)}`}>
            <div className="table-center">
              <p className="table-label">Community Cards</p>
              <div className="community-row">
                {table?.community?.length ? (
                  table.community.map((card, index) => <Card key={index} c={card} cardTheme={cardBack} />)
                ) : (
                  <span className="muted text-sm">No board yet</span>
                )}
              </div>
              <div className="pot-chip">Pot: {table?.pot ?? 0}</div>
              <div className="turn-pill">Turn: {currentTurnName}</div>
            </div>

            {seats.map((player, index) => {
              const isActive = Boolean(player) && index === table?.turn;
              const isFolded = Boolean(player?.folded);
              const seatClass = [
                'seat',
                `seat-${index}`,
                isActive ? 'seat-active' : '',
                isFolded ? 'seat-folded' : '',
                !player ? 'seat-empty' : '',
              ]
                .filter(Boolean)
                .join(' ');

              const avatar = avatarById(player?.avatar).icon;

              return (
                <article key={player?.id || `empty-${index}`} className={seatClass}>
                  {player ? (
                    <>
                      <button className="seat-headline" onClick={() => setSelectedPlayerId(player.id)}>
                        <b>
                          {player.name}
                          {player.vip ? <span className="seat-badge vip">VIP</span> : null}
                          {player.badge === 'founder-badge' ? <span className="seat-badge founder">Founder</span> : null}
                        </b>
                        {isFolded ? <span className="seat-tag">Folded</span> : null}
                      </button>
                      <div className={`avatar-ring frame-${slug(player.avatarFrame)}`}>
                        <span className="avatar-icon" role="img" aria-label="player-avatar">
                          {avatar}
                        </span>
                      </div>
                      <p className="muted text-xs">Stack: {player.chips} chips</p>
                      <div className="chip-stack" aria-hidden="true">
                        {Array.from({ length: Math.max(1, Math.min(5, Math.ceil(player.chips / 250))) }, (_, chipIndex) => (
                          <span key={chipIndex} className="chip" />
                        ))}
                      </div>
                      <p className="muted text-xs">Bet: {player.currentBet || 0}</p>
                      {(player.watch || player.chain || player.vehicle || player.home) && (
                        <p className="muted text-xs seat-lifestyle">
                          {player.watch ? `⌚ ${itemNameById(catalogIndex, player.watch, 'Watch')}` : ''}
                          {player.watch && player.chain ? ' · ' : ''}
                          {player.chain ? `⛓ ${itemNameById(catalogIndex, player.chain, 'Chain')}` : ''}
                          {(player.watch || player.chain) && (player.vehicle || player.home) ? ' · ' : ''}
                          {player.vehicle ? `🚘 ${itemNameById(catalogIndex, player.vehicle, 'Vehicle')}` : ''}
                          {player.vehicle && player.home ? ' · ' : ''}
                          {player.home ? `🏠 ${itemNameById(catalogIndex, player.home, 'Home')}` : ''}
                        </p>
                      )}
                      <div className="seat-cards">
                        {(player.cards || ['🂠', '🂠']).map((card, cardIndex) => (
                          <Card key={cardIndex} c={card} cardTheme={player.cardBack || cardBack} />
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="empty-seat-icon">
                        <User size={16} />
                      </div>
                      <p className="muted text-xs">Open Seat</p>
                    </>
                  )}
                </article>
              );
            })}
            {selectedPlayer ? (
              <aside className="player-profile-card">
                <h4>{selectedPlayer.name}</h4>
                <p className="muted text-xs">Avatar: {avatarById(selectedPlayer.avatar).name}</p>
                <p className="muted text-xs">Outfit: {itemNameById(catalogIndex, selectedPlayer.outfit, 'Default')}</p>
                <p className="muted text-xs">Background: {itemNameById(catalogIndex, selectedPlayer.background, 'Default')}</p>
                <p className="muted text-xs">Frame: {itemNameById(catalogIndex, selectedPlayer.avatarFrame, 'None')}</p>
                <button className="btn dark mt-2" onClick={() => setSelectedPlayerId(null)}>
                  Close
                </button>
              </aside>
            ) : null}
          </div>
        </div>

        <div className="action-bar mt-4">
          <button
            className="btn gold"
            onClick={() =>
              join({
                avatar: cosmetics?.equipped?.avatar,
                avatarFrame: cosmetics?.equipped?.avatarFrame,
                badge: cosmetics?.equipped?.badge,
                cardBack: cosmetics?.equipped?.cardBack,
                tableSkin: cosmetics?.equipped?.tableSkin,
                watch: cosmetics?.equipped?.watch,
                chain: cosmetics?.equipped?.chain,
                ring: cosmetics?.equipped?.ring,
                vehicle: cosmetics?.equipped?.vehicle,
                home: cosmetics?.equipped?.home,
                outfit: cosmetics?.equipped?.outfit,
                background: cosmetics?.equipped?.background,
                vip: cosmetics?.equipped?.badge === 'badge-vip-monthly',
              })
            }
          >
            Join Table
          </button>
          <button className="btn gold" onClick={() => ev('hand:start', { clientSeed: name })}>
            Start Hand
          </button>
          <button className="btn dark" onClick={() => ev('action:check')}>
            Check
          </button>
          <button className="btn dark" onClick={() => ev('action:call')}>
            Call
          </button>
          <button className="btn redbtn" onClick={() => ev('action:fold')}>
            Fold
          </button>
          <div className="raise-wrap">
            <input
              type="number"
              className="input raise-input"
              min={table?.minimumRaise || 1}
              value={raiseAmount}
              onChange={(event) => setRaiseAmount(Number(event.target.value) || 0)}
            />
            <button className="btn dark" onClick={() => ev('action:raise', { amount: raiseAmount })}>
              Raise
            </button>
          </div>
          <button className="btn dark" onClick={() => ev('street:next')}>
            Next Street
          </button>
        </div>
      </section>
      <Aside table={table} log={log} />
    </div>
  );
}

function CustomizeTab({ cosmetics, setCosmetics, catalogIndex, user, equipItem }) {
  const selectedAvatar = avatarById(cosmetics.equipped.avatar);
  
  // Calculate Style Score from equipped cosmetic rarities
  const calcStyleScore = () => {
    const rarityValues = { common: 1, rare: 3, epic: 7, legendary: 15, founder: 25, vip: 10 };
    let score = 0;
    Object.entries(cosmetics.equipped).forEach(([slot, itemId]) => {
      if (itemId && catalogIndex.has(itemId)) {
        const item = catalogIndex.get(itemId);
        score += rarityValues[item.rarity] || 0;
      }
    });
    return Math.round(score);
  };

  const styleScore = calcStyleScore();
  const ownedItems = cosmetics.ownedItemIds.map((id) => catalogIndex.get(id)).filter(Boolean);

  return (
    <Panel title="Customize Profile" icon={<Sparkles />}>
      <p className="muted text-sm">
        Culture &amp; Luxury Lifestyle Cosmetics {COSMETICS_VERSION} — expressive style only, never gameplay
        advantage.
      </p>
      <div className="customize-sections">
        {/* Profile Overview */}
        <div className="panel p-4 customize-section">
          <h3 className="font-black text-xl mb-3">🎭 Player Profile</h3>
          <div className="profile-overview">
            <div>
              <p className="muted text-sm">Display Name</p>
              <p className="font-black">{user?.name || cosmetics.displayName}</p>
            </div>
            <div>
              <p className="muted text-sm">Style Score</p>
              <p className="font-black text-2xl text-yellow-400">{styleScore}</p>
              <p className="muted text-xs">Cosmetic only, does not affect gameplay</p>
            </div>
            <div>
              <p className="muted text-sm">Status</p>
              <p className="font-black">{user?.vip ? '👑 VIP Member' : 'Player'}</p>
            </div>
          </div>
        </div>

        {/* Avatar & Frame */}
        <div className="panel p-4 customize-section">
          <h3 className="font-black text-xl mb-3">👤 Avatar & Frame</h3>
          <div className={`avatar-ring large frame-${slug(cosmetics.equipped.avatarFrame)}`}>
            <span className="avatar-icon" role="img" aria-label="selected-avatar">
              {selectedAvatar.icon}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div>
              <p className="muted text-xs">Selected Avatar</p>
              <p className="text-sm font-bold">{selectedAvatar.name}</p>
            </div>
            <div>
              <p className="muted text-xs">Avatar Frame</p>
              <p className="text-sm font-bold">{itemNameById(catalogIndex, cosmetics.equipped.avatarFrame, 'None')}</p>
            </div>
          </div>
          <div className="avatar-grid mt-4">
            {AVATAR_PRESETS.map((preset) => {
              const equipped = cosmetics.equipped.avatar === preset.id;
              return (
                <button
                  key={preset.id}
                  className={`avatar-choice ${equipped ? 'active' : ''}`}
                  onClick={() =>
                    setCosmetics((prev) => ({
                      ...prev,
                      equipped: { ...prev.equipped, avatar: preset.id },
                    }))
                  }
                  title={preset.name}
                >
                  <span className="avatar-emoji">{preset.icon}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Jewelry Box */}
        <div className="panel p-4 customize-section">
          <h3 className="font-black text-xl mb-3">💎 Jewelry Box</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="muted text-xs">Watch</p>
              <p className="text-sm font-bold">{itemNameById(catalogIndex, cosmetics.equipped.watch, 'None')}</p>
            </div>
            <div>
              <p className="muted text-xs">Chain</p>
              <p className="text-sm font-bold">{itemNameById(catalogIndex, cosmetics.equipped.chain, 'None')}</p>
            </div>
            <div>
              <p className="muted text-xs">Ring</p>
              <p className="text-sm font-bold">{itemNameById(catalogIndex, cosmetics.equipped.ring, 'None')}</p>
            </div>
            <div>
              <p className="muted text-xs">Badge</p>
              <p className="text-sm font-bold">{itemNameById(catalogIndex, cosmetics.equipped.badge, 'None')}</p>
            </div>
          </div>
        </div>

        {/* Garage */}
        <div className="panel p-4 customize-section">
          <h3 className="font-black text-xl mb-3">🏎️ Garage</h3>
          <p className="text-sm font-bold">{itemNameById(catalogIndex, cosmetics.equipped.vehicle, 'None')}</p>
        </div>

        {/* Properties */}
        <div className="panel p-4 customize-section">
          <h3 className="font-black text-xl mb-3">🏠 Properties</h3>
          <p className="text-sm font-bold">{itemNameById(catalogIndex, cosmetics.equipped.home, 'None')}</p>
        </div>

        {/* Outfits */}
        <div className="panel p-4 customize-section">
          <h3 className="font-black text-xl mb-3">👔 Outfits</h3>
          <p className="text-sm font-bold">{itemNameById(catalogIndex, cosmetics.equipped.outfit, 'None')}</p>
        </div>

        {/* Table & Cards */}
        <div className="panel p-4 customize-section">
          <h3 className="font-black text-xl mb-3">🎰 Table & Cards Style</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="muted text-xs">Table Skin</p>
              <p className="text-sm font-bold">{itemNameById(catalogIndex, cosmetics.equipped.tableSkin, 'Default')}</p>
            </div>
            <div>
              <p className="muted text-xs">Card Back</p>
              <p className="text-sm font-bold">{itemNameById(catalogIndex, cosmetics.equipped.cardBack, 'Default')}</p>
            </div>
          </div>
        </div>

        {/* Profile Background */}
        <div className="panel p-4 customize-section">
          <h3 className="font-black text-xl mb-3">🌅 Profile Background</h3>
          <p className="text-sm font-bold">{itemNameById(catalogIndex, cosmetics.equipped.background, 'Default')}</p>
        </div>

        {/* Owned Items Summary */}
        <div className="panel p-4 customize-section col-span-full">
          <h3 className="font-black text-xl mb-3">📦 Your Collection ({cosmetics.ownedItemIds.length} items)</h3>
          <div className="owned-items-summary">
            {ownedItems.slice(0, 12).map((item) => (
              <div key={item.id} className="owned-item-chip" title={item.name}>
                <span className="text-sm">{item.icon || '•'} {item.name}</span>
              </div>
            ))}
            {ownedItems.length > 12 && (
              <div className="owned-item-chip">
                <span className="text-sm">+{ownedItems.length - 12} more</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}

export default function App() {
  const [tab, setTab] = useState('table');
  const [name, setName] = useState('Shooter');
  const [user, setUser] = useState(null);
  const [table, setTable] = useState(null);
  const [log, setLog] = useState([]);
  const [paymentBanner, setPaymentBanner] = useState('');
  const [shopCategory, setShopCategory] = useState('all');
  const [cosmetics, setCosmetics] = useState(readStoredCosmetics);
  const [connectionState, setConnectionState] = useState('connecting');

  const [tours, loadTours, , toursMeta] = useApi('/tournaments');
  const [leagues, loadLeagues, , leaguesMeta] = useApi('/leagues');
  const [shopData, loadShop, , shopMeta] = useApi('/shop/catalog', { categories: {} });
  const [admin, loadAdmin, , adminMeta] = useApi('/admin/dashboard', {});

  const appendLog = (entry) => {
    setLog((items) => [`${new Date().toLocaleTimeString()} · ${entry}`, ...items.slice(0, 39)]);
  };

  useEffect(() => {
    socket.on('connect', () => {
      setConnectionState('connected');
      appendLog('Connected to game server.');
    });
    socket.on('disconnect', () => {
      setConnectionState('sleeping');
      appendLog('Connection dropped. Retrying...');
    });
    socket.on('connect_error', () => {
      setConnectionState((prev) => (prev === 'connected' ? 'connecting' : 'sleeping'));
    });
    socket.on('table:update', (payload) => {
      setConnectionState('connected');
      setTable(payload);
    });
    socket.on('hand:result', (result) => appendLog(`Winner: ${result.winnerName}. Fairness seed revealed.`));
    socket.on('error:game', (message) => {
      setConnectionState('error');
      appendLog(message);
    });
    return () => socket.off();
  }, []);

  useEffect(() => {
    window.localStorage.setItem(COSMETICS_STORAGE_KEY, JSON.stringify(cosmetics));
  }, [cosmetics]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    if (payment === 'success') {
      setPaymentBanner('Purchase successful. Your cosmetic is ready.');
      params.delete('payment');
      window.history.replaceState({}, '', buildUrlFromParams(params));
    }
    if (payment === 'cancelled') {
      setPaymentBanner('Checkout cancelled. No purchase was made.');
      params.delete('payment');
      window.history.replaceState({}, '', buildUrlFromParams(params));
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`${API}/shop/inventory/${user.id}`)
      .then((response) => response.json())
      .then((inventory) => {
        setCosmetics((prev) => ({
          ...prev,
          userId: user.id,
          displayName: user.name || prev.displayName,
          ownedItemIds: Array.from(new Set([...(inventory.ownedItemIds || []), ...(prev.ownedItemIds || [])])),
          equipped: sanitizeEquipped(
            Array.from(new Set([...(inventory.ownedItemIds || []), ...(prev.ownedItemIds || [])])),
            mergeEquipped(inventory.equipped, prev.equipped),
          ),
        }));
      })
      .catch(() => {});
  }, [user?.id]);

  const catalogItems = useMemo(
    () => Object.values(shopData?.categories || {}).flatMap((items) => items),
    [shopData],
  );

  const catalogIndex = useMemo(
    () => new Map(catalogItems.map((item) => [item.id, item])),
    [catalogItems],
  );

  const shopCategories = useMemo(
    () =>
      Object.keys(shopData?.categories || {}).filter((category) =>
        ['avatars', 'cardBacks', 'tableSkins', 'avatarFrames', 'watches', 'jewelry', 
         'vehicles', 'homes', 'outfits', 'backgrounds', 'profileBadges', 'emotes', 'vipMembership'].includes(
          category,
        ),
      ).sort(),
    [shopData],
  );

  const filteredShopItems = useMemo(() => {
    const source = catalogItems.filter((item) => item.priceCents > 0);
    if (shopCategory === 'all') return source;
    return source.filter((item) => item.category === shopCategory);
  }, [catalogItems, shopCategory]);

  const join = (cosmeticProfile = {}) =>
    socket.emit('table:join', {
      name,
      userId: user?.id,
      cosmeticProfile,
    });

  const ev = (eventName, payload = {}) => socket.emit(eventName, { tableId: 'main-free', ...payload });

  async function login() {
    const response = await fetch(API + '/auth/demo-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const json = await response.json();
    setUser(json.user);
    setCosmetics((prev) => ({
      ...prev,
      userId: json.user?.id || prev.userId,
      displayName: json.user?.name || prev.displayName,
    }));
  }

  async function post(path, body) {
    const response = await fetch(API + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await response.json();
    appendLog(json.error || json.disclosure || 'Success');
    loadTours();
    loadLeagues();
    loadAdmin();
    loadShop();
    return json;
  }

  async function runDemoPurchase(userId, itemId) {
    const result = await post('/shop/purchase', { userId, itemId });
    if (result?.inventory) {
      setCosmetics((prev) => ({
        ...prev,
        userId,
        ownedItemIds: Array.from(new Set(result.inventory.ownedItemIds || prev.ownedItemIds)),
        equipped: { ...prev.equipped, ...(result.inventory.equipped || {}) },
      }));
    }
    if (result?.item?.grantsVip) {
      setUser((prev) => (prev ? { ...prev, vip: true } : prev));
    }
    return result;
  }

  async function buyItem(itemId) {
    const userId = user?.id || cosmetics.userId;
    try {
      const response = await fetch(`${API}/payments/checkout/cosmetic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, itemId }),
      });

      if (response.status === 404 || response.status === 405) {
        await runDemoPurchase(userId, itemId);
        return;
      }

      const checkout = await response.json();
      if (checkout?.url) {
        window.location.href = checkout.url;
        return;
      }

      if (checkout?.error) {
        appendLog(checkout.error);
        return;
      }
    } catch {
      await runDemoPurchase(userId, itemId);
      return;
    }

    appendLog('Checkout could not be started. Try again in a moment.');
  }

  async function equipItem(itemId) {
    const userId = user?.id || cosmetics.userId;
    const result = await post('/shop/equip', { userId, itemId });
    if (result?.equipped) {
      setCosmetics((prev) => ({ ...prev, userId, equipped: { ...prev.equipped, ...result.equipped } }));
    }
  }

  return (
    <main className="min-h-screen p-4 md:p-6">
      <section className="max-w-7xl mx-auto">
        <header className="flex flex-wrap gap-4 items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-black flex gap-2 items-center">
              <Flame className="text-yellow-400" /> SH0 0TA Poker
            </h1>
            <p className="muted">
              Sponsored Creator League Edition — free play, sponsor-funded prizes, cosmetics only.
            </p>
          </div>
          <div className="flex gap-2">
            <input className="input" value={name} onChange={(event) => setName(event.target.value)} />
            <button className="btn gold" onClick={login}>
              {user ? 'Logged In' : 'Demo Login'}
            </button>
          </div>
        </header>

        {paymentBanner ? <div className="payment-banner">{paymentBanner}</div> : null}

        <nav className="flex flex-wrap gap-2 mb-5">
          {[
            ['table', 'Table', Flame],
            ['tournaments', 'Tournaments', Trophy],
            ['league', 'Creator League', Crown],
            ['customize', 'Customize', Sparkles],
            ['shop', 'Shop', ShoppingBag],
            ['admin', 'Admin', LayoutDashboard],
          ].map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`btn ${tab === id ? 'gold' : 'dark'}`}
            >
              <Icon size={16} className="inline" /> {label}
            </button>
          ))}
        </nav>

        {tab === 'table' && (
          <TableTab
            table={table}
            name={name}
            join={join}
            ev={ev}
            log={log}
            cosmetics={cosmetics}
            catalogIndex={catalogIndex}
            connectionState={connectionState}
            apiError={shopMeta.error || toursMeta.error || leaguesMeta.error || adminMeta.error}
            retryApi={() => {
              loadTours();
              loadLeagues();
              loadShop();
              loadAdmin();
            }}
          />
        )}

        {tab === 'tournaments' && (
          <Panel title="Sponsored Prize Tournaments" icon={<Trophy />}>
            <Safety />
            <div className="grid md:grid-cols-2 gap-4">
              {tours.map((tournament) => (
                <div className="panel p-4" key={tournament.id}>
                  <h3 className="font-black text-xl">{tournament.name}</h3>
                  <p className="muted">
                    Entry: FREE | Prize: ${(tournament.prizeCents / 100).toFixed(2)} | Source:{' '}
                    {tournament.prizeSource}
                  </p>
                  <p className="muted">
                    Entrants: {tournament.entrants.length} | Rules: {tournament.rulesVersion}
                  </p>
                  <button
                    className="btn gold mt-3"
                    onClick={() => post(`/tournaments/${tournament.id}/enter`, { userId: user?.id })}
                  >
                    Enter Free
                  </button>
                  <button
                    className="btn dark mt-3 ml-2"
                    onClick={() => post(`/tournaments/${tournament.id}/accept-rules`, { userId: user?.id })}
                  >
                    Accept Rules
                  </button>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {tab === 'league' && (
          <Panel title="Creator League" icon={<Crown />}>
            <div className="grid md:grid-cols-2 gap-4">
              {leagues.map((league) => (
                <LeagueCard key={league.id} l={league} user={user} name={name} post={post} />
              ))}
            </div>
          </Panel>
        )}

        {tab === 'customize' && (
          <CustomizeTab cosmetics={cosmetics} setCosmetics={setCosmetics} catalogIndex={catalogIndex} user={user} equipItem={equipItem} />
        )}

        {tab === 'shop' && (
          <Panel title="Cosmetic Shop / VIP" icon={<ShoppingBag />}>
            <Safety />
            <p className="shop-disclosure">
              Cosmetic purchases do not affect gameplay, odds, rankings, tournament outcomes, or prize eligibility.
            </p>
            <p className="muted text-sm">
              Checkout uses backend-only Stripe secret keys. Frontend key status:{' '}
              {STRIPE_PUBLISHABLE_KEY ? 'Configured' : 'Not configured'}.
            </p>

            <div className="shop-filters mt-6">
              <button
                className={`btn ${shopCategory === 'all' ? 'gold' : 'dark'}`}
                onClick={() => setShopCategory('all')}
              >
                All Items
              </button>
              {shopCategories.map((category) => {
                const categoryLabel = category
                  .replace(/([A-Z])/g, ' $1')
                  .trim()
                  .replace(/^./, (s) => s.toUpperCase());
                return (
                  <button
                    key={category}
                    className={`btn ${shopCategory === category ? 'gold' : 'dark'}`}
                    onClick={() => setShopCategory(category)}
                  >
                    {categoryLabel}
                  </button>
                );
              })}
            </div>

            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
              {filteredShopItems.map((item) => {
                const owned = cosmetics.ownedItemIds.includes(item.id);
                const rarityColors = {
                  common: '#888',
                  rare: '#4da6ff',
                  epic: '#9d4edd',
                  legendary: '#ff006e',
                  founder: '#ffd60a',
                  vip: '#ffd60a',
                };
                const rarityColor = rarityColors[item.rarity] || '#888';
                return (
                  <div
                    key={item.id}
                    className="panel p-4 shop-item-card"
                    style={{ borderTop: `4px solid ${rarityColor}` }}
                  >
                    <div className="text-3xl mb-2 text-center">{item.icon || '•'}</div>
                    <h3 className="font-black text-sm">{item.name}</h3>
                    <p className="muted text-xs">{item.category}</p>
                    <p className="text-xs font-bold mt-1" style={{ color: rarityColor }}>
                      {(item.rarity || 'common').toUpperCase()}
                    </p>
                    <p className="text-lg font-black text-yellow-400 mt-2">${(item.priceCents / 100).toFixed(2)}</p>
                    <p className={`shop-owned text-xs mt-1 ${owned ? 'yes' : 'no'}`}>
                      {owned ? '✓ Owned' : 'Not Owned'}
                    </p>
                    <div className="shop-actions mt-3 gap-2">
                      {owned ? (
                        <button className="btn dark text-sm" onClick={() => equipItem(item.id)}>
                          Equip
                        </button>
                      ) : (
                        <button className="btn gold text-sm" onClick={() => buyItem(item.id)}>
                          Buy
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        )}

        {tab === 'admin' && (
          <Panel title="Admin Sponsor Dashboard" icon={<LayoutDashboard />}>
            <div className="grid md:grid-cols-4 gap-3">
              <Metric label="Sponsors" value={admin.sponsors?.length || 0} />
              <Metric label="Tournaments" value={admin.tournaments?.length || 0} />
              <Metric label="Leagues" value={admin.leagues?.length || 0} />
              <Metric
                label="Cosmetic Revenue"
                value={`$${((admin.cosmeticRevenueCents || 0) / 100).toFixed(2)}`}
              />
            </div>
            <pre className="panel p-4 mt-4 overflow-auto text-xs">{JSON.stringify(admin, null, 2)}</pre>
          </Panel>
        )}
      </section>
    </main>
  );
}

function Aside({ table, log }) {
  return (
    <aside className="panel p-5">
      <ShieldCheck className="inline text-yellow-300" /> <b>Fairness Commit</b>
      <p className="muted text-xs break-all">
        {table?.fairness?.serverSeedHash || 'Start a hand to show commit hash.'}
      </p>
      <h3 className="font-black mt-5">Game Log</h3>
      <div className="game-log-list">
        {log.length ? (
          log.map((entry, index) => (
            <p className="muted text-sm game-log-entry" key={index}>
              {entry}
            </p>
          ))
        ) : (
          <p className="muted text-sm">No events yet.</p>
        )}
      </div>
    </aside>
  );
}

function Panel({ title, icon, children }) {
  return (
    <section className="panel p-5">
      <h2 className="text-2xl font-black flex gap-2 items-center mb-4">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

function Safety() {
  return (
    <div className="p-4 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 mb-4">
      <b>No purchase necessary.</b>
      <p className="muted">
        Purchases do not affect entry, odds, leaderboard score, gameplay, or prize value. Free chips have
        no cash value.
      </p>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="panel p-4">
      <p className="muted">{label}</p>
      <p className="text-3xl font-black">{value}</p>
    </div>
  );
}

function LeagueCard({ l, user, name, post }) {
  const [board, setBoard] = useState([]);

  async function load() {
    const response = await fetch(API + `/leagues/${l.id}/leaderboard`);
    setBoard(await response.json());
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="panel p-4">
      <h3 className="font-black text-xl">{l.name}</h3>
      <p className="muted">
        {l.season} | Sponsor Prize: ${(l.prizeCents / 100).toFixed(2)}
      </p>
      <button
        className="btn gold mt-3"
        onClick={async () => {
          await post(`/leagues/${l.id}/join`, { userId: user?.id, name });
          load();
        }}
      >
        Join League
      </button>
      <button
        className="btn dark mt-3 ml-2"
        onClick={async () => {
          await post(`/leagues/${l.id}/score`, { userId: user?.id, name, xp: 25, wins: 1 });
          load();
        }}
      >
        Demo Add Score
      </button>
      <ol className="mt-4 space-y-1">
        {board.map((b, index) => (
          <li key={b.userId} className="muted">
            #{index + 1} {b.name}: {b.xp} XP / {b.wins} wins
          </li>
        ))}
      </ol>
    </div>
  );
}
