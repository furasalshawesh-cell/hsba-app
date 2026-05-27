-- =====================================================
-- Supabase Schema for HSBA (حسبة) App
-- =====================================================
-- Run this in Supabase SQL Editor to set up the database

-- =====================================================
-- 1. PROFILES TABLE
-- =====================================================
-- Stores user profile data linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  subscription_status TEXT NOT NULL DEFAULT 'free' CHECK (subscription_status IN ('free', 'trial', 'active', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. USER SETTINGS TABLE
-- =====================================================
-- Stores calculator settings per user
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  settings_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. RLS POLICIES - PROFILES
-- =====================================================

-- Users can read their own profile
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

-- Users can insert their own profile
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile (but NOT role field - handled separately)
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND 
    -- Prevent users from changing their own role (unless they're already admin)
    (role = (SELECT role FROM public.profiles WHERE id = auth.uid()) OR 
     (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  );

-- Admins can read all profiles
DROP POLICY IF EXISTS "admin_select_all" ON public.profiles;
CREATE POLICY "admin_select_all" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 4. RLS POLICIES - USER SETTINGS
-- =====================================================

-- Users can read their own settings
DROP POLICY IF EXISTS "users_select_own_settings" ON public.user_settings;
CREATE POLICY "users_select_own_settings" ON public.user_settings 
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own settings
DROP POLICY IF EXISTS "users_insert_own_settings" ON public.user_settings;
CREATE POLICY "users_insert_own_settings" ON public.user_settings 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own settings
DROP POLICY IF EXISTS "users_update_own_settings" ON public.user_settings;
CREATE POLICY "users_update_own_settings" ON public.user_settings 
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own settings
DROP POLICY IF EXISTS "users_delete_own_settings" ON public.user_settings;
CREATE POLICY "users_delete_own_settings" ON public.user_settings 
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 5. FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Function to auto-create profile on signup
-- Note: Owner email gets 'admin' role automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_email TEXT := 'alshawshfras3@gmail.com';
  user_role TEXT;
  user_name TEXT;
BEGIN
  -- Determine role based on email
  IF LOWER(TRIM(new.email)) = owner_email THEN
    user_role := 'admin';
  ELSE
    user_role := 'user';
  END IF;
  
  -- Get name from metadata or from email
  user_name := COALESCE(
    new.raw_user_meta_data ->> 'name',
    SPLIT_PART(new.email, '@', 1)
  );
  
  -- Insert profile
  INSERT INTO public.profiles (id, email, name, role, subscription_status)
  VALUES (
    new.id,
    LOWER(TRIM(new.email)),
    user_name,
    user_role,
    'free'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = CASE 
      WHEN LOWER(TRIM(new.email)) = owner_email THEN 'admin'
      ELSE public.profiles.role
    END;
  
  RETURN new;
END;
$$;

-- Function to update last_login_at
CREATE OR REPLACE FUNCTION public.handle_user_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET last_login_at = NOW()
  WHERE id = new.id;
  RETURN new;
END;
$$;

-- =====================================================
-- 6. TRIGGERS
-- =====================================================

-- Trigger to update updated_at on profiles
DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger to update updated_at on user_settings
DROP TRIGGER IF EXISTS on_user_settings_updated ON public.user_settings;
CREATE TRIGGER on_user_settings_updated
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger to auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 7. INDEXES
-- =====================================================

-- Index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Index on role for admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Index on user_id in settings
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- =====================================================
-- 8. MANUAL ADMIN UPGRADE (Run if needed)
-- =====================================================
-- If the owner email profile exists with role='user' and RLS blocks
-- the automatic upgrade, run this SQL manually as superuser:
--
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE LOWER(email) = 'alshawshfras3@gmail.com';
--
-- Or create a function that can be called to upgrade (bypasses RLS):

CREATE OR REPLACE FUNCTION public.upgrade_owner_to_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_email TEXT := 'alshawshfras3@gmail.com';
BEGIN
  UPDATE public.profiles
  SET role = 'admin'
  WHERE LOWER(email) = owner_email;
  
  RAISE NOTICE 'Owner % upgraded to admin', owner_email;
END;
$$;

-- To run it: SELECT public.upgrade_owner_to_admin();
