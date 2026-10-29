import { createClient } from '@supabase/supabase-js';

// Access public env variables cleanly via import.meta.env or dynamic env
const getEnvVar = (key: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key] as string;
  }
  return '';
};

const supabaseUrl = getEnvVar('PUBLIC_SUPABASE_URL') || 'https://placeholder.supabase.co';
const supabaseAnonKey = getEnvVar('PUBLIC_SUPABASE_ANON_KEY') || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

export const isSupabaseConfigured = (): boolean => {
  const url = getEnvVar('PUBLIC_SUPABASE_URL');
  const key = getEnvVar('PUBLIC_SUPABASE_ANON_KEY');
  return Boolean(url && key && url !== 'https://placeholder.supabase.co' && key !== 'placeholder-anon-key');
};
