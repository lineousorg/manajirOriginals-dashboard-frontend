"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  CornerDownRight,
  FolderTree,
  Package,
  MoreHorizontal,
  Pencil,
  Power,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Category } from "@/types/category";

interface CategoryTableProps {
  categories: Category[];
  expandedCategory: number | null;
  onToggleExpand: (id: number | null) => void;
  onEdit: (category: Category) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (id: number) => void;
}

const CategoryTable = ({
  categories,
  expandedCategory,
  onToggleExpand,
  onEdit,
  onDelete,
  onToggleStatus,
}: CategoryTableProps) => {
  // Get top-level categories (those without a parent)
  const topLevelCategories = categories?.filter((cat) => cat.parentId === null);

  // Helper to get full category data from the main array
  const getFullCategoryData = (id: number) => {
    return categories.find((c) => c.id === id);
  };

  const renderCategoryRow = (categoryId: number, level = 0) => {
    const category = getFullCategoryData(categoryId);
    if (!category) return null;

    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategory === category.id;
    const productCount = category._count?.products || 0;
    const categoryImage =
      category.images && category.images.length > 0 ? category.images[0] : null;

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
                    onToggleExpand(isExpanded ? null : category.id)
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
                  <FolderTree
                    className={`w-5 h-5 ${
                      level > 0 ? "text-muted-foreground" : "text-accent"
                    }`}
                  />
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
              <Badge variant="secondary">Inactive</Badge>
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
                <DropdownMenuItem onClick={() => onEdit(category)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleStatus(category.id)}>
                  <Power className="w-4 h-4 mr-2" />
                  {category.isActive ? "Deactivate" : "Activate"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(category.id)}
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
            {topLevelCategories.map((category) => renderCategoryRow(category.id))}
          </AnimatePresence>
        </TableBody>
      </Table>
    </div>
  );
};

export default CategoryTable;