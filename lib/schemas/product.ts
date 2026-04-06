import { z } from "zod";

// Schema for form validation
export const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().min(1, "Description is required").max(500),
  categoryId: z.number().min(1, "Category is required"),
  variants: z.array(
    z.object({
      sku: z.string().min(1, "SKU is required"),
      price: z.number().min(0, "Price must be positive"),
      stock: z.number().min(0, "Stock must be positive"),
      attributes: z.array(
        z.object({
          attributeId: z.number(),
          valueId: z.number(),
        })
      ),
    })
  ).min(1, "At least one variant is required"),
  images: z.array(
    z.object({
      url: z.string().min(1, "Image URL is required"),
      altText: z.string().optional(),
      position: z.number(),
    })
  ).optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;

// Initial values
export const INITIAL_VARIANT = {
  sku: "",
  price: 0,
  stock: 0,
  attributes: [],
} as const;

export const INITIAL_FORM = {
  name: "",
  description: "",
  categoryId: 0,
  variants: [INITIAL_VARIANT],
  images: [],
} as const;