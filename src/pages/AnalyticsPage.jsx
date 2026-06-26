import React, { useMemo } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, LineElement, PointElement, ArcElement,
  Tooltip, Filler, Legend,
} from 'chart.js';
import { useApp, TIERS } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { StatCard, SH } from '../components/UI';
import {
  HEATMAP_DATA, HEATMAP_HOURS, WEEKLY_DATA, WEEKLY_LABELS,
} from '../data/mockData';
import {
  SCALE_CONFIG, weekBarColor, heatmapCellColor,
  generateTrendData, generateTrendLabels,
} from '../utils/chartUtils';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Filler, Legend);

export function AnalyticsPage() {
  const { tier } = useApp();
  const { showToast } = useToast();
  const trendData = useMemo(() => generateTrendData(30), []);
  const trendLabels = useMemo(() => generateTrendLabels(30), []);

  return (
    <div className="view-enter">
      <div className="page-header">
        <div>
          <div className="page-title">Analytics</div>
          <div className="page-sub">Full data breakdown · 30-day window · hourly heatmap</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-sm">Last 30 days ▾</button>
          <button className="btn btn-sm" onClick={() => {
            const rows = [['Metric','Value'],['Today check-ins','312'],['Yesterday','284'],['Weekly avg','120'],['Monthly total','3,840']];
            const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = Object.assign(document.createElement('a'), { href: url, download: 'nyto_analytics.csv' });
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('Analytics exported as nyto_analytics.csv ✓');
          }}>⬇ Export report</button>
        </div>
      </div>

      <div className="g4">
        <StatCard label="Check-ins (30d)" value="3,847" delta="↑ 23%" deltaClass="up" />
        <StatCard label="Avg daily" value="128" delta="↑ 24" deltaClass="up" />
        <StatCard label="Visit frequency" value="2.8×" bench="per customer/month" />
        <StatCard label="Avg visit spend" value="₹1,180" delta="↑ ₹80" deltaClass="up" />
      </div>

      {/* Heatmap */}
      <div className="card mb">
        <SH>Traffic heatmap · 7 days × 14 hours</SH>
        <Heatmap />
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--mu)', marginTop: 8 }}>
          Low
          {['rgba(99,102,241,.12)', 'rgba(99,102,241,.4)', 'rgba(249,115,22,.5)', '#f97316'].map((bg, i) => (
            <div key={i} style={{ width: 14, height: 14, borderRadius: 3, background: bg }} />
          ))}
          Peak
        </div>
      </div>

      <div className="g2">
        {/* Trend */}
        <div className="card">
          <SH>30-day trend {tier === TIERS.PRIME && <span style={{ color: 'var(--go)', textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>+ AI forecast overlay</span>}</SH>
          <div className="cw cw-220">
            <Line
              data={{
                labels: trendLabels,
                datasets: [{
                  label: 'Check-ins', data: trendData,
                  borderColor: '#818cf8',
                  backgroundColor: 'rgba(99,102,241,.08)',
                  fill: true, tension: 0.4, pointRadius: 0,
                }],
              }}
              options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
                scales: { ...SCALE_CONFIG, x: { ...SCALE_CONFIG.x, ticks: { ...SCALE_CONFIG.x.ticks, maxTicksLimit: 6 } } },
              }}
            />
          </div>
        </div>

        {/* Demographics */}
        <div className="card">
          <SH>Customer demographics</SH>
          {tier === TIERS.PRIME && (
            <div style={{ fontSize: 11, color: 'var(--mu)', marginBottom: 14 }}>
              Prime — includes estimated income bracket and origin area
            </div>
          )}
          {[
            { label: '18–24', pct: 28, color: 'var(--in2)' },
            { label: '25–30', pct: 42, color: 'var(--pu)' },
            { label: '31–35', pct: 22, color: 'var(--cy)' },
            { label: '35+', pct: 8, color: 'var(--go)' },
          ].map(d => (
            <div key={d.label} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span>{d.label}</span><span className="neu">{d.pct}%</span>
              </div>
              <div className="prog"><div className="prog-fill" style={{ width: `${d.pct}%`, background: d.color }} /></div>
            </div>
          ))}

          {tier !== TIERS.PRIME && (
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--b1)', fontSize: 11, color: 'var(--mu)' }}>
              Growth tier · age and visit pattern data. <span style={{ color: 'var(--go2)' }}>Prime unlocks income bracket and neighbourhood origin.</span>
            </div>
          )}

          {tier === TIERS.PRIME && (
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--b1)' }}>
              <SH>Top origin areas</SH>
              {[
                { area: 'HITEC City / Gachibowli', pct: '38%' },
                { area: 'Jubilee Hills / Banjara Hills', pct: '29%' },
                { area: 'Kondapur / Manikonda', pct: '18%' },
                { area: 'Other areas', pct: '15%' },
              ].map(a => (
                <div key={a.area} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'var(--mu)' }}>{a.area}</span>
                  <b>{a.pct}</b>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Weekly + Returning/New */}
      <div className="g2">
        <div className="card">
          <SH>Weekly check-ins by day</SH>
          <div className="cw cw-220">
            <Bar
              data={{
                labels: WEEKLY_LABELS,
                datasets: [{ data: WEEKLY_DATA, backgroundColor: WEEKLY_DATA.map(weekBarColor), borderRadius: 6 }],
              }}
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: SCALE_CONFIG }}
            />
          </div>
        </div>

        <div className="card">
          <SH>Returning vs new</SH>
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <div className="cw cw-160">
              <Doughnut
                data={{
                  labels: ['Returning', 'New'],
                  datasets: [{ data: [66, 34], backgroundColor: ['#818cf8', '#334155'], borderWidth: 0, hoverOffset: 4 }],
                }}
                options={{ responsive: true, maintainAspectRatio: false, cutout: '72%', plugins: { legend: { display: false } } }}
              />
            </div>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>66%</div>
              <div style={{ fontSize: 10, color: 'var(--mu)' }}>Returning</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            {[{ label: 'Returning', pct: '66%', color: '#818cf8' }, { label: 'New visitors', pct: '34%', color: '#334155' }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color }} />
                <span style={{ fontSize: 12, color: 'var(--mu)' }}>{l.label}</span>
                <b style={{ fontSize: 12 }}>{l.pct}</b>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--b1)', display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: 'var(--mu)' }}>Repeat rate</span>
            <b style={{ color: 'var(--gn2)' }}>66% <span style={{ color: 'var(--mu)', fontWeight: 400 }}>vs 42% industry</span></b>
          </div>
        </div>
      </div>
    </div>
  );
}

function Heatmap() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `44px repeat(${HEATMAP_HOURS.length}, 1fr)`, gap: 3 }}>
      <div />
      {HEATMAP_HOURS.map(h => (
        <div key={h} style={{ fontSize: 9, color: 'var(--dim)', textAlign: 'center', padding: '2px 0' }}>{h}</div>
      ))}
      {HEATMAP_DATA.map(row => (
        <React.Fragment key={row.d}>
          <div style={{ fontSize: 10, color: 'var(--dim)', display: 'flex', alignItems: 'center', paddingRight: 6 }}>{row.d}</div>
          {row.v.map((v, ci) => (
            <div key={ci} className="hm-cell" style={{ background: heatmapCellColor(v) }} title={`${row.d}: ${v} check-ins`} />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}
