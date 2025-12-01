-- ============================================
-- VINTAGE CLOSET - JOURNAL SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- JOURNAL_ARTICLES TABLE
-- ============================================
CREATE TABLE journal_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Culture', 'Style', 'Care', 'City Guide', 'Behind the Scenes', 'News')),
  cover_image TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  author TEXT NOT NULL DEFAULT 'Vintage Closet Team',
  published_at DATE NOT NULL DEFAULT CURRENT_DATE,
  read_time INTEGER NOT NULL DEFAULT 5,
  featured BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  is_draft BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX idx_journal_articles_slug ON journal_articles(slug);
CREATE INDEX idx_journal_articles_category ON journal_articles(category);
CREATE INDEX idx_journal_articles_featured ON journal_articles(featured);
CREATE INDEX idx_journal_articles_is_draft ON journal_articles(is_draft);
CREATE INDEX idx_journal_articles_published_at ON journal_articles(published_at DESC);
CREATE INDEX idx_journal_articles_created_at ON journal_articles(created_at DESC);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
-- Note: If you already created this function in schema.sql, skip this part
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to journal_articles
CREATE TRIGGER update_journal_articles_updated_at
  BEFORE UPDATE ON journal_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE journal_articles ENABLE ROW LEVEL SECURITY;

-- Anyone can read published (non-draft) articles
CREATE POLICY "Published articles are viewable by everyone" 
  ON journal_articles FOR SELECT 
  USING (is_draft = FALSE);

-- Authenticated users (admin) can view all articles including drafts
CREATE POLICY "Authenticated users can view all articles" 
  ON journal_articles FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Only authenticated users can insert/update/delete
CREATE POLICY "Authenticated users can insert articles" 
  ON journal_articles FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update articles" 
  ON journal_articles FOR UPDATE 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete articles" 
  ON journal_articles FOR DELETE 
  USING (auth.role() = 'authenticated');

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to calculate read time from content (approx 200 words per minute)
CREATE OR REPLACE FUNCTION calculate_read_time(content TEXT)
RETURNS INTEGER AS $$
DECLARE
  word_count INTEGER;
BEGIN
  -- Count words (split by whitespace)
  word_count := array_length(regexp_split_to_array(content, '\s+'), 1);
  -- Calculate minutes (200 words per minute, minimum 1 minute)
  RETURN GREATEST(1, CEIL(word_count::DECIMAL / 200));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_journal_slug(title TEXT)
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

-- Uncomment below to insert sample articles

/*
INSERT INTO journal_articles (slug, title, excerpt, content, category, cover_image, images, author, published_at, read_time, featured, tags, is_draft) VALUES
(
  'the-art-of-archiving',
  'The Art of Archiving',
  'How we preserve the stories behind every piece that enters our collection.',
  'Every garment that enters Vintage Closet carries a story. Our job isn''t just to sell clothes—it''s to preserve the narratives woven into each thread.

When a piece arrives at our Vienna studio, it goes through what we call "the ritual." First, we examine the construction, the stitching, the fabric weight. Then comes the research: when was it made? Where? By whom?

The best vintage isn''t just old clothes. It''s a time capsule. A 1992 Nike windbreaker isn''t just nylon and polyester—it''s the Barcelona Olympics, it''s the Dream Team, it''s a moment in athletic history you can actually wear.

We photograph everything obsessively. Not just the front and back, but the tags, the wear patterns, the small imperfections that prove authenticity. These details matter to collectors, and they matter to us.

Our archive now holds over 2,000 documented pieces. Each one catalogued, researched, and ready to find its next home.',
  'Behind the Scenes',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2070&auto=format&fit=crop',
  ARRAY['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2070&auto=format&fit=crop', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop'],
  'Vintage Closet Team',
  '2025-02-15',
  6,
  TRUE,
  ARRAY['Archive', 'Process', 'Vienna'],
  FALSE
),
(
  'history-of-90s-sportswear',
  'The History of 90s Sportswear',
  'How tracksuits went from the gym to the streets and defined a generation.',
  'The 90s were a pivotal decade for fashion, but nowhere was the shift more apparent than in the explosion of sportswear as everyday attire.

From the terracewear of British football culture to the hip-hop influence in New York, brands like Adidas, Nike, and Kappa became symbols of status and belonging. It wasn''t just about comfort; it was about identity.

"It wasn''t just clothes. It was a uniform for the youth."

Today, we see a resurgence of these styles. The oversized silhouettes, the bold color blocking, and the technical fabrics are all back. But finding authentic pieces from that era is becoming increasingly rare. That''s where we come in.',
  'Culture',
  'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=2070&auto=format&fit=crop',
  ARRAY['https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=2070&auto=format&fit=crop'],
  'Vintage Closet Team',
  '2025-02-10',
  5,
  FALSE,
  ARRAY['90s', 'Sportswear', 'Culture'],
  FALSE
);
*/

