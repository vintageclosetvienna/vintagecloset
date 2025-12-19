-- Add object_position column to site_images table for drag-to-reposition feature

ALTER TABLE site_images 
ADD COLUMN IF NOT EXISTS object_position TEXT DEFAULT 'center center';

-- Set default for existing rows
UPDATE site_images 
SET object_position = 'center center' 
WHERE object_position IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN site_images.object_position IS 'CSS object-position value for focal point control (e.g., "50% 50%", "30% 70%")';

