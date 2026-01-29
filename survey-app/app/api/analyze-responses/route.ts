import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken, getFullSurveyAdmin, getSurveyResponsesAdmin } from '@/lib/firebase/admin';
import { analyzeResponses, AIAnalysisResult } from '@/lib/ai/responseAnalyzer';
import { checkServerRateLimit, rateLimitResponse, RATE_LIMIT_CONFIGS } from '@/lib/utils/serverRateLimit';
import { PricingTier } from '@/lib/types';

// Tiers that have access to AI analysis
const AI_ENABLED_TIERS: PricingTier[] = ['pro', 'business', 'enterprise'];

export async function POST(request: NextRequest) {
  try {
    // Check rate limit (reuse a reasonable config)
    const rateLimitResult = checkServerRateLimit(request, {
      ...RATE_LIMIT_CONFIGS.stripeCheckout,
      maxRequests: 10, // 10 analysis requests per hour
    });
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult.resetAt);
    }

    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const user = await verifyAuthToken(authHeader);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { surveyId } = body as { surveyId: string };

    if (!surveyId || typeof surveyId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid surveyId' },
        { status: 400 }
      );
    }

    // Get the survey using Admin SDK (server-side)
    const survey = await getFullSurveyAdmin(surveyId);
    if (!survey) {
      return NextResponse.json(
        { error: 'Survey not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (survey.userId !== user.uid) {
      return NextResponse.json(
        { error: 'You do not have permission to analyze this survey' },
        { status: 403 }
      );
    }

    // Check if user's tier has AI analysis access
    const userTier = survey.pricingTier as PricingTier | undefined;
    if (!userTier || !AI_ENABLED_TIERS.includes(userTier)) {
      return NextResponse.json(
        {
          error: 'AI analysis is available for Pro, Business, and Enterprise tiers',
          requiredTiers: AI_ENABLED_TIERS,
          currentTier: userTier || 'free',
        },
        { status: 403 }
      );
    }

    // Check payment status
    if (survey.paymentStatus !== 'paid' && survey.paymentStatus !== 'free') {
      return NextResponse.json(
        { error: 'Please complete payment to access AI analysis' },
        { status: 403 }
      );
    }

    // Get responses using Admin SDK (server-side)
    let responses;
    try {
      responses = await getSurveyResponsesAdmin(surveyId);
    } catch (fetchError) {
      console.error('Error fetching responses:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch survey responses' },
        { status: 500 }
      );
    }

    // Run AI analysis
    let analysis: AIAnalysisResult;
    try {
      // Adapt survey format for analyzeResponses
      const surveyForAnalysis = {
        ...survey,
        questions: survey.questions.map(q => ({
          ...q,
          required: false,
          order: 0,
        })),
      };
      analysis = await analyzeResponses(surveyForAnalysis as Parameters<typeof analyzeResponses>[0], responses);
    } catch (aiError) {
      console.error('AI analysis failed:', aiError);
      const aiErrorMessage = aiError instanceof Error ? aiError.message : 'Unknown AI error';

      if (aiErrorMessage.includes('ANTHROPIC_API_KEY')) {
        return NextResponse.json(
          { error: 'AI service is not properly configured. Please contact support.' },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: `AI analysis failed: ${aiErrorMessage}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      analysis,
      responseCount: responses.length,
    });
  } catch (error) {
    console.error('AI analysis error:', error);

    // Provide more specific error messages
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('ANTHROPIC_API_KEY')) {
      return NextResponse.json(
        { error: 'AI service is not properly configured. Please contact support.' },
        { status: 503 }
      );
    }

    if (errorMessage.includes('rate') || errorMessage.includes('limit')) {
      return NextResponse.json(
        { error: 'AI service is busy. Please try again in a few minutes.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to analyze responses. Please try again.' },
      { status: 500 }
    );
  }
}
