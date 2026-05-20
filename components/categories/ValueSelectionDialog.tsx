"use client";

import * as React from "react";
import { Search, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface AttributeValue {
  id: number;
  value: string;
  attributeId: number;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
}

interface ValueSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attributeName: string;
  values: AttributeValue[];
  selectedIds: number[];
  onToggleValue: (valueId: number) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

const ValueSelectionDialog = ({
  open,
  onOpenChange,
  attributeName,
  values,
  selectedIds,
  onToggleValue,
  onSelectAll,
  onClearAll,
}: ValueSelectionDialogProps) => {
  const activeValues = React.useMemo(
    () => values.filter((v) => !v.isDeleted),
    [values]
  );

  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredValues = React.useMemo(() => {
    if (!searchQuery.trim()) return activeValues;
    return activeValues.filter((v) =>
      v.value.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeValues, searchQuery]);

  const allSelected =
    activeValues.length > 0 && activeValues.every((v) => selectedIds.includes(v.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Select {attributeName} Values</DialogTitle>
          <DialogDescription>
            Choose which {attributeName.toLowerCase()} options to apply.
          </DialogDescription>
        </DialogHeader>

        {/* Search + bulk actions */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${attributeName.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={onSelectAll}
              disabled={allSelected || filteredValues.length === 0}
            >
              Select all
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={onClearAll}
              disabled={selectedIds.length === 0}
            >
              Clear all
            </Button>
          </div>
        </div>

        {/* Values list */}
        <ScrollArea className="max-h-64 border rounded-lg">
          {filteredValues.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              {searchQuery
                ? `No "${attributeName.toLowerCase()}" matching "${searchQuery}".`
                : "No active values available."}
            </div>
          ) : (
            <div className="divide-y">
              {filteredValues.map((valueItem) => {
                const isSelected = selectedIds.includes(valueItem.id);
                return (
                  <button
                    key={valueItem.id}
                    onClick={() => onToggleValue(valueItem.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-sm transition-colors cursor-pointer",
                      isSelected
                        ? "bg-accent/60 hover:bg-accent/80"
                        : "hover:bg-accent/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onToggleValue(valueItem.id)}
                        className="pointer-events-none"
                      />
                      <span>{valueItem.value}</span>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="pt-2 border-t">
          <span className="mr-auto py-2 text-sm text-muted-foreground">
            {selectedIds.length} of {activeValues.length} selected
          </span>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={selectedIds.length === 0}
          >
            Apply Selection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ValueSelectionDialog;
