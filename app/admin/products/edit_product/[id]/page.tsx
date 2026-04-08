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
import { useToast } from "@/hooks/use-toast";
import { useProduct } from "@/hooks/useProduct";
import { useCategories } from "@/hooks/useCategories";
import { useAttributes } from "@/hooks/useAttributes";
import { useAttributeValues } from "@/hooks/useAttributeValues";
import { productsApi } from "@/services/api";
import { productSchema, ProductFormData, INITIAL_FORM } from "@/lib/schemas/product";
import { transformVariantAttributes } from "@/lib/utils/product";
import VariantCard from "@/components/product/VariantCard";
import ProductImageGallery from "@/components/product/ProductImageGallery";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const router = useRouter();

  const { product, isLoading: isLoadingProduct, error, setProduct } = useProduct(id);
  const { categories, isLoading: isLoadingCategories } = useCategories();
  const { attributes } = useAttributes();
  const { attributeValues } = useAttributeValues();
  const { toast } = useToast();

  const [togglingVariantId, setTogglingVariantId] = useState<number | null>(null);
  const [dataReady, setDataReady] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [initialized, setInitialized] = useState(false);

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

  // Wait for ALL data and reset ONLY ONCE
  const isReady =
    product &&
    categories.length > 0 &&
    attributes.length > 0 &&
    attributeValues.length > 0;

  useEffect(() => {
    if (!initialized && isReady) {
      // Filter out soft-deleted variants
      const activeVariants = product.variants.filter((v) => !v.isDeleted);
      
      reset({
        name: product.name,
        description: product.description,
        categoryId: product.categoryId,
        variants: activeVariants.map((v) => ({
          id: v.id, // Include variant ID for updates
          sku: v.sku || "",
          price: Number(v.price) || 0,
          stock: v.stock,
          attributes: transformVariantAttributes(v),
        })),
        images: product.images || [],
      });
      setDataReady(true);
      setInitialized(true);
    }
  }, [isReady, product, reset, initialized]);

  const handleToggleVariantActive = useCallback(
    async (variantId: number) => {
      setTogglingVariantId(variantId);
      try {
        const updated = await productsApi.toggleVariantActive(id, variantId);
        setProduct(updated);
        const variant = updated.variants.find((v) => v.id === variantId);
        toast({
          title: variant?.isActive ? "Variant activated" : "Variant deactivated",
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
    [id, setProduct, toast]
  );

  const onSubmit = useCallback(
    async (data: ProductFormData) => {
      if (!id) return;

      try {
        const updateData = {
          name: data.name,
          description: data.description,
          categoryId: data.categoryId,
          variants: data.variants.map((v) => ({
            id: v.id, // Include variant ID for existing variants
            sku: v.sku,
            price: v.price,
            stock: v.stock,
            attributes: v.attributes, // Only sent for new variants
          })),
          images: data.images
            ?.filter((img) => img.url?.trim())
            ?.map((img, index) => ({
              url: img.url,
              altText: img.altText || "",
              position: index,
            })) || [],
        };

        await productsApi.update(id, updateData);
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
    [id, router, toast]
  );

  const handleVariantRemove = (index: number) => {
    const current = watch("variants") || [];
    if (current.length > 1) {
      const updated = current.filter((_, i) => i !== index);
      setValue("variants", updated);
    }
  };

  const handleVariantAdd = () => {
    const current = watch("variants") || [];
    setValue("variants", [
      ...current,
      { sku: "", price: 0, stock: 0, attributes: [] },
    ]);
  };

  // Loading state
  if (isLoadingProduct || !dataReady) {
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

  const watchedValues = watch();
  const variants = watchedValues.variants || [];

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <FadeIn className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin/products")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Product</h1>
            <p className="text-muted-foreground">Update {product.name}</p>
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
                  <select
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    value={watch("categoryId") || ""}
                    onChange={(e) => setValue("categoryId", Number(e.target.value))}
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
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
                <Button type="button" variant="outline" size="sm" onClick={handleVariantAdd}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Variant
                </Button>
              </div>
              {errors.variants?.root && (
                <p className="text-sm text-destructive">{errors.variants.root.message}</p>
              )}

              <div className="space-y-4">
                {variants.map((variant, index) => (
                  <VariantCard
                    key={index}
                    index={index}
                    variant={variant}
                    backendVariant={product.variants[index]}
                    attributes={attributes}
                    attributeValues={attributeValues}
                    isExpanded={expandedIndex === index}
                    onToggleExpand={() =>
                      setExpandedIndex(expandedIndex === index ? null : index)
                    }
                    onRemove={() => handleVariantRemove(index)}
                    onToggleActive={
                      product.variants[index]?.id
                        ? () => handleToggleVariantActive(product.variants[index].id)
                        : undefined
                    }
                    isToggling={togglingVariantId === product.variants[index]?.id}
                    register={register}
                    control={control}
                    watch={watch}
                    setValue={setValue}
                    errors={errors}
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
                  position: typeof img.position === 'number' ? img.position : idx,
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
                    }))
                  );
                }}
              />
            </div>
          </FadeIn>

          {/* Actions */}
          <FadeIn delay={0.4} className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={() => router.push("/admin/products")}>
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
