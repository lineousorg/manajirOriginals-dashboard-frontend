export interface Category {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
  parent: Category | null;
  children: Category[];
  _count: {
    products: number;
  };
}

export interface CreateCategoryInput {
  name: string;
  slug: string;
  parentId?: number | null;
}

export type UpdateCategoryInput = Partial<CreateCategoryInput>;
