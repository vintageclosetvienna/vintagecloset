import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { getTeamMember, hasRole } from '@/lib/server-auth';

// Photo Drop (admin → Site Images): recognise up to 8 shop photos per call so they can be placed
// on the site automatically. Low image detail keeps it cheap (~85 tokens per photo); no web search.

export const maxDuration = 120;

const DEFAULT_MODEL = 'gpt-5.6-sol'; // same default as src/lib/ai-listing.ts
const MAX_PHOTOS = 8;

const INSTRUCTIONS = `You sort photos for the website of Vintage Closet, a curated vintage clothing store in Vienna.
For every photo, in the order given, decide:
- kind: "model" = a person wearing the clothes (outfit, look, portrait);
  "flatlay" = clothing without a person (on a hanger, rail, table, floor, mannequin);
  "detail" = close-up of a label, fabric, print, button, stitching or accessory;
  "store" = the shop or pop-up space, racks, interior, shop window, street front;
  "event" = people at an event, DJ, party, crowd, workshop;
  "other" = anything else (screenshots, documents, food, unrelated).
- gender: who the clothes are styled for: "women", "men", "unisex" (fits both or mixed), "none" (no clothing focus).
- quality: 1-10 for use as a large website image: sharpness, light, composition, a calm background,
  and how well it fits a warm, editorial vintage look. Blurry, dark or cluttered photos get 1-4.
- focus_x, focus_y: the main subject's centre in % of width and height (0-100), e.g. a face or the garment.
  Cropped site slots keep this point in view.
- caption: a 1-3 word English label for a carousel slide, e.g. "Vintage Denim", "Pop-up Night", "70s Leather".
- usable: false for screenshots, documents, receipts, duplicates of bad quality, or anything not about the shop.`;

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    photos: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          kind: { type: 'string', enum: ['model', 'flatlay', 'detail', 'store', 'event', 'other'] },
          gender: { type: 'string', enum: ['women', 'men', 'unisex', 'none'] },
          quality: { type: 'integer' },
          focus_x: { type: 'integer' },
          focus_y: { type: 'integer' },
          caption: { type: 'string' },
          usable: { type: 'boolean' },
        },
        required: ['kind', 'gender', 'quality', 'focus_x', 'focus_y', 'caption', 'usable'],
      },
    },
  },
  required: ['photos'],
};

interface Raw {
  kind: string;
  gender: string;
  quality: number;
  focus_x: number;
  focus_y: number;
  caption: string;
  usable: boolean;
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(Number(n) || 0)));

export async function POST(request: NextRequest) {
  const member = await getTeamMember(request);
  if (!hasRole(member, ['owner', 'manager', 'staff'])) {
    return NextResponse.json({ error: 'Please sign in to the shop team area first.' }, { status: 401 });
  }
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured on Vercel (OPENAI_API_KEY).' }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const supabaseHost = (() => {
    try {
      return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || '').host;
    } catch {
      return '';
    }
  })();
  // Only our own storage links: this route must not become a free image-recognition service
  const urls: string[] = (Array.isArray(body.urls) ? body.urls : [])
    .filter((u: unknown): u is string => typeof u === 'string')
    .filter((u: string) => {
      try {
        const url = new URL(u);
        return url.protocol === 'https:' && url.host === supabaseHost && url.pathname.includes('/site-images/');
      } catch {
        return false;
      }
    })
    .slice(0, MAX_PHOTOS);
  if (urls.length === 0) {
    return NextResponse.json({ error: 'No photos to recognise.' }, { status: 400 });
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
      instructions: INSTRUCTIONS,
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: `${urls.length} photos, in order. Return exactly ${urls.length} entries in the same order.` },
            ...urls.map((url) => ({ type: 'input_image' as const, image_url: url, detail: 'low' as const })),
          ],
        },
      ],
      text: { format: { type: 'json_schema', name: 'photo_sort', schema: SCHEMA, strict: true } },
      reasoning: { effort: 'low' },
      max_output_tokens: 3000,
    });

    const parsed = JSON.parse(response.output_text?.trim() || '{}') as { photos?: Raw[] };
    const raw = parsed.photos || [];
    if (raw.length !== urls.length) {
      return NextResponse.json({ error: 'The AI returned an incomplete answer. Please try again.' }, { status: 502 });
    }

    const photos = raw.map((p) => ({
      kind: p.kind,
      gender: p.gender,
      quality: clamp(p.quality, 1, 10),
      fx: clamp(p.focus_x, 0, 100),
      fy: clamp(p.focus_y, 0, 100),
      caption: (p.caption || '').trim().slice(0, 40),
      usable: !!p.usable && p.kind !== 'other',
    }));
    return NextResponse.json({ photos });
  } catch (error) {
    console.error('Photo recognition failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Recognition failed: ${message}` }, { status: 500 });
  }
}
