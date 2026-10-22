import { NextRequest, NextResponse } from 'next/server';
import { getTeamMember, hasRole } from '@/lib/server-auth';
import { generateListing, ListingError } from '@/lib/ai-listing';

// Photo recognition plus web search can take a minute or more; give it room
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    // Only signed-in team members may use the paid AI service
    const member = await getTeamMember(request);
    if (!hasRole(member, ['owner', 'manager', 'staff'])) {
      return NextResponse.json({ error: 'Please sign in to the shop team area first.' }, { status: 401 });
    }

    const body = await request.json();
    const { productName, imageUrls } = body;

    const images: string[] = Array.isArray(imageUrls) ? imageUrls : [];

    return NextResponse.json(await generateListing(productName || '', images));
  } catch (error: unknown) {
    if (error instanceof ListingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('OpenAI API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: `Failed to generate description: ${errorMessage}` },
      { status: 500 }
    );
  }
}
