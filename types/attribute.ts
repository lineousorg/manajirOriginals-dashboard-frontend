/**
 * Type definitions for Attributes and Attribute Values
 * 
 * These types represent the data structure for product attributes system.
 * Attributes define characteristics (e.g., Color, Size), while AttributeValues
 * define the possible values for each attribute.
 * 
 * @module types/attribute
 */

/**
 * Represents a product attribute (e.g., "Color", "Size", "Material")
 * 
 * @example
 * ```json
 * {
 *   "id": 1,
 *   "name": "Color",
 *   "isActive": true,
 *   "isDeleted": false,
 *   "deletedAt": null,
 *   "createdAt": "2024-01-01T00:00:00Z",
 *   "updatedAt": "2024-01-01T00:00:00Z",
 *   "values": [
 *     { "id": 1, "value": "Red", "attributeId": 1 }
 *   ]
 * }
 * ```
 */
export interface Attribute {
  /** Unique identifier for the attribute */
  id: number;
  /** Name of the attribute (e.g., "Color", "Size") */
  name: string;
  /** Whether the attribute is active */
  isActive: boolean;
  /** Whether the attribute is soft-deleted */
  isDeleted: boolean;
  /** Timestamp when the attribute was soft-deleted */
  deletedAt: string | null;
  /** Timestamp when the attribute was created */
  createdAt: string;
  /** Timestamp when the attribute was last updated */
  updatedAt: string;
  /** Array of possible values for this attribute (optional, fetched separately) */
  values?: AttributeValue[];
}

/**
 * Represents a value for an attribute (e.g., "Red" for Color, "M" for Size)
 * 
 * @example
 * ```json
 * {
 *   "id": 1,
 *   "value": "Red",
 *   "attributeId": 1,
 *   "attribute": { "id": 1, "name": "Color" },
 *   "isActive": true,
 *   "isDeleted": false,
 *   "deletedAt": null,
 *   "createdAt": "2024-01-01T00:00:00Z",
 *   "updatedAt": "2024-01-01T00:00:00Z"
 * }
 * ```
 */
export interface AttributeValue {
  /** Unique identifier for the attribute value */
  id: number;
  /** The value itself (e.g., "Red", "Blue", "M", "L") */
  value: string;
  /** ID of the parent attribute */
  attributeId: number;
  /** Parent attribute info (included when fetching all values) */
  attribute?: Attribute;
  /** Whether the value is active */
  isActive: boolean;
  /** Whether the value is soft-deleted */
  isDeleted: boolean;
  /** Timestamp when the value was soft-deleted */
  deletedAt: string | null;
  /** Timestamp when the value was created */
  createdAt: string;
  /** Timestamp when the value was last updated */
  updatedAt: string;
}

/**
  * Represents the relationship between a Category and an Attribute.
  * This allows attributes to be scoped to specific categories.
  */
export interface CategoryAttribute {
  /** Unique identifier for the category-attribute relationship */
  id: number;
  /** ID of the category */
  categoryId: number;
  /** ID of the attribute */
  attributeId: number;
  /** Display order on the category page (lower values appear first) */
  sortOrder: number;
  /** Whether this attribute can be used for variant generation */
  isVariantSelectable: boolean;
  /** Whether this attribute is required for products in this category */
  isRequired: boolean;
  /** Value restriction mode for this attribute in the category */
  valueRestrictionMode?: 'ALL' | 'SELECTED' | 'NONE';
  /** Specific value IDs allowed when valueRestrictionMode is SELECTED */
  valueIds?: number[];
  /** Timestamp when the relationship was created */
  createdAt: string;
  /** Timestamp when the relationship was last updated */
  updatedAt: string;
  /** The attribute details (included when fetching with relations) */
  attribute?: Attribute;
}

/**
 * Represents an attribute applicable to a specific product/category,
 * including its restriction mode and the values allowed for variant selection.
 * This is the shape returned by the product API under `applicableAttributes`.
 */
export interface ApplicableAttribute {
  /** ID of the attribute */
  attributeId: number;
  /** Name of the attribute */
  name: string;
  /** Whether this attribute is required for variants */
  isRequired: boolean;
  /** Whether this attribute can be used for variant generation */
  isVariantSelectable: boolean;
  /** Restriction mode controlling which values appear in the dropdown */
  valueRestrictionMode: "ALL" | "SELECTED" | "NONE";
  /** Allowed value IDs when mode is SELECTED; empty when ALL or NONE */
  valueIds: number[];
  /** All possible values for this attribute */
  values: {
    id: number;
    value: string;
  }[];
}

/**
 * Input type for creating a new attribute
 */
export interface CreateAttributeInput {
  /** Name of the attribute to create */
  name: string;
}

/**
 * Input type for updating an attribute
 */
export interface UpdateAttributeInput {
  /** New name for the attribute */
  name: string;
}

/**
 * Input type for creating a new attribute value
 */
export interface CreateAttributeValueInput {
  /** The value to create (e.g., "Red", "Large") */
  value: string;
  /** ID of the parent attribute */
  attributeId: number;
}

/**
 * Input type for updating an attribute value
 */
export interface UpdateAttributeValueInput {
  /** New value string */
  value: string;
}

/**
  * Input type for assigning an attribute to a category
  */
export interface CreateCategoryAttributeInput {
  /** ID of the attribute to assign */
  attributeId: number;
  /** Display order on the category page (lower values appear first) */
  sortOrder?: number;
  /** Whether this attribute can be used for variant generation */
  isVariantSelectable?: boolean;
  /** Whether this attribute is required for products in this category */
  isRequired?: boolean;
  /** Value restriction mode for this attribute in the category */
  valueRestrictionMode?: 'ALL' | 'SELECTED' | 'NONE';
  /** Specific value IDs allowed when valueRestrictionMode is SELECTED */
  valueIds?: number[];
}

/**
  * Input type for updating a category-attribute relationship
  */
export interface UpdateCategoryAttributeInput {
  /** Display order on the category page (lower values appear first) */
  sortOrder?: number;
  /** Whether this attribute can be used for variant generation */
  isVariantSelectable?: boolean;
  /** Whether this attribute is required for products in this category */
  isRequired?: boolean;
  /** Value restriction mode for this attribute in the category */
  valueRestrictionMode?: 'ALL' | 'SELECTED' | 'NONE';
  /** Specific value IDs allowed when valueRestrictionMode is SELECTED */
  valueIds?: number[];
}
