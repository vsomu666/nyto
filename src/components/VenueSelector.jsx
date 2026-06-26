import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';

const TIER_STYLE = {
  free:   { color: 'var(--mu)',  bg: 'rgba(148,163,184,.15)', label: 'FREE'    },
  growth: { color: 'var(--in2)', bg: 'rgba(99,102,241,.18)',  label: 'GROWTH'  },
  prime:  { color: 'var(--go2)', bg: 'rgba(245,158,11,.2)',   label: 'PRIME ♛' },
};

const CATEGORIES = [
  'Bar · Rooftop', 'Bar · Sports', 'Club · Lounge', 'Cafe · All-day dining',
  'Restaurant · Fine dining', 'Restaurant · Casual', 'Pub · Craft beer',
  'Cafe · Specialty coffee', 'Lounge · Cocktail bar', 'Other',
];

/* ─────────────────────────────────────────────────────
   ADD VENUE MODAL
   Rendered via React Portal into document.body so it
   sits above ALL parent overflow:hidden containers
───────────────────────────────────────────────────── */
export function AddVenueModal({ onClose, onAdded }) {
  const { addVenue } = useAuth();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [form, setForm]     = useState({ name: '', location: '', category: '', tier: 'free' });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  // Close on Escape key
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    // Prevent body scroll while modal open
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', h);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleSubmit = async () => {
    setError('');
    if (!form.name.trim())     { setError('Venue name is required'); return; }
    if (!form.location.trim()) { setError('Location is required'); return; }
    setSaving(true);
    const { error: err, venue } = await addVenue(form);
    setSaving(false);
    if (err) { setError(err.message); return; }
    showToast(`${venue.name} added and activated ✓`);
    onAdded(venue);
    onClose();
  };

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    padding: '10px 13px', borderRadius: 8,
    border: '1px solid var(--b2)', background: 'var(--bg)',
    color: 'var(--tx)', fontSize: 13, fontFamily: 'inherit',
    outline: 'none', transition: 'border-color .15s',
  };

  const tierCards = [
    { value: 'free',   label: 'Free',    nc: '10,000 NC', desc: 'Basic check-ins & wallet',        color: 'var(--mu)',  border: 'rgba(148,163,184,.4)' },
    { value: 'growth', label: 'Growth',  nc: '25,000 NC', desc: 'Analytics, lost regulars & more', color: 'var(--in2)', border: 'rgba(99,102,241,.5)'  },
    { value: 'prime',  label: 'Prime ♛', nc: '50,000 NC', desc: 'Push, events, competitor intel',  color: 'var(--go2)', border: 'rgba(245,158,11,.5)'  },
  ];

  // Use React Portal — renders outside Sidebar's DOM tree entirely
  return ReactDOM.createPortal(
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0,
        zIndex: 99999,                      /* above everything */
        background: 'rgba(0,0,0,.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          background: 'var(--bg3)',
          border: '1px solid var(--b2)',
          borderRadius: 'var(--r3)',
          boxShadow: '0 40px 100px rgba(0,0,0,.95)',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 100000,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--b1)', background: 'var(--bg3)' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--tx)' }}>Add a new venue</div>
            <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 2 }}>It will appear in your switcher immediately</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,.07)', border: 'none', color: 'var(--tx)', fontSize: 16, cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >✕</button>
        </div>

        {/* Scrollable body */}
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '65vh', overflowY: 'auto' }}>

          {error && (
            <div style={{ padding: '10px 13px', borderRadius: 8, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', color: '#f87171', fontSize: 13 }}>
              ⚠ {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 7 }}>
              Venue name *
            </label>
            <input
              type="text"
              placeholder="e.g. Halo Bar Kondapur"
              value={form.name}
              onChange={set('name')}
              autoFocus
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--in)'}
              onBlur={e  => e.target.style.borderColor = 'var(--b2)'}
            />
          </div>

          {/* Location */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 7 }}>
              Location / Address *
            </label>
            <input
              type="text"
              placeholder="e.g. Kondapur, Hyderabad"
              value={form.location}
              onChange={set('location')}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--in)'}
              onBlur={e  => e.target.style.borderColor = 'var(--b2)'}
            />
          </div>

          {/* Category */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 7 }}>
              Category
            </label>
            <select
              value={form.category}
              onChange={set('category')}
              style={{ ...inputStyle, cursor: 'pointer' }}
              onFocus={e => e.target.style.borderColor = 'var(--in)'}
              onBlur={e  => e.target.style.borderColor = 'var(--b2)'}
            >
              <option value="">Select category…</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Tier */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 8 }}>
              Plan
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {tierCards.map(t => {
                const active = form.tier === t.value;
                return (
                  <div
                    key={t.value}
                    onClick={() => setForm(f => ({ ...f, tier: t.value }))}
                    style={{
                      padding: '11px 10px 10px', borderRadius: 10, cursor: 'pointer',
                      border: `1.5px solid ${active ? t.border : 'var(--b2)'}`,
                      background: active ? `rgba(${t.value === 'free' ? '148,163,184' : t.value === 'growth' ? '99,102,241' : '245,158,11'},.1)` : 'var(--s1)',
                      transition: 'all .15s', textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: active ? t.color : 'var(--tx)', marginBottom: 3 }}>{t.label}</div>
                    <div style={{ fontSize: 11, color: active ? t.color : 'var(--mu)', fontWeight: 600, marginBottom: 4 }}>{t.nc}</div>
                    <div style={{ fontSize: 10, color: 'var(--dim)', lineHeight: 1.4 }}>{t.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding: '14px 22px 18px', borderTop: '1px solid var(--b1)', display: 'flex', gap: 10, background: 'var(--bg3)' }}>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              flex: 1, padding: '11px', borderRadius: 8, border: 'none',
              background: saving ? 'rgba(99,102,241,.4)' : 'linear-gradient(135deg,#6366f1,#a78bfa)',
              color: '#fff', fontSize: 14, fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              transition: 'opacity .15s',
            }}
          >
            {saving ? 'Adding venue…' : '+ Add venue'}
          </button>
          <button
            onClick={onClose}
            style={{ padding: '11px 20px', borderRadius: 8, border: '1px solid var(--b2)', background: 'transparent', color: 'var(--mu)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body   /* ← Portal target: renders directly in <body>, outside all overflow:hidden parents */
  );
}

/* ─────────────────────────────────────────────────────
   VENUE SELECTOR — shown in Sidebar
───────────────────────────────────────────────────── */
export function VenueSelector() {
  const { allVenues, activeVenue, switchVenue } = useAuth();
  const { setTier } = useApp();
  const { showToast } = useToast();
  const [open, setOpen]         = useState(false);
  const [showAdd, setShowAdd]   = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleSwitch = (v) => {
    switchVenue(v.id);
    setTier(v.tier || 'free');
    setOpen(false);
    showToast(`Switched to ${v.name} ✓`);
  };

  const handleAdded = (v) => {
    switchVenue(v.id);
    setTier(v.tier || 'free');
  };

  const ts = TIER_STYLE[activeVenue?.tier] || TIER_STYLE.free;
  const hasVenues   = allVenues?.length > 0;
  const hasMultiple = allVenues?.length > 1;

  return (
    <>
      <div ref={ref} style={{ position: 'relative', margin: '10px 12px 4px' }}>

        {/* ── Empty state: no venues ── */}
        {!hasVenues && (
          <div style={{ padding: '14px 12px', borderRadius: 'var(--r2)', border: '1px dashed var(--b2)', textAlign: 'center', background: 'var(--s1)' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>🏠</div>
            <div style={{ fontSize: 12, color: 'var(--mu)', marginBottom: 10, lineHeight: 1.5 }}>
              No venue yet.<br />Add your first venue to get started.
            </div>
            <button
              onClick={() => setShowAdd(true)}
              style={{ width: '100%', padding: '9px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#6366f1,#a78bfa)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              + Add your first venue
            </button>
          </div>
        )}

        {/* ── Active venue card ── */}
        {hasVenues && (
          <>
            <div
              onClick={() => hasMultiple && setOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 'var(--r2)',
                background: open ? 'var(--s2)' : 'var(--s1)',
                border: `1px solid ${open ? 'var(--in)' : 'var(--b1)'}`,
                cursor: hasMultiple ? 'pointer' : 'default',
                transition: 'all .15s', userSelect: 'none',
              }}
            >
              {/* Avatar */}
              <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: 'linear-gradient(135deg,var(--in),var(--pu))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: '#fff' }}>
                {(activeVenue?.name || 'V').charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {activeVenue?.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {activeVenue?.location || 'No location set'}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: ts.bg, color: ts.color }}>
                  {ts.label}
                </span>
                {hasMultiple && (
                  <span style={{ fontSize: 10, color: 'var(--mu)', transition: 'transform .2s', display: 'block', transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
                )}
              </div>
            </div>

            {/* Always show add button even with 1 venue */}
            <button
              onClick={() => setShowAdd(true)}
              style={{
                width: '100%', marginTop: 6, padding: '7px',
                background: 'transparent', border: '1px dashed var(--b2)',
                borderRadius: 7, color: 'var(--mu)', fontSize: 11,
                fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all .15s', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 5, boxSizing: 'border-box',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--in)'; e.currentTarget.style.color = 'var(--in2)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--b2)'; e.currentTarget.style.color = 'var(--mu)'; }}
            >
              + Add another venue
            </button>

            {hasMultiple && (
              <div style={{ fontSize: 10, color: 'var(--dim)', padding: '3px 4px 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gn)', display: 'inline-block' }} />
                {allVenues.length} venues · tap card to switch
              </div>
            )}
          </>
        )}

        {/* ── Dropdown ── */}
        {open && (
          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: 'var(--bg3)', border: '1px solid var(--b2)', borderRadius: 'var(--r2)', boxShadow: '0 16px 48px rgba(0,0,0,.7)', zIndex: 100, overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px 6px', fontSize: 10, color: 'var(--dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid var(--b1)' }}>
              Switch venue ({allVenues.length})
            </div>

            {allVenues.map(v => {
              const isActive = v.id === activeVenue?.id;
              const s = TIER_STYLE[v.tier] || TIER_STYLE.free;
              return (
                <div
                  key={v.id}
                  onClick={() => !isActive && handleSwitch(v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', cursor: isActive ? 'default' : 'pointer', background: isActive ? 'rgba(99,102,241,.1)' : 'transparent', borderLeft: `3px solid ${isActive ? 'var(--in)' : 'transparent'}`, borderBottom: '1px solid var(--b1)', transition: 'background .12s' }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--s1)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, background: isActive ? 'linear-gradient(135deg,var(--in),var(--pu))' : 'var(--s2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: isActive ? '#fff' : 'var(--mu)', border: isActive ? 'none' : '1px solid var(--b1)' }}>
                    {v.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: isActive ? 700 : 400, color: 'var(--tx)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {v.name}
                      {isActive && <span style={{ fontSize: 9, color: 'var(--in2)', fontWeight: 700 }}>● ACTIVE</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--mu)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{v.location}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: s.bg, color: s.color }}>{s.label}</span>
                    <span style={{ fontSize: 10, color: v.nc_balance < 5000 ? 'var(--rd2)' : 'var(--dim)' }}>{(v.nc_balance || 0).toLocaleString('en-IN')} NC</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Portal modal — renders in <body>, never clipped by sidebar overflow */}
      {showAdd && (
        <AddVenueModal
          onClose={() => setShowAdd(false)}
          onAdded={handleAdded}
        />
      )}
    </>
  );
}