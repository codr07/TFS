import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';
const supabaseSecretKey = import.meta.env.VITE_SUPABASE_SECRET_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseAdmin = supabaseSecretKey
  ? createClient(supabaseUrl, supabaseSecretKey, {
      auth: {
        storageKey: 'sb-admin-auth-token',
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : supabase;

