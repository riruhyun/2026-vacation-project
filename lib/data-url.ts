import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
} from "@/lib/image-constraints";

export function captureImageError(image: Pick<File, "type" | "size">) {
  if (!ALLOWED_IMAGE_TYPES.some((type) => type === image.type)) {
    return "JPG 또는 PNG 이미지만 선택할 수 있어요.";
  }
  if (image.size > MAX_IMAGE_SIZE) {
    return "이미지는 6MB 이하여야 해요.";
  }
  return null;
}
