-- ============================================
-- VINTAGE CLOSET - SITE IMAGES SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- SITE_IMAGES TABLE
-- ============================================
CREATE TABLE site_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  section TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX idx_site_images_key ON site_images(key);
CREATE INDEX idx_site_images_section ON site_images(section);
CREATE INDEX idx_site_images_is_active ON site_images(is_active);
CREATE INDEX idx_site_images_section_sort ON site_images(section, sort_order);

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

-- Apply trigger to site_images
CREATE TRIGGER update_site_images_updated_at
  BEFORE UPDATE ON site_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE site_images ENABLE ROW LEVEL SECURITY;

-- Anyone can read active images
CREATE POLICY "Active site images are viewable by everyone" 
  ON site_images FOR SELECT 
  USING (is_active = TRUE);

-- Authenticated users (admin) can view all images including inactive
CREATE POLICY "Authenticated users can view all site images" 
  ON site_images FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Only authenticated users can insert/update/delete
CREATE POLICY "Authenticated users can insert site images" 
  ON site_images FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update site images" 
  ON site_images FOR UPDATE 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete site images" 
  ON site_images FOR DELETE 
  USING (auth.role() = 'authenticated');

-- ============================================
-- SEED DATA - Default Site Images
-- ============================================

INSERT INTO site_images (key, section, label, description, url, sort_order) VALUES
-- Landing Hero (3 images)
('hero-left', 'landing-hero', 'Hero Left', 'Back left image in the hero section (tilted -6°)', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop', 1),
('hero-center', 'landing-hero', 'Hero Center', 'Main center image in the hero section (front)', 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=2070&auto=format&fit=crop', 2),
('hero-right', 'landing-hero', 'Hero Right', 'Back right image in the hero section (tilted +6°)', 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1887&auto=format&fit=crop', 3),

-- Media Carousel (4 images)
('carousel-1', 'media-carousel', 'Carousel Image 1', 'Spring Collection', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop', 1),
('carousel-2', 'media-carousel', 'Carousel Image 2', 'Behind the Scenes', 'https://images.unsplash.com/photo-1550614000-4b9519e40569?q=80&w=2070&auto=format&fit=crop', 2),
('carousel-3', 'media-carousel', 'Carousel Image 3', 'Editorial', 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070&auto=format&fit=crop', 3),
('carousel-4', 'media-carousel', 'Carousel Image 4', 'Vintage Denim', 'https://images.unsplash.com/photo-1529139574466-a302d20525a9?q=80&w=2070&auto=format&fit=crop', 4),

-- Collection Highlights (3 images)
('highlight-women', 'collection-highlights', 'Women Collection Card', 'Women category card on landing page', 'https://images.unsplash.com/photo-1550614000-4b9519e40569?q=80&w=2070&auto=format&fit=crop', 1),
('highlight-men', 'collection-highlights', 'Men Collection Card', 'Men category card on landing page', 'https://images.unsplash.com/photo-1617114919297-3c8dd6caea94?q=80&w=1964&auto=format&fit=crop', 2),
('highlight-unisex', 'collection-highlights', 'Unisex Collection Card', 'Unisex category card on landing page', 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?q=80&w=2070&auto=format&fit=crop', 3),

-- Story Slides (3 images)
('story-1', 'story-slides', 'Story Slide 1', 'Vintage Pattern Shirt', 'https://images.unsplash.com/photo-1578932750294-f5075e85f44a?q=80&w=1935&auto=format&fit=crop', 1),
('story-2', 'story-slides', 'Story Slide 2', 'Italian Leather Moto', 'https://images.unsplash.com/photo-1520975954732-35dd22299614?q=80&w=1935&auto=format&fit=crop', 2),
('story-3', 'story-slides', 'Story Slide 3', 'Carpenter Denim', 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1887&auto=format&fit=crop', 3),

-- Collection Heroes (3 images)
('women-hero', 'collection-heroes', 'Women Page Hero', 'Hero background image for Women collection page', 'https://images.unsplash.com/photo-1550614000-4b9519e40569?q=80&w=2070&auto=format&fit=crop', 1),
('men-hero', 'collection-heroes', 'Men Page Hero', 'Hero background image for Men collection page', 'https://images.unsplash.com/photo-1617114919297-3c8dd6caea94?q=80&w=1964&auto=format&fit=crop', 2),
('unisex-hero', 'collection-heroes', 'Unisex Page Hero', 'Hero background image for Unisex collection page', 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?q=80&w=2070&auto=format&fit=crop', 3);

