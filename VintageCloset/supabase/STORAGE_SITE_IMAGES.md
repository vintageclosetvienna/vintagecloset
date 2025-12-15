# Site Images Storage Setup

This document explains how to set up the Supabase storage bucket for site-wide images (hero images, carousel, collection cards, etc.)

## Step 1: Create the Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Create a bucket with these settings:
   - **Name**: `site-images`
   - **Public bucket**: ✅ **Yes** (check this box)
   - Click **Create bucket**

## Step 2: Set Up Storage Policies

Run this SQL in the **SQL Editor**:

```sql
-- ============================================
-- SITE IMAGES STORAGE POLICIES
-- ============================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Site images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload site images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update site images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete site images" ON storage.objects;

-- Allow public read access to site-images bucket
CREATE POLICY "Site images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-images');

-- Allow authenticated users (admin) to upload images
CREATE POLICY "Authenticated users can upload site images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'site-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users (admin) to update images
CREATE POLICY "Authenticated users can update site images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'site-images' 
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'site-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users (admin) to delete images
CREATE POLICY "Authenticated users can delete site images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'site-images' 
  AND auth.role() = 'authenticated'
);
```

## Step 3: Verify Setup

After running the SQL:

1. Go to **Storage** → **site-images**
2. You should see an empty bucket
3. Try uploading an image through the admin panel at `/admin/media`

## Image Sections

The `site-images` bucket stores images organized by section:

| Section | Purpose | Keys |
|---------|---------|------|
| `landing-hero` | Homepage hero images | `hero-left`, `hero-center`, `hero-right` |
| `media-carousel` | Scrolling carousel | `carousel-1`, `carousel-2`, `carousel-3`, `carousel-4` |
| `collection-highlights` | Landing page cards | `highlight-women`, `highlight-men`, `highlight-unisex` |
| `story-slides` | "Born from Archive" slides | `story-1`, `story-2`, `story-3` |
| `collection-heroes` | Shop page heroes | `women-hero`, `men-hero`, `unisex-hero` |

## File Structure

When images are uploaded, they're stored as:
```
site-images/
├── landing-hero/
│   ├── hero-left.jpg
│   ├── hero-center.jpg
│   └── hero-right.jpg
├── collection-heroes/
│   ├── women-hero.jpg
│   ├── men-hero.jpg
│   └── unisex-hero.jpg
└── ...
```

## Troubleshooting

### Images not loading?
1. Check the bucket is set to **Public**
2. Verify the storage policies are created
3. Check the browser console for CORS or 403 errors

### Upload failing?
1. Make sure you're logged in as an admin user
2. Check that the authenticated user policies are in place
3. Verify the file size is under 50MB (Supabase default limit)

### Wrong image showing?
The cache control is set to 1 hour. You can:
1. Wait for cache to expire
2. Add a cache-busting query param to the URL
3. Clear your browser cache


