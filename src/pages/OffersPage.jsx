import React, { useState } from 'react';
import { useApp, TIERS } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { SH, LockOverlay } from '../components/UI';

const INITIAL_OFFERS = [
  { id: 1, emoji: '🎉', bg: 'rgba(99,102,241,.12)',  name: 'Welcome Shot',  desc: 'Complimentary shot on first visit at your venue', tag: 'FIRST VISIT', tagClass: 'tag-new',  type: 'first_visit', status: 'active',  nc_multiplier: 1 },
  { id: 2, emoji: '⚡', bg: 'rgba(249,115,22,.12)',  name: 'Power Hour',    desc: '2× NC for first 20 check-ins · Tap to trigger',  tag: 'ON DEMAND',  tagClass: 'tag-live', type: 'power_hour', status: 'active',  nc_multiplier: 2 },
  { id: 3, emoji: '🔄', bg: 'rgba(34,197,94,.12)',   name: 'Win-back Drop', desc: '100 NC win-back to lapsed regulars (21+ days)',   tag: 'AUTO',       tagClass: 'tag-growth',type: 'win_back',  status: 'paused',  nc_multiplier: 1 },
];

const CAMPAIGN_TEMPLATES = [
  { emoji: '🌅', bg: 'rgba(249,115,22,.12)',  name: 'Dead Hour Filler',   desc: 'Auto 2× NC during your slowest identified slot',     tag: 'AUTO',       tagClass: 'tag-growth' },
  { emoji: '🔁', bg: 'rgba(99,102,241,.12)',  name: 'First-timer Push',   desc: '+100 NC bonus for first-ever check-in at your venue', tag: 'ALWAYS ON',  tagClass: 'tag-ok'    },
  { emoji: '👥', bg: 'rgba(236,72,153,.12)',  name: 'Group Bonus',        desc: 'Extra +50 NC per person when group size ≥ 3',         tag: 'GROUP',      tagClass: 'tag-new'   },
];

const POWER_HOUR_ACTIVE_KEY = 'nyto_power_hour_active';

export function OffersPage() {
  const { tier, openModal } = useApp();
  const { showToast, showError } = useToast();

  const [offers, setOffers]            = useState(INITIAL_OFFERS);
  const [campaigns, setCampaigns]      = useState(CAMPAIGN_TEMPLATES.map((c,i) => ({ ...c, id: i+10, active: i === 1 })));
  const [powerHourActive, setPowerHour]= useState(!!sessionStorage.getItem(POWER_HOUR_ACTIVE_KEY));
  const [phDuration, setPhDuration]    = useState('1');
  const [phMaxCI, setPhMaxCI]          = useState('20');
  const [showNewOffer, setShowNewOffer]= useState(false);
  const [newOffer, setNewOffer]        = useState({ name: '', desc: '', type: 'custom', multiplier: '1' });
  const [editId, setEditId]            = useState(null);
  const [editData, setEditData]        = useState({});

  const activeCount  = offers.filter(o => o.status === 'active').length;
  const offerLimit   = tier === TIERS.FREE ? 2 : tier === TIERS.GROWTH ? 5 : 999;

  /* ── Toggle offer status ── */
  const toggleOffer = (id) => {
    setOffers(os => os.map(o => {
      if (o.id !== id) return o;
      if (o.status === 'paused') {
        if (o.status === 'paused' && activeCount >= offerLimit) {
          showError(`Your ${tier} plan allows max ${offerLimit} active offers. Pause another first.`);
          return o;
        }
        showToast(`${o.name} activated ✓`);
        return { ...o, status: 'active' };
      }
      showToast(`${o.name} paused`);
      return { ...o, status: 'paused' };
    }));
  };

  /* ── Trigger offer (power hour) ── */
  const triggerOffer = (o) => {
    if (o.type === 'power_hour') {
      setPowerHour(true);
      sessionStorage.setItem(POWER_HOUR_ACTIVE_KEY, '1');
      showToast(`Power Hour launched for ${phDuration}h · ${phMaxCI} check-ins at 2× NC ✓`);
    } else {
      showToast(`${o.name} triggered — customers notified ✓`);
    }
  };

  /* ── Delete offer ── */
  const deleteOffer = (id) => {
    setOffers(os => os.filter(o => o.id !== id));
    showToast('Offer deleted');
    setEditId(null);
  };

  /* ── Save edit ── */
  const saveEdit = (id) => {
    setOffers(os => os.map(o => o.id === id ? { ...o, ...editData } : o));
    setEditId(null);
    showToast('Offer updated ✓');
  };

  /* ── Create new offer ── */
  const createOffer = () => {
    if (!newOffer.name.trim()) { showError('Please enter an offer name'); return; }
    if (activeCount >= offerLimit) {
      showError(`Limit reached: your ${tier} plan allows ${offerLimit} active offers`);
      return;
    }
    const offer = {
      id: Date.now(), emoji: '🎁',
      bg: 'rgba(99,102,241,.12)',
      name: newOffer.name,
      desc: newOffer.desc || 'Custom offer',
      tag: 'CUSTOM', tagClass: 'tag-new',
      type: newOffer.type,
      status: 'active',
      nc_multiplier: parseFloat(newOffer.multiplier) || 1,
    };
    setOffers(os => [...os, offer]);
    setNewOffer({ name: '', desc: '', type: 'custom', multiplier: '1' });
    setShowNewOffer(false);
    showToast(`"${offer.name}" created and activated ✓`);
  };

  /* ── Toggle campaign ── */
  const toggleCampaign = (id) => {
    setCampaigns(cs => cs.map(c => {
      if (c.id !== id) return c;
      const next = !c.active;
      showToast(next ? `${c.name} campaign activated ✓` : `${c.name} paused`);
      return { ...c, active: next };
    }));
  };

  /* ── Power Hour stop ── */
  const stopPowerHour = () => {
    setPowerHour(false);
    sessionStorage.removeItem(POWER_HOUR_ACTIVE_KEY);
    showToast('Power Hour stopped');
  };

  return (
    <div className="view-enter">
      <div className="page-header">
        <div>
          <div className="page-title">Offers & Campaigns</div>
          <div className="page-sub">Manage promotions · {activeCount} of {offerLimit === 999 ? '∞' : offerLimit} offers active</div>
        </div>
        <div className="page-actions">
          {(activeCount < offerLimit || offerLimit === 999) && (
            <button className="btn btn-in btn-sm" onClick={() => setShowNewOffer(s => !s)}>
              {showNewOffer ? '✕ Cancel' : '+ New offer'}
            </button>
          )}
          {activeCount >= offerLimit && offerLimit !== 999 && (
            <button className="btn btn-sm" onClick={() => openModal(tier === TIERS.FREE ? 'growth' : 'prime')}>
              🔒 Upgrade for more offers
            </button>
          )}
        </div>
      </div>

      {/* ── Power Hour active banner ── */}
      {powerHourActive && (
        <div style={{ marginBottom: 20, padding: '14px 18px', background: 'linear-gradient(135deg,rgba(249,115,22,.18),rgba(239,68,68,.1))', border: '1px solid rgba(249,115,22,.45)', borderRadius: 'var(--r2)', display: 'flex', alignItems: 'center', gap: 14, animation: 'pulseBanner 2s infinite' }}>
          <span style={{ fontSize: 22 }}>⚡</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--or)' }}>Power Hour is LIVE</div>
            <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 2 }}>
              2× NC active for next {phDuration}h · max {phMaxCI} check-ins · users near you are being notified
            </div>
          </div>
          <button className="btn btn-sm btn-rd" onClick={stopPowerHour}>Stop</button>
        </div>
      )}

      {/* ── New offer builder ── */}
      {showNewOffer && (
        <div className="card mb" style={{ border: '1px solid rgba(99,102,241,.35)', background: 'rgba(99,102,241,.04)' }}>
          <SH>Create new offer</SH>
          <div className="g2">
            <div>
              <div className="field">
                <label>Offer name *</label>
                <input type="text" placeholder="e.g. Happy Hour Special" maxLength={60}
                  value={newOffer.name}
                  onChange={e => setNewOffer(n => ({ ...n, name: e.target.value }))} />
              </div>
              <div className="field">
                <label>Description</label>
                <input type="text" placeholder="Short description shown to customers" maxLength={100}
                  value={newOffer.desc}
                  onChange={e => setNewOffer(n => ({ ...n, desc: e.target.value }))} />
              </div>
            </div>
            <div>
              <div className="field">
                <label>Offer type</label>
                <select value={newOffer.type} onChange={e => setNewOffer(n => ({ ...n, type: e.target.value }))}>
                  <option value="custom">Custom offer</option>
                  <option value="first_visit">First visit bonus</option>
                  <option value="power_hour">Power Hour (2×)</option>
                  <option value="win_back">Win-back campaign</option>
                </select>
              </div>
              <div className="field">
                <label>NC multiplier (max 2× per v2 rules)</label>
                <select value={newOffer.multiplier} onChange={e => setNewOffer(n => ({ ...n, multiplier: e.target.value }))}>
                  <option value="1">1× (standard)</option>
                  <option value="1.5">1.5×</option>
                  <option value="2">2× (maximum)</option>
                </select>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-in" onClick={createOffer}>Create & activate</button>
            <button className="btn" onClick={() => setShowNewOffer(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── Active offers list ── */}
      <div className="card mb">
        <SH right={
          <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400, color: activeCount >= offerLimit && offerLimit !== 999 ? 'var(--rd2)' : 'var(--mu)' }}>
            {activeCount} / {offerLimit === 999 ? '∞' : offerLimit} active
          </span>
        }>
          Your offers
        </SH>

        {offers.length === 0 && (
          <div style={{ padding: '28px 0', textAlign: 'center', color: 'var(--mu)', fontSize: 13 }}>
            No offers yet — click "+ New offer" to create one
          </div>
        )}

        {offers.map((o) => (
          <div key={o.id}>
            {/* Main row */}
            <div className="ocard" style={{ opacity: o.status === 'paused' ? 0.6 : 1, transition: 'opacity .2s' }}>
              <div className="oico" style={{ background: o.bg }}>{o.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 13 }}>
                  {o.name}
                  {o.nc_multiplier > 1 && <span style={{ marginLeft: 6, fontSize: 10, background: 'rgba(249,115,22,.15)', color: 'var(--or)', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>{o.nc_multiplier}×</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 2 }}>{o.desc}</div>
              </div>
              <span className={`tag ${o.tagClass}`}>{o.tag}</span>

              {/* Status toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 10, color: o.status === 'active' ? 'var(--gn2)' : 'var(--dim)', fontWeight: 500 }}>
                  {o.status === 'active' ? 'Active' : 'Paused'}
                </span>
                <button
                  onClick={() => toggleOffer(o.id)}
                  style={{ width: 36, height: 20, borderRadius: 10, border: 'none', background: o.status === 'active' ? 'var(--gn)' : 'var(--b2)', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}
                >
                  <div style={{ position: 'absolute', top: 2, left: o.status === 'active' ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
                </button>
              </div>

              {o.status === 'active' && (
                <button className="btn btn-sm btn-in" onClick={() => triggerOffer(o)}>Trigger</button>
              )}

              <button
                className="btn btn-xs"
                style={{ padding: '4px 8px' }}
                onClick={() => { setEditId(editId === o.id ? null : o.id); setEditData({ name: o.name, desc: o.desc }); }}
              >
                {editId === o.id ? 'Cancel' : '✎ Edit'}
              </button>
            </div>

            {/* Inline edit panel */}
            {editId === o.id && (
              <div style={{ margin: '0 0 12px', padding: '14px 16px', background: 'var(--s1)', borderRadius: 'var(--r)', border: '1px solid var(--b1)' }}>
                <div className="g2" style={{ marginBottom: 10 }}>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label>Offer name</label>
                    <input type="text" value={editData.name || ''} onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} />
                  </div>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label>Description</label>
                    <input type="text" value={editData.desc || ''} onChange={e => setEditData(d => ({ ...d, desc: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-in btn-sm" onClick={() => saveEdit(o.id)}>Save changes</button>
                  <button className="btn btn-sm btn-rd" onClick={() => deleteOffer(o.id)}>Delete offer</button>
                  <button className="btn btn-sm" onClick={() => setEditId(null)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}

        {tier === TIERS.FREE && (
          <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(99,102,241,.06)', borderRadius: 'var(--r)', border: '1px solid rgba(99,102,241,.15)', fontSize: 12, color: 'var(--mu)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Free tier: max 2 active offers</span>
            <button className="btn btn-xs btn-in" onClick={() => openModal('growth')}>Unlock 5 offers</button>
          </div>
        )}
      </div>

      {/* ── Power Hour configurator ── */}
      <div className="card mb">
        <SH>⚡ Power Hour</SH>
        <div style={{ fontSize: 13, color: 'var(--tx2)', marginBottom: 14, lineHeight: 1.6 }}>
          Instantly trigger a 2× NC boost. Drive walk-ins at any time — perfect for filling empty seats on slow evenings.
          <span style={{ color: 'var(--mu)' }}> (v2 rule: venue max is 2×)</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Duration</label>
            <select value={phDuration} onChange={e => setPhDuration(e.target.value)}>
              <option value="0.5">30 minutes</option>
              <option value="1">1 hour</option>
              <option value="2">2 hours</option>
              <option value="3">3 hours</option>
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Max check-ins at 2×</label>
            <select value={phMaxCI} onChange={e => setPhMaxCI(e.target.value)}>
              <option value="10">10 check-ins</option>
              <option value="20">20 check-ins</option>
              <option value="30">30 check-ins</option>
              <option value="0">Unlimited</option>
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Notify radius</label>
            <select>
              <option>500m (recommended)</option>
              <option>1 km</option>
              <option>2 km</option>
            </select>
          </div>
        </div>
        {powerHourActive ? (
          <button className="btn btn-rd" onClick={stopPowerHour}>⏸ Stop Power Hour</button>
        ) : (
          <button className="btn btn-go" onClick={() => {
            setPowerHour(true);
            sessionStorage.setItem(POWER_HOUR_ACTIVE_KEY, '1');
            showToast(`Power Hour launched! 2× NC for ${phDuration}h / ${phMaxCI === '0' ? 'unlimited' : phMaxCI} check-ins ✓`);
          }}>
            ⚡ Launch Power Hour now
          </button>
        )}
      </div>

      {/* ── Scheduled campaigns (Growth/Prime) ── */}
      {tier !== TIERS.FREE ? (
        <div className="card mb">
          <SH right={<span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400, color: 'var(--mu)' }}>Auto-running campaigns</span>}>
            Campaign templates
          </SH>
          {campaigns.map((c) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 0', borderBottom: '1px solid var(--b1)' }}>
              <div className="oico" style={{ background: c.bg }}>{c.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 1 }}>{c.desc}</div>
              </div>
              <span className={`tag ${c.tagClass}`}>{c.tag}</span>
              <span style={{ fontSize: 11, color: c.active ? 'var(--gn2)' : 'var(--dim)', fontWeight: 500, minWidth: 40, textAlign: 'right' }}>
                {c.active ? 'On' : 'Off'}
              </span>
              <button
                onClick={() => toggleCampaign(c.id)}
                style={{ width: 40, height: 22, borderRadius: 11, border: 'none', background: c.active ? 'var(--gn)' : 'var(--b2)', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}
              >
                <div style={{ position: 'absolute', top: 3, left: c.active ? 20 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="lk-wrap mb" style={{ minHeight: 180 }}>
          <div className="lk-blur" style={{ padding: 18 }}>
            <SH>Campaign templates</SH>
            {campaigns.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--b1)' }}>
                <span>{c.emoji}</span>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</div>
              </div>
            ))}
          </div>
          <LockOverlay tier="growth" title="Campaign Templates" desc="Auto dead-hour fillers, first-timer bonuses, and group boosters — all automated." />
        </div>
      )}
    </div>
  );
}
