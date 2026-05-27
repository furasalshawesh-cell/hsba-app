import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo, useRef } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Admin emails - these users will always have admin access
const ADMIN_EMAILS = ['alshawshfras3@gmail.com'];

// Auth loading timeout in milliseconds
const AUTH_LOADING_TIMEOUT = 8000;

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
  // State
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<{ error: AuthError | Error | null }>;
  register: (email: string, password: string, name?: string) => Promise<{ error: AuthError | Error | null }>;
  logout: () => Promise<void>;
  signInWithOtp: (email: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: AuthError | null }>;
  updateProfile: (data: Partial<Pick<UserProfile, 'name' | 'phone'>>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  ensureProfileExists: () => Promise<void>;
  saveSettings: (settings: Record<string, unknown>) => Promise<{ error: Error | null }>;
  loadSettings: () => Promise<{ data: Record<string, unknown> | null; error: Error | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadDone = useRef(false);

  // Helper to check if email is admin
  const isEmailAdmin = useCallback((email: string | undefined | null): boolean => {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email.trim().toLowerCase());
  }, []);

  // Fetch profile from database
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    if (!supabase) return null;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        // PGRST116 means no rows found - profile doesn't exist yet
        if (error.code === 'PGRST116') {
          console.log('[v0] Profile not found for user:', userId);
          return null;
        }
        console.error('[v0] Error fetching profile:', error.message);
        return null;
      }
      
      return data as UserProfile;
    } catch (err) {
      console.error('[v0] Exception fetching profile:', err);
      return null;
    }
  }, []);

  // Create profile if it doesn't exist
  const createProfile = useCallback(async (authUser: User): Promise<UserProfile | null> => {
    if (!supabase || !authUser.email) return null;
    
    const normalizedEmail = authUser.email.trim().toLowerCase();
    const isOwnerEmail = isEmailAdmin(normalizedEmail);
    const nameFromMetadata = authUser.user_metadata?.name;
    const nameFromEmail = normalizedEmail.split('@')[0];
    
    const newProfile = {
      id: authUser.id,
      email: normalizedEmail,
      name: nameFromMetadata || nameFromEmail,
      phone: null,
      role: isOwnerEmail ? 'admin' : 'user',
      subscription_status: 'free',
    };
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();
      
      if (error) {
        // Profile might already exist (race condition)
        if (error.code === '23505') {
          console.log('[v0] Profile already exists, fetching...');
          return await fetchProfile(authUser.id);
        }
        console.error('[v0] Error creating profile:', error.message);
        return null;
      }
      
      console.log('[v0] Profile created successfully');
      return data as UserProfile;
    } catch (err) {
      console.error('[v0] Exception creating profile:', err);
      return null;
    }
  }, [fetchProfile, isEmailAdmin]);

  // Ensure profile exists - creates if missing
  const ensureProfileExists = useCallback(async () => {
    if (!user) return;
    
    let currentProfile = await fetchProfile(user.id);
    
    if (!currentProfile) {
      console.log('[v0] Profile missing, creating...');
      currentProfile = await createProfile(user);
    }
    
    // Update to admin if owner email but profile isn't admin
    if (currentProfile && isEmailAdmin(user.email) && currentProfile.role !== 'admin') {
      console.log('[v0] Updating owner email to admin role...');
      if (supabase) {
        const { error } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', user.id);
        
        if (error) {
          // RLS may block this update - warn but don't break
          console.warn('[v0] Failed to update role to admin (RLS may block this). Run this SQL manually:');
          console.warn(`UPDATE public.profiles SET role = 'admin' WHERE lower(email) = '${user.email?.toLowerCase()}';`);
          // Still mark as admin in memory since isEmailAdmin is true
        } else {
          currentProfile.role = 'admin';
        }
      }
    }
    
    setProfile(currentProfile);
  }, [user, fetchProfile, createProfile, isEmailAdmin]);

  // Refresh profile from database
  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const profileData = await fetchProfile(user.id);
    if (profileData) {
      setProfile(profileData);
    } else {
      // Try to create if missing
      await ensureProfileExists();
    }
  }, [user, fetchProfile, ensureProfileExists]);

  // Clear loading timeout
  const clearLoadingTimeout = useCallback(() => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  }, []);

  // Set loading with timeout
  const setLoadingWithTimeout = useCallback((isLoading: boolean) => {
    clearLoadingTimeout();
    
    if (isLoading) {
      // Set a timeout to prevent infinite loading
      loadingTimeoutRef.current = setTimeout(() => {
        console.warn('[v0] Auth loading timeout reached, forcing completion');
        setLoading(false);
        initialLoadDone.current = true;
      }, AUTH_LOADING_TIMEOUT);
    }
    
    setLoading(isLoading);
  }, [clearLoadingTimeout]);

  // Initial auth setup
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      initialLoadDone.current = true;
      return;
    }

    let isMounted = true;
    
    async function initAuth() {
      try {
        setLoadingWithTimeout(true);
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[v0] Error getting session:', error.message);
        }
        
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          let profileData = await fetchProfile(session.user.id);
          
          // Create profile if missing
          if (!profileData && isMounted) {
            profileData = await createProfile(session.user);
          }
          
          if (isMounted) {
            setProfile(profileData);
          }
        }
      } catch (err) {
        console.error('[v0] Exception during auth init:', err);
      } finally {
        if (isMounted) {
          clearLoadingTimeout();
          setLoading(false);
          initialLoadDone.current = true;
        }
      }
    }

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      console.log('[v0] Auth state changed:', event);
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        let profileData = await fetchProfile(session.user.id);
        
        // Create profile if missing on sign in
        if (!profileData && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
          profileData = await createProfile(session.user);
        }
        
        if (isMounted) {
          setProfile(profileData);
        }
      } else {
        setProfile(null);
      }
      
      // Only set loading false after initial load
      if (initialLoadDone.current && isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      clearLoadingTimeout();
      subscription.unsubscribe();
    };
  }, [fetchProfile, createProfile, clearLoadingTimeout, setLoadingWithTimeout]);

  // Register new user
  const register = useCallback(async (email: string, password: string, name?: string) => {
    if (!supabase) return { error: new Error('Supabase not configured') };
    
    const normalizedEmail = email.trim().toLowerCase();
    const isOwnerEmail = isEmailAdmin(normalizedEmail);
    
    const { error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: { 
          name,
          role: isOwnerEmail ? 'admin' : 'user'
        },
      },
    });
    
    return { error };
  }, [isEmailAdmin]);

  // Login with email/password
  const login = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: new Error('Supabase not configured') };
    
    const normalizedEmail = email.trim().toLowerCase();
    
    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    
    return { error };
  }, []);

  // Login with OTP
  const signInWithOtp = useCallback(async (email: string) => {
    if (!supabase) return { error: new Error('Supabase not configured') as AuthError };
    
    const normalizedEmail = email.trim().toLowerCase();
    
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: true,
      },
    });
    return { error };
  }, []);

  // Login with Google
  const signInWithGoogle = useCallback(async () => {
    if (!supabase) return { error: new Error('Supabase not configured') as AuthError };
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    return { error };
  }, []);

  // Verify OTP
  const verifyOtp = useCallback(async (email: string, token: string) => {
    if (!supabase) return { error: new Error('Supabase not configured') as AuthError };
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token,
      type: 'email',
    });
    return { error };
  }, []);

  // Logout
  const logout = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  }, []);

  // Update profile
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

  // Save settings
  const saveSettings = useCallback(async (settings: Record<string, unknown>) => {
    if (!supabase) return { error: new Error('Supabase not configured') };
    if (!user) return { error: new Error('User not authenticated') };

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

  // Load settings
  const loadSettings = useCallback(async () => {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    if (!user) return { data: null, error: new Error('User not authenticated') };

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

  // Calculate isAdmin based on both email and profile role
  const isAuthenticated = !!user;
  const isAdmin = useMemo(() => {
    return isEmailAdmin(user?.email) || profile?.role === 'admin';
  }, [user?.email, profile?.role, isEmailAdmin]);

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      loading,
      isConfigured: isSupabaseConfigured,
      isAuthenticated,
      isAdmin,
      login,
      register,
      logout,
      signInWithOtp,
      signInWithGoogle,
      verifyOtp,
      updateProfile,
      refreshProfile,
      ensureProfileExists,
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
