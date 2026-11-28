-- ==============================================================================
-- HI TUNE STUDIO: FIX ORDERS & OPERATIONAL TABLES RLS PERMISSIONS
-- Run this migration in Supabase SQL Editor to allow both anon and authenticated users
-- ==============================================================================

-- 1. ORDERS TABLE POLICIES
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can view orders" ON public.orders;
DROP POLICY IF EXISTS "Public can view orders" ON public.orders;
DROP POLICY IF EXISTS "Public view orders" ON public.orders;
CREATE POLICY "Public view orders" ON public.orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
CREATE POLICY "Public insert orders" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can update orders" ON public.orders;
DROP POLICY IF EXISTS "Public can update orders" ON public.orders;
DROP POLICY IF EXISTS "Public update orders" ON public.orders;
CREATE POLICY "Public update orders" ON public.orders FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete orders" ON public.orders;
CREATE POLICY "Public delete orders" ON public.orders FOR DELETE USING (true);

-- 2. ORDER DETAILS POLICIES
ALTER TABLE public.order_details ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can manage order details" ON public.order_details;
DROP POLICY IF EXISTS "Public manage order details" ON public.order_details;
CREATE POLICY "Public manage order details" ON public.order_details FOR ALL USING (true) WITH CHECK (true);

-- 3. ORDER TASKS POLICIES
ALTER TABLE public.order_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can manage tasks" ON public.order_tasks;
DROP POLICY IF EXISTS "Public manage tasks" ON public.order_tasks;
CREATE POLICY "Public manage tasks" ON public.order_tasks FOR ALL USING (true) WITH CHECK (true);

-- 4. TASK SUBMISSIONS POLICIES
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can manage task submissions" ON public.task_submissions;
DROP POLICY IF EXISTS "Public manage task submissions" ON public.task_submissions;
CREATE POLICY "Public manage task submissions" ON public.task_submissions FOR ALL USING (true) WITH CHECK (true);

-- 5. ORDER COMMENTS POLICIES
ALTER TABLE public.order_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can manage comments" ON public.order_comments;
DROP POLICY IF EXISTS "Public manage comments" ON public.order_comments;
CREATE POLICY "Public manage comments" ON public.order_comments FOR ALL USING (true) WITH CHECK (true);

-- 6. REVISIONS POLICIES
ALTER TABLE public.revisions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can manage revisions" ON public.revisions;
DROP POLICY IF EXISTS "Public manage revisions" ON public.revisions;
CREATE POLICY "Public manage revisions" ON public.revisions FOR ALL USING (true) WITH CHECK (true);

-- 7. PAYMENTS POLICIES
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can manage payments" ON public.payments;
DROP POLICY IF EXISTS "Public manage payments" ON public.payments;
CREATE POLICY "Public manage payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);

-- 8. EXPENSES POLICIES
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can manage expenses" ON public.expenses;
DROP POLICY IF EXISTS "Public manage expenses" ON public.expenses;
CREATE POLICY "Public manage expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);

-- 9. NOTIFICATIONS POLICIES
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see only their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated can manage notifications" ON public.notifications;
DROP POLICY IF EXISTS "Public manage notifications" ON public.notifications;
CREATE POLICY "Public manage notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

-- 10. PROFILES POLICIES (Allow public read, insert, and update)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public insert profiles" ON public.profiles;
CREATE POLICY "Public insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public update profiles" ON public.profiles;
CREATE POLICY "Public update profiles" ON public.profiles FOR UPDATE USING (true) WITH CHECK (true);

-- 11. ENABLE REALTIME REPLICATION (Instant cross-device push)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.task_submissions;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

