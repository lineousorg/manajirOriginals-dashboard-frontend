/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useFieldArray, useForm, Controller, useWatch } from "react-hook-form";
import { useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Plus, Trash2, ArrowLeft, Loader2 } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { PageTransition, FadeIn } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { CreateProductInput, ProductImage } from "@/types/product";

// Variant attribute schema
const attributeSchema = z.object({
  attributeId: z.number(),
  valueId: z.number(),
});

// Image schema
const imageSchema = z.object({
  url: z.string().min(1, "Image URL is required"),
  altText: z.string().optional().default(""),
  position: z.number(),
});

// Variant schema matching backend structure
const variantSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  price: z.number().min(0, "Price must be positive"),
  stock: z.number().min(0, "Stock must be positive"),
  attributes: z.array(attributeSchema).optional().default([]),
});

// Product schema matching backend structure
const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().min(1, "Description is required").max(500),
  slug: z.string().min(1, "Slug is required").max(100),
  categoryId: z.number().min(1, "Category is required"),
  variants: z.array(variantSchema).min(1, "At least one variant is required"),
  images: z.array(imageSchema).optional().default([]),
});

type ProductFormData = z.infer<typeof productSchema>;

// Helper function to generate SKU based on product name and variant attributes
const generateSKU = (
  productName: string,
  attributes: Array<{ attributeId: number; valueId: number }>,
  variantIndex: number,
  productId?: number,
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

  // Size and Color attribute IDs from mock data
  const SIZE_ATTR_ID = 1;
  const COLOR_ATTR_ID = 2;

  const sizeValue = attributes.find(
    (a) => a.attributeId === SIZE_ATTR_ID,
  )?.valueId;
  const colorValue = attributes.find(
    (a) => a.attributeId === COLOR_ATTR_ID,
  )?.valueId;

  // Get display values from mock attributes
  const sizeMap: Record<number, string> = { 1: "M", 2: "L" };
  const colorMap: Record<number, string> = {
    3: "BLK",
    4: "WHT",
    5: "RED",
    6: "BLU",
    7: "GRN",
    8: "YEL",
    9: "ORG",
    10: "PNK",
    11: "GRY",
    12: "BRN",
    13: "NAV",
    14: "BEG",
    15: "CRM",
    16: "SIL",
    17: "GOL",
    18: "MRN",
  };

  const size = sizeValue ? sizeMap[sizeValue] || "" : "";
  const color = colorValue ? colorMap[colorValue] || "" : "";
  console.log(color);

  // Format: NAME-COLOR-SIZE (e.g., TSHIRT-WHT-L)
  return `${nameSku}-${size}-${color}`.toUpperCase();
};

const CreateProductPage = () => {
  const router = useRouter();
  const { createProduct, updateProduct } = useProducts();
  const { categories, isLoading: isLoadingCategories } = useCategories();
  const { toast } = useToast();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      slug: "",
      categoryId: 0,
      variants: [{ sku: "", price: 0, stock: 0, attributes: [] }],
      images: [],
    },
  });

  // Store generated SKUs before product creation
  const generatedSKUsRef = useRef<
    Array<{
      index: number;
      attributes: Array<{ attributeId: number; valueId: number }>;
    }>
  >([]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  const {
    fields: imageFields,
    append: appendImage,
    remove: removeImage,
  } = useFieldArray({
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

  // Store previous SKU values to prevent infinite loop
  const previousSkusRef = useRef<Array<string>>([]);

  // Auto-generate SKU when product name or variant attributes change
  const nameValue = watch("name");
  const variantsValue = useWatch({ control, name: "variants" });

  useEffect(() => {
    if (variantsValue && variantsValue.length > 0) {
      variantsValue.forEach((variant, index) => {
        const newSku = generateSKU(nameValue, variant.attributes || [], index);
        // Only update if SKU has changed
        if (previousSkusRef.current[index] !== newSku) {
          setValue(`variants.${index}.sku`, newSku);
          previousSkusRef.current[index] = newSku;
        }
        // Store the variant data for SKU regeneration after product creation
        generatedSKUsRef.current[index] = {
          index,
          attributes: variant.attributes || [],
        };
      });
    }
  }, [nameValue, variantsValue, setValue]);

  const handleNameChange = (value: string) => {
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setValue("slug", slug);
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      const productData: CreateProductInput = {
        name: data.name,
        description: data.description,
        slug: data.slug,
        categoryId: data.categoryId,
        variants: data.variants.map((v) => ({
          sku: v.sku,
          price: v.price,
          stock: v.stock,
          attributes: v.attributes || [],
        })),
        images: data.images.map((img, index) => ({
          url: img.url,
          altText: img.altText,
          position: index,
        })),
      };

      // Create product and get the response with productId
      const createdProduct = await createProduct(productData);

      // Regenerate SKUs with actual productId
      const updatedVariants = createdProduct.variants.map((variant, index) => {
        const variantData = generatedSKUsRef.current.find(
          (v) => v.index === index,
        );
        const newSku = generateSKU(
          data.name,
          variantData?.attributes || [],
          index,
          createdProduct.id,
        );
        return {
          ...variant,
          sku: newSku,
        };
      });

      // Update product with correct SKUs
      await updateProduct(createdProduct.id, { variants: updatedVariants });

      toast({
        title: "Product created",
        description: `${data.name} has been created successfully.`,
      });
      router.push("/admin/products");
    } catch (error: any) {
      console.error("Error creating product:", error);

      // Check for 409 Conflict (duplicate slug)
      if (error?.response?.status === 409) {
        toast({
          title: "Slug Already Exists",
          description:
            "Product with this slug already exists. Please use a different slug.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description:
            error?.response?.data?.message ||
            "Failed to create product. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Mock attributes - in real app, fetch from API
  const mockAttributes = [
    {
      id: 1,
      name: "Size",
      values: [
        { id: 1, name: "M" },
        { id: 2, name: "L" },
      ],
    },
    {
      id: 2,
      name: "Color",
      values: [
        { id: 3, name: "Black" },
        { id: 4, name: "White" },
      ],
    },
  ];

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
            <h1 className="text-2xl font-bold">Create Product</h1>
            <p className="text-muted-foreground">
              Add a new product to your catalog
            </p>
          </div>
        </FadeIn>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Info */}
          <FadeIn delay={0.1}>
            <div className="bg-card rounded-lg border p-6 shadow-card space-y-6">
              <h2 className="text-lg font-semibold">Basic Information</h2>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="grid grid-cols-2 col-span-2 gap-4">
                  {/* Product name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter product name"
                      {...register("name")}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Category selection */}
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Controller
                      name="categoryId"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={String(field.value)}
                          onValueChange={(val) => field.onChange(Number(val))}
                          disabled={isLoadingCategories}
                        >
                          <SelectTrigger
                            className={
                              errors.categoryId ? "border-destructive" : ""
                            }
                          >
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
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

                {/* Product slug */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    placeholder="product-slug"
                    {...register("slug")}
                    className={errors.slug ? "border-destructive" : ""}
                  />
                  {errors.slug && (
                    <p className="text-sm text-destructive">
                      {errors.slug.message}
                    </p>
                  )}
                </div>

                {/* Product description */}
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

                {/* Images */}
                <div className="col-span-2">
                  <Label>Product Images</Label>
                  <div className="bg-card rounded-lg border p-4 shadow-card space-y-6 ">
                    <div className="flex items-center justify-end">
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      <Label
                        htmlFor="image-upload"
                        className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md inline-flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Images
                      </Label>
                    </div>

                    {imageFields.length === 0 && (
                      <p className="text-muted-foreground text-sm">
                        No images added yet. Click &quot;Add Images&quot; to
                        upload.
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
                              alt={
                                watch(`images.${index}.altText`) ||
                                `Product image ${index + 1}`
                              }
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

              {/* Product variant */}
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <motion.div
                    key={field.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="grid gap-4 p-4 bg-muted/50 rounded-lg relative"
                  >
                    {/* Attributes Section */}
                    <div className="">
                      <Label className="text-sm mb-2 block">Attributes</Label>
                      <div className="grid gap-4 md:grid-cols-2">
                        {mockAttributes.map((attr) => (
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
                                      {attr.values.map((val) => (
                                        <SelectItem
                                          key={val.id}
                                          value={String(val.id)}
                                        >
                                          {val.name}
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

                    <div className="flex gap-4 justify-between border-t pt-4">
                      <div className="space-y-2">
                        <Label>SKU (Auto-generated)</Label>
                        <Controller
                          name={`variants.${index}.sku`}
                          control={control}
                          render={({ field }) => (
                            <Input
                              placeholder="SKU will be generated"
                              {...field}
                              readOnly
                              disabled
                              className="bg-muted cursor-not-allowed opacity-70"
                            />
                          )}
                        />
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
                    </div>
                  </motion.div>
                ))}
              </div>
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
                  Creating...
                </>
              ) : (
                "Create Product"
              )}
            </Button>
          </FadeIn>
        </form>
      </div>
    </PageTransition>
  );
};

export default CreateProductPage;
