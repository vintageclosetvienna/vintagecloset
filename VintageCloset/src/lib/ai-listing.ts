import OpenAI from 'openai';
import {
  AiProductDetails,
  CATEGORIES_BY_GENDER,
  PRODUCT_GENDERS,
  ProductGender,
} from '@/lib/product-categories';

// Shared by the admin autofill (/api/generate-description) and the app import (/api/import/piece):
// photos of one piece in, a ready shop listing out (everything except the price).

// gpt-5-chat-latest was shut down by OpenAI on 2026-07-23; gpt-5.6-sol is the listed replacement
const DEFAULT_MODEL = 'gpt-5.6-sol';

const ALL_CATEGORIES = Array.from(new Set(Object.values(CATEGORIES_BY_GENDER).flat())).sort();

const SYSTEM_PROMPT = `You are the product lister for Vintage Closet, a curated vintage store in Vienna.
You turn photos of one clothing piece into a ready-to-publish shop listing.

1. Look closely at every photo: brand, label and tag text, logo, colour, material,
   size on the tag, cut, print, stitching, special details and visible flaws.
2. Use web search to confirm the brand, line or model and the era
   (label design, "Made in" text and typeface help date a piece). Use reliable sources only.
3. Fill in the listing fields:
   - title: short shop title, max 60 characters: "Vintage" + era + brand + item + main colour,
     e.g. "Vintage 90s Nike Sweatshirt Navy". Leave out what you cannot recognise.
   - description: English, 2 to 4 short sentences, one paragraph, no line breaks.
     Attractive, creative marketing voice, simple words. Open with a hook from the
     piece's story or era, then the key facts (brand, colour, material, standout detail),
     end with condition including visible flaws. No emojis, no hashtags, no size.
   - size: exactly as printed on the tag (e.g. "M", "W32 L34", "EU 40"); empty if no tag is readable.
   - era: decade or style era such as "70s", "80s", "90s", "Y2K"; empty if unsure.
   - gender: "women", "men" or "unisex"; use "unisex" when the cut fits both.
   - category: the best match for that gender from these lists:
     women: ${CATEGORIES_BY_GENDER.women.join(', ')}
     men: ${CATEGORIES_BY_GENDER.men.join(', ')}
     unisex: ${CATEGORIES_BY_GENDER.unisex.join(', ')}

Only state what the photos show or the research confirms. If brand, era or material is
uncertain, say "likely" or leave it out. Never invent rarity, value or authenticity guarantees.`;

const LISTING_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    size: { type: 'string' },
    era: { type: 'string' },
    gender: { type: 'string', enum: PRODUCT_GENDERS },
    category: { type: 'string', enum: ALL_CATEGORIES },
  },
  required: ['title', 'description', 'size', 'era', 'gender', 'category'],
};

export class ListingError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/** Recognise the piece from its photos (and an optional name or notes) and fill in every listing field except the price. */
export async function generateListing(productName: string, imageUrls: string[], notes = ''): Promise<AiProductDetails> {
  if (!process.env.OPENAI_API_KEY) {
    throw new ListingError('OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file.', 500);
  }

  const images = imageUrls.filter((url) => url && url.length > 0);
  if (!productName && images.length === 0) {
    throw new ListingError('Upload at least one photo or enter a product name first.', 400);
  }

  // Create OpenAI client only when a listing is made
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const content: OpenAI.Responses.ResponseInputContent[] = [
    {
      type: 'input_text',
      text: [
        productName ? `Name typed by the shop: "${productName}".` : 'No name typed yet.',
        images.length > 0
          ? `${images.length} photo${images.length > 1 ? 's' : ''} attached. Recognise the piece and fill in the listing.`
          : 'No photos. Work only from the name and confirmed research.',
        notes,
      ].filter(Boolean).join(' '),
    },
    ...images.map((url) => ({
      type: 'input_image' as const,
      image_url: url,
      detail: 'high' as const, // labels and tags need high detail
    })),
  ];

  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
    instructions: SYSTEM_PROMPT,
    input: [{ role: 'user', content }],
    tools: [{ type: 'web_search' }],
    text: {
      format: { type: 'json_schema', name: 'product_listing', schema: LISTING_SCHEMA, strict: true },
    },
    reasoning: { effort: 'low' },
    max_output_tokens: 4000,
  });

  const raw = response.output_text?.trim();
  if (!raw) {
    throw new ListingError('The AI returned no result. Please try again.', 502);
  }

  const listing = JSON.parse(raw) as AiProductDetails;

  // The schema allows any known category; keep it only if it exists for the chosen gender
  const gender = PRODUCT_GENDERS.includes(listing.gender as ProductGender) ? listing.gender : '';
  const category = gender && CATEGORIES_BY_GENDER[gender].includes(listing.category) ? listing.category : '';

  return {
    title: listing.title.trim(),
    description: listing.description.trim(),
    size: listing.size.trim(),
    era: listing.era.trim(),
    gender,
    category,
  };
}
