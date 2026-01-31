"use client";

import { authApi, productsApi } from "@/services/api";

export const useApi = () => {
  return {
    auth: authApi,
    products: productsApi,
  };
};
