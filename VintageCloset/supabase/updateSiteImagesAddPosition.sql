-- ============================================
-- ADD OBJECT POSITION TO SITE_IMAGES
-- Allows repositioning images (drag to adjust focal point)
-- Run this in Supabase SQL Editor
-- ============================================

-- Add object_position column to store CSS object-position value
-- Default is "center center" (50% 50%)
-- Format: "X% Y%" where X and Y are 0-100
ALTER TABLE site_images 
ADD COLUMN IF NOT EXISTS object_position TEXT DEFAULT 'center center';

-- Update existing rows to have default position
UPDATE site_images 
SET object_position = 'center center' 
WHERE object_position IS NULL;

-- ============================================
-- EXAMPLE VALUES:
-- ============================================
-- 'center top' = 50% 0% (centered horizontally, top of image)
-- 'center center' = 50% 50% (default, centered)
-- 'center bottom' = 50% 100% (centered horizontally, bottom of image)
-- 'left center' = 0% 50% (left side, vertically centered)
-- 'right center' = 100% 50% (right side, vertically centered)
-- '30% 60%' = custom position (30% from left, 60% from top)
-- ============================================

