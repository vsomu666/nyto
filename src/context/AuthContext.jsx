import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

const IS_LIVE = process.env.REACT_APP_SUPABASE_URL !== 'https://1234.supabase.co';

const MOCK_USER = {
  id: 'mock-user-001',
  email: 'owner@halobar.in',
  user_metadata: { full_name: 'Halo Bar Owner', venue_name: 'Halo Bar' },
};

// Multiple demo venues for venue selector
const MOCK_VENUES = [
  {
    id: 'mock-venue-001',
    name: 'Halo Bar',
    location: 'Jubilee Hills, Hyderabad',
    category: 'Bar · Rooftop',
    tier: 'growth',
    nc_balance: 18400,
    nc_cap: 25000,
    pulse_active: false,
    vibe_status: 'Vibing',
  },
  {
    id: 'mock-venue-002',
    name: 'Neon Lounge',
    location: 'Banjara Hills, Hyderabad',
    category: 'Club',
    tier: 'free',
    nc_balance: 8200,
    nc_cap: 25000,
    pulse_active: false,
    vibe_status: 'Calm',
  },
  {
    id: 'mock-venue-003',
    name: 'Skyview Cafe',
    location: 'HITEC City, Hyderabad',
    category: 'Cafe',
    tier: 'prime',
    nc_balance: 42000,
    nc_cap: 100000,
    pulse_active: true,
    vibe_status: 'Fire',
  },
];

export function AuthProvider({ children }) {
  const [user, setUser]                   = useState(null);
  const [allVenues, setAllVenues]         = useState([]);       // all venues this owner has
  const [activeVenue, setActiveVenueState]= useState(null);     // currently selected venue
  const [loading, setLoading]             = useState(true);
  const [authError, setAuthError]         = useState(null);

  // ── Boot ──
  useEffect(() => {
    if (!IS_LIVE) {
      const mockLoggedIn = localStorage.getItem('nyto_mock_logged_in');
      const mockTier     = localStorage.getItem('nyto_mock_tier') || 'growth';
      const savedVenueId = localStorage.getItem('nyto_active_venue_id');
      if (mockLoggedIn) {
        const venues = MOCK_VENUES.map(v =>
          v.id === 'mock-venue-001' ? { ...v, tier: mockTier } : v
        );
        setUser(MOCK_USER);
        setAllVenues(venues);
        const saved = venues.find(v => v.id === savedVenueId);
        setActiveVenueState(saved || venues[0]);
      }
      setLoading(false);
      return;
    }

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await loadVenues(session.user.id);
      }
      setLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await loadVenues(session.user.id);
      } else {
        setUser(null);
        setAllVenues([]);
        setActiveVenueState(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Load all venues for this owner ──
  const loadVenues = async (userId) => {
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: true });

    if (!error && data?.length) {
      setAllVenues(data);
      const savedId = localStorage.getItem('nyto_active_venue_id');
      const saved   = data.find(v => v.id === savedId);
      setActiveVenueState(saved || data[0]);
    }
  };

  // ── Switch venue ──
  const switchVenue = useCallback((venueId) => {
    const v = allVenues.find(v => v.id === venueId);
    if (v) {
      setActiveVenueState(v);
      localStorage.setItem('nyto_active_venue_id', venueId);
    }
  }, [allVenues]);

  // ── Update active venue locally (after saves) ──
  const updateActiveVenue = useCallback((fields) => {
    setActiveVenueState(v => ({ ...v, ...fields }));
    setAllVenues(vs => vs.map(v => v.id === activeVenue?.id ? { ...v, ...fields } : v));
  }, [activeVenue?.id]);

  // ── Sign Up ──
  const signUp = useCallback(async ({ email, password, venueName, location, tier = 'free' }) => {
    setAuthError(null);
    if (!IS_LIVE) {
      const newUser  = { ...MOCK_USER, email, user_metadata: { full_name: venueName } };
      const newVenue = { ...MOCK_VENUES[0], name: venueName, location, tier,
        nc_balance: tier === 'prime' ? 50000 : tier === 'growth' ? 25000 : 10000 };
      localStorage.setItem('nyto_mock_logged_in', '1');
      localStorage.setItem('nyto_mock_tier', tier);
      setUser(newUser);
      setAllVenues([newVenue]);
      setActiveVenueState(newVenue);
      return { error: null };
    }
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: venueName, venue_name: venueName } },
    });
    if (error) { setAuthError(error.message); return { error }; }
    if (data.user) {
      await supabase.from('venues').insert({
        owner_id: data.user.id, name: venueName, location, tier,
        nc_balance: tier === 'prime' ? 50000 : tier === 'growth' ? 25000 : 10000,
        nc_cap:     tier === 'prime' ? 100000 : tier === 'growth' ? 50000 : 25000,
      });
      await loadVenues(data.user.id);
    }
    return { error: null };
  }, []);


  // ── Add Venue (logged-in owner adds a second/third venue) ──
  const addVenue = useCallback(async ({ name, location, category, tier = 'free' }) => {
    if (!name?.trim()) return { error: { message: 'Venue name is required' } };
    if (!IS_LIVE) {
      const newVenue = {
        id: 'mock-venue-' + Date.now(),
        name: name.trim(),
        location: location?.trim() || '',
        category: category?.trim() || '',
        tier,
        nc_balance: tier === 'prime' ? 50000 : tier === 'growth' ? 25000 : 10000,
        nc_cap:     tier === 'prime' ? 100000 : tier === 'growth' ? 50000 : 25000,
        pulse_active: false,
        vibe_status: 'Vibing',
      };
      setAllVenues(vs => [...vs, newVenue]);
      setActiveVenueState(newVenue);
      return { error: null, venue: newVenue };
    }
    // Live Supabase
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return { error: { message: 'Not authenticated' } };
    const { data, error } = await supabase.from('venues').insert({
      owner_id:   u.id,
      name:       name.trim(),
      location:   location?.trim() || '',
      category:   category?.trim() || '',
      tier,
      nc_balance: tier === 'prime' ? 50000 : tier === 'growth' ? 25000 : 10000,
      nc_cap:     tier === 'prime' ? 100000 : tier === 'growth' ? 50000 : 25000,
      vibe_status: 'Vibing',
      is_active: true,
    }).select().single();
    if (error) return { error };
    setAllVenues(vs => [...vs, data]);
    setActiveVenueState(data);
    return { error: null, venue: data };
  }, []);

  // ── Sign In ──
  const signIn = useCallback(async ({ email, password }) => {
    setAuthError(null);
    if (!IS_LIVE) {
      const storedTier = localStorage.getItem('nyto_mock_tier') || 'growth';
      localStorage.setItem('nyto_mock_logged_in', '1');
      const venues = MOCK_VENUES.map(v =>
        v.id === 'mock-venue-001' ? { ...v, tier: storedTier } : v
      );
      setUser({ ...MOCK_USER, email });
      setAllVenues(venues);
      setActiveVenueState(venues[0]);
      return { error: null };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setAuthError(error.message); return { error }; }
    return { error: null };
  }, []);

  // ── Sign Out ──
  const signOut = useCallback(async () => {
    if (!IS_LIVE) {
      localStorage.removeItem('nyto_mock_logged_in');
      localStorage.removeItem('nyto_active_venue_id');
    } else {
      await supabase.auth.signOut();
    }
    setUser(null);
    setAllVenues([]);
    setActiveVenueState(null);
  }, []);

  // ── Upgrade tier ──
  const upgradeTier = useCallback(async (newTier) => {
    if (!IS_LIVE) {
      localStorage.setItem('nyto_mock_tier', newTier);
      updateActiveVenue({ tier: newTier });
      return { error: null };
    }
    const { error } = await supabase.from('venues').update({ tier: newTier }).eq('id', activeVenue?.id);
    if (!error) updateActiveVenue({ tier: newTier });
    return { error };
  }, [activeVenue?.id, updateActiveVenue]);

  // ── Reset password ──
  const resetPassword = useCallback(async (email) => {
    if (!IS_LIVE) return { error: null };
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  }, []);

  const value = {
    user,
    allVenues,
    activeVenue,
    switchVenue,
    updateActiveVenue,
    loading,
    authError,
    setAuthError,
    signUp,
    addVenue,
    signIn,
    signOut,
    upgradeTier,
    resetPassword,
    isAuthenticated: !!user,
    currentTier: activeVenue?.tier || 'free',
    // legacy alias so existing components don't break
    venueProfile: activeVenue,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}