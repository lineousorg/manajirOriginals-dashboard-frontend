/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, useCallback } from "react";
import { Order, OrderStatus, UpdateOrderStatusInput } from "@/types/order";
import { ordersApi } from "@/services/api";

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await ordersApi.getAll();
      console.log(data);
      setOrders(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to fetch orders");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getOrderById = useCallback(async (id: number): Promise<Order> => {
    setError(null);
    try {
      const data = await ordersApi.getById(id);
      return data;
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to fetch order details");
      throw err;
    }
  }, []);

  const updateOrderStatus = async (
    id: number,
    data: UpdateOrderStatusInput
  ): Promise<Order> => {
    setError(null);
    try {
      const updated = await ordersApi.updateStatus(id, data);
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
      return updated;
    } catch (err: any) {
      console.log(err);
      setError(err?.response?.data?.message);
      throw err?.response?.data?.message;
    }
  };

  const downloadReceipt = async (id: number): Promise<void> => {
    setError(null);
    try {
      const blob = await ordersApi.getReceipt(id);
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      // Create a temporary link element
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `receipt-${id}.pdf`);
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      // Clean up the URL
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to download receipt");
      throw err;
    }
  };

  return {
    orders,
    isLoading,
    error,
    refetch: fetchOrders,
    getOrderById,
    updateOrderStatus,
    downloadReceipt,
  };
};
