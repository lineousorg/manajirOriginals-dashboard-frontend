"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
import { toast } from "@/components/ui/sonner";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";
import { useProduct } from "@/hooks/useProduct";
import { useCategories } from "@/hooks/useCategories";
import { useAttributes } from "@/hooks/useAttributes";
import { useAttributeValues } from "@/hooks/useAttributeValues";
import { useCategoryAttributes } from "@/hooks/useCategoryAttributes";
import { productsApi } from "@/services/api";
import {
  productSchema,
  ProductFormData,
  INITIAL_FORM,
} from "@/lib/schemas/product";
import {
  ProductImage,
  ProductSizeChartImage,
  ProductSizeChartInput,
  VariantAttributeForm,
} from "@/types/product";
import { transformVariantAttributes, generateSKU } from "@/lib/utils/product";
import VariantCard from "@/components/product/VariantCard";
import ProductImageGallery from "@/components/product/ProductImageGallery";
import SizeChartUpload from "@/components/product/SizeChartUpload";
import RichTextEditor from "@/components/editor/RichTextEditor";

type SizeChartEditState =
  | {
      mode: "unchanged";
    }
  | {
      mode: "replace";
      url: string;
      publicId: string;
      altText?: string | null;
    }
  | {
      mode: "remove";
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
  const { fetchCategoryAttributes } = useCategoryAttributes();

  const [togglingVariantId, setTogglingVariantId] = useState<number | null>(
    null
  );
  const [deletingVariantId, setDeletingVariantId] = useState<number | null>(
    null
  );
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [initialized, setInitialized] = useState(false);
  const [sizeChartState, setSizeChartState] = useState<SizeChartEditState>({
    mode: "unchanged",
  });

  // Refs for scrolling to error sections
  const variantCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const basicInfoRef = useRef<HTMLDivElement>(null);
  const [originalData, setOriginalData] = useState<{
    name: string;
    description: string;
    productDetailsHtml?: string;
    categoryId: number;
    isActive: boolean;
    variants: Array<{
      id?: number;
      sku: string;
      price: number;
      stock: number;
      discountType?: "PERCENTAGE" | "FIXED" | null;
      discountValue?: number | null;
      discountStart?: string | null;
      discountEnd?: string | null;
      attributes?: VariantAttributeForm[];
    }>;
    images: Array<{
      id?: number;
      url: string;
      publicId?: string;
      altText: string;
      position: number;
    }>;
    sizeChartImage?: ProductSizeChartImage | null;
  } | null>(null);

  // Filter active variants once - used throughout the component
  const activeVariants = product?.variants?.filter((v) => !v.isDeleted) || [];

  // Get the effective category slug for filtering attributes
  const effectiveCategorySlug = product?.category?.slug ?? "";
  const [categoryAttrIds, setCategoryAttrIds] = useState<number[]>([]);
  const [isFetchingCatAttrs, setIsFetchingCatAttrs] = useState(false);

  // Fetch category-scoped attributes when product category is known
  useEffect(() => {
    if (effectiveCategorySlug !== "") {
      setIsFetchingCatAttrs(true);
      fetchCategoryAttributes(effectiveCategorySlug)
        .then((catAttrs) => {
          setCategoryAttrIds(catAttrs.map((ca) => ca.attributeId));
        })
        .catch(() => {
          setCategoryAttrIds([]);
        })
        .finally(() => {
          setIsFetchingCatAttrs(false);
        });
    } else {
      setCategoryAttrIds([]);
    }
  }, [effectiveCategorySlug, fetchCategoryAttributes]);

  // Filter attributes to only show those assigned to the product's category
  const filteredAttributes =
    effectiveCategorySlug !== "" && categoryAttrIds.length > 0
      ? attributes.filter((attr) => categoryAttrIds.includes(attr.id))
      : attributes;

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: INITIAL_FORM as unknown as ProductFormData,
  });

  console.log(errors, isSubmitting);
  // Function to scroll to the first error in the form
  const scrollToFirstError = useCallback(() => {
    const variantsErrors = errors.variants;
    if (variantsErrors) {
      for (let i = 0; i < (variantsErrors as Array<unknown>).length; i++) {
        const variantError = (
          variantsErrors as Array<{
            price?: { message?: string };
            stock?: { message?: string };
            attributes?: { message?: string };
          }>
        )[i];
        if (
          variantError?.price ||
          variantError?.stock ||
          variantError?.attributes
        ) {
          setExpandedIndex(i);
          variantCardRefs.current[i]?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          return;
        }
      }
    }
    if (errors.name || errors.description || errors.categoryId) {
      basicInfoRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [errors, setExpandedIndex]);

  // Wait for product data before form initialization
  const isReady = !!product;

  // Log category-related variables when product changes (for debugging)
  useEffect(() => {
    if (product) {
      const effectiveCategorySlug = product.category?.slug ?? "";
      console.log("=== CATEGORY DEBUG INFO ===");
      console.log(
        "product.category.slug (from API):",
        product.category?.slug,
        "- Type:",
        typeof product.category?.slug
      );
      console.log(
        "EFFECTIVE categorySlug (used for form):",
        effectiveCategorySlug
      );
      console.log("product.category (nested object):", product.category);
      console.log("product.category.name:", product.category?.name);
    }
  }, [product]);

  useEffect(() => {
    if (!initialized && isReady) {
      reset({
        name: product.name,
        description: product.description,
        productDetailsHtml: product.productDetailsHtml || "",
        categoryId: product.categoryId ?? product.category?.id, // Fix: Use nested category.id if categoryId is undefined
        isActive: product.isActive,
        variants: activeVariants.map((v) => ({
          id: v.id,
          sku: v.sku || "",
          price: Number(v.price) || 0,
          stock: v.stock,
          attributes: transformVariantAttributes(v),
          discountType: v.discountType ?? null,
          discountValue: v.discountValue ?? null,
          discountStart: v.discountStart ?? null,
          discountEnd: v.discountEnd ?? null,
        })),
        images:
          product.images
            ?.filter((img) => img.url?.trim())
            .filter((img) => !img.type || img.type === "PRODUCT") || [],
      });
      // Store original data for dirty checking
      setOriginalData({
        name: product.name,
        description: product.description,
        productDetailsHtml: product.productDetailsHtml,
        categoryId: product.categoryId ?? product.category?.id, // Fix: Use nested category.id if categoryId is undefined
        isActive: product.isActive,
        variants: activeVariants.map((v) => ({
          id: v.id,
          sku: v.sku || "",
          price: Number(v.price) || 0,
          stock: v.stock,
          discountType: v.discountType ?? null,
          discountValue: v.discountValue ?? null,
          discountStart: v.discountStart ?? null,
          discountEnd: v.discountEnd ?? null,
        })),
        images:
          product.images
            ?.filter((img) => img.url?.trim())
            .filter((img) => !img.type || img.type === "PRODUCT")
            .map((img, index) => ({
              id: img.id,
              url: img.url,
              publicId: img.publicId,
              altText: img.altText || "",
              position: index,
            })) || [],
        sizeChartImage: product.sizeChartImage || null,
      });
      setInitialized(true);
    }
  }, [isReady, product, reset, initialized]);

  const handleToggleVariantActive = useCallback(
    async (variantId: number) => {
      setTogglingVariantId(variantId);
      try {
        // Toggle the variant
        await productsApi.toggleVariantActive(id, variantId);

        // Refetch the FULL product to ensure we have the complete data
        const updatedProduct = await productsApi.getById(id);
        setProduct(updatedProduct);

        const variant = updatedProduct.variants?.find(
          (v) => v.id === variantId
        );
        toast.success(
          variant?.isActive ? "Variant activated" : "Variant deactivated"
        );
      } catch {
        toast.error("Failed to toggle variant status.");
      } finally {
        setTogglingVariantId(null);
      }
    },
    [id, setProduct]
  );

  const handleVariantRemove = useCallback(
    async (index: number) => {
      const current = watch("variants") || [];
      const variantToDelete = current[index];

      // If this variant has an ID, it exists in the backend - mark for deletion
      // Actual deletion will happen on form submit
      if (variantToDelete?.id) {
        // Remove variant from form state (mark for deletion)
        const updated = current?.filter((_, i) => i !== index);
        setValue("variants", updated);

        toast.success("Variant marked for deletion", {
          description: "The variant will be removed when you save changes.",
        });
      } else {
        // New variant (not saved yet) - just remove from local form state
        if (current.length > 1) {
          const updated = current?.filter((_, i) => i !== index);
          setValue("variants", updated);
        }
      }
    },
    [id, watch, setValue]
  );

  const handleImageRemove = useCallback(
    async (index: number, imageId?: number, publicId?: string) => {
      // If image has an ID, it exists in the backend - mark for deletion
      // Actual deletion will happen on form submit
      if (imageId) {
        // Remove image from form state (mark for deletion)
        const current = watch("images") || [];
        const filtered = current?.filter((_, i) => i !== index);
        setValue(
          "images",
          filtered.map((img, i) => ({
            id: img.id,
            url: img.url,
            publicId: img.publicId,
            altText: img.altText || "",
            position: i,
          }))
        );

        toast.success("Image marked for deletion");
      } else {
        // New image (not saved yet) - just remove from local form state
        const current = watch("images") || [];
        const filtered = current?.filter((_, i) => i !== index);
        setValue(
          "images",
          filtered.map((img, i) => ({
            id: img.id,
            url: img.url,
            publicId: img.publicId,
            altText: img.altText || "",
            position: i,
          }))
        );
      }
    },
    [id, watch, setValue]
  );

  const onSubmit = useCallback(
    async (data: ProductFormData) => {
      // Validate id is a valid number
      if (!id || Number.isNaN(id)) {
        toast.error("Invalid product ID. Cannot save changes.");
        return;
      }

      // Validate form is initialized
      if (!originalData) {
        toast.error("Form not ready. Please wait for data to load.");
        return;
      }

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

        // Check if productDetailsHtml changed
        if (data.productDetailsHtml !== originalData.productDetailsHtml) {
          updateFields.productDetailsHtml = data.productDetailsHtml;
        }

        // Check if category changed
        if (data.categoryId !== originalData.categoryId) {
          updateFields.categoryId = data.categoryId;
        }

        // Check if isActive changed
        if (data.isActive !== originalData.isActive) {
          updateFields.isActive = data.isActive;
        }
        // Check if variants changed - compare complete arrays
        // Only send variants that exist in current state (deleted ones filtered out by form state)
        const normalizedOriginalVariants = originalData.variants.map(
          (v, index) => ({
            id: v.id,
            sku: v.sku,
            price: v.price,
            stock: v.stock,
            discountType: v.discountType ?? null,
            discountValue: v.discountValue ?? null,
            discountStart: v.discountStart ?? null,
            discountEnd: v.discountEnd ?? null,
            attributes: v.attributes || [],
          })
        );

        const normalizedCurrentVariants = (data.variants || []).map(
          (v, index) => ({
            id: v.id,
            sku: v.sku,
            price: v.price,
            stock: v.stock,
            discountType: v.discountType ?? null,
            discountValue: v.discountValue ?? null,
            discountStart: v.discountStart ?? null,
            discountEnd: v.discountEnd ?? null,
            attributes: v.attributes || [],
          })
        );

        const variantsChanged =
          JSON.stringify(normalizedOriginalVariants) !==
          JSON.stringify(normalizedCurrentVariants);

        if (variantsChanged) {
          // IMPORTANT: send FULL variant array (only existing variants, deleted ones filtered out by form state)
          // If all variants were deleted (empty array), send [{}] to trigger transactional path
          // because backend ignores variants: [] without images or non-empty variants
          updateFields.variants =
            normalizedCurrentVariants.length === 0
              ? [{}]
              : normalizedCurrentVariants;
        }

        // Check if images changed - compare full normalized arrays
        // Only send images that exist in both original and current state (filter out deleted ones)
        const normalizedOriginalImages = originalData.images.map(
          (img, index) => ({
            id: img.id,
            url: img.url,
            publicId: img.publicId,
            altText: img.altText || "",
            position: index,
          })
        );

        const normalizedCurrentImages = (data.images || [])
          .filter((img) => img.url?.trim())
          .map((img, index) => ({
            id: img.id,
            url: img.url,
            publicId: img.publicId,
            altText: img.altText || "",
            position: index,
          }));

        const imagesChanged =
          JSON.stringify(normalizedOriginalImages) !==
          JSON.stringify(normalizedCurrentImages);

        if (imagesChanged) {
          // IMPORTANT: send FULL image array (only existing images, deleted ones filtered out by form state)
          updateFields.images = normalizedCurrentImages;
        }

        if (sizeChartState.mode === "replace") {
          updateFields.sizeChart = {
            url: sizeChartState.url,
            publicId: sizeChartState.publicId,
            altText: sizeChartState.altText || undefined,
          };
        }

        if (sizeChartState.mode === "remove") {
          updateFields.sizeChart = null;
        }

        // Don't send request if nothing changed
        if (Object.keys(updateFields).length === 0) {
          toast("No changes");
          return;
        }

        const updatedProduct = await productsApi.update(
          id,
          updateFields as unknown as import("@/types/product").UpdateProductInput
        );
        toast.success(`${data.name} has been updated successfully.`);

        // Update originalData with the backend response to capture newly assigned IDs
        // This prevents duplicate image creation on subsequent edits
        setOriginalData((prev) => {
          if (!prev) return prev;
          const updatedImages = (updatedProduct?.images || [])
            .filter((img) => img.url?.trim())
            .map((img, index) => ({
              id: img.id,
              url: img.url,
              publicId: img.publicId,
              altText: img.altText || "",
              position: index,
            }));
          return {
            ...prev,
            name: updatedProduct?.name,
            description: updatedProduct?.description,
            productDetailsHtml: updatedProduct?.productDetailsHtml,
            categoryId: updatedProduct?.categoryId,
            isActive: updatedProduct?.isActive,
            variants: updatedProduct?.variants
              .filter((v) => !v?.isDeleted)
              .map((v) => ({
                id: v?.id,
                sku: v?.sku,
                price: v?.price,
                stock: v?.stock,
                discountType: v?.discountType ?? null,
                discountValue: v?.discountValue ?? null,
                discountStart: v?.discountStart ?? null,
                discountEnd: v?.discountEnd ?? null,
              })),
            images: updatedImages,
            sizeChartImage: updatedProduct?.sizeChartImage || null,
          };
        });
        setSizeChartState({ mode: "unchanged" });

        // Refresh the page to get updated data from the server
        window.location.reload();
      } catch (err) {
        const errorMessage =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "Failed to update product.";
        toast.error(errorMessage);
      }
    },
    [id, originalData, sizeChartState]
  );

  const handleVariantAdd = () => {
    const current = watch("variants") || [];
    const productName = watch("name") || "";

    // New variant will be prepended at index 0
    // Generate SKU with index 0 (will be regenerated when attributes are selected)
    const newSku = generateSKU(
      productName,
      [], // No attributes selected yet
      attributeValues,
      0 // Index will be 0 after prepending
    );

    // Add new variant at the top - completely empty (with discount fields)
    const newVariant = {
      sku: newSku,
      price: 0,
      stock: 0,
      attributes: [],
      discountType: null,
      discountValue: null,
      discountStart: null,
      discountEnd: null,
    };
    const newVariants = [newVariant, ...current];

    // Set the new variants array
    setValue("variants", newVariants, { shouldValidate: false });

    // Explicitly reset each field for the new variant to prevent cached data
    setValue(`variants.0.sku`, newSku, { shouldValidate: false });
    setValue(`variants.0.price`, 0, { shouldValidate: false });
    // setValue(`variants.0.stock`, 0, { shouldValidate: false });
    setValue(`variants.0.attributes`, [], { shouldValidate: false });
    setValue(`variants.0.discountType`, null, { shouldValidate: false });
    setValue(`variants.0.discountValue`, null, { shouldValidate: false });
    setValue(`variants.0.discountStart`, null, { shouldValidate: false });
    setValue(`variants.0.discountEnd`, null, { shouldValidate: false });

    // Auto-expand the new variant (index 0)
    setExpandedIndex(0);
  };

  // Loading state - also check for invalid id
  if (
    Number.isNaN(id) ||
    isLoadingProduct ||
    !initialized ||
    isLoadingCategories
  ) {
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

  // Error state - also catch invalid id
  if (error || !product || Number.isNaN(id)) {
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
      <FullScreenLoader isLoading={isSubmitting} message="Saving changes..." />
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

        <form
          onSubmit={handleSubmit(onSubmit, scrollToFirstError)}
          className="space-y-8"
        >
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
                  <Label htmlFor="productDetailsHtml">Product Details</Label>
                  <RichTextEditor
                    value={watch("productDetailsHtml") || ""}
                    onChange={(value) => setValue("productDetailsHtml", value)}
                  />
                  {errors.productDetailsHtml && (
                    <p className="text-sm text-destructive">
                      {errors.productDetailsHtml.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Category</Label>
                  {/* DEBUG: Log categories and product.categoryId in render */}
                  <div
                    dangerouslySetInnerHTML={{
                      __html: (function () {
                        // console.log("RENDER - categories:", categories);
                        // console.log(
                        //   "RENDER - effective categoryId:",
                        //   product?.categoryId ?? product?.category?.id,
                        //   "product.categoryId:",
                        //   product?.categoryId,
                        //   "product.category.id:",
                        //   product?.category?.id,
                        // );
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
                          c.id === (product.categoryId ?? product.category?.id)
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
                  className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-5 rounded-md inline-flex items-center gap-2"
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
                    key={variant.id ?? `new-${index}`}
                    index={index}
                    variant={variant}
                    backendVariant={
                      variant.id
                        ? activeVariants.find((av) => av.id === variant.id)
                        : undefined
                    }
                    attributes={filteredAttributes}
                    attributeValues={attributeValues}
                    applicableAttributes={product?.applicableAttributes}
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
                    setError={setError}
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
                  id: img.id,
                  url: img.url,
                  publicId: img.publicId || null || undefined,
                  altText: img.altText || "",
                  position:
                    typeof img.position === "number" ? img.position : idx,
                }))}
                onUpload={(imgs) => setValue("images", imgs)}
                onRemove={(idx, imageId, publicId) => {
                  handleImageRemove(idx, imageId, publicId);
                }}
              />
            </div>
          </FadeIn>

          {/* Size Chart */}
          <FadeIn delay={0.35}>
            <div className="bg-card rounded-lg border p-6 shadow-card">
              <SizeChartUpload
                mode="edit"
                existing={product.sizeChartImage || null}
                removed={sizeChartState.mode === "remove"}
                value={
                  sizeChartState.mode === "replace"
                    ? {
                        url: sizeChartState.url,
                        publicId: sizeChartState.publicId,
                        altText: sizeChartState.altText || null,
                      }
                    : null
                }
                onUpload={(uploaded: ProductSizeChartInput) =>
                  setSizeChartState({
                    mode: "replace",
                    url: uploaded.url,
                    publicId: uploaded.publicId,
                    altText: uploaded.altText || null,
                  })
                }
                onRemove={() => setSizeChartState({ mode: "remove" })}
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
