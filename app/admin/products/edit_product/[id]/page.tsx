"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, ArrowLeft, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { PageTransition, FadeIn } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormSkeleton } from "@/components/ui/skeleton-card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useProduct } from "@/hooks/useProduct";
import { useCategories } from "@/hooks/useCategories";
import { useAttributes } from "@/hooks/useAttributes";
import { useAttributeValues } from "@/hooks/useAttributeValues";
import { productsApi } from "@/services/api";
import {
  productSchema,
  ProductFormData,
  INITIAL_FORM,
} from "@/lib/schemas/product";
import { transformVariantAttributes } from "@/lib/utils/product";
import VariantCard from "@/components/product/VariantCard";
import ProductImageGallery from "@/components/product/ProductImageGallery";

// Helper function to generate SKU based on product name and variant attributes
const generateSKU = (
  productName: string,
  attributes: Array<{ attributeId: number; valueId: number }>,
  attributeValues: Array<{ id: number; value: string; attributeId: number }>,
  variantIndex: number,
): string => {
  // Convert product name to uppercase without spaces, limit to first 5 characters
  const words = productName
    .toUpperCase()
    .replace(/[^A-Z\s-]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "";

  const initials = words.map((word) => word[0]).join("");

  const lastWordConsonants = words[words.length - 1]
    .slice(1)
    .replace(/[AEIOU]/g, "");

  const nameSku = initials + lastWordConsonants;

  // Get attribute values from the actual data
  const attrValueMap: Record<number, string> = {};
  attributeValues.forEach((av) => {
    // Get first 3 characters of value, uppercase
    attrValueMap[av.id] = av.value.substring(0, 3).toUpperCase();
  });

  // Build SKU with attribute values
  const attrCodes = attributes
    .map((a) => attrValueMap[a.valueId] || "")
    .filter(Boolean);

  // Format: NAME-ATTR1-ATTR2-VARIANTNUM (e.g., TSHIRT-RED-BLK-1)
  return `${nameSku}-${attrCodes.join("-")}-${variantIndex + 1}`.toUpperCase();
};

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const router = useRouter();

  const {
    product,
    isLoading: isLoadingProduct,
    error,
    setProduct,
  } = useProduct(id);
  const { categories, isLoading: isLoadingCategories } = useCategories();
  const { attributes } = useAttributes();
  const { attributeValues } = useAttributeValues();
  const { toast } = useToast();

  const [togglingVariantId, setTogglingVariantId] = useState<number | null>(
    null,
  );
  const [deletingVariantId, setDeletingVariantId] = useState<number | null>(
    null,
  );
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [initialized, setInitialized] = useState(false);
  const [originalData, setOriginalData] = useState<{
    name: string;
    description: string;
    categoryId: number;
    isActive: boolean;
    variants: Array<{ id?: number; sku: string; price: number; stock: number }>;
    images: Array<{
      id?: number;
      url: string;
      altText: string;
      position: number;
    }>;
  } | null>(null);

  // Filter active variants once - used throughout the component
  const activeVariants = product?.variants.filter((v) => !v.isDeleted) || [];

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: INITIAL_FORM as unknown as ProductFormData,
  });

  // Wait for product and categories data before form initialization
  const isReady = product && categories.length > 0;

  // DEBUG: Log category-related variables when product changes
  useEffect(() => {
    if (product) {
      const effectiveCategoryId = product.categoryId ?? product.category?.id;
      console.log("=== CATEGORY DEBUG INFO ===");
      console.log(
        "product.categoryId (from API):",
        product.categoryId,
        "- Type:",
        typeof product.categoryId,
      );
      console.log("product.category.id (nested):", product.category?.id);
      console.log("EFFECTIVE categoryId (used for form):", effectiveCategoryId);
      console.log("product.category (nested object):", product.category);
      console.log("product.category.name:", product.category?.name);
    }
  }, [product]);

  useEffect(() => {
    if (!initialized && isReady) {
      reset({
        name: product.name,
        description: product.description,
        categoryId: product.categoryId ?? product.category?.id, // Fix: Use nested category.id if categoryId is undefined
        isActive: product.isActive,
        variants: activeVariants.map((v) => ({
          id: v.id,
          sku: v.sku || "",
          price: Number(v.price) || 0,
          stock: v.stock,
          attributes: transformVariantAttributes(v),
        })),
        images: product.images || [],
      });
      // Store original data for dirty checking
      setOriginalData({
        name: product.name,
        description: product.description,
        categoryId: product.categoryId ?? product.category?.id, // Fix: Use nested category.id if categoryId is undefined
        isActive: product.isActive,
        variants: activeVariants.map((v) => ({
          id: v.id,
          sku: v.sku || "",
          price: Number(v.price) || 0,
          stock: v.stock,
        })),
        images:
          product.images
            ?.filter((img) => img.url?.trim())
            .map((img, index) => ({
              id: img.id,
              url: img.url,
              altText: img.altText || "",
              position: index,
            })) || [],
      });
      setInitialized(true);
    }
  }, [isReady, product, categories, reset, initialized]);

  const handleToggleVariantActive = useCallback(
    async (variantId: number) => {
      setTogglingVariantId(variantId);
      try {
        const updated = await productsApi.toggleVariantActive(id, variantId);
        setProduct(updated);
        const variant = updated.variants.find((v) => v.id === variantId);
        toast({
          title: variant?.isActive
            ? "Variant activated"
            : "Variant deactivated",
          description: "Variant status updated.",
        });
      } catch {
        toast({
          title: "Error",
          description: "Failed to toggle variant status.",
          variant: "destructive",
        });
      } finally {
        setTogglingVariantId(null);
      }
    },
    [id, setProduct, toast],
  );

  const handleVariantRemove = useCallback(
    async (index: number) => {
      const current = watch("variants") || [];
      const variantToDelete = current[index];

      // If this variant has an ID, it exists in the backend - delete it
      if (variantToDelete?.id) {
        setDeletingVariantId(variantToDelete.id);
        try {
          await productsApi.deleteVariant(id, variantToDelete.id);
          const updated = await productsApi.getById(id);
          setProduct(updated);

          // Reset form with updated product data
          const updatedActiveVariants = updated.variants.filter(
            (v) => !v.isDeleted,
          );
          reset({
            name: updated.name,
            description: updated.description,
            categoryId: updated.categoryId ?? updated.category?.id,
            isActive: updated.isActive,
            variants: updatedActiveVariants.map((v) => ({
              id: v.id,
              sku: v.sku || "",
              price: Number(v.price) || 0,
              stock: v.stock,
              attributes: transformVariantAttributes(v),
            })),
            images: updated.images || [],
          });

          // Update original data
          setOriginalData({
            name: updated.name,
            description: updated.description,
            categoryId: updated.categoryId ?? updated.category?.id,
            isActive: updated.isActive,
            variants: updatedActiveVariants.map((v) => ({
              id: v.id,
              sku: v.sku,
              price: Number(v.price) || 0,
              stock: v.stock,
            })),
            images:
              updated.images
                ?.filter((img) => img.url?.trim())
                .map((img, index) => ({
                  id: img.id,
                  url: img.url,
                  altText: img.altText || "",
                  position: index,
                })) || [],
          });

          toast({
            title: "Variant deleted",
            description: "The variant has been removed.",
          });
        } catch {
          toast({
            title: "Error",
            description: "Failed to delete variant.",
            variant: "destructive",
          });
        } finally {
          setDeletingVariantId(null);
        }
      } else {
        // New variant (not saved yet) - just remove from local form state
        if (current.length > 1) {
          const updated = current.filter((_, i) => i !== index);
          setValue("variants", updated);
        }
      }
    },
    [id, watch, setValue, setProduct, toast, reset, setOriginalData],
  );

  const onSubmit = useCallback(
    async (data: ProductFormData) => {
      if (!id || !originalData) return;

      try {
        // Build update payload with only changed fields
        const updateFields: Record<string, unknown> = {};

        // Check if name changed
        if (data.name !== originalData.name) {
          updateFields.name = data.name;
        }

        // Check if description changed
        if (data.description !== originalData.description) {
          updateFields.description = data.description;
        }

        // Check if category changed
        if (data.categoryId !== originalData.categoryId) {
          updateFields.categoryId = data.categoryId;
        }

        // Check if isActive changed
        if (data.isActive !== originalData.isActive) {
          updateFields.isActive = data.isActive;
        }

        // Check if variants changed - only include changed variants with IDs
        const changedVariants = data.variants
          .map((v, i) => {
            const original = originalData.variants[i];

            // Handle new variants (no id in originalData)
            if (!original) {
              // This is a new variant - include it in the payload
              return {
                sku: v.sku,
                price: v.price,
                stock: v.stock,
                attributes: v.attributes || [],
              };
            }

            const hasChanged =
              v.sku !== original.sku ||
              v.price !== original.price ||
              v.stock !== original.stock;

            if (!hasChanged) return null;

            // Build variant payload - include id if available
            const variantPayload: Record<string, unknown> = {};
            if (original.id) variantPayload.id = original.id;
            variantPayload.sku = v.sku;
            variantPayload.price = v.price;
            variantPayload.stock = v.stock;

            return variantPayload;
          })
          .filter(Boolean);

        if (changedVariants.length > 0) {
          updateFields.variants = changedVariants;
        }

        // Check if images changed
        const currentImages =
          data.images
            ?.filter((img) => img.url?.trim())
            ?.map((img, index) => {
              const original = originalData.images[index];
              const hasChanged =
                img.url !== original?.url || img.altText !== original?.altText;

              if (!hasChanged && original?.id) return null;

              // Build image payload - include id if available
              const imagePayload: Record<string, unknown> = {};
              if (original?.id) imagePayload.id = original.id;
              imagePayload.url = img.url;
              if (img.altText) imagePayload.altText = img.altText;
              imagePayload.position = index;

              return imagePayload;
            })
            .filter(Boolean) || [];

        if (currentImages.length > 0) {
          updateFields.images = currentImages;
        }

        // Don't send request if nothing changed
        if (Object.keys(updateFields).length === 0) {
          toast({
            title: "No changes",
            description: "No fields were modified.",
          });
          return;
        }

        await productsApi.update(
          id,
          updateFields as unknown as import("@/types/product").UpdateProductInput,
        );
        toast({
          title: "Product updated",
          description: `${data.name} has been updated successfully.`,
        });
        router.push("/admin/products");
      } catch {
        toast({
          title: "Error",
          description: "Failed to update product.",
          variant: "destructive",
        });
      }
    },
    [id, router, toast, originalData],
  );

  const handleVariantAdd = () => {
    const current = watch("variants") || [];
    const productName = watch("name") || "";

    // Generate a completely empty SKU for the new variant
    const newSku = generateSKU(
      productName,
      [], // No attributes selected yet
      attributeValues,
      current.length + 1, // Use length + 1 for unique SKU
    );

    // Add new variant at the top - completely empty
    const newVariant = { sku: newSku, price: 0, stock: 0, attributes: [] };
    const newVariants = [newVariant, ...current];

    // Set the new variants array
    setValue("variants", newVariants, { shouldValidate: false });

    // Explicitly reset each field for the new variant to prevent cached data
    // Use resetField to completely clear any cached values
    setValue(`variants.0.sku`, newSku, { shouldValidate: false });
    setValue(`variants.0.price`, 0, { shouldValidate: false });
    setValue(`variants.0.stock`, 0, { shouldValidate: false });
    setValue(`variants.0.attributes`, [], { shouldValidate: false });

    // Auto-expand the new variant (index 0)
    setExpandedIndex(0);
  };

  // Loading state
  if (isLoadingProduct || !initialized || isLoadingCategories) {
    return (
      <PageTransition>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" disabled>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="space-y-2">
              <div className="h-8 w-48 bg-muted rounded animate-pulse" />
              <div className="h-4 w-64 bg-muted rounded animate-pulse" />
            </div>
          </div>
          <div className="bg-card rounded-lg border p-6 shadow-card">
            <FormSkeleton />
          </div>
        </div>
      </PageTransition>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center py-16">
          <h2 className="text-xl font-semibold mb-2">Product not found</h2>
          <p className="text-muted-foreground mb-4">
            The product you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button onClick={() => router.push("/admin/products")}>
            Back to Products
          </Button>
        </div>
      </PageTransition>
    );
  }

  const variants = watch("variants") || [];

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <FadeIn className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/admin/products")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Edit Product</h1>
              <p className="text-muted-foreground">Update {product.name}</p>
            </div>
          </div>
          {/* Active Status Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {watch("isActive") ? "Active" : "Inactive"}
            </span>
            <Switch
              checked={watch("isActive") ?? false}
              onCheckedChange={(checked) => setValue("isActive", checked)}
            />
          </div>
        </FadeIn>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Info */}
          <FadeIn delay={0.1}>
            <div className="bg-card rounded-lg border p-6 shadow-card space-y-6">
              <h2 className="text-lg font-semibold">Basic Information</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter product name"
                    {...register("name")}
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter product description"
                    rows={4}
                    {...register("description")}
                    className={errors.description ? "border-destructive" : ""}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">
                      {errors.description.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Category</Label>
                  {/* DEBUG: Log categories and product.categoryId in render */}
                  <div
                    dangerouslySetInnerHTML={{
                      __html: (function () {
                        console.log("RENDER - categories:", categories);
                        console.log(
                          "RENDER - effective categoryId:",
                          product?.categoryId ?? product?.category?.id,
                          "product.categoryId:",
                          product?.categoryId,
                          "product.category.id:",
                          product?.category?.id,
                        );
                        return "";
                      })(),
                    }}
                  />
                  <select
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    {...register("categoryId", {
                      setValueAs: (v) => (v === "" ? undefined : Number(v)),
                    })}
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                    {/* Show current category if not in list */}
                    {(product?.categoryId ?? product?.category?.id) &&
                      !categories.find(
                        (c) =>
                          c.id === (product.categoryId ?? product.category?.id),
                      ) && (
                        <option
                          value={product.categoryId ?? product.category?.id}
                        >
                          {product.category.name} (Current)
                        </option>
                      )}
                  </select>
                  {errors.categoryId && (
                    <p className="text-sm text-destructive">
                      {errors.categoryId.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Variants */}
          <FadeIn delay={0.2}>
            <div className="bg-card rounded-lg border p-6 shadow-card space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Product Variants</h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleVariantAdd}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Variant
                </Button>
              </div>
              {errors.variants?.root && (
                <p className="text-sm text-destructive">
                  {errors.variants.root.message}
                </p>
              )}

              <div className="space-y-4">
                {variants.map((variant, index) => (
                  <VariantCard
                    key={index}
                    index={index}
                    variant={variant}
                    backendVariant={
                      variant.id
                        ? activeVariants.find((av) => av.id === variant.id)
                        : undefined
                    }
                    attributes={attributes}
                    attributeValues={attributeValues}
                    isExpanded={expandedIndex === index}
                    onToggleExpand={() =>
                      setExpandedIndex(expandedIndex === index ? null : index)
                    }
                    onRemove={() => handleVariantRemove(index)}
                    onToggleActive={
                      variant.id
                        ? () => handleToggleVariantActive(Number(variant?.id))
                        : undefined
                    }
                    isToggling={
                      variant.id ? togglingVariantId === variant.id : false
                    }
                    isDeleting={
                      variant.id ? deletingVariantId === variant.id : false
                    }
                    register={register}
                    control={control}
                    watch={watch}
                    setValue={setValue}
                    errors={errors}
                    productName={watch("name")}
                  />
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Images */}
          <FadeIn delay={0.3}>
            <div className="bg-card rounded-lg border p-6 shadow-card">
              <ProductImageGallery
                images={(watch("images") || []).map((img, idx) => ({
                  url: img.url,
                  altText: img.altText || "",
                  position:
                    typeof img.position === "number" ? img.position : idx,
                }))}
                onUpload={(imgs) => setValue("images", imgs)}
                onRemove={(idx) => {
                  const current = watch("images") || [];
                  const filtered = current.filter((_, i) => i !== idx);
                  setValue(
                    "images",
                    filtered.map((img, i) => ({
                      url: img.url,
                      altText: img.altText || "",
                      position: i,
                    })),
                  );
                }}
              />
            </div>
          </FadeIn>

          {/* Actions */}
          <FadeIn delay={0.4} className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/products")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </FadeIn>
        </form>
      </div>
    </PageTransition>
  );
}
