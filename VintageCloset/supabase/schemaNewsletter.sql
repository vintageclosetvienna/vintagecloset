-- ============================================
-- NEWSLETTER (double opt-in) + personal welcome codes
-- Applied 2026-10-20. Settings guide: SETTINGS-GUIDE.md
-- ============================================

-- Welcome codes only work for the email they were issued to
ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS restricted_email TEXT;

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('women', 'men', 'unisex')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'unsubscribed')),
  -- Only SHA-256 hashes of the email-link tokens are stored
  confirm_token_hash TEXT,
  confirm_expires_at TIMESTAMPTZ,
  unsubscribe_token_hash TEXT,
  discount_code_id UUID REFERENCES discount_codes(id) ON DELETE SET NULL,
  consent_text TEXT NOT NULL,
  consent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  source TEXT NOT NULL DEFAULT 'popup',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_email_key ON newsletter_subscribers (LOWER(email));
CREATE INDEX IF NOT EXISTS newsletter_subscribers_confirm_token_idx ON newsletter_subscribers (confirm_token_hash);
CREATE INDEX IF NOT EXISTS newsletter_subscribers_unsubscribe_token_idx ON newsletter_subscribers (unsubscribe_token_hash);

-- Sign-up attempts for rate limiting (hashed IP / email, no plain data)
CREATE TABLE IF NOT EXISTS newsletter_rate_limits (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  key_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS newsletter_rate_limits_key_idx ON newsletter_rate_limits (key_hash, created_at);

-- RLS: the website writes through the server (service role); admins may read the list
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view newsletter subscribers"
  ON newsletter_subscribers FOR SELECT
  TO authenticated
  USING (true);

-- Not visible to the public API at all; admins can only read the subscriber list
REVOKE ALL ON newsletter_rate_limits FROM anon, authenticated;
REVOKE ALL ON newsletter_subscribers FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON newsletter_subscribers FROM authenticated;
