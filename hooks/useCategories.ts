/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { Category, CreateCategoryInput, UpdateCategoryInput } from "@/types/category";
import { CategoryAttribute, CreateCategoryAttributeInput, UpdateCategoryAttributeInput } from "@/types/attribute";
import { categoriesApi } from "@/services/api";

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await categoriesApi.getAll();
      setCategories(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to fetch categories");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = async (data: CreateCategoryInput): Promise<Category> => {
    setError(null);
    try {
      const created = await categoriesApi.create(data);
      setCategories((prev) => [...prev, created]);
      return created;
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create category");
      throw err;
    }
  };

  const updateCategory = async (
    id: number,
    data: UpdateCategoryInput,
  ): Promise<Category> => {
    setError(null);
    try {
      const updated = await categoriesApi.update(id, data);
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
      return updated;
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update category");
      throw err;
    }
  };

  const deleteCategory = async (id: number): Promise<void> => {
    setError(null);
    try {
      await categoriesApi.delete(id);
      setCategories((prev) => prev?.filter((c) => c.id !== id));
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete category");
      throw err;
    }
  };

  const toggleCategoryStatus = async (id: number): Promise<Category> => {
    setError(null);
    try {
      const updated = await categoriesApi.toggleStatus(id);
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? updated : c))
      );
      return updated;
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to toggle category status");
      throw err;
    }
  };

  // Get attributes assigned to a category (slug-based, matches backend)
  const getCategoryAttributes = useCallback(async (slug: string): Promise<CategoryAttribute[]> => {
    try {
      return await categoriesApi.getCategoryAttributes(slug);
    } catch (err: any) {
      throw err;
    }
  }, []);

  // Get attributes assigned to a category by slug (kept for backward compat)
  const getCategoryAttributesBySlug = useCallback(async (slug: string): Promise<CategoryAttribute[]> => {
    try {
      return await categoriesApi.getCategoryAttributesBySlug(slug);
    } catch (err: any) {
      throw err;
    }
  }, []);

  // Assign an attribute to a category (slug-based, matches backend)
  const assignAttributeToCategory = async (
    slug: string,
    data: CreateCategoryAttributeInput,
  ): Promise<CategoryAttribute> => {
    setError(null);
    try {
      return await categoriesApi.assignAttribute(slug, data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to assign attribute to category");
      throw err;
    }
  };

  // Assign an attribute to a category by slug (kept for backward compat)
  const assignAttributeToCategoryBySlug = async (
    slug: string,
    data: CreateCategoryAttributeInput,
  ): Promise<CategoryAttribute> => {
    setError(null);
    try {
      return await categoriesApi.assignAttributeBySlug(slug, data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to assign attribute to category");
      throw err;
    }
  };

  // Update a category-attribute assignment (slug-based, matches backend)
  const updateCategoryAttribute = async (
    slug: string,
    attributeId: number,
    data: UpdateCategoryAttributeInput,
  ): Promise<CategoryAttribute> => {
    setError(null);
    try {
      return await categoriesApi.updateCategoryAttribute(slug, attributeId, data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update category attribute");
      throw err;
    }
  };

  // Remove an attribute from a category (slug-based, matches backend)
  const removeAttributeFromCategory = async (
    slug: string,
    attributeId: number,
  ): Promise<void> => {
    setError(null);
    try {
      await categoriesApi.removeAttributeFromCategory(slug, attributeId);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to remove attribute from category");
      throw err;
    }
  };

  return {
    categories,
    isLoading,
    error,
    refetch: fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,
    getCategoryAttributes,
    getCategoryAttributesBySlug,
    assignAttributeToCategory,
    assignAttributeToCategoryBySlug,
    updateCategoryAttribute,
    removeAttributeFromCategory,
  };
};
