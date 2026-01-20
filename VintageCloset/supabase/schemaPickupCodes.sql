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
