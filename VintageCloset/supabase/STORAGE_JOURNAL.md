# Supabase Storage Setup for Journal Images

This guide explains how to set up the storage bucket for journal article images.

---

## Required Bucket

### Journal Images Bucket

**Bucket Name:** `journal-images`

#### Create the Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Enter the following settings:
   - **Name:** `journal-images`
   - **Public bucket:** ✅ Enabled (so images can be displayed without authentication)
   - **Allowed MIME types:** `image/jpeg, image/png, image/webp, image/gif`
   - **File size limit:** `5242880` (5MB)

#### Folder Structure

```
journal-images/
├── {article-id}/
│   ├── cover.jpg    (main cover image)
│   ├── 1.jpg        (additional image)
│   ├── 2.jpg        (additional image)
│   └── ...
```

**Example:**
```
journal-images/
├── 550e8400-e29b-41d4-a716-446655440000/
│   ├── cover.jpg
│   ├── 1.jpg
│   └── 2.jpg
├── 6ba7b810-9dad-11d1-80b4-00c04fd430c8/
│   └── cover.jpg
```

#### Storage Policies

Run this SQL in the Supabase SQL Editor:

```sql
-- Drop existing policies if they exist (safe to run multiple times)
DROP POLICY IF EXISTS "Journal images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload journal images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update journal images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete journal images" ON storage.objects;

-- Allow public read access to journal images
CREATE POLICY "Journal images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'journal-images');

-- Allow authenticated users to upload journal images
CREATE POLICY "Authenticated users can upload journal images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'journal-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update journal images
CREATE POLICY "Authenticated users can update journal images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'journal-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete journal images
CREATE POLICY "Authenticated users can delete journal images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'journal-images' 
  AND auth.role() = 'authenticated'
);
```

---

## Getting Image URLs

### Public URL Format

```
https://{project-ref}.supabase.co/storage/v1/object/public/journal-images/{article-id}/{filename}
```

**Example:**
```
https://abcdefghijklmnop.supabase.co/storage/v1/object/public/journal-images/550e8400-e29b-41d4-a716-446655440000/cover.jpg
```

### Using Supabase Client

```typescript
import { supabase } from '@/lib/supabase';

// Get public URL for a cover image
const { data } = supabase.storage
  .from('journal-images')
  .getPublicUrl(`${articleId}/cover.jpg`);

console.log(data.publicUrl);
```

---

## Uploading Images

### Upload Cover Image

```typescript
import { supabase } from '@/lib/supabase';

async function uploadJournalCoverImage(
  articleId: string, 
  file: File
): Promise<string | null> {
  const fileExt = file.name.split('.').pop();
  const filePath = `${articleId}/cover.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('journal-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.error('Upload error:', error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from('journal-images')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}
```

### Upload Additional Images

```typescript
async function uploadJournalImage(
  articleId: string, 
  file: File, 
  index: number
): Promise<string | null> {
  const fileExt = file.name.split('.').pop();
  const filePath = `${articleId}/${index}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('journal-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.error('Upload error:', error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from('journal-images')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}
```

### Delete Article Images

```typescript
async function deleteJournalImages(articleId: string): Promise<void> {
  const { data: files } = await supabase.storage
    .from('journal-images')
    .list(articleId);

  if (files && files.length > 0) {
    const filePaths = files.map(file => `${articleId}/${file.name}`);
    await supabase.storage
      .from('journal-images')
      .remove(filePaths);
  }
}
```

---

## Image Optimization Tips

1. **Resize before upload:** Resize cover images to max 1600px width
2. **Use WebP format:** Convert to WebP for better compression
3. **Lazy loading:** Use Next.js Image component with `loading="lazy"`

### Recommended Image Sizes

| Use Case | Max Width | Quality |
|----------|-----------|---------|
| Cover image (card) | 800px | 80% |
| Cover image (hero) | 1600px | 85% |
| In-article images | 1200px | 80% |

---

## Troubleshooting

### Images not loading?
- Check if the bucket is set to **public**
- Verify the storage policies are applied
- Check the URL format is correct

### Upload failing?
- Verify the file size is under 5MB
- Check the MIME type is allowed
- Ensure the user is authenticated (for admin uploads)

### CORS issues?
- Go to Storage → Settings → add your domain to allowed origins

