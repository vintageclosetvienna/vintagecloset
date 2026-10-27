import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getTeamMember, hasRole } from '@/lib/server-auth';
import { createServerClient } from '@/lib/supabase';
import { calculateReadTime, generateSlug } from '@/lib/journal-data';
import { DAY_LABEL, isOpenSlot, parseLineup, weekendLabel } from '@/lib/popup';

// Writes a short, warm vintage-style recap of today's pop up as a Journal DRAFT.
// Nothing goes public until the team opens it in Admin → Journal and publishes it.
export const maxDuration = 120;

const DEFAULT_MODEL = 'gpt-5.6-sol';

const SYSTEM_PROMPT = `You write the Journal of Vintage Closet Vienna, a vintage clothing shop running a pop up at Bandgasse 43 (1070 Wien) with DJs every weekend.
Write a short recap article (140-220 words) in English about today's pop up day.
Voice: warm, playful, a bit nostalgic, like a 90s zine; short sentences; no hashtags, no emojis, no clichés like "vibrant" or "unforgettable".
Only use the facts given (names, times, notes). Never invent DJs, numbers, guests or quotes. If there are no DJ names, talk about the secret line up and open decks.
End with one line inviting people to the next weekend.`;

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'excerpt', 'content'],
  properties: {
    title: { type: 'string', description: 'Catchy title, max 70 characters' },
    excerpt: { type: 'string', description: 'One sentence teaser, max 160 characters' },
    content: { type: 'string', description: 'The article, paragraphs separated by a blank line' },
  },
} as const;

type EventRow = {
  id: string;
  slug: string;
  title: string;
  date: string;
  end_date: string | null;
  time: string | null;
  image: string | null;
  lineup: unknown;
  gallery: string[] | null;
  today_note: string | null;
};

export async function POST(request: NextRequest) {
  const member = await getTeamMember(request);
  if (!hasRole(member, ['owner', 'manager', 'staff'])) {
    return NextResponse.json({ error: 'Please sign in to the shop team area first.' }, { status: 401 });
  }
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'The AI writer is not set up (OPENAI_API_KEY).' }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as { eventId?: unknown; day?: unknown } | null;
  const eventId = typeof body?.eventId === 'string' ? body.eventId : '';
  const day = body?.day === 'Sun' ? 'Sun' : 'Sat';

  const db = createServerClient();
  const { data } = await db
    .from('events')
    .select('id, slug, title, date, end_date, time, image, lineup, gallery, today_note')
    .eq('id', eventId)
    .maybeSingle();
  const event = data as unknown as EventRow | null;
  if (!event) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });

  const lineup = parseLineup(event.lineup).filter((slot) => slot.day === day);
  const facts = [
    `Event: ${event.title}, ${weekendLabel(event.date, event.end_date)}, ${event.time ?? ''}`,
    `Day: ${DAY_LABEL[day]}`,
    `Line up today: ${
      lineup
        .map((slot) => (isOpenSlot(slot) ? `${slot.time} open slot / open decks` : `${slot.time} ${slot.name}${slot.genre ? ` (${slot.genre})` : ''}`))
        .join('; ') || 'secret line up, open decks'
    }`,
    `Team notes: ${event.today_note?.trim() || 'none'}`,
    `Photos taken: ${event.gallery?.length ?? 0}`,
  ].join('\n');

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
    instructions: SYSTEM_PROMPT,
    input: [{ role: 'user', content: facts }],
    text: { format: { type: 'json_schema', name: 'journal_recap', schema: SCHEMA, strict: true } },
    reasoning: { effort: 'low' },
    max_output_tokens: 2000,
  });
  const raw = response.output_text?.trim();
  if (!raw) return NextResponse.json({ error: 'The AI returned nothing, please try again.' }, { status: 502 });
  const article = JSON.parse(raw) as { title: string; excerpt: string; content: string };

  const dayDate = day === 'Sun' ? event.end_date || event.date : event.date;
  const slug = `${generateSlug(article.title).slice(0, 60)}-${dayDate}`;
  const gallery = event.gallery ?? [];
  const cover = gallery[0] || event.image || null;

  const { error } = await db.from('journal_articles').insert({
    slug,
    title: article.title.slice(0, 120),
    excerpt: article.excerpt.slice(0, 200),
    content: article.content,
    category: 'News',
    cover_image: cover,
    images: gallery.slice(0, 12),
    author: 'Vintage Closet Team',
    published_at: dayDate,
    read_time: calculateReadTime(article.content),
    featured: false,
    tags: ['pop up', 'events', 'djs'],
    is_draft: true,
  } as never);
  if (error) return NextResponse.json({ error: `Could not save the draft: ${error.message}` }, { status: 500 });

  return NextResponse.json({ ok: true, slug, title: article.title });
}
