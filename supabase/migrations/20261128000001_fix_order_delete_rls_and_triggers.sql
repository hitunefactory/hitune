-- ==============================================================================
-- HI TUNE STUDIO: ENSURE ORDER DELETE PERMISSIONS & SAFE TRIGGER EXECUTION
-- Run this migration in Supabase SQL Editor if order deletions fail or persist
-- ==============================================================================

-- 1. Ensure remaining operational tables allow full access (matching orders/payments policies)
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public manage deliveries" ON public.deliveries;
CREATE POLICY "Public manage deliveries" ON public.deliveries FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.order_attachments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public manage order_attachments" ON public.order_attachments;
CREATE POLICY "Public manage order_attachments" ON public.order_attachments FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.file_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public manage file_versions" ON public.file_versions;
CREATE POLICY "Public manage file_versions" ON public.file_versions FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public manage activity_logs" ON public.activity_logs;
CREATE POLICY "Public manage activity_logs" ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.income_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public manage income_records" ON public.income_records;
CREATE POLICY "Public manage income_records" ON public.income_records FOR ALL USING (true) WITH CHECK (true);

-- 2. Re-ensure orders & child delete policies are present
DROP POLICY IF EXISTS "Public delete orders" ON public.orders;
CREATE POLICY "Public delete orders" ON public.orders FOR DELETE USING (true);

-- 3. Make order financial / income triggers safe during order deletion & cascade
CREATE OR REPLACE FUNCTION public.update_order_financials()
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

  SELECT total_amount, discount_amount INTO ord_total, ord_discount
  FROM public.orders
  WHERE id = target_order_id;

  IF NOT FOUND THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT COALESCE(SUM(amount), 0.00) INTO total_paid
  FROM public.payments
  WHERE order_id = target_order_id;

  final_due := GREATEST(0.00, (COALESCE(ord_total, 0) - COALESCE(ord_discount, 0)) - total_paid);

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

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.sync_payment_income()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.income_records (order_id, payment_id, amount, date, source, recorded_by)
    VALUES (NEW.order_id, NEW.id, NEW.amount, NEW.payment_date::date, 'ORDER_PAYMENT', NEW.recorded_by);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.income_records WHERE payment_id = OLD.id;
    RETURN OLD;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
