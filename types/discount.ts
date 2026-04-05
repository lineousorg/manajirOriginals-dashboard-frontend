// Discount type enum
export enum DiscountType {
  PERCENTAGE = "PERCENTAGE",
  FIXED = "FIXED",
}

// Discount target enum
export enum DiscountTarget {
  ALL_PRODUCTS = "ALL_PRODUCTS",
  SPECIFIC_CATEGORY = "SPECIFIC_CATEGORY",
  SPECIFIC_VARIANTS = "SPECIFIC_VARIANTS",
}

// Category for discount targeting
export interface DiscountCategory {
  id: number;
  name: string;
  slug: string;
}

// Product variant for discount targeting
export interface DiscountVariant {
  id: number;
  sku: string;
  price: number;
  productId: number;
  productName: string;
}

// Main Discount interface (matches backend API response)
export interface Discount {
  id: number;
  name: string;
  code: string | null;
  type: DiscountType;
  value: number;
  target: DiscountTarget;
  minOrderAmount: number | null;
  maxDiscountAmt: number | null;
  isActive: boolean;
  startsAt: string;
  expiresAt: string | null;
  usageCount: number;
  maxUsage: number | null;
  categoryId: number | null;
  category: DiscountCategory | null;
  variants: DiscountVariant[];
  createdAt: string;
  updatedAt: string;
}

// API Response wrapper types
export type ApiResponse<T> = {
  message: string;
  status: "success" | "error";
  data: T;
};

export type DiscountsApiResponse = ApiResponse<Discount[]>;
export type DiscountApiResponse = ApiResponse<Discount>;

// Input types for creating/updating discounts
export interface CreateDiscountInput {
  name: string;
  code?: string;
  type: DiscountType;
  value: number;
  target: DiscountTarget;
  minOrderAmount?: number;
  maxDiscountAmt?: number;
  isActive?: boolean;
  startsAt: string;
  expiresAt?: string;
  maxUsage?: number;
  categoryId?: number;
  variantIds?: number[];
}

export interface UpdateDiscountInput extends Partial<CreateDiscountInput> {
  // Allow toggling active status
  isActive?: boolean;
}