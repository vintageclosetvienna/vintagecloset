# Supabase Storage Setup - Site Images

This document outlines the necessary steps to set up a Supabase Storage bucket for site images in your Vintage Closet application.

## 1. Create the `site-images` Bucket

1. **Navigate to Storage:** In your Supabase project dashboard, go to the "Storage" section.
2. **Create New Bucket:** Click on "New bucket".
3. **Bucket Name:** Enter `site-images`.
4. **Public Access:** Ensure "Public bucket" is **checked**. This allows images to be directly accessible via URL without authentication.
5. **Create Bucket:** Click "Create bucket".

## 2. Set Up Storage Policies

Even if the bucket is public, you need to add policies for upload/delete operations.

### 2.1 Select Policy

1. **Select `site-images` bucket:** Click on the `site-images` bucket you just created.
2. **Go to Policies:** Click on the "Policies" tab.

### 2.2 Create SELECT Policy (Public Read)

1. **Create a new policy:**
   - **Policy Name:** `Public read access`
   - **For operations:** `SELECT`
   - **Using a custom condition:** `true`
   - Click "Review" and then "Save policy".

### 2.3 Create INSERT Policy (Authenticated Upload)

1. **Create a new policy:**
   - **Policy Name:** `Allow authenticated uploads`
   - **For operations:** `INSERT`
   - **Using a custom condition:** `(bucket_id = 'site-images' AND auth.role() = 'authenticated')`
   - Click "Review" and then "Save policy".

### 2.4 Create UPDATE Policy (Authenticated Update)

1. **Create another policy:**
   - **Policy Name:** `Allow authenticated updates`
   - **For operations:** `UPDATE`
   - **Using a custom condition:** `(bucket_id = 'site-images' AND auth.role() = 'authenticated')`
   - Click "Review" and then "Save policy".

### 2.5 Create DELETE Policy (Authenticated Delete)

1. **Create another policy:**
   - **Policy Name:** `Allow authenticated deletes`
   - **For operations:** `DELETE`
   - **Using a custom condition:** `(bucket_id = 'site-images' AND auth.role() = 'authenticated')`
   - Click "Review" and then "Save policy".

## 3. Folder Structure within the Bucket

We recommend organizing images by section:

```
site-images/
├── landing-hero/
│   ├── hero-left.jpg
│   ├── hero-center.jpg
│   └── hero-right.jpg
├── media-carousel/
│   ├── carousel-1.jpg
│   ├── carousel-2.jpg
│   ├── carousel-3.jpg
│   └── carousel-4.jpg
├── collection-highlights/
│   ├── highlight-women.jpg
│   ├── highlight-men.jpg
│   └── highlight-unisex.jpg
├── story-slides/
│   ├── story-1.jpg
│   ├── story-2.jpg
│   └── story-3.jpg
└── collection-heroes/
    ├── women-hero.jpg
    ├── men-hero.jpg
    └── unisex-hero.jpg
```

## 4. Image Keys Reference

| Key | Section | Location |
|-----|---------|----------|
| `hero-left` | `landing-hero` | Landing page hero - back left image |
| `hero-center` | `landing-hero` | Landing page hero - front center image |
| `hero-right` | `landing-hero` | Landing page hero - back right image |
| `carousel-1` | `media-carousel` | Media carousel - slide 1 |
| `carousel-2` | `media-carousel` | Media carousel - slide 2 |
| `carousel-3` | `media-carousel` | Media carousel - slide 3 |
| `carousel-4` | `media-carousel` | Media carousel - slide 4 |
| `highlight-women` | `collection-highlights` | Landing page - Women collection card |
| `highlight-men` | `collection-highlights` | Landing page - Men collection card |
| `highlight-unisex` | `collection-highlights` | Landing page - Unisex collection card |
| `story-1` | `story-slides` | "Born from Archive" - slide 1 |
| `story-2` | `story-slides` | "Born from Archive" - slide 2 |
| `story-3` | `story-slides` | "Born from Archive" - slide 3 |
| `women-hero` | `collection-heroes` | /women page hero background |
| `men-hero` | `collection-heroes` | /men page hero background |
| `unisex-hero` | `collection-heroes` | /unisex page hero background |

## 5. Example Code for Image Upload/Deletion

This is handled within `src/lib/site-images.ts`, but for reference:

### Uploading an Image:

```typescript
import { supabase } from './supabase';

async function uploadSiteImage(key: string, section: string, file: File) {
  const fileExt = file.name.split('.').pop() || 'jpg';
  const filePath = `${section}/${key}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('site-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true, // Overwrite if exists
    });

  if (error) {
    console.error('Error uploading image:', error);
    return null;
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from('site-images')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}
```

### Deleting an Image:

```typescript
import { supabase } from './supabase';

async function deleteSiteImage(section: string, key: string) {
  // List files to find the exact file (could have different extensions)
  const { data: files } = await supabase.storage
    .from('site-images')
    .list(section);

  const fileToDelete = files?.find(f => f.name.startsWith(key));
  
  if (fileToDelete) {
    const { error } = await supabase.storage
      .from('site-images')
      .remove([`${section}/${fileToDelete.name}`]);

    if (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }
  return true;
}
```

## 6. Recommended Image Dimensions

| Section | Recommended Size | Aspect Ratio |
|---------|-----------------|--------------|
| Landing Hero | 1200x1600 | 3:4 |
| Media Carousel | 1920x1080 | 16:9 |
| Collection Highlights | 1200x1600 | 3:4 |
| Story Slides | 1200x1600 | 3:4 |
| Collection Heroes | 1920x1080 | 16:9 |

## 7. Notes

- All images should be optimized for web (compressed JPEG/WebP)
- Maximum file size: 10MB per image
- Supported formats: JPEG, PNG, WebP
- Images are cached for 1 hour (3600 seconds)
- Use `upsert: true` when uploading to replace existing images

