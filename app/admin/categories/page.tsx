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
  Pencil,
  Power,
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
import { Badge } from "@/components/ui/badge";
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

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newParentId, setNewParentId] = useState<number | null>(null);
  const [newImages, setNewImages] = useState<CategoryImage[]>([]);

  // Edit category state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editImages, setEditImages] = useState<CategoryImage[]>([]);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);

  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);

  const { toast } = useToast();

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

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const base64 = await fileToBase64(file);
        setNewImages((prev) => [
          ...prev,
          {
            url: base64,
            altText: file.name,
            position: prev.length + i,
          },
        ]);
      } catch (error) {
        console.error("Error converting file to base64:", error);
      }
    }
  };

  // Remove image
  const removeImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle edit image file selection
  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const base64 = await fileToBase64(file);
        setEditImages((prev) => [
          ...prev,
          {
            url: base64,
            altText: file.name,
            position: prev.length + i,
          },
        ]);
      } catch (error) {
        console.error("Error converting file to base64:", error);
      }
    }
  };

  // Remove edit image
  const removeEditImage = (index: number) => {
    setEditImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle update category
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

  const handleDeleteClick = (id: number) => {
    setCategoryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (category: Category) => {
    setCategoryToEdit(category);
    setEditCategoryName(category.name);
    setEditImages(category.images || []);
    setEditDialogOpen(true);
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
          description: backendMessage || "Failed to delete category. Please try again.",
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
        description: backendMessage || "Failed to toggle category status. Please try again.",
        variant: "destructive",
      });
    }
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
    const categoryImage = category.images && category.images.length > 0 ? category.images[0] : null;

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
              {categoryImage ? (
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <img
                    src={categoryImage.url}
                    alt={categoryImage.altText || category.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    level > 0 ? "bg-muted/50" : "bg-accent/10"
                  }`}
                >
                  <FolderTree className={`w-5 h-5 ${level > 0 ? "text-muted-foreground" : "text-accent"}`} />
                </div>
              )}
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
            {category.isActive ? (
              <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                Active
              </Badge>
            ) : (
              <Badge variant="secondary">
                Inactive
              </Badge>
            )}
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
              <DropdownMenuContent align="end" className="bg-white">
                <DropdownMenuItem
                  onClick={() => handleEditClick(category)}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleToggleStatusClick(category.id)}
                >
                  <Power className="w-4 h-4 mr-2" />
                  {category.isActive ? "Deactivate" : "Activate"}
                </DropdownMenuItem>
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
                    <TableHead>Status</TableHead>
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
      <Dialog open={createDialogOpen} onOpenChange={(open) => {
        setCreateDialogOpen(open);
        if (!open) {
          setNewCategoryName("");
          setNewSlug("");
          setNewParentId(null);
          setNewImages([]);
        }
      }}>
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
        
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentCategory">Parent Category (Optional)</Label>
              <select
                id="parentCategory"
                className="w-full px-3 py-2 border rounded-md bg-background text-foreground placeholder:text-sm"
                value={newParentId || "Select parent"}
                onChange={(e) =>
                  setNewParentId(e.target.value ? Number(e.target.value) : null)
                }
              >
                <option value="" className="text-sm">None (Top-level category)</option>
                {categories
                  .filter((cat) => cat.parentId === null)
                  .map((cat) => (
                    <option key={cat.id} value={cat.id} className="text-sm placeholder:text-sm">
                      {cat.name}
                    </option>
                  ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Select a parent category to create a subcategory
              </p>
            </div>

            {/* Images */}
            <div className="space-y-2">
              <Label>Category Images</Label>
              <div className="bg-muted/50 rounded-lg border p-4 space-y-4">
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

                {newImages.length === 0 && (
                  <p className="text-muted-foreground text-sm">
                    No images added yet. Click &quot;Add Images&quot; to upload.
                  </p>
                )}

                <div className="grid gap-4 md:grid-cols-3">
                  {newImages.map((image, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative group"
                    >
                      <div className="aspect-square bg-muted rounded-lg overflow-hidden border">
                        <img
                          src={image.url}
                          alt={image.altText || `Category image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="mt-2 space-y-2">
                        <Input
                          placeholder="Alt text (optional)"
                          value={image.altText}
                          onChange={(e) => {
                            const newImagesCopy = [...newImages];
                            newImagesCopy[index].altText = e.target.value;
                            setNewImages(newImagesCopy);
                          }}
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
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setNewCategoryName("");
                setNewSlug("");
                setNewParentId(null);
                setNewImages([]);
              }}
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

      {/* Edit Category Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) {
          setCategoryToEdit(null);
          setEditCategoryName("");
          setEditImages([]);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-gray-600">Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70dvh] overflow-auto">
            {/* Category Name - Editable */}
            <div className="space-y-2">
              <Label htmlFor="editCategoryName">Category Name</Label>
              <Input
                id="editCategoryName"
                placeholder="Enter category name"
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
              />
            </div>

            {/* Slug - Disabled */}
            <div className="space-y-2">
              <Label htmlFor="editCategorySlug">Slug</Label>
              <Input
                id="editCategorySlug"
                placeholder="category-slug"
                value={categoryToEdit?.slug || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-sm text-muted-foreground">
                URL-friendly identifier (cannot be changed)
              </p>
            </div>

            {/* Parent Category - Disabled */}
            <div className="space-y-2">
              <Label>Parent Category</Label>
              <Input
                value={categoryToEdit?.parent?.name || "None (Top-level category)"}
                disabled
                className="bg-muted"
              />
              <p className="text-sm text-muted-foreground">
                Parent category cannot be changed
              </p>
            </div>

            {/* Images - Editable */}
            <div className="space-y-2">
              <Label>Category Images</Label>
              <div className="bg-muted/50 rounded-lg border p-4 space-y-4">
                <div className="flex items-center justify-end">
                  <input
                    id="edit-image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleEditImageUpload}
                  />
                  <Label
                    htmlFor="edit-image-upload"
                    className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Images
                  </Label>
                </div>

                {editImages.length === 0 && (
                  <p className="text-muted-foreground text-sm">
                    No images added yet. Click &quot;Add Images&quot; to upload.
                  </p>
                )}

                <div className={`grid gap-4 ${editImages.length > 2 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
                  {editImages.map((image, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative group"
                    >
                      <div className="aspect-square bg-muted rounded-lg overflow-hidden border">
                        <img
                          src={image.url}
                          alt={image.altText || `Category image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="mt-2 space-y-2">
                        <Input
                          placeholder="Alt text (optional)"
                          value={image.altText}
                          onChange={(e) => {
                            const newImagesCopy = [...editImages];
                            newImagesCopy[index].altText = e.target.value;
                            setEditImages(newImagesCopy);
                          }}
                          className="text-xs"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEditImage(index)}
                          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setCategoryToEdit(null);
                setEditCategoryName("");
                setEditImages([]);
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              onClick={handleUpdateCategory}
            >
              Save Changes
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
