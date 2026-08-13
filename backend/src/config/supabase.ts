import { createClient } from '@supabase/supabase-js'

import { env } from './env.js'

const supabaseUrl =
  env.SUPABASE_URL ??
  process.env.VITE_SUPABASE_URL ??
  'https://pezmxujnnwarhbgvutal.supabase.co'

const supabaseKey =
  env.SUPABASE_SERVICE_ROLE_KEY ??
  env.SUPABASE_PUBLISHABLE_KEY ??
  env.SUPABASE_ANON_KEY ??
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  process.env.VITE_SUPABASE_ANON_KEY ??
  'sb_publishable_qf_9nzMYMH4IN10b0IA0kA_1uyI4O13'

export const supabaseStorageBucket = env.SUPABASE_STORAGE_BUCKET

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

export function getSupabaseStoragePublicUrl(path: string) {
  const { data } = supabase.storage.from(supabaseStorageBucket).getPublicUrl(path)
  return data.publicUrl
}
