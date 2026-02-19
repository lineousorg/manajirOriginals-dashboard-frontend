"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Trash2,
  Edit,
  MoreHorizontal,
  Tag,
  ArrowLeft,
  Palette,
} from "lucide-react";
import { useAttributeValues } from "@/hooks/useAttributeValues";
import { useAttributes } from "@/hooks/useAttributes";
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
  CreateAttributeValueInput,
  AttributeValue,
} from "@/types/attribute";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const AttributeValuesPage = () => {
  const searchParams = useSearchParams();
  const initialAttributeId = searchParams.get("attributeId");

  const { attributeValues, isLoading, createAttributeValue, updateAttributeValue, deleteAttributeValue } = useAttributeValues();
  const { attributes } = useAttributes();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAttributeId, setFilterAttributeId] = useState<string>(
    initialAttributeId || "all"
  );

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newValueName, setNewValueName] = useState("");
  const [newValueAttributeId, setNewValueAttributeId] = useState<string>("");

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingValue, setEditingValue] = useState<AttributeValue | null>(null);
  const [editValueName, setEditValueName] = useState("");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [valueToDelete, setValueToDelete] = useState<number | null>(null);

  const { toast } = useToast();

  // Filter attribute values based on search and attribute filter
  const filteredValues = attributeValues.filter((av) => {
    const matchesSearch =
      av.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
      av.attribute?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAttribute =
      filterAttributeId === "all" ||
      av.attributeId === parseInt(filterAttributeId);
    return matchesSearch && matchesAttribute;
  });

  const handleCreateValue = async () => {
    if (!newValueName.trim()) {
      toast({
        title: "Error",
        description: "Value name is required",
        variant: "destructive",
      });
      return;
    }

    if (!newValueAttributeId) {
      toast({
        title: "Error",
        description: "Please select an attribute",
        variant: "destructive",
      });
      return;
    }

    try {
      const input: CreateAttributeValueInput = {
        value: newValueName,
        attributeId: parseInt(newValueAttributeId),
      };

      await createAttributeValue(input);
      toast({
        title: "Attribute value created",
        description: `${newValueName} has been created successfully.`,
      });
      setCreateDialogOpen(false);
      setNewValueName("");
      setNewValueAttributeId("");
    } catch (error) {
      console.log(error);
      toast({
        title: "Error",
        description: "Failed to create attribute value. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditClick = (value: AttributeValue) => {
    setEditingValue(value);
    setEditValueName(value.value);
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingValue) return;

    if (!editValueName.trim()) {
      toast({
        title: "Error",
        description: "Value name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateAttributeValue(editingValue.id, { value: editValueName });
      toast({
        title: "Attribute value updated",
        description: `${editValueName} has been updated successfully.`,
      });
      setEditDialogOpen(false);
      setEditingValue(null);
      setEditValueName("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update attribute value. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (id: number) => {
    setValueToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (valueToDelete) {
      try {
        await deleteAttributeValue(valueToDelete);
        toast({
          title: "Attribute value deleted",
          description: "Attribute value has been deleted successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete attribute value. Please try again.",
          variant: "destructive",
        });
      }
      setDeleteDialogOpen(false);
      setValueToDelete(null);
    }
  };

  const getAttributeName = (attributeId: number) => {
    const attribute = attributes.find((a) => a.id === attributeId);
    return attribute?.name || "Unknown";
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <FadeIn>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/attributes">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Attribute Values
                </h1>
                <p className="text-muted-foreground mt-1">
                  Manage values for your attributes (e.g., Red, Blue for Color)
                </p>
              </div>
            </div>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Value
            </Button>
          </div>
        </FadeIn>

        {/* Filters */}
        <FadeIn delay={0.1}>
          <div className="flex gap-4">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search values..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={filterAttributeId}
              onValueChange={setFilterAttributeId}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by attribute" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Attributes</SelectItem>
                {attributes.map((attr) => (
                  <SelectItem key={attr.id} value={attr.id.toString()}>
                    {attr.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                    <TableHead>Value</TableHead>
                    <TableHead>Attribute</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredValues.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Palette className="w-8 h-8" />
                          <p>No attribute values found</p>
                          <Button
                            variant="link"
                            onClick={() => setCreateDialogOpen(true)}
                          >
                            Create your first value
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredValues.map((value) => (
                      <TableRow key={value.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-muted-foreground" />
                            {value.value}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-secondary rounded text-sm">
                            {value.attribute?.name || getAttributeName(value.attributeId)}
                          </span>
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
                                onClick={() => handleEditClick(value)}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(value.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
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
              <DialogTitle>Create New Attribute Value</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="attribute">Attribute</Label>
                <Select
                  value={newValueAttributeId}
                  onValueChange={setNewValueAttributeId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an attribute" />
                  </SelectTrigger>
                  <SelectContent>
                    {attributes.map((attr) => (
                      <SelectItem key={attr.id} value={attr.id.toString()}>
                        {attr.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Value</Label>
                <Input
                  id="value"
                  placeholder="e.g., Red, Large, Cotton"
                  value={newValueName}
                  onChange={(e) => setNewValueName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateValue()}
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
              <Button onClick={handleCreateValue}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Attribute Value</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Attribute</Label>
                <Input
                  value={editingValue?.attribute?.name || getAttributeName(editingValue?.attributeId || 0)}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editValue">Value</Label>
                <Input
                  id="editValue"
                  value={editValueName}
                  onChange={(e) => setEditValueName(e.target.value)}
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
              <AlertDialogTitle>Delete Attribute Value</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this value? This action cannot
                be undone.
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

export default AttributeValuesPage;
