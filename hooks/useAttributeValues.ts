/**
 * Custom hook for managing attribute values via API
 * 
 * Provides CRUD operations for attribute values (e.g., "Red", "Blue" for Color)
 * and integrates with the attribute-values API endpoints.
 * 
 * @module useAttributeValues
 * @returns {UseAttributeValuesReturn} Object containing attribute values state and CRUD functions
 * 
 * @example
 * ```typescript
 * const {
 *   attributeValues,
 *   isLoading,
 *   error,
 *   refetch,
 *   createAttributeValue,
 *   updateAttributeValue,
 *   deleteAttributeValue,
 *   getValuesByAttributeId
 * } = useAttributeValues();
 * ```
 */

import { useState, useEffect, useCallback } from "react";
import { AttributeValue, CreateAttributeValueInput, UpdateAttributeValueInput } from "@/types/attribute";
import { attributeValuesApi } from "@/services/api";

/**
 * Return type for the useAttributeValues hook
 */
interface UseAttributeValuesReturn {
  /** Array of all attribute values with parent attribute info */
  attributeValues: AttributeValue[];
  /** Loading state */
  isLoading: boolean;
  /** Error message if API call fails */
  error: string | null;
  /** Function to refetch all attribute values */
  refetch: () => Promise<void>;
  /** Function to create a new attribute value */
  createAttributeValue: (data: CreateAttributeValueInput) => Promise<AttributeValue>;
  /** Function to update an existing attribute value */
  updateAttributeValue: (id: number, data: UpdateAttributeValueInput) => Promise<AttributeValue>;
  /** Function to delete an attribute value */
  deleteAttributeValue: (id: number) => Promise<void>;
  /** Function to get values for a specific attribute */
  getValuesByAttributeId: (attributeId: number) => Promise<AttributeValue[]>;
}

/**
 * Custom hook for managing attribute values
 * 
 * Fetches all attribute values on mount and provides methods for creating,
 * updating, and deleting attribute values.
 * 
 * Attribute values represent possible values for an attribute:
 * - Attribute: "Color" -> Values: "Red", "Blue", "Green"
 * - Attribute: "Size" -> Values: "S", "M", "L", "XL"
 */
export const useAttributeValues = (): UseAttributeValuesReturn => {
  const [attributeValues, setAttributeValues] = useState<AttributeValue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches all attribute values from the API
   */
  const fetchAttributeValues = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await attributeValuesApi.getAll();
      setAttributeValues(data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || "Failed to fetch attribute values");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch attribute values on mount
  useEffect(() => {
    fetchAttributeValues();
  }, [fetchAttributeValues]);

  /**
   * Creates a new attribute value
   * @param data - The attribute value data (value, attributeId)
   * @returns The created attribute value
   */
  const createAttributeValue = async (data: CreateAttributeValueInput): Promise<AttributeValue> => {
    setError(null);
    try {
      const created = await attributeValuesApi.create(data);
      setAttributeValues((prev) => [...prev, created]);
      return created;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || "Failed to create attribute value");
      throw err;
    }
  };

  /**
   * Updates an existing attribute value
   * @param id - The attribute value ID
   * @param data - The updated data
   * @returns The updated attribute value
   */
  const updateAttributeValue = async (
    id: number,
    data: UpdateAttributeValueInput,
  ): Promise<AttributeValue> => {
    setError(null);
    try {
      const updated = await attributeValuesApi.update(id, data);
      setAttributeValues((prev) => prev.map((av) => (av.id === id ? updated : av)));
      return updated;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || "Failed to update attribute value");
      throw err;
    }
  };

  /**
   * Deletes an attribute value
   * @param id - The attribute value ID to delete
   */
  const deleteAttributeValue = async (id: number): Promise<void> => {
    setError(null);
    try {
      await attributeValuesApi.delete(id);
      setAttributeValues((prev) => prev.filter((av) => av.id !== id));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || "Failed to delete attribute value");
      throw err;
    }
  };

  /**
   * Gets all values for a specific attribute
   * @param attributeId - The parent attribute ID
   * @returns Array of attribute values for the specified attribute
   */
  const getValuesByAttributeId = useCallback(async (attributeId: number): Promise<AttributeValue[]> => {
    try {
      return await attributeValuesApi.getByAttributeId(attributeId);
    } catch (err: unknown) {
      throw err;
    }
  }, []);

  return {
    attributeValues,
    isLoading,
    error,
    refetch: fetchAttributeValues,
    createAttributeValue,
    updateAttributeValue,
    deleteAttributeValue,
    getValuesByAttributeId,
  };
};
