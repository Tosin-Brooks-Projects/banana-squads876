import { NextRequest, NextResponse } from 'next/server';
import { generateQuestions } from '@/lib/ai/questionGenerator';
import { checkServerRateLimit, rateLimitResponse, RATE_LIMIT_CONFIGS } from '@/lib/utils/serverRateLimit';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for AI generation (5 requests per minute per IP)
    const rateLimitResult = checkServerRateLimit(request, RATE_LIMIT_CONFIGS.aiGeneration);
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult.resetAt);
    }

    const body = await request.json();
    const { context, theme } = body;

    if (!context || !theme) {
      return NextResponse.json(
        { error: 'Missing required fields: context and theme' },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const result = await generateQuestions(context, theme);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error generating questions:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Failed to parse AI response as JSON' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    );
  }
}
