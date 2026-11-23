-- ==============================================================================
-- HI TUNE STUDIO: POSTGRESQL SCHEMA MIGRATION
-- Production Database for Audio-Video Studio Management System
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS & DOMAINS
DO $$ BEGIN
  CREATE TYPE role_type AS ENUM (
    'SUPER_ADMIN',
    'ORDER_MANAGER',
    'AUDIO_DESIGNER',
    'VIDEO_EDITOR',
    'QUALITY_CONTROLLER',
    'DELIVERY_MANAGER',
    'ACCOUNTANT'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE (Linked with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  bengali_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'AUDIO_DESIGNER',
  roles TEXT[] NOT NULL DEFAULT ARRAY['AUDIO_DESIGNER'],
  department TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. ROLES TABLE
CREATE TABLE IF NOT EXISTS public.roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name_bn TEXT NOT NULL,
  description TEXT
);

INSERT INTO public.roles (id, name, display_name_bn, description)
VALUES 
  ('SUPER_ADMIN', 'Super Admin', 'সুপার অ্যাডমিন', 'সম্পূর্ণ সিস্টেমে সর্বোচ্চ নিয়ন্ত্রণ ও পরিচালনা অধিকার'),
  ('ORDER_MANAGER', 'Order Manager', 'অর্ডার ম্যানেজার', 'অর্ডার গ্রহণ, ক্লায়েন্ট তথ্য ও টিম অ্যাসাইনমেন্ট'),
  ('AUDIO_DESIGNER', 'Audio Designer', 'অডিও ডিজাইনার', 'অডিও প্রোডাকশন, রেকর্ডিং ও ভয়েস মিক্সিং'),
  ('VIDEO_EDITOR', 'Video Editor', 'ভিডিও এডিটর', 'ভিডিও এডিটিং, ভিজ্যুয়াল এফেক্ট ও রেন্ডারিং'),
  ('QUALITY_CONTROLLER', 'Quality Controller', 'কোয়ালিটি কন্ট্রোলার', 'কাজের গুণগত মান যাচাই, অনুমোদন ও রিভিশন নির্দেশ'),
  ('DELIVERY_MANAGER', 'Delivery Manager', 'ডেলিভারি ম্যানেজার', 'চূড়ান্ত ফাইল হস্তান্তর ও ক্লায়েন্ট ডেলিভারি নিশ্চিতকরণ'),
  ('ACCOUNTANT', 'Accountant', 'অ্যাকাউন্ট্যান্ট', 'পেমেন্ট গ্রহণ, ভাউচার, ব্যয় ও হিসাব নিরীক্ষণ')
ON CONFLICT (id) DO UPDATE SET
  display_name_bn = EXCLUDED.display_name_bn,
  description = EXCLUDED.description;

-- 5. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name_bn TEXT NOT NULL
);

INSERT INTO public.departments (id, name, display_name_bn)
VALUES 
  ('MANAGEMENT', 'Management', 'ম্যানেজমেন্ট'),
  ('AUDIO', 'Audio Department', 'অডিও বিভাগ'),
  ('VIDEO', 'Video Department', 'ভিডিও বিভাগ'),
  ('QC', 'Quality Control', 'কোয়ালিটি কন্ট্রোল বিভাগ'),
  ('DELIVERY', 'Delivery Department', 'ডেলিভারি বিভাগ'),
  ('ACCOUNTS', 'Accounts Department', 'হিসাব বিভাগ')
ON CONFLICT (id) DO NOTHING;

-- 6. ORDER CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.order_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  dynamic_form_type TEXT NOT NULL DEFAULT 'GENERAL', -- ELECTION, WAZ, ADMISSION, GENERAL
  icon TEXT DEFAULT 'Music',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.order_categories (name, name_bn, slug, dynamic_form_type, icon, sort_order)
VALUES 
  ('Election Campaign Song', 'নির্বাচনী প্রচারণা গান', 'election-song', 'ELECTION', 'Vote', 1),
  ('Election Promotional Video', 'নির্বাচনী প্রচার ভিডিও', 'election-video', 'ELECTION', 'Video', 2),
  ('Waz Mahfil Miking Ad', 'ওয়াজ মাহফিল মাইকিং বিজ্ঞাপন', 'waz-mahfil', 'WAZ', 'Mic', 3),
  ('School Admission Ad', 'স্কুল ভর্তি বিজ্ঞাপন', 'school-admission', 'ADMISSION', 'GraduationCap', 4),
  ('Madrasa Admission Ad', 'মাদ্রাসা ভর্তি বিজ্ঞাপন', 'madrasa-admission', 'ADMISSION', 'BookOpen', 5),
  ('Islamic Ghazal & Nasheed', 'ইসলামিক গজল ও নাশিদ', 'islamic-ghazal', 'GENERAL', 'Music', 6),
  ('Commercial Promo Audio', 'ব্যবসায়িক প্রচার অডিও', 'commercial-audio', 'GENERAL', 'Radio', 7),
  ('Audio & Video Production', 'অডিও ও ভিডিও প্রোডাকশন', 'full-production', 'GENERAL', 'Film', 8),
  ('Other Custom Production', 'অন্যান্য কাস্টম অর্ডার', 'custom-order', 'GENERAL', 'Layers', 9)
ON CONFLICT (slug) DO NOTHING;

-- 7. ORDERS SEQUENCE FOR SAFE ORDER NUMBER GENERATION
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  current_yr TEXT := to_char(CURRENT_DATE, 'YYYY');
  next_val INT;
BEGIN
  next_val := nextval('order_number_seq');
  RETURN 'HT-' || current_yr || '-' || LPAD(next_val::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- 8. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL DEFAULT generate_order_number(),
  title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT,
  client_address TEXT,
  category_id UUID REFERENCES public.order_categories(id) ON DELETE SET NULL,
  priority TEXT NOT NULL DEFAULT 'NORMAL', -- LOW, NORMAL, HIGH, URGENT
  deadline TIMESTAMPTZ,
  audio_required BOOLEAN NOT NULL DEFAULT true,
  video_required BOOLEAN NOT NULL DEFAULT false,
  overall_status TEXT NOT NULL DEFAULT 'NEW',
  -- Financials
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  advance_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  due_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  payment_status TEXT NOT NULL DEFAULT 'UNPAID', -- UNPAID, PARTIAL, PAID
  -- Instructions
  description TEXT,
  internal_instructions TEXT,
  -- Assignments
  assigned_audio_staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_video_staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. ORDER DETAILS TABLE (Dynamic Category Information)
CREATE TABLE IF NOT EXISTS public.order_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID UNIQUE NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  election_details JSONB DEFAULT '{}'::jsonb,
  waz_details JSONB DEFAULT '{}'::jsonb,
  school_madrasa_details JSONB DEFAULT '{}'::jsonb,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. ORDER TASKS TABLE
CREATE TABLE IF NOT EXISTS public.order_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL, -- AUDIO, VIDEO, QC, DELIVERY
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, SUBMITTED, REVISION_REQUESTED, APPROVED, COMPLETED
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_order_task_type UNIQUE(order_id, task_type)
);

-- 11. TASK SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.task_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.order_tasks(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  submitted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  submission_type TEXT NOT NULL DEFAULT 'FINAL', -- PREVIEW, FINAL
  file_name TEXT NOT NULL,
  file_url TEXT,
  file_type TEXT,
  file_size BIGINT,
  google_drive_link TEXT,
  notes TEXT,
  version_number INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'PENDING_REVIEW', -- PENDING_REVIEW, APPROVED, REVISION_REQUESTED
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. ORDER ATTACHMENTS TABLE
CREATE TABLE IF NOT EXISTS public.order_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT,
  google_drive_link TEXT,
  file_type TEXT,
  file_size BIGINT,
  attachment_type TEXT NOT NULL DEFAULT 'REFERENCE', -- REFERENCE, LOGO, SCRIPT, AUDIO_RAW, FINAL
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. FILE VERSIONS TABLE (Immutable version history)
CREATE TABLE IF NOT EXISTS public.file_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.order_tasks(id) ON DELETE SET NULL,
  version_number INT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT,
  google_drive_link TEXT,
  file_type TEXT,
  file_size BIGINT,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. ORDER COMMENTS TABLE (Internal Discussion)
CREATE TABLE IF NOT EXISTS public.order_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  mentions TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. REVISIONS TABLE
CREATE TABLE IF NOT EXISTS public.revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.order_tasks(id) ON DELETE SET NULL,
  submission_id UUID REFERENCES public.task_submissions(id) ON DELETE SET NULL,
  department TEXT NOT NULL, -- AUDIO, VIDEO
  revision_number INT NOT NULL DEFAULT 1,
  instructions TEXT NOT NULL,
  requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, RESOLVED
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 16. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  type TEXT NOT NULL DEFAULT 'INFO',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 17. ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 18. DELIVERIES TABLE
CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID UNIQUE NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  delivered_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  delivery_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivery_method TEXT NOT NULL DEFAULT 'ONLINE', -- ONLINE, PENDRIVE, WHATSAPP, EMAIL, OTHER
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  final_files_summary TEXT,
  notes TEXT,
  confirmation_status TEXT NOT NULL DEFAULT 'DELIVERED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 19. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  payment_method TEXT NOT NULL DEFAULT 'CASH', -- CASH, BKASH, NAGAD, BANK, OTHER
  transaction_reference TEXT,
  notes TEXT,
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 20. EXPENSE CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.expense_categories (name, name_bn, is_default)
VALUES 
  ('Staff Salary', 'স্টাফ বেতন', true),
  ('Studio Rent', 'স্টুডিও ভাড়া', true),
  ('Electricity Bill', 'বিদ্যুৎ বিল', true),
  ('Internet Bill', 'ইন্টারনেট বিল', true),
  ('Equipment Purchase', 'যন্ত্রপাতি ক্রয়', true),
  ('Equipment Maintenance', 'যন্ত্রপাতি মেরামত ও রক্ষণাবেক্ষণ', true),
  ('Software Subscription', 'সফটওয়্যার ও প্লাগইন সাবস্ক্রিপশন', true),
  ('Office Refreshment', 'নাস্তা ও আপ্যায়ন', true),
  ('Other Expenses', 'অন্যান্য খরচ', true)
ON CONFLICT DO NOTHING;

-- 21. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'CASH',
  reference_no TEXT,
  receipt_url TEXT,
  notes TEXT,
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 22. INCOME RECORDS TABLE (Derived from verified payments)
CREATE TABLE IF NOT EXISTS public.income_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  source TEXT NOT NULL DEFAULT 'ORDER_PAYMENT',
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 23. SYSTEM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.system_settings (key, value)
VALUES 
  ('general', '{"studio_name": "HI TUNE STUDIO", "studio_location": "Jamalpur, Bangladesh", "phone": "+8801700000000", "currency": "BDT", "currency_symbol": "৳"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 24. AUTOMATED TRIGGERS

-- Trigger to recalculate order financials when payments change
CREATE OR REPLACE FUNCTION update_order_financials()
RETURNS TRIGGER AS $$
DECLARE
  target_order_id UUID;
  total_paid NUMERIC(12,2);
  ord_total NUMERIC(12,2);
  ord_discount NUMERIC(12,2);
  final_due NUMERIC(12,2);
  p_status TEXT;
BEGIN
  target_order_id := COALESCE(NEW.order_id, OLD.order_id);
  
  -- Calculate sum of payments for this order
  SELECT COALESCE(SUM(amount), 0.00) INTO total_paid
  FROM public.payments
  WHERE order_id = target_order_id;
  
  -- Get order total amount and discount
  SELECT total_amount, discount_amount INTO ord_total, ord_discount
  FROM public.orders
  WHERE id = target_order_id;
  
  final_due := GREATEST(0.00, (ord_total - ord_discount) - total_paid);
  
  IF total_paid <= 0.00 THEN
    p_status := 'UNPAID';
  ELSIF final_due <= 0.00 THEN
    p_status := 'PAID';
  ELSE
    p_status := 'PARTIAL';
  END IF;
  
  UPDATE public.orders
  SET 
    paid_amount = total_paid,
    due_amount = final_due,
    payment_status = p_status,
    updated_at = now()
  WHERE id = target_order_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payment_financials_ai ON public.payments;
CREATE TRIGGER trg_payment_financials_ai
AFTER INSERT OR UPDATE OR DELETE ON public.payments
FOR EACH ROW EXECUTE FUNCTION update_order_financials();

-- Trigger to sync income_records when payment is inserted
CREATE OR REPLACE FUNCTION sync_payment_income()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.income_records (order_id, payment_id, amount, date, source, recorded_by)
    VALUES (NEW.order_id, NEW.id, NEW.amount, NEW.payment_date::date, 'ORDER_PAYMENT', NEW.recorded_by);
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.income_records WHERE payment_id = OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_income ON public.payments;
CREATE TRIGGER trg_sync_income
AFTER INSERT OR DELETE ON public.payments
FOR EACH ROW EXECUTE FUNCTION sync_payment_income();

-- 25. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_records ENABLE ROW LEVEL SECURITY;

-- Helper function to check role
CREATE OR REPLACE FUNCTION public.has_role(req_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND (role = 'SUPER_ADMIN' OR req_role = ANY(roles) OR role = req_role)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Public read profiles for authenticated users" 
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

CREATE POLICY "Super Admins can manage all profiles" 
ON public.profiles FOR ALL TO authenticated USING (public.has_role('SUPER_ADMIN'));

-- Orders Policies
CREATE POLICY "Staff can view relevant orders" 
ON public.orders FOR SELECT TO authenticated USING (
  public.has_role('SUPER_ADMIN') OR
  public.has_role('ORDER_MANAGER') OR
  public.has_role('ACCOUNTANT') OR
  public.has_role('DELIVERY_MANAGER') OR
  public.has_role('QUALITY_CONTROLLER') OR
  assigned_audio_staff_id = auth.uid() OR
  assigned_video_staff_id = auth.uid() OR
  created_by = auth.uid()
);

CREATE POLICY "Order Managers and Admins can create and edit orders" 
ON public.orders FOR ALL TO authenticated USING (
  public.has_role('SUPER_ADMIN') OR
  public.has_role('ORDER_MANAGER')
);

-- Notifications Policy
CREATE POLICY "Users see only their notifications" 
ON public.notifications FOR ALL TO authenticated USING (user_id = auth.uid());

-- Payments & Accounts Policies
CREATE POLICY "Authorized staff can view payments" 
ON public.payments FOR SELECT TO authenticated USING (
  public.has_role('SUPER_ADMIN') OR
  public.has_role('ACCOUNTANT') OR
  public.has_role('ORDER_MANAGER')
);

CREATE POLICY "Accountants and Admins can record payments" 
ON public.payments FOR INSERT TO authenticated WITH CHECK (
  public.has_role('SUPER_ADMIN') OR
  public.has_role('ACCOUNTANT') OR
  public.has_role('ORDER_MANAGER')
);

CREATE POLICY "Expenses viewable by Accountants and Admins" 
ON public.expenses FOR ALL TO authenticated USING (
  public.has_role('SUPER_ADMIN') OR
  public.has_role('ACCOUNTANT')
);
