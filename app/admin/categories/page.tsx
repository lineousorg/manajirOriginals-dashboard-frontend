"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Trash2,
  MoreHorizontal,
  FolderTree,
  Package,
  ChevronDown,
  ChevronUp,
  CornerDownRight,
} from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
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
import { CreateCategoryInput } from "@/types/category";

const CategoriesPage = () => {
  const {
    categories,
    isLoading,
    createCategory,
    deleteCategory,
  } = useCategories();
  const [searchQuery, setSearchQuery] = useState("");

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newParentId, setNewParentId] = useState<number | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);

  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);

  const { toast } = useToast();

  // Helper function to generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Get top-level categories (those without a parent)
  const topLevelCategories = categories.filter((cat) => cat.parentId === null);

  // Filter categories based on search
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to get full category data (including _count) from the main array
  const getFullCategoryData = (id: number) => {
    return categories.find((c) => c.id === id);
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
    } catch (error) {
      console.log(error);
      toast({
        title: "Error",
        description: "Failed to create category. Please try again.",
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
      } catch (error) {
        console.log(error);
        toast({
          title: "Error",
          description: "Failed to delete category. Please try again.",
          variant: "destructive",
        });
      }
    }
    setDeleteDialogOpen(false);
    setCategoryToDelete(null);
  };

  const getCategoryToDelete = () => {
    if (!categoryToDelete) return null;
    return categories.find((c) => c.id === categoryToDelete);
  };

  const renderCategoryRow = (categoryId: number, level = 0) => {
    const category = getFullCategoryData(categoryId);
    if (!category) return null;
    
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategory === category.id;
    const productCount = category._count?.products || 0;

    return (
      <AnimatePresence key={category.id} mode="popLayout">
        <motion.tr
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="border-b last:border-0 hover:bg-muted/30 transition-colors"
        >
          <TableCell>
            <div
              className="flex items-center gap-3"
              style={{ paddingLeft: `${level * 24 + 12}px` }}
            >
              {hasChildren ? (
                <button
                  onClick={() =>
                    setExpandedCategory(isExpanded ? null : category.id)
                  }
                  className="p-1 hover:bg-muted rounded"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              ) : (
                <div className="w-5" />
              )}
              {level > 0 && (
                <CornerDownRight className="w-4 h-4 text-muted-foreground" />
              )}
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  level > 0 ? "bg-muted/50" : "bg-accent/10"
                }`}
              >
                <FolderTree className={`w-5 h-5 ${level > 0 ? "text-muted-foreground" : "text-accent"}`} />
              </div>
              <div>
                <p className="font-medium">{category.name}</p>
                <p className="text-sm text-muted-foreground">
                  {category.parent ? (
                    <span className="flex items-center gap-1">
                      <CornerDownRight className="w-3 h-3" />
                      Subcategory of {category.parent.name}
                    </span>
                  ) : (
                    `Created ${new Date(category.createdAt).toLocaleDateString()}`
                  )}
                </p>
              </div>
            </div>
          </TableCell>
          <TableCell>
            <span className="text-sm text-muted-foreground">{category.slug}</span>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{productCount}</span>
            </div>
          </TableCell>
          <TableCell className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleDeleteClick(category.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </motion.tr>
        {hasChildren && isExpanded && (
          category.children.map((child) => renderCategoryRow(child.id, level + 1))
        )}
      </AnimatePresence>
    );
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

        {/* Table */}
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
            <div className="border rounded-lg overflow-hidden bg-card shadow-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Category Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {topLevelCategories.map((category) =>
                      renderCategoryRow(category.id)
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}
        </FadeIn>
      </div>

      {/* Create Category Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Category Name</Label>
              <Input
                id="categoryName"
                placeholder="Enter category name"
                value={newCategoryName}
                onChange={(e) => {
                  const name = e.target.value;
                  setNewCategoryName(name);
                  // Auto-generate slug from name if slug is empty or was auto-generated
                  if (!newSlug || newSlug === generateSlug(newCategoryName)) {
                    setNewSlug(generateSlug(name));
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categorySlug">Slug</Label>
              <Input
                id="categorySlug"
                placeholder="category-slug"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                URL-friendly identifier (auto-generated from name)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentCategory">Parent Category (Optional)</Label>
              <select
                id="parentCategory"
                className="w-full px-3 py-2 border rounded-md bg-background"
                value={newParentId || ""}
                onChange={(e) =>
                  setNewParentId(e.target.value ? Number(e.target.value) : null)
                }
              >
                <option value="">None (Top-level category)</option>
                {categories
                  .filter((cat) => cat.parentId === null)
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
              </select>
              <p className="text-sm text-muted-foreground">
                Select a parent category to create a subcategory
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              onClick={handleCreateCategory}
            >
              Create Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? This action cannot
              be undone.
              {getCategoryToDelete()?._count?.products !== undefined &&
                getCategoryToDelete()?._count?.products !== null &&
                getCategoryToDelete()!._count!.products > 0 && (
                  <p className="mt-2 text-destructive">
                    Warning: This category has{" "}
                    {getCategoryToDelete()?._count?.products} products associated
                    with it.
                  </p>
                )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
};

export default CategoriesPage;
