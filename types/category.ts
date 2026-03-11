export interface CategoryImage {
  url: string;
  altText: string;
  position: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  images: CategoryImage[];
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
  images: CategoryImage[];
}

export type UpdateCategoryInput = Partial<CreateCategoryInput>;
