import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Filler } from 'chart.js';
import { useApp, TIERS } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { StatCard, SH, PulseBanner, FomoBanner, LockOverlay } from '../components/UI';
import { OVERVIEW_STATS, RECENT_CHECKINS, ACTIVE_OFFERS, HOURLY_DATA, HOURLY_LABELS, WEEKLY_DATA, WEEKLY_LABELS } from '../data/mockData';
import { SCALE_CONFIG, barColor, weekBarColor } from '../utils/chartUtils';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Filler);

export function OverviewPage() {
  const { tier, vibeStatus, updateVibe, openModal, venue } = useApp();
  const { showToast } = useToast();
  const stats = OVERVIEW_STATS[tier];

  return (
    <div className="view-enter">
      {tier === TIERS.PRIME && <PulseBanner />}

      <div className="page-header">
        <div>
          <div className="page-title">Overview</div>
          <div className="page-sub">{venue.name} · Live dashboard</div>
        </div>
        <div className="page-actions">
          {tier === TIERS.FREE && (
            <button className="btn btn-sm btn-in" onClick={() => openModal('growth')}>Upgrade to Growth →</button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="g4">
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {/* Hourly chart + Vibe setter */}
      <div className="g21">
        <div className="card">
          <SH>Today's check-in activity</SH>
          <div className="cw cw-180">
            <Bar
              data={{ labels: HOURLY_LABELS, datasets: [{ data: HOURLY_DATA, backgroundColor: HOURLY_DATA.map(barColor), borderRadius: 5, borderSkipped: false }] }}
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => c.raw + ' check-ins' } } }, scales: SCALE_CONFIG }}
            />
          </div>
        </div>
        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <SH>Set tonight's vibe</SH>
            <div className="vgrid">
              {[
                { name: 'Calm',   cls: 'vb-calm',   on: 'calm-on',  desc: '← Relaxed' },
                { name: 'Vibing', cls: 'vb-vibing', on: 'vibe-on',  desc: 'Buzzing' },
                { name: 'Fire',   cls: 'vb-fire',   on: 'fire-on',  desc: 'Packed →' },
              ].map(v => (
                <button key={v.name}
                  className={`vb ${v.cls}${vibeStatus === v.name ? ` ${v.on}` : ''}`}
                  onClick={() => { updateVibe(v.name); showToast(`Vibe set to ${v.name} — map updated`); }}
                >
                  <div className="vbd" />
                  {v.name}
                  <span className="vbs">{v.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <SH>NC Balance</SH>
            <div className="nc-bal">{venue.ncBalance.toLocaleString()} <span style={{ fontSize: 18, color: 'var(--mu)', fontWeight: 500 }}>NC</span></div>
            <div style={{ fontSize: 13, color: 'var(--mu)', marginTop: 3 }}>worth ₹{(venue.ncBalance / 2).toLocaleString()}</div>
            <div className="nc-bar"><div className="nc-fill" style={{ width: `${(venue.ncBalance / venue.ncCap) * 100}%` }} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--mu)' }}>
              <span>Low alert: 5,000 NC</span>
              <span>{venue.ncBalance.toLocaleString()} / {venue.ncCap.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active offers */}
      <div className="card mb">
        <SH>Active offers</SH>
        {ACTIVE_OFFERS.map((o, i) => (
          <div className="ocard" key={i}>
            <div className="oico" style={{ background: o.bg }}>{o.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: 13 }}>{o.name}</div>
              <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 2 }}>{o.desc}</div>
            </div>
            <span className={`tag ${o.tagClass}`}>{o.tag}</span>
            <button className="btn btn-sm btn-in" onClick={() => showToast(`${o.name} triggered ✓`)}>Trigger</button>
          </div>
        ))}
      </div>

      {/* Recent check-ins */}
      <div className="card mb">
        <SH right={<button className="btn btn-xs" onClick={() => showToast('Loading full history…')}>View all</button>}>
          Recent check-ins
        </SH>
        {RECENT_CHECKINS.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < RECENT_CHECKINS.length - 1 ? '1px solid var(--b1)' : 'none' }}>
            <div className="cav" style={{ background: c.color }}>{c.initials}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>
                {c.name} {c.badge && <span className={`tag tag-${c.badge === 'VIP' ? 'vip' : 'new'}`}>{c.badge}</span>}
              </div>
              <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 1 }}>{c.type}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: 'var(--gn2)', fontWeight: 600 }}>{c.nc}</div>
              <div style={{ fontSize: 10, color: 'var(--dim)' }}>{c.time}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Weekly chart */}
      <div className="card mb">
        <SH>This week · check-ins by day</SH>
        <div className="cw cw-180">
          <Bar
            data={{ labels: WEEKLY_LABELS, datasets: [{ data: WEEKLY_DATA, backgroundColor: WEEKLY_DATA.map(weekBarColor), borderRadius: 6 }] }}
            options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: SCALE_CONFIG }}
          />
        </div>
      </div>

      {/* Free tier upsell */}
      {tier === TIERS.FREE && (
        <FomoBanner
          title="You're missing revenue every week 📊"
          body="Growth tier shows your dead hours, recovers lost regulars, and fills slow slots with automated promos. Most venues earn back the cost in the first week."
          btnLabel="Upgrade to Growth →"
          onBtn={() => openModal('growth')}
        />
      )}

      {/* Locked previews (Free) */}
      {tier === TIERS.FREE && (
        <div className="g2">
          <div className="lk-wrap" style={{ minHeight: 200 }}>
            <div className="lk-blur">
              <SH>Traffic Heatmap</SH>
              <div style={{ height: 80, background: 'var(--s1)', borderRadius: 'var(--r)' }} />
            </div>
            <LockOverlay tier="growth" title="Traffic Heatmap" desc="Hour-by-hour footfall across every day of the week." />
          </div>
          <div className="lk-wrap" style={{ minHeight: 200 }}>
            <div className="lk-blur" style={{ padding: 18 }}>
              <SH>Repeat Rate</SH>
              {['18–24', '25–30', 'Repeat rate'].map(l => (
                <div key={l} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, marginBottom: 4 }}>{l}</div>
                  <div className="prog"><div className="prog-fill" style={{ width: '40%', background: 'var(--in2)' }} /></div>
                </div>
              ))}
            </div>
            <LockOverlay tier="growth" title="Demographics & Repeat Rate" desc="Age breakdown, repeat rate vs industry benchmark, first-timer conversion." />
          </div>
        </div>
      )}
    </div>
  );
}
