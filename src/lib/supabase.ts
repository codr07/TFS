import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';
const supabaseSecretKey = (import.meta.env.VITE_SUPABASE_SECRET_KEY as string) || '';

// Singleton anon client - shared across the app
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'sb-anon-auth-token',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Admin client: only create a separate instance if the key is a valid JWT (starts with 'eyJ')
// Using the same client prevents "Multiple GoTrueClient instances" warnings
const isValidJwt = supabaseSecretKey.startsWith('eyJ');
export const supabaseAdmin = isValidJwt
  ? createClient(supabaseUrl, supabaseSecretKey, {
      auth: {
        storageKey: 'sb-admin-auth-token',
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : supabase;
