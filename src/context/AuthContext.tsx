import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Profile type matching the database schema
export type UserProfile = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: 'user' | 'admin';
  subscription_status: 'free' | 'trial' | 'active' | 'expired' | 'cancelled';
  created_at: string;
  last_login_at: string | null;
  updated_at: string;
};

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: AuthError | Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | Error | null }>;
  signInWithOtp: (email: string) => Promise<{ error: AuthError | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Pick<UserProfile, 'name' | 'phone'>>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  saveSettings: (settings: Record<string, unknown>) => Promise<{ error: Error | null }>;
  loadSettings: () => Promise<{ data: Record<string, unknown> | null; error: Error | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  const fetchProfile = useCallback(async (userId: string) => {
    if (!supabase) return null;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    
    return data as UserProfile;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const profileData = await fetchProfile(user.id);
    setProfile(profileData);
  }, [user, fetchProfile]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const profileData = await fetchProfile(session.user.id);
        setProfile(profileData);
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const profileData = await fetchProfile(session.user.id);
        setProfile(profileData);
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signUp = useCallback(async (email: string, password: string, name?: string) => {
    if (!supabase) return { error: new Error('Supabase not configured') };
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });
    
    if (error) return { error };
    
    // Profile is created automatically via trigger
    return { error: null };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: new Error('Supabase not configured') };
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error };
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
    setProfile(null);
  }, []);

  const updateProfile = useCallback(async (data: Partial<Pick<UserProfile, 'name' | 'phone'>>) => {
    if (!supabase) return { error: new Error('Supabase not configured') };
    if (!user) return { error: new Error('User not authenticated') };

    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id);

    if (!error) {
      await refreshProfile();
    }

    return { error: error ? new Error(error.message) : null };
  }, [user, refreshProfile]);

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

    if (error && error.code !== 'PGRST116') {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data?.settings_data ?? null, error: null };
  }, [user]);

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      loading,
      isConfigured: isSupabaseConfigured,
      isAdmin,
      signUp,
      signIn,
      signInWithOtp,
      verifyOtp,
      signOut,
      updateProfile,
      refreshProfile,
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
