import { VariantAttributeResponse } from "@/types/product";

// Transform API response attributes to form-friendly format
export const transformVariantAttributes = (
  variant: { attributes?: VariantAttributeResponse[] }
): { attributeId: number; valueId: number }[] => {
  if (!variant.attributes || !Array.isArray(variant.attributes)) return [];

  return variant.attributes
    .map((attr) => ({
      attributeId: attr.attributeValue?.attribute?.id ?? 0,
      valueId: attr.attributeValue?.id ?? 0,
    }))
    ?.filter((a) => a.attributeId > 0 && a.valueId > 0);
};

// Convert file to base64
export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });