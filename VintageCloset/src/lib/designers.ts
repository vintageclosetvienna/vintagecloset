// Discover designers (his ask 31 Oct): the artist collectives, brands and designers who sell through the shop.
// A card lights up once one of their pieces is in the shop: the listing AI writes their name into the title when it
// recognises their label (api/import/piece passes it the names below). Logos: admin can add rows to site_images
// (section 'designers', key designer-<slug>, label = name, description = one line, url = logo); without a logo the
// card shows the name as a wordmark in their own look.

import { supabase, isSupabaseConfigured } from './supabase';
import { getProducts, type Product } from './data';

export interface Designer {
  slug: string;
  name: string;
  kind: string;
  line: string;
  match: string[];                                   // words that mean "their piece" in a title or description
  logo?: string;
  site?: string;
  wordmark: { bg: string; fg: string; font: 'block' | 'serif' | 'script' };
}

export const DEFAULT_DESIGNERS: Designer[] = [
  { slug: 'daszeugs', name: 'DAS ZEUGS', kind: 'Artist collective', line: 'Für immer für alle', match: ['das zeugs', 'daszeugs', 'das zgs'],
    logo: '/designers/daszeugs.jpg', site: 'https://www.daszeugs.com',      // logo from daszeugs.com
    wordmark: { bg: '#ffffff', fg: '#111111', font: 'block' } },
  { slug: 'gwond', name: 'GWOND', kind: 'Brand', line: 'Einführung in die Gunstgeschichte', match: ['gwond'],
    logo: '/designers/gwond.png', site: 'https://gwond.com',               // logo from gwond.com (white version, on black)
    wordmark: { bg: '#0b0b0b', fg: '#ffffff', font: 'serif' } },
  { slug: 'sirens-chrome', name: "Siren's Chrome", kind: 'Jewellery designer', line: 'Handmade one-of-a-kind jewellery: you were never meant to blend in', match: ["siren's chrome", 'sirens chrome', 'siren chrome'],
    site: 'https://www.sirens-chrome.com',                                  // their site has no logo file yet: wordmark
    wordmark: { bg: '#ffffff', fg: '#7b2a6b', font: 'script' } },
];

/** the names the listing AI should recognise on labels and tags */
export const designerNames = (list: Designer[] = DEFAULT_DESIGNERS) => list.map((d) => d.name);

export async function getDesigners(): Promise<Designer[]> {
  const list = DEFAULT_DESIGNERS.map((d) => ({ ...d }));
  if (!isSupabaseConfigured()) return list;
  const { data } = await supabase.from('site_images').select('*').eq('section', 'designers').eq('is_active', true).order('sort_order');
  for (const row of (data || []) as { key: string; label: string; description: string | null; url: string }[]) {
    const slug = row.key.replace(/^designer-/, '');
    const known = list.find((d) => d.slug === slug);
    if (known) {
      known.logo = row.url || known.logo;
      if (row.description) known.line = row.description;
    } else {
      list.push({ slug, name: row.label, kind: 'Designer', line: row.description || '', match: [row.label.toLowerCase()], logo: row.url,
        wordmark: { bg: '#ffffff', fg: '#111111', font: 'block' } });
    }
  }
  return list;
}

export function piecesOf(d: Designer, products: Product[]): Product[] {
  return products.filter((p) => {
    const t = `${p.title} ${p.description || ''}`.toLowerCase().replace(/[’`]/g, "'");
    return d.match.some((m) => t.includes(m));
  });
}

export async function getDesignersWithPieces(): Promise<{ designer: Designer; pieces: Product[] }[]> {
  const [list, products] = await Promise.all([getDesigners(), getProducts()]);
  return list.map((designer) => ({ designer, pieces: piecesOf(designer, products) }));
}
