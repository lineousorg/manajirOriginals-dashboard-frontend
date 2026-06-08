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

// Generate SKU based on product name and variant attributes
// Format: {NAME_PART}-{ATTR1}-{ATTR2}-{INDEX}
// Example: "T-Shirt Red" with Color=Red, Size=Large → "TSHIRT-RED-LRG-1"
export const generateSKU = (
  productName: string,
  attributes: Array<{ attributeId: number; valueId: number }>,
  attributeValues: Array<{ id: number; value: string; attributeId: number }>,
  variantIndex: number,
): string => {
  // Clean product name: uppercase, remove non-letters
  const words = productName
    .toUpperCase()
    .replace(/[^A-Z\s-]/g, "")
    .split(/\s+/)
    ?.filter(Boolean);

  if (words.length === 0) return "";

  // Create name part: initials + consonants from last word
  const initials = words.map((word) => word[0]).join("");
  const lastWordConsonants = words[words.length - 1]
    .slice(1)
    .replace(/[AEIOU]/g, "");

  const nameSku = initials + lastWordConsonants;

  // Map attribute values to 3-character codes
  const attrValueMap: Record<number, string> = {};
  attributeValues.forEach((av) => {
    attrValueMap[av.id] = av.value.substring(0, 3).toUpperCase();
  });

  // Build attribute codes
  const attrCodes = attributes
    .map((a) => attrValueMap[a.valueId] || "")
    ?.filter(Boolean);

  // Final SKU format
  return `${nameSku}-${attrCodes.join("-")}-${variantIndex + 1}`.toUpperCase();
};

// Convert file to base64
export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });