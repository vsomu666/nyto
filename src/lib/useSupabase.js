// ══════════════════════════════════════════════════════════════
//  NYTO · Custom Hooks
//  Each hook fetches live Supabase data and falls back to mock
//  data when Supabase is not yet configured (keys = '1234').
// ══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Q from './supabaseQueries';
import * as Mock from '../data/mockData';
import { generateTrendData, generateTrendLabels } from '../utils/chartUtils';

// ── Helper: are we running with real keys? ──
const IS_LIVE = process.env.REACT_APP_SUPABASE_URL !== 'https://1234.supabase.co';

// ── Generic fetch hook ──
function useFetch(fetchFn, mockValue, deps = []) {
  const [data, setData] = useState(mockValue);
  const [loading, setLoading] = useState(IS_LIVE);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!IS_LIVE) return;
    setLoading(true);
    try {
      const { data: result, error: err } = await fetchFn();
      if (err) throw err;
      setData(result);
      setError(null);
    } catch (e) {
      console.warn('[NYTO] Supabase fetch failed, using mock data:', e.message);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, refetch: load };
}

// ─────────────────────────────────────────
//  useVenue
//  Venue row: name, nc_balance, tier, pulse_active, vibe_status
// ─────────────────────────────────────────
export function useVenue() {
  const MOCK_VENUE = {
    id: '1234',
    name: 'Halo Bar',
    location: 'Jubilee Hills, Hyderabad',
    nc_balance: 18400,
    nc_cap: 25000,
    tier: 'free',
    pulse_active: false,
    vibe_status: 'Vibing',
  };

  const { data: venue, loading, error, refetch } = useFetch(Q.fetchVenue, MOCK_VENUE);

  // Real-time: subscribe to venue row updates
  useEffect(() => {
    if (!IS_LIVE) return;
    const channel = Q.subscribeToVenue((payload) => {
      if (payload.new) refetch();
    });
    return () => Q.unsubscribe(channel);
  }, [refetch]);

  const updateVibe = useCallback(async (status) => {
    if (!IS_LIVE) return { error: null };
    return Q.updateVibeStatus(status);
  }, []);

  const updatePage = useCallback(async (fields) => {
    if (!IS_LIVE) return { error: null };
    const result = await Q.updateVenuePage(fields);
    if (!result.error) refetch();
    return result;
  }, [refetch]);

  return { venue: venue || MOCK_VENUE, loading, error, updateVibe, updatePage, refetch };
}

// ─────────────────────────────────────────
//  useOverviewStats
//  Live check-in count, today vs yesterday
// ─────────────────────────────────────────
export function useOverviewStats() {
  const [todayCount, setTodayCount] = useState(312);
  const [yesterdayCount, setYesterdayCount] = useState(284);
  const [loading, setLoading] = useState(IS_LIVE);

  const load = useCallback(async () => {
    if (!IS_LIVE) return;
    setLoading(true);
    try {
      const [todayRes, yestRes] = await Promise.all([
        Q.fetchTodayCheckIns(),
        Q.fetchYesterdayCheckIns(),
      ]);
      if (!todayRes.error) setTodayCount(todayRes.data);
      if (!yestRes.error) setYesterdayCount(yestRes.data);
    } catch (e) {
      console.warn('[NYTO] Overview stats fetch failed:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Real-time: increment counter on each new check-in
  useEffect(() => {
    if (!IS_LIVE) return;
    const channel = Q.subscribeToCheckIns(() => {
      setTodayCount(c => c + 1);
    });
    return () => Q.unsubscribe(channel);
  }, []);

  const delta = todayCount - yesterdayCount;

  return {
    todayCount,
    yesterdayCount,
    delta,
    deltaLabel: delta >= 0 ? `↑ ${delta} vs yesterday` : `↓ ${Math.abs(delta)} vs yesterday`,
    deltaClass: delta >= 0 ? 'up' : 'dn',
    loading,
  };
}

// ─────────────────────────────────────────
//  useHourlyChart
// ─────────────────────────────────────────
export function useHourlyChart() {
  return useFetch(Q.fetchHourlyCheckIns, Mock.HOURLY_DATA);
}

// ─────────────────────────────────────────
//  useWeeklyChart
// ─────────────────────────────────────────
export function useWeeklyChart() {
  return useFetch(Q.fetchWeeklyCheckIns, Mock.WEEKLY_DATA);
}

// ─────────────────────────────────────────
//  useTrendChart
// ─────────────────────────────────────────
export function useTrendChart() {
  const MOCK = generateTrendData(30);
  return useFetch(Q.fetchTrendData, MOCK);
}

// ─────────────────────────────────────────
//  useHeatmap
// ─────────────────────────────────────────
export function useHeatmap() {
  return useFetch(Q.fetchHeatmapData, Mock.HEATMAP_DATA);
}

// ─────────────────────────────────────────
//  useWalletBurn
// ─────────────────────────────────────────
export function useWalletBurn() {
  return useFetch(Q.fetchWalletBurn, Mock.WALLET_BURN);
}

// ─────────────────────────────────────────
//  useTransactionLog
// ─────────────────────────────────────────
export function useTransactionLog() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(IS_LIVE);
  const [page, setPage] = useState(0);

  const load = useCallback(async (p = 0) => {
    if (!IS_LIVE) return;
    setLoading(true);
    const { data, error } = await Q.fetchTransactionLog(p);
    if (!error && data) {
      setTransactions(prev => p === 0 ? data : [...prev, ...data]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(0); }, [load]);

  const loadMore = useCallback(() => {
    const next = page + 1;
    setPage(next);
    load(next);
  }, [page, load]);

  return { transactions, loading, loadMore };
}

// ─────────────────────────────────────────
//  useRecentCheckIns
// ─────────────────────────────────────────
export function useRecentCheckIns() {
  const [checkIns, setCheckIns] = useState(Mock.RECENT_CHECKINS);
  const [loading, setLoading] = useState(IS_LIVE);

  const load = useCallback(async () => {
    if (!IS_LIVE) return;
    setLoading(true);
    const { data, error } = await Q.fetchRecentCheckIns();
    if (!error && data) {
      // Normalize to the shape the UI expects
      const normalized = data.map(ci => ({
        id: ci.id,
        initials: (ci.users?.display_name || 'U').slice(0, 2).toUpperCase(),
        color: avatarColor(ci.users?.id),
        name: ci.users?.display_name || 'Guest',
        badge: ci.users?.is_vip ? 'VIP' : null,
        nc: `+${ci.nc_awarded} NC`,
        time: timeAgo(ci.created_at),
        type: formatCheckInType(ci.transaction_type, ci.group_size),
      }));
      setCheckIns(normalized);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Real-time
  useEffect(() => {
    if (!IS_LIVE) return;
    const channel = Q.subscribeToCheckIns(() => load());
    return () => Q.unsubscribe(channel);
  }, [load]);

  return { checkIns, loading };
}

// ─────────────────────────────────────────
//  useCustomers
// ─────────────────────────────────────────
export function useCustomers() {
  const [customers, setCustomers] = useState(Mock.CUSTOMERS);
  const [loading, setLoading] = useState(IS_LIVE);
  const [filter, setFilter] = useState('All');

  const load = useCallback(async (f = 'all') => {
    if (!IS_LIVE) return;
    setLoading(true);
    const { data, error } = await Q.fetchCustomers(f.toLowerCase());
    if (!error && data) {
      const normalized = data.map(c => ({
        user_id: c.user_id,
        initials: (c.users?.display_name || 'U').slice(0, 2).toUpperCase(),
        color: avatarColor(c.user_id),
        name: c.users?.display_name || 'Guest',
        tag: c.is_vip ? 'VIP' : null,
        visits: c.visit_count,
        lastVisit: timeAgo(c.last_visit_at),
        spend: `₹${Number(c.total_spend || 0).toLocaleString('en-IN')}`,
        status: c.status === 'active' ? 'Active' : 'Lapsed',
      }));
      setCustomers(normalized);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(filter); }, [load, filter]);

  return { customers, loading, filter, setFilter };
}

// ─────────────────────────────────────────
//  useLostRegulars
// ─────────────────────────────────────────
export function useLostRegulars() {
  const [regulars, setRegulars] = useState(Mock.LOST_REGULARS);
  const [loading, setLoading] = useState(IS_LIVE);

  const load = useCallback(async () => {
    if (!IS_LIVE) return;
    setLoading(true);
    const { data, error } = await Q.fetchLostRegulars();
    if (!error && data) {
      const normalized = data.map(c => {
        const daysAgo = Math.floor(
          (Date.now() - new Date(c.last_visit_at).getTime()) / 86400000
        );
        return {
          user_id: c.user_id,
          initials: (c.users?.display_name || 'U').slice(0, 2).toUpperCase(),
          color: avatarColor(c.user_id),
          name: c.users?.display_name || 'Guest',
          tag: c.is_vip ? 'VIP' : null,
          visits: c.visit_count,
          spend: `₹${Number(c.total_spend || 0).toLocaleString('en-IN')}`,
          daysAgo,
          risk: daysAgo >= 35 ? 'HIGH' : daysAgo >= 25 ? 'HIGH' : 'MED',
        };
      });
      setRegulars(normalized);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const sendWinBack = useCallback(async (userId, name) => {
    if (!IS_LIVE) return { error: null };
    return Q.sendWinBackNC(userId);
  }, []);

  return { regulars, loading, sendWinBack, refetch: load };
}

// ─────────────────────────────────────────
//  useReviews
// ─────────────────────────────────────────
export function useReviews() {
  const [reviews, setReviews] = useState(Mock.REVIEWS);
  const [loading, setLoading] = useState(IS_LIVE);

  const load = useCallback(async () => {
    if (!IS_LIVE) return;
    setLoading(true);
    const { data, error } = await Q.fetchReviews();
    if (!error && data) {
      const normalized = data.map(r => ({
        id: r.id,
        initials: (r.users?.display_name || 'U').slice(0, 2).toUpperCase(),
        color: avatarColor(r.users?.id),
        name: r.users?.display_name || 'Guest',
        stars: r.rating,
        time: timeAgo(r.created_at),
        text: r.body,
        replied: !!r.reply_body,
        reply: r.reply_body,
      }));
      setReviews(normalized);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Real-time new review
  useEffect(() => {
    if (!IS_LIVE) return;
    const channel = Q.subscribeToReviews(() => load());
    return () => Q.unsubscribe(channel);
  }, [load]);

  const reply = useCallback(async (reviewId, text) => {
    if (!IS_LIVE) {
      setReviews(r => r.map(rev => rev.id === reviewId ? { ...rev, replied: true, reply: text } : rev));
      return { error: null };
    }
    const result = await Q.replyToReview(reviewId, text);
    if (!result.error) load();
    return result;
  }, [load]);

  return { reviews, loading, reply };
}

// ─────────────────────────────────────────
//  useMessages
// ─────────────────────────────────────────
export function useMessages() {
  const [conversations, setConversations] = useState([]);
  const [thread, setThread] = useState(Mock.INITIAL_MESSAGES);
  const [activeUserId, setActiveUserId] = useState(null);
  const [loading, setLoading] = useState(IS_LIVE);

  const loadConvos = useCallback(async () => {
    if (!IS_LIVE) return;
    setLoading(true);
    const { data, error } = await Q.fetchConversations();
    if (!error && data) setConversations(data);
    setLoading(false);
  }, []);

  const loadThread = useCallback(async (userId) => {
    if (!IS_LIVE || !userId) return;
    const { data, error } = await Q.fetchMessageThread(userId);
    if (!error && data) {
      setThread(data.map(m => ({
        id: m.id,
        type: m.direction === 'outbound' ? 'out' : 'in',
        text: m.body,
        time: timeAgo(m.created_at),
      })));
    }
  }, []);

  useEffect(() => { loadConvos(); }, [loadConvos]);

  useEffect(() => {
    if (activeUserId) loadThread(activeUserId);
  }, [activeUserId, loadThread]);

  // Real-time
  useEffect(() => {
    if (!IS_LIVE) return;
    const channel = Q.subscribeToMessages((payload) => {
      loadConvos();
      if (payload.new?.user_id === activeUserId) loadThread(activeUserId);
    });
    return () => Q.unsubscribe(channel);
  }, [activeUserId, loadConvos, loadThread]);

  const send = useCallback(async (userId, body) => {
    if (!IS_LIVE) {
      setThread(t => [...t, { id: Date.now(), type: 'out', text: body, time: 'Just now' }]);
      return { error: null };
    }
    const result = await Q.sendMessage(userId, body);
    if (!result.error) loadThread(userId);
    return result;
  }, [loadThread]);

  return { conversations, thread, activeUserId, setActiveUserId, loading, send };
}

// ─────────────────────────────────────────
//  useOffers
// ─────────────────────────────────────────
export function useOffers() {
  const [offers, setOffers] = useState(Mock.ACTIVE_OFFERS);
  const [loading, setLoading] = useState(IS_LIVE);

  const load = useCallback(async () => {
    if (!IS_LIVE) return;
    setLoading(true);
    const { data, error } = await Q.fetchOffers();
    if (!error && data) setOffers(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = useCallback(async (offerId, active) => {
    if (!IS_LIVE) return { error: null };
    const result = await Q.toggleOffer(offerId, active);
    if (!result.error) load();
    return result;
  }, [load]);

  const triggerPowerHour = useCallback(async (options) => {
    if (!IS_LIVE) return { error: null };
    return Q.triggerPowerHour(options);
  }, []);

  return { offers, loading, toggle, triggerPowerHour, refetch: load };
}

// ─────────────────────────────────────────
//  useEvents (Prime)
// ─────────────────────────────────────────
export function useEvents() {
  const [events, setEvents] = useState(Mock.EVENTS);
  const [loading, setLoading] = useState(IS_LIVE);

  const load = useCallback(async () => {
    if (!IS_LIVE) return;
    setLoading(true);
    const { data, error } = await Q.fetchEvents();
    if (!error && data) setEvents(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = useCallback(async (event) => {
    if (!IS_LIVE) return { error: null };
    const result = await Q.createEvent(event);
    if (!result.error) load();
    return result;
  }, [load]);

  return { events, loading, create };
}

// ─────────────────────────────────────────
//  usePushCampaigns (Prime)
// ─────────────────────────────────────────
export function usePushCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(IS_LIVE);

  const load = useCallback(async () => {
    if (!IS_LIVE) return;
    setLoading(true);
    const { data, error } = await Q.fetchPushCampaigns();
    if (!error && data) setCampaigns(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const send = useCallback(async (params) => {
    if (!IS_LIVE) return { error: null };
    const result = await Q.sendPushCampaign(params);
    if (!result.error) load();
    return result;
  }, [load]);

  return { campaigns, loading, send };
}

// ─────────────────────────────────────────
//  useCompetitors (Prime)
// ─────────────────────────────────────────
export function useCompetitors() {
  return useFetch(Q.fetchCompetitorData, Mock.COMPETITORS);
}

// ─────────────────────────────────────────
//  useConnectors (Prime)
// ─────────────────────────────────────────
export function useConnectors() {
  const [connectors, setConnectors] = useState([]);
  const [loading, setLoading] = useState(IS_LIVE);

  const load = useCallback(async () => {
    if (!IS_LIVE) return;
    setLoading(true);
    const { data, error } = await Q.fetchConnectors();
    if (!error && data) {
      const normalized = data.map(c => ({
        user_id: c.user_id,
        initials: (c.users?.display_name || 'U').slice(0, 2).toUpperCase(),
        color: avatarColor(c.user_id),
        name: c.users?.display_name || 'Guest',
        groups: c.groups_brought,
        newCustomers: c.new_customers_introduced,
        revenue: `₹${Number(c.estimated_revenue || 0).toLocaleString('en-IN')}`,
      }));
      setConnectors(normalized);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const sendNC = useCallback(async (userId, amount = 500) => {
    if (!IS_LIVE) return { error: null };
    return Q.sendWinBackNC(userId, amount);
  }, []);

  return { connectors, loading, sendNC };
}

// ─────────────────────────────────────────
//  Utility helpers
// ─────────────────────────────────────────

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#6366f1,#a78bfa)',
  'linear-gradient(135deg,#22d3ee,#6366f1)',
  'linear-gradient(135deg,#ec4899,#f59e0b)',
  'linear-gradient(135deg,#f97316,#ef4444)',
  'linear-gradient(135deg,#8b5cf6,#6366f1)',
  'linear-gradient(135deg,#22c55e,#10b981)',
  'linear-gradient(135deg,#ec4899,#8b5cf6)',
];

function avatarColor(id) {
  if (!id) return AVATAR_GRADIENTS[0];
  const hash = String(id).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

function timeAgo(isoString) {
  if (!isoString) return '';
  const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 172800) return 'Yesterday';
  return `${Math.floor(diff / 86400)} days ago`;
}

function formatCheckInType(type, groupSize) {
  if (groupSize > 1) return `Group · ${groupSize} people`;
  if (type === 'first_visit') return 'First visit bonus';
  if (type === 'pulse_bonus') return 'Pulse 2× applied';
  if (type === 'pioneer_vibe') return 'Vibe Pioneer bonus';
  return 'Solo';
}
