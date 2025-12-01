-- ============================================
-- VINTAGE CLOSET - DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  discount INTEGER DEFAULT 0 CHECK (discount >= 0 AND discount <= 50), -- 0-50% in 5% steps
  size TEXT NOT NULL,
  category TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('men', 'women', 'unisex')),
  era TEXT, -- '80s', '90s', 'Y2K', etc.
  images TEXT[] NOT NULL DEFAULT '{}', -- Array of storage URLs
  is_sold BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX idx_products_gender ON products(gender);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_sold ON products(is_sold);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_created_at ON products(created_at DESC);

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  
  -- Customer info
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  shipping_postal_code TEXT NOT NULL,
  shipping_country TEXT NOT NULL,
  
  -- Pricing snapshot (stored at time of purchase)
  original_price DECIMAL(10,2) NOT NULL,
  discount_applied INTEGER DEFAULT 0,
  final_price DECIMAL(10,2) NOT NULL,
  
  -- Product snapshot (in case product is deleted later)
  product_title TEXT NOT NULL,
  product_size TEXT NOT NULL,
  product_image TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_stripe_session ON orders(stripe_session_id);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to products
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to orders
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Products: Anyone can read non-sold products
CREATE POLICY "Products are viewable by everyone" 
  ON products FOR SELECT 
  USING (true);

-- Products: Only authenticated users (admin) can insert/update/delete
CREATE POLICY "Products are editable by authenticated users" 
  ON products FOR ALL 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Orders: Only authenticated users can view orders
CREATE POLICY "Orders are viewable by authenticated users" 
  ON orders FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Orders: Service role can insert (for webhooks)
CREATE POLICY "Orders can be created by service role" 
  ON orders FOR INSERT 
  WITH CHECK (true);

-- Orders: Only authenticated users can update
CREATE POLICY "Orders are editable by authenticated users" 
  ON orders FOR UPDATE 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to calculate final price with discount
CREATE OR REPLACE FUNCTION calculate_final_price(original DECIMAL, discount_percent INTEGER)
RETURNS DECIMAL AS $$
BEGIN
  IF discount_percent IS NULL OR discount_percent = 0 THEN
    RETURN original;
  END IF;
  RETURN ROUND(original * (1 - discount_percent::DECIMAL / 100), 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        TRIM(title),
        '[^a-zA-Z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Uncomment below to insert sample products

/*
INSERT INTO products (slug, title, description, price, discount, size, category, gender, era, images) VALUES
  ('vintage-nike-sweatshirt', 'Vintage 90s Nike Sweatshirt', 'Classic Nike sweatshirt from the 90s in excellent condition. Features the iconic swoosh logo.', 45.00, 0, 'L', 'Sweatshirts', 'unisex', '90s', ARRAY['https://your-bucket.supabase.co/storage/v1/object/public/product-images/1/main.jpg']),
  ('bayern-munchen-jersey', 'Adidas Bayern München Jersey', 'Authentic Bayern München jersey from the 90s. Perfect for collectors.', 85.00, 10, 'M', 'Jerseys', 'men', '90s', ARRAY['https://your-bucket.supabase.co/storage/v1/object/public/product-images/2/main.jpg']),
  ('carhartt-pants', 'Carhartt Double Knee Pants', 'Heavy-duty Carhartt work pants with double knee construction. Broken in perfectly.', 120.00, 0, '32/34', 'Pants', 'men', 'Y2K', ARRAY['https://your-bucket.supabase.co/storage/v1/object/public/product-images/3/main.jpg']),
  ('burberry-trench', 'Burberry Trench Coat', 'Iconic Burberry trench coat from the 80s. Timeless elegance.', 250.00, 15, 'S', 'Outerwear', 'women', '80s', ARRAY['https://your-bucket.supabase.co/storage/v1/object/public/product-images/4/main.jpg']);
*/

