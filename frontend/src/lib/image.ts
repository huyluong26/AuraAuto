/**
 * High-definition image optimizer utility for AuraAuto.
 * Automatically upgrades Unsplash, Cloudinary, and external CDN image URLs
 * to Ultra HD resolution (up to 4K) with maximum sharpness and minimal compression artifacts.
 */
export function getHighResImageUrl(
  url: string | null | undefined,
  targetWidth: number = 2560,
  quality: number = 95
): string {
  if (!url) return '';

  // 1. Unsplash: Upgrade to Ultra HD dimensions and maximum clarity
  if (url.includes('images.unsplash.com')) {
    try {
      const u = new URL(url);
      u.searchParams.set('auto', 'format');
      u.searchParams.set('fit', 'crop');
      u.searchParams.set('w', String(targetWidth));
      u.searchParams.set('q', String(quality));
      u.searchParams.delete('blur');
      return u.toString();
    } catch {
      return url
        .replace(/w=\d+/, `w=${targetWidth}`)
        .replace(/q=\d+/, `q=${quality}`);
    }
  }

  // 2. Cloudinary: Inject optimal quality & format transformation
  if (url.includes('cloudinary.com') && url.includes('/upload/')) {
    const parts = url.split('/upload/');
    const transform = `f_auto,q_auto:best,w_${targetWidth},c_limit`;
    if (parts[1].startsWith('v') || parts[1].startsWith('http')) {
      return `${parts[0]}/upload/${transform}/${parts[1]}`;
    }
    // Remove old transformation if exists
    return `${parts[0]}/upload/${transform}/${parts[1].replace(/^[^/]+\//, '')}`;
  }

  return url;
}
