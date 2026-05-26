import { createClient } from '@supabase/supabase-js';

// For Vite projects, we need VITE_ prefix for client-side env vars
// But the Supabase integration provides them without prefix, so we try both
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || '';

// Don't throw error on missing env vars, just disable auth features
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = hasSupabaseConfig 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = hasSupabaseConfig;

export type UserSettings = {
  id: string;
  user_id: string;
  settings_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};
