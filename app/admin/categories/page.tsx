"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, FolderTree, Trash2, MoreHorizontal } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { PageTransition, FadeIn } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/ui/skeleton-card";
import { useToast } from "@/hooks/use-toast";
import CategoryTable from "@/components/categories/CategoryTable";
import CategoryForms from "@/components/categories/CategoryForms";
import { CreateCategoryInput, CategoryImage, Category } from "@/types/category";

const CategoriesPage = () => {
  const {
    categories,
    isLoading,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,
  } = useCategories();

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

  const { toast } = useToast();

  // Filter categories based on search
  const filteredCategories = categories?.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
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
        description: backendMessage || "Failed to update category. Please try again.",
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
        description: `${category?.name} is now ${updated.isActive ? "active" : "inactive"}.`,
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const backendMessage = err?.response?.data?.message;
      toast({
        title: "Error",
        description:
          backendMessage || "Failed to toggle category status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleNewImagesChange = (fn: (prev: CategoryImage[]) => CategoryImage[]) => {
    setNewImages(fn);
  };

  const handleEditImagesChange = (fn: (prev: CategoryImage[]) => CategoryImage[]) => {
    setEditImages(fn);
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
            />
          )}
        </FadeIn>

        {/* Forms */}
        <CategoryForms
          // Create form
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
          // Edit form
          editDialogOpen={editDialogOpen}
          onEditDialogOpenChange={setEditDialogOpen}
          categoryToEdit={categoryToEdit}
          editCategoryName={editCategoryName}
          onEditCategoryNameChange={setEditCategoryName}
          editImages={editImages}
          onEditImagesChange={handleEditImagesChange}
          onEditSubmit={handleUpdateCategory}
          // Delete form
          deleteDialogOpen={deleteDialogOpen}
          onDeleteDialogOpenChange={setDeleteDialogOpen}
          categoryToDelete={categoryToDelete}
          onDeleteConfirm={handleDeleteConfirm}
          // Categories
          categories={categories}
        />
      </div>
    </PageTransition>
  );
};

export default CategoriesPage;
