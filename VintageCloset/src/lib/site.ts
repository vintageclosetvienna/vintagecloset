// Public address of the shop (main domain; vintagecloset.app redirects to www in Vercel).
// NEXT_PUBLIC_SITE_URL can override it, e.g. for a staging copy.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.vintagecloset.app').replace(/\/$/, '');

export const SITE_NAME = 'Vintage Closet Vienna';
export const SITE_DESCRIPTION =
  'Curated archive of 90s streetwear and luxury essentials. Authentic vintage pieces, housed in Vienna.';
