import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[NYTO] Missing Supabase env vars. ' +
    'Check your .env file has REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY set.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Venue ID from env — single-venue build
export const VENUE_ID = process.env.REACT_APP_VENUE_ID || '1234';
