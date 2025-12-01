-- ============================================
-- VINTAGE CLOSET - EVENTS SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- EVENTS TABLE
-- ============================================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TEXT,
  location TEXT NOT NULL,
  image TEXT,
  status TEXT NOT NULL CHECK (status IN ('Upcoming', 'Coming Soon', 'Past')) DEFAULT 'Upcoming',
  spots_left INTEGER,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_date ON events(date DESC);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_is_published ON events(is_published);
CREATE INDEX idx_events_date_status ON events(date, status);

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

-- Apply trigger to events
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Anyone can read published events
CREATE POLICY "Published events are viewable by everyone" 
  ON events FOR SELECT 
  USING (is_published = TRUE);

-- Authenticated users (admin) can view all events including unpublished
CREATE POLICY "Authenticated users can view all events" 
  ON events FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Only authenticated users can insert/update/delete
CREATE POLICY "Authenticated users can insert events" 
  ON events FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update events" 
  ON events FOR UPDATE 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete events" 
  ON events FOR DELETE 
  USING (auth.role() = 'authenticated');

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_event_slug(title TEXT)
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

-- Function to auto-update event status based on date
-- (Run this periodically or via cron job)
CREATE OR REPLACE FUNCTION update_event_statuses()
RETURNS void AS $$
BEGIN
  -- Mark past events
  UPDATE events 
  SET status = 'Past' 
  WHERE date < CURRENT_DATE AND status != 'Past';
  
  -- Mark upcoming events (within 30 days)
  UPDATE events 
  SET status = 'Upcoming' 
  WHERE date >= CURRENT_DATE 
    AND date <= CURRENT_DATE + INTERVAL '30 days'
    AND status = 'Coming Soon';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Uncomment below to insert sample events

/*
INSERT INTO events (slug, title, description, date, time, location, image, status, spots_left, is_published) VALUES
(
  'spring-drop-pop-up',
  'Spring Drop Pop-Up',
  'Our biggest collection of the year arrives. Be the first to explore 200+ handpicked pieces from the 90s and early 00s.',
  '2025-02-24',
  '10:00 - 18:00',
  'Neubaugasse 12, 1070 Wien',
  'https://images.unsplash.com/photo-1531058020387-3be344556be6?q=80&w=800&auto=format&fit=crop',
  'Upcoming',
  42,
  TRUE
),
(
  'vinyl-vintage-market',
  'Vinyl & Vintage Market',
  'A collaboration with local DJs and vintage collectors. Music, fashion, and good vibes all in one place.',
  '2025-03-10',
  '12:00 - 20:00',
  'Praterstrasse 1, 1020 Wien',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop',
  'Upcoming',
  78,
  TRUE
),
(
  'summer-archive-sale',
  'Summer Archive Sale',
  'Exclusive access to our archive pieces at special prices. One day only, first come first served.',
  '2025-06-15',
  '11:00 - 19:00',
  'Mariahilfer Str. 45, 1060 Wien',
  'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=800&auto=format&fit=crop',
  'Coming Soon',
  NULL,
  TRUE
);
*/

