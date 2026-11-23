-- ==============================================================================
-- HI TUNE STUDIO: AUTHENTICATION TRIGGER, ROLES & PERMISSIONS
-- Run this migration in Supabase SQL Editor
-- ==============================================================================

-- 1. SCHEMA GRANTS
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;

-- 2. LOOKUP TABLES RLS & POLICIES (Public read access)
ALTER TABLE public.order_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read order_categories" ON public.order_categories;
CREATE POLICY "Public read order_categories" ON public.order_categories FOR SELECT USING (true);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read roles" ON public.roles;
CREATE POLICY "Public read roles" ON public.roles FOR SELECT USING (true);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read departments" ON public.departments;
CREATE POLICY "Public read departments" ON public.departments FOR SELECT USING (true);

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read expense_categories" ON public.expense_categories;
CREATE POLICY "Public read expense_categories" ON public.expense_categories FOR SELECT USING (true);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read system_settings" ON public.system_settings;
CREATE POLICY "Public read system_settings" ON public.system_settings FOR SELECT USING (true);

-- 3. PROFILES POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 4. AUTOMATIC PROFILE CREATION TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_dept TEXT;
  v_full_name TEXT;
  v_bn_name TEXT;
  v_phone TEXT;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'AUDIO_DESIGNER');
  v_dept := COALESCE(NEW.raw_user_meta_data->>'department', 'AUDIO');
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  v_bn_name := COALESCE(NEW.raw_user_meta_data->>'bengali_name', v_full_name);
  v_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    bengali_name,
    phone,
    avatar_url,
    role,
    roles,
    department,
    is_active
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    v_bn_name,
    v_phone,
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    v_role,
    ARRAY[v_role],
    v_dept,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    bengali_name = EXCLUDED.bengali_name,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    roles = EXCLUDED.roles,
    department = EXCLUDED.department;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. ORDERS & OPERATIONAL TABLES RLS (Open for authenticated staff)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can view orders" ON public.orders;
CREATE POLICY "Authenticated can view orders" ON public.orders FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated can insert orders" ON public.orders;
CREATE POLICY "Authenticated can insert orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can update orders" ON public.orders;
CREATE POLICY "Authenticated can update orders" ON public.orders FOR UPDATE TO authenticated USING (true);

ALTER TABLE public.order_details ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can manage order details" ON public.order_details;
CREATE POLICY "Authenticated can manage order details" ON public.order_details FOR ALL TO authenticated USING (true);

ALTER TABLE public.order_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can manage tasks" ON public.order_tasks;
CREATE POLICY "Authenticated can manage tasks" ON public.order_tasks FOR ALL TO authenticated USING (true);

ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can manage task submissions" ON public.task_submissions;
CREATE POLICY "Authenticated can manage task submissions" ON public.task_submissions FOR ALL TO authenticated USING (true);

ALTER TABLE public.order_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can manage comments" ON public.order_comments;
CREATE POLICY "Authenticated can manage comments" ON public.order_comments FOR ALL TO authenticated USING (true);

ALTER TABLE public.revisions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can manage revisions" ON public.revisions;
CREATE POLICY "Authenticated can manage revisions" ON public.revisions FOR ALL TO authenticated USING (true);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can manage payments" ON public.payments;
CREATE POLICY "Authenticated can manage payments" ON public.payments FOR ALL TO authenticated USING (true);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can manage expenses" ON public.expenses;
CREATE POLICY "Authenticated can manage expenses" ON public.expenses FOR ALL TO authenticated USING (true);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can manage notifications" ON public.notifications;
CREATE POLICY "Authenticated can manage notifications" ON public.notifications FOR ALL TO authenticated USING (true);
