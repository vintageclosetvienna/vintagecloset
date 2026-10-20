// Public address of the shop (main domain; vintagecloset.app redirects to www in Vercel).
// NEXT_PUBLIC_SITE_URL can override it, e.g. for a staging copy.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.vintagecloset.app').replace(/\/$/, '');

export const SITE_NAME = 'Vintage Closet Vienna';
export const SITE_DESCRIPTION =
  'Curated archive of 90s streetwear and luxury essentials. Authentic vintage pieces, housed in Vienna.';

// Official social channels (footer, menu, search engines)
export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/vintage_closet_vienna/',
  youtube: 'https://www.youtube.com/@vintageclosetvienna',
  facebook: 'https://www.facebook.com/p/Vintage-Closet-61567529122786/',
  tiktok: 'https://www.tiktok.com/@vintage_closet_vienna',
};
