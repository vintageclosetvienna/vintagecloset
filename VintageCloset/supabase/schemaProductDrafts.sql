-- ============================================
-- PRODUCT DRAFTS (pieces sent from the Rennstern app's Vintage clothes pipeline)
-- ============================================
-- A draft is never visible in the shop: it lives in its own table, readable only by the signed-in admin.
-- The import route (/api/import/piece, service role + VINTAGE_IMPORT_KEY) creates and fills drafts;
-- admin › Drafts sets the price and publishes a draft into `products` (same id, so its images stay where they are).
-- Run once in the Supabase SQL editor. Safe to run again.

CREATE TABLE IF NOT EXISTS product_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT 'rennstern-app',
  source_ref TEXT NOT NULL,                       -- the app's key for this piece: sending it again updates the same draft
  title TEXT NOT NULL DEFAULT '',
  description TEXT,
  price DECIMAL(10,2),                            -- empty until you set it in admin › Drafts
  size TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  gender TEXT CHECK (gender IN ('men', 'women', 'unisex')),
  era TEXT,
  brand TEXT,
  label_text TEXT,                                -- what the app read on the label (helps the AI and you)
  images TEXT[] NOT NULL DEFAULT '{}',
  ai_status TEXT NOT NULL DEFAULT 'pending' CHECK (ai_status IN ('pending', 'done', 'failed')),
  ai_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (source, source_ref)
);

CREATE INDEX IF NOT EXISTS idx_product_drafts_created_at ON product_drafts(created_at DESC);

DROP TRIGGER IF EXISTS update_product_drafts_updated_at ON product_drafts;
CREATE TRIGGER update_product_drafts_updated_at
  BEFORE UPDATE ON product_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE product_drafts ENABLE ROW LEVEL SECURITY;

-- Only the signed-in admin sees and edits drafts; there is no public policy (the shop cannot read them).
DROP POLICY IF EXISTS "Drafts are visible to the admin" ON product_drafts;
CREATE POLICY "Drafts are visible to the admin"
  ON product_drafts FOR SELECT
  USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Drafts are editable by the admin" ON product_drafts;
CREATE POLICY "Drafts are editable by the admin"
  ON product_drafts FOR ALL
  USING ((select auth.role()) = 'authenticated')
  WITH CHECK ((select auth.role()) = 'authenticated');
