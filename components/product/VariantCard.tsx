"use client";

import {
  UseFormRegister,
  UseFormWatch,
  UseFormSetValue,
  FieldErrors,
  Control,
} from "react-hook-form";
import { Plus, Trash2, ChevronUp, ChevronDown, Loader2, Tag, X } from "lucide-react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ProductFormData } from "@/lib/schemas/product";
import { Attribute, AttributeValue } from "@/types/attribute";
import { useState, useEffect } from "react";

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
    // Discount fields from API
    discountType?: string | null;
    discountValue?: number | string | null;
    discountStart?: string | null;
    discountEnd?: string | null;
  };
  attributes: Attribute[];
  attributeValues: AttributeValue[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onRemove: () => void;
  onToggleActive?: () => void;
  isToggling?: boolean;
  isDeleting?: boolean;
  register: UseFormRegister<ProductFormData>;
  control: Control<ProductFormData>;
  watch: UseFormWatch<ProductFormData>;
  setValue: UseFormSetValue<ProductFormData>;
  errors: FieldErrors<ProductFormData>;
  productName?: string;
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
  isDeleting,
  register,
  control,
  watch,
  setValue,
  errors,
  productName = "",
}: VariantCardProps) {
  // Initialize discount values from backend variant data
  useEffect(() => {
    if (backendVariant?.id) {
      // Set discount values from backend data if they exist
      if (backendVariant.discountType !== undefined && backendVariant.discountType !== null) {
        setValue(`variants.${index}.discountType`, backendVariant.discountType as "PERCENTAGE" | "FIXED");
      }
      if (backendVariant.discountValue !== undefined && backendVariant.discountValue !== null) {
        setValue(`variants.${index}.discountValue`, Number(backendVariant.discountValue));
      }
      if (backendVariant.discountStart) {
        // Convert to date format (YYYY-MM-DD)
        const date = new Date(backendVariant.discountStart);
        const formatted = date.toISOString().split('T')[0];
        setValue(`variants.${index}.discountStart`, formatted);
      }
      if (backendVariant.discountEnd) {
        const date = new Date(backendVariant.discountEnd);
        const formatted = date.toISOString().split('T')[0];
        setValue(`variants.${index}.discountEnd`, formatted);
      }
    }
  }, [backendVariant, index, setValue]);

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
            disabled={isDeleting}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
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
                const filteredValues = attributeValues?.filter((av) => av.attributeId === attr.id);

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
                        const currentAttrs = (watch(`variants.${index}.attributes`) || [])?.filter((a) => a.attributeId !== attr.id);
                        if (newVal > 0) {
                          currentAttrs.push({ attributeId: attr.id, valueId: newVal });
                        }
                        setValue(`variants.${index}.attributes`, currentAttrs);

                        // Auto-generate SKU when attributes change
                        const attrs = watch(`variants.${index}.attributes`) || [];
                        const nameSku = productName
                          .toUpperCase()
                          .replace(/[^A-Z\s-]/g, "")
                          .split(/\s+/)
                          ?.filter(Boolean)
                          .map((word) => word[0])
                          .join("");
                        const attrValueMap: Record<number, string> = {};
                        attributeValues.forEach((av) => {
                          attrValueMap[av.id] = av.value.substring(0, 3).toUpperCase();
                        });
                        const attrCodes = attrs
                          .map((a) => attrValueMap[a.valueId] || "")
                          ?.filter(Boolean);
                        const newSku = `${nameSku}-${attrCodes.join("-")}-${index + 1}`.toUpperCase();
                        setValue(`variants.${index}.sku`, newSku);
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
              <div className="flex items-center gap-2">
                {isToggling && (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                )}
                <Switch
                  checked={backendVariant.isActive ?? true}
                  onCheckedChange={onToggleActive}
                  disabled={isToggling}
                />
              </div>
            </div>
          )}

          {/* Discount Section */}
          <DiscountSection
            index={index}
            variant={variant}
            register={register}
            watch={watch}
            setValue={setValue}
            errors={errors}
          />
        </div>
      )}
    </div>
  );
}

// Discount Section Component
interface DiscountSectionProps {
  index: number;
  variant: ProductFormData["variants"][0];
  register: UseFormRegister<ProductFormData>;
  watch: UseFormWatch<ProductFormData>;
  setValue: UseFormSetValue<ProductFormData>;
  errors: FieldErrors<ProductFormData>;
}

function DiscountSection({
  index,
  variant,
  register,
  watch,
  setValue,
  errors,
}: DiscountSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const discountType = watch(`variants.${index}.discountType`);
  const discountValue = watch(`variants.${index}.discountValue`);
  const price = watch(`variants.${index}.price`) || 0;

  // Get today's date string for comparison (YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];

  // Validate dates - show error for past dates
  const discountStart = watch(`variants.${index}.discountStart`);
  const discountEnd = watch(`variants.${index}.discountEnd`);

  // Custom validation for past dates
  useEffect(() => {
    if (discountStart && discountStart < today) {
      setValue(`variants.${index}.discountStart`, "");
    }
    if (discountEnd && discountEnd < today) {
      setValue(`variants.${index}.discountEnd`, "");
    }
  }, [discountStart, discountEnd, today, index, setValue]);

  // Calculate discounted price
  const calculateDiscountedPrice = () => {
    if (!discountType || !discountValue || discountValue <= 0) {
      return null;
    }
    if (discountType === "PERCENTAGE") {
      return Math.max(0, price - (price * discountValue) / 100);
    } else if (discountType === "FIXED") {
      return Math.max(0, price - discountValue);
    }
    return null;
  };

  const discountedPrice = calculateDiscountedPrice();
  const hasDiscount = discountType && discountValue && discountValue > 0;

  const clearDiscount = () => {
    setValue(`variants.${index}.discountType`, null);
    setValue(`variants.${index}.discountValue`, null);
    setValue(`variants.${index}.discountStart`, null);
    setValue(`variants.${index}.discountEnd`, null);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-4">
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between py-2 cursor-pointer hover:bg-muted/50 rounded px-2 -mx-2">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Discount (Optional)</span>
            {hasDiscount && (
              <Badge variant="secondary" className="text-xs">
                Active
              </Badge>
            )}
          </div>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 pt-2">
        {/* Discount Type */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Type</Label>
          <RadioGroup
            value={discountType || ""}
            onValueChange={(val) => {
              setValue(`variants.${index}.discountType`, val as "PERCENTAGE" | "FIXED");
              if (!watch(`variants.${index}.discountValue`)) {
                setValue(`variants.${index}.discountValue`, 0);
              }
            }}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="PERCENTAGE" id={`percentage-${index}`} />
              <Label htmlFor={`percentage-${index}`} className="text-sm cursor-pointer">
                Percentage (% off)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="FIXED" id={`fixed-${index}`} />
              <Label htmlFor={`fixed-${index}`} className="text-sm cursor-pointer">
                Fixed (BDT off)
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Discount Value */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Value {discountType === "PERCENTAGE" ? "(%) " : "(BDT) "}
            {discountType === "PERCENTAGE" && "(max 100)"}
          </Label>
          <Input
            type="number"
            step={discountType === "PERCENTAGE" ? "1" : "1"}
            min={0}
            max={discountType === "PERCENTAGE" ? 100 : undefined}
            placeholder={discountType === "PERCENTAGE" ? "20" : "300"}
            {...register(`variants.${index}.discountValue`, {
              valueAsNumber: true,
            })}
            className={errors.variants?.[index]?.discountValue ? "border-destructive" : ""}
          />
          {errors.variants?.[index]?.discountValue && (
            <p className="text-xs text-destructive">
              {errors.variants[index]?.discountValue?.message}
            </p>
          )}
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Start Date</Label>
            <Input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              {...register(`variants.${index}.discountStart`)}
              className={errors.variants?.[index]?.discountStart ? "border-destructive" : "text-sm"}
            />
            {errors.variants?.[index]?.discountStart && (
              <p className="text-xs text-destructive">
                {errors.variants[index]?.discountStart?.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">End Date</Label>
            <Input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              {...register(`variants.${index}.discountEnd`)}
              className={errors.variants?.[index]?.discountEnd ? "border-destructive" : "text-sm"}
            />
            {errors.variants?.[index]?.discountEnd && (
              <p className="text-xs text-destructive">
                {errors.variants[index]?.discountEnd?.message}
              </p>
            )}
          </div>
        </div>

        {/* Preview */}
        {hasDiscount && discountedPrice !== null && (
          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <p className="text-xs text-muted-foreground">Preview</p>
            <div className="flex items-center gap-2">
              <span className="text-sm line-through text-muted-foreground">
                ৳{price}
              </span>
              <span className="text-sm font-semibold text-green-600">
                ৳{discountedPrice.toFixed(0)}
              </span>
              {discountType === "PERCENTAGE" && (
                <Badge variant="secondary" className="text-xs">
                  {discountValue}% off
                </Badge>
              )}
              {discountType === "FIXED" && (
                <Badge variant="secondary" className="text-xs">
                  ৳{discountValue} off
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Clear Button */}
        {hasDiscount && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearDiscount}
            className="text-destructive hover:text-destructive"
          >
            <X className="w-4 h-4 mr-1" />
            Remove Discount
          </Button>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
