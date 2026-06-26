import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const FEATURES = [
  { ico: '📊', bg: 'rgba(99,102,241,.15)', title: 'Live analytics', desc: 'Real-time check-in tracking, heatmaps, and 30-day trends.' },
  { ico: '🔄', bg: 'rgba(239,68,68,.15)', title: 'Lost regulars recovery', desc: 'Auto-detect lapsed customers and win them back with 1-tap NC drops.' },
  { ico: '⚡', bg: 'rgba(249,115,22,.15)', title: 'Dead hour filler', desc: 'Auto-trigger 2× NC promos during your slowest slots.' },
  { ico: '📍', bg: 'rgba(245,158,11,.15)', title: 'Push campaigns', desc: 'Target users within 500m when you have spare capacity.' },
];

const TIERS_INFO = [
  { key: 'free',   icon: '🏠', name: 'Free',   price: '₹0',    period: '',      color: 'tc-free'   },
  { key: 'growth', icon: '⬡',  name: 'Growth', price: '₹2,999', period: '/mo',  color: 'tc-growth' },
  { key: 'prime',  icon: '♦',  name: 'Prime',  price: '₹7,999', period: '/mo',  color: 'tc-prime'  },
];

export function LoginPage() {
  const { signIn, signUp, resetPassword, authError, setAuthError } = useAuth();
  const { showToast, showError, showInfo } = useToast();

  const [mode, setMode] = useState('login'); // login | signup | forgot
  const [loading, setLoading] = useState(false);

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  // Signup extra fields
  const [venueName, setVenueName] = useState('');
  const [location, setLocation] = useState('');
  const [selectedTier, setSelectedTier] = useState('free');

  const switchMode = (m) => { setMode(m); setAuthError(null); };

  // ── SIGN IN ──
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { showError('Please enter your email and password.'); return; }
    setLoading(true);
    const { error } = await signIn({ email, password });
    setLoading(false);
    if (error) { showError(error.message || 'Sign in failed. Check your credentials.'); }
    else { showToast('Welcome back! Loading your dashboard…'); }
  };

  // ── SIGN UP ──
  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!email || !password || !venueName) {
      showError('Please fill in all required fields.');
      return;
    }
    if (password.length < 8) {
      showError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    const { error } = await signUp({ email, password, venueName, location, tier: selectedTier });
    setLoading(false);
    if (error) { showError(error.message || 'Sign up failed. Please try again.'); }
    else { showToast('Account created! Welcome to NYTO 🎉'); }
  };

  // ── FORGOT PASSWORD ──
  const handleForgot = async (e) => {
    e.preventDefault();
    if (!email) { showError('Enter your email address.'); return; }
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) showError(error.message);
    else { showInfo('Reset link sent — check your inbox.'); switchMode('login'); }
  };

  return (
    <div className="auth-shell">
      {/* ── LEFT: form ── */}
      <div className="auth-left">
        <div className="auth-card">
          {/* Logo */}
          <div className="auth-logo">
            <div className="auth-logo-icon">N</div>
            <div>
              <div className="auth-logo-name">NYTO</div>
              <div className="auth-logo-sub">Venue Portal</div>
            </div>
          </div>

          {/* ══ LOGIN ══ */}
          {mode === 'login' && (
            <>
              <div className="auth-title">Welcome back</div>
              <div className="auth-sub">Sign in to your venue dashboard.</div>

              {authError && (
                <div className="auth-error">
                  <span>⚠</span> {authError}
                </div>
              )}

              <form onSubmit={handleLogin} noValidate>
                <div className="auth-field">
                  <label>Email address</label>
                  <input
                    type="email"
                    placeholder="owner@venue.in"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
                <div className="auth-field">
                  <label>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPw ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoComplete="current-password"
                      style={{ paddingRight: 40 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(p => !p)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--mu)', cursor: 'pointer', fontSize: 13 }}
                    >{showPw ? '🙈' : '👁'}</button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                  <button type="button" onClick={() => switchMode('forgot')}
                    style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--in2)', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Forgot password?
                  </button>
                </div>

                <button className="auth-btn" type="submit" disabled={loading}>
                  {loading ? 'Signing in…' : 'Sign in →'}
                </button>
              </form>

              <div className="auth-divider">or</div>

              {/* Dev shortcut */}
              <DevLoginShortcuts onLogin={async (tier) => {
                setEmail('owner@halobar.in');
                setPassword('demo1234');
                setLoading(true);
                const { error } = await signIn({ email: 'owner@halobar.in', password: 'demo1234' });
                setLoading(false);
                if (!error) {
                  localStorage.setItem('nyto_mock_tier', tier);
                  showToast(`Logged in as ${tier} demo ✓`);
                }
              }} />

              <div className="auth-switch">
                Don't have an account? <a onClick={() => switchMode('signup')}>Create one</a>
              </div>
            </>
          )}

          {/* ══ SIGN UP ══ */}
          {mode === 'signup' && (
            <>
              <div className="auth-title">Create your account</div>
              <div className="auth-sub">Get your venue on NYTO in 2 minutes.</div>

              {authError && <div className="auth-error"><span>⚠</span> {authError}</div>}

              <form onSubmit={handleSignUp} noValidate>
                <div className="auth-field">
                  <label>Venue name *</label>
                  <input type="text" placeholder="e.g. Halo Bar" value={venueName} onChange={e => setVenueName(e.target.value)} />
                </div>
                <div className="auth-field">
                  <label>Location</label>
                  <input type="text" placeholder="e.g. Jubilee Hills, Hyderabad" value={location} onChange={e => setLocation(e.target.value)} />
                </div>
                <div className="auth-field">
                  <label>Work email *</label>
                  <input type="email" placeholder="owner@venue.in" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
                </div>
                <div className="auth-field">
                  <label>Password * (min 8 chars)</label>
                  <input type={showPw ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
                </div>

                {/* Tier picker */}
                <div style={{ marginBottom: 6 }}>
                  <label style={{ fontSize: 12, color: 'var(--mu)', display: 'block', marginBottom: 8, fontWeight: 500 }}>Choose your plan</label>
                  <div className="tier-cards">
                    {TIERS_INFO.map(t => (
                      <button
                        key={t.key}
                        type="button"
                        className={`tier-card ${t.color}${selectedTier === t.key ? ' selected' : ''}`}
                        onClick={() => setSelectedTier(t.key)}
                      >
                        <div className="tier-card-icon">{t.icon}</div>
                        <div className="tier-card-name">{t.name}</div>
                        <div className="tier-card-price">{t.price}{t.period}</div>
                      </button>
                    ))}
                  </div>
                  {selectedTier !== 'free' && (
                    <div style={{ fontSize: 11, color: 'var(--mu)', marginBottom: 10, textAlign: 'center' }}>
                      {selectedTier === 'growth' ? '7-day free trial · Cancel anytime' : '14-day free trial · Cancel anytime'}
                    </div>
                  )}
                </div>

                <button className="auth-btn" type="submit" disabled={loading}
                  style={selectedTier === 'prime' ? { background: 'linear-gradient(90deg,#f59e0b,#eab308)', color: '#1a1206' } : {}}>
                  {loading ? 'Creating account…' : `Create ${selectedTier} account →`}
                </button>
              </form>

              <div className="auth-switch">
                Already have an account? <a onClick={() => switchMode('login')}>Sign in</a>
              </div>
            </>
          )}

          {/* ══ FORGOT PASSWORD ══ */}
          {mode === 'forgot' && (
            <>
              <div className="auth-title">Reset password</div>
              <div className="auth-sub">We'll send a reset link to your email.</div>

              <form onSubmit={handleForgot} noValidate>
                <div className="auth-field">
                  <label>Email address</label>
                  <input type="email" placeholder="owner@venue.in" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <button className="auth-btn" type="submit" disabled={loading}>
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>

              <div className="auth-switch">
                <a onClick={() => switchMode('login')}>← Back to sign in</a>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── RIGHT: feature showcase ── */}
      <div className="auth-right">
        <div className="auth-feature-list">
          <div style={{ marginBottom: 20 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--in2)', background: 'rgba(99,102,241,.12)', padding: '4px 12px', borderRadius: 20 }}>
              NC Economy v2
            </span>
          </div>
          <h2>Run your venue<br />smarter, not harder</h2>
          <p>NYTO gives you real-time visibility into your footfall, and the tools to turn slow nights into packed ones — automatically.</p>

          {FEATURES.map((f, i) => (
            <div className="auth-feature-item" key={i}>
              <div className="auth-feature-ico" style={{ background: f.bg }}>{f.ico}</div>
              <div className="auth-feature-body">
                <strong>{f.title}</strong>
                <span>{f.desc}</span>
              </div>
            </div>
          ))}

          {/* Social proof */}
          <div style={{ marginTop: 28, padding: '14px 18px', background: 'rgba(255,255,255,.04)', borderRadius: 12, border: '1px solid var(--b1)' }}>
            <div style={{ display: 'flex', gap: 2, marginBottom: 6 }}>
              {[...Array(5)].map((_, i) => <span key={i} style={{ color: 'var(--go)' }}>★</span>)}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.5, fontStyle: 'italic', color: 'var(--tx2)' }}>
              "NYTO's dead hour promo filled our Tuesday night from 12 check-ins to 40+ in three weeks. The subscription paid for itself in 4 days."
            </div>
            <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 8 }}>
              — Rooftop venue, Banjara Hills
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DevLoginShortcuts({ onLogin }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
      {[
        { label: 'Demo Free', tier: 'free', style: { borderColor: 'rgba(148,163,184,.3)', color: 'var(--mu)' } },
        { label: 'Demo Growth', tier: 'growth', style: { borderColor: 'rgba(99,102,241,.4)', color: 'var(--in2)' } },
        { label: 'Demo Prime', tier: 'prime', style: { borderColor: 'rgba(245,158,11,.4)', color: 'var(--go2)' } },
      ].map(d => (
        <button
          key={d.tier}
          type="button"
          onClick={() => onLogin(d.tier)}
          style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: '1px solid', background: 'transparent', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'inherit', ...d.style }}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}
