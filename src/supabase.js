import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://fjpjmppjgswkjsdbucvv.supabase.co',
  'sb_publishable_s1Ny4N40kzRpYBB_tqF_7g_qjow5R6J',
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
