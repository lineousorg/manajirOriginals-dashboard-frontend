"use client";

import { authApi, productsApi, categoriesApi } from "@/services/api";

export const useApi = () => {
  return {
    auth: authApi,
    products: productsApi,
    categories: categoriesApi,
  };
};
