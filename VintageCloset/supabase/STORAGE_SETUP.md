# Supabase Storage Setup for Vintage Closet

This guide explains how to set up the storage buckets needed for the Vintage Closet application.

---

## Required Buckets

### 1. Product Images Bucket

**Bucket Name:** `product-images`

#### Create the Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Enter the following settings:
   - **Name:** `product-images`
   - **Public bucket:** ✅ Enabled (so images can be displayed without authentication)
   - **Allowed MIME types:** `image/jpeg, image/png, image/webp, image/gif`
   - **File size limit:** `5242880` (5MB)

#### Folder Structure

```
product-images/
├── {product-id}/
│   ├── 0.jpg    (main image - shown in grid)
│   ├── 1.jpg    (additional image)
│   ├── 2.jpg    (additional image)
│   └── ...
```

**Example:**
```
product-images/
├── 550e8400-e29b-41d4-a716-446655440000/
│   ├── 0.jpg
│   ├── 1.jpg
│   └── 2.jpg
├── 6ba7b810-9dad-11d1-80b4-00c04fd430c8/
│   ├── 0.jpg
│   └── 1.jpg
```

#### Storage Policies

Run this SQL in the Supabase SQL Editor:

```sql
-- Drop existing policies if they exist (safe to run multiple times)
DROP POLICY IF EXISTS "Product images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;

-- Allow public read access to product images
CREATE POLICY "Product images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Allow authenticated users to upload product images
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update product images
CREATE POLICY "Authenticated users can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete product images
CREATE POLICY "Authenticated users can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);
```

---

## Getting Image URLs

### Public URL Format

```
https://{project-ref}.supabase.co/storage/v1/object/public/product-images/{product-id}/{filename}
```

**Example:**
```
https://abcdefghijklmnop.supabase.co/storage/v1/object/public/product-images/550e8400-e29b-41d4-a716-446655440000/0.jpg
```

### Using Supabase Client

```typescript
import { supabase } from '@/lib/supabase';

// Get public URL for an image
const { data } = supabase.storage
  .from('product-images')
  .getPublicUrl(`${productId}/0.jpg`);

console.log(data.publicUrl);
```

---

## Uploading Images

### From Admin Panel (Client-side)

```typescript
import { supabase } from '@/lib/supabase';

async function uploadProductImage(
  productId: string, 
  file: File, 
  index: number
): Promise<string | null> {
  const fileExt = file.name.split('.').pop();
  const filePath = `${productId}/${index}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true, // Replace if exists
    });

  if (error) {
    console.error('Upload error:', error);
    return null;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}
```

### Deleting Images

```typescript
async function deleteProductImages(productId: string): Promise<void> {
  const { data: files } = await supabase.storage
    .from('product-images')
    .list(productId);

  if (files && files.length > 0) {
    const filePaths = files.map(file => `${productId}/${file.name}`);
    await supabase.storage
      .from('product-images')
      .remove(filePaths);
  }
}
```

---

## Image Optimization Tips

1. **Resize before upload:** Resize images to max 1200px width on the client before uploading
2. **Use WebP format:** Convert to WebP for better compression
3. **Lazy loading:** Use Next.js Image component with `loading="lazy"`
4. **Cache headers:** Set appropriate cache-control headers (already configured above)

### Recommended Image Sizes

| Use Case | Max Width | Quality |
|----------|-----------|---------|
| Product grid thumbnail | 600px | 80% |
| Product detail main | 1200px | 85% |
| Product detail gallery | 800px | 80% |

---

## Environment Variables

Add these to your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Where to find these:**
1. Go to Supabase Dashboard → Settings → API
2. Copy the **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
3. Copy the **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Copy the **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

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

