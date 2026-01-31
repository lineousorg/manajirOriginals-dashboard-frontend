export interface ProductVariant {
  id?: number;
  productId?: number;
  size: string;
  color: string;
  price: number;
  stock: number;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  categoryId: number;
  isFeatured: boolean;
  isBest?: boolean;
  isActive: boolean;
  variants: ProductVariant[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  categoryId: number;
  isFeatured: boolean;
  isBest?: boolean;
  isActive: boolean;
  variants: Omit<ProductVariant, "id">[];
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  variants?: ProductVariant[];
}
