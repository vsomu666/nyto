import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { SH, Avatar } from '../components/UI';
import { COMPETITORS, PUSH_TEMPLATES, EVENTS } from '../data/mockData';

/* ══ COMPETITOR INTEL ══ */
export function CompetitorPage() {
  const { showToast } = useToast();

  return (
    <div className="view-enter">
      <div className="page-header">
        <div>
          <div className="page-title">Competitor Intel 👑</div>
          <div className="page-sub">Every venue within 2km · anonymized data · updated every 15 minutes</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-go btn-sm" onClick={() => showToast('Alert configured')}>Set competitor alert</button>
        </div>
      </div>

      <div className="g5">
        <div className="stat gold-stat"><div className="stat-label">Area rank</div><div className="stat-val" style={{ color: 'var(--go2)' }}>#2</div><div className="stat-delta up">↑ 1 this week</div><div className="stat-bench">of 14 venues in 2km</div></div>
        <div className="stat"><div className="stat-label">Your share</div><div className="stat-val">22%</div><div className="stat-bench">of total check-ins</div></div>
        <div className="stat"><div className="stat-label">Gap to #1</div><div className="stat-val" style={{ color: 'var(--rd2)' }}>–42</div><div className="stat-bench">check-ins/week vs Skyhi</div></div>
        <div className="stat"><div className="stat-label">Closest threat</div><div className="stat-val" style={{ fontSize: 16 }}>Skyhi</div><div className="stat-bench">28% share · gaining</div></div>
        <div className="stat"><div className="stat-label">Market growing</div><div className="stat-val" style={{ color: 'var(--gn2)' }}>+12%</div><div className="stat-bench">Jubilee Hills this month</div></div>
      </div>

      <div className="g12">
        {/* Map */}
        <div className="card" style={{ padding: 16 }}>
          <SH>Your area · 2km radius</SH>
          <div className="cmap">
            <div className="cmap-ring" style={{ width: 180, height: 180 }} />
            <div className="cmap-ring" style={{ width: 100, height: 100, borderColor: 'rgba(245,158,11,.15)' }} />
            {[
              { label: '🏠 Halo Bar (you)', left: '50%', top: '50%', isYou: true, size: 24 },
              { label: 'Skyhi #1', left: '35%', top: '30%', color: '#818cf8', size: 20 },
              { label: 'Moonlite #3', left: '65%', top: '40%', color: '#64748b', size: 16 },
              { label: 'Terrace 9', left: '28%', top: '62%', color: '#475569', size: 12 },
              { label: 'The Loft', left: '70%', top: '68%', color: '#475569', size: 12 },
              { label: 'Café Noir', left: '52%', top: '74%', color: '#334155', size: 10 },
              { label: 'Neon Rooftop', left: '18%', top: '48%', color: '#334155', size: 10 },
            ].map((pin, i) => (
              <div key={i} className={`cmap-pin${pin.isYou ? ' you' : ''}`} style={{ left: pin.left, top: pin.top }}>
                <div className="cmap-pin-dot" style={{ width: pin.size, height: pin.size, background: pin.isYou ? 'var(--go2)' : pin.color }} />
                <div className="cmap-pin-label">{pin.label}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: 'var(--mu)', marginTop: 8 }}>Pin size = check-in volume · Gold = you</div>
        </div>

        {/* Benchmark table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--b1)' }}><SH style={{ margin: 0 }}>Benchmark table</SH></div>
          <table className="tbl">
            <thead><tr><th>Venue</th><th>Check-ins/wk</th><th>Repeat %</th><th>Peak night</th><th>Avg group</th></tr></thead>
            <tbody>
              {COMPETITORS.map((c, i) => (
                <tr key={i} style={c.isYou ? { background: 'rgba(245,158,11,.05)' } : {}}>
                  <td>
                    <span style={{ marginRight: 6 }}>{c.rank}</span>
                    {c.isYou ? <b style={{ color: 'var(--go2)' }}>{c.name}</b> : c.name}
                  </td>
                  <td>{c.isYou ? <b>{c.checkins}</b> : c.checkins}</td>
                  <td>{c.isYou ? <b>{c.repeat}</b> : c.repeat}</td>
                  <td>{c.isYou ? <b>{c.peak}</b> : c.peak}</td>
                  <td>{c.isYou ? <b>{c.avgGroup}</b> : c.avgGroup}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Weekly trend */}
      <div className="card mb">
        <SH>Area weekly trend</SH>
        <div style={{ padding: '18px 0', display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => {
            const heights = [45, 55, 60, 72, 95, 100, 68];
            return (
              <div key={d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: '100%', height: `${heights[i]}px`, background: i === 4 || i === 5 ? '#f97316' : 'rgba(99,102,241,.6)', borderRadius: '4px 4px 0 0', transition: 'height .5s' }} />
                <span style={{ fontSize: 10, color: 'var(--dim)' }}>{d}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ══ PUSH CAMPAIGNS ══ */
export function PushCampaignsPage() {
  const { showToast } = useToast();
  const [headline, setHeadline] = useState("Rooftop's alive tonight 🔥");
  const [body, setBody] = useState('Friday energy is going! Craft cocktails, sunset views, and space for you. Come up.');
  const [radius, setRadius] = useState(500);

  const estimatedReach = Math.round(radius * 0.62);

  return (
    <div className="view-enter">
      <div className="page-header">
        <div>
          <div className="page-title">Push Campaigns 👑</div>
          <div className="page-sub">Target users within 500m · geo-fenced · A/B tested · track to-visit conversion</div>
        </div>
      </div>

      <div className="g4">
        <div className="stat"><div className="stat-label">Campaigns this month</div><div className="stat-val">12</div></div>
        <div className="stat"><div className="stat-label">Avg open rate</div><div className="stat-val">38%</div><div className="stat-bench">Industry avg: 14%</div></div>
        <div className="stat"><div className="stat-label">Open → visit rate</div><div className="stat-val">19%</div><div className="stat-bench">≈ 1 in 5 visitors</div></div>
        <div className="stat"><div className="stat-label">Revenue attributed</div><div className="stat-val">₹68k</div><div className="stat-bench">from push this month</div></div>
      </div>

      {/* Templates */}
      <div className="card mb">
        <SH>Quick launch templates</SH>
        <div className="g3" style={{ margin: 0 }}>
          {PUSH_TEMPLATES.map((t, i) => (
            <div key={i} style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', padding: 14 }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>{t.emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{t.title}</div>
              <div style={{ fontSize: 11, color: 'var(--mu)', marginBottom: 12 }}>{t.body}</div>
              <button className="btn btn-go btn-sm" style={{ width: '100%' }} onClick={() => showToast(t.toastMsg)}>
                {t.action}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Campaign builder */}
      <div className="card mb">
        <SH>Campaign builder</SH>
        <div className="g2">
          <div>
            <div className="field">
              <label>Push headline (60 chars)</label>
              <input type="text" value={headline} onChange={e => setHeadline(e.target.value)} maxLength={60} />
              <div style={{ fontSize: 10, color: 'var(--mu)', marginTop: 3 }}>{headline.length}/60</div>
            </div>
            <div className="field">
              <label>Body message (140 chars)</label>
              <textarea maxLength={140} value={body} onChange={e => setBody(e.target.value)} />
              <div style={{ fontSize: 10, color: 'var(--mu)', marginTop: 3 }}>{body.length}/140</div>
            </div>
            <div className="field">
              <label>Attach offer (optional)</label>
              <select>
                <option>No offer</option>
                <option>100 NC bonus on check-in</option>
                <option>200 NC bonus</option>
                <option>Free shot on arrival</option>
                <option>Custom...</option>
              </select>
            </div>
          </div>
          <div>
            <div className="field">
              <label>Target radius: <b>{radius}m</b></label>
              <input
                type="range" min={100} max={1000} step={100} value={radius}
                onChange={e => setRadius(+e.target.value)}
                style={{ width: '100%', margin: '8px 0', accentColor: 'var(--go)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--mu)' }}>
                <span>100m</span><span>1000m</span>
              </div>
            </div>

            {/* Preview card */}
            <div style={{ background: 'var(--bg)', border: '1px solid var(--b2)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: 'var(--mu)', marginBottom: 8 }}>📱 Preview</div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#a78bfa)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{headline || 'Your headline here'}</div>
                  <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 2, lineHeight: 1.4 }}>{body.slice(0, 80)}{body.length > 80 ? '...' : ''}</div>
                </div>
              </div>
            </div>

            {/* Reach estimate */}
            <div style={{ background: 'rgba(245,158,11,.07)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 'var(--r)', padding: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--go)', fontWeight: 600, marginBottom: 4 }}>Estimated reach</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{estimatedReach.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: 'var(--mu)' }}>NYTO users within {radius}m right now</div>
            </div>
          </div>
        </div>
        <button className="btn btn-go" onClick={() => showToast(`Push sent to ~${estimatedReach} users ✓`)}>
          Send push now →
        </button>
      </div>

      {/* Campaign history */}
      <div className="card">
        <SH>Recent campaigns</SH>
        <table className="tbl">
          <thead><tr><th>Campaign</th><th>Sent</th><th>Open rate</th><th>Visits</th><th>Revenue</th></tr></thead>
          <tbody>
            {[
              { name: 'Friday Rooftop Reminder', date: 'Jun 7', sent: 312, opens: '41%', visits: 58, rev: '₹12,600' },
              { name: 'Happy Hour Boost', date: 'Jun 5', sent: 188, opens: '36%', visits: 34, rev: '₹7,400' },
              { name: 'Live DJ Tonight', date: 'Jun 1', sent: 445, opens: '39%', visits: 72, rev: '₹16,800' },
            ].map((c, i) => (
              <tr key={i}>
                <td>{c.name}</td>
                <td style={{ color: 'var(--mu)' }}>{c.date} · {c.sent} users</td>
                <td style={{ color: 'var(--gn2)' }}>{c.opens}</td>
                <td>{c.visits}</td>
                <td style={{ color: 'var(--go2)', fontWeight: 600 }}>{c.rev}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ══ EVENTS ══ */
export function EventsPage() {
  const { showToast, showError } = useToast();
  const { activeVenue } = useAuth();
  const [showBuilder, setShowBuilder] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [uploading, setUploading]     = useState(false);
  const bannerRef = useRef(null);
  const [newEvent, setNewEvent] = useState({
    title: '', description: '', starts_at: '', ends_at: '',
    ticket_price: '', ticket_count: '', cover_image_url: '',
  });
  const [bannerPreview, setBannerPreview] = useState(null);

  const updateEvent = (field) => (e) => setNewEvent(ev => ({ ...ev, [field]: e.target.value }));

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showError('Only images allowed'); return; }
    if (file.size > 5 * 1024 * 1024)    { showError('File must be under 5 MB'); return; }
    setUploading(true);
    try {
      const IS_LIVE = process.env.REACT_APP_SUPABASE_URL !== 'https://1234.supabase.co';
      if (IS_LIVE && activeVenue?.id) {
        const ext  = file.name.split('.').pop();
        const path = `events/${activeVenue.id}/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from('venue-photos').upload(path, file, { upsert: true });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('venue-photos').getPublicUrl(path);
        setNewEvent(ev => ({ ...ev, cover_image_url: publicUrl }));
        setBannerPreview(publicUrl);
      } else {
        const url = URL.createObjectURL(file);
        setBannerPreview(url);
        setNewEvent(ev => ({ ...ev, cover_image_url: url }));
      }
      showToast('Banner uploaded ✓');
    } catch (err) {
      showError('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title.trim())    { showError('Event title is required'); return; }
    if (!newEvent.starts_at)       { showError('Start date & time is required'); return; }
    if (!newEvent.ticket_price)    { showError('Ticket price is required'); return; }
    if (!newEvent.ticket_count)    { showError('Number of tickets is required'); return; }
    setSaving(true);
    try {
      const IS_LIVE = process.env.REACT_APP_SUPABASE_URL !== 'https://1234.supabase.co';
      if (IS_LIVE && activeVenue?.id) {
        const { error } = await supabase.from('events').insert({
          venue_id:        activeVenue.id,
          title:           newEvent.title,
          description:     newEvent.description,
          starts_at:       newEvent.starts_at,
          ends_at:         newEvent.ends_at || null,
          ticket_price:    parseFloat(newEvent.ticket_price),
          ticket_count:    parseInt(newEvent.ticket_count),
          cover_image_url: newEvent.cover_image_url || null,
          status:          'on_sale',
        });
        if (error) throw error;
      }
      showToast('Event created ✓ · Now live on NYTO');
      setShowBuilder(false);
      setNewEvent({ title: '', description: '', starts_at: '', ends_at: '', ticket_price: '', ticket_count: '', cover_image_url: '' });
      setBannerPreview(null);
    } catch (err) {
      showError('Failed to create event: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="view-enter">
      <div className="page-header">
        <div>
          <div className="page-title">Events & Ticketing 👑</div>
          <div className="page-sub">Create ticketed events · sell through NYTO at 0% commission (launch phase)</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-go" onClick={() => setShowBuilder(b => !b)}>+ Create event</button>
        </div>
      </div>

      <div className="g4">
        <div className="stat gold-stat"><div className="stat-label">Events this month</div><div className="stat-val">3</div></div>
        <div className="stat"><div className="stat-label">Tickets sold</div><div className="stat-val">92</div><div className="stat-delta up">↑ 18 this week</div></div>
        <div className="stat"><div className="stat-label">Revenue from events</div><div className="stat-val" style={{ color: 'var(--go2)' }}>₹55,508</div></div>
        <div className="stat"><div className="stat-label">Commission</div><div className="stat-val" style={{ color: 'var(--gn2)' }}>0%</div><div className="stat-bench">Launch phase bonus</div></div>
      </div>

      {/* Event builder */}
      {showBuilder && (
        <div className="card mb card-go">
          <SH>New event builder</SH>

          {/* Banner upload */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--mu)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.04em' }}>Event banner</div>
            <input ref={bannerRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBannerUpload} />
            {bannerPreview ? (
              <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', height: 160, marginBottom: 8 }}>
                <img src={bannerPreview} alt="banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  onClick={() => { setBannerPreview(null); setNewEvent(ev => ({ ...ev, cover_image_url: '' })); }}
                  style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.6)', border: 'none', borderRadius: 6, color: '#fff', padding: '4px 8px', cursor: 'pointer', fontSize: 11 }}
                >✕ Remove</button>
              </div>
            ) : (
              <div
                onClick={() => bannerRef.current?.click()}
                style={{ height: 120, borderRadius: 10, border: '2px dashed var(--b2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', transition: 'border-color .15s', background: 'var(--s1)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--go)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--b2)'}
              >
                <span style={{ fontSize: 28 }}>{uploading ? '⏳' : '🖼'}</span>
                <span style={{ fontSize: 12, color: 'var(--mu)' }}>{uploading ? 'Uploading…' : 'Click to upload event banner'}</span>
                <span style={{ fontSize: 11, color: 'var(--dim)' }}>JPG, PNG or WebP · max 5 MB · recommended 1200×630</span>
              </div>
            )}
          </div>

          <div className="g2">
            <div>
              <div className="field"><label>Event title *</label><input type="text" placeholder="e.g. Saturday Night Live" value={newEvent.title} onChange={updateEvent('title')} /></div>
              <div className="field"><label>Start date & time *</label><input type="datetime-local" value={newEvent.starts_at} onChange={updateEvent('starts_at')} /></div>
              <div className="field"><label>End date & time</label><input type="datetime-local" value={newEvent.ends_at} onChange={updateEvent('ends_at')} /></div>
            </div>
            <div>
              <div className="field"><label>Ticket price (₹) *</label><input type="number" placeholder="799" value={newEvent.ticket_price} onChange={updateEvent('ticket_price')} /></div>
              <div className="field"><label>Total tickets *</label><input type="number" placeholder="60" value={newEvent.ticket_count} onChange={updateEvent('ticket_count')} /></div>
              <div className="field"><label>Description</label><textarea placeholder="Describe your event…" value={newEvent.description} onChange={updateEvent('description')} rows={3} /></div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-go" onClick={handleCreateEvent} disabled={saving || uploading}>
              {saving ? 'Publishing…' : 'Create & publish'}
            </button>
            <button className="btn" onClick={() => { setShowBuilder(false); setBannerPreview(null); }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Active events */}
      <div className="card mb">
        <SH>Active events</SH>
        {EVENTS.map((ev, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: i < EVENTS.length - 1 ? '1px solid var(--b1)' : 'none' }}>
            <div style={{ width: 48, height: 48, borderRadius: 10, background: 'linear-gradient(135deg,rgba(245,158,11,.2),rgba(251,191,36,.1))', border: '1px solid rgba(245,158,11,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🎉</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{ev.title}</div>
              <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 2 }}>{ev.date} · {ev.time}</div>
              <div style={{ marginTop: 6 }}>
                <div style={{ fontSize: 11, color: 'var(--mu)', marginBottom: 3 }}>
                  {ev.sold} / {ev.tickets} tickets sold · {ev.price}
                </div>
                <div style={{ height: 4, borderRadius: 2, background: 'var(--b1)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(ev.sold / ev.tickets) * 100}%`, background: ev.sold === ev.tickets ? 'var(--gn)' : 'var(--go)', borderRadius: 2, transition: 'width .5s' }} />
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, color: 'var(--go2)', fontSize: 14 }}>{ev.revenue}</div>
              <span className={`tag tag-${ev.status === 'Sold out' ? 'lost' : 'ok'}`}>{ev.status}</span>
            </div>
            <button className="btn btn-sm" onClick={() => showToast(`${ev.title} management opening...`)}>Manage</button>
          </div>
        ))}
      </div>

      {/* Info card */}
      <div className="card card-go">
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 28 }}>🎟️</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>0% commission during launch phase</div>
            <div style={{ fontSize: 12, color: 'var(--mu)', lineHeight: 1.6 }}>
              NYTO charges 0% on ticket sales during our launch period. Standard commission of 4% applies after launch.
              One successful Saturday night event covers your Prime subscription 4× over.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══ GROUP INSIGHTS ══ */
export function GroupInsightsPage() {
  const { showToast } = useToast();

  const connectors = [
    { initials: 'PS', color: 'linear-gradient(135deg,#6366f1,#a78bfa)', name: 'Priya S.', groups: 7, newCustomers: 19, revenue: '₹22,400' },
    { initials: 'KR', color: 'linear-gradient(135deg,#22d3ee,#6366f1)', name: 'Karthik R.', groups: 5, newCustomers: 12, revenue: '₹11,760' },
    { initials: 'AM', color: 'linear-gradient(135deg,#ec4899,#f59e0b)', name: 'Ananya M.', groups: 4, newCustomers: 11, revenue: '₹9,900' },
  ];

  const repeatGroups = [
    { members: [{ i: 'PS', c: '#6366f1' }, { i: 'KR', c: '#22d3ee' }, { i: 'AM', c: '#ec4899' }], names: 'Priya S., Karthik R., Ananya M.', visits: 8, label: '"Wednesday squad"' },
    { members: [{ i: 'SK', c: '#f97316' }, { i: 'RD', c: '#22c55e' }], names: 'Sneha K., Rohan D. + 4 others', visits: 5, label: '"Office crew"' },
    { members: [{ i: 'NJ', c: '#8b5cf6' }, { i: 'TM', c: '#ec4899' }], names: 'Nikhil J., Tanya M. + 2 others', visits: 4, label: '"Friday regulars"' },
  ];

  return (
    <div className="view-enter">
      <div className="page-header">
        <div>
          <div className="page-title">Group Insights 👑</div>
          <div className="page-sub">Social graph · connectors · repeat group compositions</div>
        </div>
      </div>

      <div className="g4">
        <div className="stat gold-stat"><div className="stat-label">Group check-ins</div><div className="stat-val">64%</div><div className="stat-bench">of all visits are groups</div></div>
        <div className="stat"><div className="stat-label">Avg group size</div><div className="stat-val">2.8</div></div>
        <div className="stat"><div className="stat-label">Top connectors</div><div className="stat-val">18</div><div className="stat-bench">power users</div></div>
        <div className="stat"><div className="stat-label">Network revenue</div><div className="stat-val" style={{ color: 'var(--go2)' }}>₹44k</div><div className="stat-bench">from connector activity</div></div>
      </div>

      {/* Group compositions */}
      <div className="g2">
        <div className="card">
          <SH>Repeat group compositions</SH>
          <div style={{ fontSize: 11, color: 'var(--mu)', marginBottom: 12 }}>Groups that have visited together 3+ times</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {repeatGroups.map((g, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--s1)', borderRadius: 'var(--r)', border: '1px solid var(--b1)' }}>
                <div style={{ display: 'flex' }}>
                  {g.members.map((m, j) => (
                    <div key={j} className="cav" style={{ width: 28, height: 28, fontSize: 10, background: `linear-gradient(135deg, ${m.c}, ${m.c}88)`, marginLeft: j > 0 ? -8 : 0, border: '2px solid var(--bg3)' }}>
                      {m.i}
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{g.names}</div>
                  <div style={{ fontSize: 11, color: 'var(--mu)' }}>Visited together {g.visits} times · {g.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <SH>Group size breakdown</SH>
          {[
            { label: 'Solo', val: 12, color: 'rgba(99,102,241,.85)' },
            { label: 'Pairs', val: 34, color: 'rgba(139,92,246,.85)' },
            { label: 'Triples', val: 22, color: 'rgba(167,139,250,.85)' },
            { label: 'Quads', val: 18, color: 'rgba(236,72,153,.85)' },
            { label: '5+', val: 14, color: '#f97316' },
          ].map(g => (
            <div key={g.label} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span>{g.label}</span><span className="neu">{g.val}%</span>
              </div>
              <div className="prog"><div className="prog-fill" style={{ width: `${g.val}%`, background: g.color }} /></div>
            </div>
          ))}
        </div>
      </div>

      {/* Connectors table */}
      <div className="card">
        <SH right={<span style={{ color: 'var(--go2)', textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>Gold ring = top connector</span>}>
          Your connectors — customers who bring new people
        </SH>
        <table className="tbl">
          <thead>
            <tr><th>Customer</th><th>Groups brought</th><th>New customers introduced</th><th>Est. revenue generated</th><th></th></tr>
          </thead>
          <tbody>
            {connectors.map((c, i) => (
              <tr key={i}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar initials={c.initials} color={c.color} />
                    <div>
                      <div style={{ fontWeight: 500 }}>{c.name}</div>
                      {i === 0 && <div style={{ fontSize: 11, color: 'var(--mu)' }}>Top connector</div>}
                    </div>
                  </div>
                </td>
                <td>{c.groups} groups</td>
                <td>{c.newCustomers} new customers</td>
                <td style={{ color: 'var(--gn2)' }}>{c.revenue}</td>
                <td>
                  <button className="btn btn-sm btn-go" onClick={() => showToast(`500 NC sent to ${c.name} ✓`)}>
                    Send 500 NC
                  </button>
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={5} style={{ color: 'var(--mu)', fontSize: 12 }}>
                + 15 more connectors ·{' '}
                <button className="btn btn-xs" onClick={() => showToast('Loading all connectors...')}>Load all</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}