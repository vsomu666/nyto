// ══════════════════════════════════════════════════════════════
//  NYTO · Supabase Query Functions
//  Every data fetch the dashboard needs, wired to real tables.
//  All functions return { data, error } — handle both in hooks.
// ══════════════════════════════════════════════════════════════

import { supabase, VENUE_ID } from './supabaseClient';

// ─────────────────────────────────────────
//  VENUE
// ─────────────────────────────────────────

/**
 * Fetch the venue row — name, location, nc_balance, tier, pulse_active
 */
export async function fetchVenue() {
  const { data, error } = await supabase
    .from('venues')
    .select('id, name, location, nc_balance, nc_cap, tier, pulse_active, vibe_status')
    .eq('id', VENUE_ID)
    .single();
  return { data, error };
}

/**
 * Update vibe status on the venues table
 */
export async function updateVibeStatus(status) {
  const { data, error } = await supabase
    .from('venues')
    .update({ vibe_status: status, updated_at: new Date().toISOString() })
    .eq('id', VENUE_ID)
    .select()
    .single();
  return { data, error };
}

/**
 * Update venue page fields (name, tagline, about, etc.)
 */
export async function updateVenuePage(fields) {
  const { data, error } = await supabase
    .from('venues')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', VENUE_ID)
    .select()
    .single();
  return { data, error };
}

// ─────────────────────────────────────────
//  CHECK-INS
// ─────────────────────────────────────────

/**
 * Live check-in count for today
 */
export async function fetchTodayCheckIns() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('check_ins')
    .select('id', { count: 'exact', head: true })
    .eq('venue_id', VENUE_ID)
    .gte('created_at', today.toISOString());

  return { data: count ?? 0, error };
}

/**
 * Yesterday's check-in count (for delta)
 */
export async function fetchYesterdayCheckIns() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('check_ins')
    .select('id', { count: 'exact', head: true })
    .eq('venue_id', VENUE_ID)
    .gte('created_at', yesterday.toISOString())
    .lt('created_at', todayStart.toISOString());

  return { data: count ?? 0, error };
}

/**
 * Check-ins grouped by hour for today (for hourly bar chart)
 * Returns array of 12 values (12pm–11pm)
 */
export async function fetchHourlyCheckIns() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('check_ins')
    .select('created_at')
    .eq('venue_id', VENUE_ID)
    .gte('created_at', today.toISOString());

  if (error) return { data: null, error };

  // Bucket into 12 hourly slots (12pm to 11pm)
  const buckets = Array(12).fill(0);
  (data || []).forEach(row => {
    const hour = new Date(row.created_at).getHours();
    if (hour >= 12 && hour <= 23) {
      buckets[hour - 12]++;
    }
  });

  return { data: buckets, error: null };
}

/**
 * Check-ins grouped by day of week for the past 7 days
 */
export async function fetchWeeklyCheckIns() {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  weekAgo.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('check_ins')
    .select('created_at')
    .eq('venue_id', VENUE_ID)
    .gte('created_at', weekAgo.toISOString());

  if (error) return { data: null, error };

  // Mon=0 … Sun=6
  const buckets = Array(7).fill(0);
  (data || []).forEach(row => {
    const day = (new Date(row.created_at).getDay() + 6) % 7; // convert Sun=0 to Mon=0
    buckets[day]++;
  });

  return { data: buckets, error: null };
}

/**
 * Check-ins for heatmap — last 7 days × 14 hours (12pm–1am)
 */
export async function fetchHeatmapData() {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  weekAgo.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('check_ins')
    .select('created_at')
    .eq('venue_id', VENUE_ID)
    .gte('created_at', weekAgo.toISOString());

  if (error) return { data: null, error };

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const result = days.map(d => ({ d, v: Array(14).fill(0) }));

  (data || []).forEach(row => {
    const date = new Date(row.created_at);
    const dayIdx = (date.getDay() + 6) % 7;
    const hour = date.getHours();
    // slots: 12–23 map to 0–11, then 0–1 (midnight/1am) map to 12–13
    let slot = -1;
    if (hour >= 12) slot = hour - 12;
    else if (hour === 0) slot = 12;
    else if (hour === 1) slot = 13;
    if (slot >= 0 && slot < 14) result[dayIdx].v[slot]++;
  });

  return { data: result, error: null };
}

/**
 * 30-day trend — daily check-in counts
 */
export async function fetchTrendData() {
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 29);
  monthAgo.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('check_ins')
    .select('created_at')
    .eq('venue_id', VENUE_ID)
    .gte('created_at', monthAgo.toISOString());

  if (error) return { data: null, error };

  const buckets = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - 29 + i);
    buckets[d.toISOString().slice(0, 10)] = 0;
  }

  (data || []).forEach(row => {
    const key = row.created_at.slice(0, 10);
    if (key in buckets) buckets[key]++;
  });

  return { data: Object.values(buckets), error: null };
}

/**
 * Recent check-ins with user info (last 20)
 */
export async function fetchRecentCheckIns() {
  const { data, error } = await supabase
    .from('check_ins')
    .select(`
      id, created_at, nc_awarded, transaction_type,
      group_size,
      users ( id, display_name, visit_count, is_vip )
    `)
    .eq('venue_id', VENUE_ID)
    .order('created_at', { ascending: false })
    .limit(20);

  return { data, error };
}

// ─────────────────────────────────────────
//  NC TRANSACTIONS
// ─────────────────────────────────────────

/**
 * NC wallet burn breakdown for current calendar month
 * Groups by transaction type per the v2 economy spec
 */
export async function fetchWalletBurn() {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('nc_transactions')
    .select('type, amount')
    .eq('venue_id', VENUE_ID)
    .gte('created_at', monthStart.toISOString())
    // Exclude signup bonuses — NYTO-funded, not venue wallet
    .neq('type', 'signup');

  if (error) return { data: null, error };

  const burn = {
    checkInRewards: 0,     // check_in + group_checkin + dwell + pulse_bonus + lucky_roll
    firstVisitBonuses: 0,  // first_visit
    vibePioneerBonuses: 0, // pioneer_vibe
    contentBonuses: 0,     // flic_post + referral
    nytoCut: 0,            // 5% of redemption value
    total: 0,
  };

  (data || []).forEach(row => {
    const amt = Math.abs(row.amount);
    switch (row.type) {
      case 'check_in':
      case 'group_checkin':
      case 'dwell':
      case 'pulse_bonus':
      case 'lucky_roll':
        burn.checkInRewards += amt;
        break;
      case 'first_visit':
        burn.firstVisitBonuses += amt;
        break;
      case 'pioneer_vibe':
        burn.vibePioneerBonuses += amt;
        break;
      case 'flic_post':
      case 'referral':
        burn.contentBonuses += amt;
        break;
      case 'redemption':
        burn.nytoCut += Math.round(amt * 0.05);
        break;
      default:
        break;
    }
  });

  burn.total =
    burn.checkInRewards +
    burn.firstVisitBonuses +
    burn.vibePioneerBonuses +
    burn.contentBonuses +
    burn.nytoCut;

  return { data: burn, error: null };
}

/**
 * NC transaction log (paginated, 50 per page)
 */
export async function fetchTransactionLog(page = 0) {
  const PAGE_SIZE = 50;
  const { data, error } = await supabase
    .from('nc_transactions')
    .select('id, type, amount, created_at, users(display_name)')
    .eq('venue_id', VENUE_ID)
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  return { data, error };
}

// ─────────────────────────────────────────
//  CUSTOMERS
// ─────────────────────────────────────────

/**
 * Full customer list for this venue
 */
export async function fetchCustomers(filter = 'all') {
  let query = supabase
    .from('venue_customers')
    .select(`
      user_id, visit_count, last_visit_at, total_spend,
      is_vip, status,
      users ( id, display_name )
    `)
    .eq('venue_id', VENUE_ID)
    .order('visit_count', { ascending: false });

  if (filter === 'vip') query = query.eq('is_vip', true);
  if (filter === 'active') query = query.eq('status', 'active');
  if (filter === 'lapsed') query = query.eq('status', 'lapsed');

  const { data, error } = await query;
  return { data, error };
}

/**
 * Lost regulars — customers with status='lapsed' and last visit 21+ days ago
 */
export async function fetchLostRegulars() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 21);

  const { data, error } = await supabase
    .from('venue_customers')
    .select(`
      user_id, visit_count, last_visit_at, total_spend, is_vip,
      users ( id, display_name )
    `)
    .eq('venue_id', VENUE_ID)
    .lte('last_visit_at', cutoff.toISOString())
    .gte('visit_count', 3)
    .order('visit_count', { ascending: false });

  return { data, error };
}

/**
 * Send win-back NC to a single customer
 * Inserts a pending nc_transaction row; server Edge Function picks it up
 */
export async function sendWinBackNC(userId, amount = 100) {
  const { data, error } = await supabase
    .from('nc_transactions')
    .insert({
      venue_id: VENUE_ID,
      user_id: userId,
      type: 'referral',          // closest type for manual venue gift
      amount,
      note: 'Win-back campaign',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
  return { data, error };
}

// ─────────────────────────────────────────
//  REVIEWS
// ─────────────────────────────────────────

/**
 * Fetch all reviews for venue, newest first
 */
export async function fetchReviews() {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      id, rating, body, created_at, reply_body, replied_at,
      users ( id, display_name )
    `)
    .eq('venue_id', VENUE_ID)
    .order('created_at', { ascending: false });

  return { data, error };
}

/**
 * Post a public reply to a review
 */
export async function replyToReview(reviewId, replyText) {
  const { data, error } = await supabase
    .from('reviews')
    .update({
      reply_body: replyText,
      replied_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .eq('venue_id', VENUE_ID)
    .select()
    .single();
  return { data, error };
}

// ─────────────────────────────────────────
//  MESSAGES
// ─────────────────────────────────────────

/**
 * Fetch all conversations for venue (list of unique users with last message)
 */
export async function fetchConversations() {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      id, body, created_at, direction, read_at,
      users ( id, display_name )
    `)
    .eq('venue_id', VENUE_ID)
    .order('created_at', { ascending: false });

  if (error) return { data: null, error };

  // Deduplicate to one row per user (most recent message)
  const seen = new Set();
  const convos = [];
  (data || []).forEach(m => {
    if (!seen.has(m.users?.id)) {
      seen.add(m.users?.id);
      convos.push(m);
    }
  });

  return { data: convos, error: null };
}

/**
 * Fetch message thread with a specific user
 */
export async function fetchMessageThread(userId) {
  const { data, error } = await supabase
    .from('messages')
    .select('id, body, created_at, direction')
    .eq('venue_id', VENUE_ID)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  return { data, error };
}

/**
 * Send a message to a user from the venue
 */
export async function sendMessage(userId, body) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      venue_id: VENUE_ID,
      user_id: userId,
      body,
      direction: 'outbound',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
  return { data, error };
}

/**
 * Mark all messages from a user as read
 */
export async function markMessagesRead(userId) {
  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('venue_id', VENUE_ID)
    .eq('user_id', userId)
    .eq('direction', 'inbound')
    .is('read_at', null);
  return { error };
}

// ─────────────────────────────────────────
//  OFFERS
// ─────────────────────────────────────────

/**
 * Fetch active offers for venue
 */
export async function fetchOffers() {
  const { data, error } = await supabase
    .from('offers')
    .select('id, name, description, type, status, trigger_type, nc_multiplier, max_redemptions, created_at')
    .eq('venue_id', VENUE_ID)
    .order('created_at', { ascending: false });
  return { data, error };
}

/**
 * Toggle offer active/paused
 */
export async function toggleOffer(offerId, active) {
  const { data, error } = await supabase
    .from('offers')
    .update({ status: active ? 'active' : 'paused' })
    .eq('id', offerId)
    .eq('venue_id', VENUE_ID)
    .select()
    .single();
  return { data, error };
}

/**
 * Create a new offer
 */
export async function createOffer(offer) {
  const { data, error } = await supabase
    .from('offers')
    .insert({ ...offer, venue_id: VENUE_ID, created_at: new Date().toISOString() })
    .select()
    .single();
  return { data, error };
}

/**
 * Trigger a Power Hour manually
 */
export async function triggerPowerHour({ durationHours = 1, maxCheckins = 20 } = {}) {
  const endsAt = new Date();
  endsAt.setHours(endsAt.getHours() + durationHours);

  const { data, error } = await supabase
    .from('offers')
    .insert({
      venue_id: VENUE_ID,
      name: 'Power Hour',
      type: 'power_hour',
      status: 'active',
      nc_multiplier: 2,
      max_redemptions: maxCheckins,
      ends_at: endsAt.toISOString(),
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
  return { data, error };
}

// ─────────────────────────────────────────
//  EVENTS (Prime)
// ─────────────────────────────────────────

/**
 * Fetch all events for venue
 */
export async function fetchEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('id, title, starts_at, ends_at, ticket_price, ticket_count, tickets_sold, status')
    .eq('venue_id', VENUE_ID)
    .order('starts_at', { ascending: true });
  return { data, error };
}

/**
 * Create a new event
 */
export async function createEvent(event) {
  const { data, error } = await supabase
    .from('events')
    .insert({ ...event, venue_id: VENUE_ID, created_at: new Date().toISOString() })
    .select()
    .single();
  return { data, error };
}

// ─────────────────────────────────────────
//  PUSH CAMPAIGNS (Prime)
// ─────────────────────────────────────────

/**
 * Fetch push campaign history
 */
export async function fetchPushCampaigns() {
  const { data, error } = await supabase
    .from('push_campaigns')
    .select('id, headline, body, radius_m, sent_count, open_count, visit_count, revenue_attributed, created_at')
    .eq('venue_id', VENUE_ID)
    .order('created_at', { ascending: false })
    .limit(20);
  return { data, error };
}

/**
 * Send a push campaign — inserts a row, server-side Edge Function dispatches it
 */
export async function sendPushCampaign({ headline, body, radiusM, offerId = null }) {
  const { data, error } = await supabase
    .from('push_campaigns')
    .insert({
      venue_id: VENUE_ID,
      headline,
      body,
      radius_m: radiusM,
      offer_id: offerId,
      status: 'pending',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
  return { data, error };
}

// ─────────────────────────────────────────
//  COMPETITORS (Prime)
// ─────────────────────────────────────────

/**
 * Fetch anonymized competitor data — populated by NYTO system
 */
export async function fetchCompetitorData() {
  const { data, error } = await supabase
    .from('competitor_snapshots')
    .select('venue_name, checkins_per_week, repeat_pct, peak_day, avg_group_size, area_rank, is_you')
    .eq('reference_venue_id', VENUE_ID)
    .order('checkins_per_week', { ascending: false });
  return { data, error };
}

// ─────────────────────────────────────────
//  GROUP INSIGHTS (Prime)
// ─────────────────────────────────────────

/**
 * Fetch top connectors for venue
 */
export async function fetchConnectors() {
  const { data, error } = await supabase
    .from('connectors')
    .select(`
      user_id, groups_brought, new_customers_introduced, estimated_revenue,
      users ( id, display_name )
    `)
    .eq('venue_id', VENUE_ID)
    .order('new_customers_introduced', { ascending: false })
    .limit(20);
  return { data, error };
}

/**
 * Fetch repeat group compositions
 */
export async function fetchRepeatGroups() {
  const { data, error } = await supabase
    .from('repeat_groups')
    .select('id, member_ids, visit_count, group_label, users:member_ids')
    .eq('venue_id', VENUE_ID)
    .gte('visit_count', 3)
    .order('visit_count', { ascending: false })
    .limit(10);
  return { data, error };
}

// ─────────────────────────────────────────
//  REAL-TIME SUBSCRIPTIONS
// ─────────────────────────────────────────

/**
 * Subscribe to live check-in counter
 * onInsert(payload) called on each new check_in row
 */
export function subscribeToCheckIns(onInsert) {
  return supabase
    .channel(`check_ins_venue_${VENUE_ID}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'check_ins',
        filter: `venue_id=eq.${VENUE_ID}`,
      },
      onInsert
    )
    .subscribe();
}

/**
 * Subscribe to venue row changes (pulse_active, nc_balance, vibe_status)
 * onChange(payload) called on any UPDATE to this venue's row
 */
export function subscribeToVenue(onChange) {
  return supabase
    .channel(`venue_${VENUE_ID}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'venues',
        filter: `id=eq.${VENUE_ID}`,
      },
      onChange
    )
    .subscribe();
}

/**
 * Subscribe to new inbound messages
 */
export function subscribeToMessages(onMessage) {
  return supabase
    .channel(`messages_venue_${VENUE_ID}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `venue_id=eq.${VENUE_ID}`,
      },
      onMessage
    )
    .subscribe();
}

/**
 * Subscribe to new reviews
 */
export function subscribeToReviews(onReview) {
  return supabase
    .channel(`reviews_venue_${VENUE_ID}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'reviews',
        filter: `venue_id=eq.${VENUE_ID}`,
      },
      onReview
    )
    .subscribe();
}

/**
 * Unsubscribe from a channel
 */
export function unsubscribe(channel) {
  if (channel) supabase.removeChannel(channel);
}
