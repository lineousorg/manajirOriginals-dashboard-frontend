/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Product } from "@/types/product";
import { productsApi } from "@/services/api";

export const useProduct = (id?: number) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await productsApi.getById(id);
        setProduct(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to fetch product");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  return { product, isLoading, error };
};
