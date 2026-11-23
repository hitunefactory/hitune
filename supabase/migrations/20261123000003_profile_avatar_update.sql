-- ==============================================================================
-- HI TUNE STUDIO: AVATAR & PROFILE UPDATE PERMISSIONS
-- Run this in Supabase SQL Editor if you want to ensure direct profile editing
-- ==============================================================================

-- 1. Ensure avatar_url column exists in public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Ensure RLS is enabled on public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Public read profiles (so team members can see each other's avatars)
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);

-- 4. Policy: Allow profile updates (enables saving name, phone, avatar)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile updates" ON public.profiles;
CREATE POLICY "Allow profile updates" ON public.profiles 
  FOR UPDATE 
  USING (true) 
  WITH CHECK (true);

-- 5. Policy: Allow profile inserts
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile insert" ON public.profiles;
CREATE POLICY "Allow profile insert" ON public.profiles 
  FOR INSERT 
  WITH CHECK (true);

-- 6. Grant schema and table access
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
