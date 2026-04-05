/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Discount,
  CreateDiscountInput,
  UpdateDiscountInput,
} from "@/types/discount";
import { discountsApi } from "@/services/api";

export const useDiscounts = () => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDiscounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await discountsApi.getAll();
      setDiscounts(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to fetch discounts");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  const getDiscountById = useCallback(async (id: number): Promise<Discount> => {
    setError(null);
    try {
      const data = await discountsApi.getById(id);
      return data;
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to fetch discount details");
      throw err;
    }
  }, []);

  const createDiscount = async (
    data: CreateDiscountInput
  ): Promise<Discount> => {
    setError(null);
    try {
      const created = await discountsApi.create(data);
      setDiscounts((prev) => [...prev, created]);
      return created;
    } catch (err: any) {
      console.log(err);
      setError(err?.response?.data?.message);
      throw err?.response?.data?.message;
    }
  };

  const updateDiscount = async (
    id: number,
    data: UpdateDiscountInput
  ): Promise<Discount> => {
    setError(null);
    try {
      const updated = await discountsApi.update(id, data);
      setDiscounts((prev) => prev.map((d) => (d.id === id ? updated : d)));
      return updated;
    } catch (err: any) {
      console.log(err);
      setError(err?.response?.data?.message);
      throw err?.response?.data?.message;
    }
  };

  const deleteDiscount = async (id: number): Promise<void> => {
    setError(null);
    try {
      await discountsApi.delete(id);
      setDiscounts((prev) => prev.filter((d) => d.id !== id));
    } catch (err: any) {
      console.log(err);
      setError(err?.response?.data?.message);
      throw err?.response?.data?.message;
    }
  };

  const toggleDiscountActive = async (id: number): Promise<Discount> => {
    setError(null);
    try {
      const updated = await discountsApi.toggleActive(id);
      setDiscounts((prev) => prev.map((d) => (d.id === id ? updated : d)));
      return updated;
    } catch (err: any) {
      console.log(err);
      setError(err?.response?.data?.message);
      throw err?.response?.data?.message;
    }
  };

  return {
    discounts,
    isLoading,
    error,
    refetch: fetchDiscounts,
    getDiscountById,
    createDiscount,
    updateDiscount,
    deleteDiscount,
    toggleDiscountActive,
  };
};