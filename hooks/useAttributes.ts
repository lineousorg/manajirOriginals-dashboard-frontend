/**
 * Custom hook for managing attributes via API
 * 
 * Provides CRUD operations for product attributes (e.g., Color, Size, Material)
 * and integrates with the attributes API endpoints.
 * 
 * @module useAttributes
 * @returns {UseAttributesReturn} Object containing attributes state and CRUD functions
 * 
 * @example
 * ```typescript
 * const {
 *   attributes,
 *   isLoading,
 *   error,
 *   refetch,
 *   createAttribute,
 *   updateAttribute,
 *   deleteAttribute
 * } = useAttributes();
 * ```
 */

import { useState, useEffect, useCallback } from "react";
import { Attribute, CreateAttributeInput, UpdateAttributeInput } from "@/types/attribute";
import { attributesApi } from "@/services/api";

/**
 * Return type for the useAttributes hook
 */
interface UseAttributesReturn {
  /** Array of all attributes */
  attributes: Attribute[];
  /** Loading state */
  isLoading: boolean;
  /** Error message if API call fails */
  error: string | null;
  /** Function to refetch attributes */
  refetch: () => Promise<void>;
  /** Function to create a new attribute */
  createAttribute: (data: CreateAttributeInput) => Promise<Attribute>;
  /** Function to update an existing attribute */
  updateAttribute: (id: number, data: UpdateAttributeInput) => Promise<Attribute>;
  /** Function to delete an attribute */
  deleteAttribute: (id: number) => Promise<void>;
  /** Function to get a single attribute by ID */
  getAttributeById: (id: number) => Promise<Attribute>;
}

/**
 * Custom hook for managing product attributes
 * 
 * Fetches all attributes on mount and provides methods for creating,
 * updating, and deleting attributes.
 */
export const useAttributes = (): UseAttributesReturn => {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches all attributes from the API
   */
  const fetchAttributes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await attributesApi.getAll();
      setAttributes(data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || "Failed to fetch attributes");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch attributes on mount
  useEffect(() => {
    fetchAttributes();
  }, [fetchAttributes]);

  /**
   * Creates a new attribute
   * @param data - The attribute data (name)
   * @returns The created attribute
   */
  const createAttribute = async (data: CreateAttributeInput): Promise<Attribute> => {
    setError(null);
    try {
      const created = await attributesApi.create(data);
      setAttributes((prev) => [...prev, created]);
      return created;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || "Failed to create attribute");
      throw err;
    }
  };

  /**
   * Updates an existing attribute
   * @param id - The attribute ID
   * @param data - The updated data
   * @returns The updated attribute
   */
  const updateAttribute = async (
    id: number,
    data: UpdateAttributeInput,
  ): Promise<Attribute> => {
    setError(null);
    try {
      const updated = await attributesApi.update(id, data);
      setAttributes((prev) => prev.map((a) => (a.id === id ? updated : a)));
      return updated;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || "Failed to update attribute");
      throw err;
    }
  };

  /**
   * Deletes an attribute
   * @param id - The attribute ID to delete
   */
  const deleteAttribute = async (id: number): Promise<void> => {
    setError(null);
    try {
      await attributesApi.delete(id);
      setAttributes((prev) => prev.filter((a) => a.id !== id));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || "Failed to delete attribute");
      throw err;
    }
  };

  /**
   * Gets a single attribute by ID
   * @param id - The attribute ID
   * @returns The attribute with the specified ID
   */
  const getAttributeById = useCallback(async (id: number): Promise<Attribute> => {
    try {
      return await attributesApi.getById(id);
    } catch (err: unknown) {
      throw err;
    }
  }, []);

  return {
    attributes,
    isLoading,
    error,
    refetch: fetchAttributes,
    createAttribute,
    updateAttribute,
    deleteAttribute,
    getAttributeById,
  };
};
