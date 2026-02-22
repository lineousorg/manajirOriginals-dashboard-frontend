// Product category interface (nested in Product)
export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
}

// Product variant attribute interface
export interface VariantAttribute {
  attributeId: number;
  valueId: number;
}

// Product variant interface (matches API response)
export interface ProductVariant {
  id: number;
  sku: string;
  price: number;
  stock: number;
  productId: number;
  attributes: VariantAttribute[];
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Main Product interface (matches API response)
export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  brand: string | null;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  categoryId: number;
  category: ProductCategory;
  variants: ProductVariant[];
  images?: ProductImage[];
  createdAt: string;
  updatedAt: string;
}

// Input types for creating/updating products
export interface ProductImage {
  url: string;
  altText: string;
  position: number;
}

export interface CreateProductInput {
  name: string;
  slug: string;
  description: string;
  categoryId: number;
  variants: CreateVariantInput[];
  images?: ProductImage[];
}

export interface CreateVariantInput {
  sku: string;
  price: number;
  stock: number;
  attributes?: VariantAttribute[];
  isActive?: boolean;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  variants?: CreateVariantInput[];
}

// API Response wrapper types
export type ApiResponse<T> = {
  message: string;
  status: "success" | "error";
  data: T;
};

export type ProductsApiResponse = ApiResponse<Product[]>;
export type ProductApiResponse = ApiResponse<Product>;
