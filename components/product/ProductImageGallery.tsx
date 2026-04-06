"use client";

import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/types/product";
import { fileToBase64 } from "@/lib/utils/product";

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
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    const newImages: ProductImage[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const base64 = await fileToBase64(files[i]);
        newImages.push({
          url: base64,
          altText: files[i].name,
          position: images.length + i,
        });
      } catch {
        // Silent fail
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
              <img
                src={img.url}
                alt={img.altText || `Product image ${index + 1}`}
                className="w-full h-full object-cover"
              />
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
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(index)}
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