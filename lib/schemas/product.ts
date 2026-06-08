import { z } from "zod";

// Get today's date string in YYYY-MM-DD format
const today = new Date().toISOString().split('T')[0];

// Schema for form validation
export const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().min(1, "Description is required").max(500),
  productDetailsHtml: z.string().optional(),
  categoryId: z.number().min(1, "Category is required"),
  isActive: z.boolean().optional(),
  variants: z.array(
    z.object({
      id: z.number().optional(), // Variant ID for updates
      sku: z.string().min(1, "SKU is required"),
      price: z.number().min(0.01, "Price must be greater than 0"),
      stock: z.number().min(0, "Stock must be a positive number"),
      attributes: z.array(
        z.object({
          attributeId: z.number(),
          valueId: z.number(),
        })
      ).optional(), // Changed from .min(1) to .optional()
      // Discount fields (optional)
      discountType: z.enum(["PERCENTAGE", "FIXED"]).optional().nullable(),
      discountValue: z.number().min(0, "Discount value must be positive").optional().nullable(),
      discountStart: z.string().refine(
        (val) => !val || val >= today,
        { message: "Can't select past day" }
      ).optional().nullable(),
      discountEnd: z.string().refine(
        (val) => !val || val >= today,
        { message: "Can't select past day" }
      ).optional().nullable(),
    }).superRefine((data, ctx) => {
      // Conditional validation: only enforce max 100 for percentage discounts
      if (data.discountType === "PERCENTAGE" && data.discountValue !== null && data.discountValue !== undefined && data.discountValue > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Percentage cannot exceed 100",
          path: ["discountValue"],
        });
      }
      // Validate FIXED discount does not exceed price
      if (data.discountType === "FIXED" && data.discountValue !== null && data.discountValue !== undefined && data.price !== undefined && data.discountValue > data.price) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Fixed discount value cannot exceed the variant price",
          path: ["discountValue"],
        });
      }
      // Validate discountEnd is after discountStart
      if (data.discountStart && data.discountEnd && data.discountEnd <= data.discountStart) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Discount end date must be after discount start date",
          path: ["discountEnd"],
        });
      }
    })
  ).optional(), // Changed from .min(1) to .optional()
  images: z.array(
    z.object({
      id: z.number().optional(), // Image ID for existing images (edit mode)
      url: z.string().min(1, "Image URL is required"),
      publicId: z.string().optional(), // Cloudinary public ID for deletion
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
  productDetailsHtml: "",
  categoryId: 0,
  isActive: true,
  variants: [],
  images: [],
} as const;