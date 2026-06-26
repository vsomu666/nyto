import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp, TIERS } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { SH, Avatar, ProgressBar } from '../components/UI';
import { CUSTOMERS, LOST_REGULARS, QUICK_REPLIES } from '../data/mockData';
import { useReviews, useCustomers, useLostRegulars } from '../lib/useSupabase';

// ─── CSV export helper (real download, no third-party needed) ───
function downloadCSV(filename, headers, rows) {
  const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── Conversation store shared between Customers → Messaging ───
// We use a module-level ref so state persists across page navigations
const CONVO_STORE = {
  convos: [
    { id: 'priya',   name: 'Priya S.',   initials: 'PS', color: 'linear-gradient(135deg,#6366f1,#a78bfa)', lastMsg: 'Is the rooftop open tonight?', time: '2:14 PM', unread: 1 },
    { id: 'karthik', name: 'Karthik R.', initials: 'KR', color: 'linear-gradient(135deg,#22d3ee,#6366f1)', lastMsg: 'Do you have a table for 4?',   time: '3:02 PM', unread: 1 },
    { id: 'ananya',  name: 'Ananya M.',  initials: 'AM', color: 'linear-gradient(135deg,#ec4899,#f59e0b)', lastMsg: 'Thanks!',                        time: 'Yesterday', unread: 0 },
    { id: 'sneha',   name: 'Sneha K.',   initials: 'SK', color: 'linear-gradient(135deg,#f97316,#ef4444)', lastMsg: '',                               time: '',          unread: 0 },
    { id: 'nikhil',  name: 'Nikhil J.',  initials: 'NJ', color: 'linear-gradient(135deg,#8b5cf6,#6366f1)', lastMsg: '',                               time: '',          unread: 0 },
  ],
  threads: {
    priya:   [
      { id: 1, type: 'in',  name: 'Priya S.',  text: 'Hi! Is the rooftop open tonight?',                              time: '2:14 PM' },
      { id: 2, type: 'out',                     text: "Yes! We're open from 6 PM. DJ set starts at 9. See you soon 🙌", time: '2:16 PM' },
    ],
    karthik: [
      { id: 3, type: 'in',  name: 'Karthik R.', text: 'Do you have a table for 4 this Saturday?', time: '3:02 PM' },
    ],
    ananya:  [
      { id: 4, type: 'in',  name: 'Ananya M.',  text: 'The cocktails last night were amazing!', time: 'Yesterday' },
      { id: 5, type: 'out',                      text: 'Thank you so much Ananya! 🙌 See you soon.',  time: 'Yesterday' },
    ],
    sneha:   [],
    nikhil:  [],
  },
  listeners: [],
  subscribe(fn) { this.listeners.push(fn); return () => { this.listeners = this.listeners.filter(l => l !== fn); }; },
  notify()      { this.listeners.forEach(fn => fn()); },

  sendMsg(convoId, text) {
    const msg = { id: Date.now(), type: 'out', text, time: 'Just now' };
    if (!this.threads[convoId]) this.threads[convoId] = [];
    this.threads[convoId] = [...this.threads[convoId], msg];
    // Update convo last message
    this.convos = this.convos.map(c => c.id === convoId ? { ...c, lastMsg: text, time: 'Just now', unread: 0 } : c);
    this.notify();
  },

  openConvo(name) {
    // called from Customers → Message button, opens convo by name
    const c = this.convos.find(x => x.name === name);
    if (c) { this.activeFromCustomer = c.id; this.notify(); }
    else {
      // Create new convo
      const id = name.split(' ')[0].toLowerCase();
      const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
      this.convos = [...this.convos, { id, name, initials, color: 'linear-gradient(135deg,#6366f1,#a78bfa)', lastMsg: '', time: 'New', unread: 0 }];
      if (!this.threads[id]) this.threads[id] = [];
      this.activeFromCustomer = id;
      this.notify();
    }
  },

  markRead(convoId) {
    this.convos = this.convos.map(c => c.id === convoId ? { ...c, unread: 0 } : c);
    this.notify();
  },

  activeFromCustomer: null,
};

/* ═══════════════════════════════════════════════════════
   REVIEWS PAGE — with real CSV export + saved replies
═══════════════════════════════════════════════════════ */
export function ReviewsPage() {
  const { tier } = useApp();
  const { showToast, showError } = useToast();
  const { reviews, reply: _saveReply } = useReviews();
  const [replyText, setReplyText] = useState({});
  const [filter, setFilter]       = useState('All');
  const [flagged, setFlagged]     = useState({});

  const avgRating = (reviews.reduce((s, r) => s + r.stars, 0) / reviews.length).toFixed(1);

  // Filter logic
  const filtered = filter === 'All'       ? reviews
    : filter === '5★'                     ? reviews.filter(r => r.stars === 5)
    : filter === '4★ & below'             ? reviews.filter(r => r.stars <= 4)
    : filter === 'Unanswered'             ? reviews.filter(r => !r.replied)
    : filter === 'Replied'                ? reviews.filter(r => r.replied)
    : reviews;

  // Save reply (persists in local state = "saved")
  const doReply = (idx) => {
    const text = replyText[idx]?.trim();
    if (!text) { showError('Please type a reply first'); return; }
    const rev = filtered[idx];
    _saveReply(rev?.id ?? idx, text);
    setReplyText(t => ({ ...t, [idx]: '' }));
    showToast('Reply posted publicly ✓ — visible to all NYTO users');
  };

  const editReply = (idx) => {
    const rev = filtered[idx];
    _saveReply(rev?.id ?? idx, '');
    showToast('Reply removed — you can write a new one');
  };

  const flagReview = (idx) => {
    setFlagged(f => ({ ...f, [idx]: !f[idx] }));
    showToast(flagged[idx] ? 'Flag removed' : 'Review flagged for NYTO moderation');
  };

  // Real CSV export
  const handleExport = () => {
    const rows = reviews.map(r => [r.name, r.stars, r.text, r.time, r.replied ? 'Yes' : 'No', r.reply || '']);
    downloadCSV('nyto_reviews.csv', ['Customer', 'Rating', 'Review', 'Date', 'Replied', 'Reply text'], rows);
    showToast('Reviews exported as nyto_reviews.csv ✓');
  };

  return (
    <div className="view-enter">
      <div className="page-header">
        <div><div className="page-title">Reviews</div><div className="page-sub">Manage and respond to customer reviews</div></div>
        <div className="page-actions">
          <button className="btn btn-sm" onClick={handleExport}>⬇ Export CSV</button>
        </div>
      </div>

      <div className="g4" style={{ marginBottom: 18 }}>
        <div className="stat"><div className="stat-lbl">Avg rating</div><div className="stat-val" style={{ color: 'var(--go2)' }}>{avgRating}★</div></div>
        <div className="stat"><div className="stat-lbl">Total reviews</div><div className="stat-val">142</div><div className="stat-d up">↑ 12 this month</div></div>
        <div className="stat"><div className="stat-lbl">5-star reviews</div><div className="stat-val" style={{ color: 'var(--gn2)' }}>78%</div></div>
        <div className="stat"><div className="stat-lbl">Response rate</div><div className="stat-val">{tier === TIERS.FREE ? '—' : '94%'}</div>{tier === TIERS.FREE && <div className="stat-b">Growth feature</div>}</div>
      </div>

      {/* Filter chips */}
      <div className="chips">
        {['All', '5★', '4★ & below', 'Unanswered', 'Replied'].map(f => (
          <button key={f} className={`chip${filter === f ? ' on' : ''}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      <div className="card">
        {filtered.length === 0 && (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--mu)', fontSize: 13 }}>No reviews match this filter</div>
        )}
        {filtered.map((r, idx) => {
          const realIdx = reviews.indexOf(r);
          return (
            <div className="rrow" key={realIdx} style={{ opacity: flagged[realIdx] ? 0.5 : 1, transition: 'opacity .2s' }}>
              <div className="cav" style={{ background: r.color }}>{r.initials}</div>
              <div className="rbody">
                <div className="rhd">
                  <b style={{ fontSize: 13 }}>{r.name}</b>
                  <span className="stars">{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</span>
                  <span style={{ fontSize: 11, color: 'var(--dim)' }}>{r.time}</span>
                  {flagged[realIdx] && <span style={{ fontSize: 10, color: 'var(--rd2)', fontWeight: 600 }}>FLAGGED</span>}
                </div>

                <div style={{ fontSize: 13, color: 'var(--tx2)', lineHeight: 1.6, marginBottom: 8 }}>{r.text}</div>

                {/* Existing reply */}
                {r.replied && r.reply && (
                  <div style={{ marginBottom: 8, padding: '8px 12px', background: 'rgba(99,102,241,.07)', borderRadius: 7, border: '1px solid rgba(99,102,241,.15)', fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                      <b style={{ fontSize: 11, color: 'var(--in2)' }}>Your reply</b>
                      {tier !== TIERS.FREE && (
                        <button onClick={() => editReply(realIdx)} style={{ background: 'none', border: 'none', fontSize: 10, color: 'var(--mu)', cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
                      )}
                    </div>
                    <div style={{ color: 'var(--tx2)' }}>{r.reply}</div>
                  </div>
                )}

                {/* Reply input */}
                {!r.replied && (
                  tier === TIERS.FREE
                    ? <div className="rdis">🔒 Reply to reviews on Growth tier</div>
                    : (
                      <div style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
                        <input
                          placeholder="Write a public reply — press Enter to post…"
                          value={replyText[realIdx] || ''}
                          onChange={e => setReplyText(t => ({ ...t, [realIdx]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && doReply(realIdx)}
                          style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--b1)', borderRadius: 7, padding: '7px 10px', color: 'var(--tx)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
                          onFocus={e => e.target.style.borderColor = 'var(--in)'}
                          onBlur={e  => e.target.style.borderColor = 'var(--b1)'}
                        />
                        <button className="btn btn-in btn-sm" onClick={() => doReply(realIdx)}>Reply</button>
                      </div>
                    )
                )}

                {/* Action row */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-xs"
                    style={{ color: flagged[realIdx] ? 'var(--rd2)' : 'var(--mu)', borderColor: flagged[realIdx] ? 'rgba(239,68,68,.3)' : 'var(--b1)' }}
                    onClick={() => flagReview(realIdx)}
                  >
                    {flagged[realIdx] ? '⚑ Unflag' : '⚑ Flag'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   CUSTOMERS PAGE — Export + Message button navigates to Messaging
═══════════════════════════════════════════════════════ */
export function CustomersPage({ onNav }) {
  const { showToast } = useToast();
  const [filter, setFilter]     = useState('All');
  const { customers } = useCustomers();  // real Supabase, falls back to mock
  const [vipOverrides, setVipOverrides] = useState({});  // local VIP toggles
  const [search, setSearch]     = useState('');
  const filters = ['All', 'VIP', 'Active', 'Lapsed'];

  const filtered = customers
    .filter(c => {
      if (search) return c.name.toLowerCase().includes(search.toLowerCase());
      if (filter === 'All')    return true;
      if (filter === 'VIP')    return c.tag === 'VIP';
      return c.status === filter;
    });

  const handleExport = () => {
    const rows = filtered.map(c => [c.name, c.visits, c.spend, c.lastVisit, c.status, c.tag || '']);
    downloadCSV('nyto_customers.csv', ['Customer', 'Visits', 'Avg Spend', 'Last Visit', 'Status', 'Tag'], rows);
    showToast('Customer list exported as nyto_customers.csv ✓');
  };

  const handleMessage = (customerName) => {
    CONVO_STORE.openConvo(customerName);
    showToast(`Opening conversation with ${customerName}…`);
    if (onNav) onNav('messaging');
  };

  const toggleVIP = (c) => {
    const isVip = vipOverrides[c.name] !== undefined ? vipOverrides[c.name] : c.tag === 'VIP';
    setVipOverrides(v => ({ ...v, [c.name]: !isVip }));
    showToast(!isVip ? `${c.name} marked as VIP ✓` : `${c.name} VIP status removed`);
  };

  return (
    <div className="view-enter">
      <div className="page-header">
        <div><div className="page-title">Customer Database</div><div className="page-sub">Every customer who has checked in at your venue</div></div>
        <div className="page-actions">
          <button className="btn btn-sm" onClick={handleExport}>⬇ Export CSV</button>
        </div>
      </div>

      <div className="g4" style={{ marginBottom: 18 }}>
        <div className="stat"><div className="stat-lbl">Total customers</div><div className="stat-val">1,847</div></div>
        <div className="stat"><div className="stat-lbl">VIP customers</div><div className="stat-val" style={{ color: 'var(--go2)' }}>86</div></div>
        <div className="stat"><div className="stat-lbl">Active (30d)</div><div className="stat-val" style={{ color: 'var(--gn2)' }}>634</div></div>
        <div className="stat"><div className="stat-lbl">Avg lifetime value</div><div className="stat-val">₹8,400</div></div>
      </div>

      {/* Filter + search row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div className="chips" style={{ marginBottom: 0 }}>
          {filters.map(f => (
            <button key={f} className={`chip${filter === f ? ' on' : ''}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search by name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginLeft: 'auto', background: 'var(--bg)', border: '1px solid var(--b1)', borderRadius: 8, padding: '6px 12px', color: 'var(--tx)', fontSize: 12, fontFamily: 'inherit', outline: 'none', width: 200 }}
          onFocus={e => e.target.style.borderColor = 'var(--in)'}
          onBlur={e  => e.target.style.borderColor = 'var(--b1)'}
        />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="tbl">
          <thead>
            <tr><th>Customer</th><th>Visits</th><th>Avg spend</th><th>Last visit</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => {
              const realIdx = customers.indexOf(c);
              return (
                <tr key={i}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <Avatar initials={c.initials} color={c.color} />
                      <div>
                        <div style={{ fontWeight: 500 }}>{c.name}</div>
                        {c.tag && <span className="tag tag-vip" style={{ fontSize: 9 }}>{c.tag}</span>}
                      </div>
                    </div>
                  </td>
                  <td>{c.visits}</td>
                  <td>{c.spend}</td>
                  <td style={{ color: c.lastVisit === 'Today' ? 'var(--gn2)' : c.status === 'Lapsed' ? 'var(--mu)' : 'var(--tx2)' }}>{c.lastVisit}</td>
                  <td><span className={`tag tag-${c.status === 'Active' ? 'ok' : 'risk'}`}>{c.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-xs btn-in"
                        onClick={() => handleMessage(c.name)}
                        title="Open in Messaging"
                      >
                        ✉ Message
                      </button>
                      <button
                        className="btn btn-xs"
                        onClick={() => toggleVIP(c)}
                        title={(vipOverrides[c.name] !== undefined ? vipOverrides[c.name] : c.tag === 'VIP') ? 'Remove VIP' : 'Mark as VIP'}
                        style={{ color: (vipOverrides[c.name] !== undefined ? vipOverrides[c.name] : c.tag === 'VIP') ? 'var(--go2)' : 'var(--mu)' }}
                      >
                        {(vipOverrides[c.name] !== undefined ? vipOverrides[c.name] : c.tag === 'VIP') ? '★ VIP' : '☆ VIP'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--mu)', padding: '28px 0', fontSize: 13 }}>No customers match "{search}"</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   LOST REGULARS — with Message button → Messaging
═══════════════════════════════════════════════════════ */
export function LostRegularsPage({ onNav }) {
  const { showToast } = useToast();
  const [sent, setSent]     = useState({});
  const [filter, setFilter] = useState('All (18)');
  const filters = ['All (18)', 'High value (8)', '30+ days (11)', '60+ days (3)'];

  const handleWinBack = (i, name) => {
    setSent(s => ({ ...s, [i]: true }));
    showToast(`100 NC sent to ${name} — they'll see a push notification ✓`);
  };

  const handleSendAll = () => {
    const newSent = {};
    LOST_REGULARS.forEach((_, i) => { newSent[i] = true; });
    setSent(newSent);
    showToast('Win-back NC sent to all 18 lost regulars ✓');
  };

  const handleMessage = (customerName) => {
    CONVO_STORE.openConvo(customerName);
    showToast(`Opening conversation with ${customerName}…`);
    if (onNav) onNav('messaging');
  };

  return (
    <div className="view-enter">
      <div className="page-header">
        <div><div className="page-title">Lost Regulars</div><div className="page-sub">18 customers haven't visited in 21+ days. Win them back with one tap.</div></div>
        <button className="btn btn-rd btn-sm" onClick={handleSendAll}>Send all 100 NC (1,800 NC)</button>
      </div>

      <div className="g4">
        <div className="stat"><div className="stat-lbl">Lost regulars</div><div className="stat-val" style={{ color: 'var(--rd2)' }}>18</div><div className="stat-d dn">↑ 4 this week</div></div>
        <div className="stat"><div className="stat-lbl">Avg prior visits</div><div className="stat-val">9.2</div></div>
        <div className="stat"><div className="stat-lbl">Est. lost revenue/mo</div><div className="stat-val" style={{ color: 'var(--go2)' }}>₹12,400</div></div>
        <div className="stat"><div className="stat-lbl">Win-back rate</div><div className="stat-val" style={{ color: 'var(--gn2)' }}>61%</div><div className="stat-b">Industry avg: 32%</div></div>
      </div>

      <div className="chips">
        {filters.map(f => (
          <button key={f} className={`chip${filter === f ? ' on' : ''}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="tbl">
          <thead><tr><th>Customer</th><th>Visits</th><th>Avg spend</th><th>Last seen</th><th>Risk</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
          <tbody>
            {LOST_REGULARS.map((c, i) => (
              <tr key={i}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <Avatar initials={c.initials} color={c.color} />
                    <div style={{ fontWeight: 500 }}>
                      {c.name} {c.tag && <span className="tag tag-vip" style={{ marginLeft: 4 }}>{c.tag}</span>}
                    </div>
                  </div>
                </td>
                <td>{c.visits}</td>
                <td>{c.spend}</td>
                <td style={{ color: c.daysAgo >= 30 ? 'var(--rd2)' : 'var(--go2)' }}>{c.daysAgo} days ago</td>
                <td><span className={`tag tag-${c.risk === 'HIGH' ? 'lost' : 'risk'}`}>{c.risk}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    {sent[i]
                      ? <span style={{ fontSize: 12, color: 'var(--gn2)', fontWeight: 600 }}>✓ NC Sent</span>
                      : <button className="btn btn-in btn-sm" onClick={() => handleWinBack(i, c.name)}>Send 100 NC</button>
                    }
                    <button className="btn btn-xs" onClick={() => handleMessage(c.name)}>✉ Message</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   DEAD HOUR FILLER — with saved settings
═══════════════════════════════════════════════════════ */
export function DeadHourPage() {
  const { showToast } = useToast();
  const [promoActive, setPromoActive] = useState(false);
  const [config, setConfig]           = useState({ multiplier: '2', duration: '2', maxCI: '20', radius: '1km' });
  const [scheduled, setScheduled]     = useState([
    { slot: 'Tue 3–5 PM', severity: 85, label: 'CRITICAL', cls: 'lost', enabled: false },
    { slot: 'Mon 2–5 PM', severity: 72, label: 'HIGH',     cls: 'lost', enabled: false },
    { slot: 'Wed 2–4 PM', severity: 58, label: 'MED',      cls: 'risk', enabled: false },
    { slot: 'Thu 3–4 PM', severity: 41, label: 'LOW',      cls: 'ok',   enabled: false },
  ]);
  const [savedConfig, setSavedConfig] = useState(null);

  const updateConfig = f => e => setConfig(c => ({ ...c, [f]: e.target.value }));

  const saveConfig = () => {
    setSavedConfig({ ...config });
    showToast('Dead hour settings saved ✓');
  };

  const toggleSchedule = (idx) => {
    setScheduled(ss => ss.map((s, i) => {
      if (i !== idx) return s;
      const next = !s.enabled;
      showToast(next ? `Auto-promo scheduled for ${s.slot} ✓` : `Schedule removed for ${s.slot}`);
      return { ...s, enabled: next };
    }));
  };

  const activatePromo = () => {
    setPromoActive(true);
    showToast(`Dead hour promo activated! ${config.multiplier}× NC for ${config.duration}h · ${config.maxCI} check-ins · users within ${config.radius} notified ✓`);
  };

  return (
    <div className="view-enter">
      <div className="page-header">
        <div><div className="page-title">Dead Hour Filler</div><div className="page-sub">Turn your slowest slots into revenue with automated NC promotions</div></div>
      </div>

      {/* Action banner */}
      <div className="card card-go mb">
        <div style={{ fontSize: 10, color: 'var(--go)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: 6 }}>⚠ Action recommended</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--go2)', marginBottom: 6 }}>Tuesday 3–5 PM is your deadest slot</div>
        <div style={{ fontSize: 13, color: 'var(--tx2)', lineHeight: 1.6, marginBottom: 14 }}>
          Average <b>6 check-ins</b> vs <b>42+</b> at peak. A {config.multiplier}× NC promo will push nearby users during this window.
          Estimated uplift: <span style={{ color: 'var(--gn2)', fontWeight: 600 }}>+18 check-ins/week (~₹21,000/month)</span>.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
          {[{ label: 'Slot avg', val: '6' }, { label: 'Peak avg', val: '42' }, { label: 'Est uplift', val: '+300%', color: 'var(--gn2)' }, { label: 'NC cost/wk', val: '~360' }].map(s => (
            <div key={s.label} style={{ padding: 10, background: 'var(--s1)', borderRadius: 'var(--r)', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--mu)' }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {promoActive
            ? <button className="btn btn-rd" onClick={() => { setPromoActive(false); showToast('Dead hour promo stopped'); }}>⏸ Stop promo</button>
            : <button className="btn btn-go" onClick={activatePromo}>⚡ Activate {config.multiplier}× NC now</button>
          }
        </div>
        {promoActive && (
          <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.2)', borderRadius: 'var(--r)', fontSize: 12, color: 'var(--gn2)' }}>
            ● Promo running — {config.multiplier}× NC for {config.duration}h · max {config.maxCI} check-ins · within {config.radius}
          </div>
        )}
      </div>

      <div className="g2">
        {/* Config card — with save button */}
        <div className="card">
          <SH right={
            savedConfig
              ? <span style={{ color: 'var(--gn2)', textTransform: 'none', letterSpacing: 0, fontWeight: 400, fontSize: 11 }}>✓ Saved</span>
              : null
          }>Configure promo</SH>

          <div className="field">
            <label>Multiplier (max 2× per v2 rules)</label>
            <select value={config.multiplier} onChange={updateConfig('multiplier')}>
              <option value="2">2× NC (recommended · max)</option>
              <option value="1.5">1.5× NC</option>
            </select>
          </div>
          <div className="field">
            <label>Duration</label>
            <select value={config.duration} onChange={updateConfig('duration')}>
              <option value="1">1 hour</option>
              <option value="2">2 hours</option>
              <option value="3">3 hours</option>
            </select>
          </div>
          <div className="field">
            <label>Max check-ins at boost</label>
            <select value={config.maxCI} onChange={updateConfig('maxCI')}>
              <option value="10">10 check-ins</option>
              <option value="20">20 check-ins</option>
              <option value="30">30 check-ins</option>
              <option value="0">Unlimited</option>
            </select>
          </div>
          <div className="field" style={{ marginBottom: 16 }}>
            <label>Target radius</label>
            <select value={config.radius} onChange={updateConfig('radius')}>
              <option value="500m">500m</option>
              <option value="1km">1km</option>
              <option value="2km">2km</option>
            </select>
          </div>
          <button className="btn btn-in" onClick={saveConfig}>Save settings</button>
        </div>

        {/* Slot analysis — with schedule toggles */}
        <div className="card">
          <SH>Dead slot analysis — tap to auto-schedule</SH>
          {scheduled.map((s, i) => (
            <div key={s.slot} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{s.slot}</span>
                  <span className={`tag tag-${s.cls}`} style={{ fontSize: 9 }}>{s.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, color: s.enabled ? 'var(--gn2)' : 'var(--dim)' }}>{s.enabled ? 'Scheduled' : 'Off'}</span>
                  <button
                    onClick={() => toggleSchedule(i)}
                    style={{ width: 34, height: 18, borderRadius: 9, border: 'none', background: s.enabled ? 'var(--gn)' : 'var(--b2)', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}
                  >
                    <div style={{ position: 'absolute', top: 2, left: s.enabled ? 17 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
                  </button>
                </div>
              </div>
              <ProgressBar value={s.severity} color={s.severity > 70 ? 'var(--rd2)' : s.severity > 50 ? 'var(--or)' : 'var(--mu)'} />
            </div>
          ))}
          <div style={{ marginTop: 4, fontSize: 11, color: 'var(--mu)', lineHeight: 1.5 }}>
            Toggling a slot on auto-schedules your saved config to run every week during that window.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MESSAGING — persistent threads, linked from Customers
═══════════════════════════════════════════════════════ */
export function MessagingPage() {
  const { showToast } = useToast();

  // Subscribe to CONVO_STORE so we re-render on updates from other pages
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const unsub = CONVO_STORE.subscribe(() => forceUpdate(n => n + 1));
    return unsub;
  }, []);

  const [activeId, setActiveId] = useState(() => CONVO_STORE.activeFromCustomer || 'priya');
  const [input, setInput]       = useState('');
  const chatEndRef              = useRef(null);

  // If a customer page routed us here with a specific convo, open it
  useEffect(() => {
    if (CONVO_STORE.activeFromCustomer) {
      setActiveId(CONVO_STORE.activeFromCustomer);
      CONVO_STORE.activeFromCustomer = null;
    }
  });

  const activeConvo   = CONVO_STORE.convos.find(c => c.id === activeId) || CONVO_STORE.convos[0];
  const thread        = CONVO_STORE.threads[activeId] || [];
  const totalUnread   = CONVO_STORE.convos.reduce((s, c) => s + (c.unread || 0), 0);

  // Auto-scroll to bottom when thread changes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread.length, activeId]);

  const selectConvo = (id) => {
    setActiveId(id);
    CONVO_STORE.markRead(id);
    setInput('');
  };

  const sendMsg = () => {
    const text = input.trim();
    if (!text) return;
    CONVO_STORE.sendMsg(activeId, text);
    setInput('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
  };

  // Customer info for active convo (from CUSTOMERS list)
  const custInfo = CUSTOMERS.find(c => c.name === activeConvo?.name);

  return (
    <div className="view-enter">
      <div className="page-header">
        <div>
          <div className="page-title">
            Messaging
            {totalUnread > 0 && (
              <span style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: '50%', background: 'var(--rd)', fontSize: 10, fontWeight: 700 }}>
                {totalUnread}
              </span>
            )}
          </div>
          <div className="page-sub">Direct messages with customers · press Enter to send</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 220px', gap: 14, height: 'calc(100vh - 200px)', minHeight: 520 }}>

        {/* ── Conversation list ── */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--b1)', fontSize: 12, fontWeight: 600 }}>
            Conversations
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {CONVO_STORE.convos.map((c) => (
              <div
                key={c.id}
                onClick={() => selectConvo(c.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
                  borderBottom: '1px solid var(--b1)', cursor: 'pointer',
                  background: activeId === c.id ? 'rgba(99,102,241,.12)' : 'transparent',
                  borderLeft: activeId === c.id ? '2px solid var(--in)' : '2px solid transparent',
                  transition: 'all .12s',
                }}
                onMouseEnter={e => { if (activeId !== c.id) e.currentTarget.style.background = 'var(--s1)'; }}
                onMouseLeave={e => { if (activeId !== c.id) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ position: 'relative' }}>
                  <div className="cav" style={{ background: c.color }}>{c.initials}</div>
                  {c.unread > 0 && (
                    <div style={{ position: 'absolute', top: -3, right: -3, width: 14, height: 14, borderRadius: '50%', background: 'var(--rd)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#fff', border: '1px solid var(--bg2)' }}>
                      {c.unread}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: c.unread > 0 ? 700 : 500, color: c.unread > 0 ? 'var(--tx)' : 'var(--tx2)' }}>{c.name}</span>
                    <span style={{ fontSize: 10, color: 'var(--dim)' }}>{c.time}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--mu)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{c.lastMsg || 'No messages yet'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Chat thread ── */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Chat header */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="cav" style={{ background: activeConvo?.color }}>{activeConvo?.initials}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{activeConvo?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--mu)' }}>{custInfo ? `${custInfo.visits} visits · ${custInfo.spend} avg spend` : 'Customer'}</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {thread.length === 0 && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mu)', fontSize: 13 }}>
                No messages yet — say hello!
              </div>
            )}
            {thread.map(m => (
              <div key={m.id} className={`msg msg-${m.type}`}>
                {m.type === 'in' && m.name && <div style={{ fontSize: 10, color: 'var(--mu)', marginBottom: 3 }}>{m.name}</div>}
                <div className="msg-bubble">{m.text}</div>
                <div className="msg-time">{m.time}</div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Quick replies */}
          <div style={{ padding: '7px 14px', display: 'flex', gap: 6, flexWrap: 'wrap', borderTop: '1px solid var(--b1)', background: 'var(--s1)' }}>
            {QUICK_REPLIES.map((r, i) => (
              <button key={i} className="btn btn-xs" onClick={() => setInput(r)} style={{ fontSize: 11 }}>
                {r.length > 30 ? r.slice(0, 30) + '…' : r}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderTop: '1px solid var(--b1)' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type a message… (Enter to send)"
              style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--b1)', borderRadius: 8, padding: '8px 12px', color: 'var(--tx)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = 'var(--in)'}
              onBlur={e  => e.target.style.borderColor = 'var(--b1)'}
            />
            <button className="btn btn-in btn-sm" onClick={sendMsg} disabled={!input.trim()}>Send</button>
          </div>
        </div>

        {/* ── Customer sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card" style={{ padding: 14 }}>
            <SH>Customer info</SH>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div className="cav" style={{ background: activeConvo?.color, width: 36, height: 36, fontSize: 12 }}>{activeConvo?.initials}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{activeConvo?.name}</div>
                {custInfo?.tag && <span className="tag tag-vip" style={{ fontSize: 9 }}>{custInfo.tag}</span>}
              </div>
            </div>
            {custInfo ? (
              <>
                {[
                  { label: 'Total visits', val: custInfo.visits },
                  { label: 'Avg spend',    val: custInfo.spend },
                  { label: 'Last visit',   val: custInfo.lastVisit },
                  { label: 'Status',       val: custInfo.status },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 0', borderBottom: '1px solid var(--b1)' }}>
                    <span style={{ color: 'var(--mu)' }}>{r.label}</span>
                    <b style={{ color: r.label === 'Status' && r.val === 'Lapsed' ? 'var(--rd2)' : 'inherit' }}>{r.val}</b>
                  </div>
                ))}
              </>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--mu)' }}>No visit history yet</div>
            )}
          </div>

          <div className="card" style={{ padding: 14 }}>
            <SH>Quick actions</SH>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <button className="btn btn-in btn-sm" style={{ justifyContent: 'center' }}
                onClick={() => { setInput(`Here's 100 NC as a gift from us — see you soon! 🎉`); showToast('Gift message ready to send'); }}>
                🎁 Send gift NC
              </button>
              <button className="btn btn-sm" style={{ justifyContent: 'center' }}
                onClick={() => { setInput("We're open tonight! Rooftop is ready for you 🍸"); }}>
                📍 Share tonight's vibe
              </button>
              <button className="btn btn-sm" style={{ justifyContent: 'center' }}
                onClick={() => { setInput('Your table is ready! Come on up 🚀'); }}>
                🪑 Table ready message
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
