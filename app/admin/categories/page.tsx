"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  FolderTree,
  Trash2,
  MoreHorizontal,
  Tag,
  Info,
  Loader2,
} from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { useAttributes } from "@/hooks/useAttributes";
import { useAttributeValues } from "@/hooks/useAttributeValues";
import { PageTransition, FadeIn } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/ui/skeleton-card";
import { useToast } from "@/hooks/use-toast";
import CategoryTable from "@/components/categories/CategoryTable";
import CategoryForms from "@/components/categories/CategoryForms";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { CreateCategoryInput, CategoryImage, Category } from "@/types/category";
import { CreateCategoryAttributeInput } from "@/types/attribute";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import ValueSelectionDialog from "@/components/categories/ValueSelectionDialog";

const CategoriesPage = () => {
  const {
    categories,
    isLoading,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,
    getCategoryAttributes,
    assignAttributeToCategory,
    updateCategoryAttribute,
    removeAttributeFromCategory,
  } = useCategories();

  const { attributes, isLoading: attributesLoading } = useAttributes();
  const { getValuesByAttributeId } = useAttributeValues();

  const [searchQuery, setSearchQuery] = useState("");

  // Expanded category state
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);

  // Create form state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newParentId, setNewParentId] = useState<number | null>(null);
  const [newImages, setNewImages] = useState<CategoryImage[]>([]);

  // Edit form state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editImages, setEditImages] = useState<CategoryImage[]>([]);

  // Delete form state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);

  // Attribute assignment state
  const [attributeModalOpen, setAttributeModalOpen] = useState(false);
  const [categoryForAttributes, setCategoryForAttributes] =
    useState<Category | null>(null);
  const [categoryAttributes, setCategoryAttributes] = useState<
    Record<
      number,
      {
        isVariantSelectable: boolean;
        isRequired: boolean;
        valueRestrictionMode?: "ALL" | "SELECTED" | "NONE";
        valueIds?: number[];
        attribute?: {
          id: number;
          name: string;
          values?: {
            id: number;
            value: string;
            attributeId: number;
            isActive: boolean;
            isDeleted: boolean;
            deletedAt: string | null;
          }[];
        };
      }
    >
  >({});
  const [initialCategoryAttributes, setInitialCategoryAttributes] = useState<
    Record<
      number,
      {
        isVariantSelectable: boolean;
        isRequired: boolean;
        valueRestrictionMode?: "ALL" | "SELECTED" | "NONE";
        valueIds?: number[];
        attribute?: {
          id: number;
          name: string;
          values?: {
            id: number;
            value: string;
            attributeId: number;
            isActive: boolean;
            isDeleted: boolean;
            deletedAt: string | null;
          }[];
        };
      }
    >
  >({});
  const [isFetchingCategoryAttributes, setIsFetchingCategoryAttributes] =
    useState(false);
  const [isSavingAttributes, setIsSavingAttributes] = useState(false);

  // Value selection dialog state
  const [valueSelectionDialogOpen, setValueSelectionDialogOpen] =
    useState(false);
  const [valueSelectionAttribute, setValueSelectionAttribute] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const { toast } = useToast();

  // Filter categories based on search
  const filteredCategories = categories?.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Handlers
  const handleToggleExpand = (id: number | null) => {
    setExpandedCategory(id);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }

    if (!newSlug.trim()) {
      toast({
        title: "Error",
        description: "Category slug is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const input: CreateCategoryInput = {
        name: newCategoryName,
        slug: newSlug,
        parentId: newParentId,
        images: newImages.map((img, index) => ({
          url: img.url,
          altText: img.altText,
          position: index,
        })),
      };

      await createCategory(input);
      toast({
        title: "Category created",
        description: `${newCategoryName} has been created successfully.`,
      });
      setCreateDialogOpen(false);
      setNewCategoryName("");
      setNewSlug("");
      setNewParentId(null);
      setNewImages([]);
    } catch (error) {
      console.log(error);
      toast({
        title: "Error",
        description: "Failed to create category. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditClick = (category: Category) => {
    setCategoryToEdit(category);
    setEditCategoryName(category.name);
    setEditImages(category.images || []);
    setEditDialogOpen(true);
  };

  const handleUpdateCategory = async () => {
    if (!categoryToEdit) return;

    if (!editCategoryName.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateCategory(categoryToEdit.id, {
        name: editCategoryName,
        images: editImages.map((img, index) => ({
          url: img.url,
          altText: img.altText,
          position: index,
        })),
      });
      toast({
        title: "Category updated",
        description: `${editCategoryName} has been updated successfully.`,
      });
      setEditDialogOpen(false);
      setCategoryToEdit(null);
      setEditCategoryName("");
      setEditImages([]);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const backendMessage = err?.response?.data?.message;
      toast({
        title: "Error",
        description:
          backendMessage || "Failed to update category. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (id: number) => {
    setCategoryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (categoryToDelete) {
      try {
        const category = categories.find((c) => c.id === categoryToDelete);
        await deleteCategory(categoryToDelete);
        toast({
          title: "Category deleted",
          description: `${category?.name} has been deleted successfully.`,
        });
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        const backendMessage = err?.response?.data?.message;
        toast({
          title: "Error",
          description:
            backendMessage || "Failed to delete category. Please try again.",
          variant: "destructive",
        });
      }
    }
    setDeleteDialogOpen(false);
    setCategoryToDelete(null);
  };

  const handleToggleStatusClick = async (id: number) => {
    try {
      const category = categories.find((c) => c.id === id);
      const updated = await toggleCategoryStatus(id);
      toast({
        title: "Category status updated",
        description: `${category?.name} is now ${
          updated.isActive ? "active" : "inactive"
        }.`,
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const backendMessage = err?.response?.data?.message;
      toast({
        title: "Error",
        description:
          backendMessage ||
          "Failed to toggle category status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleNewImagesChange = (
    fn: (prev: CategoryImage[]) => CategoryImage[],
  ) => {
    setNewImages(fn);
  };

  const handleEditImagesChange = (
    fn: (prev: CategoryImage[]) => CategoryImage[],
  ) => {
    setEditImages(fn);
  };

  // Handle attribute assignment
  const handleManageAttributes = async (category: Category) => {
    setCategoryForAttributes(category);
    setAttributeModalOpen(true);
    setIsFetchingCategoryAttributes(true);

    // Fetch current category attributes
    try {
      const attrs = await getCategoryAttributes(category.slug);
      const initialAttrs: Record<
        number,
        {
          isVariantSelectable: boolean;
          isRequired: boolean;
          valueRestrictionMode?: "ALL" | "SELECTED" | "NONE";
          valueIds?: number[];
          attribute?: {
            id: number;
            name: string;
            values: {
              id: number;
              value: string;
              attributeId: number;
              isActive: boolean;
              isDeleted: boolean;
              deletedAt: string | null;
            }[];
          };
        }
      > = {};

      // Process each attribute and fetch values if not included in response
      for (const ca of attrs) {
        let attributeValues = ca.attribute?.values || [];

        // If values not included in response, fetch them separately
        if ((!attributeValues || attributeValues.length === 0) && ca.attribute) {
          try {
            attributeValues = await getValuesByAttributeId(ca.attribute.id);
          } catch (err) {
            console.error(
              `Failed to fetch values for attribute ${ca.attribute.id}:`,
              err
            );
          }
        }

        initialAttrs[ca.attributeId] = {
          isVariantSelectable: ca.isVariantSelectable,
          isRequired: ca.isRequired,
          valueRestrictionMode: ca.valueRestrictionMode ?? "ALL",
          valueIds: ca.valueIds ?? [],
          attribute: ca.attribute
            ? {
                id: ca.attribute.id,
                name: ca.attribute.name,
                values: attributeValues.map((v) => ({
                  id: v.id,
                  value: v.value,
                  attributeId: v.attributeId,
                  isActive: v.isActive,
                  isDeleted: v.isDeleted,
                  deletedAt: v.deletedAt,
                })),
              }
            : undefined,
        };
      }

      setCategoryAttributes(initialAttrs);
      setInitialCategoryAttributes(initialAttrs);
    } catch (error) {
      console.error("Failed to fetch category attributes:", error);
    } finally {
      setIsFetchingCategoryAttributes(false);
    }
  };

  const handleAttributeToggle = (
    attributeId: number,
    field: "isVariantSelectable" | "isRequired",
  ) => {
    setCategoryAttributes((prev) => {
      // If this is a new attribute assignment, fetch its values
      if (!prev[attributeId]) {
        const attribute = attributes.find((a) => a.id === attributeId);
        if (attribute) {
          // We'll fetch values asynchronously after setting the initial state
          getValuesByAttributeId(attributeId)
            .then((values) => {
              setCategoryAttributes((prev2) => ({
                ...prev2,
                [attributeId]: {
                  ...prev2[attributeId],
                  attribute: {
                    id: attribute.id,
                    name: attribute.name,
                    values: values.map((v) => ({
                      id: v.id,
                      value: v.value,
                      attributeId: v.attributeId,
                      isActive: v.isActive,
                      isDeleted: v.isDeleted,
                      deletedAt: v.deletedAt,
                    })),
                  },
                },
              }));
            })
            .catch((err) => {
              console.error(
                `Failed to fetch values for attribute ${attributeId}:`,
                err
              );
            });
        }
      }
      return {
        ...prev,
        [attributeId]: {
          ...prev[attributeId],
          [field]: !prev[attributeId]?.[field],
        },
      };
    });
  };

  const handleManageAttributeValues = async (attributeId: number, name: string) => {
    // Check if values are already loaded for this attribute
    const currentAttr = categoryAttributes[attributeId];
    if (
      currentAttr?.attribute &&
      (!currentAttr.attribute.values || currentAttr.attribute.values.length === 0)
    ) {
      // Fetch values for this attribute
      try {
        const values = await getValuesByAttributeId(attributeId);
        setCategoryAttributes((prev) => ({
          ...prev,
          [attributeId]: {
            ...prev[attributeId],
            attribute: prev[attributeId]?.attribute
              ? {
                  id: prev[attributeId].attribute!.id,
                  name: prev[attributeId].attribute!.name,
                  values: values.map((v) => ({
                    id: v.id,
                    value: v.value,
                    attributeId: v.attributeId,
                    isActive: v.isActive,
                    isDeleted: v.isDeleted,
                    deletedAt: v.deletedAt,
                  })),
                }
              : undefined,
          },
        }));
      } catch (err) {
        console.error(`Failed to fetch values for attribute ${attributeId}:`, err);
      }
    }
    setValueSelectionAttribute({ id: attributeId, name });
    setValueSelectionDialogOpen(true);
  };

  const handleSaveAttributes = async () => {
    if (!categoryForAttributes) return;
    const categorySlug = categoryForAttributes.slug;
    if (!categorySlug) return;

    setIsSavingAttributes(true);
    try {
      const currentAttrs = await getCategoryAttributes(categorySlug);
      const currentAttrIds = new Set(currentAttrs.map((ca) => ca.attributeId));
      const newAttrIds = new Set(Object.keys(categoryAttributes).map(Number));

      // Process each attribute in the new state
      for (const [attrIdStr, settings] of Object.entries(categoryAttributes)) {
        const attrId = Number(attrIdStr);
        const initial = initialCategoryAttributes[attrId];
        const input: CreateCategoryAttributeInput = {
          attributeId: attrId,
          ...settings,
        };

        if (!initial) {
          // New assignment - use POST
          await assignAttributeToCategory(categorySlug, input);
        } else {
          // Check if fields changed
          const hasChanged =
            initial.isVariantSelectable !== settings.isVariantSelectable ||
            initial.isRequired !== settings.isRequired ||
            initial.valueRestrictionMode !== settings.valueRestrictionMode ||
            JSON.stringify(initial.valueIds ?? []) !==
              JSON.stringify(settings.valueIds ?? []);

          if (hasChanged) {
            // Update existing - use PATCH
            await updateCategoryAttribute(categorySlug, attrId, {
              isVariantSelectable: settings.isVariantSelectable,
              isRequired: settings.isRequired,
              valueRestrictionMode: settings.valueRestrictionMode,
              valueIds: settings.valueIds,
            });
          }
        }
      }

      // Remove attributes that were unassigned
      for (const ca of currentAttrs) {
        if (!newAttrIds.has(ca.attributeId)) {
          await removeAttributeFromCategory(categorySlug, ca.attributeId);
        }
      }

      toast({
        title: "Attributes updated",
        description: `Attributes for ${categoryForAttributes.name} have been updated.`,
      });
      setAttributeModalOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update attributes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingAttributes(false);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <FadeIn className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Categories</h1>
            <p className="text-muted-foreground">
              Manage your product categories
            </p>
          </div>
          <Button
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </FadeIn>

        {/* Filters */}
        <FadeIn delay={0.1} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </FadeIn>

        {/* Table or Empty State */}
        <FadeIn delay={0.2}>
          {isLoading ? (
            <TableSkeleton rows={5} />
          ) : filteredCategories.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FolderTree className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No categories found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Get started by adding your first category"}
              </p>
              {!searchQuery && (
                <Button
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              )}
            </motion.div>
          ) : (
            <CategoryTable
              categories={filteredCategories}
              expandedCategory={expandedCategory}
              onToggleExpand={handleToggleExpand}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onToggleStatus={handleToggleStatusClick}
              onManageAttributes={handleManageAttributes}
            />
          )}
        </FadeIn>

        {/* Forms */}
        <CategoryForms
          createDialogOpen={createDialogOpen}
          onCreateDialogOpenChange={setCreateDialogOpen}
          newCategoryName={newCategoryName}
          onNewCategoryNameChange={setNewCategoryName}
          newSlug={newSlug}
          onNewSlugChange={setNewSlug}
          newParentId={newParentId}
          onNewParentIdChange={setNewParentId}
          newImages={newImages}
          onNewImagesChange={handleNewImagesChange}
          onCreateSubmit={handleCreateCategory}
          editDialogOpen={editDialogOpen}
          onEditDialogOpenChange={setEditDialogOpen}
          categoryToEdit={categoryToEdit}
          editCategoryName={editCategoryName}
          onEditCategoryNameChange={setEditCategoryName}
          editImages={editImages}
          onEditImagesChange={handleEditImagesChange}
          onEditSubmit={handleUpdateCategory}
          deleteDialogOpen={deleteDialogOpen}
          onDeleteDialogOpenChange={setDeleteDialogOpen}
          categoryToDelete={categoryToDelete}
          onDeleteConfirm={handleDeleteConfirm}
          categories={categories}
        />

        {/* Attribute Assignment Modal - Uses Modal component with 3-column table */}
        <Modal
          isOpen={attributeModalOpen}
          onClose={() => setAttributeModalOpen(false)}
          title={
            <span>
              Manage Attributes for{" "}
              <span className="text-accent">{categoryForAttributes?.name}</span>
            </span>
          }
          description="Assign attributes to this category and configure variant and required settings."
          size="xl"
          showCloseButton={true}
          closeOnOverlayClick={true}
          closeOnEscape={true}
        >
          <div className="space-y-4">
            {attributesLoading || isFetchingCategoryAttributes ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="ml-3 text-sm text-muted-foreground">
                  Loading attributes...
                </span>
              </div>
            ) : (
              <div className="space-y-1">
                {/* ── Header ── */}
                <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto_minmax(0,1fr)] gap-0 rounded-t-lg border border-b-0 border-border/50 bg-muted/40">
                  <div className="px-4 py-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider text-xs">
                    <div className="flex items-center gap-1.5">
                      Attribute
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-muted-foreground/20 transition-colors">
                              <Info className="w-3 h-3 text-muted-foreground" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent variant="info" side="top">
                            Attributes assigned to this category. Products will
                            only see attributes relevant to their category.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  <div className="px-3 py-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider text-xs text-center min-w-[80px]">
                    <div className="flex items-center justify-center gap-1.5">
                      Variant
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-muted-foreground/20 transition-colors">
                              <Info className="w-3 h-3 text-muted-foreground" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent variant="info" side="top">
                            Creates separate product variants (e.g., different
                            colors or sizes).
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  <div className="px-3 py-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider text-xs text-center min-w-[80px]">
                    <div className="flex items-center justify-center gap-1.5">
                      Required
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-muted-foreground/20 transition-colors">
                              <Info className="w-3 h-3 text-muted-foreground" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent variant="info" side="top">
                            Products must have a value selected for this
                            attribute.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  <div className="px-3 py-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider text-xs text-center min-w-[120px]">
                    <div className="flex items-center justify-center gap-1.5">
                      Restriction
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-muted-foreground/20 transition-colors">
                              <Info className="w-3 h-3 text-muted-foreground" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent variant="info" side="top">
                            Defines how attribute values are applied to products
                            in this category.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  <div className="px-4 py-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider text-xs text-right">
                    Selected Values
                  </div>
                </div>

                {/* ── Card Rows ── */}
                <div className="border border-border/50 rounded-b-lg divide-y divide-border/40">
                  <AnimatePresence>
                    {attributes
                      .filter((a) => !a.isDeleted)
                      .map((attribute) => {
                        const attrState = categoryAttributes[attribute.id];
                        const restrictionMode =
                          attrState?.valueRestrictionMode ?? "ALL";
                        const selectedIds = attrState?.valueIds ?? [];
                        const attribValues =
                          attrState?.attribute?.values
                            ?.filter((v) => !v.isDeleted)
                            ?.filter((v) => selectedIds.includes(v.id))
                            ?.filter(
                              (
                                v,
                              ): v is {
                                id: number;
                                value: string;
                                attributeId: number;
                                isActive: boolean;
                                isDeleted: boolean;
                                deletedAt: string | null;
                              } => Boolean(v),
                            ) ?? [];
                        const selectedCount = selectedIds.length;
                        const totalActiveValues =
                          attrState?.attribute?.values?.filter(
                            (v) => !v.isDeleted,
                          ).length ?? 0;

                        return (
                          <motion.div
                            key={attribute.id}
                            className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto_minmax(0,1fr)] gap-0 items-center transition-colors duration-150"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.15 }}
                          >
                            {/* Col-1 · Attribute name */}
                            <div className="px-4 py-3 flex items-center gap-3">
                              <Tag className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm font-medium text-foreground">
                                {attribute.name}
                              </span>
                            </div>

                            {/* Col-2 · Variant Checkbox */}
                            <div className="px-3 py-3 flex items-center justify-center ">
                              <Checkbox
                                id={`variant-${attribute.id}`}
                                checked={
                                  attrState?.isVariantSelectable || false
                                }
                                onCheckedChange={() =>
                                  handleAttributeToggle(
                                    attribute.id,
                                    "isVariantSelectable",
                                  )
                                }
                              />
                            </div>

                            {/* Col-3 · Required Checkbox */}
                            <div className="px-3 py-3 flex items-center justify-center">
                              <Checkbox
                                id={`required-${attribute.id}`}
                                checked={attrState?.isRequired || false}
                                onCheckedChange={() =>
                                  handleAttributeToggle(
                                    attribute.id,
                                    "isRequired",
                                  )
                                }
                              />
                            </div>

                            {/* Col-4 · Restriction Mode */}
                            <div className="px-3 py-3 flex items-center justify-center">
                              <Select
                                value={restrictionMode}
                                onValueChange={async (value) => {
                                  // Don't allow changing mode if attribute is not assigned
                                  if (!attrState?.isVariantSelectable && !attrState?.isRequired) {
                                    return;
                                  }
                                  // If switching to SELECTED mode, ensure values are loaded
                                  if (value === "SELECTED") {
                                    const currentAttr =
                                      categoryAttributes[attribute.id];
                                    if (
                                      currentAttr?.attribute &&
                                      (!currentAttr.attribute.values ||
                                        currentAttr.attribute.values.length === 0)
                                    ) {
                                      try {
                                        const values = await getValuesByAttributeId(
                                          attribute.id
                                        );
                                        setCategoryAttributes((prev) => ({
                                          ...prev,
                                          [attribute.id]: {
                                            ...prev[attribute.id],
                                            attribute: prev[attribute.id]
                                              ?.attribute
                                              ? {
                                                  id: prev[attribute.id].attribute!.id,
                                                  name: prev[attribute.id].attribute!.name,
                                                  values: values.map((v) => ({
                                                    id: v.id,
                                                    value: v.value,
                                                    attributeId: v.attributeId,
                                                    isActive: v.isActive,
                                                    isDeleted: v.isDeleted,
                                                    deletedAt: v.deletedAt,
                                                  })),
                                                }
                                              : undefined,
                                          },
                                        }));
                                      } catch (err) {
                                        console.error(
                                          `Failed to fetch values for attribute ${attribute.id}:`,
                                          err
                                        );
                                      }
                                    }
                                  }
                                  setCategoryAttributes((prev) => ({
                                    ...prev,
                                    [attribute.id]: {
                                      ...prev[attribute.id],
                                      valueRestrictionMode: value as
                                        | "ALL"
                                        | "SELECTED"
                                        | "NONE",
                                    },
                                  }));
                                }}
                                disabled={!attrState?.isVariantSelectable && !attrState?.isRequired}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Mode" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ALL">All</SelectItem>
                                  <SelectItem value="SELECTED">
                                    Selected
                                  </SelectItem>
                                  <SelectItem value="NONE">None</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Col-5 · Selected Values summary */}
                            <div className="px-3 py-3 flex items-center justify-end gap-2">
                              {restrictionMode === "SELECTED" ? (
                                selectedCount > 0 ? (
                                  <>
                                    <Badge
                                      variant="secondary"
                                      className="px-2 py-0.5 text-xs"
                                    >
                                      {selectedCount} of {totalActiveValues}{" "}
                                      selected
                                    </Badge>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2 text-xs text-accent hover:text-accent/80 hover:bg-accent/10"
                                      disabled={!attrState?.isVariantSelectable && !attrState?.isRequired}
                                      onClick={() =>
                                        handleManageAttributeValues(
                                          attribute.id,
                                          attribute.name,
                                        )
                                      }
                                    >
                                      Manage values
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-accent hover:text-accent/80 hover:bg-accent/10"
                                    disabled={!attrState?.isVariantSelectable && !attrState?.isRequired}
                                    onClick={() =>
                                      handleManageAttributeValues(
                                        attribute.id,
                                        attribute.name,
                                      )
                                    }
                                  >
                                    Select values
                                  </Button>
                                )
                              ) : restrictionMode === "ALL" ? (
                                <span className="text-xs text-muted-foreground">
                                  All values
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  No values
                                </span>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                  </AnimatePresence>

                  {/* Empty state */}
                  {attributes.filter((a) => !a.isDeleted).length === 0 && (
                    <div className="py-12 text-center">
                      <Tag className="w-8 h-8 mx-auto text-muted-foreground/50" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        No attributes available. Create attributes first in the
                        Attributes page.
                      </p>
                    </div>
                  )}
                </div>

                {/* ── Footer ── */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                  <Button
                    variant="outline"
                    onClick={() => setAttributeModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveAttributes}
                    disabled={isSavingAttributes}
                  >
                    {isSavingAttributes ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>

        {/* Value selection dialog for SELECTED mode */}
        {valueSelectionAttribute && (
          <ValueSelectionDialog
            open={valueSelectionDialogOpen}
            onOpenChange={setValueSelectionDialogOpen}
            attributeName={valueSelectionAttribute.name}
            values={
              categoryAttributes[valueSelectionAttribute.id]?.attribute
                ?.values ?? []
            }
            selectedIds={
              categoryAttributes[valueSelectionAttribute.id]?.valueIds ?? []
            }
            onToggleValue={(valueId) => {
              setCategoryAttributes((prev) => {
                const current = prev[valueSelectionAttribute.id];
                const currentIds = current?.valueIds || [];
                const isSelected = currentIds.includes(valueId);
                const newIds = isSelected
                  ? currentIds.filter((id) => id !== valueId)
                  : [...currentIds, valueId];
                return {
                  ...prev,
                  [valueSelectionAttribute.id]: {
                    ...current,
                    valueIds: newIds,
                  },
                };
              });
            }}
            onSelectAll={() => {
              setCategoryAttributes((prev) => {
                const current = prev[valueSelectionAttribute.id];
                const allIds =
                  current?.attribute?.values
                    ?.filter((v) => !v.isDeleted)
                    ?.map((v) => v.id) ?? [];
                return {
                  ...prev,
                  [valueSelectionAttribute.id]: {
                    ...current,
                    valueIds: allIds,
                  },
                };
              });
            }}
            onClearAll={() => {
              setCategoryAttributes((prev) => ({
                ...prev,
                [valueSelectionAttribute.id]: {
                  ...prev[valueSelectionAttribute.id],
                  valueIds: [],
                },
              }));
            }}
          />
        )}
      </div>
    </PageTransition>
  );
};

export default CategoriesPage;
