import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY ' +
    '(locally in .env.local, in production via Vercel environment variables).'
  )
}

export const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      lock: (_name, _acquireTimeout, fn) => fn(),
    },
    realtime: {
      params: { eventsPerSecond: 0 },
      reconnectAfterMs: () => 9999999,
      heartbeatIntervalMs: 9999999,
    },
  }
)
