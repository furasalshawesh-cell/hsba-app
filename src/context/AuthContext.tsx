import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithOtp: (email: string) => Promise<{ error: AuthError | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  saveSettings: (settings: Record<string, unknown>) => Promise<{ error: Error | null }>;
  loadSettings: () => Promise<{ data: Record<string, unknown> | null; error: Error | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithOtp = useCallback(async (email: string) => {
    if (!supabase) return { error: new Error('Supabase not configured') as AuthError };
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });
    return { error };
  }, []);

  const verifyOtp = useCallback(async (email: string, token: string) => {
    if (!supabase) return { error: new Error('Supabase not configured') as AuthError };
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const saveSettings = useCallback(async (settings: Record<string, unknown>) => {
    if (!supabase) return { error: new Error('Supabase not configured') };
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        settings_data: settings,
      }, {
        onConflict: 'user_id',
      });

    return { error: error ? new Error(error.message) : null };
  }, [user]);

  const loadSettings = useCallback(async () => {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('settings_data')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      return { data: null, error: new Error(error.message) };
    }

    return { data: data?.settings_data ?? null, error: null };
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      isConfigured: isSupabaseConfigured,
      signInWithOtp,
      verifyOtp,
      signOut,
      saveSettings,
      loadSettings,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
