import { NextRequest, NextResponse } from 'next/server';
import { vertexAICommerceService } from '@/lib/vertex-ai-commerce';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Require only visitorId and eventTime for general events
    const { visitorId, eventTime } = body;
    if (!visitorId || !eventTime) {
      return NextResponse.json({ error: 'Missing required user event fields (visitorId, eventTime).' }, { status: 400 });
    }

    // Forward the entire body as the user event to Vertex AI
    await vertexAICommerceService.writeUserEvent(body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('User event API error:', error);
    return NextResponse.json({ error: 'Failed to record user event.' }, { status: 500 });
  }
}
