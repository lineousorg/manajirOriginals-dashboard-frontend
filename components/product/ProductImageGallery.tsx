"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/types/product";
import { uploadToCloudinary } from "@/lib/utils/cloudinary";

interface UploadingImage {
  url: string;
  altText: string;
  position: number;
  localPreviewUrl: string;
  isUploading: boolean;
  uploadError?: string;
}

interface ProductImageGalleryProps {
  images: ProductImage[];
  onUpload: (images: ProductImage[]) => void;
  onRemove: (index: number, imageId?: number) => void;
  deletingImageId?: number | null;
}

export default function ProductImageGallery({
  images,
  onUpload,
  onRemove,
  deletingImageId,
}: ProductImageGalleryProps) {
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
  const objectUrlRef = useRef<Map<string, File>>(new Map());

  // Combine existing images with uploading images for display
  const displayImages = useMemo(() => {
    return [...images, ...uploadingImages] as (ProductImage | UploadingImage)[];
  }, [images, uploadingImages]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    const newUploadingImages: UploadingImage[] = [];
    const startIndex = images.length + uploadingImages.length;

    // Create local previews immediately for all selected files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const imageIndex = startIndex + i;

      // Create local preview URL
      const localPreviewUrl = URL.createObjectURL(file);
      objectUrlRef.current.set(localPreviewUrl, file);

      newUploadingImages.push({
        url: localPreviewUrl,
        altText: file.name,
        position: imageIndex,
        localPreviewUrl,
        isUploading: true,
      });
    }

    // Add all new images to uploading state immediately (instant UI feedback)
    setUploadingImages(prev => [...prev, ...newUploadingImages]);

    // Upload each image sequentially and collect successful ones
    const completedImages: ProductImage[] = [];
    
    for (let i = 0; i < newUploadingImages.length; i++) {
      const uploadingImg = newUploadingImages[i];
      const file = objectUrlRef.current.get(uploadingImg.localPreviewUrl!);

      if (!file) continue;

      try {
        const cloudinaryResponse = await uploadToCloudinary(file);

        // Upload successful - add to completed list with publicId
        completedImages.push({
          url: cloudinaryResponse.secure_url,
          publicId: cloudinaryResponse.public_id,
          altText: uploadingImg.altText,
          position: uploadingImg.position,
        });
      } catch (error) {
        // Upload failed - mark with error
        setUploadingImages(prev =>
          prev.map(img =>
            img === uploadingImg
              ? { ...img, isUploading: false, uploadError: "Upload failed" }
              : img
          )
        );
      } finally {
        // Clean up object URL
        if (uploadingImg.localPreviewUrl) {
          objectUrlRef.current.delete(uploadingImg.localPreviewUrl);
        }
      }
    }

    // Remove all successfully uploaded images from uploading state
    if (completedImages.length > 0) {
      setUploadingImages(prev =>
        prev.filter(img => !completedImages.some(completed => 
          completed.position === img.position
        ))
      );
    }

    // Notify parent of all completed images appended to existing ones
    if (completedImages.length > 0) {
      onUpload([...images, ...completedImages]);
    }

    e.target.value = "";
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      objectUrlRef.current.forEach((_, url) => {
        URL.revokeObjectURL(url);
      });
      objectUrlRef.current.clear();
    };
  }, []);

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

      {displayImages.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No images added yet. Click &ldquo;Add Images&ldquo; to upload.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {displayImages.map((img, index) => {
          const isUploading = 'isUploading' in img && img.isUploading;
          const uploadError = 'uploadError' in img && img.uploadError;
          const localPreviewUrl = 'localPreviewUrl' in img ? img.localPreviewUrl : undefined;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative group"
            >
              <div className="aspect-square bg-muted rounded-lg overflow-hidden border">
                {isUploading ? (
                  <div className="w-full h-full flex items-center justify-center relative">
                    <img
                      src={localPreviewUrl || img.url}
                      alt={img.altText || `Product image ${index + 1}`}
                      className="w-full h-full object-cover opacity-50"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  </div>
                ) : uploadError ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-destructive/10">
                    <X className="w-8 h-8 text-destructive mb-2" />
                    <p className="text-xs text-destructive text-center px-2">
                      Upload failed
                    </p>
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
                    if (isUploading) return;
                    const newAltText = e.target.value;
                    // Update altText for this existing image
                    const updated = images.map((item, idx) =>
                      idx === index ? { ...item, altText: newAltText } : item
                    );
                    onUpload(updated);
                  }}
                  className="text-xs"
                  disabled={isUploading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (isUploading) return;
                    // Only allow removal of existing images (not uploading ones)
                    if (index < images.length) {
                      onRemove(index);
                    }
                  }}
                  disabled={isUploading}
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
