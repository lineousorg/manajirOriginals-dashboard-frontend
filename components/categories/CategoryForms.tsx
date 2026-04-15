"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Category, CategoryImage, CreateCategoryInput } from "@/types/category";

type ImageSetter = (images: CategoryImage[] | ((prev: CategoryImage[]) => CategoryImage[])) => void;
type ImageUpdater = (fn: (prev: CategoryImage[]) => CategoryImage[]) => void;

interface CategoryFormsProps {
  // Create form
  createDialogOpen: boolean;
  onCreateDialogOpenChange: (open: boolean) => void;
  newCategoryName: string;
  onNewCategoryNameChange: (name: string) => void;
  newSlug: string;
  onNewSlugChange: (slug: string) => void;
  newParentId: number | null;
  onNewParentIdChange: (id: number | null) => void;
  newImages: CategoryImage[];
  onNewImagesChange: ImageUpdater;
  onCreateSubmit: () => void;

  // Edit form
  editDialogOpen: boolean;
  onEditDialogOpenChange: (open: boolean) => void;
  categoryToEdit: Category | null;
  editCategoryName: string;
  onEditCategoryNameChange: (name: string) => void;
  editImages: CategoryImage[];
  onEditImagesChange: ImageUpdater;
  onEditSubmit: () => void;

  // Delete form
  deleteDialogOpen: boolean;
  onDeleteDialogOpenChange: (open: boolean) => void;
  categoryToDelete: number | null;
  onDeleteConfirm: () => void;

  // Categories for parent select
  categories: Category[];
}

const CategoryForms = ({
  // Create form
  createDialogOpen,
  onCreateDialogOpenChange,
  newCategoryName,
  onNewCategoryNameChange,
  newSlug,
  onNewSlugChange,
  newParentId,
  onNewParentIdChange,
  newImages,
  onNewImagesChange,
  onCreateSubmit,
  // Edit form
  editDialogOpen,
  onEditDialogOpenChange,
  categoryToEdit,
  editCategoryName,
  onEditCategoryNameChange,
  editImages,
  onEditImagesChange,
  onEditSubmit,
  // Delete form
  deleteDialogOpen,
  onDeleteDialogOpenChange,
  categoryToDelete,
  onDeleteConfirm,
  // Categories
  categories,
}: CategoryFormsProps) => {
  // Helper function to generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle new image file selection
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const base64 = await fileToBase64(file);
        onNewImagesChange((prev) => [
          ...prev,
          {
            url: base64,
            altText: file.name,
            position: prev.length,
          },
        ]);
      } catch (error) {
        console.error("Error converting file to base64:", error);
      }
    }
  };

  // Remove new image
  const removeImage = (index: number) => {
    onNewImagesChange((prev) => prev?.filter((_, i) => i !== index));
  };

  // Handle edit image file selection
  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const base64 = await fileToBase64(file);
        onEditImagesChange((prev) => [
          ...prev,
          {
            url: base64,
            altText: file.name,
            position: prev.length,
          },
        ]);
      } catch (error) {
        console.error("Error converting file to base64:", error);
      }
    }
  };

  // Remove edit image
  const removeEditImage = (index: number) => {
    onEditImagesChange((prev) => prev?.filter((_, i) => i !== index));
  };

  // Get category to delete
  const getCategoryToDelete = () => {
    if (!categoryToDelete) return null;
    return categories.find((c) => c.id === categoryToDelete);
  };

  // Reset create form
  const resetCreateForm = () => {
    onNewCategoryNameChange("");
    onNewSlugChange("");
    onNewParentIdChange(null);
    onNewImagesChange(() => []);
  };

  // Reset edit form
  const resetEditForm = () => {
    onEditCategoryNameChange("");
    onEditImagesChange(() => []);
  };

  return (
    <>
      {/* Create Category Dialog */}
      <Dialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          onCreateDialogOpenChange(open);
          if (!open) {
            resetCreateForm();
          }
        }}
      >
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
                  onNewCategoryNameChange(name);
                  // Auto-generate slug from name if slug is empty or was auto-generated
                  if (!newSlug || newSlug === generateSlug(newCategoryName)) {
                    onNewSlugChange(generateSlug(name));
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
                onChange={(e) => onNewSlugChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentCategory">Parent Category (Optional)</Label>
              <select
                id="parentCategory"
                className="w-full px-3 py-2 border rounded-md bg-background text-foreground placeholder:text-sm"
                value={newParentId || ""}
                onChange={(e) =>
                  onNewParentIdChange(e.target.value ? Number(e.target.value) : null)
                }
              >
                <option value="" className="text-sm">
                  None (Top-level category)
                </option>
                {categories
                  ?.filter((cat) => cat.parentId === null)
                  .map((cat) => (
                    <option key={cat.id} value={cat.id} className="text-sm">
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
                    No images added yet. Click &ldquo;Add Images&ldquo; to upload.
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
                            onNewImagesChange((prev) =>
                              prev.map((img, i) =>
                                i === index ? { ...img, altText: e.target.value } : img
                              )
                            );
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
                onCreateDialogOpenChange(false);
                resetCreateForm();
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              onClick={onCreateSubmit}
            >
              Create Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          onEditDialogOpenChange(open);
          if (!open) {
            resetEditForm();
          }
        }}
      >
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
                onChange={(e) => onEditCategoryNameChange(e.target.value)}
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
                    No images added yet. Click &ldquo;Add Images&ldquo; to upload.
                  </p>
                )}

                <div
                  className={`grid gap-4 ${
                    editImages.length > 2 ? "md:grid-cols-3" : "md:grid-cols-2"
                  }`}
                >
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
                            onEditImagesChange((prev) =>
                              prev.map((img, i) =>
                                i === index ? { ...img, altText: e.target.value } : img
                              )
                            );
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
                onEditDialogOpenChange(false);
                resetEditForm();
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              onClick={onEditSubmit}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={onDeleteDialogOpenChange}>
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
              onClick={onDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CategoryForms;