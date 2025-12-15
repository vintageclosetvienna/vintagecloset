-- ============================================
-- VINTAGE CLOSET - ADD DISCOUNT CODE COLUMNS TO ORDERS
-- Run this in Supabase SQL Editor to add discount code tracking
-- ============================================

-- Add discount code columns to orders table
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS discount_code TEXT,
  ADD COLUMN IF NOT EXISTS discount_code_amount DECIMAL(10,2) DEFAULT 0;

-- Create index for discount code lookups
CREATE INDEX IF NOT EXISTS idx_orders_discount_code ON orders(discount_code);

-- Add comment for documentation
COMMENT ON COLUMN orders.discount_code IS 'Discount code (Gutschein) used for this order';
COMMENT ON COLUMN orders.discount_code_amount IS 'Amount discounted through discount code';

