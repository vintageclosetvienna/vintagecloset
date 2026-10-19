import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// gpt-5-chat-latest was shut down by OpenAI on 2026-07-23; gpt-5.6-sol is the listed replacement
const DEFAULT_MODEL = 'gpt-5.6-sol';

const SYSTEM_PROMPT = `Du bist Vintage-Experte und Texter für einen kuratierten Vintage-Store in Wien.

Arbeitsweise:
1. Lies die Fotos genau: Marke, Etikett/Label, Logo, Farbe, Material, Größe auf dem Etikett,
   Schnitt, Nähte, Druck, Besonderheiten und sichtbare Mängel.
2. Recherchiere mit der Websuche die Marke, die Linie oder das Modell und die Ära
   (z. B. an Etikett-Design, "Made in"-Angabe, Schriftart). Nutze nur verlässliche Quellen.
3. Schreibe dann die Produktbeschreibung.

Stil der Beschreibung:
- Deutsch, 4 bis 6 Sätze, erzählerisch, warm und selbstbewusst, ohne Emojis und ohne Floskeln.
- Beginne mit der Geschichte: woher das Stück kommt, für welche Zeit und Szene es steht.
- Dann das Stück selbst: Marke, Farbe, Material, Details, Größe.
- Ende mit Zustand (inklusive sichtbarer Mängel) und einem kurzen Styling-Gedanken.

Ehrlichkeit:
- Behaupte nur, was auf den Fotos sichtbar oder durch die Recherche belegt ist.
- Ist Marke, Ära oder Größe nicht sicher erkennbar, schreibe "vermutlich" oder lass es weg.
- Erfinde keine Seltenheit, keinen Wert und keine Echtheitsgarantie.

Gib nur den fertigen Beschreibungstext aus, ohne Überschrift, Quellen oder Links.`;

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file.' },
        { status: 500 }
      );
    }

    // Create OpenAI client only when the route is called
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const body = await request.json();
    const { productName, imageUrls } = body;

    if (!productName) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      );
    }

    const images: string[] = Array.isArray(imageUrls)
      ? imageUrls.filter((url: string) => url && url.length > 0)
      : [];

    const content: OpenAI.Responses.ResponseInputContent[] = [
      {
        type: 'input_text',
        text: `Produktname (vom Shop eingegeben): "${productName}". ${
          images.length > 0
            ? `${images.length} Foto${images.length > 1 ? 's' : ''} anbei. Erkenne das Stück auf den Fotos, recherchiere seine Geschichte und schreibe die Beschreibung.`
            : 'Keine Fotos vorhanden. Schreibe nur auf Basis des Namens und belegter Recherche.'
        }`,
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
      reasoning: { effort: 'low' },
      max_output_tokens: 4000,
    });

    const description = response.output_text?.trim() || '';

    if (!description) {
      return NextResponse.json(
        { error: 'The AI returned no text. Please try again.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ description });
  } catch (error: unknown) {
    console.error('OpenAI API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: `Failed to generate description: ${errorMessage}` },
      { status: 500 }
    );
  }
}
