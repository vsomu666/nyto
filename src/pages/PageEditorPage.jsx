import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { SH } from '../components/UI';
import { supabase } from '../lib/supabaseClient';

const IS_LIVE = process.env.REACT_APP_SUPABASE_URL !== 'https://1234.supabase.co';

const CATEGORIES = ['Bar · Rooftop', 'Cafe', 'Restaurant', 'Club', 'Lounge', 'Pub', 'Bistro', 'Food Court', 'Other'];
const PRICE_TIERS = ['₹ · Budget', '₹₹ · Moderate', '₹₹₹ · Premium', '₹₹₹₹ · Fine dining'];
const VALID_OPTIONS = ['First visit only', 'First 3 visits', 'First 7 days', 'All visits'];
const TAGS_LIST = ['Rooftop', 'Live Music', 'DJ Nights', 'Craft Cocktails', 'Pet Friendly', 'Good for Groups', 'Quiet Ambience', 'Late Night', 'Outdoor Seating', 'Sports Screening', 'Vegan Options', 'Happy Hour', 'Date Night', 'Work-friendly'];

const HOURS_DAYS = [
  { key: 'mon_thu', label: 'Mon – Thu' },
  { key: 'fri_sat', label: 'Fri – Sat' },
  { key: 'sun',     label: 'Sunday'    },
];

export function PageEditorPage() {
  const { activeVenue, updateActiveVenue } = useAuth();
  const { showToast, showError } = useToast();
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('info'); // info | hours | photos | welcome

  const [form, setForm] = useState({
    name:         activeVenue?.name         || 'Halo Bar',
    tagline:      activeVenue?.tagline      || 'Rooftop cocktails with a view of the Hyderabad skyline',
    about:        activeVenue?.about        || 'Premium rooftop bar in Jubilee Hills known for craft cocktails, live DJ sets every weekend, and the best sunset view in HITEC City.',
    location:     activeVenue?.location     || 'Jubilee Hills, Hyderabad',
    category:     activeVenue?.category     || 'Bar · Rooftop',
    price_tier:   activeVenue?.price_tier   || '₹₹ · Moderate',
    welcome_item: activeVenue?.welcome_item || 'Complimentary welcome shot',
    welcome_valid:activeVenue?.welcome_valid|| 'First visit only',
    hours: activeVenue?.hours || {
      mon_thu: '6 PM – 1 AM',
      fri_sat: '6 PM – 3 AM',
      sun:     '6 PM – 12 AM',
    },
    tags: ['Rooftop', 'Craft Cocktails', 'DJ Nights', 'Late Night'],
    photos: ['🍸', '🌆', '🎶', '✨', '🍹'],
  });

  const [dirty, setDirty]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  /* ── Upload photo to Supabase Storage ── */
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (form.photos.filter(p => p.startsWith('http')).length + form.photos.filter(p => p.startsWith('http')).length >= 5) {
      showError('Max 5 photos allowed'); return;
    }
    if (file.size > 5 * 1024 * 1024) { showError('File must be under 5 MB'); return; }
    if (!file.type.startsWith('image/')) { showError('Only image files are allowed'); return; }

    setUploading(true);
    try {
      if (IS_LIVE && activeVenue?.id) {
        const ext  = file.name.split('.').pop();
        const path = `venues/${activeVenue.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('venue-photos').upload(path, file, { upsert: true });
        if (upErr) throw upErr;
        const { data: { publicUrl } } = supabase.storage.from('venue-photos').getPublicUrl(path);
        setForm(f => ({ ...f, photos: [...f.photos.filter(p => !['🍸','🌆','🎶','✨','🍹'].includes(p)), publicUrl] }));
        showToast('Photo uploaded ✓ — save to make it live');
      } else {
        // Mock mode: show a local preview URL
        const url = URL.createObjectURL(file);
        setForm(f => ({ ...f, photos: [...f.photos.filter(p => !['🍸','🌆','🎶','✨','🍹'].includes(p)), url] }));
        showToast('Photo preview added (connect Supabase Storage to persist) ✓');
      }
      setDirty(true);
    } catch (err) {
      showError('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };
  const update = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setDirty(true);
  };
  const updateHours = (key, val) => {
    setForm(f => ({ ...f, hours: { ...f.hours, [key]: val } }));
    setDirty(true);
  };
  const toggleTag = (tag) => {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
    }));
    setDirty(true);
  };

  /* ── Save to Supabase / update local state ── */
  const handleSave = async () => {
    if (!form.name.trim()) { showError('Venue name cannot be empty'); return; }
    if (form.about.length > 280) { showError('About must be 280 characters or less'); return; }
    setSaving(true);

    const payload = {
      name:         form.name,
      tagline:      form.tagline,
      about:        form.about,
      location:     form.location,
      category:     form.category,
      price_tier:   form.price_tier,
      welcome_item: form.welcome_item,
      welcome_valid:form.welcome_valid,
      hours:        form.hours,
      updated_at:   new Date().toISOString(),
    };

    if (IS_LIVE && activeVenue?.id) {
      const { error } = await supabase.from('venues').update(payload).eq('id', activeVenue.id);
      if (error) { showError('Save failed: ' + error.message); setSaving(false); return; }
    }

    // Update local state so sidebar and topbar reflect changes immediately
    updateActiveVenue(payload);
    setDirty(false);
    setSaving(false);
    showToast('Page saved — changes are live on the NYTO app ✓');
  };

  const handleDiscard = () => {
    setForm({
      name:         activeVenue?.name         || 'Halo Bar',
      tagline:      activeVenue?.tagline      || '',
      about:        activeVenue?.about        || '',
      location:     activeVenue?.location     || '',
      category:     activeVenue?.category     || 'Bar · Rooftop',
      price_tier:   activeVenue?.price_tier   || '₹₹ · Moderate',
      welcome_item: activeVenue?.welcome_item || '',
      welcome_valid:activeVenue?.welcome_valid|| 'First visit only',
      hours:        activeVenue?.hours        || { mon_thu: '6 PM – 1 AM', fri_sat: '6 PM – 3 AM', sun: '6 PM – 12 AM' },
      tags:         ['Rooftop', 'Craft Cocktails', 'DJ Nights', 'Late Night'],
      photos:       ['🍸', '🌆', '🎶', '✨', '🍹'],
    });
    setDirty(false);
    showToast('Changes discarded');
  };

  const TABS = [
    { key: 'info',    label: 'Basic info'   },
    { key: 'hours',   label: 'Hours'        },
    { key: 'photos',  label: 'Photos'       },
    { key: 'welcome', label: 'Welcome item' },
  ];

  return (
    <div className="view-enter">
      <div className="page-header">
        <div>
          <div className="page-title">My Page</div>
          <div className="page-sub">Your NYTO listing — seen by every user who taps your pin on the map</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-sm" onClick={() => setPreviewOpen(true)}>👁 Preview</button>
          {dirty && <button className="btn btn-sm" onClick={handleDiscard}>Discard</button>}
          <button className="btn btn-in btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : dirty ? 'Save changes ●' : 'Saved ✓'}
          </button>
        </div>
      </div>

      {/* Unsaved changes banner */}
      {dirty && (
        <div style={{ marginBottom: 16, padding: '10px 16px', background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.3)', borderRadius: 'var(--r)', fontSize: 12, color: 'var(--go2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>● You have unsaved changes</span>
          <button className="btn btn-go btn-xs" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save now'}</button>
        </div>
      )}

      {/* Tabs */}
      <div className="chips" style={{ marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t.key} className={`chip${activeTab === t.key ? ' on' : ''}`} onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── BASIC INFO TAB ── */}
      {activeTab === 'info' && (
        <div className="g21">
          <div className="card">
            <SH>Venue details</SH>
            <div className="field">
              <label>Venue name *</label>
              <input type="text" value={form.name} onChange={update('name')} maxLength={80} />
            </div>
            <div className="field">
              <label>Tagline <span style={{ color: 'var(--dim)' }}>(shown under your name on map)</span></label>
              <input type="text" value={form.tagline} onChange={update('tagline')} maxLength={80} placeholder="e.g. Best rooftop cocktails in Jubilee Hills" />
              <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 3 }}>{form.tagline.length}/80</div>
            </div>
            <div className="field">
              <label>About <span style={{ color: form.about.length > 260 ? 'var(--rd2)' : 'var(--dim)' }}>{form.about.length}/280</span></label>
              <textarea value={form.about} onChange={update('about')} maxLength={280} rows={5} placeholder="Describe your venue — what makes it unique, what to expect…" />
            </div>
            <div className="field">
              <label>Location / Address</label>
              <input type="text" value={form.location} onChange={update('location')} placeholder="e.g. Jubilee Hills, Hyderabad" />
            </div>
            <div className="g2" style={{ marginBottom: 0 }}>
              <div className="field">
                <label>Category</label>
                <select value={form.category} onChange={update('category')}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Price tier</label>
                <select value={form.price_tier} onChange={update('price_tier')}>
                  {PRICE_TIERS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <SH>Venue tags <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400, color: 'var(--mu)' }}>({form.tags.length} selected)</span></SH>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {TAGS_LIST.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    style={{
                      padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                      border: `1px solid ${form.tags.includes(tag) ? 'var(--in)' : 'var(--b1)'}`,
                      background: form.tags.includes(tag) ? 'rgba(99,102,241,.18)' : 'transparent',
                      color: form.tags.includes(tag) ? 'var(--in2)' : 'var(--mu)',
                      fontFamily: 'inherit', transition: 'all .15s',
                    }}
                  >
                    {form.tags.includes(tag) ? '✓ ' : ''}{tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live preview card */}
          <div>
            <div className="card" style={{ position: 'sticky', top: 80 }}>
              <SH>Live preview card</SH>
              <div style={{ border: '1px solid var(--b1)', borderRadius: 12, overflow: 'hidden', background: 'var(--bg)' }}>
                <div style={{ height: 80, background: 'linear-gradient(135deg,rgba(99,102,241,.3),rgba(245,158,11,.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                  🌆
                </div>
                <div style={{ padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{form.name || 'Venue name'}</div>
                      <div style={{ fontSize: 11, color: 'var(--mu)' }}>{form.category} · {form.price_tier.split('·')[0].trim()}</div>
                    </div>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--or)', marginTop: 4, boxShadow: '0 0 6px var(--or)', animation: 'pulse 1.5s infinite' }} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--tx2)', lineHeight: 1.5, marginBottom: 8 }}>
                    {form.tagline || 'Your tagline appears here'}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {form.tags.slice(0, 3).map(t => (
                      <span key={t} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'var(--s2)', color: 'var(--mu)' }}>{t}</span>
                    ))}
                    {form.tags.length > 3 && <span style={{ fontSize: 10, color: 'var(--dim)' }}>+{form.tags.length - 3}</span>}
                  </div>
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--b1)', display: 'flex', gap: 6 }}>
                    <div style={{ flex: 1, padding: '7px 0', background: 'linear-gradient(90deg,var(--in),var(--pu))', borderRadius: 7, textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>Check in</div>
                    <div style={{ width: 34, height: 30, border: '1px solid var(--b1)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>📞</div>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: 'var(--dim)', textAlign: 'center' }}>
                This is how your venue card appears to NYTO users
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── HOURS TAB ── */}
      {activeTab === 'hours' && (
        <div className="card" style={{ maxWidth: 560 }}>
          <SH>Opening hours</SH>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {HOURS_DAYS.map(({ key, label }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 90, fontSize: 13, color: 'var(--tx2)', fontWeight: 500, flexShrink: 0 }}>{label}</div>
                <input
                  type="text"
                  value={form.hours[key] || ''}
                  onChange={e => updateHours(key, e.target.value)}
                  placeholder="e.g. 6 PM – 1 AM or Closed"
                  style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--b1)', borderRadius: 8, padding: '9px 12px', color: 'var(--tx)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = 'var(--in)'}
                  onBlur={e  => e.target.style.borderColor = 'var(--b1)'}
                />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, padding: '12px 14px', background: 'var(--s1)', borderRadius: 'var(--r)', border: '1px solid var(--b1)', fontSize: 12, color: 'var(--mu)' }}>
            💡 Type "Closed" for days you're not open. Hours shown on your NYTO page and app listing.
          </div>
          <button className="btn btn-in" style={{ marginTop: 16 }} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save hours'}
          </button>
        </div>
      )}

      {/* ── PHOTOS TAB ── */}
      {activeTab === 'photos' && (
        <div className="card">
          <SH right={<span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400, color: 'var(--mu)' }}>{form.photos.length}/5 photos</span>}>
            Venue photos
          </SH>
          <div style={{ fontSize: 12, color: 'var(--mu)', marginBottom: 14, lineHeight: 1.5 }}>
            Photos appear in your venue card carousel on the NYTO app. First photo is your cover image. Max 5 photos.
          </div>
          <div className="photo-grid">
            {Array.from({ length: 5 }).map((_, i) => {
              const photo = form.photos[i];
              const isUrl = photo && (photo.startsWith('http') || photo.startsWith('blob:'));
              return (
                <div
                  key={i}
                  className={`photo${!photo ? ' photo-add' : ''}`}
                  style={{ background: photo && !isUrl ? 'var(--bg3)' : undefined, position: 'relative', cursor: photo ? 'default' : 'pointer' }}
                  onClick={() => {
                    if (!photo) {
                      if (form.photos.length >= 5) { showError('Max 5 photos allowed'); return; }
                      fileInputRef.current?.click();
                      const emojis = ['🌅', '🎵', '🍹', '👥', '🎉', '🌃', '✨', '🍸'];
                      const newEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                      setForm(f => ({ ...f, photos: [...f.photos, newEmoji] }));
                      setDirty(true);
                      showToast('Photo added — in production this opens a file picker');
                    }
                  }}
                >
                  {photo ? (
                    <>
                      {isUrl
                        ? <img src={photo} alt={`venue photo ${i+1}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                        : <span style={{ fontSize: 28 }}>{photo}</span>
                      }
                      {i === 0 && (
                        <div style={{ position: 'absolute', top: 4, left: 4, fontSize: 9, fontWeight: 700, padding: '2px 6px', background: 'rgba(0,0,0,.7)', color: '#fff', borderRadius: 4 }}>COVER</div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setForm(f => ({ ...f, photos: f.photos.filter((_, pi) => pi !== i) }));
                          setDirty(true);
                          showToast('Photo removed');
                        }}
                        style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,.7)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >✕</button>
                    </>
                  ) : '+'}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 14, fontSize: 11, color: 'var(--dim)' }}>
            Accepted formats: JPG, PNG, WEBP · Max 5 MB each · Minimum 800×600px recommended
          </div>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handlePhotoUpload}
          />
          <button
            className="btn btn-sm"
            style={{ marginTop: 10 }}
            onClick={() => { if (form.photos.length >= 5) { showError('Max 5 photos'); return; } fileInputRef.current?.click(); }}
            disabled={uploading}
          >
            {uploading ? '⏳ Uploading…' : '⬆ Upload photo'}
          </button>
          <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 6 }}>JPG, PNG or WebP · max 5 MB · max 5 photos</div>
        </div>
      )}

      {/* ── WELCOME ITEM TAB ── */}
      {activeTab === 'welcome' && (
        <div style={{ maxWidth: 560 }}>
          <div className="card mb">
            <SH>Welcome item</SH>
            <div style={{ fontSize: 13, color: 'var(--tx2)', marginBottom: 16, lineHeight: 1.6 }}>
              The welcome item is given to customers on their first check-in at your venue. Cost is split 50/50 between you and NYTO.
            </div>
            <div className="field">
              <label>Item name (shown to customers)</label>
              <input type="text" value={form.welcome_item} onChange={update('welcome_item')} placeholder="e.g. Complimentary welcome shot" maxLength={60} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Valid for</label>
              <select value={form.welcome_valid} onChange={update('welcome_valid')}>
                {VALID_OPTIONS.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
          </div>

          <div className="card mb" style={{ background: 'rgba(34,197,94,.04)', border: '1px solid rgba(34,197,94,.2)' }}>
            <SH>How the 50/50 split works</SH>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Customer receives',    val: form.welcome_item || 'Your welcome item', color: 'var(--gn2)' },
                { label: 'Venue cost',           val: '50% of item value in NC',    color: 'var(--mu)' },
                { label: 'NYTO subsidy',         val: '50% of item value in NC',    color: 'var(--in2)' },
                { label: 'Net cost to you',      val: 'Half the item cost, in NC',  color: 'var(--go2)' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--b1)' }}>
                  <span style={{ color: 'var(--mu)' }}>{r.label}</span>
                  <b style={{ color: r.color }}>{r.val}</b>
                </div>
              ))}
            </div>
          </div>

          <button className="btn btn-in" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save welcome item'}
          </button>
        </div>
      )}

      {/* ── PREVIEW MODAL ── */}
      {previewOpen && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setPreviewOpen(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(6px)' }}
        >
          <div style={{ background: 'var(--bg3)', border: '1px solid var(--b2)', borderRadius: 'var(--r3)', width: '92%', maxWidth: 420, boxShadow: '0 24px 60px rgba(0,0,0,.7)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--b1)' }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>App preview — how users see your page</div>
              <button onClick={() => setPreviewOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--mu)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ padding: 18 }}>
              {/* Photo carousel mock */}
              <div style={{ height: 160, background: 'linear-gradient(135deg,rgba(99,102,241,.3),rgba(245,158,11,.2))', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, marginBottom: 16 }}>
                {form.photos[0] && (form.photos[0].startsWith('http') || form.photos[0].startsWith('blob:'))
                ? <img src={form.photos[0]} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, borderRadius: 8 }} />
                : <span style={{ fontSize: 28 }}>{form.photos[0] || '📷'}</span>
              }
              </div>
              {/* Vibe badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--or)', animation: 'pulse 1.5s infinite' }} />
                <span style={{ fontSize: 11, color: 'var(--or)', fontWeight: 600 }}>VIBING</span>
                <span style={{ fontSize: 11, color: 'var(--mu)' }}>· Live NYTO venue</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 2 }}>{form.name}</div>
              <div style={{ fontSize: 12, color: 'var(--mu)', marginBottom: 8 }}>{form.category} · {form.price_tier.split('·')[0].trim()} · {form.location}</div>
              <div style={{ fontSize: 13, color: 'var(--tx2)', lineHeight: 1.6, marginBottom: 12 }}>{form.about || 'Your about text appears here.'}</div>
              {/* Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                {form.tags.map(t => (
                  <span key={t} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: 'var(--s2)', border: '1px solid var(--b1)', color: 'var(--tx2)' }}>{t}</span>
                ))}
              </div>
              {/* Hours */}
              <div style={{ padding: '10px 12px', background: 'var(--s1)', borderRadius: 'var(--r)', marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--mu)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Hours</div>
                {HOURS_DAYS.map(({ key, label }) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                    <span style={{ color: 'var(--mu)' }}>{label}</span>
                    <span style={{ fontWeight: 500 }}>{form.hours[key] || '—'}</span>
                  </div>
                ))}
              </div>
              {/* CTA buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ padding: 11, background: 'linear-gradient(90deg,var(--in),var(--pu))', borderRadius: 10, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>
                  Check in · +100 NC
                </div>
                <div style={{ padding: 11, border: '1px solid var(--b1)', borderRadius: 10, textAlign: 'center', fontSize: 13, color: 'var(--tx2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  📞 Call
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}