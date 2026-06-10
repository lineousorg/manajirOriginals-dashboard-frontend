import { CategoryAttribute } from "./attribute";

export interface CategoryImage {
  url: string;
  altText: string;
  position: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  parentId: number | null;
  images: CategoryImage[];
  createdAt: string;
  updatedAt: string;
  parent: Category | null;
  children: Category[];
  _count: {
    products: number;
  };
  /** Attributes assigned to this category (optional, fetched separately) */
  categoryAttributes?: CategoryAttribute[];
  isDeleted: boolean;
}

export interface CreateCategoryInput {
  name: string;
  slug: string;
  parentId?: number | null;
  images: CategoryImage[];
}

export type UpdateCategoryInput = Partial<CreateCategoryInput>;
