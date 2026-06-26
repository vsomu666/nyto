import React from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { GROWTH_FEATURES, PRIME_FEATURES } from '../data/mockData';

/* ══ UPGRADE MODAL — now navigates to membership page ══ */
export function UpgradeModal({ onNav }) {
  const { modal, closeModal } = useApp();
  const { showToast } = useToast();
  if (!modal.open) return null;

  const isGrowth = modal.tier === 'growth';
  const features = isGrowth ? GROWTH_FEATURES : PRIME_FEATURES;

  const handleUpgrade = () => {
    closeModal();
    if (onNav) onNav('membership');
    else showToast('Opening membership page…');
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.78)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, backdropFilter: 'blur(6px)',
      }}
    >
      <div style={{
        background: 'var(--bg3)', border: `1px solid ${isGrowth ? 'rgba(99,102,241,.35)' : 'rgba(245,158,11,.3)'}`,
        borderRadius: 'var(--r3)', padding: 28, maxWidth: 480,
        width: '92%', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: `0 24px 70px rgba(0,0,0,.65), 0 0 0 1px ${isGrowth ? 'rgba(99,102,241,.1)' : 'rgba(245,158,11,.08)'}`,
        animation: 'viewIn .22s ease',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: isGrowth ? 'var(--in2)' : 'var(--go2)', marginBottom: 5 }}>
              {isGrowth ? '⬡ GROWTH PLAN' : '♦ PRIME PLAN'}
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.4px', margin: 0 }}>
              {isGrowth ? 'Upgrade to Growth' : 'Upgrade to Prime 👑'}
            </h2>
          </div>
          <button onClick={closeModal} style={{ background: 'none', border: 'none', color: 'var(--mu)', cursor: 'pointer', fontSize: 18, padding: 4, lineHeight: 1 }}>✕</button>
        </div>

        <p style={{ fontSize: 13, color: 'var(--mu)', marginBottom: 20, lineHeight: 1.6 }}>
          {isGrowth
            ? 'Unlock the full venue retention engine. 7-day free trial. Cancel anytime.'
            : 'The complete venue intelligence platform. Push campaigns, competitor intel, events + more.'}
        </p>

        {/* Features */}
        <ul style={{ listStyle: 'none', marginBottom: 22 }}>
          {features.map((f, i) => (
            <li key={i} style={{
              padding: '7px 0', fontSize: 13, borderBottom: '1px solid var(--b1)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ color: 'var(--gn2)', flexShrink: 0, fontWeight: 700 }}>✓</span>
              {f}
            </li>
          ))}
        </ul>

        {/* Price */}
        <div style={{ padding: '14px 16px', borderRadius: 10, background: isGrowth ? 'rgba(99,102,241,.07)' : 'rgba(245,158,11,.06)', border: `1px solid ${isGrowth ? 'rgba(99,102,241,.2)' : 'rgba(245,158,11,.2)'}`, marginBottom: 20 }}>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-1px' }}>
            {isGrowth ? '₹2,999' : '₹7,999'}
            <span style={{ fontSize: 14, color: 'var(--mu)', fontWeight: 400, letterSpacing: 0 }}> /month</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 4 }}>
            {isGrowth ? '✓ 7-day free trial · No credit card needed · Cancel anytime' : '✓ 14-day free trial · Cancel anytime · Dedicated account manager'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" onClick={closeModal} style={{ flex: 1 }}>Maybe later</button>
          <button
            className={isGrowth ? 'btn btn-in' : 'btn btn-go'}
            style={{ flex: 2, justifyContent: 'center', fontWeight: 700 }}
            onClick={handleUpgrade}
          >
            View full plan details →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══ LOCK OVERLAY ══ */
export function LockOverlay({ tier = 'growth', title, desc, onUpgrade }) {
  const { openModal } = useApp();
  const isGrowth = tier === 'growth';
  return (
    <div className="lk-ov" style={{ border: isGrowth ? '1px solid rgba(99,102,241,.3)' : '1px solid rgba(245,158,11,.25)' }}>
      <div className={`lk-ico ${isGrowth ? 'lk-ico-gr' : 'lk-ico-pr'}`}>
        {isGrowth ? '🔒' : '👑'}
      </div>
      <div className="lk-title">{title}</div>
      <div className="lk-desc">{desc}</div>
      <button
        className={isGrowth ? 'lk-btn-gr' : 'lk-btn-pr'}
        onClick={() => onUpgrade ? onUpgrade() : openModal(tier)}
      >
        Unlock with {isGrowth ? 'Growth' : 'Prime'} →
      </button>
    </div>
  );
}

/* ══ SECTION HEADER ══ */
export function SH({ children, right }) {
  return (
    <div className="sh">
      <span>{children}</span>
      {right && <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400, color: 'var(--mu)' }}>{right}</span>}
    </div>
  );
}

/* ══ STAT CARD ══ */
export function StatCard({ label, value, delta, deltaClass, bench, color, id, gold }) {
  return (
    <div className={`stat${gold ? ' gold-stat' : ''}`}>
      <div className="stat-lbl">{label}</div>
      <div className="stat-val" id={id} style={color ? { color } : {}}>{value}</div>
      {delta && <div className={`stat-d ${deltaClass || ''}`}>{delta}</div>}
      {bench && <div className="stat-b">{bench}</div>}
    </div>
  );
}

/* ══ CUSTOMER AVATAR ══ */
export function Avatar({ initials, color, size = 32 }) {
  return (
    <div className="cav" style={{ background: color, width: size, height: size, fontSize: size * 0.34 }}>
      {initials}
    </div>
  );
}

/* ══ FOMO BANNER ══ */
export function FomoBanner({ title, body, btnLabel, onBtn }) {
  return (
    <div className="fomo">
      <div className="fomo-left">
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
      <div className="fomo-right">
        <button className="btn btn-in" onClick={onBtn}>{btnLabel}</button>
      </div>
    </div>
  );
}

/* ══ PULSE BANNER ══ */
export function PulseBanner() {
  return (
    <div className="pulse-banner">
      <span style={{ fontSize: 22 }}>⚡</span>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--go2)' }}>
          Your venue is tonight's Pulse Venue
        </div>
        <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 2 }}>
          Users nearby are seeing 2× NC right now · Real-time boost active
        </div>
      </div>
      <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--go)', fontWeight: 600, whiteSpace: 'nowrap' }}>
        LIVE NOW
      </div>
    </div>
  );
}

/* ══ PROGRESS BAR ══ */
export function ProgressBar({ value, color = 'var(--in2)' }) {
  return (
    <div className="prog">
      <div className="prog-fill" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

/* ══ TAG ══ */
export function Tag({ type, children }) {
  return <span className={`tag tag-${type}`}>{children}</span>;
}

/* ══ LOADING SPINNER ══ */
export function Spinner({ size = 32, color = 'var(--in2)' }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `3px solid rgba(255,255,255,.1)`,
      borderTopColor: color,
      animation: 'spin .7s linear infinite',
    }} />
  );
}

/* ══ EMPTY STATE ══ */
export function EmptyState({ icon, title, body, action, onAction }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--mu)', marginBottom: 18, lineHeight: 1.5 }}>{body}</div>
      {action && <button className="btn btn-in" onClick={onAction}>{action}</button>}
    </div>
  );
}
