import React, { useState } from 'react';
import { AppProvider, useApp, TIERS } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Sidebar }   from './components/Sidebar';
import { Topbar }    from './components/Topbar';
import { UpgradeModal } from './components/UI';
import { LoginPage }        from './pages/LoginPage';
import { UpdatePasswordPage } from './pages/UpdatePasswordPage';
import { OverviewPage }   from './pages/OverviewPage';
import { AnalyticsPage }  from './pages/AnalyticsPage';
import { WalletPage }     from './pages/WalletPage';
import { OffersPage }     from './pages/OffersPage';
import { MembershipPage } from './pages/MembershipPage';
import { PageEditorPage } from './pages/PageEditorPage';
import {
  ReviewsPage, CustomersPage, LostRegularsPage,
  DeadHourPage, MessagingPage,
} from './pages/ContentPages';
import {
  CompetitorPage, PushCampaignsPage, EventsPage, GroupInsightsPage,
} from './pages/PrimePages';
import './styles/globals.css';

const GLOBAL_STYLE = `
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
`;

const VIEW_LABELS = {
  overview:   'Overview',
  analytics:  'Analytics',
  regulars:   'Lost Regulars',
  deadhour:   'Dead Hour Filler',
  wallet:     'NC Wallet',
  customers:  'Customers',
  offers:     'Offers & Campaigns',
  reviews:    'Reviews',
  messaging:  'Messaging',
  page:       'My Page',
  push:       'Push Campaigns',
  competitor: 'Competitor Intel',
  groups:     'Group Insights',
  events:     'Events & Ticketing',
  membership: 'Membership',
};

/* ── Inner dashboard ── */
function Dashboard() {
  const { tier, setTier, modal } = useApp();
  const { currentTier } = useAuth();
  const [activeView, setActiveView] = useState('overview');
  const [messagingCustomer, setMessagingCustomer] = useState(null);

  React.useEffect(() => {
    if (currentTier && Object.values(TIERS).includes(currentTier)) {
      setTier(currentTier);
    }
  }, [currentTier, setTier]);

  const handleNav = (id, extra) => {
    if (id === 'messaging' && extra?.customer) {
      setMessagingCustomer(extra.customer);
    } else {
      setMessagingCustomer(null);
    }
    setActiveView(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (activeView) {
      case 'overview':   return <OverviewPage />;
      case 'analytics':  return <AnalyticsPage />;
      case 'wallet':     return <WalletPage />;
      case 'offers':     return <OffersPage />;
      case 'reviews':    return <ReviewsPage />;
      case 'customers':  return <CustomersPage onNav={handleNav} />;
      case 'regulars':   return <LostRegularsPage onNav={handleNav} />;
      case 'deadhour':   return <DeadHourPage />;
      case 'messaging':  return <MessagingPage initialCustomer={messagingCustomer} />;
      case 'page':       return <PageEditorPage />;
      case 'competitor': return <CompetitorPage />;
      case 'push':       return <PushCampaignsPage />;
      case 'events':     return <EventsPage />;
      case 'groups':     return <GroupInsightsPage />;
      case 'membership': return <MembershipPage />;
      default:           return <OverviewPage />;
    }
  };

  return (
    <div className={`app-shell${tier === TIERS.PRIME ? ' tier-prime' : ''}`}>
      <Sidebar activeView={activeView} onNav={handleNav} />

      <div className="main-area">
        <Topbar currentView={VIEW_LABELS[activeView] || 'Overview'} onNav={handleNav} />

        {/* Dev tier switcher bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 24px', borderBottom: '1px solid var(--b1)', background: 'rgba(0,0,0,.18)', fontSize: 11, flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--dim)', fontWeight: 500 }}>Preview tier:</span>
          {[TIERS.FREE, TIERS.GROWTH, TIERS.PRIME].map(t => {
            const active = tier === t;
            const styles = {
              free:   { border: 'rgba(148,163,184,.35)', bg: 'rgba(148,163,184,.15)', color: 'var(--mu)' },
              growth: { border: 'rgba(99,102,241,.45)',  bg: 'rgba(99,102,241,.2)',   color: 'var(--in2)' },
              prime:  { border: 'rgba(245,158,11,.45)',  bg: 'linear-gradient(90deg,rgba(245,158,11,.22),rgba(251,191,36,.14))', color: 'var(--go2)' },
            };
            const s = styles[t];
            return (
              <button key={t}
                onClick={() => { setTier(t); setActiveView('overview'); }}
                style={{ padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: `1px solid ${active ? s.border : 'var(--b1)'}`, cursor: 'pointer', background: active ? s.bg : 'transparent', color: active ? s.color : 'var(--dim)', fontFamily: 'inherit', transition: 'all .15s' }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            );
          })}
          <span style={{ color: 'var(--dim)', marginLeft: 4 }}>— switch tiers to preview features · real tier from Membership page</span>
        </div>

        <div className="content-area">{renderPage()}</div>
      </div>

      {modal.open && <UpgradeModal onNav={handleNav} />}
    </div>
  );
}

/* ── Auth gate ── */
function AppGate() {
  const { isAuthenticated, loading } = useAuth();

  // Detect Supabase password-recovery redirect
  const isRecovery = typeof window !== 'undefined' && (
    window.location.hash.includes('type=recovery') ||
    window.location.search.includes('type=recovery')
  );

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#fff' }}>N</div>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(255,255,255,.1)', borderTopColor: 'var(--in2)', animation: 'spin .7s linear infinite' }} />
        <div style={{ fontSize: 13, color: 'var(--mu)' }}>Loading your dashboard…</div>
      </div>
    );
  }

  if (isRecovery) {
    return (
      <UpdatePasswordPage
        onSuccess={() => { window.location.href = window.location.origin; }}
      />
    );
  }

  return isAuthenticated ? <Dashboard /> : <LoginPage />;
}

/* ── Root ── */
export default function App() {
  return (
    <>
      <style>{GLOBAL_STYLE}</style>
      <ToastProvider>
        <AuthProvider>
          <AppProvider>
            <AppGate />
          </AppProvider>
        </AuthProvider>
      </ToastProvider>
    </>
  );
}