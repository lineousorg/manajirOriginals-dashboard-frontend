"use client";
import { useFieldArray, useForm, Controller } from "react-hook-form";
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
import { CreateProductInput, CreateVariantInput } from "@/types/product";

// Variant attribute schema
const attributeSchema = z.object({
  attributeId: z.number(),
  valueId: z.number(),
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
});

type ProductFormData = z.infer<typeof productSchema>;

const CreateProductPage = () => {
  const router = useRouter();
  const { createProduct } = useProducts();
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
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  // Auto-generate slug from name
  const nameValue = watch("name");
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
      };

      await createProduct(productData);
      toast({
        title: "Product created",
        description: `${data.name} has been created successfully.`,
      });
      router.push("/admin/products");
    } catch (error) {
      console.error("Error creating product:", error);
      toast({
        title: "Error",
        description: "Failed to create product. Please try again.",
        variant: "destructive",
      });
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
                <div className="space-y-2 md:col-span-2">
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
                    className="grid gap-4 p-4 bg-muted/50 rounded-lg relative"
                  >
                    <div className="grid gap-4 md:grid-cols-4">
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

                    {/* Attributes Section */}
                    <div className="border-t pt-4 mt-2">
                      <Label className="text-sm mb-2 block">
                        Attributes (optional)
                      </Label>
                      <div className="grid gap-4 md:grid-cols-2">
                        {mockAttributes.map((attr) => (
                          <div key={attr.id} className="space-y-2">
                            <Label className="text-xs">{attr.name}</Label>
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
                                    <SelectContent>
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
