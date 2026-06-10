/**
 * Custom hook for managing attributes scoped to a specific category
 *
 * Fetches and manages the relationship between categories and their assigned attributes,
 * including variant-selectable and required settings.
 *
 * @module useCategoryAttributes
 * @returns {UseCategoryAttributesReturn} Object containing category attributes state and utility functions
 *
 * @example
 * ```typescript
 * const {
 *   categoryAttributes,
 *   isLoading,
 *   fetchCategoryAttributes,
 *   attributesWithSettings,
 * } = useCategoryAttributes();
 * ```
 */

import { useState, useEffect, useCallback } from "react";
import { CategoryAttribute, Attribute } from "@/types/attribute";
import { categoriesApi } from "@/services/api";

interface UseCategoryAttributesReturn {
  /** Array of category-attribute relationships for the selected category */
  categoryAttributes: CategoryAttribute[];
  /** Resolved attributes with their category-specific settings merged in */
  attributesWithSettings: Array<Attribute & { isVariantSelectable: boolean; isRequired: boolean; valueRestrictionMode?: 'ALL' | 'SELECTED' | 'NONE'; valueIds?: number[] }>;
  /** Loading state */
  isLoading: boolean;
  /** Error message if API call fails */
  error: string | null;
  /** Function to fetch category attributes for a given category slug */
  fetchCategoryAttributes: (slug: string) => Promise<CategoryAttribute[]>;
  /** Function to fetch category attributes by category slug */
  fetchCategoryAttributesBySlug: (slug: string) => Promise<CategoryAttribute[]>;
}

export const useCategoryAttributes = (): UseCategoryAttributesReturn => {
  const [categoryAttributes, setCategoryAttributes] = useState<CategoryAttribute[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategoryAttributes = useCallback(async (slug: string): Promise<CategoryAttribute[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await categoriesApi.getCategoryAttributes(slug);
      setCategoryAttributes(data);
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || "Failed to fetch category attributes");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCategoryAttributesBySlug = useCallback(async (slug: string): Promise<CategoryAttribute[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await categoriesApi.getCategoryAttributesBySlug(slug);
      setCategoryAttributes(data);
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || "Failed to fetch category attributes");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Build a merged view of attributes with their category-specific settings
  const attributesWithSettings: Array<Attribute & { isVariantSelectable: boolean; isRequired: boolean; valueRestrictionMode?: 'ALL' | 'SELECTED' | 'NONE'; valueIds?: number[] }> =
    categoryAttributes
      .filter((ca) => ca.attribute && !ca.attribute.isDeleted)
      .map((ca) => ({
        ...ca.attribute!,
        isVariantSelectable: ca.isVariantSelectable,
        isRequired: ca.isRequired,
        valueRestrictionMode: ca.valueRestrictionMode,
        valueIds: ca.valueIds,
      }));

  return {
    categoryAttributes,
    attributesWithSettings,
    isLoading,
    error,
    fetchCategoryAttributes,
    fetchCategoryAttributesBySlug,
  };
};