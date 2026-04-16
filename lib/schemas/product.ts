import { z } from "zod";

// Get today's date string in YYYY-MM-DD format
const today = new Date().toISOString().split('T')[0];

// Schema for form validation
export const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().min(1, "Description is required").max(500),
  categoryId: z.number().min(1, "Category is required"),
  isActive: z.boolean().optional(),
  variants: z.array(
    z.object({
      id: z.number().optional(), // Variant ID for updates
      sku: z.string().min(1, "SKU is required"),
      price: z.number().min(0, "Price must be positive"),
      stock: z.number().min(0, "Stock must be positive"),
      attributes: z.array(
        z.object({
          attributeId: z.number(),
          valueId: z.number(),
        })
      ),
      // Discount fields (optional)
      discountType: z.enum(["PERCENTAGE", "FIXED"]).optional().nullable(),
      discountValue: z.number().min(0, "Discount value must be positive").max(100, "Percentage cannot exceed 100").optional().nullable(),
      discountStart: z.string().refine(
        (val) => !val || val >= today,
        { message: "Can't select past day" }
      ).optional().nullable(),
      discountEnd: z.string().refine(
        (val) => !val || val >= today,
        { message: "Can't select past day" }
      ).optional().nullable(),
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
  discountType: null,
  discountValue: null,
  discountStart: null,
  discountEnd: null,
} as const;

export const INITIAL_FORM = {
  name: "",
  description: "",
  categoryId: 0,
  isActive: true,
  variants: [INITIAL_VARIANT],
  images: [],
} as const;