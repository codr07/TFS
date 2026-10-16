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

// Admin client: create a service role instance only if a valid JWT secret key is configured.
// Real Supabase service role keys are JWTs that begin with 'eyJ'. Non-JWT keys fail with 'Unregistered API key'.
const hasValidSecretKey = Boolean(
  supabaseSecretKey && 
  supabaseSecretKey !== 'placeholder' && 
  supabaseSecretKey.startsWith('eyJ')
);

export const supabaseAdmin = hasValidSecretKey
  ? createClient(supabaseUrl, supabaseSecretKey, {
      auth: {
        storageKey: 'sb-admin-auth-token',
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : supabase;

