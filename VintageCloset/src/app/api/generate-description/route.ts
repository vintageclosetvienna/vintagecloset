import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `Du bist ein Experte für Vintage-Mode und arbeitest für einen hochwertigen Vintage-Store in Wien. 
Deine Aufgabe ist es, kurze, ansprechende Produktbeschreibungen zu erstellen.

Regeln:
- Schreibe genau 3 Sätze auf Deutsch
- Der Ton soll professionell aber einladend sein
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

    const body = await request.json();
    const { productName, imageUrl } = body;

    if (!productName) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      );
    }

    // Build messages array
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: imageUrl
          ? [
              {
                type: 'text' as const,
                text: `Erstelle eine Produktbeschreibung für: "${productName}"`,
              },
              {
                type: 'image_url' as const,
                image_url: {
                  url: imageUrl,
                  detail: 'low' as const,
                },
              },
            ]
          : `Erstelle eine Produktbeschreibung für: "${productName}"`,
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

