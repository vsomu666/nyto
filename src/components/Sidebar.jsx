import React from 'react';
import { useApp, TIERS } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { VenueSelector } from './VenueSelector';

const NAV_CONFIG = {
  [TIERS.FREE]: {
    badge: { label: 'FREE TIER', style: 'free' },
    sections: [
      {
        label: null,
        items: [
          { id: 'overview',    icon: '◈', label: 'Overview' },
          { id: 'wallet',      icon: '◎', label: 'NC Wallet' },
          { id: 'page',        icon: '✦', label: 'My Page' },
          { id: 'offers',      icon: '⚡', label: 'Offers' },
          { id: 'reviews',     icon: '★', label: 'Reviews' },
          { id: 'membership',  icon: '◐', label: 'Membership' },
        ],
      },
      {
        label: 'Growth Features',
        labelClass: 'go',
        items: [
          { id: 'analytics', icon: '◉', label: 'Analytics',        locked: 'growth' },
          { id: 'regulars',  icon: '⟳', label: 'Lost Regulars',    locked: 'growth' },
          { id: 'customers', icon: '⊞', label: 'Customer DB',      locked: 'growth' },
          { id: 'deadhour',  icon: '◌', label: 'Dead Hour Filler', locked: 'growth' },
          { id: 'messaging', icon: '✉', label: 'Messaging',        locked: 'growth' },
        ],
      },
      {
        label: 'Prime Features',
        labelClass: 'prime',
        items: [
          { id: 'push',   icon: '⊛', label: 'Push Campaigns', locked: 'prime' },
          { id: 'events', icon: '◆', label: 'Events',         locked: 'prime' },
        ],
      },
    ],
    upsell: [
      {
        labelClass: 'in2', label: 'GROW YOUR VENUE',
        title: 'Upgrade to Growth', color: 'in',
        desc: 'Analytics, lost regulars alerts, dead hour promos + more.',
        btnClass: 'btn-in', btnLabel: 'Start 7-day free trial',
        tier: 'growth',
      },
    ],
  },
  [TIERS.GROWTH]: {
    badge: { label: '⬡ GROWTH', style: 'growth' },
    sections: [
      {
        label: null,
        items: [
          { id: 'overview',   icon: '◈', label: 'Overview' },
          { id: 'analytics',  icon: '◉', label: 'Analytics' },
          { id: 'regulars',   icon: '⟳', label: 'Lost Regulars', badge: '18' },
          { id: 'deadhour',   icon: '◌', label: 'Dead Hour Filler' },
          { id: 'wallet',     icon: '◎', label: 'NC Wallet' },
          { id: 'customers',  icon: '⊞', label: 'Customers' },
          { id: 'offers',     icon: '⚡', label: 'Offers & Campaigns' },
          { id: 'reviews',    icon: '★', label: 'Reviews' },
          { id: 'messaging',  icon: '✉', label: 'Messaging', badge: '3' },
          { id: 'page',       icon: '✦', label: 'My Page' },
          { id: 'membership', icon: '◐', label: 'Membership' },
        ],
      },
      {
        label: 'Prime Only 👑',
        labelClass: 'gold',
        items: [
          { id: 'push',       icon: '⊛', label: 'Push Campaigns',  locked: 'prime' },
          { id: 'competitor', icon: '⊙', label: 'Competitor Intel', locked: 'prime' },
          { id: 'groups',     icon: '◈', label: 'Group Insights',   locked: 'prime' },
          { id: 'events',     icon: '◆', label: 'Events',           locked: 'prime' },
        ],
      },
    ],
    upsell: [
      {
        labelClass: 'go', label: 'PRIME UPGRADE',
        title: 'Go Prime 👑', color: 'go',
        desc: 'Push notifications within 500m, competitor intel, events ticketing and more.',
        btnClass: 'btn-go', btnLabel: 'Explore Prime',
        tier: 'prime',
      },
    ],
  },
  [TIERS.PRIME]: {
    badge: { label: '♦ PRIME', style: 'prime' },
    sections: [
      {
        label: null,
        items: [
          { id: 'overview',    icon: '◈', label: 'Overview' },
          { id: 'analytics',   icon: '◉', label: 'Analytics' },
          { id: 'competitor',  icon: '⊙', label: 'Competitor Intel' },
          { id: 'push',        icon: '⊛', label: 'Push Campaigns' },
          { id: 'events',      icon: '◆', label: 'Events' },
          { id: 'groups',      icon: '◈', label: 'Group Insights' },
          { id: 'regulars',    icon: '⟳', label: 'Lost Regulars', badge: '18' },
          { id: 'deadhour',    icon: '◌', label: 'Dead Hour Filler' },
          { id: 'wallet',      icon: '◎', label: 'NC Wallet' },
          { id: 'customers',   icon: '⊞', label: 'Customers' },
          { id: 'offers',      icon: '⚡', label: 'Offers & Campaigns' },
          { id: 'reviews',     icon: '★', label: 'Reviews' },
          { id: 'messaging',   icon: '✉', label: 'Messaging', badge: '3' },
          { id: 'page',        icon: '✦', label: 'My Page' },
          { id: 'membership',  icon: '◐', label: 'Membership' },
        ],
      },
    ],
    upsell: [],
  },
};

export function Sidebar({ activeView, onNav }) {
  const { tier, openModal, venue } = useApp();
  const { signOut, user } = useAuth();
  const { showToast } = useToast();
  const config = NAV_CONFIG[tier];

  const handleSignOut = async () => {
    await signOut();
    showToast('Signed out successfully');
  };

  return (
    <aside style={{
      background: 'var(--bg2)', borderRight: '1px solid var(--b1)',
      display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9,
          background: 'linear-gradient(135deg,#6366f1,#a78bfa)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 15, flexShrink: 0, color: '#fff',
        }}>N</div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.3px' }}>NYTO</div>
          <div style={{ fontSize: 10, color: 'var(--mu)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Venue Portal</div>
        </div>
      </div>

      {/* Venue selector — supports single and multi-venue owners */}
      <VenueSelector />

      {/* Account manager (Prime only) */}
      {tier === TIERS.PRIME && (
        <div style={{ margin: '10px 12px', padding: '10px 12px', borderRadius: 'var(--r2)', background: 'linear-gradient(135deg,rgba(245,158,11,.08),rgba(251,191,36,.04))', border: '1px solid rgba(245,158,11,.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#f59e0b,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>AK</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500 }}>Anusha K.</div>
              <div style={{ fontSize: 10, color: 'var(--mu)' }}>Account Manager</div>
            </div>
          </div>
          <button onClick={() => showToast('Opening chat with Anusha...')} style={{ marginTop: 7, width: '100%', padding: 5, background: 'transparent', border: '1px solid rgba(245,158,11,.3)', borderRadius: 6, color: 'var(--go2)', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            Message Anusha
          </button>
        </div>
      )}

      {/* Nav */}
      <nav style={{ padding: '8px 8px', flex: 1, overflowY: 'auto' }}>
        {config.sections.map((section, si) => (
          <div key={si}>
            {section.label && (
              <div style={{
                fontSize: 10,
                color: section.labelClass === 'gold' ? 'rgba(245,158,11,.7)' : 'var(--dim)',
                textTransform: 'uppercase', letterSpacing: '1.2px', padding: '10px 10px 5px', fontWeight: 600,
              }}>{section.label}</div>
            )}
            {section.items.map(item => (
              <NavItem
                key={item.id}
                item={item}
                active={activeView === item.id}
                onNav={onNav}
                onOpenModal={openModal}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Upsell cards */}
      {config.upsell.map((up, i) => (
        <div key={i} style={{
          margin: '0 12px 10px',
          padding: 14, borderRadius: 'var(--r2)',
          background: up.color === 'in'
            ? 'linear-gradient(135deg,rgba(99,102,241,.12),rgba(139,92,246,.06))'
            : 'linear-gradient(135deg,rgba(245,158,11,.1),rgba(234,179,8,.05))',
          border: up.color === 'in' ? '1px solid rgba(99,102,241,.3)' : '1px solid rgba(245,158,11,.25)',
        }}>
          <div style={{ fontSize: 10, color: `var(--${up.labelClass})`, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>{up.label}</div>
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{up.title}</div>
          <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 4, lineHeight: 1.4 }}>{up.desc}</div>
          <button
            className={`btn ${up.btnClass}`}
            style={{ marginTop: 10, width: '100%', padding: 9, fontSize: 12, fontWeight: 700, borderRadius: 7 }}
            onClick={() => onNav('membership')}
          >
            {up.btnLabel}
          </button>
        </div>
      ))}

      {/* User footer */}
      <div style={{ margin: '0 12px 14px', padding: '10px 12px', borderRadius: 'var(--r2)', background: 'var(--s1)', border: '1px solid var(--b1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,var(--go),var(--rd))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
            {(user?.user_metadata?.full_name || user?.email || 'U').slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.user_metadata?.full_name || venue.name}
            </div>
            <div style={{ fontSize: 10, color: 'var(--mu)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email || 'owner@venue.in'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="btn btn-xs"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => onNav('membership')}
          >
            ◐ Plan
          </button>
          <button
            className="btn btn-xs btn-rd"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ item, active, onNav, onOpenModal }) {
  const isLocked = !!item.locked;
  const handleClick = () => {
    if (isLocked) onOpenModal(item.locked);
    else onNav(item.id);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px',
        borderRadius: 7, fontSize: 13,
        color: active ? 'var(--in2)' : isLocked ? 'var(--dim)' : 'var(--tx2)',
        cursor: 'pointer', marginBottom: 1, transition: 'all .15s',
        userSelect: 'none',
        background: active ? 'rgba(99,102,241,.18)' : 'transparent',
        fontWeight: active ? 600 : 400,
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--s1)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ width: 15, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.badge && (
        <span style={{ padding: '2px 7px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: 'var(--rd)', color: '#fff' }}>
          {item.badge}
        </span>
      )}
      {isLocked && (
        <span style={{ fontSize: 10, opacity: .6 }}>
          {item.locked === 'prime' ? '👑' : '🔒'}
        </span>
      )}
    </div>
  );
}