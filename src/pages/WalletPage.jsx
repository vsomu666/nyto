import React, { useState } from 'react';
import { useApp, TIERS } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { SH } from '../components/UI';import { WALLET_BURN, NC_PACKAGES } from '../data/mockData';

// v2 NC transaction type display labels (from addendum doc)
const NC_TYPE_LABELS = {
  check_in:     'Check-in',
  first_visit:  'First Visit Bonus',
  group_checkin:'Group Check-in Bonus',
  dwell:        'Dwell Bonus (60+ min)',
  flic_post:    'FLIC Post Bonus',
  pioneer_vibe: 'Vibe Pioneer Bonus',
  pulse_bonus:  'Pulse Bonus (2×)',
  lucky_roll:   'Lucky 7th Roll',
  referral:     'Referral Bonus',
  redemption:   'Redemption',
  signup:       'Signup Bonus',
  winback:      'Win-back Bonus',
};

const MOCK_TRANSACTIONS = [
  { id: 1, type: 'group_checkin', amount: 150, user: 'Priya S.',   created_at: '2 min ago' },
  { id: 2, type: 'check_in',      amount: 100, user: 'Karthik R.', created_at: '5 min ago' },
  { id: 3, type: 'pulse_bonus',   amount: 200, user: 'Ananya M.',  created_at: '9 min ago' },
  { id: 4, type: 'first_visit',   amount: 100, user: 'Sneha K.',   created_at: '14 min ago' },
  { id: 5, type: 'dwell',         amount:  50, user: 'Priya S.',   created_at: '1 hour ago' },
  { id: 6, type: 'pioneer_vibe',  amount:  25, user: 'Ananya M.',  created_at: '2 hours ago' },
  { id: 7, type: 'lucky_roll',    amount: 300, user: 'Sneha K.',   created_at: '3 hours ago' },
  { id: 8, type: 'flic_post',     amount:  75, user: 'Karthik R.', created_at: '4 hours ago' },
  { id: 9, type: 'redemption',    amount: -500, user: 'Priya S.',  created_at: '1 day ago' },
  { id:10, type: 'referral',      amount: 100, user: 'Priya S.',   created_at: '1 day ago' },
  { id:11, type: 'check_in',      amount: 100, user: 'Rohan D.',   created_at: '6 days ago' },
  { id:12, type: 'winback',       amount: 100, user: 'Nikhil J.',  created_at: '1 week ago' },
];

// NC Economy v2 burn breakdown categories (from addendum)
const BURN_BREAKDOWN = [
  {
    label: 'Check-in rewards',
    desc:  'check_in + group_checkin + dwell + pulse_bonus + lucky_roll',
    value: WALLET_BURN.checkInRewards,
    color: 'var(--in2)',
  },
  {
    label: 'First Visit bonuses',
    desc:  'first_visit',
    value: WALLET_BURN.firstVisitBonuses,
    color: 'var(--pu)',
  },
  {
    label: 'Vibe Pioneer bonuses',
    desc:  'pioneer_vibe — first vibe report of the day at your venue',
    value: WALLET_BURN.vibePioneerBonuses,
    color: 'var(--cy)',
  },
  {
    label: 'Content bonuses',
    desc:  'flic_post + referral',
    value: WALLET_BURN.contentBonuses,
    color: 'var(--gn2)',
  },
  {
    label: 'NYTO cut (5%)',
    desc:  '5% of total redemption value',
    value: WALLET_BURN.nytoCut,
    color: 'var(--mu)',
  },
];

export function WalletPage() {
  const { tier, venue }         = useApp();
  const { activeVenue }         = useAuth();
  const { showToast, showInfo } = useToast();
  const [showTxLog, setShowTxLog] = useState(false);
  const [autoRefill, setAutoRefill] = useState(false);

  const ncBalance = activeVenue?.nc_balance ?? venue?.ncBalance ?? 18400;
  const ncCap     = activeVenue?.nc_cap     ?? venue?.ncCap     ?? 25000;
  const totalBurn = BURN_BREAKDOWN.reduce((s, r) => s + r.value, 0);

  return (
    <div className="view-enter">
      <div className="page-header">
        <div>
          <div className="page-title">NC Wallet</div>
          <div className="page-sub">Your NC balance powers customer rewards · NC Economy v2</div>
        </div>
        <button className="btn btn-sm" onClick={() => setShowTxLog(true)}>Transaction log</button>
      </div>

      <div className="g2">
        {/* ── Balance card ── */}
        <div className="card">
          <SH>Current balance</SH>
          <div className="nc-bal">
            {ncBalance.toLocaleString()}
            <span style={{ fontSize: 18, color: 'var(--mu)', fontWeight: 500 }}> NC</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--mu)', marginTop: 3 }}>
            worth ₹{(ncBalance / 2).toLocaleString()} in customer rewards
          </div>
          <div className="nc-bar">
            <div className="nc-fill" style={{ width: `${Math.min(100, (ncBalance / ncCap) * 100)}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--mu)' }}>
            <span style={{ color: ncBalance < 5000 ? 'var(--rd2)' : 'var(--mu)' }}>
              {ncBalance < 5000 ? '⚠ Low balance — top up soon' : 'Low alert: 5,000 NC'}
            </span>
            <span>{ncBalance.toLocaleString()} / {ncCap.toLocaleString()}</span>
          </div>

          {/* Auto-refill toggle */}
          <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--s1)', borderRadius: 'var(--r)', border: '1px solid var(--b1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500 }}>Auto-refill</div>
              <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 1 }}>
                {tier === TIERS.FREE
                  ? 'Available on Growth tier'
                  : 'Refill to 20,000 NC when balance drops below 5,000'}
              </div>
            </div>
            {tier === TIERS.FREE ? (
              <span className="tag tag-growth">Growth</span>
            ) : (
              <button
                onClick={() => {
                  setAutoRefill(a => !a);
                  showToast(autoRefill ? 'Auto-refill disabled' : 'Auto-refill enabled ✓');
                }}
                style={{
                  width: 40, height: 22, borderRadius: 11, border: 'none',
                  background: autoRefill ? 'var(--gn)' : 'var(--b2)',
                  cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0,
                }}
              >
                <div style={{
                  position: 'absolute', top: 3,
                  left: autoRefill ? 20 : 3,
                  width: 16, height: 16, borderRadius: '50%', background: '#fff',
                  transition: 'left .2s',
                }} />
              </button>
            )}
          </div>

          {/* NC expiry warning */}
          <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(245,158,11,.06)', borderRadius: 'var(--r)', border: '1px solid rgba(245,158,11,.18)', fontSize: 12, color: 'var(--go2)' }}>
            ⏱ NC Economy v2 rule: User NC expires after 6 months · 30-day warning sent automatically
          </div>
        </div>

        {/* ── Burn breakdown ── */}
        <div className="card">
          <SH right={<span style={{ color: 'var(--mu)', textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>This month · v2 categories</span>}>
            NC burn breakdown
          </SH>

          {/* Visual bar */}
          <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 16, gap: 2 }}>
            {BURN_BREAKDOWN.filter(r => r.value > 0).map(r => (
              <div key={r.label} style={{ flex: r.value, background: r.color, borderRadius: 3 }} title={`${r.label}: ${r.value} NC`} />
            ))}
          </div>

          {BURN_BREAKDOWN.map((row, i) => (
            <div key={row.label} style={{ padding: '8px 0', borderBottom: i < BURN_BREAKDOWN.length - 1 ? '1px solid var(--b1)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: row.color, flexShrink: 0 }} />
                  <span style={{ color: 'var(--tx2)' }}>{row.label}</span>
                </div>
                <b>{row.value.toLocaleString()} NC</b>
              </div>
              <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 2, marginLeft: 16 }}>{row.desc}</div>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', marginTop: 8, borderTop: '2px solid var(--b1)', fontSize: 14 }}>
            <span style={{ fontWeight: 600 }}>Total burn this month</span>
            <b style={{ color: 'var(--go)' }}>{totalBurn.toLocaleString()} NC</b>
          </div>

          <div style={{ marginTop: 10, fontSize: 11, color: 'var(--dim)', lineHeight: 1.5 }}>
            Note: Signup bonuses are NYTO-funded and not included in your venue burn.
          </div>
        </div>
      </div>

      {/* ── NC Economy v2 Rules ── */}
      <div className="card mb">
        <SH>NC Economy v2 — locked rules</SH>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {[
            { rule: 'Max NC per check-in event', value: '500 NC hard cap' },
            { rule: 'Multiplier stacking',        value: 'Not allowed — highest only' },
            { rule: 'Max bill discount',           value: '20% off' },
            { rule: 'Max ticket discount',         value: '30% off' },
            { rule: 'Min to redeem',               value: '100 NC' },
            { rule: 'NC expiry',                   value: '6 months · 30d warning' },
            { rule: 'One check-in/venue/day',      value: 'Per user, per venue' },
            { rule: 'Venue promo max multiplier',  value: '2× (Lucky 7th = system only)' },
          ].map(r => (
            <div key={r.rule} style={{ padding: '10px 12px', background: 'var(--s1)', borderRadius: 'var(--r)', border: '1px solid var(--b1)' }}>
              <div style={{ fontSize: 10, color: 'var(--mu)', marginBottom: 4, lineHeight: 1.3 }}>{r.rule}</div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{r.value}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, fontSize: 11, color: 'var(--dim)' }}>
          Enforced at database level · Cannot be overridden by dashboard · Lucky 7th (3×) is applied by system Edge Function only
        </div>
      </div>

      {/* ── Buy NC packages ── */}
      <SH>Buy NC</SH>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 22 }}>
        {NC_PACKAGES.map(pkg => (
          <div
            key={pkg.label}
            className={`pack${pkg.best ? ' best' : ''}`}
            onClick={() => showToast(`Opening Razorpay checkout for ${pkg.nc}…`)}
          >
            {pkg.best && <div className="best-lbl">BEST VALUE</div>}
            <div style={{ fontSize: 12, color: 'var(--mu)', marginBottom: 6 }}>{pkg.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{pkg.nc}</div>
            <div style={{ fontSize: 15, color: 'var(--in2)', fontWeight: 600, marginTop: 2 }}>{pkg.price}</div>
            <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 6 }}>{pkg.perNc} · {pkg.est}</div>
            <button className="btn btn-in btn-sm" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}
              onClick={e => { e.stopPropagation(); showToast(`Razorpay opening for ${pkg.label} — ${pkg.price} ✓`); }}>
              Buy now →
            </button>
          </div>
        ))}
      </div>

      {/* ── Transaction Log Modal ── */}
      {showTxLog && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setShowTxLog(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}
        >
          <div style={{ background: 'var(--bg3)', border: '1px solid var(--b2)', borderRadius: 'var(--r3)', width: '92%', maxWidth: 600, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(0,0,0,.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--b1)' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Transaction log</div>
                <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 2 }}>All NC credits and debits · v2 type labels</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-sm" onClick={() => {
                  const rows = MOCK_TRANSACTIONS.map(tx => [
                    NC_TYPE_LABELS[tx.type] || tx.type,
                    tx.type,
                    tx.user,
                    tx.amount,
                    tx.created_at,
                  ]);
                  const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
                  const csv = [['Type','DB Type','Customer','Amount (NC)','When'].map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = Object.assign(document.createElement('a'), { href: url, download: 'nyto_transactions.csv' }); document.body.appendChild(a); a.click(); document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  showToast('Transaction log exported ✓');
                }}>⬇ Export CSV</button>
                <button onClick={() => setShowTxLog(false)} style={{ background: 'none', border: 'none', color: 'var(--mu)', cursor: 'pointer', fontSize: 18 }}>✕</button>
              </div>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Customer</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_TRANSACTIONS.map(tx => (
                    <tr key={tx.id}>
                      <td>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{NC_TYPE_LABELS[tx.type] || tx.type}</div>
                        <div style={{ fontSize: 10, color: 'var(--dim)', fontFamily: 'monospace' }}>{tx.type}</div>
                      </td>
                      <td style={{ color: 'var(--mu)' }}>{tx.user}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: tx.amount < 0 ? 'var(--rd2)' : 'var(--gn2)' }}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} NC
                      </td>
                      <td style={{ color: 'var(--dim)', fontSize: 11 }}>{tx.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '10px 18px', borderTop: '1px solid var(--b1)', fontSize: 11, color: 'var(--dim)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Showing 12 most recent · Connect Supabase for full history</span>
              <span>Total this month: {totalBurn.toLocaleString()} NC burned</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
