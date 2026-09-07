export const MAX_IMAGE_SIZE_MB = 10;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

export function isImageFileTooLarge(file: File | null | undefined) {
  return Boolean(file && file.size > MAX_IMAGE_SIZE_BYTES);
}
