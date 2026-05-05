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
    const { context, theme, preferences } = body;

    if (!context || !theme) {
      return NextResponse.json(
        { error: 'Missing required fields: context and theme' },
        { status: 400 }
      );
    }

    // API Key is checked inside generateQuestions to allow for mock data fallback during design

    let result;
    try {
      result = await generateQuestions(context, theme, preferences);
    } catch (genError) {
      console.error('Question generation error:', genError);

      // Handle JSON parsing errors with a specific message
      if (genError instanceof SyntaxError) {
        return NextResponse.json(
          { error: 'Failed to parse AI response as JSON' },
          { status: 500 }
        );
      }

      // Handle other generation errors with their message
      return NextResponse.json(
        { error: `Failed to generate questions: ${genError instanceof Error ? genError.message : 'Unknown error'}` },
        { status: 500 }
      );
    }

    return NextResponse.json(result);

  } catch (error) {
    // Handle unexpected errors (request parsing, rate limiting, etc.)
    console.error('Error in generate-questions API:', error);

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
