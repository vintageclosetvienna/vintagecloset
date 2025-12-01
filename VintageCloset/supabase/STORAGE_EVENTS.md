# Supabase Storage Setup for Event Images

This guide explains how to set up the storage bucket for event images.

---

## Required Bucket

### Event Images Bucket

**Bucket Name:** `event-images`

#### Create the Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Enter the following settings:
   - **Name:** `event-images`
   - **Public bucket:** ✅ Enabled (so images can be displayed without authentication)
   - **Allowed MIME types:** `image/jpeg, image/png, image/webp, image/gif`
   - **File size limit:** `5242880` (5MB)

#### Folder Structure

```
event-images/
├── {event-id}/
│   └── cover.jpg    (event cover image)
```

**Example:**
```
event-images/
├── 550e8400-e29b-41d4-a716-446655440000/
│   └── cover.jpg
├── 6ba7b810-9dad-11d1-80b4-00c04fd430c8/
│   └── cover.jpg
```

#### Storage Policies

Run this SQL in the Supabase SQL Editor:

```sql
-- Allow public read access to event images
CREATE POLICY "Event images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-images');

-- Allow authenticated users to upload event images
CREATE POLICY "Authenticated users can upload event images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update event images
CREATE POLICY "Authenticated users can update event images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'event-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete event images
CREATE POLICY "Authenticated users can delete event images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'event-images' 
  AND auth.role() = 'authenticated'
);
```

---

## Getting Image URLs

### Public URL Format

```
https://{project-ref}.supabase.co/storage/v1/object/public/event-images/{event-id}/cover.jpg
```

**Example:**
```
https://abcdefghijklmnop.supabase.co/storage/v1/object/public/event-images/550e8400-e29b-41d4-a716-446655440000/cover.jpg
```

### Using Supabase Client

```typescript
import { supabase } from '@/lib/supabase';

// Get public URL for an event cover image
const { data } = supabase.storage
  .from('event-images')
  .getPublicUrl(`${eventId}/cover.jpg`);

console.log(data.publicUrl);
```

---

## Uploading Images

### Upload Event Cover Image

```typescript
import { supabase } from '@/lib/supabase';

async function uploadEventImage(
  eventId: string, 
  file: File
): Promise<string | null> {
  const fileExt = file.name.split('.').pop();
  const filePath = `${eventId}/cover.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('event-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true, // Overwrite if exists
    });

  if (error) {
    console.error('Upload error:', error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from('event-images')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}
```

### Delete Event Image

```typescript
async function deleteEventImage(eventId: string): Promise<void> {
  const { data: files } = await supabase.storage
    .from('event-images')
    .list(eventId);

  if (files && files.length > 0) {
    const filePaths = files.map(file => `${eventId}/${file.name}`);
    await supabase.storage
      .from('event-images')
      .remove(filePaths);
  }
}
```

---

## Image Optimization Tips

1. **Resize before upload:** Resize event images to max 1200px width
2. **Use WebP format:** Convert to WebP for better compression
3. **Aspect ratio:** Maintain 16:10 aspect ratio for event cards

### Recommended Image Sizes

| Use Case | Max Width | Aspect Ratio | Quality |
|----------|-----------|--------------|---------|
| Event card | 800px | 16:10 | 80% |
| Event hero | 1200px | 16:9 | 85% |

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

