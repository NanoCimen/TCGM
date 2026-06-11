const MAX_BYTES = 1_000_000;
const MAX_DIMENSION = 1600;
const MIN_QUALITY = 0.4;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo leer la imagen"));
    img.src = src;
  });
}

function dataUrlSize(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Math.ceil((base64.length * 3) / 4);
}

function render(
  img: HTMLImageElement,
  width: number,
  height: number,
  quality: number
): string {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no soportado");
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

/**
 * Compress an image file to a JPEG data URL of at most ~1MB.
 */
export async function compressImage(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);

    let width = img.naturalWidth;
    let height = img.naturalHeight;
    const maxSide = Math.max(width, height);
    if (maxSide > MAX_DIMENSION) {
      const scale = MAX_DIMENSION / maxSide;
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    let quality = 0.85;
    let result = render(img, width, height, quality);

    while (dataUrlSize(result) > MAX_BYTES && quality > MIN_QUALITY) {
      quality -= 0.1;
      result = render(img, width, height, quality);
    }

    // Still too big at minimum quality: halve dimensions until it fits
    while (dataUrlSize(result) > MAX_BYTES && Math.max(width, height) > 400) {
      width = Math.round(width / 2);
      height = Math.round(height / 2);
      result = render(img, width, height, quality);
    }

    return result;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/data:(.*?);/)?.[1] ?? "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}
