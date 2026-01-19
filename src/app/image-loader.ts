import { ImageLoaderConfig } from '@angular/common';

/**
 * Custom Image Loader using wsrv.nl (Free Image CDN)
 * This acts as a proxy to optimize images from GitHub Raw and other sources.
 * It provides:
 * 1. Automatic resizing (width)
 * 2. Format conversion (to WebP/AVIF)
 * 3. Quality compression
 */
export function cdnImageLoader(config: ImageLoaderConfig): string {
  // Check if the image source is already a full URL
  const src = config.src;
  
  // If it's a Picsum image, they have their own sizing logic, but for simplicity
  // and performance consistency, we can proxy them or return as is.
  // Here we proxy GitHub images specifically as they are heavy.
  if (src.includes('raw.githubusercontent.com') || src.includes('github.com')) {
    const proxyBase = 'https://wsrv.nl/';
    const params = new URLSearchParams();
    
    params.set('url', src);
    params.set('af', ''); // Adaptive Format (serves WebP/AVIF automatically based on browser support)
    params.set('l', '9'); // Compression level (optional optimization)
    params.set('q', '80'); // Quality 80%

    // NgOptimizedImage requests specific widths based on 'sizes' attribute
    if (config.width) {
      params.set('w', config.width.toString());
    }

    return `${proxyBase}?${params.toString()}`;
  }

  // For other sources (like picsum.photos), return as-is or implement specific logic.
  // Note: NgOptimizedImage will still append srcset based on this return value,
  // so for simple dynamic sources, passing through is often safest unless we strictly map the URL structure.
  return src;
}