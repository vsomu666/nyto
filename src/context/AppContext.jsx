import React, { createContext, useContext, useState, useCallback } from 'react';

const AppContext = createContext(null);

export const TIERS = {
  FREE: 'free',
  GROWTH: 'growth',
  PRIME: 'prime',
};

export function AppProvider({ children }) {
  const [tier, setTier] = useState(TIERS.FREE);
  const [modal, setModalState] = useState({ open: false, tier: null });
  const [vibeStatus, setVibeStatus] = useState('Vibing');
  const [venue, setVenue] = useState({
    name: 'Halo Bar',
    location: 'Jubilee Hills, Hyderabad',
    ncBalance: 18400,
    ncCap: 25000,
    pulseActive: false,
  });

  const openModal  = useCallback((t) => setModalState({ open: true, tier: t }), []);
  const closeModal = useCallback(()  => setModalState({ open: false, tier: null }), []);

  const updateVibe = useCallback((status) => {
    setVibeStatus(status);
  }, []);

  const value = {
    tier, setTier,
    modal, openModal, closeModal,
    vibeStatus, updateVibe,
    venue, setVenue,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}