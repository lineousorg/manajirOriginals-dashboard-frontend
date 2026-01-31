"use client"
import { useEffect } from "react";
import { useFieldArray, useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Plus, Trash2, ArrowLeft, Loader2 } from "lucide-react";
import { UpdateProductInput, ProductVariant } from "@/types/product";
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
import { categories } from "../../add_product/page";

const variantSchema = z.object({
    size: z.string().min(1, "Size is required"),
    color: z.string().min(1, "Color is required"),
    price: z.number().min(0, "Price must be positive"),
    stock: z.number().min(0, "Stock must be positive"),
}).passthrough();


export const productSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().min(1).max(500),
    price: z.number().min(0),
    categoryId: z.number().int().positive("Category is required"),
    isFeatured: z.boolean(),
    isBest: z.boolean(),
    isActive: z.boolean(),
    variants: z.array(variantSchema).min(1),
});


type ProductFormData = z.infer<typeof productSchema>;

const EditProductPage = () => {
    const params = useParams<{ id: string }>();
    const id = params?.id; // id will be string | undefined
    const router = useRouter();
    const { product, isLoading: isLoadingProduct, error } = useProduct(id);
    const { updateProduct } = useProducts();
    const { toast } = useToast();

    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<ProductFormData>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: "",
            description: "",
            price: 0,
            categoryId: 0,
            isFeatured: false,
            isBest: false,
            isActive: true,
            variants: [{ size: "", color: "", price: 0, stock: 0 }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "variants",
    });

    useEffect(() => {
        if (product) {
            reset({
                name: product.name,
                description: product.description,
                price: product.price,
                categoryId: product.categoryId,
                isFeatured: product.isFeatured,
                isBest: product.isBest,
                isActive: product.isActive,
                variants: product.variants.map((v) => ({
                    size: v.size,
                    color: v.color,
                    price: v.price,
                    stock: v.stock,
                })),

            });
        }
    }, [product, reset]);

    const onSubmit = async (data: ProductFormData) => {
        console.log("Submitting data:", data);
        if (!id) return;

        try {
            const updateData: UpdateProductInput = {
                name: data.name,
                description: data.description,
                price: data.price,
                categoryId: data.categoryId,
                isFeatured: data.isFeatured,
                isBest: data.isBest,
                isActive: data.isActive,
                variants: data.variants.map(
                    (v): ProductVariant => ({
                        size: v.size,
                        color: v.color,
                        price: v.price,
                        stock: v.stock,
                    }),
                ),
            };
            console.log("Update payload:", updateData);
            await updateProduct(id, updateData);
            toast({
                title: "Product updated",
                description: `${data.name} has been updated successfully.`,
            });
            router.push("/admin/products");
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update product. Please try again.",
                variant: "destructive",
            });
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
                        The product youre looking for doesnt exist.
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

                                <div className="space-y-2">
                                    <Label htmlFor="price">Price ($)</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        {...register("price", { valueAsNumber: true })}
                                        className={errors.price ? "border-destructive" : ""}
                                    />
                                    {errors.price && (
                                        <p className="text-sm text-destructive">
                                            {errors.price.message}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Controller
                                        name="categoryId"
                                        control={control}
                                        render={({ field }) => (
                                            <Select
                                                value={field.value ? String(field.value) : ""}
                                                onValueChange={(value) => field.onChange(Number(value))}
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
                                                        <SelectItem value={String(cat.id)}>
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

                    {/* Flags */}
                    <FadeIn delay={0.2}>
                        <div className="bg-card rounded-lg border p-6 shadow-card space-y-6">
                            <h2 className="text-lg font-semibold">Product Flags</h2>

                            <div className="space-y-4">
                                <Controller
                                    name="isFeatured"
                                    control={control}
                                    render={({ field }) => (
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label htmlFor="isFeatured">Featured Product</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Show this product in the featured section
                                                </p>
                                            </div>
                                            <Switch
                                                id="isFeatured"
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </div>
                                    )}
                                />

                                <Controller
                                    name="isBest"
                                    control={control}
                                    render={({ field }) => (
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label htmlFor="isBest">Best Seller</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Mark as a best-selling product
                                                </p>
                                            </div>
                                            <Switch
                                                id="isBest"
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </div>
                                    )}
                                />

                                <Controller
                                    name="isActive"
                                    control={control}
                                    render={({ field }) => (
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label htmlFor="isActive">Active</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Make this product visible to customers
                                                </p>
                                            </div>
                                            <Switch
                                                id="isActive"
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </div>
                                    )}
                                />
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
                                        append({ size: "", color: "", price: 0, stock: 0 })
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
                                            <Label>Size</Label>
                                            <Input
                                                placeholder="e.g., M, L, XL"
                                                {...register(`variants.${index}.size`)}
                                                className={
                                                    errors.variants?.[index]?.size
                                                        ? "border-destructive"
                                                        : ""
                                                }
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Color</Label>
                                            <Input
                                                placeholder="e.g., Black"
                                                {...register(`variants.${index}.color`)}
                                                className={
                                                    errors.variants?.[index]?.color
                                                        ? "border-destructive"
                                                        : ""
                                                }
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
