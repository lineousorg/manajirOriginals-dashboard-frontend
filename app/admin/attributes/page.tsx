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
} from "lucide-react";
import { useAttributes } from "@/hooks/useAttributes";
import { useAttributeValues } from "@/hooks/useAttributeValues";
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
import { CreateAttributeInput, Attribute } from "@/types/attribute";
import Link from "next/link";

const AttributesPage = () => {
  const {
    attributes,
    isLoading,
    createAttribute,
    updateAttribute,
    deleteAttribute,
  } = useAttributes();
  const { attributeValues, refetch: refetchAttributeValues } = useAttributeValues();
  const [searchQuery, setSearchQuery] = useState("");

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newAttributeName, setNewAttributeName] = useState("");

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<Attribute | null>(null);
  const [editAttributeName, setEditAttributeName] = useState("");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [attributeToDelete, setAttributeToDelete] = useState<number | null>(null);

  const [expandedAttribute, setExpandedAttribute] = useState<number | null>(null);

  const { toast } = useToast();

  // Filter attributes based on search
  const filteredAttributes = attributes.filter((attribute) =>
    attribute.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to get values for a specific attribute
  const getValuesForAttribute = (attributeId: number) => {
    return attributeValues.filter((av) => av.attributeId === attributeId);
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

  const toggleExpand = (id: number) => {
    setExpandedAttribute(expandedAttribute === id ? null : id);
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
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Values Count</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttributes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Tag className="w-8 h-8" />
                          <p>No attributes found</p>
                          <Button
                            variant="link"
                            onClick={() => setCreateDialogOpen(true)}
                          >
                            Create your first attribute
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAttributes.map((attribute) => (
                      <>
                        <TableRow key={attribute.id}>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpand(attribute.id)}
                              className="p-0 hover:bg-transparent"
                            >
                              {expandedAttribute === attribute.id ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-medium">
                            {attribute.name}
                          </TableCell>
                          <TableCell>
                            {getValuesForAttribute(attribute.id).length} values
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleEditClick(attribute)}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteClick(attribute.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                        {expandedAttribute === attribute.id && (
                          <TableRow key={`${attribute.id}-expanded`}>
                            <TableCell colSpan={4} className="bg-muted/30">
                              <div className="py-2">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-sm font-medium">
                                    Values for &quot;{attribute.name}&quot;
                                  </h4>
                                  <Link href={`/admin/attribute-values?attributeId=${attribute.id}`}>
                                    <Button variant="outline" size="sm">
                                      <List className="w-4 h-4 mr-2" />
                                      Manage Values
                                    </Button>
                                  </Link>
                                </div>
                                {getValuesForAttribute(attribute.id).length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {getValuesForAttribute(attribute.id).map((value) => (
                                      <span
                                        key={value.id}
                                        className="px-3 py-1 bg-gray-300 text-secondary-foreground rounded-full text-sm"
                                      >
                                        {value.value}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    No values defined yet
                                  </p>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
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
                  onKeyDown={(e) => e.key === "Enter" && handleCreateAttribute()}
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
