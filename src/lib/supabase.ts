import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ekrtiaweairoimwjhfpv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrcnRpYXdlYWlyb2ltd2poZnB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MjUwOTUsImV4cCI6MjA5NTQwMTA5NX0.W6P4398AZcoh0ahmiQSRb2yYprcrAz4Lk2_VSt3I9Uo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const isSupabaseConfigured = true;

export type UserSettings = {
  id: string;
  user_id: string;
  settings_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};
