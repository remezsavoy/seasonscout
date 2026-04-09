import { createClient } from '@supabase/supabase-js';
import { env, hasSupabaseEnv } from '../app/config/env';

const clientOptions = {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: true,
    persistSession: true,
  },
};

export const supabase = hasSupabaseEnv
  ? createClient(env.supabaseUrl, env.supabaseAnonKey, clientOptions)
  : null;

export function hasSupabaseClient() {
  return Boolean(supabase);
}

export function requireSupabaseClient() {
  if (!supabase) {
    throw new Error('Supabase environment variables are not configured.');
  }

  return supabase;
}
