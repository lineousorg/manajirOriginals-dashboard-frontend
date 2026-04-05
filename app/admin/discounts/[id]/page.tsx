"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  X,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { PageTransition, FadeIn } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Discount,
  DiscountType,
  DiscountTarget,
  UpdateDiscountInput,
} from "@/types/discount";
import { useDiscounts } from "@/hooks/useDiscounts";
import { categoriesApi } from "@/services/api";
import { Category } from "@/types/category";
import { productsApi } from "@/services/api";
import { ProductVariant as BaseProductVariant } from "@/types/product";

// Extended variant type with product name
interface ExtendedProductVariant extends BaseProductVariant {
  productName: string;
}

const EditDiscountPage = () => {
  const params = useParams();
  const router = useRouter();
  const discountId = parseInt(params.id as string);

  const { getDiscountById, updateDiscount, deleteDiscount, isLoading } = useDiscounts();

  const [discount, setDiscount] = useState<Discount | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: DiscountType.PERCENTAGE,
    value: "",
    target: DiscountTarget.ALL_PRODUCTS,
    minOrderAmount: "",
    maxDiscountAmt: "",
    maxUsage: "",
    isActive: true,
    startsAt: "",
    expiresAt: "",
    categoryId: "",
    variantIds: [] as number[],
  });

  // Categories and variants
  const [categories, setCategories] = useState<Category[]>([]);
  const [variants, setVariants] = useState<ExtendedProductVariant[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const { toast } = useToast();

  // Fetch discount data and categories/variants
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [discountData, cats, prods] = await Promise.all([
          getDiscountById(discountId),
          categoriesApi.getAll(),
          productsApi.getAll(),
        ]);

        setDiscount(discountData);
        setCategories(cats);

        // Flatten all variants
        const allVariants = prods.flatMap((p) =>
          p.variants.map((v) => ({
            ...v,
            productName: p.name,
          }))
        );
        setVariants(allVariants);

        // Set form data
        setFormData({
          name: discountData.name,
          code: discountData.code || "",
          type: discountData.type,
          value: discountData.value.toString(),
          target: discountData.target,
          minOrderAmount: discountData.minOrderAmount?.toString() || "",
          maxDiscountAmt: discountData.maxDiscountAmt?.toString() || "",
          maxUsage: discountData.maxUsage?.toString() || "",
          isActive: discountData.isActive,
          startsAt: discountData.startsAt.split("T")[0],
          expiresAt: discountData.expiresAt ? discountData.expiresAt.split("T")[0] : "",
          categoryId: discountData.categoryId?.toString() || "",
          variantIds: discountData.variants.map((v) => v.id),
        });
      } catch (error) {
        console.error("Failed to fetch discount:", error);
        toast({
          title: "Error",
          description: "Failed to load discount data.",
          variant: "destructive",
        });
        router.push("/admin/discounts");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [discountId, getDiscountById, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Discount name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.value || parseFloat(formData.value) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid discount value",
        variant: "destructive",
      });
      return;
    }

    if (!formData.startsAt) {
      toast({
        title: "Error",
        description: "Start date is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const input: UpdateDiscountInput = {
        name: formData.name,
        code: formData.code || undefined,
        type: formData.type,
        value: parseFloat(formData.value),
        target: formData.target,
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : undefined,
        maxDiscountAmt: formData.maxDiscountAmt ? parseFloat(formData.maxDiscountAmt) : undefined,
        maxUsage: formData.maxUsage ? parseInt(formData.maxUsage) : undefined,
        isActive: formData.isActive,
        startsAt: formData.startsAt,
        expiresAt: formData.expiresAt || undefined,
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : undefined,
        variantIds: formData.variantIds.length > 0 ? formData.variantIds : undefined,
      };

      await updateDiscount(discountId, input);
      toast({
        title: "Discount updated",
        description: `${formData.name} has been updated successfully.`,
      });
      router.push("/admin/discounts");
    } catch (error) {
      console.log(error);
      toast({
        title: "Error",
        description: "Failed to update discount. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!discount) return;

    setIsDeleting(true);
    try {
      await deleteDiscount(discountId);
      toast({
        title: "Discount deleted",
        description: `${discount.name} has been deleted successfully.`,
      });
      router.push("/admin/discounts");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete discount. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoadingData) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PageTransition>
    );
  }

  if (!discount) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Discount not found</h2>
          <Button onClick={() => router.push("/admin/discounts")}>
            Back to Discounts
          </Button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <FadeIn>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push("/admin/discounts")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Edit Discount</h1>
                <p className="text-muted-foreground mt-1">
                  Update discount details for {discount.name}
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </FadeIn>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Section A: Basic Info */}
              <FadeIn delay={0.1}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Basic Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Discount Name *</Label>
                        <Input
                          id="name"
                          placeholder="e.g., Summer Sale 2026"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="code">Discount Code (Optional)</Label>
                        <Input
                          id="code"
                          placeholder="e.g., SUMMER20"
                          value={formData.code}
                          onChange={(e) =>
                            setFormData({ ...formData, code: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="type">Discount Type</Label>
                        <select
                          id="type"
                          className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
                          value={formData.type}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              type: e.target.value as DiscountType,
                            })
                          }
                        >
                          <option value={DiscountType.PERCENTAGE}>
                            Percentage (%)
                          </option>
                          <option value={DiscountType.FIXED}>
                            Fixed Amount (৳)
                          </option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="value">
                          Value{" "}
                          {formData.type === DiscountType.PERCENTAGE ? "(%)" : "(৳)"}
                        </Label>
                        <Input
                          id="value"
                          type="number"
                          min="0"
                          placeholder={
                            formData.type === DiscountType.PERCENTAGE ? "15" : "500"
                          }
                          value={formData.value}
                          onChange={(e) =>
                            setFormData({ ...formData, value: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>

              {/* Section B: Targeting */}
              <FadeIn delay={0.2}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Targeting</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="target">Apply To</Label>
                      <select
                        id="target"
                        className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
                        value={formData.target}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            target: e.target.value as DiscountTarget,
                            categoryId: "",
                            variantIds: [],
                          })
                        }
                      >
                        <option value={DiscountTarget.ALL_PRODUCTS}>
                          All Products
                        </option>
                        <option value={DiscountTarget.SPECIFIC_CATEGORY}>
                          Specific Category
                        </option>
                        <option value={DiscountTarget.SPECIFIC_VARIANTS}>
                          Specific Variants
                        </option>
                      </select>
                    </div>

                    {/* Category Selection */}
                    {formData.target === DiscountTarget.SPECIFIC_CATEGORY && (
                      <div className="space-y-2">
                        <Label htmlFor="category">Select Category</Label>
                        <select
                          id="category"
                          className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
                          value={formData.categoryId}
                          onChange={(e) =>
                            setFormData({ ...formData, categoryId: e.target.value })
                          }
                        >
                          <option value="">Select a category</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Variants Selection */}
                    {formData.target === DiscountTarget.SPECIFIC_VARIANTS && (
                      <div className="space-y-2">
                        <Label>Select Variants</Label>
                        <div className="border rounded-md max-h-48 overflow-y-auto p-2 space-y-1">
                          {variants.length === 0 ? (
                            <p className="text-muted-foreground text-sm p-2">
                              No variants available
                            </p>
                          ) : (
                            variants.map((variant: ExtendedProductVariant) => (
                              <label
                                key={variant.id}
                                className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.variantIds.includes(variant.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormData({
                                        ...formData,
                                        variantIds: [
                                          ...formData.variantIds,
                                          variant.id,
                                        ],
                                      });
                                    } else {
                                      setFormData({
                                        ...formData,
                                        variantIds: formData.variantIds.filter(
                                          (id) => id !== variant.id
                                        ),
                                      });
                                    }
                                  }}
                                  className="rounded border-gray-300"
                                />
                                <span className="text-sm">
                                  {variant.productName} - {variant.sku} - ৳
                                  {variant.price.toLocaleString()}
                                </span>
                              </label>
                            ))
                          )}
                        </div>
                        {formData.variantIds.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            {formData.variantIds.length} variant(s) selected
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </FadeIn>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Section C: Rules */}
              <FadeIn delay={0.3}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Rules</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="minOrderAmount">
                          Minimum Order Amount (৳)
                        </Label>
                        <Input
                          id="minOrderAmount"
                          type="number"
                          min="0"
                          placeholder="e.g., 1000"
                          value={formData.minOrderAmount}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              minOrderAmount: e.target.value,
                            })
                          }
                        />
                      </div>
                      {formData.type === DiscountType.PERCENTAGE && (
                        <div className="space-y-2">
                          <Label htmlFor="maxDiscountAmt">
                            Maximum Discount (৳)
                          </Label>
                          <Input
                            id="maxDiscountAmt"
                            type="number"
                            min="0"
                            placeholder="e.g., 200 (cap)"
                            value={formData.maxDiscountAmt}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                maxDiscountAmt: e.target.value,
                              })
                            }
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="maxUsage">Maximum Usage (Optional)</Label>
                        <Input
                          id="maxUsage"
                          type="number"
                          min="1"
                          placeholder="e.g., 100"
                          value={formData.maxUsage}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              maxUsage: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>

              {/* Section D: Validity */}
              <FadeIn delay={0.4}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Validity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="startsAt">Start Date *</Label>
                        <Input
                          id="startsAt"
                          type="date"
                          value={formData.startsAt}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              startsAt: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expiresAt">End Date (Optional)</Label>
                        <Input
                          id="expiresAt"
                          type="date"
                          value={formData.expiresAt}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              expiresAt: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isActive: e.target.checked,
                          })
                        }
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="isActive" className="font-normal">
                        Active
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>

              {/* Submit Button */}
              <FadeIn delay={0.5}>
                <div className="flex items-center justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/admin/discounts")}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                    disabled={isSubmitting}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </FadeIn>
            </div>
          </div>
        </form>
      </div>
    </PageTransition>
  );
};

export default EditDiscountPage;