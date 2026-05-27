import { createClient } from '@supabase/supabase-js';

// Fallback values for production when env vars are not loaded
const FALLBACK_SUPABASE_URL = 'https://ekrtiaweairoimwjhfpv.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrcnRpYXdlYWlyb2ltd2poZnB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MjUwOTUsImV4cCI6MjA5NTQwMTA5NX0.W6P4398AZcoh0ahmiQSRb2yYprcrAz4Lk2_VSt3I9Uo';

// For Vite projects, we need VITE_ prefix for client-side env vars
// Try env vars first, then fallback to hardcoded values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || FALLBACK_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

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
