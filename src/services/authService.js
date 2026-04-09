import { hasSupabaseEnv } from '../app/config/env';
import { hasSupabaseClient, requireSupabaseClient } from '../lib/supabaseClient';
import { createServiceError, createSupabaseServiceError } from './serviceError';

function withLatency(data) {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(data), 120);
  });
}

function requireAuthClient() {
  if (!hasSupabaseClient()) {
    throw createServiceError('Supabase Auth is not configured. Add the public Supabase environment variables first.');
  }

  return requireSupabaseClient();
}

async function loadSession() {
  if (!hasSupabaseClient()) {
    return withLatency(null);
  }

  const supabase = requireAuthClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw createSupabaseServiceError('Unable to restore the current auth session.', error);
  }

  return data.session;
}

export const authService = {
  isConfigured() {
    return hasSupabaseClient();
  },

  async getSession() {
    return loadSession();
  },

  async signIn({ email, password }) {
    const supabase = requireAuthClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      throw createSupabaseServiceError('Unable to sign in with Supabase Auth.', error);
    }

    return data;
  },

  async signUp({ email, password, displayName }) {
    const supabase = requireAuthClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      throw createSupabaseServiceError('Unable to sign up with Supabase Auth.', error);
    }

    return data;
  },

  async signOut() {
    if (!hasSupabaseClient()) {
      return null;
    }

    const supabase = requireAuthClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw createSupabaseServiceError('Unable to sign out of Supabase Auth.', error);
    }

    return null;
  },

  async getAuthCapabilities() {
    return withLatency({
      provider: 'Supabase Auth',
      isConfigured: hasSupabaseClient(),
      status: hasSupabaseEnv
        ? 'Supabase environment keys detected'
        : 'Supabase environment keys are not configured yet',
      methods: ['Email/password sign up', 'Email/password sign in', 'Session restore', 'Sign out'],
    });
  },

  onAuthStateChange(callback) {
    if (!hasSupabaseClient()) {
      return {
        data: {
          subscription: {
            unsubscribe() {},
          },
        },
      };
    }

    const supabase = requireAuthClient();

    return supabase.auth.onAuthStateChange(callback);
  },
};
