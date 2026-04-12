const defaultWeatherBaseUrl = 'https://api.open-meteo.com/v1';

export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
  openMeteoBaseUrl: import.meta.env.VITE_OPEN_METEO_BASE_URL ?? defaultWeatherBaseUrl,
  ingestionSecret: import.meta.env.VITE_INGESTION_SECRET ?? '',
};

export const hasSupabaseEnv = Boolean(env.supabaseUrl && env.supabaseAnonKey);
