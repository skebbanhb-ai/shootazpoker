import React, { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import {
  Crown,
  Flame,
  LayoutDashboard,
  ShieldCheck,
  ShoppingBag,
  Trophy,
  User,
} from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const socket = io(API);
const MAX_SEATS = 6;

function Card({ c }) {
  const red = c?.includes('H') || c?.includes('D');
  return <span className={`cardx ${red ? 'red' : ''}`}>{c}</span>;
}

function useApi(path, initial = []) {
  const [data, setData] = useState(initial);
  const load = () =>
    fetch(API + path)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  useEffect(load, []);
  return [data, load, setData];
}

function buildSeatData(players = [], maxSeats = MAX_SEATS) {
  return Array.from({ length: maxSeats }, (_, index) => players[index] || null);
}

function TableTab({ table, name, join, ev, log }) {
  const players = table?.players || [];
  const seats = useMemo(() => buildSeatData(players), [players]);
  const currentTurnName = players[table?.turn]?.name || 'Waiting for hand start';

  return (
    <div className="table-layout">
      <section className="panel p-4 md:p-5">
        <div className="premium-table-wrap">
          <div className="table-felt">
            <div className="table-center">
              <p className="table-label">Community Cards</p>
              <div className="community-row">
                {table?.community?.length ? (
                  table.community.map((c, i) => <Card key={i} c={c} />)
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

              return (
                <article key={player?.id || `empty-${index}`} className={seatClass}>
                  {player ? (
                    <>
                      <div className="seat-headline">
                        <b>{player.name}</b>
                        {isFolded ? <span className="seat-tag">Folded</span> : null}
                      </div>
                      <p className="muted text-xs">Stack: {player.chips} chips</p>
                      <p className="muted text-xs">Bet: {player.currentBet || 0}</p>
                      <div className="seat-cards">
                        {(player.cards || ['🂠', '🂠']).map((c, j) => (
                          <Card key={j} c={c} />
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="empty-seat-icon">
                        <User size={16} />
                      </div>
                      <p className="muted text-xs">Empty Seat</p>
                    </>
                  )}
                </article>
              );
            })}
          </div>
        </div>

        <div className="controls-grid mt-4">
          <button className="btn gold" onClick={join}>
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
          <button className="btn dark" onClick={() => ev('action:raise', { amount: 50 })}>
            Raise 50
          </button>
          <button className="btn dark" onClick={() => ev('street:next')}>
            Next Street
          </button>
        </div>
      </section>
      <Aside table={table} log={log} />
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState('table');
  const [name, setName] = useState('Shooter');
  const [user, setUser] = useState(null);
  const [table, setTable] = useState(null);
  const [log, setLog] = useState([]);
  const [tours, loadTours] = useApi('/tournaments');
  const [leagues, loadLeagues] = useApi('/leagues');
  const [shop] = useApi('/shop/catalog');
  const [admin, loadAdmin] = useApi('/admin/dashboard', {});

  useEffect(() => {
    socket.on('table:update', setTable);
    socket.on('hand:result', (r) =>
      setLog((x) => [`Winner: ${r.winnerName}. Fairness seed revealed.`, ...x]),
    );
    socket.on('error:game', (m) => setLog((x) => [m, ...x]));
    return () => socket.off();
  }, []);

  async function login() {
    const r = await fetch(API + '/auth/demo-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const j = await r.json();
    setUser(j.user);
  }

  const join = () => socket.emit('table:join', { name });
  const ev = (e, p = {}) => socket.emit(e, { tableId: 'main-free', ...p });

  async function post(path, body) {
    const r = await fetch(API + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    setLog((x) => [j.error || j.disclosure || 'Success', ...x]);
    loadTours();
    loadLeagues();
    loadAdmin();
    return j;
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
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            <button className="btn gold" onClick={login}>
              {user ? 'Logged In' : 'Demo Login'}
            </button>
          </div>
        </header>

        <nav className="flex flex-wrap gap-2 mb-5">
          {[
            ['table', 'Table', Flame],
            ['tournaments', 'Tournaments', Trophy],
            ['league', 'Creator League', Crown],
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

        {tab === 'table' && <TableTab table={table} name={name} join={join} ev={ev} log={log} />}

        {tab === 'tournaments' && (
          <Panel title="Sponsored Prize Tournaments" icon={<Trophy />}>
            <Safety />
            <div className="grid md:grid-cols-2 gap-4">
              {tours.map((t) => (
                <div className="panel p-4" key={t.id}>
                  <h3 className="font-black text-xl">{t.name}</h3>
                  <p className="muted">
                    Entry: FREE | Prize: ${(t.prizeCents / 100).toFixed(2)} | Source: {t.prizeSource}
                  </p>
                  <p className="muted">
                    Entrants: {t.entrants.length} | Rules: {t.rulesVersion}
                  </p>
                  <button
                    className="btn gold mt-3"
                    onClick={() => post(`/tournaments/${t.id}/enter`, { userId: user?.id })}
                  >
                    Enter Free
                  </button>
                  <button
                    className="btn dark mt-3 ml-2"
                    onClick={() => post(`/tournaments/${t.id}/accept-rules`, { userId: user?.id })}
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
              {leagues.map((l) => (
                <LeagueCard key={l.id} l={l} user={user} name={name} post={post} />
              ))}
            </div>
          </Panel>
        )}

        {tab === 'shop' && (
          <Panel title="Cosmetic Shop / VIP" icon={<ShoppingBag />}>
            <Safety />
            <div className="grid md:grid-cols-4 gap-4">
              {shop.map((i) => (
                <div className="panel p-4" key={i.id}>
                  <h3 className="font-black">{i.name}</h3>
                  <p className="muted">{i.type}</p>
                  <p className="text-2xl font-black">${(i.priceCents / 100).toFixed(2)}</p>
                  <p className="muted text-sm">Prize impact: none</p>
                  <button
                    className="btn gold mt-3"
                    onClick={() => post('/shop/purchase', { userId: user?.id, itemId: i.id })}
                  >
                    Buy Cosmetic
                  </button>
                </div>
              ))}
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
      {log.length ? (
        log.map((l, i) => (
          <p className="muted text-sm" key={i}>
            {l}
          </p>
        ))
      ) : (
        <p className="muted text-sm">No events yet.</p>
      )}
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
        Purchases do not affect entry, odds, leaderboard score, gameplay, or prize value. Free chips
        have no cash value.
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
    const r = await fetch(API + `/leagues/${l.id}/leaderboard`);
    setBoard(await r.json());
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
        {board.map((b, i) => (
          <li key={b.userId} className="muted">
            #{i + 1} {b.name}: {b.xp} XP / {b.wins} wins
          </li>
        ))}
      </ol>
    </div>
  );
}
