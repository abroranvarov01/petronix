// Client-side image compression — runs before upload so we never send huge
// PNG/JPEG originals to the server (nginx caps the request body, and we don't
// want multi-MB files on disk either). Big raster images are resized to a sane
// max dimension and re-encoded to WebP, which keeps transparency and is much
// smaller than PNG. On any failure we fall back to the original file.

interface CompressOptions {
  maxDimension?: number; // longest side, px
  quality?: number; // 0..1 for the WebP encoder
}

const DEFAULTS: Required<CompressOptions> = { maxDimension: 1600, quality: 0.82 };

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("decode failed")); };
    img.src = url;
  });
}

export async function compressImage(file: File, opts: CompressOptions = {}): Promise<File> {
  const { maxDimension, quality } = { ...DEFAULTS, ...opts };

  // Only touch raster images we can safely re-encode. Leave anything else as-is.
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;

  try {
    const img = await loadImage(file);
    const { width, height } = img;
    const scale = Math.min(1, maxDimension / Math.max(width, height));
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, w, h);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/webp", quality),
    );
    // Browser without WebP encode support, or something odd happened.
    if (!blob) return file;

    // Keep the original unless the re-encode is actually smaller (or the source
    // is large enough that shrinking is clearly worth it despite edge cases).
    if (blob.size >= file.size && file.size <= 1_500_000) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], name, { type: "image/webp", lastModified: Date.now() });
  } catch {
    return file;
  }
}
