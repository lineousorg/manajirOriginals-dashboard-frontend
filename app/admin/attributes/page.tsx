"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Trash2,
  Edit,
  MoreHorizontal,
  Tag,
  ChevronDown,
  ChevronUp,
  List,
  FolderTree,
} from "lucide-react";
import { useAttributes } from "@/hooks/useAttributes";
import { useAttributeValues } from "@/hooks/useAttributeValues";
import { useCategories } from "@/hooks/useCategories";
import { useCategoryAttributes } from "@/hooks/useCategoryAttributes";
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
import { CategoryAttribute } from "@/types/attribute";
import { CreateAttributeInput, Attribute } from "@/types/attribute";
import Link from "next/link";
import AttributeSelectionTable from "@/components/attribute/AttributeSelectionTable";

// Type for the mapped category info displayed in the UI
type CategoryAttrInfo = {
  categoryId: number;
  name: string;
  isVariantSelectable: boolean;
  isRequired: boolean;
};

const AttributesPage = () => {
  const {
    attributes,
    isLoading,
    createAttribute,
    updateAttribute,
    deleteAttribute,
    restoreAttribute,
  } = useAttributes();
  const { attributeValues, refetch: refetchAttributeValues } =
    useAttributeValues();
  const { categories } = useCategories();
  const { fetchCategoryAttributes } = useCategoryAttributes();
  const [searchQuery, setSearchQuery] = useState("");

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newAttributeName, setNewAttributeName] = useState("");

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<Attribute | null>(
    null
  );
  const [editAttributeName, setEditAttributeName] = useState("");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [attributeToDelete, setAttributeToDelete] = useState<number | null>(
    null
  );

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Track category attributes per attribute for expanded view
  const [attrCategoryMap, setAttrCategoryMap] = useState<
    Record<number, CategoryAttrInfo[]>
  >({});

  const { toast } = useToast();

  // Filter attributes based on search
  const filteredAttributes =
    attributes?.filter((attribute) =>
      attribute.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  // Fetch category-attribute relationships when expanding an attribute
  const handleExpandAttribute = async (attributeId: number) => {
    // If we already have data for this attribute, don't refetch
    if (attrCategoryMap[attributeId]) return;

    const allCategories = categories || [];
    const results: CategoryAttrInfo[] = [];

    try {
       for (const cat of allCategories) {
         try {
           const catAttrs: CategoryAttribute[] = await fetchCategoryAttributes(
             cat.slug
           );
          const matching = catAttrs.filter(
            (ca: CategoryAttribute) => ca.attributeId === attributeId
          );
          if (matching.length > 0) {
            results.push({
              categoryId: cat.id,
              name: cat.name,
              isVariantSelectable: matching[0].isVariantSelectable,
              isRequired: matching[0].isRequired,
            });
          }
        } catch {
          // Skip categories that fail to fetch
        }
      }

      setAttrCategoryMap((prev) => ({ ...prev, [attributeId]: results }));
    } catch {
      // Fallback: try to use existing categoryAttributes from categories if available
      const fallback: CategoryAttrInfo[] = [];
      allCategories.forEach((cat) => {
        const matching: CategoryAttribute[] =
          cat.categoryAttributes?.filter(
            (ca: CategoryAttribute) => ca.attributeId === attributeId
          ) || [];
        matching.forEach((ca: CategoryAttribute) => {
          fallback.push({
            categoryId: cat.id,
            name: cat.name,
            isVariantSelectable: ca.isVariantSelectable,
            isRequired: ca.isRequired,
          });
        });
      });
      setAttrCategoryMap((prev) => ({ ...prev, [attributeId]: fallback }));
    }
  };

  const handleToggleExpand = (_id: number) => {
    // Expand is handled internally by AttributeSelectionTable
    // This is kept for potential future use
  };

  const handleCreateAttribute = async () => {
    if (!newAttributeName.trim()) {
      toast({
        title: "Error",
        description: "Attribute name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const input: CreateAttributeInput = {
        name: newAttributeName,
      };

      await createAttribute(input);
      toast({
        title: "Attribute created",
        description: `${newAttributeName} has been created successfully.`,
      });
      setCreateDialogOpen(false);
      setNewAttributeName("");
    } catch (error) {
      console.log(error);
      toast({
        title: "Error",
        description: "Failed to create attribute. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditClick = (attribute: Attribute) => {
    setEditingAttribute(attribute);
    setEditAttributeName(attribute.name);
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingAttribute) return;

    if (!editAttributeName.trim()) {
      toast({
        title: "Error",
        description: "Attribute name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateAttribute(editingAttribute.id, { name: editAttributeName });
      toast({
        title: "Attribute updated",
        description: `${editAttributeName} has been updated successfully.`,
      });
      setEditDialogOpen(false);
      setEditingAttribute(null);
      setEditAttributeName("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update attribute. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (id: number) => {
    setAttributeToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (attributeToDelete) {
      try {
        await deleteAttribute(attributeToDelete);
        toast({
          title: "Attribute deleted",
          description: "Attribute has been deleted successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete attribute. Please try again.",
          variant: "destructive",
        });
      }
      setDeleteDialogOpen(false);
      setAttributeToDelete(null);
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await restoreAttribute(id);
      toast({
        title: "Attribute restored",
        description: "Attribute has been restored successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to restore attribute. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <FadeIn>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Attributes</h1>
              <p className="text-muted-foreground mt-1">
                Manage product attributes (e.g., Color, Size, Material)
              </p>
            </div>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Attribute
            </Button>
          </div>
        </FadeIn>

        {/* Search */}
        <FadeIn delay={0.1}>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search attributes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </FadeIn>

        {/* Table */}
        <FadeIn delay={0.2}>
          {isLoading ? (
            <TableSkeleton />
          ) : (
            <AttributeSelectionTable
               attributes={filteredAttributes}
               attributeValues={attributeValues}
               attrCategoryMap={attrCategoryMap}
               selectedAttributeIds={selectedIds}
               onSelect={setSelectedIds}
              //  onEdit={handleEditClick}
               onDelete={handleDeleteClick}
               onRestore={handleRestore}
               onExpand={handleExpandAttribute}
               onCreate={() => setCreateDialogOpen(true)}
               searchQuery={searchQuery}
               mode="page"
             />
          )}
        </FadeIn>

        {/* Create Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Attribute</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Attribute Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Color, Size, Material"
                  value={newAttributeName}
                  onChange={(e) => setNewAttributeName(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleCreateAttribute()
                  }
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
              <Button onClick={handleCreateAttribute}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Attribute</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editName">Attribute Name</Label>
                <Input
                  id="editName"
                  value={editAttributeName}
                  onChange={(e) => setEditAttributeName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEditSave()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleEditSave}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Alert */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Attribute</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this attribute? This will also
                delete all associated values. This action cannot be undone.
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
      </div>
    </PageTransition>
  );
};

export default AttributesPage;
