// Public address of the shop (main domain; vintagecloset.app redirects to www in Vercel).
// NEXT_PUBLIC_SITE_URL can override it, e.g. for a staging copy.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.vintagecloset.app').replace(/\/$/, '');

export const SITE_NAME = 'Vintage Closet Vienna';
export const SITE_DESCRIPTION =
  'Vintage and second hand shop in Vienna: curated 90s streetwear and luxury essentials. Two stores, Spitalgasse 13 (1090) and Taborstraße 56 (1020), and an online shop.';

// Official social channels (footer, menu, search engines)
export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/vintage_closet_vienna/',
  youtube: 'https://www.youtube.com/@vintageclosetvienna',
  facebook: 'https://www.facebook.com/p/Vintage-Closet-61567529122786/',
  tiktok: 'https://www.tiktok.com/@vintage_closet_vienna',
};

// The two stores (Visit page, and the shop data search engines read for Google Maps / local results)
export const STORES = [
  {
    name: 'Spitalgasse',
    street: 'Spitalgasse 13',
    postalCode: '1090',
    lat: 48.2169518,
    lng: 16.3511499,
    mapsUrl: 'https://www.google.com/maps/place/Vintage+closet+1090/@48.2168996,16.3510508,17z/data=!3m1!5s0x476d07c11fad15f5:0xcfd8600dc7f637aa!4m6!3m5!1s0x476d07001dcad353:0x81ddaa4a935620a6!8m2!3d48.2169518!4d16.3511499!16s%2Fg%2F11v_89tdjh?entry=ttu&g_ep=EgoyMDI1MTIwOS4wIKXMDSoASAFQAw%3D%3D',
  },
  {
    name: 'Taborstraße',
    street: 'Taborstraße 56',
    postalCode: '1020',
    lat: 48.221035,
    lng: 16.3816757,
    mapsUrl: 'https://www.google.com/maps/place/Vintage+Closet+1020/@48.2210385,16.3791008,17z/data=!3m1!4b1!4m6!3m5!1s0x476d07fdb8751e41:0xd7b93878f3214d2a!8m2!3d48.221035!4d16.3816757!16s%2Fg%2F11vkgltttq?entry=ttu&g_ep=EgoyMDI1MTIwOS4wIKXMDSoASAFQAw%3D%3D',
  },
];

export const STORE_HOURS = [
  { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '11:00', closes: '19:00' },
  { days: ['Saturday'], opens: '10:00', closes: '18:00' },
];

export const STORE_CONTACT = { phone: '+43 681 10709980', email: 'vintage.closet.vienna@gmail.com' };
