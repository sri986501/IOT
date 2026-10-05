import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  // Warn at dev time but don't crash — pages handle missing config gracefully
  if (typeof window !== 'undefined') {
    console.warn(
      '[WaterGuardian] Supabase env vars missing. ' +
      'Copy .env.local.example → .env.local and add your project credentials.'
    );
  }
}

export const supabase = createClient(
  supabaseUrl  || 'https://placeholder.supabase.co',
  supabaseKey  || 'placeholder-key',
  {
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  }
);

export const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
