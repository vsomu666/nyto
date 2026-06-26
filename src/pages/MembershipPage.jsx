import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const PLANS = [
  {
    key: 'free',
    icon: '🏠',
    name: 'Free',
    price: '₹0',
    period: '',
    tagline: 'Get started, zero commitment.',
    color: 'plan-free',
    btnLabel: 'Current plan',
    features: [
      { label: 'Overview dashboard', on: true },
      { label: 'NC Wallet (buy & track)', on: true },
      { label: 'My Page editor', on: true },
      { label: '2 active offers', on: true },
      { label: 'Reviews (read only)', on: true },
      { label: 'Analytics + Heatmap', on: false },
      { label: 'Lost Regulars alerts', on: false },
      { label: 'Customer Database', on: false },
      { label: 'Dead Hour Filler', on: false },
      { label: 'Messaging', on: false },
      { label: 'Scheduled campaigns', on: false },
      { label: 'Push Campaigns (500m)', on: false },
      { label: 'Competitor Intel', on: false },
      { label: 'Events & Ticketing', on: false },
    ],
  },
  {
    key: 'growth',
    icon: '⬡',
    name: 'Growth',
    price: '₹2,999',
    period: '/month',
    tagline: 'The full retention engine. 7-day free trial.',
    color: 'plan-growth',
    popular: true,
    features: [
      { label: 'Everything in Free', on: true },
      { label: 'Analytics + Hourly Heatmap', on: true },
      { label: 'Lost Regulars + 1-tap win-back', on: true },
      { label: 'Full Customer Database', on: true },
      { label: 'Dead Hour Filler (auto 2× NC)', on: true },
      { label: 'Direct messaging with customers', on: true },
      { label: 'Reply to all reviews publicly', on: true },
      { label: '5 active offers', on: true },
      { label: 'Scheduled campaigns + auto-promos', on: true },
      { label: 'First-timer conversion benchmarks', on: true },
      { label: 'Push Campaigns (500m)', on: false },
      { label: 'Competitor Intel', on: false },
      { label: 'Events & Ticketing (0% commission)', on: false },
      { label: 'Group Insights + connectors', on: false },
    ],
  },
  {
    key: 'prime',
    icon: '♦',
    name: 'Prime',
    price: '₹7,999',
    period: '/month',
    tagline: 'Total area dominance. 14-day free trial.',
    color: 'plan-prime',
    features: [
      { label: 'Everything in Growth', on: true },
      { label: 'Push Campaigns — geo-fenced 500m', on: true },
      { label: 'Featured map placement (gold pin)', on: true },
      { label: 'Competitor Intel — benchmark nearby', on: true },
      { label: 'Events & Ticketing (0% commission)', on: true },
      { label: 'Group Insights + connector graph', on: true },
      { label: 'AI recommendations — priority placement', on: true },
      { label: 'Unlimited active offers', on: true },
      { label: 'Curate user posts on your page', on: true },
      { label: 'API access (POS/CRM integration)', on: true },
      { label: 'Dedicated account manager', on: true },
      { label: 'Push open → visit conversion tracking', on: true },
      { label: 'Fraud detection (flagged accounts)', on: true },
      { label: 'Area rank + competitor share analytics', on: true },
    ],
  },
];

const COMPARISON_ROWS = [
  { section: 'Core' },
  { label: 'Overview dashboard',        free: true,   growth: true,   prime: true   },
  { label: 'NC Wallet',                 free: true,   growth: true,   prime: true   },
  { label: 'My Page editor',            free: true,   growth: true,   prime: true   },
  { label: 'Active offers',             free: '2',    growth: '5',    prime: '∞'    },
  { label: 'Reviews — read',            free: true,   growth: true,   prime: true   },
  { label: 'Reviews — public reply',    free: false,  growth: true,   prime: true   },
  { section: 'Growth & Retention' },
  { label: 'Analytics + Heatmap',       free: false,  growth: true,   prime: true   },
  { label: 'Lost Regulars alerts',      free: false,  growth: true,   prime: true   },
  { label: '1-tap NC win-back',         free: false,  growth: true,   prime: true   },
  { label: 'Customer Database',         free: false,  growth: true,   prime: true   },
  { label: 'Dead Hour Filler',          free: false,  growth: true,   prime: true   },
  { label: 'Direct messaging',          free: false,  growth: true,   prime: true   },
  { label: 'Scheduled campaigns',       free: false,  growth: true,   prime: true   },
  { section: 'Prime Only' },
  { label: 'Push Campaigns (geo-fence)',free: false,  growth: false,  prime: true   },
  { label: 'Competitor Intel',          free: false,  growth: false,  prime: true   },
  { label: 'Events & Ticketing',        free: false,  growth: false,  prime: true   },
  { label: 'Commission on tickets',     free: '—',    growth: '—',    prime: '0%'   },
  { label: 'Group Insights',            free: false,  growth: false,  prime: true   },
  { label: 'Dedicated account manager', free: false,  growth: false,  prime: true   },
  { label: 'API access',                free: false,  growth: false,  prime: true   },
];

const MOCK_BILLING = [
  { date: 'Jun 1, 2026',  desc: 'Growth Plan — Monthly',  amount: '₹2,999', status: 'Paid' },
  { date: 'May 1, 2026',  desc: 'Growth Plan — Monthly',  amount: '₹2,999', status: 'Paid' },
  { date: 'Apr 1, 2026',  desc: 'Growth Plan — Monthly',  amount: '₹2,999', status: 'Paid' },
  { date: 'Mar 14, 2026', desc: 'Growth Plan — Trial',    amount: '₹0',     status: 'Free trial' },
];

export function MembershipPage() {
  const { currentTier, upgradeTier } = useAuth();
  const { showToast, showInfo } = useToast();
  const [tab, setTab] = useState('plans'); // plans | compare | billing
  const [upgrading, setUpgrading] = useState(null);

  const handleUpgrade = async (planKey) => {
    if (planKey === currentTier) return;
    setUpgrading(planKey);
    await new Promise(r => setTimeout(r, 1000));
    await upgradeTier(planKey);
    setUpgrading(null);
    const action = planKey === 'free' ? 'downgraded to Free' : `upgraded to ${planKey.charAt(0).toUpperCase() + planKey.slice(1)}`;
    showToast(`Account ${action} ✓`);
  };

  return (
    <div className="view-enter">
      <div className="page-header">
        <div>
          <div className="page-title">Membership</div>
          <div className="page-sub">Manage your plan, compare features, and view billing history</div>
        </div>
      </div>

      {/* Current plan banner */}
      <CurrentPlanBanner tier={currentTier} />

      {/* Tabs */}
      <div className="chips" style={{ marginBottom: 22 }}>
        {[['plans', 'Plans'], ['compare', 'Feature comparison'], ['billing', 'Billing history']].map(([k, l]) => (
          <button key={k} className={`chip${tab === k ? ' on' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {/* ── PLANS TAB ── */}
      {tab === 'plans' && (
        <>
          <div className="membership-hero">
            <h2>Choose your plan</h2>
            <p>Every plan includes the core NYTO venue tools. Upgrade or downgrade anytime — no lock-in.</p>
          </div>

          <div className="plan-grid">
            {PLANS.map(plan => (
              <PlanCard
                key={plan.key}
                plan={plan}
                isCurrent={currentTier === plan.key}
                onSelect={() => handleUpgrade(plan.key)}
                loading={upgrading === plan.key}
              />
            ))}
          </div>

          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--mu)', marginTop: 8 }}>
            All prices exclude GST · Free trials require no credit card
          </div>
        </>
      )}

      {/* ── COMPARE TAB ── */}
      {tab === 'compare' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="feat-table">
            <thead>
              <tr>
                <th style={{ width: '38%' }}>Feature</th>
                <th>Free</th>
                <th className={currentTier === 'growth' ? 'col-current' : ''}>Growth</th>
                <th className={currentTier === 'prime' ? 'col-current' : ''} style={{ color: 'var(--go2)' }}>Prime 👑</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, i) => {
                if (row.section) {
                  return (
                    <tr key={i} className="feat-section">
                      <td colSpan={4}>{row.section}</td>
                    </tr>
                  );
                }
                return (
                  <tr key={i}>
                    <td>{row.label}</td>
                    <td>{renderCell(row.free)}</td>
                    <td className={currentTier === 'growth' ? 'col-current' : ''}>{renderCell(row.growth)}</td>
                    <td className={currentTier === 'prime' ? 'col-current' : ''}>{renderCell(row.prime)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── BILLING TAB ── */}
      {tab === 'billing' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--b1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Payment history</span>
            <button className="btn btn-sm" onClick={() => showInfo('Downloading invoice...')}>Download all</button>
          </div>
          <table className="tbl">
            <thead>
              <tr><th>Date</th><th>Description</th><th>Amount</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {(currentTier === 'free' ? [] : MOCK_BILLING).map((b, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--mu)', whiteSpace: 'nowrap' }}>{b.date}</td>
                  <td>{b.desc}</td>
                  <td style={{ fontWeight: 600 }}>{b.amount}</td>
                  <td>
                    <span className={`tag tag-${b.status === 'Paid' ? 'ok' : b.status === 'Free trial' ? 'growth' : 'risk'}`}>
                      {b.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-xs" onClick={() => showInfo('Opening invoice...')}>Invoice</button>
                  </td>
                </tr>
              ))}
              {currentTier === 'free' && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--mu)', padding: '28px 14px', fontSize: 13 }}>
                    No billing history — you're on the Free plan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CurrentPlanBanner({ tier }) {
  const colors = {
    free:   { bg: 'rgba(148,163,184,.06)', border: 'rgba(148,163,184,.2)', icon: '🏠', label: 'FREE', lc: 'var(--mu)' },
    growth: { bg: 'rgba(99,102,241,.06)',  border: 'rgba(99,102,241,.3)',  icon: '⬡',  label: 'GROWTH', lc: 'var(--in2)' },
    prime:  { bg: 'rgba(245,158,11,.06)',  border: 'rgba(245,158,11,.3)',  icon: '♦',  label: 'PRIME', lc: 'var(--go2)' },
  };
  const c = colors[tier] || colors.free;

  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 'var(--r2)', padding: '14px 18px', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 14 }}>
      <span style={{ fontSize: 24 }}>{c.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: c.lc, marginBottom: 2 }}>
          Current plan · {c.label}
        </div>
        <div style={{ fontSize: 13, color: 'var(--tx2)' }}>
          {tier === 'free' && 'Upgrade to unlock analytics, lost regulars alerts, dead hour promos, and messaging.'}
          {tier === 'growth' && 'Growth plan active · Next billing: Jul 1, 2026 · ₹2,999'}
          {tier === 'prime' && 'Prime plan active · Next billing: Jul 1, 2026 · ₹7,999 · Dedicated account manager assigned'}
        </div>
      </div>
      {tier !== 'free' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gn)', marginTop: 4 }} />
          <span style={{ fontSize: 12, color: 'var(--gn2)', fontWeight: 500 }}>Active</span>
        </div>
      )}
    </div>
  );
}

function PlanCard({ plan, isCurrent, onSelect, loading }) {
  const btnClass = isCurrent
    ? 'plan-btn plan-btn-current'
    : plan.key === 'growth' ? 'plan-btn plan-btn-in'
    : plan.key === 'prime'  ? 'plan-btn plan-btn-go'
    : 'plan-btn';

  return (
    <div className={`plan-card ${plan.color}${isCurrent ? ' plan-current' : ''}`}>
      {isCurrent   && <div className="plan-badge plan-badge-current">Current plan</div>}
      {plan.popular && !isCurrent && <div className="plan-badge plan-badge-popular">Most popular</div>}
      {plan.key === 'prime' && !isCurrent && <div className="plan-badge plan-badge-best">Full power</div>}

      <div className="plan-icon">{plan.icon}</div>
      <div className="plan-name">{plan.name}</div>
      <div className="plan-price">{plan.price}<span>{plan.period}</span></div>
      <div className="plan-tagline">{plan.tagline}</div>

      <ul className="plan-features">
        {plan.features.map((f, i) => (
          <li key={i} className={!f.on ? 'locked-feat' : ''}>
            <span className={`pf-check ${f.on ? 'on' : 'off'}`}>{f.on ? '✓' : '○'}</span>
            {f.label}
          </li>
        ))}
      </ul>

      <button className={btnClass} onClick={onSelect} disabled={isCurrent || loading}>
        {loading ? 'Processing…' : isCurrent ? '✓ Current plan' : plan.key === 'free' ? 'Downgrade to Free' : `Upgrade to ${plan.name} →`}
      </button>
    </div>
  );
}

function renderCell(val) {
  if (val === true)  return <span className="feat-check-on">✓</span>;
  if (val === false) return <span className="feat-check-off">—</span>;
  if (val === '0%')  return <span className="feat-val-go">0%</span>;
  return <span className="feat-val">{val}</span>;
}
