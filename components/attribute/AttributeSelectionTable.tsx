"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Edit,
  Trash2,
  List,
  FolderTree,
  Tag,
  Check,
  Layers,
  GripVertical,
} from "lucide-react";
import Link from "next/link";

// ─── Types ─────────────────────────────────────────────────────────

interface Attribute {
  id: number;
  name: string;
  isDeleted?: boolean;
}

interface AttributeValue {
  id: number;
  attributeId: number;
  value: string;
}

interface CategoryInfo {
  categoryId: number;
  name: string;
  isVariantSelectable?: boolean;
}

interface AttributeTableProps {
  attributes: Attribute[];
  attributeValues: AttributeValue[];
  attrCategoryMap: Record<number, CategoryInfo[]>;
  selectedAttributeIds?: number[];
  onSelect?: (ids: number[]) => void;
  onEdit?: (attribute: Attribute) => void;
  onDelete?: (id: number) => void;
  onRestore?: (id: number) => void;
  onExpand?: (attributeId: number) => void;
  onCreate?: () => void;
  searchQuery?: string;
  emptyActionText?: string;
  mode?: "modal" | "page";
}

// ─── Component ─────────────────────────────────────────────────────

export default function AttributeSelectionTable({
  attributes,
  attributeValues,
  attrCategoryMap,
  selectedAttributeIds = [],
  onSelect,
  onEdit,
  onDelete,
  onRestore,
  onExpand,
  onCreate,
  searchQuery = "",
  emptyActionText = "Create your first attribute",
  mode = "modal",
}: AttributeTableProps) {
  const [expandedAttribute, setExpandedAttribute] = useState<number | null>(
    null
  );

  const filteredAttributes = searchQuery
    ? attributes.filter((a) =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : attributes;

  const getValuesForAttribute = (attributeId: number) =>
    attributeValues.filter((v) => v.attributeId === attributeId);

  const handleToggleExpand = (id: number) => {
    const newExpanded = expandedAttribute === id ? null : id;
    setExpandedAttribute(newExpanded);
    if (onExpand && newExpanded !== null) {
      onExpand(id);
    }
  };

  const toggleSelection = (id: number) => {
    if (!onSelect) return;
    const isSelected = selectedAttributeIds.includes(id);
    if (isSelected) {
      onSelect(selectedAttributeIds.filter((sid) => sid !== id));
    } else {
      onSelect([...selectedAttributeIds, id]);
    }
  };

  const toggleAll = () => {
    if (!onSelect) return;
    const allSelected = filteredAttributes.every((a) =>
      selectedAttributeIds.includes(a.id)
    );
    if (allSelected) {
      onSelect([]);
    } else {
      onSelect(filteredAttributes.map((a) => a.id));
    }
  };

  const allSelected =
    filteredAttributes.length > 0 &&
    filteredAttributes.every((a) => selectedAttributeIds.includes(a.id));

  const someSelected =
    filteredAttributes.some((a) => selectedAttributeIds.includes(a.id)) &&
    !allSelected;

  // ─── Empty State ─────────────────────────────────────────────────

  if (filteredAttributes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Tag className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">
          No attributes found
        </h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-xs">
          {searchQuery
            ? "No attributes match your search. Try a different term."
            : "Get started by creating your first attribute."}
        </p>
        {!searchQuery && onCreate && (
          <Button onClick={onCreate} size="sm">
            <Tag className="w-4 h-4 mr-2" />
            {emptyActionText}
          </Button>
        )}
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="w-full">
      {/* Desktop Table */}
      <div className="hidden md:block rounded-xl border border-border/60 overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              {onSelect && (
                <TableHead className="w-12 pl-4">
                  <Checkbox
                    checked={allSelected}
                    data-state={
                      someSelected
                        ? "indeterminate"
                        : allSelected
                        ? "checked"
                        : "unchecked"
                    }
                    onCheckedChange={toggleAll}
                    aria-label="Select all attributes"
                  />
                </TableHead>
              )}
              <TableHead className="w-10"></TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Attribute
              </TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Values
              </TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Categories
              </TableHead>
              <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground pr-4">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAttributes.map((attribute, idx) => {
              const values = getValuesForAttribute(attribute.id);
              const categories = attrCategoryMap[attribute.id] || [];
              const isExpanded = expandedAttribute === attribute.id;
              const isSelected = selectedAttributeIds.includes(attribute.id);

              return (
                <React.Fragment key={attribute.id}>
                  <TableRow
                    className={cn(
                      "group transition-colors cursor-pointer",
                      isSelected && "bg-primary/5 hover:bg-primary/10",
                      !isSelected && "hover:bg-muted/30",
                      idx !== filteredAttributes.length - 1 &&
                        "border-b border-border/40"
                    )}
                    onClick={() => onSelect && toggleSelection(attribute.id)}
                  >
                    {onSelect && (
                      <TableCell
                        className="pl-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelection(attribute.id)}
                          aria-label={`Select ${attribute.name}`}
                        />
                      </TableCell>
                    )}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleExpand(attribute.id)}
                        className="p-1 h-7 w-7 hover:bg-muted"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <Layers className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-foreground">
                            {attribute.name}
                          </p>
                          {attribute.isDeleted && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] mt-0.5"
                            >
                              Deleted
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-medium",
                            values.length === 0 &&
                              "text-muted-foreground border-dashed"
                          )}
                        >
                          {values.length}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {values.length === 1 ? "value" : "values"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-medium",
                            categories.length === 0 &&
                              "text-muted-foreground border-dashed"
                          )}
                        >
                          {categories.length}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {categories.length === 1 ? "category" : "categories"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell
                      className="text-right pr-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(attribute)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {attribute.isDeleted
                            ? onRestore && (
                                <DropdownMenuItem
                                  onClick={() => onRestore(attribute.id)}
                                >
                                  <Check className="w-4 h-4 mr-2" />
                                  Restore
                                </DropdownMenuItem>
                              )
                            : onDelete && (
                                <DropdownMenuItem
                                  onClick={() => onDelete(attribute.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <TableRow className="bg-muted/20 hover:bg-muted/20">
                      <TableCell colSpan={onSelect ? 6 : 5} className="p-0">
                        <div className="p-5 space-y-5 animate-in slide-in-from-top-2 duration-200">
                          {/* Values Section */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <List className="w-4 h-4 text-muted-foreground" />
                                <h4 className="text-sm font-semibold text-foreground">
                                  Values
                                </h4>
                                <Badge
                                  variant="secondary"
                                  className="text-[10px]"
                                >
                                  {values.length}
                                </Badge>
                              </div>
                              <Link
                                href={`/admin/attribute-values?attributeId=${attribute.id}`}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                >
                                  <List className="w-3.5 h-3.5 mr-1.5" />
                                  Manage
                                </Button>
                              </Link>
                            </div>
                            {values.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {values.map((value) => (
                                  <Badge
                                    key={value.id}
                                    variant="secondary"
                                    className="px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                  >
                                    {value.value}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">
                                No values defined yet
                              </p>
                            )}
                          </div>

                          {/* Divider */}
                          <div className="h-px bg-border/60" />

                          {/* Categories Section */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FolderTree className="w-4 h-4 text-muted-foreground" />
                                <h4 className="text-sm font-semibold text-foreground">
                                  Assigned Categories
                                </h4>
                                <Badge
                                  variant="secondary"
                                  className="text-[10px]"
                                >
                                  {categories.length}
                                </Badge>
                              </div>
                              <Link href="/admin/categories">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                >
                                  <FolderTree className="w-3.5 h-3.5 mr-1.5" />
                                  Manage
                                </Button>
                              </Link>
                            </div>
                            {categories.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {categories.map((catInfo) => (
                                  <Badge
                                    key={catInfo.categoryId}
                                    variant="secondary"
                                    className={cn(
                                      "px-3 py-1.5 bg-white font-medium flex items-center gap-1.5 ",
                                      catInfo.isVariantSelectable
                                        ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800"
                                        : "border-border bg-background"
                                    )}
                                  >
                                    {catInfo.name}
                                    {catInfo.isVariantSelectable && (
                                      <span className="text-[10px] opacity-70 font-normal">
                                        (variant)
                                      </span>
                                    )}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">
                                Not assigned to any categories
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredAttributes.map((attribute) => {
          const values = getValuesForAttribute(attribute.id);
          const categories = attrCategoryMap[attribute.id] || [];
          const isExpanded = expandedAttribute === attribute.id;
          const isSelected = selectedAttributeIds.includes(attribute.id);

          return (
            <Collapsible
              key={attribute.id}
              open={isExpanded}
              onOpenChange={() => handleToggleExpand(attribute.id)}
            >
              <div
                className={cn(
                  "rounded-xl border border-border/60 bg-card overflow-hidden transition-all",
                  isSelected && "border-primary/30 ring-1 ring-primary/20"
                )}
              >
                {/* Card Header */}
                <div
                  className={cn(
                    "p-4 flex items-start gap-3",
                    onSelect && "cursor-pointer"
                  )}
                  onClick={() => onSelect && toggleSelection(attribute.id)}
                >
                  {onSelect && (
                    <div
                      className="pt-0.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelection(attribute.id)}
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                          <Layers className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">
                            {attribute.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">
                              {values.length}{" "}
                              {values.length === 1 ? "value" : "values"}
                            </span>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-xs text-muted-foreground">
                              {categories.length}{" "}
                              {categories.length === 1
                                ? "category"
                                : "categories"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <CollapsibleTrigger
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            )}
                          </Button>
                        </CollapsibleTrigger>

                        <DropdownMenu>
                          <DropdownMenuTrigger
                            asChild
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            {onEdit && (
                              <DropdownMenuItem
                                onClick={() => onEdit(attribute)}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {attribute.isDeleted
                              ? onRestore && (
                                  <DropdownMenuItem
                                    onClick={() => onRestore(attribute.id)}
                                  >
                                    <Check className="w-4 h-4 mr-2" />
                                    Restore
                                  </DropdownMenuItem>
                                )
                              : onDelete && (
                                  <DropdownMenuItem
                                    onClick={() => onDelete(attribute.id)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                <CollapsibleContent>
                  <div className="px-4 pb-4 pt-1 space-y-4 border-t border-border/40">
                    {/* Values */}
                    <div className="pt-3">
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <List className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                            Values
                          </span>
                        </div>
                        <Link
                          href={`/admin/attribute-values?attributeId=${attribute.id}`}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs px-2"
                          >
                            Manage
                          </Button>
                        </Link>
                      </div>
                      {values.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {values.map((value) => (
                            <Badge
                              key={value.id}
                              variant="secondary"
                              className="px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary"
                            >
                              {value.value}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          No values defined
                        </p>
                      )}
                    </div>

                    {/* Categories */}
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <FolderTree className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                            Categories
                          </span>
                        </div>
                        <Link href="/admin/categories">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs px-2"
                          >
                            Manage
                          </Button>
                        </Link>
                      </div>
                      {categories.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {categories.map((catInfo) => (
                            <Badge
                              key={catInfo.categoryId}
                              variant="outline"
                              className={cn(
                                "px-2.5 py-1 text-xs font-medium",
                                catInfo.isVariantSelectable
                                  ? "border-amber-200 bg-amber-500 text-amber-700"
                                  : "border-border"
                              )}
                            >
                              {catInfo.name}
                              {catInfo.isVariantSelectable && (
                                <span className="text-[10px] opacity-70 ml-1">
                                  (variant)
                                </span>
                              )}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          Not assigned to any categories
                        </p>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>

      {/* Selection Bar (Modal Mode) */}
      {mode === "modal" && onSelect && selectedAttributeIds.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-card border border-border/60 rounded-full shadow-lg animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">
              {selectedAttributeIds.length} selected
            </span>
          </div>
          <div className="h-4 w-px bg-border" />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onSelect([])}
          >
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
