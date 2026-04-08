"use client";

import {
  UseFormRegister,
  UseFormWatch,
  UseFormSetValue,
  FieldErrors,
  Control,
} from "react-hook-form";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductFormData } from "@/lib/schemas/product";
import { Attribute, AttributeValue } from "@/types/attribute";

interface VariantCardProps {
  index: number;
  variant: ProductFormData["variants"][0];
  backendVariant?: {
    id: number;
    sku: string;
    price: number;
    stock: number;
    isActive: boolean;
    attributes?: {
      attributeValue: {
        id: number;
        value: string;
        attribute: { id: number; name: string };
      };
    }[];
  };
  attributes: Attribute[];
  attributeValues: AttributeValue[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onRemove: () => void;
  onToggleActive?: () => void;
  isToggling?: boolean;
  register: UseFormRegister<ProductFormData>;
  control: Control<ProductFormData>;
  watch: UseFormWatch<ProductFormData>;
  setValue: UseFormSetValue<ProductFormData>;
  errors: FieldErrors<ProductFormData>;
}

export default function VariantCard({
  index,
  variant,
  backendVariant,
  attributes,
  attributeValues,
  isExpanded,
  onToggleExpand,
  onRemove,
  onToggleActive,
  isToggling,
  register,
  control,
  watch,
  setValue,
  errors,
}: VariantCardProps) {
  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      {/* Header */}
      <div
        onClick={onToggleExpand}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-4">
          {/* Status Badge */}
          {backendVariant?.id ? (
            <Badge
              variant={backendVariant.isActive ? "default" : "secondary"}
              className="h-6"
            >
              {backendVariant.isActive ? "Active" : "Inactive"}
            </Badge>
          ) : (
            <Badge variant="outline" className="h-6">
              New
            </Badge>
          )}

          {/* Quick Info */}
          <div className="flex items-center gap-3 text-sm">
            <span className="font-mono text-muted-foreground">
              {watch(`variants.${index}.sku`) || "No SKU"}
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="font-semibold">
              ৳{watch(`variants.${index}.price`) || 0}
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">
              Stock: {watch(`variants.${index}.stock`) || 0}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Delete Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>

          {/* Expand/Collapse Icon */}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="p-4 pt-0 border-t bg-muted/30">
          <div className="grid gap-4 md:grid-cols-3 pt-4">
            {/* SKU */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">SKU</Label>
              <Input
                placeholder="SKU-123"
                {...register(`variants.${index}.sku`)}
                className={
                  errors.variants?.[index]?.sku ? "border-destructive" : ""
                }
              />
              {errors.variants?.[index]?.sku && (
                <p className="text-xs text-destructive">
                  {errors.variants[index]?.sku?.message}
                </p>
              )}
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Price (BDT)
              </Label>
              <Input
                type="number"
                step="1"
                placeholder="0"
                {...register(`variants.${index}.price`, {
                  valueAsNumber: true,
                })}
                className={
                  errors.variants?.[index]?.price ? "border-destructive" : ""
                }
              />
              {errors.variants?.[index]?.price && (
                <p className="text-xs text-destructive">
                  {errors.variants[index]?.price?.message}
                </p>
              )}
            </div>

            {/* Stock */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Stock</Label>
              <Input
                type="number"
                placeholder="0"
                {...register(`variants.${index}.stock`, {
                  valueAsNumber: true,
                })}
                className={
                  errors.variants?.[index]?.stock ? "border-destructive" : ""
                }
              />
              {errors.variants?.[index]?.stock && (
                <p className="text-xs text-destructive">
                  {errors.variants[index]?.stock?.message}
                </p>
              )}
            </div>
          </div>

          {/* Attributes Section - Read-only for existing variants, editable for new variants */}
          <div className="mt-4 space-y-3">
            <Label className="text-muted-foreground">Attributes</Label>
            <div className="flex flex-wrap gap-3">
              {attributes.map((attr) => {
                const formValues = watch(`variants.${index}.attributes`) || [];
                const attrValue = formValues.find((a) => a.attributeId === attr.id);
                const currentValueId = attrValue?.valueId || 0;
                const filteredValues = attributeValues.filter((av) => av.attributeId === attr.id);

                // For existing variants (backendVariant.id exists), show read-only display
                // Get the attribute value directly from backend data
                const isExistingVariant = !!backendVariant?.id;
                
                if (isExistingVariant) {
                  // Get attribute value from backend data
                  const backendAttr = backendVariant?.attributes?.find(
                    (a) => a.attributeValue?.attribute?.id === attr.id
                  );
                  const backendValue = backendAttr?.attributeValue?.value || "N/A";
                  
                  return (
                    <div key={attr.id} className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground block">
                        {attr.name}
                      </span>
                      <div className="w-[140px] h-9 px-3 py-2 border rounded-md bg-muted/50 text-sm flex items-center">
                        {backendValue}
                      </div>
                    </div>
                  );
                }

                // New variants: Allow editing
                return (
                  <div key={attr.id} className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground block">
                      {attr.name}
                    </span>
                    <Select
                      value={currentValueId ? String(currentValueId) : ""}
                      onValueChange={(val) => {
                        const newVal = Number(val);
                        const currentAttrs = (watch(`variants.${index}.attributes`) || []).filter((a) => a.attributeId !== attr.id);
                        if (newVal > 0) {
                          currentAttrs.push({ attributeId: attr.id, valueId: newVal });
                        }
                        setValue(`variants.${index}.attributes`, currentAttrs);
                      }}
                    >
                      <SelectTrigger className="w-[140px] h-9">
                        <SelectValue placeholder={`Select ${attr.name}`} />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {filteredValues.map((val) => (
                          <SelectItem key={val.id} value={String(val.id)}>
                            {val.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status Toggle */}
          {backendVariant?.id && (
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Variant Status
                </Label>
                <p className="text-xs text-muted-foreground">
                  {backendVariant.isActive
                    ? "This variant is visible to customers"
                    : "This variant is hidden from customers"}
                </p>
              </div>
              <Switch
                checked={backendVariant.isActive ?? true}
                onCheckedChange={onToggleActive}
                disabled={isToggling}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
