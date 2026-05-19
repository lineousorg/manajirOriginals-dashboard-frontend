/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Product,
  CreateProductInput,
  UpdateProductInput,
} from "@/types/product";
import {
  productsApi,
  PaginationParams,
  PaginatedResponse,
} from "@/services/api";

const PAGE_LIMIT = 20;

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface CategoryProductsParams extends PaginationParams {
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  colors?: string[];
  sort?: "newest" | "price-asc" | "price-desc" | "name-asc" | "name-desc";
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: PAGE_LIMIT,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  });
  const [currentCategorySlug, setCurrentCategorySlug] = useState<string | null>(
    null,
  );
  const [currentSearch, setCurrentSearch] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isInitialMount = useRef(true);

  const fetchProducts = useCallback(async (params?: PaginationParams) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    const queryParams: PaginationParams = {
      page: 1,
      limit: PAGE_LIMIT,
      ...params,
    };

    try {
      const response: PaginatedResponse<Product> =
        await productsApi.getAll(queryParams);

      if (abortControllerRef.current?.signal.aborted) return;

      setProducts(response.data);
      setPagination({
        page: response.pagination.page,
        limit: PAGE_LIMIT,
        total: response.pagination.total,
        totalPages: response.pagination.totalPages,
        hasNext: response.pagination.hasNext,
        hasPrevious: response.pagination.hasPrevious,
      });
      setCurrentCategorySlug(null);
      setCurrentSearch(null);
    } catch (err: any) {
      if (
        err.name !== "AbortError" &&
        !abortControllerRef.current?.signal.aborted
      ) {
        setError(err?.response?.data?.message || "Failed to fetch products");
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  const fetchProductsByCategory = useCallback(
    async (slug: string, params?: CategoryProductsParams) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setIsLoading(true);
      setError(null);

      const queryParams: CategoryProductsParams = {
        page: 1,
        limit: PAGE_LIMIT,
        ...params,
      };

      try {
        const response: PaginatedResponse<Product> =
          await productsApi.getByCategorySlug(slug, queryParams);

        if (abortControllerRef.current?.signal.aborted) return;

        setProducts(response.data);
        setPagination({
          page: response.pagination.page,
          limit: PAGE_LIMIT,
          total: response.pagination.total,
          totalPages: response.pagination.totalPages,
          hasNext: response.pagination.hasNext,
          hasPrevious: response.pagination.hasPrevious,
        });
        setCurrentCategorySlug(slug);
        setCurrentSearch(null);
      } catch (err: any) {
        if (
          err.name !== "AbortError" &&
          !abortControllerRef.current?.signal.aborted
        ) {
          setError(err?.response?.data?.message || "Failed to fetch products");
        }
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  const searchProducts = useCallback(
    async (query: string, params?: PaginationParams) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setIsLoading(true);
      setError(null);

      const queryParams: PaginationParams = {
        page: 1,
        limit: PAGE_LIMIT,
        search: query,
        ...params,
      };

      try {
        const response: PaginatedResponse<Product> =
          await productsApi.getAll(queryParams);

        if (abortControllerRef.current?.signal.aborted) return;

        setProducts(response.data);
        setPagination({
          page: response.pagination.page,
          limit: PAGE_LIMIT,
          total: response.pagination.total,
          totalPages: response.pagination.totalPages,
          hasNext: response.pagination.hasNext,
          hasPrevious: response.pagination.hasPrevious,
        });
        setCurrentCategorySlug(null);
        setCurrentSearch(query);
      } catch (err: any) {
        if (
          err.name !== "AbortError" &&
          !abortControllerRef.current?.signal.aborted
        ) {
          setError(err?.response?.data?.message || "Failed to search products");
        }
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    fetchProducts();
    isInitialMount.current = false;
  }, [fetchProducts]);

  const goToPage = useCallback(
    (page: number) => {
      const params = { page, limit: PAGE_LIMIT };
      if (currentSearch) {
        searchProducts(currentSearch, params);
      } else if (currentCategorySlug) {
        fetchProductsByCategory(currentCategorySlug, params);
      } else {
        fetchProducts(params);
      }
    },
    [
      currentSearch,
      currentCategorySlug,
      searchProducts,
      fetchProductsByCategory,
      fetchProducts,
    ],
  );

  const goToNextPage = useCallback(() => {
    if (pagination.hasNext) {
      goToPage(pagination.page + 1);
    }
  }, [pagination.hasNext, pagination.page, goToPage]);

  const goToPreviousPage = useCallback(() => {
    if (pagination.hasPrevious) {
      goToPage(pagination.page - 1);
    }
  }, [pagination.hasPrevious, pagination.page, goToPage]);

  const setPageSize = useCallback(
    (_limit: number) => {
      if (currentSearch) {
        searchProducts(currentSearch, { page: 1, limit: PAGE_LIMIT });
      } else if (currentCategorySlug) {
        fetchProductsByCategory(currentCategorySlug, {
          page: 1,
          limit: PAGE_LIMIT,
        });
      } else {
        fetchProducts({ page: 1, limit: PAGE_LIMIT });
      }
    },
    [
      currentSearch,
      currentCategorySlug,
      searchProducts,
      fetchProductsByCategory,
      fetchProducts,
    ],
  );

  const filterByCategory = useCallback(
    (slug: string | null) => {
      if (slug) {
        fetchProductsByCategory(slug, { page: 1, limit: PAGE_LIMIT });
      } else {
        fetchProducts({ page: 1, limit: PAGE_LIMIT });
      }
    },
    [fetchProducts, fetchProductsByCategory],
  );

  const setSearchQuery = useCallback(
    (query: string) => {
      if (query && query.trim()) {
        searchProducts(query.trim(), { page: 1, limit: PAGE_LIMIT });
      } else {
        fetchProducts({ page: 1, limit: PAGE_LIMIT });
      }
    },
    [searchProducts, fetchProducts],
  );

  const createProduct = async (data: CreateProductInput): Promise<Product> => {
    setError(null);
    try {
      const created = await productsApi.create(data);
      setProducts((prev) => [...prev, created]);
      return created;
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create product");
      throw err;
    }
  };

  const updateProduct = async (
    id: number,
    data: UpdateProductInput,
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
    data: Partial<UpdateProductInput>,
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
      setProducts((prev) => prev?.filter((p) => p.id !== id));
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete product");
      throw err;
    }
  };

  const toggleProductActive = async (id: number): Promise<Product> => {
    setError(null);
    try {
      const updated = await productsApi.toggleActive(id);
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return updated;
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to toggle product status",
      );
      throw err;
    }
  };

  const toggleVariantActive = async (
    productId: number,
    variantId: number,
  ): Promise<Product> => {
    setError(null);
    try {
      const updated = await productsApi.toggleVariantActive(
        productId,
        variantId,
      );
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? updated : p)),
      );
      return updated;
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to toggle variant status",
      );
      throw err;
    }
  };

  const deleteVariant = async (
    productId: number,
    variantId: number,
  ): Promise<void> => {
    setError(null);
    try {
      await productsApi.deleteVariant(productId, variantId);
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === productId) {
            return {
              ...p,
              variants: p.variants?.filter((v) => v.id !== variantId),
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
    pagination,
    refetch: fetchProducts,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    setPageSize,
    filterByCategory,
    setSearchQuery,
    createProduct,
    updateProduct,
    patchProduct,
    deleteProduct,
    toggleProductActive,
    toggleVariantActive,
    deleteVariant,
  };
};
