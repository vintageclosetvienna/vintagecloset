-- ============================================
-- VINTAGE CLOSET - DISCOUNT CODES (GUTSCHEINE) SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- DISCOUNT_CODES TABLE
-- ============================================
CREATE TABLE discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  
  -- Discount type and value
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
  
  -- Usage restrictions
  usage_limit INTEGER DEFAULT NULL, -- NULL = unlimited
  usage_count INTEGER DEFAULT 0,
  
  -- Product restrictions
  applies_to TEXT NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all', 'specific')),
  product_ids UUID[] DEFAULT '{}', -- Only used if applies_to = 'specific'
  
  -- Minimum order value (optional)
  min_order_value DECIMAL(10,2) DEFAULT NULL,
  
  -- Validity
  is_active BOOLEAN DEFAULT TRUE,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NULL, -- NULL = never expires
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_discount_codes_code ON discount_codes(code);
CREATE INDEX idx_discount_codes_is_active ON discount_codes(is_active);
CREATE INDEX idx_discount_codes_expires_at ON discount_codes(expires_at);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE TRIGGER update_discount_codes_updated_at
  BEFORE UPDATE ON discount_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- Only authenticated users (admin) can view discount codes
CREATE POLICY "Authenticated users can view discount codes" 
  ON discount_codes FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Only authenticated users can insert
CREATE POLICY "Authenticated users can create discount codes" 
  ON discount_codes FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated users can update
CREATE POLICY "Authenticated users can update discount codes" 
  ON discount_codes FOR UPDATE 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated users can delete
CREATE POLICY "Authenticated users can delete discount codes" 
  ON discount_codes FOR DELETE 
  USING (auth.role() = 'authenticated');

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to validate a discount code
CREATE OR REPLACE FUNCTION validate_discount_code(
  p_code TEXT,
  p_product_id UUID DEFAULT NULL,
  p_order_total DECIMAL DEFAULT NULL
)
RETURNS TABLE (
  is_valid BOOLEAN,
  discount_type TEXT,
  discount_value DECIMAL,
  error_message TEXT
) AS $$
DECLARE
  v_discount discount_codes%ROWTYPE;
BEGIN
  -- Find the discount code
  SELECT * INTO v_discount
  FROM discount_codes
  WHERE UPPER(code) = UPPER(p_code);
  
  -- Code not found
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::DECIMAL, 'Ungültiger Gutscheincode'::TEXT;
    RETURN;
  END IF;
  
  -- Check if active
  IF NOT v_discount.is_active THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::DECIMAL, 'Dieser Gutschein ist nicht mehr aktiv'::TEXT;
    RETURN;
  END IF;
  
  -- Check start date
  IF v_discount.starts_at > NOW() THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::DECIMAL, 'Dieser Gutschein ist noch nicht gültig'::TEXT;
    RETURN;
  END IF;
  
  -- Check expiry
  IF v_discount.expires_at IS NOT NULL AND v_discount.expires_at < NOW() THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::DECIMAL, 'Dieser Gutschein ist abgelaufen'::TEXT;
    RETURN;
  END IF;
  
  -- Check usage limit
  IF v_discount.usage_limit IS NOT NULL AND v_discount.usage_count >= v_discount.usage_limit THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::DECIMAL, 'Dieser Gutschein wurde bereits zu oft verwendet'::TEXT;
    RETURN;
  END IF;
  
  -- Check minimum order value
  IF v_discount.min_order_value IS NOT NULL AND p_order_total IS NOT NULL AND p_order_total < v_discount.min_order_value THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::DECIMAL, 
      ('Mindestbestellwert: €' || v_discount.min_order_value::TEXT)::TEXT;
    RETURN;
  END IF;
  
  -- Check product restrictions
  IF v_discount.applies_to = 'specific' AND p_product_id IS NOT NULL THEN
    IF NOT (p_product_id = ANY(v_discount.product_ids)) THEN
      RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::DECIMAL, 'Dieser Gutschein gilt nicht für dieses Produkt'::TEXT;
      RETURN;
    END IF;
  END IF;
  
  -- All checks passed
  RETURN QUERY SELECT TRUE, v_discount.discount_type, v_discount.discount_value, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to apply/use a discount code (increment usage count)
CREATE OR REPLACE FUNCTION use_discount_code(p_code TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE discount_codes
  SET usage_count = usage_count + 1
  WHERE UPPER(code) = UPPER(p_code)
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (usage_limit IS NULL OR usage_count < usage_limit);
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate discount amount
CREATE OR REPLACE FUNCTION calculate_discount(
  p_discount_type TEXT,
  p_discount_value DECIMAL,
  p_order_total DECIMAL
)
RETURNS DECIMAL AS $$
BEGIN
  IF p_discount_type = 'percentage' THEN
    RETURN ROUND(p_order_total * (p_discount_value / 100), 2);
  ELSE
    -- Fixed amount, but not more than the order total
    RETURN LEAST(p_discount_value, p_order_total);
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;




