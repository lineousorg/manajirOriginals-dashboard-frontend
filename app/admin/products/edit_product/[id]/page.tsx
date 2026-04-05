"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, ArrowLeft, Loader2 } from "lucide-react";
import { PageTransition, FadeIn } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormSkeleton } from "@/components/ui/skeleton-card";
import { useToast } from "@/hooks/use-toast";
import { useParams, useRouter } from "next/navigation";
import { useProduct } from "@/hooks/useProduct";
import { useCategories } from "@/hooks/useCategories";
import { useAttributes } from "@/hooks/useAttributes";
import { useAttributeValues } from "@/hooks/useAttributeValues";
import { productsApi } from "@/services/api";
import { VariantAttributeResponse } from "@/types/product";

// Schema for form validation
const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().min(1, "Description is required").max(500),
  categoryId: z.number().min(1, "Category is required"),
  variants: z.array(
    z.object({
      sku: z.string().min(1, "SKU is required"),
      price: z.number().min(0, "Price must be positive"),
      stock: z.number().min(0, "Stock must be positive"),
      attributes: z.array(
        z.object({
          attributeId: z.number(),
          valueId: z.number(),
        })
      ),
    })
  ).min(1, "At least one variant is required"),
  images: z.array(
    z.object({
      url: z.string().min(1, "Image URL is required"),
      altText: z.string().optional(),
      position: z.number(),
    })
  ).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

// Transform API response attributes to form-friendly format
const transformVariantAttributes = (
  variant: { attributes?: VariantAttributeResponse[] }
): { attributeId: number; valueId: number }[] => {
  if (!variant.attributes || !Array.isArray(variant.attributes)) return [];
  
  return variant.attributes.map((attr) => ({
    attributeId: attr.attributeValue?.attribute?.id ?? 0,
    valueId: attr.attributeValue?.id ?? 0,
  })).filter(a => a.attributeId > 0 && a.valueId > 0);
};

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

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      categoryId: 0,
      variants: [{ sku: "", price: 0, stock: 0, attributes: [] }],
      images: [],
    },
  });

  // Reset form when product data is ready
  useEffect(() => {
    if (product && categories.length > 0 && attributes.length > 0) {
      reset({
        name: product.name,
        description: product.description,
        categoryId: product.categoryId,
        variants: product.variants.map((v) => ({
          sku: v.sku || "",
          price: Number(v.price) || 0,
          stock: v.stock,
          attributes: transformVariantAttributes(v),
        })),
        images: product.images || [],
      });
      setDataReady(true);
    }
  }, [product, categories, attributes, reset]);

  const onSubmit = async (data: ProductFormData) => {
    if (!id) return;

    try {
      const updateData = {
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        variants: data.variants.map((v) => ({
          sku: v.sku,
          price: v.price,
          stock: v.stock,
          attributes: v.attributes,
        })),
        images: data.images?.filter((img) => img.url?.trim())?.map((img, index) => ({
          url: img.url,
          altText: img.altText || "",
          position: index,
        })) || [],
      };

      await productsApi.update(id, updateData);
      toast({ title: "Product updated", description: `${data.name} has been updated successfully.` });
      router.push("/admin/products");
    } catch {
      toast({ title: "Error", description: "Failed to update product.", variant: "destructive" });
    }
  };

  const handleToggleVariantActive = async (variantId: number) => {
    setTogglingVariantId(variantId);
    try {
      const updated = await productsApi.toggleVariantActive(id, variantId);
      setProduct(updated);
      const variant = updated.variants.find((v) => v.id === variantId);
      toast({
        title: variant?.isActive ? "Variant activated" : "Variant deactivated",
        description: `Variant status updated.`,
      });
    } catch {
      toast({ title: "Error", description: "Failed to toggle variant status.", variant: "destructive" });
    } finally {
      setTogglingVariantId(null);
    }
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    const currentImages = watch("images") || [];
    for (let i = 0; i < files.length; i++) {
      try {
        const base64 = await fileToBase64(files[i]);
        const newImages = [...currentImages, { url: base64, altText: files[i].name, position: currentImages.length + i }];
        // Use setValue to update the images array
        reset({ ...watch(), images: newImages });
      } catch {
        // Silent fail for image upload
      }
    }
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    const currentImages = watch("images") || [];
    const newImages = currentImages.filter((_, i) => i !== index).map((img, i) => ({ ...img, position: i }));
    reset({ ...watch(), images: newImages });
  };

  if (isLoadingProduct || !dataReady) {
    return (
      <PageTransition>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" disabled><ArrowLeft className="w-5 h-5" /></Button>
            <div className="space-y-2">
              <div className="h-8 w-48 bg-muted rounded animate-shimmer" />
              <div className="h-4 w-64 bg-muted rounded animate-shimmer" />
            </div>
          </div>
          <div className="bg-card rounded-lg border p-6 shadow-card"><FormSkeleton /></div>
        </div>
      </PageTransition>
    );
  }

  if (error || !product) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center py-16">
          <h2 className="text-xl font-semibold mb-2">Product not found</h2>
          <p className="text-muted-foreground mb-4">The product you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.push("/admin/products")}>Back to Products</Button>
        </div>
      </PageTransition>
    );
  }

  const watchedValues = watch();

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
                  <Input id="name" placeholder="Enter product name" {...register("name")} className={errors.name ? "border-destructive" : ""} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Enter product description" rows={4} {...register("description")} className={errors.description ? "border-destructive" : ""} />
                  {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Category</Label>
                  <Controller
                    name="categoryId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value ? String(field.value) : ""}
                        onValueChange={(value) => field.onChange(Number(value))}
                        disabled={isLoadingCategories}
                      >
                        <SelectTrigger className={errors.categoryId ? "border-destructive" : ""}>
                          <SelectValue placeholder={`${product.category.name ? product.category.name : "Select Category"}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.categoryId && <p className="text-sm text-destructive">{errors.categoryId.message}</p>}
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
                  onClick={() => {
                    const current = watch("variants") || [];
                    reset({ ...watch(), variants: [...current, { sku: "", price: 0, stock: 0, attributes: [] }] });
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />Add Variant
                </Button>
              </div>
              {errors.variants?.root && <p className="text-sm text-destructive">{errors.variants.root.message}</p>}

              <div className="space-y-4">
                {(watchedValues.variants || []).map((variant, index) => {
                  const backendVariant = product.variants[index];
                  return (
                    <div key={index} className="grid gap-4 md:grid-cols-12 p-4 bg-muted/50 rounded-lg">
                      {/* Status */}
                      <div className="space-y-2 md:col-span-2">
                        <Label>Status</Label>
                        <div className="flex items-center gap-2 h-10">
                          {backendVariant?.id ? (
                            <>
                              <Switch
                                checked={backendVariant.isActive ?? true}
                                onCheckedChange={() => handleToggleVariantActive(backendVariant.id)}
                                disabled={togglingVariantId === backendVariant.id}
                              />
                              <span className={`text-xs font-medium ${backendVariant.isActive ? "text-green-600" : "text-muted-foreground"}`}>
                                {backendVariant.isActive ? "Active" : "Inactive"}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">New</span>
                          )}
                        </div>
                      </div>

                      {/* SKU */}
                      <div className="space-y-2 md:col-span-2">
                        <Label>SKU</Label>
                        <Input
                          placeholder="SKU-123"
                          {...register(`variants.${index}.sku`)}
                          className={errors.variants?.[index]?.sku ? "border-destructive" : ""}
                        />
                        {errors.variants?.[index]?.sku && <p className="text-xs text-destructive">{errors.variants[index]?.sku?.message}</p>}
                      </div>

                      {/* Price */}
                      <div className="space-y-2 md:col-span-2">
                        <Label>Price (BDT)</Label>
                        <Input
                          type="number"
                          step="1"
                          placeholder="0"
                          {...register(`variants.${index}.price`, { valueAsNumber: true })}
                          className={errors.variants?.[index]?.price ? "border-destructive" : ""}
                        />
                        {errors.variants?.[index]?.price && <p className="text-xs text-destructive">{errors.variants[index]?.price?.message}</p>}
                      </div>

                      {/* Stock */}
                      <div className="space-y-2 md:col-span-2">
                        <Label>Stock</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          {...register(`variants.${index}.stock`, { valueAsNumber: true })}
                          className={errors.variants?.[index]?.stock ? "border-destructive" : ""}
                        />
                        {errors.variants?.[index]?.stock && <p className="text-xs text-destructive">{errors.variants[index]?.stock?.message}</p>}
                      </div>

                      {/* Attributes */}
                      <div className="md:col-span-3">
                        <Label className="text-sm mb-2 block">Attributes</Label>
                        <div className="space-y-2">
                          {attributes.map((attr) => (
                            <Controller
                              key={attr.id}
                              name={`variants.${index}.attributes`}
                              control={control}
                              render={({ field }) => {
                                const currentAttr = (field.value || []).find((a) => a.attributeId === attr.id);
                                return (
                                  <Select
                                    value={currentAttr ? String(currentAttr.valueId) : ""}
                                    onValueChange={(val) => {
                                      const newAttrs = (field.value || []).filter((a) => a.attributeId !== attr.id);
                                      newAttrs.push({ attributeId: attr.id, valueId: Number(val) });
                                      field.onChange(newAttrs);
                                    }}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder={attr.name} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {attributeValues.filter((av) => av.attributeId === attr.id).map((val) => (
                                        <SelectItem key={val.id} value={String(val.id)}>{val.value}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                );
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Delete */}
                      <div className="flex items-end md:col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const current = watch("variants") || [];
                            if (current.length > 1) {
                              reset({ ...watch(), variants: current.filter((_, i) => i !== index) });
                            }
                          }}
                          disabled={(watchedValues.variants || []).length === 1}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </FadeIn>

          {/* Images */}
          <FadeIn delay={0.3}>
            <div className="bg-card rounded-lg border p-6 shadow-card space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Product Images</h2>
                <Label htmlFor="image-upload" className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" />Add Images
                </Label>
                <input id="image-upload" type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
              </div>

              {(!watchedValues.images || watchedValues.images.length === 0) && (
                <p className="text-muted-foreground text-sm">No images added yet. Click &quot;Add Images&quot; to upload.</p>
              )}

              <div className="grid gap-4 md:grid-cols-3">
                {(watchedValues.images || []).map((img, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square bg-muted rounded-lg overflow-hidden border">
                      <img src={img.url} alt={img.altText || `Product image ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                    <div className="mt-2 space-y-2">
                      <Input
                        placeholder="Alt text (optional)"
                        value={img.altText || ""}
                        onChange={(e) => {
                          const newImages = [...(watchedValues.images || [])];
                          newImages[index] = { ...newImages[index], altText: e.target.value };
                          reset({ ...watch(), images: newImages });
                        }}
                        className="text-xs"
                      />
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeImage(index)} className="w-full text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4 mr-2" />Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Actions */}
          <FadeIn delay={0.4} className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={() => router.push("/admin/products")}>Cancel</Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : "Save Changes"}
            </Button>
          </FadeIn>
        </form>
      </div>
    </PageTransition>
  );
}
