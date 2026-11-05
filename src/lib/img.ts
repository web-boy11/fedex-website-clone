// Serve images from the public/img directory, resized via URL params if supported,
// otherwise fall back to the original PNG.
export function cdnImage(file: string, _width: number) {
  return `/img/${file}`
}
