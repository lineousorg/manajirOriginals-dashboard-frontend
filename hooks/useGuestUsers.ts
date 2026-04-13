/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { useState, useEffect, useCallback } from "react";
import { GuestUser } from "@/types/user";
import { guestUsersApi, PaginatedResponse } from "@/services/api";

export const useGuestUsers = () => {
  const [guestUsers, setGuestUsers] = useState<GuestUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  } | null>(null);

  const fetchGuestUsers = useCallback(async (page?: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data: PaginatedResponse<GuestUser> = await guestUsersApi.getAll({ page });
      setGuestUsers(data.data);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to fetch guest users");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGuestUsers();
  }, [fetchGuestUsers]);

  return {
    guestUsers,
    isLoading,
    error,
    pagination,
    refetch: fetchGuestUsers,
  };
};