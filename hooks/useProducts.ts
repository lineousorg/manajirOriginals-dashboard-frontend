/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { useState, useEffect, useCallback } from "react";
import {
  Product,
  CreateProductInput,
  UpdateProductInput,
} from "@/types/product";
import { productsApi } from "@/services/api";

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await productsApi.getAll();
      console.log(data);
      setProducts(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to fetch products");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const createProduct = async (data: CreateProductInput): Promise<Product> => {
    setError(null);
    try {
      const created = await productsApi.create(data);
      console.log(data);
      setProducts((prev) => [...prev, created]);
      return created;
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create product");
      throw err;
    }
  };

  const updateProduct = async (
    id: number,
    data: UpdateProductInput
  ): Promise<Product> => {
    setError(null);
    try {
      const updated = await productsApi.update(id, data);
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return updated;
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update product");
      throw err;
    }
  };

  const patchProduct = async (
    id: number,
    data: Partial<UpdateProductInput>
  ): Promise<Product> => {
    setError(null);
    try {
      const updated = await productsApi.patch(id, data);
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return updated;
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update product");
      throw err;
    }
  };

  const deleteProduct = async (id: number): Promise<void> => {
    setError(null);
    try {
      await productsApi.delete(id);
      // For soft delete, we filter out the product from the local state
      // The API now returns products without deleted ones
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete product");
      throw err;
    }
  };

  // Toggle product active status
  const toggleProductActive = async (id: number): Promise<Product> => {
    setError(null);
    try {
      const updated = await productsApi.toggleActive(id);
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return updated;
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to toggle product status");
      throw err;
    }
  };

  // Toggle variant active status
  const toggleVariantActive = async (
    productId: number,
    variantId: number,
  ): Promise<Product> => {
    setError(null);
    try {
      const updated = await productsApi.toggleVariantActive(productId, variantId);
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? updated : p)),
      );
      return updated;
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to toggle variant status");
      throw err;
    }
  };

  // Soft delete variant
  const deleteVariant = async (
    productId: number,
    variantId: number,
  ): Promise<void> => {
    setError(null);
    try {
      await productsApi.deleteVariant(productId, variantId);
      // Update local state to remove the variant
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === productId) {
            return {
              ...p,
              variants: p.variants.filter((v) => v.id !== variantId),
            };
          }
          return p;
        }),
      );
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete variant");
      throw err;
    }
  };

  return {
    products,
    isLoading,
    error,
    refetch: fetchProducts,
    createProduct,
    updateProduct,
    patchProduct,
    deleteProduct,
    toggleProductActive,
    toggleVariantActive,
    deleteVariant,
  };
};
