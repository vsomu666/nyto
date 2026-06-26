// ══════════════════════════════════════════
//  NYTO · Mock Data Layer
//  Replace with live Supabase queries in prod
// ══════════════════════════════════════════

// ── NC Transaction type labels (v2 economy) ──
export const NC_TYPE_LABELS = {
  check_in: 'Check-in',
  first_visit: 'First Visit Bonus',
  group_checkin: 'Group Check-in Bonus',
  dwell: 'Dwell Bonus (60+ min)',
  flic_post: 'FLIC Post Bonus',
  pioneer_vibe: 'Vibe Pioneer Bonus',
  pulse_bonus: 'Pulse Bonus (2×)',
  lucky_roll: 'Lucky 7th Roll',
  referral: 'Referral Bonus',
  redemption: 'Redemption',
  signup: 'Signup Bonus',
};

// ── Overview stats ──
export const OVERVIEW_STATS = {
  free: [
    { label: 'Live check-ins', value: '127', delta: '↑ 12 this hour', deltaClass: 'up', id: 'live-ci' },
    { label: 'Today\'s check-ins', value: '312', delta: '↑ 28 vs yesterday', deltaClass: 'up' },
    { label: 'Active offers', value: '2', bench: 'of 2 limit (Free)' },
    { label: 'NC balance', value: '18,400', bench: 'worth ₹9,200' },
  ],
  growth: [
    { label: 'Live check-ins', value: '127', delta: '↑ 12 this hour', deltaClass: 'up', id: 'live-ci' },
    { label: 'Today\'s check-ins', value: '312', delta: '↑ 28 vs yesterday', deltaClass: 'up' },
    { label: 'Lost regulars', value: '18', delta: '↑ 4 this week', deltaClass: 'dn', color: 'var(--rd2)' },
    { label: 'NC balance', value: '24,800', bench: 'worth ₹12,400' },
  ],
  prime: [
    { label: 'Live check-ins', value: '127', delta: '↑ 12 this hour', deltaClass: 'up', id: 'live-ci' },
    { label: 'Today\'s check-ins', value: '312', delta: '↑ 28 vs yesterday', deltaClass: 'up' },
    { label: 'Area rank', value: '#2', delta: '↑ 1 this week', deltaClass: 'up' },
    { label: 'NC balance', value: '48,200', bench: 'worth ₹24,100' },
  ],
};

// ── Recent check-ins ──
export const RECENT_CHECKINS = [
  { initials: 'PS', color: 'linear-gradient(135deg,#6366f1,#a78bfa)', name: 'Priya S.', badge: 'Regular', nc: '+150 NC', time: '2 min ago', type: 'Group • 3 people' },
  { initials: 'KR', color: 'linear-gradient(135deg,#22d3ee,#6366f1)', name: 'Karthik R.', badge: null, nc: '+100 NC', time: '5 min ago', type: 'Solo' },
  { initials: 'AM', color: 'linear-gradient(135deg,#ec4899,#f59e0b)', name: 'Ananya M.', badge: 'VIP', nc: '+200 NC', time: '9 min ago', type: 'Pulse 2× applied' },
  { initials: 'SK', color: 'linear-gradient(135deg,#f97316,#ef4444)', name: 'Sneha K.', badge: 'VIP', nc: '+100 NC', time: '14 min ago', type: 'First visit bonus' },
  { initials: 'NJ', color: 'linear-gradient(135deg,#8b5cf6,#6366f1)', name: 'Nikhil J.', badge: null, nc: '+100 NC', time: '18 min ago', type: 'Solo' },
];

// ── Active offers ──
export const ACTIVE_OFFERS = [
  { emoji: '🎉', bg: 'rgba(99,102,241,.12)', name: 'Welcome Shot', desc: 'Complimentary shot on first visit', tag: 'FIRST VISIT', tagClass: 'tag-new', status: 'Active' },
  { emoji: '⚡', bg: 'rgba(249,115,22,.12)', name: 'Power Hour', desc: '2× NC for first 20 check-ins · Tap to trigger', tag: 'ON DEMAND', tagClass: 'tag-live', status: 'Ready' },
];

// ── Scheduled campaigns (Growth+) ──
export const SCHEDULED_CAMPAIGNS = [
  { emoji: '⚡', bg: 'rgba(249,115,22,.12)', name: 'Power Hour', time: 'Every evening 7–8 PM', desc: '2× NC for first 20 check-ins', tag: 'SCHEDULED', tagClass: 'tag-new', active: true },
  { emoji: '🎉', bg: 'rgba(34,197,94,.12)', name: 'First Visit Bonus', time: 'Always on', desc: '+100 NC on first check-in at your venue', tag: 'ALWAYS ON', tagClass: 'tag-ok', active: true },
  { emoji: '🔄', bg: 'rgba(99,102,241,.12)', name: 'Win-back Drop', time: 'Auto · 21-day inactivity', desc: '100 NC to lapsed regulars via Lost Regulars', tag: 'AUTO', tagClass: 'tag-growth', active: false },
];

// ── Reviews ──
export const REVIEWS = [
  {
    initials: 'PS', color: 'linear-gradient(135deg,#6366f1,#a78bfa)',
    name: 'Priya S.', stars: 5, time: '2 hours ago',
    text: 'Absolutely love the rooftop vibe! Craft cocktails are top notch and the sunset view is unbeatable. Will definitely be back.',
    replied: false,
  },
  {
    initials: 'KR', color: 'linear-gradient(135deg,#22d3ee,#6366f1)',
    name: 'Karthik R.', stars: 4, time: 'Yesterday',
    text: 'Great place for a night out. Service was a bit slow on Friday but the DJ set made up for it.',
    replied: false,
  },
  {
    initials: 'AM', color: 'linear-gradient(135deg,#ec4899,#f59e0b)',
    name: 'Ananya M.', stars: 5, time: '3 days ago',
    text: 'Best rooftop in Hyderabad, hands down. The NYTO check-in bonus was a nice surprise!',
    replied: true,
    reply: 'Thank you so much Ananya! We love having you here. See you soon 🙌',
  },
];

// ── Customer database ──
export const CUSTOMERS = [
  { initials: 'PS', color: 'linear-gradient(135deg,#6366f1,#a78bfa)', name: 'Priya S.', tag: 'VIP', visits: 11, lastVisit: 'Today', spend: '₹1,450', status: 'Active' },
  { initials: 'KR', color: 'linear-gradient(135deg,#22d3ee,#6366f1)', name: 'Karthik R.', tag: null, visits: 8, lastVisit: 'Yesterday', spend: '₹980', status: 'Active' },
  { initials: 'AM', color: 'linear-gradient(135deg,#ec4899,#f59e0b)', name: 'Ananya M.', tag: 'VIP', visits: 14, lastVisit: '2 days ago', spend: '₹1,820', status: 'Active' },
  { initials: 'SK', color: 'linear-gradient(135deg,#f97316,#ef4444)', name: 'Sneha K.', tag: 'VIP', visits: 17, lastVisit: '3 days ago', spend: '₹2,100', status: 'Active' },
  { initials: 'NJ', color: 'linear-gradient(135deg,#8b5cf6,#6366f1)', name: 'Nikhil J.', tag: null, visits: 7, lastVisit: 'Last week', spend: '₹890', status: 'Lapsed' },
  { initials: 'TM', color: 'linear-gradient(135deg,#ec4899,#8b5cf6)', name: 'Tanya M.', tag: null, visits: 5, lastVisit: 'Last week', spend: '₹1,050', status: 'Active' },
  { initials: 'RD', color: 'linear-gradient(135deg,#22c55e,#10b981)', name: 'Rohan D.', tag: null, visits: 6, lastVisit: '10 days ago', spend: '₹1,100', status: 'Active' },
];

// ── Lost regulars ──
export const LOST_REGULARS = [
  { initials: 'PS', color: 'linear-gradient(135deg,#6366f1,#a78bfa)', name: 'Priya S.', tag: 'VIP', visits: 11, spend: '₹1,450', daysAgo: 28, risk: 'HIGH' },
  { initials: 'KR', color: 'linear-gradient(135deg,#22d3ee,#6366f1)', name: 'Karthik R.', tag: null, visits: 8, spend: '₹980', daysAgo: 34, risk: 'HIGH' },
  { initials: 'AM', color: 'linear-gradient(135deg,#ec4899,#f59e0b)', name: 'Ananya M.', tag: 'VIP', visits: 14, spend: '₹1,820', daysAgo: 22, risk: 'MED' },
  { initials: 'SK', color: 'linear-gradient(135deg,#f97316,#ef4444)', name: 'Sneha K.', tag: 'VIP', visits: 17, spend: '₹2,100', daysAgo: 31, risk: 'HIGH' },
  { initials: 'NJ', color: 'linear-gradient(135deg,#8b5cf6,#6366f1)', name: 'Nikhil J.', tag: null, visits: 7, spend: '₹890', daysAgo: 42, risk: 'HIGH' },
  { initials: 'TM', color: 'linear-gradient(135deg,#ec4899,#8b5cf6)', name: 'Tanya M.', tag: null, visits: 5, spend: '₹1,050', daysAgo: 24, risk: 'MED' },
  { initials: 'RD', color: 'linear-gradient(135deg,#22c55e,#10b981)', name: 'Rohan D.', tag: null, visits: 6, spend: '₹1,100', daysAgo: 25, risk: 'MED' },
];

// ── NC wallet burn ──
export const WALLET_BURN = {
  checkInRewards: 6400,
  firstVisitBonuses: 2100,
  vibePioneerBonuses: 450,
  contentBonuses: 180,
  nytoCut: 480,
  total: 9430,
};

export const NC_PACKAGES = [
  { label: 'Starter', nc: '5,000 NC', price: '₹1,499', perNc: '₹0.30/NC', est: '~100 check-ins', best: false },
  { label: 'Growth Pack', nc: '15,000 NC', price: '₹3,499', perNc: '₹0.23/NC', est: '~300 check-ins', best: true },
  { label: 'Pro Pack', nc: '50,000 NC', price: '₹9,999', perNc: '₹0.20/NC', est: '~1000 check-ins', best: false },
];

// ── Hourly chart data ──
export const HOURLY_DATA = [4, 6, 5, 3, 4, 8, 18, 34, 38, 42, 29, 14];
export const HOURLY_LABELS = ['12p', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11p'];

export const WEEKLY_DATA = [68, 84, 92, 108, 186, 134, 88];
export const WEEKLY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ── Heatmap data ──
export const HEATMAP_DATA = [
  { d: 'Mon', v: [2, 1, 1, 2, 3, 5, 8, 12, 18, 22, 28, 26, 18, 10] },
  { d: 'Tue', v: [3, 4, 6, 6, 7, 9, 14, 24, 36, 42, 30, 20, 10, 5] },
  { d: 'Wed', v: [3, 3, 5, 5, 6, 10, 16, 28, 40, 46, 32, 22, 12, 6] },
  { d: 'Thu', v: [4, 4, 6, 8, 10, 14, 22, 34, 48, 52, 38, 28, 14, 8] },
  { d: 'Fri', v: [5, 5, 8, 10, 14, 22, 38, 56, 72, 86, 78, 62, 42, 22] },
  { d: 'Sat', v: [8, 6, 10, 14, 18, 24, 36, 58, 74, 82, 84, 74, 56, 36] },
  { d: 'Sun', v: [6, 5, 8, 10, 12, 14, 20, 28, 36, 42, 34, 22, 12, 6] },
];
export const HEATMAP_HOURS = ['12p', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12a', '1a'];

// ── Competitor data ──
export const COMPETITORS = [
  { rank: '🥇', name: 'Skyhi', checkins: 684, repeat: '71%', peak: 'Fri', avgGroup: 3.2, isYou: false },
  { rank: '🥈', name: 'Halo Bar (you)', checkins: 642, repeat: '66%', peak: 'Fri', avgGroup: 2.8, isYou: true },
  { rank: '🥉', name: 'Moonlite', checkins: 598, repeat: '58%', peak: 'Sat', avgGroup: 2.4, isYou: false },
  { rank: '', name: 'Terrace 9', checkins: 412, repeat: '52%', peak: 'Fri', avgGroup: 2.1, isYou: false },
  { rank: '', name: 'The Loft', checkins: 388, repeat: '61%', peak: 'Sat', avgGroup: 2.6, isYou: false },
  { rank: '', name: 'Café Noir', checkins: 244, repeat: '44%', peak: 'Wed', avgGroup: 1.9, isYou: false },
];

// ── Upgrade feature lists ──
export const GROWTH_FEATURES = [
  'Full analytics dashboard + hourly heatmap',
  'Lost Regulars alerts with 1-tap 100 NC win-back',
  'Dead Hour Filler — auto 2× NC promos',
  'First-timer conversion rate + industry benchmarks',
  'Reply publicly to every review',
  'Direct messaging with customers',
  'Full Customer Database (complete visit history)',
  '5 active offers (vs 2 on Free)',
  'Scheduled campaigns + auto-promos',
];

export const PRIME_FEATURES = [
  'Everything in Growth, plus:',
  'Push notifications to users within 500m',
  'Featured map placement (larger gold pin)',
  'Priority in NYTO AI recommendations',
  'Events creation & ticketing (0% commission)',
  'Competitor Intel — benchmark vs nearby venues',
  'Group Insights — connectors, social graph',
  'Curate which user posts appear on your page',
  'API access for POS/CRM integrations',
  'Dedicated account manager',
];

// ── Chat messages ──
export const INITIAL_MESSAGES = [
  { id: 1, type: 'in', name: 'Priya S.', text: 'Hi! Is the rooftop open tonight?', time: '2:14 PM' },
  { id: 2, type: 'out', text: 'Yes! We\'re open from 6 PM tonight. DJ set starts at 9. See you soon 🙌', time: '2:16 PM' },
  { id: 3, type: 'in', name: 'Karthik R.', text: 'Do you have a table for 4 this Saturday?', time: '3:02 PM' },
];

// ── Quick reply templates ──
export const QUICK_REPLIES = [
  'Yes, we\'re open tonight!',
  'Tables available — walk in or DM to reserve',
  'DJ set starts 9 PM 🎶',
  'Happy hour 6–8 PM, 2× NC tonight',
];

// ── Events (Prime) ──
export const EVENTS = [
  { title: 'Saturday Night Live', date: 'Sat 15 Jun', time: '8 PM – 2 AM', tickets: 48, sold: 32, price: '₹799', revenue: '₹25,568', status: 'On sale' },
  { title: 'Sunset Sessions Vol. 3', date: 'Sun 16 Jun', time: '5 PM – 9 PM', tickets: 60, sold: 60, price: '₹499', revenue: '₹29,940', status: 'Sold out' },
];

// ── Push templates (Prime) ──
export const PUSH_TEMPLATES = [
  { emoji: '🍸', title: 'Happy Hour Reminder', body: '"We\'re pouring! Rooftop has space, come on up." — Send to within 500m', action: 'Customize & send', toastMsg: 'Happy Hour push sent to 312 users ✓' },
  { emoji: '🎶', title: 'Live Music Tonight', body: '"Band starts 9 PM. First 10 arrivals get a free shot." — Boost foot traffic', action: 'Customize & send', toastMsg: 'Live Music push sent ✓' },
  { emoji: '👥', title: 'Table Just Opened', body: '"A 4-top just freed up on the rooftop. First come, first served."', action: 'Customize & send', toastMsg: 'Table push sent to 189 users ✓' },
];

// ── Notifications ──
export const NOTIFICATIONS = {
  growth: [
    { title: '🔴 Lost Regular Alert', desc: 'Priya S. hasn\'t visited in 28 days. Send win-back NC?', time: '10 min ago' },
    { title: '⚡ Dead Hour Detected', desc: 'Tonight 9–11 PM is tracking 60% below your usual. Auto-promo ready.', time: '1 hour ago' },
    { title: '⭐ New Review', desc: 'Karthik R. left a 4-star review. Reply to boost your ranking.', time: '2 hours ago' },
  ],
  prime: [
    { title: '🏆 Pulse Venue Active', desc: 'Your venue is tonight\'s Pulse Venue! 2× NC for all check-ins.', time: 'Just now' },
    { title: '🔴 Lost Regular Alert', desc: 'Priya S. hasn\'t visited in 28 days. Send win-back NC?', time: '10 min ago' },
    { title: '📍 Competitor Spike', desc: 'Skyhi showing 40% above their average tonight. Monday risk window.', time: '1 hour ago' },
    { title: '⭐ New Review', desc: 'Ananya M. left a 5-star review mentioning your cocktails.', time: '3 hours ago' },
  ],
};
