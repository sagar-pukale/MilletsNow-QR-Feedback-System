import { createClient } from '@supabase/supabase-js'

import { env } from './env.js'

export const supabaseStorageBucket = env.SUPABASE_STORAGE_BUCKET
let supabaseClient: ReturnType<typeof createClient> | null = null

function getServerSupabaseConfig() {
  if (!env.SUPABASE_URL) {
    throw new Error('SUPABASE_URL is required for backend Supabase operations.')
  }

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for backend Supabase operations.')
  }

  return {
    supabaseUrl: env.SUPABASE_URL,
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  }
}

export function getSupabaseClient() {
  if (supabaseClient) return supabaseClient
  const { supabaseUrl, supabaseServiceRoleKey } = getServerSupabaseConfig()
  supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
  return supabaseClient
}

export function getSupabaseStoragePublicUrl(path: string) {
  const { data } = getSupabaseClient().storage.from(supabaseStorageBucket).getPublicUrl(path)
  return data.publicUrl
}
