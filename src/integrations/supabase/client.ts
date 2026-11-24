import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rebwquvphyrfhwqbdojs.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_cqmJJfuyluLuM5XdRICDfw_zT8owdal'

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project-id') &&
  !supabaseAnonKey.includes('your-anon-public-api-key')
)

// Fallback dummy URL and anon key to prevent createClient from throwing on initialization
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://dummy-hi-tune.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'dummy-anon-key',
  {
    auth: {
      storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)

export interface SupabaseHealth {
  configured: boolean
  connected: boolean
  tablesCreated: boolean
  error?: string
}

export async function checkSupabaseHealth(): Promise<SupabaseHealth> {
  if (!isSupabaseConfigured) {
    return { configured: false, connected: false, tablesCreated: false }
  }

  try {
    const { error } = await supabase.from('order_categories').select('id').limit(1)
    if (error) {
      if (error.code === 'PGRST205' || error.message.includes('relation') || error.message.includes('schema cache')) {
        return {
          configured: true,
          connected: true,
          tablesCreated: false,
          error: 'সুপাবেস প্রজেক্ট সফলভাবে সংযুক্ত, কিন্তু SQL টেবিল মাইগ্রেশন এখনও রান করা হয়নি।'
        }
      }
      return {
        configured: true,
        connected: false,
        tablesCreated: false,
        error: error.message
      }
    }
    return { configured: true, connected: true, tablesCreated: true }
  } catch (err: any) {
    return { configured: true, connected: false, tablesCreated: false, error: err.message }
  }
}
