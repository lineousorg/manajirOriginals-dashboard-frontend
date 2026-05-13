# Cloudinary Image Deletion - Implementation Guide

## Frontend Changes Completed ✅

The following frontend files have been updated to support Cloudinary image deletion:

### 1. types/product.ts
Added `publicId` field to `ProductImage` interface:
```typescript
export interface ProductImage {
  id?: number;
  url: string;
  publicId?: string; // ← Added
  altText: string;
  position: number;
}
```

### 2. lib/utils/cloudinary.ts
Changed return type from `string` to `CloudinaryUploadResponse`:
```typescript
export const uploadToCloudinary = async (file: File): Promise<CloudinaryUploadResponse> => {
  // ... returns full response with public_id
  return await response.json();
};
```

### 3. components/product/ProductImageGallery.tsx
Updated to capture `publicId` from upload response:
```typescript
const cloudinaryResponse = await uploadToCloudinary(file);
completedImages.push({
  url: cloudinaryResponse.secure_url,
  publicId: cloudinaryResponse.public_id, // ← Added
  altText: uploadingImg.altText,
  position: uploadingImg.position,
});
```

### 4. lib/schemas/product.ts
Updated image schema to include `publicId`:
```typescript
images: z.array(
  z.object({
    id: z.number().optional(),
    url: z.string().min(1, "Image URL is required"),
    publicId: z.string().optional(), // ← Added
    altText: z.string().optional(),
    position: z.number(),
  })
).optional(),
```

### 5. app/admin/products/add_product/page.tsx
- Updated local `imageSchema` to include `publicId`
- Updated image mapping when creating product to include `publicId`
- Updated `handleImageUpload` to capture `publicId` from Cloudinary response

### 6. app/admin/products/edit_product/[id]/page.tsx
Updated both `images` prop mapping and `onRemove` handler to preserve `publicId` field.

---

## Backend Implementation Required

Your frontend now sends `publicId` with every image. To complete the deletion functionality, you need to:

### 1. Database Migration
Add a `publicId` column/field to your images table/collection (if storing as JSON array in products table, ensure the schema includes it).

### 2. Create Delete Endpoint
Create a backend endpoint (e.g., `DELETE /api/products/:productId/images/:imageId`) that:

```javascript
// Pseudo-code
router.delete('/products/:productId/images/:imageId', async (req, res) => {
  // 1. Find product by ID
  const product = await Product.findById(req.params.productId);
  
  // 2. Find image in product.images array by imageId
  const image = product.images.find(img => img.id === parseInt(req.params.imageId));
  
  // 3. Delete from Cloudinary using image.publicId
  if (image.publicId) {
    await cloudinary.uploader.destroy(image.publicId);
  }
  
  // 4. Remove image from database
  product.images = product.images.filter(img => img.id !== parseInt(req.params.imageId));
  await product.save();
  
  res.json({ success: true });
});
```

### 3. Update Frontend Delete Call
In `ProductImageGallery.tsx` (or wherever you handle image removal), call this endpoint:
```typescript
const handleRemove = async (imageId: number, productId: number) => {
  await fetch(`/api/products/${productId}/images/${imageId}`, {
    method: 'DELETE',
  });
  onRemove(index); // Update UI
};
```

---

## How It Works

1. **Upload**: Cloudinary returns `{ public_id, secure_url, ... }` → Frontend stores both `url` and `publicId` → Sent to backend → Backend saves both in DB

2. **Delete**: Frontend sends `productId` + `imageId` → Backend looks up image's `publicId` → Deletes from Cloudinary → Removes from DB → Returns success

3. **One request** from frontend triggers both Cloudinary and database deletion atomically.

---

## Testing Checklist

- [ ] Upload new product with images → Verify `publicId` is saved in database
- [ ] Edit existing product → Verify `publicId` persists
- [ ] Delete an image → Verify it's removed from Cloudinary dashboard and database
- [ ] Check that images without `publicId` (old images) are handled gracefully (skip Cloudinary deletion or migrate)
