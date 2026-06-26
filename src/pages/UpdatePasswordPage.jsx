import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

/* Reuses your existing auth-* CSS classes from globals.css */

function getStrength(pw) {
  let score = 0;
  if (pw.length >= 8)           score++;
  if (/[A-Z]/.test(pw))         score++;
  if (/[0-9]/.test(pw))         score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColor = ['', 'var(--rd2)', 'var(--go)', 'var(--gn)', 'var(--in2)'];

function StrengthBar({ password }) {
  if (!password) return null;
  const s = getStrength(password);
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i <= s ? strengthColor[s] : 'var(--b2)',
            transition: 'background .2s',
          }} />
        ))}
      </div>
      {s > 0 && (
        <span style={{ fontSize: 11, color: strengthColor[s], fontWeight: 600, display: 'block', marginTop: 4 }}>
          {strengthLabel[s]}
        </span>
      )}
    </div>
  );
}

export function UpdatePasswordPage({ onSuccess }) {
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [showCf, setShowCf]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [done, setDone]           = useState(false);
  const [validSession, setValid]  = useState(false);
  const [checking, setChecking]   = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setValid(true);
      }
      setChecking(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) { setValid(true); setChecking(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    if (!password)              { setError('Please enter a new password.'); return; }
    if (password.length < 8)    { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm)    { setError("Passwords don't match."); return; }
    if (getStrength(password) < 2) { setError('Please choose a stronger password.'); return; }

    setLoading(true);
    const { error: sbError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (sbError) { setError(sbError.message); return; }
    setDone(true);
    if (onSuccess) setTimeout(onSuccess, 2500);
  };

  if (checking) {
    return (
      <div className="auth-shell" style={{ gridTemplateColumns: '1fr' }}>
        <div className="auth-left" style={{ justifyContent: 'center' }}>
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', border: '3px solid var(--b2)', borderTopColor: 'var(--in2)', animation: 'spin .7s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--mu)', fontSize: 13 }}>Verifying reset link…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!validSession) {
    return (
      <div className="auth-shell" style={{ gridTemplateColumns: '1fr' }}>
        <div className="auth-left" style={{ justifyContent: 'center' }}>
          <div className="auth-card">
            <div className="auth-logo">
              <div className="auth-logo-icon">N</div>
              <div>
                <div className="auth-logo-name">NYTO</div>
                <div className="auth-logo-sub">Venue Portal</div>
              </div>
            </div>
            <div className="auth-title">Link expired</div>
            <div className="auth-sub">This reset link is invalid or has already been used. Reset links are valid for 1 hour.</div>
            <div className="auth-error" style={{ marginTop: 12 }}>
              <span>⚠</span> Request a new link from the login page.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell" style={{ gridTemplateColumns: '1fr' }}>
      <div className="auth-left" style={{ justifyContent: 'center' }}>
        <div className="auth-card">

          <div className="auth-logo">
            <div className="auth-logo-icon">N</div>
            <div>
              <div className="auth-logo-name">NYTO</div>
              <div className="auth-logo-sub">Venue Portal</div>
            </div>
          </div>

          <div className="auth-title">Set a new password</div>
          <div className="auth-sub">
            {done ? 'Your password has been updated.' : 'Choose a strong password for your account.'}
          </div>

          {error && (
            <div className="auth-error"><span>⚠</span> {error}</div>
          )}

          {done && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.25)', color: 'var(--gn2)', fontSize: 13, marginTop: 4 }}>
              ✓ Password updated!{onSuccess ? ' Taking you to login…' : ''}
            </div>
          )}

          {!done && (
            <form onSubmit={handleSubmit} noValidate>
              <div className="auth-field">
                <label>New password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password"
                    autoFocus
                    style={{ paddingRight: 40 }}
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--mu)', cursor: 'pointer', fontSize: 13 }}>
                    {showPw ? '🙈' : '👁'}
                  </button>
                </div>
                <StrengthBar password={password} />
              </div>

              <div className="auth-field">
                <label>Confirm password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCf ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    style={{ paddingRight: 40, borderColor: confirm && confirm !== password ? 'var(--rd)' : undefined }}
                  />
                  <button type="button" onClick={() => setShowCf(p => !p)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--mu)', cursor: 'pointer', fontSize: 13 }}>
                    {showCf ? '🙈' : '👁'}
                  </button>
                </div>
                {confirm && confirm !== password && (
                  <span style={{ fontSize: 11, color: 'var(--rd2)', marginTop: 4, display: 'block' }}>Passwords don't match</span>
                )}
              </div>

              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? 'Saving…' : 'Update password →'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
