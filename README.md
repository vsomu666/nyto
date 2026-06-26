# NYTO Venue Dashboard
### Navigate Your Time Out — Venue Portal

> React application converted from HTML mockups. Supports Free, Growth, and Prime tiers.

---

## Quick Start

```bash
cd nyto-dashboard
npm install
npm start
```

App runs at **http://localhost:3000**

---

## Project Structure

```
nyto-dashboard/
├── public/
│   └── index.html              # HTML shell
│
├── src/
│   ├── index.js                # React entry point
│   ├── App.jsx                 # Root component + routing + tier switcher
│   │
│   ├── context/
│   │   └── AppContext.jsx      # Global state: tier, toast, modal, vibe, venue
│   │
│   ├── data/
│   │   └── mockData.js         # All mock data — replace with Supabase queries
│   │
│   ├── utils/
│   │   └── chartUtils.js       # Chart.js config helpers
│   │
│   ├── styles/
│   │   └── globals.css         # Design tokens + all CSS classes
│   │
│   ├── components/
│   │   ├── Sidebar.jsx         # Navigation sidebar (all tiers)
│   │   ├── Topbar.jsx          # Top bar with clock, vibe, notifications
│   │   └── UI.jsx              # Shared: Toast, Modal, StatCard, LockOverlay, etc.
│   │
│   └── pages/
│       ├── OverviewPage.jsx    # Overview (all tiers)
│       ├── AnalyticsPage.jsx   # Analytics + heatmap (Growth/Prime)
│       ├── WalletPage.jsx      # NC Wallet (all tiers)
│       ├── OffersPage.jsx      # Offers & Campaigns
│       ├── ContentPages.jsx    # Reviews, Customers, Lost Regulars,
│       │                       # Dead Hour, Messaging, Page Editor
│       └── PrimePages.jsx      # Competitor Intel, Push Campaigns,
│                               # Events, Group Insights
│
└── package.json
```

---

## Tier System

| Feature | Free | Growth | Prime |
|---|---|---|---|
| Overview | ✓ | ✓ | ✓ |
| NC Wallet | ✓ | ✓ | ✓ |
| My Page | ✓ | ✓ | ✓ |
| Offers (2 max) | ✓ | ✓ (5) | ✓ (unlimited) |
| Reviews (read only) | ✓ | ✓ + reply | ✓ + reply |
| Analytics + Heatmap | 🔒 | ✓ | ✓ + AI forecast |
| Lost Regulars | 🔒 | ✓ | ✓ |
| Customer Database | 🔒 | ✓ | ✓ |
| Dead Hour Filler | 🔒 | ✓ | ✓ |
| Messaging | 🔒 | ✓ | ✓ |
| Scheduled Campaigns | 🔒 | ✓ | ✓ |
| Push Campaigns | 🔒 | 🔒 | ✓ |
| Competitor Intel | 🔒 | 🔒 | ✓ |
| Group Insights | 🔒 | 🔒 | ✓ |
| Events & Ticketing | 🔒 | 🔒 | ✓ |

---

## NC Economy v2 — Key Wiring Notes

### Transaction Type Display Labels
Map `nc_transactions.type` values to human-readable labels:

| DB type | Display label |
|---|---|
| `check_in` | Check-in |
| `first_visit` | First Visit Bonus |
| `group_checkin` | Group Check-in Bonus |
| `dwell` | Dwell Bonus (60+ min) |
| `flic_post` | FLIC Post Bonus |
| `pioneer_vibe` | **Vibe Pioneer Bonus** (not "Review bonus") |
| `pulse_bonus` | Pulse Bonus (2×) |
| `lucky_roll` | Lucky 7th Roll |
| `referral` | Referral Bonus |
| `redemption` | Redemption |
| `signup` | Signup Bonus (NYTO-funded, exclude from venue burn) |

### Wallet Burn Breakdown Groupings
```
Check-in rewards    = check_in + group_checkin + dwell + pulse_bonus + lucky_roll
First Visit bonuses = first_visit
Vibe Pioneer bonuses = pioneer_vibe
Content bonuses     = flic_post + referral
NYTO cut (5%)       = 5% of total redemption value
```

### Pulse Active Banner
- Source: `venues.pulse_active` (boolean)
- Show `<PulseBanner />` on Overview when `pulse_active === true`
- Real-time subscribe to `venues` table for live updates
- Auto-dismiss when `pulse_active` returns to `false`

### Tables NOT to touch
- `vibe_reports` — read-only for dashboard
- `passport_stamps` — Phase 2, do not build against

### Locked NC Rules (DB-enforced)
- Max NC per check-in: 500
- Max multiplier: 2× (venue-initiated; Lucky 7th is system-side only)
- Max bill discount: 20%
- Max ticket discount: 30%
- NC expiry: 6 months

---

## Supabase Wiring Checklist

Replace mock data in `src/data/mockData.js` with live queries:

- [ ] `nc_transactions` — wallet history, burn breakdown
- [ ] `venues` — pulse_active, NC balance
- [ ] `check_ins` — overview stats, hourly chart
- [ ] `customers` — customer DB, lost regulars
- [ ] `reviews` — reviews list
- [ ] `vibe_reports` (read-only) — pioneer bonus display
- [ ] Real-time subscriptions for: `venues.pulse_active`, live check-in counter

---

## Design System

All CSS variables are in `src/styles/globals.css` under `:root`. Key tokens:

```css
--bg: #0d1120       /* Main background */
--bg2: #131828      /* Sidebar / topbar */
--in: #6366f1       /* Indigo accent — Growth tier */
--go: #f59e0b       /* Gold — Prime tier */
--gn2: #4ade80      /* Green — positive deltas */
--rd2: #f87171      /* Red — alerts / lost regulars */
```

---

*NYTO · Navigate Your Time Out · Confidential · May 2026*
