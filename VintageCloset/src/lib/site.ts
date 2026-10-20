// Public address of the shop. Set NEXT_PUBLIC_SITE_URL in Vercel (Production) to the main domain,
// e.g. https://vintagecloset.at; until then the Vercel address is used.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://vintagecloset.vercel.app').replace(/\/$/, '');

export const SITE_NAME = 'Vintage Closet Vienna';
export const SITE_DESCRIPTION =
  'Curated archive of 90s streetwear and luxury essentials. Authentic vintage pieces, housed in Vienna.';
