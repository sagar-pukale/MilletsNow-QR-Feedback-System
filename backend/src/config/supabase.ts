import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://pezmxujnnwarhbgvutal.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_qf_9nzMYMH4IN10b0IA0kA_1uyI4O13'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
