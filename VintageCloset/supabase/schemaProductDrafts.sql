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

-- Only the team sees and edits drafts (same rule as products: staff add/edit, owner/manager delete);
-- there is no public policy, so the shop cannot read them. Helpers come from the staff_roles_and_permissions migration.
DROP POLICY IF EXISTS "Drafts are visible to the admin" ON product_drafts;
DROP POLICY IF EXISTS "Drafts are editable by the admin" ON product_drafts;

DROP POLICY IF EXISTS "Drafts are visible to the team" ON product_drafts;
CREATE POLICY "Drafts are visible to the team"
  ON product_drafts FOR SELECT
  USING ((select is_staff()));

DROP POLICY IF EXISTS "Staff can add drafts" ON product_drafts;
CREATE POLICY "Staff can add drafts"
  ON product_drafts FOR INSERT
  WITH CHECK ((select is_staff()));

DROP POLICY IF EXISTS "Staff can update drafts" ON product_drafts;
CREATE POLICY "Staff can update drafts"
  ON product_drafts FOR UPDATE
  USING ((select is_staff()))
  WITH CHECK ((select is_staff()));

DROP POLICY IF EXISTS "Owners and managers can delete drafts" ON product_drafts;
CREATE POLICY "Owners and managers can delete drafts"
  ON product_drafts FOR DELETE
  USING ((select is_admin()));
