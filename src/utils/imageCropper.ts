/**
 * Image processing utilities for National ID cards:
 * - Auto-cropping the face / portrait area from an Egyptian National ID
 * - Compressing and resizing images for fast AI processing & storage
 */

export interface CropRegion {
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  width: number; // percentage (0 - 100)
  height: number; // percentage (0 - 100)
}

/**
 * Default portrait region for Egyptian National ID Card (Front Face):
 * Standard modern Egyptian National ID places the photo on the LEFT side of the card.
 */
export const DEFAULT_EGYPTIAN_ID_PHOTO_REGION_LEFT: CropRegion = {
  x: 4, // starts at ~4% from left
  y: 14, // starts at ~14% from top
  width: 32, // ~32% width
  height: 72, // ~72% height
};

export const DEFAULT_EGYPTIAN_ID_PHOTO_REGION_RIGHT: CropRegion = {
  x: 64, // starts at ~64% from left
  y: 14, // starts at ~14% from top
  width: 32, // ~32% width
  height: 72, // ~72% height
};

export const DEFAULT_EGYPTIAN_ID_PHOTO_REGION: CropRegion = DEFAULT_EGYPTIAN_ID_PHOTO_REGION_LEFT;

/**
 * Loads an image from a Data URL or Image URL
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Crops a specified percentage region from an image and returns a base64 Data URL.
 */
export async function cropImageRegion(
  imageSrc: string,
  region: CropRegion = DEFAULT_EGYPTIAN_ID_PHOTO_REGION,
  outputSize: { width: number; height: number } = { width: 320, height: 380 }
): Promise<string> {
  const img = await loadImage(imageSrc);

  const canvas = document.createElement('canvas');
  canvas.width = outputSize.width;
  canvas.height = outputSize.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // Calculate actual pixel coordinates
  const sourceX = (region.x / 100) * img.naturalWidth;
  const sourceY = (region.y / 100) * img.naturalHeight;
  const sourceWidth = (region.width / 100) * img.naturalWidth;
  const sourceHeight = (region.height / 100) * img.naturalHeight;

  // Draw cropped and scaled image onto canvas
  ctx.drawImage(
    img,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    outputSize.width,
    outputSize.height
  );

  return canvas.toDataURL('image/jpeg', 0.88);
}

/**
 * Resize and compress any uploaded image to avoid sending large files to AI / localStorage.
 */
export async function resizeImage(
  imageSrc: string,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.85
): Promise<string> {
  const img = await loadImage(imageSrc);

  let { naturalWidth: width, naturalHeight: height } = img;
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return imageSrc;

  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
}

