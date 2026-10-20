-- Pickup Codes Table
-- Stores pickup codes for in-store pickup orders

CREATE TABLE IF NOT EXISTS pickup_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) NOT NULL UNIQUE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255),
  product_title VARCHAR(255),
  product_size VARCHAR(50),
  active BOOLEAN DEFAULT TRUE,  -- TRUE = not picked up yet, FALSE = picked up/redeemed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Index for fast code lookups
CREATE INDEX IF NOT EXISTS idx_pickup_codes_code ON pickup_codes(code);

-- Index for active codes
CREATE INDEX IF NOT EXISTS idx_pickup_codes_active ON pickup_codes(active);

-- Index for customer email lookups
CREATE INDEX IF NOT EXISTS idx_pickup_codes_email ON pickup_codes(customer_email);

-- Security (applied 2026-10-20): closed to the public website key.
-- The Stripe webhook writes with the service role; logged-in admins look up and redeem codes.
ALTER TABLE pickup_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view pickup codes" ON pickup_codes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can redeem pickup codes" ON pickup_codes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON pickup_codes FROM anon;
REVOKE INSERT, DELETE, TRUNCATE ON pickup_codes FROM authenticated;

-- All shop functions run with a fixed search_path (applied 2026-10-20), e.g.:
-- ALTER FUNCTION public.validate_discount_code(p_code text, p_product_id uuid, p_order_total numeric) SET search_path = public, pg_temp;
