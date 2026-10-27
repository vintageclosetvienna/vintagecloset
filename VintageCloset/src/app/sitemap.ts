import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { getProducts } from '@/lib/data';
import { getJournalArticles } from '@/lib/journal-data';
import { getEvents } from '@/lib/events-data';

// Rebuilt hourly so new products and articles show up
export const revalidate = 3600;

const STATIC_ROUTES = ['', '/new-arrivals', '/women', '/men', '/unisex', '/journal', '/events', '/visit', '/terms'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, articles, events] = await Promise.all([
    getProducts().catch(() => []),
    getJournalArticles().catch(() => []),
    getEvents().catch(() => []),
  ]);

  return [
    ...STATIC_ROUTES.map(route => ({
      url: `${SITE_URL}${route}`,
      changeFrequency: route === '' || route === '/new-arrivals' ? ('daily' as const) : ('weekly' as const),
      priority: route === '' ? 1 : 0.8,
    })),
    ...products.map(product => ({
      url: `${SITE_URL}/product/${product.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...events.map(event => ({
      url: `${SITE_URL}/events/${event.slug}`,
      changeFrequency: 'daily' as const,
      priority: 0.6,
    })),
    ...articles.map(article => ({
      url: `${SITE_URL}/journal/${article.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
  ];
}
