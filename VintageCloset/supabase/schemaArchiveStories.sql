-- ============================================
-- VINTAGE CLOSET - ARCHIVE STORIES SCHEMA
-- "Born from the Archive" Section - Fully Editable
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- ARCHIVE_STORIES TABLE
-- ============================================
CREATE TABLE archive_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Image
  image_url TEXT NOT NULL,
  
  -- Card overlay info
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}', -- Array of tags like ['90s', 'Pattern', 'Cotton', 'Rare']
  
  -- Story content
  story_text TEXT NOT NULL,
  
  -- Highlights (3 points)
  highlight_1_icon TEXT NOT NULL DEFAULT 'MagnifyingGlass', -- Icon name: MagnifyingGlass, Eye, Heart, Star
  highlight_1_title TEXT NOT NULL,
  highlight_1_description TEXT NOT NULL,
  
  highlight_2_icon TEXT NOT NULL DEFAULT 'Eye',
  highlight_2_title TEXT NOT NULL,
  highlight_2_description TEXT NOT NULL,
  
  highlight_3_icon TEXT NOT NULL DEFAULT 'Heart',
  highlight_3_title TEXT NOT NULL,
  highlight_3_description TEXT NOT NULL,
  
  -- Section metadata
  section_header TEXT NOT NULL DEFAULT 'Born from the', -- Line 1 of header
  section_header_highlight TEXT NOT NULL DEFAULT 'Archive.', -- Line 2 (gradient text)
  
  -- Ordering & visibility
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_archive_stories_is_active ON archive_stories(is_active);
CREATE INDEX idx_archive_stories_sort_order ON archive_stories(sort_order);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE TRIGGER update_archive_stories_updated_at
  BEFORE UPDATE ON archive_stories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE archive_stories ENABLE ROW LEVEL SECURITY;

-- Anyone can read active stories
CREATE POLICY "Active archive stories are viewable by everyone" 
  ON archive_stories FOR SELECT 
  USING (is_active = TRUE);

-- Authenticated users (admin) can view all stories including inactive
CREATE POLICY "Authenticated users can view all archive stories" 
  ON archive_stories FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Only authenticated users can insert/update/delete
CREATE POLICY "Authenticated users can insert archive stories" 
  ON archive_stories FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update archive stories" 
  ON archive_stories FOR UPDATE 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete archive stories" 
  ON archive_stories FOR DELETE 
  USING (auth.role() = 'authenticated');

-- ============================================
-- SEED DATA - Default Archive Stories
-- ============================================

INSERT INTO archive_stories (
  image_url,
  title,
  location,
  tags,
  story_text,
  highlight_1_icon, highlight_1_title, highlight_1_description,
  highlight_2_icon, highlight_2_title, highlight_2_description,
  highlight_3_icon, highlight_3_title, highlight_3_description,
  sort_order
) VALUES
(
  'https://images.unsplash.com/photo-1578932750294-f5075e85f44a?q=80&w=1935&auto=format&fit=crop',
  'Vintage Pattern Shirt',
  'Personal Archive',
  ARRAY['90s', 'Pattern', 'Cotton', 'Rare'],
  'This isn''t just a shirt—it''s the very first piece that made me fall in love with vintage. Pulled from a closing warehouse in Berlin, it still smells faintly of cedar.',
  'MagnifyingGlass', 'The Dig', 'Unearthed in Kreuzberg, preserved with cedar blocks for years.',
  'Eye', 'Expert Eye', 'Hand-finished seams, original mother-of-pearl buttons intact.',
  'Heart', 'Curator''s Choice', 'Pairs with raw denim and beat-up sneakers for the perfect clash.',
  1
),
(
  'https://images.unsplash.com/photo-1520975954732-35dd22299614?q=80&w=1935&auto=format&fit=crop',
  'Italian Leather Moto',
  'Collector Estate',
  ARRAY['80s', 'Leather', 'Moto', 'Limited'],
  'Found while cataloging an old racer''s estate outside Milan. The patina on this jacket tells stories of backroads and espresso stops.',
  'Star', 'Road Proven', 'Scuffs and sun-fade carefully conditioned—not erased.',
  'Eye', 'Expert Eye', 'Original Talon zip, quilted lining still intact.',
  'Heart', 'Curator''s Choice', 'Throw over a tee, let the jacket do the talking.',
  2
),
(
  'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1887&auto=format&fit=crop',
  'Carpenter Denim',
  'Warehouse Pull',
  ARRAY['Workwear', 'Stonewash', 'Wide-leg', 'USA'],
  'Straight out of a defunct hardware store in Ohio. These jeans hit that sweet spot between relaxed and structured.',
  'MagnifyingGlass', 'Utility Gold', 'Paint freckles left on purpose, pockets reinforced.',
  'Eye', 'Expert Eye', 'Union tags confirm late 80s production run.',
  'Heart', 'Curator''s Choice', 'Roll the hem, show off your favorite sneakers.',
  3
);

-- ============================================
-- HELPER FUNCTION - Get Active Stories
-- ============================================
CREATE OR REPLACE FUNCTION get_active_archive_stories()
RETURNS SETOF archive_stories AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM archive_stories
  WHERE is_active = TRUE
  ORDER BY sort_order ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

