"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/types/product";
import { uploadToCloudinary } from "@/lib/utils/cloudinary";

interface ProductImageGalleryProps {
  images: ProductImage[];
  onUpload: (images: ProductImage[]) => void;
  onRemove: (index: number) => void;
}

export default function ProductImageGallery({
  images,
  onUpload,
  onRemove,
}: ProductImageGalleryProps) {
  const [uploadingIndices, setUploadingIndices] = useState<Set<number>>(new Set());

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    const newImages: ProductImage[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const imageIndex = images.length + i;
      
      try {
        // Mark as uploading
        setUploadingIndices(prev => new Set(prev).add(imageIndex));
        
        // Upload to Cloudinary
        const cloudinaryUrl = await uploadToCloudinary(file);
        
        newImages.push({
          url: cloudinaryUrl,
          altText: file.name,
          position: imageIndex,
        });
      } catch {
        // Silent fail - could add toast notification here
      } finally {
        // Remove from uploading set
        setUploadingIndices(prev => {
          const next = new Set(prev);
          next.delete(imageIndex);
          return next;
        });
      }
    }

    onUpload([...images, ...newImages]);
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Product Images</h2>
        <Label
          htmlFor="image-upload"
          className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Images
        </Label>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>

      {images.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No images added yet. Click &ldquo;Add Images&ldquo; to upload.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {images.map((img, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative group"
          >
            <div className="aspect-square bg-muted rounded-lg overflow-hidden border">
              {uploadingIndices.has(index) ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <img
                  src={img.url}
                  alt={img.altText || `Product image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="mt-2 space-y-2">
              <Input
                placeholder="Alt text (optional)"
                value={img.altText || ""}
                onChange={(e) => {
                  const updated = [...images];
                  updated[index] = { ...updated[index], altText: e.target.value };
                  onUpload(updated);
                }}
                className="text-xs"
                disabled={uploadingIndices.has(index)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(index)}
                disabled={uploadingIndices.has(index)}
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}