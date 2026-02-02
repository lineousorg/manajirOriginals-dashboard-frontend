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
import { Switch } from "@/components/ui/switch";
import { TableSkeleton } from "@/components/ui/skeleton-card";
import { useToast } from "@/hooks/use-toast";
import { CreateCategoryInput } from "@/types/category";

const CategoriesPage = () => {
  const {
    categories,
    isLoading,
    createCategory,
    deleteCategory,
    toggleCategoryActive,
  } = useCategories();
  const [searchQuery, setSearchQuery] = useState("");

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryActive, setNewCategoryActive] = useState(true);
  const [newSubcategories, setNewSubcategories] = useState<string>("");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);

  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);

  const { toast } = useToast();

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const subcategories = newSubcategories
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const input: CreateCategoryInput = {
        name: newCategoryName,
        isActive: newCategoryActive,
        subcategories:
          subcategories.length > 0
            ? subcategories.map((name) => ({ name }))
            : undefined,
      };

      await createCategory(input);
      toast({
        title: "Category created",
        description: `${newCategoryName} has been created successfully.`,
      });
      setCreateDialogOpen(false);
      setNewCategoryName("");
      setNewCategoryActive(true);
      setNewSubcategories("");
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

  const handleToggleActive = async (id: number) => {
    try {
      const category = categories.find((c) => c.id === id);
      await toggleCategoryActive(id);
      toast({
        title: "Category updated",
        description: `${category?.name} is now ${
          !category?.isActive ? "active" : "inactive"
        }`,
      });
    } catch (error) {
      console.log(error);
      toast({
        title: "Error",
        description: "Failed to update category status",
        variant: "destructive",
      });
    }
  };

  const getCategoryToDelete = () => {
    if (!categoryToDelete) return null;
    return categories.find((c) => c.id === categoryToDelete);
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
                    <TableHead>Status</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {filteredCategories.map((category, index) => (
                      <motion.tr
                        key={category.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() =>
                                setExpandedCategory(
                                  expandedCategory === category.id
                                    ? null
                                    : category.id
                                )
                              }
                              className="p-1 hover:bg-muted rounded"
                            >
                              {expandedCategory === category.id ? (
                                <ChevronUp className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              )}
                            </button>
                            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                              <FolderTree className="w-5 h-5 text-accent" />
                            </div>
                            <div>
                              <p className="font-medium">{category.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Created{" "}
                                {new Date(
                                  category.createdAt
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={category.isActive}
                            onCheckedChange={() =>
                              handleToggleActive(category.id)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">
                              {category.productCount}
                            </span>
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
                    ))}
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
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subcategories">Subcategories (Optional)</Label>
              <Input
                id="subcategories"
                placeholder="Enter subcategories separated by comma (for future use)"
                value={newSubcategories}
                onChange={(e) => setNewSubcategories(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Separate subcategories with commas (e.g., Men, Women, Kids)
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="categoryActive">Active</Label>
                <p className="text-sm text-muted-foreground">
                  Make this category visible to customers
                </p>
              </div>
              <Switch
                id="categoryActive"
                checked={newCategoryActive}
                onCheckedChange={setNewCategoryActive}
              />
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
              {getCategoryToDelete()?.productCount !== undefined &&
                getCategoryToDelete()?.productCount !== null &&
                getCategoryToDelete()!.productCount > 0 && (
                  <p className="mt-2 text-destructive">
                    Warning: This category has{" "}
                    {getCategoryToDelete()?.productCount} products associated
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
