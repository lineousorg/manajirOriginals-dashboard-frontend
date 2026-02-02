export interface Category {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  parentId: number | null;
  productCount: number;
  subcategories?: SubCategory[];
  createdAt: string;
  updatedAt: string;
}

export interface SubCategory {
  id: number;
  name: string;
  categoryId: number;
}

export interface CreateCategoryInput {
  name: string;
  isActive: boolean;
  subcategories?: { name: string }[];
}

export type UpdateCategoryInput = Partial<CreateCategoryInput>;
