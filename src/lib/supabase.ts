import { createClient } from '@supabase/supabase-js';

// For Vite projects, we need VITE_ prefix for client-side env vars
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if both env vars are properly configured
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
