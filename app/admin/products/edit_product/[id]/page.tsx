/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useEffect, useState } from "react";
import { useFieldArray, useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Plus, Trash2, ArrowLeft, Loader2 } from "lucide-react";
import { ProductVariant, ProductImage } from "@/types/product";
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
import { useProducts } from "@/hooks/useProducts";
import { useProduct } from "@/hooks/useProduct";
import { useCategories } from "@/hooks/useCategories";
import { useAttributes } from "@/hooks/useAttributes";
import { useAttributeValues } from "@/hooks/useAttributeValues";

// Variant schema matching backend structure
const variantSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  price: z.number().min(0, "Price must be positive"),
  stock: z.number().min(0, "Stock must be positive"),
  attributes: z.array(z.object({
    attributeId: z.number(),
    valueId: z.number(),
  })).optional().default([]),
});

// Image schema
const imageSchema = z.object({
  url: z.string().min(1, "Image URL is required"),
  altText: z.string().optional().default(""),
  position: z.number(),
});

// Product schema matching backend structure
const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().min(1, "Description is required").max(500),
  categoryId: z.number().min(1, "Category is required"),
  variants: z.array(variantSchema).min(1, "At least one variant is required"),
  images: z.array(imageSchema).optional().default([]),
});

type ProductFormData = z.infer<typeof productSchema>;

const EditProductPage = () => {
  const params = useParams<{ id: string }>();
  const stringId = params?.id;
  const id = Number(stringId);
  const router = useRouter();
  const { product, isLoading: isLoadingProduct, error, setProduct } = useProduct(id);
  const { updateProduct, toggleVariantActive } = useProducts();
  const { categories, isLoading: isLoadingCategories } = useCategories();
  const { attributes, isLoading: isLoadingAttributes } = useAttributes();
  const { attributeValues, isLoading: isLoadingAttributeValues } = useAttributeValues();
  const { toast } = useToast();
  const [togglingVariantId, setTogglingVariantId] = useState<number | null>(null);

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
    defaultValues: {
      name: "",
      description: "",
      categoryId: 0,
      variants: [{ sku: "", price: 0, stock: 0, attributes: [] }],
      images: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({
    control,
    name: "images",
  });

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle image file selection
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentImages = watch("images") || [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const base64 = await fileToBase64(file);
        appendImage({
          url: base64,
          altText: file.name,
          position: currentImages.length + i,
        });
      } catch (error) {
        console.error("Error converting file to base64:", error);
      }
    }
  };

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        description: product.description,
        categoryId: product.categoryId,
        variants: product.variants.map((v) => ({
          sku: v.sku || "",
          price: v.price,
          stock: v.stock,
          attributes: v.attributes || [],
        })),
        images: product.images || [],
      });
    }
  }, [product, reset]);

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
          attributes: v.attributes || [],
        })),
        images: data.images
          .filter((img) => img.url && img.url.trim() !== "")
          .map((img, index) => ({
            url: img.url,
            altText: img.altText || "",
            position: index,
          })),
      };

      await updateProduct(id, updateData);
      toast({
        title: "Product updated",
        description: `${data.name} has been updated successfully.`,
      });
      router.push("/admin/products");
    } catch (error) {
      console.error("Error updating product:", error);
      toast({
        title: "Error",
        description: "Failed to update product. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleVariantActive = async (variantId: number) => {
    setTogglingVariantId(variantId);
    try {
      await toggleVariantActive(id, variantId);
      // Get the current variant state before updating
      const currentVariant = product?.variants.find((v) => v.id === variantId);
      const newIsActive = !currentVariant?.isActive;
      
      // Update local state to reflect the change immediately
      setProduct((prevProduct) => {
        if (!prevProduct) return null;
        return {
          ...prevProduct,
          variants: prevProduct.variants.map((v) =>
            v.id === variantId ? { ...v, isActive: newIsActive } : v
          ),
        };
      });
      
      toast({
        title: currentVariant?.isActive ? "Variant deactivated" : "Variant activated",
        description: `Variant has been ${currentVariant?.isActive ? "deactivated" : "activated"} successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to toggle variant status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setTogglingVariantId(null);
    }
  };

  if (isLoadingProduct) {
    return (
      <PageTransition>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" disabled>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="space-y-2">
              <div className="h-8 w-48 bg-muted rounded animate-shimmer" />
              <div className="h-4 w-64 bg-muted rounded animate-shimmer" />
            </div>
          </div>
          <div className="bg-card rounded-lg border p-6 shadow-card">
            <FormSkeleton />
          </div>
        </div>
      </PageTransition>
    );
  }

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

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <FadeIn className="flex items-center gap-4">
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
                  <Controller
                    name="categoryId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value ? String(field.value) : ""}
                        onValueChange={(value) => field.onChange(Number(value))}
                        disabled={isLoadingCategories}
                      >
                        <SelectTrigger
                          className={
                            errors.categoryId ? "border-destructive" : ""
                          }
                        >
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={String(cat.id)}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
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
          <FadeIn delay={0.3}>
            <div className="bg-card rounded-lg border p-6 shadow-card space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Product Variants</h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({ sku: "", price: 0, stock: 0, attributes: [] })
                  }
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
                {fields.map((field, index) => (
                  <motion.div
                    key={field.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="grid gap-4 md:grid-cols-5 p-4 bg-muted/50 rounded-lg relative"
                  >
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <div className="flex items-center gap-2 h-10">
                        {product.variants[index]?.id ? (
                          <>
                            <Switch
                              checked={product.variants[index]?.isActive ?? true}
                              onCheckedChange={() => handleToggleVariantActive(product.variants[index]?.id)}
                              disabled={togglingVariantId === product.variants[index]?.id}
                              className="data-[state=checked]:bg-green-700 data-[state=unchecked]:bg-muted"
                            />
                            <span
                              className={`text-xs font-medium ${
                                product.variants[index]?.isActive
                                  ? "text-success"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {product.variants[index]?.isActive ? "Active" : "Inactive"}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">New</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>SKU</Label>
                      <Input
                        placeholder="e.g., SKU-123"
                        {...register(`variants.${index}.sku`)}
                        className={
                          errors.variants?.[index]?.sku
                            ? "border-destructive"
                            : ""
                        }
                      />
                      {errors.variants?.[index]?.sku && (
                        <p className="text-sm text-destructive">
                          {errors.variants[index]?.sku?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Price ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...register(`variants.${index}.price`, {
                          valueAsNumber: true,
                        })}
                        className={
                          errors.variants?.[index]?.price
                            ? "border-destructive"
                            : ""
                        }
                      />
                      {errors.variants?.[index]?.price && (
                        <p className="text-sm text-destructive">
                          {errors.variants[index]?.price?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Stock</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        {...register(`variants.${index}.stock`, {
                          valueAsNumber: true,
                        })}
                        className={
                          errors.variants?.[index]?.stock
                            ? "border-destructive"
                            : ""
                        }
                      />
                      {errors.variants?.[index]?.stock && (
                        <p className="text-sm text-destructive">
                          {errors.variants[index]?.stock?.message}
                        </p>
                      )}
                    </div>

                    {/* Attributes Section */}
                    <div className="md:col-span-6">
                      <Label className="text-sm mb-2 block">Attributes</Label>
                      <div className="grid gap-4 md:grid-cols-2">
                        {attributes.map((attr) => (
                          <div key={attr.id} className="space-y-2">
                            <Label className="">{attr.name}</Label>
                            <Controller
                              name={`variants.${index}.attributes`}
                              control={control}
                              render={({ field: attributeField }) => {
                                const currentAttr = attributeField.value?.find(
                                  (a: { attributeId: number }) =>
                                    a.attributeId === attr.id,
                                );
                                return (
                                  <Select
                                    value={
                                      currentAttr
                                        ? String(currentAttr.valueId)
                                        : ""
                                    }
                                    onValueChange={(val) => {
                                      const newAttrs = (
                                        attributeField.value || []
                                      ).filter(
                                        (a: { attributeId: number }) =>
                                          a.attributeId !== attr.id,
                                      );
                                      newAttrs.push({
                                        attributeId: attr.id,
                                        valueId: Number(val),
                                      });
                                      attributeField.onChange(newAttrs);
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue
                                        placeholder={`Select ${attr.name}`}
                                      />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white">
                                      {attributeValues
                                        .filter((av) => av.attributeId === attr.id)
                                        .map((val) => (
                                          <SelectItem
                                            key={val.id}
                                            value={String(val.id)}
                                          >
                                            {val.value}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                );
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Images */}
          <FadeIn delay={0.35}>
            <div className="bg-card rounded-lg border p-6 shadow-card space-y-6">
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

              {imageFields.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  No images added yet. Click &quot;Add Images&quot; to upload.
                </p>
              )}

              <div className="grid gap-4 md:grid-cols-3">
                {imageFields.map((field, index) => (
                  <motion.div
                    key={field.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative group"
                  >
                    <div className="aspect-square bg-muted rounded-lg overflow-hidden border">
                      <img
                        src={watch(`images.${index}.url`)}
                        alt={watch(`images.${index}.altText`) || `Product image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="mt-2 space-y-2">
                      <Input
                        placeholder="Alt text (optional)"
                        {...register(`images.${index}.altText`)}
                        className="text-xs"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeImage(index)}
                        className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {errors.images && (
                <p className="text-sm text-destructive">
                  {errors.images.message}
                </p>
              )}
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
};

export default EditProductPage;
