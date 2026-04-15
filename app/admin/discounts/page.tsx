"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Trash2,
  MoreHorizontal,
  Percent,
  Pencil,
  X,
  Check,
} from "lucide-react";
import { useDiscounts } from "@/hooks/useDiscounts";
import { PageTransition, FadeIn } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { TableSkeleton } from "@/components/ui/skeleton-card";
import { useToast } from "@/hooks/use-toast";
import {
  Discount,
  DiscountType,
  DiscountTarget,
  CreateDiscountInput,
} from "@/types/discount";
import { categoriesApi } from "@/services/api";
import { Category } from "@/types/category";
import { productsApi } from "@/services/api";
import { ProductVariant as BaseProductVariant } from "@/types/product";
import Link from "next/link";

// Extended variant type with product name
interface ExtendedProductVariant extends BaseProductVariant {
  productName: string;
}

const DiscountsPage = () => {
  const {
    discounts,
    isLoading,
    createDiscount,
    deleteDiscount,
    toggleDiscountActive,
  } = useDiscounts();

  const [searchQuery, setSearchQuery] = useState("");

  // Create dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    startsAt: new Date().toISOString().split("T")[0],
    expiresAt: "",
    categoryId: "",
    variantIds: [] as number[],
  });

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [discountToDelete, setDiscountToDelete] = useState<number | null>(null);

  // Categories for dropdown
  const [categories, setCategories] = useState<Category[]>([]);
  const [variants, setVariants] = useState<ExtendedProductVariant[]>([]);

  const { toast } = useToast();

  // Fetch categories and variants when dialog opens
  const fetchCategoriesAndVariants = async () => {
    try {
      const [cats, prods] = await Promise.all([
        categoriesApi.getAll(),
        productsApi.getAll(),
      ]);
      setCategories(cats);
      // Flatten all variants from all products
      const allVariants = prods.data.flatMap((p) =>
        p.variants.map((v) => ({
          ...v,
          productName: p.name,
        }))
      );
      setVariants(allVariants);
    } catch (error) {
      console.error("Failed to fetch categories and products:", error);
    }
  };

  const handleOpenCreateDialog = async () => {
    await fetchCategoriesAndVariants();
    setCreateDialogOpen(true);
  };

  // Filter discounts based on search
  const filteredDiscounts = discounts?.filter((discount) =>
    discount.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (discount.code && discount.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getTargetLabel = (target: DiscountTarget) => {
    switch (target) {
      case DiscountTarget.ALL_PRODUCTS:
        return "All Products";
      case DiscountTarget.SPECIFIC_CATEGORY:
        return "Specific Category";
      case DiscountTarget.SPECIFIC_VARIANTS:
        return "Specific Variants";
      default:
        return target;
    }
  };

  const getStatusBadge = (discount: Discount) => {
    const now = new Date();
    const startDate = new Date(discount.startsAt);
    const endDate = discount.expiresAt ? new Date(discount.expiresAt) : null;

    // Check if expired
    if (endDate && endDate < now) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Expired
        </span>
      );
    }

    // Check if scheduled (not started yet)
    if (startDate > now) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Scheduled
        </span>
      );
    }

    // Active
    if (discount.isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Active
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Inactive
      </span>
    );
  };

  const handleCreateDiscount = async () => {
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
      const input: CreateDiscountInput = {
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

      await createDiscount(input);
      toast({
        title: "Discount created",
        description: `${formData.name} has been created successfully.`,
      });
      setCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.log(error);
      toast({
        title: "Error",
        description: "Failed to create discount. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      type: DiscountType.PERCENTAGE,
      value: "",
      target: DiscountTarget.ALL_PRODUCTS,
      minOrderAmount: "",
      maxDiscountAmt: "",
      maxUsage: "",
      isActive: true,
      startsAt: new Date().toISOString().split("T")[0],
      expiresAt: "",
      categoryId: "",
      variantIds: [],
    });
  };

  const handleDeleteClick = (id: number) => {
    setDiscountToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (discountToDelete) {
      try {
        const discount = discounts.find((d) => d.id === discountToDelete);
        await deleteDiscount(discountToDelete);
        toast({
          title: "Discount deleted",
          description: `${discount?.name} has been deleted successfully.`,
        });
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        const backendMessage = err?.response?.data?.message;
        toast({
          title: "Error",
          description: backendMessage || "Failed to delete discount. Please try again.",
          variant: "destructive",
        });
      }
    }
    setDeleteDialogOpen(false);
    setDiscountToDelete(null);
  };

  const getDiscountToDelete = () => {
    if (!discountToDelete) return null;
    return discounts.find((d) => d.id === discountToDelete);
  };

  const handleToggleActive = async (id: number) => {
    try {
      const updated = await toggleDiscountActive(id);
      toast({
        title: updated.isActive ? "Discount activated" : "Discount deactivated",
        description: `${updated.name} is now ${updated.isActive ? "active" : "inactive"}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update discount status.",
        variant: "destructive",
      });
    }
  };

  const formatValue = (discount: Discount) => {
    if (discount.type === DiscountType.PERCENTAGE) {
      return `${discount.value}%`;
    }
    return `৳${discount.value.toLocaleString()}`;
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <FadeIn>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Discounts</h1>
              <p className="text-muted-foreground mt-1">
                Manage your store discounts and promotions
              </p>
            </div>
            <Button
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              onClick={handleOpenCreateDialog}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Discount
            </Button>
          </div>
        </FadeIn>

        {/* Search */}
        <FadeIn delay={0.1}>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search discounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </FadeIn>

        {/* Table */}
        <FadeIn delay={0.2}>
          {isLoading ? (
            <TableSkeleton rows={5} />
          ) : filteredDiscounts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Percent className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No discounts found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Get started by adding your first discount"}
              </p>
              {!searchQuery && (
                <Button
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  onClick={handleOpenCreateDialog}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Discount
                </Button>
              )}
            </motion.div>
          ) : (
            <div className="border rounded-lg overflow-hidden bg-card shadow-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {filteredDiscounts.map((discount) => (
                      <motion.tr
                        key={discount.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="font-medium">
                          {discount.name}
                        </TableCell>
                        <TableCell>
                          {discount.code ? (
                            <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                              {discount.code}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {discount.type === DiscountType.PERCENTAGE ? (
                            <span className="text-sm">Percentage</span>
                          ) : (
                            <span className="text-sm">Fixed</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatValue(discount)}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {getTargetLabel(discount.target)}
                            {discount.target === DiscountTarget.SPECIFIC_CATEGORY &&
                              discount.category && (
                                <span className="text-muted-foreground ml-1">
                                  ({discount.category.name})
                                </span>
                              )}
                            {discount.target === DiscountTarget.SPECIFIC_VARIANTS &&
                              discount.variants.length > 0 && (
                                <span className="text-muted-foreground ml-1">
                                  ({discount.variants.length} items)
                                </span>
                              )}
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(discount)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/admin/discounts/${discount.id}`}>
                              <Button variant="ghost" size="sm">
                                <Pencil className="w-4 h-4" />
                              </Button>
                            </Link>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleToggleActive(discount.id)}
                                >
                                  {discount.isActive ? "Deactivate" : "Activate"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteClick(discount.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}
        </FadeIn>
      </div>

      {/* Create Discount Dialog */}
      <Dialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Discount</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Section A: Basic Info */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                Basic Info
              </h3>
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
                    <option value={DiscountType.PERCENTAGE}>Percentage (%)</option>
                    <option value={DiscountType.FIXED}>Fixed Amount (৳)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">
                    Value {formData.type === DiscountType.PERCENTAGE ? "(%)" : "(৳)"}
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    min="0"
                    placeholder={formData.type === DiscountType.PERCENTAGE ? "15" : "500"}
                    value={formData.value}
                    onChange={(e) =>
                      setFormData({ ...formData, value: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Section B: Targeting */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                Targeting
              </h3>
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
                  <option value={DiscountTarget.ALL_PRODUCTS}>All Products</option>
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
                      variants.map((variant) => (
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
                                  variantIds: [...formData.variantIds, variant.id],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  variantIds: formData.variantIds?.filter(
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
            </div>

            {/* Section C: Rules */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                Rules
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="minOrderAmount">Minimum Order Amount (৳)</Label>
                  <Input
                    id="minOrderAmount"
                    type="number"
                    min="0"
                    placeholder="e.g., 1000"
                    value={formData.minOrderAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, minOrderAmount: e.target.value })
                    }
                  />
                </div>
                {formData.type === DiscountType.PERCENTAGE && (
                  <div className="space-y-2">
                    <Label htmlFor="maxDiscountAmt">Maximum Discount (৳)</Label>
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
                      setFormData({ ...formData, maxUsage: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Section D: Validity */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                Validity
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startsAt">Start Date *</Label>
                  <Input
                    id="startsAt"
                    type="date"
                    value={formData.startsAt}
                    onChange={(e) =>
                      setFormData({ ...formData, startsAt: e.target.value })
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
                      setFormData({ ...formData, expiresAt: e.target.value })
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
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isActive" className="font-normal">
                  Active immediately
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              onClick={handleCreateDiscount}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Discount"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setDiscountToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Discount</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{getDiscountToDelete()?.name}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
};

export default DiscountsPage;