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
  /** Timestamp when the value was created */
  createdAt: string;
  /** Timestamp when the value was last updated */
  updatedAt: string;
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
