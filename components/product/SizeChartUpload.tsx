"use client";

import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { productsApi } from "@/services/api";
import {
  ProductSizeChartImage,
  ProductSizeChartInput,
} from "@/types/product";
import { validateProductImageFile } from "@/lib/utils/productImageValidation";

interface SizeChartUploadProps {
  mode: "create" | "edit";
  existing?: ProductSizeChartImage | null;
  value?: ProductSizeChartInput | null;
  removed?: boolean;
  onUpload: (uploaded: ProductSizeChartInput) => void;
  onRemove?: () => void;
}

export default function SizeChartUpload({
  mode,
  existing,
  value,
  removed = false,
  onUpload,
  onRemove,
}: SizeChartUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [localAltText, setLocalAltText] = useState(
    value?.altText ?? existing?.altText ?? "",
  );

  const displayImageUrl = !removed ? value?.url ?? existing?.url : null;
  const displayAltText =
    value?.altText ?? localAltText ?? existing?.altText ?? "Size Chart";

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const validationError = validateProductImageFile(file);

    if (validationError) {
      toast.error(validationError);
      event.target.value = "";
      return;
    }

    setIsUploading(true);

    try {
      const uploaded = await productsApi.uploadProductImage(file);

      onUpload({
        url: uploaded.url,
        publicId: uploaded.publicId,
        altText: localAltText || undefined,
      });

      toast.success("Size chart uploaded successfully.");
    } catch (error) {
      console.error("Failed to upload size chart:", error);
      toast.error("Failed to upload size chart. Please try again.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleAltTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const altText = event.target.value;
    setLocalAltText(altText);

    if (value) {
      onUpload({
        ...value,
        altText: altText || undefined,
      });
    }
  };

  return (
    <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold">Size Chart</h3>
          <p className="text-sm text-muted-foreground">
            Upload one optional image. It will be stored separately from product
            images.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            id={`size-chart-upload-${mode}`}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />

          <Button
            type="button"
            variant="outline"
            onClick={handleUploadClick}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {displayImageUrl ? "Replace Size Chart" : "Upload Size Chart"}
              </>
            )}
          </Button>

          {mode === "edit" && displayImageUrl && !removed && onRemove && (
            <Button
              type="button"
              variant="destructive"
              onClick={onRemove}
              disabled={isUploading}
            >
              Remove
            </Button>
          )}
        </div>
      </div>

      {removed && (
        <p className="text-sm text-destructive">
          Size chart will be removed when you save changes.
        </p>
      )}

      {displayImageUrl ? (
        <div className="grid gap-4 md:grid-cols-[180px_1fr]">
          <div className="overflow-hidden rounded-lg border bg-white">
            <img
              src={displayImageUrl}
              alt={displayAltText}
              className="h-44 w-full object-contain"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`size-chart-alt-${mode}`}>
              Alt text (optional)
            </Label>

            <Input
              id={`size-chart-alt-${mode}`}
              value={localAltText}
              onChange={handleAltTextChange}
              placeholder="Size chart alt text"
              disabled={isUploading}
            />

            {value ? (
              <p className="text-xs text-muted-foreground">
                New size chart will replace the existing one when you save.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Existing size chart. Upload a replacement or remove it.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          {removed
            ? "Size chart is marked for removal."
            : "No size chart uploaded yet."}
        </div>
      )}
    </div>
  );
}
