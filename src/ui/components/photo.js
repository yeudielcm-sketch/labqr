// Item photos (F6): resized in the phone before saving, so the database and backups stay small.
// Stored as a JPEG data URL on the item (about 30–80 KB each).

const MAX_SIDE = 640;
const QUALITY = 0.72;

export async function fileToPhoto(file) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  return canvas.toDataURL('image/jpeg', QUALITY);
}

// Only images this app created are shown (guards against odd values in a restored backup).
export function isPhoto(value) {
  return typeof value === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value);
}
