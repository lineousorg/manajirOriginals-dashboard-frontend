export const PRODUCT_IMAGE_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export const PRODUCT_IMAGE_ALLOWED_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
];

export const PRODUCT_IMAGE_MAX_SIZE = 5 * 1024 * 1024;

export const validateProductImageFile = (file: File): string | null => {
  const extension = file.name.split(".").pop()?.toLowerCase();

  const isAllowedType =
    PRODUCT_IMAGE_ALLOWED_TYPES.includes(file.type) ||
    (extension ? PRODUCT_IMAGE_ALLOWED_EXTENSIONS.includes(extension) : false);

  if (!isAllowedType) {
    return "Only jpg, png, webp, and gif images are allowed.";
  }

  if (file.size > PRODUCT_IMAGE_MAX_SIZE) {
    return "Image must be 5MB or smaller.";
  }

  return null;
};
