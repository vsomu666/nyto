import React, { useState, useEffect, useRef } from 'react';
import { useApp, TIERS } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { NOTIFICATIONS, CUSTOMERS, REVIEWS } from '../data/mockData';
import { AddVenueModal } from './VenueSelector';

export function Topbar({ currentView, onNav }) {
  const { tier, vibeStatus } = useApp();
  const { user, signOut, allVenues, activeVenue, switchVenue } = useAuth();
  const { showToast } = useToast();

  const [clock, setClock]               = useState('');
  const [notifOpen, setNotifOpen]       = useState(false);
  const [profileOpen, setProfileOpen]   = useState(false);
  const [venueOpen, setVenueOpen]       = useState(false);
  const [showAddVenue, setShowAddVenue] = useState(false);
  const [searchQuery, setSearchQuery]   = useState('');
  const [searchOpen, setSearchOpen]     = useState(false);
  const searchRef = useRef(null);

  const notifRef   = useRef(null);
  const profileRef = useRef(null);
  const venueRef   = useRef(null);

  /* Clock */
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      const d = n.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
      const t = n.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      setClock(`${d} · ${t}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  /* Close dropdowns on outside click */
  useEffect(() => {
    const h = (e) => {
      if (notifRef.current   && !notifRef.current.contains(e.target))   setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (venueRef.current   && !venueRef.current.contains(e.target))   setVenueOpen(false);
      if (searchRef.current  && !searchRef.current.contains(e.target))  { setSearchOpen(false); }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const vibeColors = {
    Calm:   { bg: 'rgba(34,211,238,.15)',  color: 'var(--cy)' },
    Vibing: { bg: 'rgba(249,115,22,.15)',  color: 'var(--or)' },
    Fire:   { bg: 'rgba(239,68,68,.15)',   color: 'var(--rd)' },
  };
  const vc = vibeColors[vibeStatus] || vibeColors.Vibing;

  const notifications = NOTIFICATIONS?.[tier] || NOTIFICATIONS?.growth || [];
  const userName      = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Owner';
  const userInitials  = userName.slice(0, 2).toUpperCase();

  /* Global search across customers + reviews */
  const searchResults = searchQuery.trim().length < 2 ? [] : (() => {
    const q = searchQuery.toLowerCase();
    const results = [];
    (CUSTOMERS || []).forEach(c => {
      if (c.name.toLowerCase().includes(q)) {
        results.push({ type: 'customer', icon: c.initials, color: c.color, label: c.name, sub: `${c.visits} visits · ${c.status}`, page: 'customers' });
      }
    });
    (REVIEWS || []).forEach(r => {
      if (r.name.toLowerCase().includes(q) || r.text?.toLowerCase().includes(q)) {
        results.push({ type: 'review', icon: '★', color: 'linear-gradient(135deg,#f59e0b,#f97316)', label: r.name, sub: `${r.stars}★ · ${r.time}`, page: 'reviews' });
      }
    });
    const pages = [
      { label: 'NC Wallet',          page: 'wallet',     icon: '◎', sub: 'Balance & transactions' },
      { label: 'Customers',          page: 'customers',  icon: '👥', sub: 'Customer database' },
      { label: 'Reviews',            page: 'reviews',    icon: '★',  sub: 'Manage reviews' },
      { label: 'Messaging',          page: 'messaging',  icon: '✉',  sub: 'Direct messages' },
      { label: 'Offers & Campaigns', page: 'offers',     icon: '⚡', sub: 'Active promotions' },
      { label: 'Analytics',          page: 'analytics',  icon: '📊', sub: 'Stats & trends' },
      { label: 'Lost Regulars',      page: 'regulars',   icon: '🔄', sub: 'Win back customers' },
      { label: 'Dead Hour Filler',   page: 'deadhour',   icon: '⏰', sub: 'Slow slot boosters' },
      { label: 'Push Campaigns',     page: 'push',       icon: '📣', sub: 'Send push notifications' },
      { label: 'My Page',            page: 'page',       icon: '🏠', sub: 'Edit venue listing' },
    ];
    pages.forEach(p => {
      if (p.label.toLowerCase().includes(q)) {
        results.push({ type: 'page', icon: p.icon, color: 'var(--s2)', label: p.label, sub: p.sub, page: p.page });
      }
    });
    return results.slice(0, 8);
  })();

  return (
    <>
      {/* ── Main topbar strip ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '13px 24px',
        borderBottom: '1px solid var(--b1)', background: 'var(--bg2)',
        flexShrink: 0, position: 'sticky', top: 0, zIndex: 20,
      }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: 13, color: 'var(--mu)', whiteSpace: 'nowrap' }}>
          NYTO · <b style={{ color: 'var(--tx)', fontWeight: 500 }}>{currentView}</b>
        </div>

        {/* Global Search */}
        <div ref={searchRef} style={{ flex: 1, maxWidth: 300, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--mu)', fontSize: 13, pointerEvents: 'none', zIndex: 1 }}>⌕</span>
          <input
            type="text"
            placeholder="Search customers, reviews, pages…"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
            onFocus={e  => { setSearchOpen(true); e.target.style.borderColor = 'var(--in)'; }}
            onBlur={e   => e.target.style.borderColor = 'var(--b1)'}
            onKeyDown={e => {
              if (e.key === 'Escape') { setSearchQuery(''); setSearchOpen(false); }
              if (e.key === 'Enter' && searchResults.length > 0) { onNav(searchResults[0].page); setSearchQuery(''); setSearchOpen(false); }
            }}
            style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--b1)', borderRadius: 8, padding: '7px 10px 7px 30px', color: 'var(--tx)', fontSize: 12, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setSearchOpen(false); }}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--mu)', cursor: 'pointer', fontSize: 14, padding: '0 2px', lineHeight: 1 }}>
              ✕
            </button>
          )}
          {/* Results dropdown */}
          {searchOpen && searchQuery.trim().length >= 2 && (
            <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: 'var(--bg3)', border: '1px solid var(--b2)', borderRadius: 10, boxShadow: '0 20px 50px rgba(0,0,0,.7)', zIndex: 200, overflow: 'hidden', minWidth: 280 }}>
              {searchResults.length === 0 ? (
                <div style={{ padding: '14px 16px', fontSize: 13, color: 'var(--mu)', textAlign: 'center' }}>No results for "{searchQuery}"</div>
              ) : (
                <>
                  <div style={{ padding: '7px 12px 5px', fontSize: 10, color: 'var(--dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '1px solid var(--b1)' }}>
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                  </div>
                  {searchResults.map((r, i) => (
                    <div key={i}
                      onClick={() => { onNav(r.page); setSearchQuery(''); setSearchOpen(false); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderBottom: i < searchResults.length - 1 ? '1px solid var(--b1)' : 'none', cursor: 'pointer', transition: 'background .1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--s1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: r.color || 'var(--s2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: r.type === 'customer' ? 10 : 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {r.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 1 }}>{r.sub}</div>
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--dim)', background: 'var(--s1)', padding: '2px 7px', borderRadius: 5, flexShrink: 0 }}>{r.type}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>

          {/* Clock */}
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--mu)', whiteSpace: 'nowrap' }}>
            {clock}
          </div>

          {/* Vibe chip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: vc.bg, color: vc.color, userSelect: 'none' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', animation: 'pulse 1.8s infinite' }} />
            {vibeStatus}
          </div>

          {/* Notifications (Growth/Prime only) */}
          {tier !== TIERS.FREE && (
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setNotifOpen(o => !o)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, position: 'relative', color: notifOpen ? 'var(--tx)' : 'var(--mu)', fontSize: 16, transition: 'color .15s' }}
              >
                🔔
                <div style={{ position: 'absolute', top: 4, right: 4, width: 7, height: 7, background: 'var(--rd)', borderRadius: '50%', border: '2px solid var(--bg2)' }} />
              </button>
              {notifOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 340, background: 'var(--bg3)', border: '1px solid var(--b2)', borderRadius: 'var(--r3)', boxShadow: '0 20px 50px rgba(0,0,0,.6)', zIndex: 50, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--b1)' }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Notifications</span>
                    <button style={{ background: 'none', border: 'none', fontSize: 11, color: 'var(--in2)', cursor: 'pointer', fontFamily: 'inherit' }}
                      onClick={() => { showToast('All notifications marked read'); setNotifOpen(false); }}>
                      Mark all read
                    </button>
                  </div>
                  {notifications.map((n, i) => (
                    <div key={i}
                      onClick={() => { showToast(n.title); setNotifOpen(false); }}
                      style={{ padding: '11px 16px', borderBottom: i < notifications.length - 1 ? '1px solid var(--b1)' : 'none', cursor: 'pointer', transition: 'background .12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--s1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{n.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--mu)', lineHeight: 1.4 }}>{n.desc}</div>
                      <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 3 }}>{n.time}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Venue selector pill */}
          {allVenues && allVenues.length > 0 && (
            <div ref={venueRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setVenueOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '5px 10px 5px 7px', borderRadius: 8,
                  border: `1px solid ${venueOpen ? 'var(--in)' : 'var(--b2)'}`,
                  background: venueOpen ? 'rgba(99,102,241,.08)' : 'var(--bg)',
                  color: 'var(--tx)', cursor: 'pointer', fontSize: 12,
                  fontFamily: 'inherit', transition: 'all .15s',
                }}
              >
                <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, background: 'linear-gradient(135deg,var(--in),var(--pu))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff' }}>
                  {(activeVenue?.name || 'V').charAt(0)}
                </div>
                <span style={{ fontWeight: 500, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {activeVenue?.name || 'Select venue'}
                </span>
                <span style={{ color: 'var(--mu)', fontSize: 8 }}>▼</span>
              </button>

              {venueOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: 260, background: 'var(--bg3)', border: '1px solid var(--b2)', borderRadius: 'var(--r3)', boxShadow: '0 20px 50px rgba(0,0,0,.7)', zIndex: 100, overflow: 'hidden' }}>
                  <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--b1)', fontSize: 10, color: 'var(--mu)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                    Your venues
                  </div>
                  {allVenues.map(v => {
                    const isActive = v.id === activeVenue?.id;
                    const tc = { free: 'var(--mu)', growth: 'var(--in2)', prime: 'var(--go2)' }[v.tier] || 'var(--mu)';
                    return (
                      <div key={v.id}
                        onClick={() => { if (!isActive) { switchVenue(v.id); showToast(`Switched to ${v.name} ✓`); } setVenueOpen(false); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--b1)', cursor: 'pointer', background: isActive ? 'rgba(99,102,241,.1)' : 'transparent', borderLeft: `3px solid ${isActive ? 'var(--in)' : 'transparent'}`, transition: 'background .12s' }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--s1)'; }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, background: isActive ? 'linear-gradient(135deg,var(--in),var(--pu))' : 'var(--s1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: isActive ? '#fff' : 'var(--mu)', border: isActive ? 'none' : '1px solid var(--b1)' }}>
                          {v.name.charAt(0)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, display: 'flex', alignItems: 'center', gap: 6 }}>
                            {v.name}
                            {isActive && <span style={{ fontSize: 9, color: 'var(--in2)', fontWeight: 700, background: 'rgba(99,102,241,.15)', padding: '1px 5px', borderRadius: 4 }}>ACTIVE</span>}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.location || 'No location'}</div>
                          <div style={{ fontSize: 10, color: tc, fontWeight: 600, marginTop: 2, textTransform: 'capitalize' }}>{v.tier} · {(v.nc_balance || 0).toLocaleString('en-IN')} NC</div>
                        </div>
                        {isActive && <span style={{ color: 'var(--in2)', fontSize: 16 }}>✓</span>}
                      </div>
                    );
                  })}
                  <div
                    onClick={() => { setVenueOpen(false); setShowAddVenue(true); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', cursor: 'pointer', fontSize: 12, color: 'var(--in2)', fontWeight: 600, transition: 'background .12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--s1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontSize: 16 }}>+</span> Add another venue
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Profile avatar + dropdown */}
          <div ref={profileRef} style={{ position: 'relative' }}>
            <div
              onClick={() => setProfileOpen(o => !o)}
              style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,var(--in),var(--pu))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0, border: profileOpen ? '2px solid var(--in2)' : '2px solid transparent', transition: 'border-color .15s' }}
            >
              {userInitials}
            </div>
            {profileOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 220, background: 'var(--bg3)', border: '1px solid var(--b2)', borderRadius: 'var(--r3)', boxShadow: '0 20px 50px rgba(0,0,0,.6)', zIndex: 50, overflow: 'hidden' }}>
                <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--b1)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{userName}</div>
                  <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 1 }}>{user?.email || 'owner@venue.in'}</div>
                </div>
                {[
                  { icon: '◐', label: 'Membership & billing', action: () => { onNav('membership'); setProfileOpen(false); } },
                  { icon: '✦', label: 'Edit venue page',      action: () => { onNav('page');       setProfileOpen(false); } },
                  { icon: '◎', label: 'NC Wallet',            action: () => { onNav('wallet');     setProfileOpen(false); } },
                ].map((item, i) => (
                  <div key={i} onClick={item.action}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid var(--b1)', transition: 'background .12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--s1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ color: 'var(--mu)' }}>{item.icon}</span>
                    {item.label}
                  </div>
                ))}
                <div
                  onClick={async () => { await signOut(); showToast('Signed out'); setProfileOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', fontSize: 13, color: 'var(--rd2)', transition: 'background .12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span>↪</span> Sign out
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Add Venue Modal — portal renders directly to <body> */}
      {showAddVenue && (
        <AddVenueModal
          onClose={() => setShowAddVenue(false)}
          onAdded={(v) => { setShowAddVenue(false); showToast(`${v.name} added ✓`); }}
        />
      )}
    </>
  );
}