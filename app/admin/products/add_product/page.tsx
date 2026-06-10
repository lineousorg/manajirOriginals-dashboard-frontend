/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useFieldArray, useForm, Controller, useWatch } from "react-hook-form";
import { useEffect, useRef, useState, useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Plus, Trash2, ArrowLeft, Loader2, X } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useAttributes } from "@/hooks/useAttributes";
import { useAttributeValues } from "@/hooks/useAttributeValues";
import { useCategoryAttributes } from "@/hooks/useCategoryAttributes";
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
import RichTextEditor from "@/components/editor/RichTextEditor";
import { generateSKU } from "@/lib/utils/product";
import { uploadToCloudinary } from "@/lib/utils/cloudinary";

// Variant attribute schema
const attributeSchema = z.object({
  attributeId: z.number(),
  valueId: z.number(),
});

// Image schema
const imageSchema = z.object({
  url: z.string().min(1, "Image URL is required"),
  publicId: z.string().optional(),
  altText: z.string().optional().default(""),
  position: z.number(),
});

// Variant schema matching backend structure
const today = new Date().toISOString().split("T")[0];

const variantSchema = z
  .object({
    sku: z.string().min(1, "SKU is required"),
    price: z.number().min(0, "Price must be positive"),
    stock: z.number().min(0, "Stock must be positive"),
    attributes: z.array(attributeSchema).optional().default([]),
    discountType: z.enum(["PERCENTAGE", "FIXED"]).optional().nullable(),
    discountValue: z.number().min(0).optional().nullable(),
    discountStart: z
      .string()
      .refine((val) => !val || val >= today, {
        message: "Can't select past day",
      })
      .optional()
      .nullable(),
    discountEnd: z
      .string()
      .refine((val) => !val || val >= today, {
        message: "Can't select past day",
      })
      .optional()
      .nullable(),
  })
  .superRefine((data, ctx) => {
    if (
      data.discountType === "PERCENTAGE" &&
      data.discountValue !== null &&
      data.discountValue !== undefined &&
      data.discountValue > 100
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Percentage cannot exceed 100",
        path: ["discountValue"],
      });
    }
  });

// Product schema matching backend structure
const productSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100),
    description: z.string().min(1, "Description is required").max(500),
    productDetailsHtml: z.string().optional(),
    slug: z.string().min(1, "Slug is required").max(100),
    categoryId: z.number().min(1, "Category is required"),
    variants: z
      .array(variantSchema)
      .min(1, "At least one variant is required")
      .superRefine((variants, ctx) => {
        const attributeSignatureMap = new Map<string, number[]>();

        variants.forEach((variant, index) => {
          const sortedAttrs = [...(variant.attributes || [])].sort(
            (a, b) => a.attributeId - b.attributeId
          );
          const signature = sortedAttrs
            .map((attr) => `${attr.attributeId}:${attr.valueId}`)
            .join(";");

          if (!signature) return;

          if (attributeSignatureMap.has(signature)) {
            attributeSignatureMap.get(signature)!.push(index);
          } else {
            attributeSignatureMap.set(signature, [index]);
          }
        });

        attributeSignatureMap.forEach((indices) => {
          if (indices.length > 1) {
            indices.slice(1).forEach((dupIndex) => {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                  "That variant already exists. Cannot create the same variant twice.",
                path: [dupIndex, "attributes"],
              });
            });
          }
        });
      }),
    images: z.array(imageSchema).optional().default([]),
  })
  .superRefine((data, ctx) => {
    // Validate that variant attributes belong to the selected category
    // (Server-side validation is the primary guard)
  });

type ProductFormData = z.infer<typeof productSchema>;

// SKU generation ref type
type SkuRefEntry = {
  index: number;
  attributes: Array<{ attributeId: number; valueId: number }>;
};

const CreateProductPage = () => {
  const router = useRouter();
  const { createProduct } = useProducts();
  const { categories, isLoading: isLoadingCategories } = useCategories();
  const { attributes, isLoading: isLoadingAttributes } = useAttributes();
  const { attributeValues, isLoading: isLoadingAttributeValues } =
    useAttributeValues();
  const { fetchCategoryAttributes } = useCategoryAttributes();
  const { toast } = useToast();

  // Track selected category to filter attributes
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [categoryAttributesMap, setCategoryAttributesMap] = useState<
    Record<number, number[]>
  >({});
  const [isFetchingCategoryAttrs, setIsFetchingCategoryAttrs] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      productDetailsHtml: "",
      slug: "",
      categoryId: 0,
      variants: [
        {
          sku: "",
          price: 0,
          stock: 0,
          attributes: [],
          discountType: null,
          discountValue: null,
          discountStart: null,
          discountEnd: null,
        },
      ],
      images: [],
    },
  });

  // Store generated SKUs before product creation
  const generatedSKUsRef = useRef<SkuRefEntry[]>([]);

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

// Track uploading images with local preview URLs
   const [uploadingImages, setUploadingImages] = useState<
     Array<{
       index: number;
       localUrl: string;
       fileName: string;
     }>
   >([]);

  // Refs for scrolling to error sections
   const variantCardRefs = useRef<(HTMLDivElement | null)[]>([]);
   const basicInfoRef = useRef<HTMLDivElement>(null);

  // Track expanded variant for UX
   const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Handle image file selection - upload to Cloudinary
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentImages = watch("images") || [];
    const newUploadingImages: Array<{
      index: number;
      localUrl: string;
      fileName: string;
    }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const imageIndex = currentImages.length + i;
      const localUrl = URL.createObjectURL(file);

      newUploadingImages.push({
        index: imageIndex,
        localUrl,
        fileName: file.name,
      });
    }

    setUploadingImages((prev) => [...prev, ...newUploadingImages]);

    for (const upload of newUploadingImages) {
      try {
        const file = files[upload.index - currentImages.length];
        const cloudinaryResponse = await uploadToCloudinary(file);

        appendImage({
          url: cloudinaryResponse.secure_url,
          publicId: cloudinaryResponse.public_id,
          altText: upload.fileName,
          position: upload.index,
        });

        setUploadingImages((prev) =>
          prev.filter((u) => u.index !== upload.index)
        );
        URL.revokeObjectURL(upload.localUrl);
      } catch (error) {
        console.error("Error uploading image to Cloudinary:", error);
        toast({
          title: "Upload Failed",
          description: `Failed to upload ${upload.fileName}. Please try again.`,
          variant: "destructive",
        });
        setUploadingImages((prev) =>
          prev.filter((u) => u.index !== upload.index)
        );
        URL.revokeObjectURL(upload.localUrl);
      }
    }

    e.target.value = "";
  };

  // Store previous SKU values to prevent infinite loop
  const previousSkusRef = useRef<Array<string>>([]);

  // Auto-generate SKU when product name or variant attributes change
  const nameValue = watch("name");
  const variantsValue = useWatch({ control, name: "variants" });

  useEffect(() => {
    if (variantsValue && variantsValue.length > 0) {
      variantsValue.forEach((variant, index) => {
        const newSku = generateSKU(
          nameValue,
          variant.attributes || [],
          attributeValues,
          index
        );
        if (previousSkusRef.current[index] !== newSku) {
          setValue(`variants.${index}.sku`, newSku);
          previousSkusRef.current[index] = newSku;
        }
        generatedSKUsRef.current[index] = {
          index,
          attributes: variant.attributes || [],
        };
      });
    }
  }, [nameValue, variantsValue, attributeValues, setValue]);

  const handleNameChange = (value: string) => {
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setValue("slug", slug);
  };

  const categoryIdValue = watch("categoryId");

  // Fetch category attributes when category changes
  useEffect(() => {
    const fetchAttrs = async (catId: number) => {
      if (catId <= 0) {
        setCategoryAttributesMap((prev) => ({ ...prev, [catId]: [] }));
        return;
      }
      setIsFetchingCategoryAttrs(true);
      try {
        const category = categories.find((c) => c.id === catId);
        const slug = category?.slug;
        if (!slug) {
          setCategoryAttributesMap((prev) => ({ ...prev, [catId]: [] }));
          return;
        }
        const catAttrs = await fetchCategoryAttributes(slug);
        const attrIds = catAttrs.map((ca) => ca.attributeId);
        setCategoryAttributesMap((prev) => ({ ...prev, [catId]: attrIds }));
      } catch {
        setCategoryAttributesMap((prev) => ({ ...prev, [catId]: [] }));
      } finally {
        setIsFetchingCategoryAttrs(false);
      }
    };

    if (categoryIdValue > 0) {
      setSelectedCategoryId(categoryIdValue);
      if (!categoryAttributesMap[categoryIdValue]) {
        fetchAttrs(categoryIdValue);
      }
    } else {
      setSelectedCategoryId(null);
    }
  }, [categoryIdValue, fetchCategoryAttributes, categories]);

  // Get attribute IDs that belong to the selected category
  const getCategoryAttributeIds = useCallback(
    (catId: number | null): number[] => {
      if (!catId || catId <= 0) return attributes.map((a) => a.id);
      return categoryAttributesMap[catId] || attributes.map((a) => a.id);
    },
    [attributes, categoryAttributesMap]
  );

  // Filter attributes based on selected category
  const filteredAttributes = attributes.filter((attr) => {
    if (!selectedCategoryId || selectedCategoryId <= 0) return true;
    const catAttrIds = getCategoryAttributeIds(selectedCategoryId);
    return catAttrIds.includes(attr.id);
  });

  // Filter attribute values based on filtered attributes
  const filteredAttributeValues = attributeValues.filter((av) => {
    if (!selectedCategoryId || selectedCategoryId <= 0) return true;
    const catAttrIds = getCategoryAttributeIds(selectedCategoryId);
    return catAttrIds.includes(av.attributeId);
  });

  // Reset variant attributes when category changes
  const handleCategoryChange = useCallback(
    (newCategoryId: number) => {
      setSelectedCategoryId(newCategoryId);
      const currentVariants = watch("variants") || [];
      const newVariants = currentVariants.map((variant) => ({
        ...variant,
        attributes: (variant.attributes || []).filter(
          (va) =>
            !selectedCategoryId ||
            selectedCategoryId <= 0 ||
            (categoryAttributesMap[newCategoryId] || []).includes(
              va.attributeId
            )
        ),
      }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setValue("variants", newVariants, { shouldValidate: false });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [watch, setValue, selectedCategoryId, categoryAttributesMap]
  );

// Function to scroll to the first error in the form
   const scrollToFirstError = useCallback(() => {
     const variantsErrors = errors.variants;
     if (variantsErrors && Array.isArray(variantsErrors)) {
       for (let i = 0; i < variantsErrors.length; i++) {
         const variantError = variantsErrors[i] as {
           price?: { message?: string };
           stock?: { message?: string };
           attributes?: { message?: string };
         } | undefined;
         if (variantError?.price || variantError?.stock || variantError?.attributes) {
           setExpandedIndex(i);
           variantCardRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" });
           return;
         }
       }
     }
     if (errors.name || errors.description || errors.categoryId || errors.slug) {
       basicInfoRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
     }
}, [errors, setExpandedIndex]);

   // Handle image removal with position reindexing
   const handleImageRemove = useCallback(
     (index: number) => {
       const current = watch("images") || [];
       const filtered = current?.filter((_, i) => i !== index);
       setValue(
         "images",
         filtered.map((img, i) => ({
           ...img,
           position: i,
         })),
         { shouldValidate: false }
       );
     },
     [watch, setValue]
   );

   const onSubmit = async (data: ProductFormData) => {
    try {
      const productData: CreateProductInput = {
        name: data.name,
        description: data.description,
        productDetailsHtml: data.productDetailsHtml || undefined,
        slug: data.slug,
        categoryId: data.categoryId,
        variants: data.variants.map((v) => ({
          sku: v.sku,
          price: v.price,
          stock: v.stock,
          attributes: v.attributes || [],
          ...(v.discountType &&
          v.discountValue !== null &&
          v.discountValue !== undefined
            ? {
                discountType: v.discountType,
                discountValue: v.discountValue,
                discountStart: v.discountStart || undefined,
                discountEnd: v.discountEnd || undefined,
              }
            : {}),
        })),
        images: data.images.map((img, index) => ({
          url: img.url,
          publicId: img.publicId,
          altText: img.altText,
          position: index,
        })),
      };

      const createdProduct = await createProduct(productData);

      toast({
        title: "Product created",
        description: `${data.name} has been created successfully.`,
      });
      router.push("/admin/products");
    } catch (error: any) {
      console.error("Error creating product:", error);

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

        <form onSubmit={handleSubmit(onSubmit, scrollToFirstError)} className="space-y-8">
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
                          onValueChange={(val) => {
                            field.onChange(Number(val));
                            handleCategoryChange(Number(val));
                          }}
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

                {/* Product Details HTML */}
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
                        No images added yet. Click Add Images to upload.
                      </p>
                    )}

                    <div className="grid gap-4 md:grid-cols-3">
                      {imageFields.map((field, index) => {
                        const uploadingInfo = uploadingImages.find(
                          (u) => u.index === index
                        );
                        const isUploading = !!uploadingInfo;

                        return (
                          <motion.div
                            key={field.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative group"
                          >
                            <div className="aspect-square bg-muted rounded-lg overflow-hidden border">
                              {isUploading ? (
                                <div className="w-full h-full flex items-center justify-center relative">
                                  <img
                                    src={uploadingInfo!.localUrl}
                                    alt={uploadingInfo!.fileName}
                                    className="w-full h-full object-cover opacity-50"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                  </div>
                                </div>
                              ) : (
                                <img
                                  src={watch(`images.${index}.url`)}
                                  alt={
                                    watch(`images.${index}.altText`) ||
                                    `Product image ${index + 1}`
                                  }
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <div className="mt-2 space-y-2">
                              <Input
                                placeholder="Alt text (optional)"
                                {...register(`images.${index}.altText`)}
                                className="text-xs"
                                disabled={isUploading}
                              />
<Button
                                 type="button"
                                 variant="ghost"
                                 size="sm"
                                 onClick={() => handleImageRemove(index)}
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
                    append({
                      sku: "",
                      price: 0,
                      stock: 0,
                      attributes: [],
                      discountType: null,
                      discountValue: null,
                      discountStart: null,
                      discountEnd: null,
                    })
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

              {/* Category selection warning */}
              {!selectedCategoryId || selectedCategoryId <= 0 ? (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm text-amber-600">
                  Please select a category first to configure variant
                  attributes.
                </div>
              ) : isFetchingCategoryAttrs ? (
                <div className="text-sm text-muted-foreground">
                  Loading category attributes...
                </div>
              ) : null}

              {/* Product variant */}
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <motion.div
                    key={field.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="grid gap-4 p-4 bg-muted/50 rounded-lg relative"
                    ref={(el: HTMLDivElement | null) => { variantCardRefs.current[index] = el; }}
                  >
                    {/* Attributes Section */}
                    <div className="">
                      <Label className="text-sm mb-2 block">Attributes</Label>
                      {selectedCategoryId &&
                      selectedCategoryId > 0 &&
                      !isFetchingCategoryAttrs &&
                      filteredAttributes.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No attributes assigned to this category. Assign
                          attributes in the{" "}
                          <a
                            href="/admin/categories"
                            className="text-accent hover:underline"
                          >
                            Categories
                          </a>{" "}
                          section.
                        </p>
                      ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                          {filteredAttributes.map((attr) => (
                            <div key={attr.id} className="space-y-2">
                              <Label className="">{attr.name}</Label>
                              <Controller
                                name={`variants.${index}.attributes`}
                                control={control}
                                render={({ field: attributeField }) => {
                                  const currentAttr =
                                    attributeField.value?.find(
                                      (a: { attributeId: number }) =>
                                        a.attributeId === attr.id
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
                                        )?.filter(
                                          (a: { attributeId: number }) =>
                                            a.attributeId !== attr.id
                                        );
                                        if (Number(val) > 0) {
                                          newAttrs.push({
                                            attributeId: attr.id,
                                            valueId: Number(val),
                                          });
                                        }
                                        attributeField.onChange(newAttrs);
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue
                                          placeholder={`Select ${attr.name}`}
                                        />
                                      </SelectTrigger>
                                      <SelectContent className="bg-white">
                                        {filteredAttributeValues
                                          .filter(
                                            (av) => av.attributeId === attr.id
                                          )
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
                      )}
                    </div>

                    {/* Duplicate variant error */}
                    {errors.variants?.[index]?.attributes && (
                      <p className="text-sm text-destructive flex items-center gap-1 mb-4">
                        <X className="w-4 h-4" />
                        {errors.variants[index]?.attributes?.message}
                      </p>
                    )}

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
