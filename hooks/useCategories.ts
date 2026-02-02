/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { Category, CreateCategoryInput, UpdateCategoryInput } from "@/types/category";
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
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete category");
      throw err;
    }
  };

  const toggleCategoryActive = async (id: number): Promise<Category> => {
    setError(null);
    try {
      const updated = await categoriesApi.toggleActive(id);
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
      return updated;
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to toggle category status");
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
    toggleCategoryActive,
  };
};
