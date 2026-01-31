export interface ProductVariant {
  size: string;
  color: string;
  price: number;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: number;
  isFeatured: boolean;
  isBest: boolean;
  isActive: boolean;
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  categoryId: number | string;
  isFeatured: boolean;
  isBest: boolean;
  isActive: boolean;
  variants: Omit<ProductVariant, 'id'>[];
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  variants?: ProductVariant[];
}
