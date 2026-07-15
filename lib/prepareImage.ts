// Vercel serverless functions reject request bodies over 4.5MB — that limit
// fires before any of our code runs, producing an opaque "Request Entity Too
// Large" HTML response. So we shrink oversized images in the browser first.
//
// Headshots and logos never need to be 6MB. Downscaling to 1600px on the long
// edge keeps them far sharper than the render templates require, while cutting
// file size by an order of magnitude.

const MAX_EDGE = 1600;
const TARGET_BYTES = 3_500_000; // comfortably under Vercel's 4.5MB
const QUALITY = 0.9;

export interface PreparedFile {
  file: File | Blob;
  filename: string;
  resized: boolean;
  originalBytes: number;
  finalBytes: number;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Returns the file unchanged when it's already small enough, otherwise a
 * downscaled copy. SVGs are passed through untouched (vector, already tiny,
 * and rasterising them would defeat the point).
 */
export async function prepareImage(file: File): Promise<PreparedFile> {
  const base: PreparedFile = {
    file,
    filename: file.name,
    resized: false,
    originalBytes: file.size,
    finalBytes: file.size,
  };

  if (file.type === "image/svg+xml") return base;
  if (file.size <= TARGET_BYTES) return base;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // Can't decode it — hand it back and let the server reject it with a
    // clear message rather than failing silently here.
    return base;
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return base;

  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  // Keep PNG for transparency (logos), JPEG otherwise — JPEG compresses
  // photographic headshots far better.
  const outType = file.type === "image/png" ? "image/png" : "image/jpeg";
  let blob = await canvasToBlob(canvas, outType, QUALITY);

  // A large flat PNG can still exceed the cap after resizing; fall back to JPEG.
  if (blob && blob.size > TARGET_BYTES && outType === "image/png") {
    blob = await canvasToBlob(canvas, "image/jpeg", QUALITY);
  }

  if (!blob || blob.size >= file.size) return base;

  const ext = blob.type === "image/png" ? "png" : "jpg";
  const stem = file.name.replace(/\.[^.]+$/, "");

  return {
    file: blob,
    filename: `${stem}.${ext}`,
    resized: true,
    originalBytes: file.size,
    finalBytes: blob.size,
  };
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
