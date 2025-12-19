import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const SYSTEM_PROMPT = `Du bist ein Experte für Vintage-Mode und arbeitest für einen hochwertigen Vintage-Store in Wien. 
Deine Aufgabe ist es, kurze, ansprechende Produktbeschreibungen zu erstellen.

Regeln:
- Schreibe genau 3 Sätze auf Deutsch
- Der Ton soll professionell aber einladend sein
- Identifiziere die Ära des Produkts (z.B. 60er, 70er, 80er, 90er, Y2K, 2000er) anhand des Stils, der Marke und der visuellen Merkmale
- Erwähne die Ära im ersten Satz der Beschreibung
- Erwähne den Zustand, die Qualität und das Besondere am Stück
- Verwende keine Emojis
- Sei präzise und vermeide Füllwörter
- Die Beschreibung soll zum Kauf anregen`;

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

    // Build message content with all images
    const hasImages = imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0;
    
    const userContent: (OpenAI.Chat.Completions.ChatCompletionContentPart)[] = [
      {
        type: 'text' as const,
        text: `Erstelle eine Produktbeschreibung für: "${productName}"${hasImages ? ` (${imageUrls.length} Foto${imageUrls.length > 1 ? 's' : ''} zur Referenz)` : ''}`,
      },
    ];

    // Add all images to the content
    if (hasImages) {
      imageUrls.forEach((url: string) => {
        if (url && url.length > 0) {
          userContent.push({
            type: 'image_url' as const,
            image_url: {
              url: url,
              detail: 'low' as const,
            },
          });
        }
      });
    }

    // Build messages array
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: hasImages ? userContent : `Erstelle eine Produktbeschreibung für: "${productName}"`,
      },
    ];

    // Using gpt-5-chat-latest - the latest GPT-5 model used in ChatGPT
    const completion = await openai.chat.completions.create({
      model: 'gpt-5-chat-latest',
      messages,
      max_tokens: 200,
      temperature: 0.7,
    });

    const description = completion.choices[0]?.message?.content?.trim() || '';

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

