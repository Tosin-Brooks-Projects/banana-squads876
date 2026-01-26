import Anthropic from '@anthropic-ai/sdk';
import { Survey, SurveyResponse, Answer } from '@/lib/types';

export interface SentimentBreakdown {
  positive: number;
  neutral: number;
  negative: number;
}

export interface Theme {
  name: string;
  count: number;
  percentage: number;
  exampleResponses: string[];
}

export interface KeyInsight {
  title: string;
  description: string;
  type: 'positive' | 'negative' | 'neutral' | 'action';
}

export interface AIAnalysisResult {
  summary: string;
  sentiment: SentimentBreakdown;
  themes: Theme[];
  keyInsights: KeyInsight[];
  recommendations: string[];
  generatedAt: string;
}

function formatResponsesForAnalysis(survey: Survey, responses: SurveyResponse[]): string {
  const questionMap = new Map(survey.questions.map(q => [q.id, q.question]));

  let formattedData = `Survey Title: ${survey.title}\n`;
  formattedData += `Total Responses: ${responses.length}\n\n`;
  formattedData += `Questions:\n`;

  survey.questions.forEach((q, i) => {
    formattedData += `${i + 1}. ${q.question} (${q.type})\n`;
  });

  formattedData += `\n--- Response Data ---\n\n`;

  // Aggregate responses by question
  const aggregatedResponses: Record<string, string[]> = {};

  responses.forEach((response) => {
    const answers = Array.isArray(response.answers)
      ? response.answers
      : Object.entries(response.answers).map(([questionId, value]) => ({ questionId, value }));

    answers.forEach((answer: Answer | { questionId: string; value: string }) => {
      const questionText = questionMap.get(answer.questionId) || answer.questionId;
      if (!aggregatedResponses[questionText]) {
        aggregatedResponses[questionText] = [];
      }
      const value = Array.isArray(answer.value) ? answer.value.join(', ') : String(answer.value);
      aggregatedResponses[questionText].push(value);
    });
  });

  // Format aggregated data
  Object.entries(aggregatedResponses).forEach(([question, answers]) => {
    formattedData += `Question: "${question}"\n`;

    // Count frequency for multiple choice / ratings
    const frequency: Record<string, number> = {};
    answers.forEach(a => {
      frequency[a] = (frequency[a] || 0) + 1;
    });

    // If it looks like a rating or multiple choice (few unique values)
    const uniqueCount = Object.keys(frequency).length;
    if (uniqueCount <= 10) {
      formattedData += `Response Distribution:\n`;
      Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .forEach(([value, count]) => {
          const pct = ((count / answers.length) * 100).toFixed(1);
          formattedData += `  - "${value}": ${count} (${pct}%)\n`;
        });
    } else {
      // Text responses - show sample
      formattedData += `Sample Responses (${answers.length} total):\n`;
      answers.slice(0, 20).forEach((a, i) => {
        formattedData += `  ${i + 1}. "${a}"\n`;
      });
      if (answers.length > 20) {
        formattedData += `  ... and ${answers.length - 20} more\n`;
      }
    }
    formattedData += `\n`;
  });

  return formattedData;
}

export async function analyzeResponses(
  survey: Survey,
  responses: SurveyResponse[]
): Promise<AIAnalysisResult> {
  if (responses.length === 0) {
    return {
      summary: 'No responses to analyze yet.',
      sentiment: { positive: 0, neutral: 0, negative: 0 },
      themes: [],
      keyInsights: [],
      recommendations: ['Share your survey to start collecting responses.'],
      generatedAt: new Date().toISOString(),
    };
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const formattedData = formatResponsesForAnalysis(survey, responses);

  const prompt = `You are an expert survey analyst. Analyze the following survey data and provide actionable insights.

${formattedData}

Provide a comprehensive analysis in the following JSON format ONLY (no other text):
{
  "summary": "A 2-3 sentence executive summary of the key findings",
  "sentiment": {
    "positive": <percentage as number 0-100>,
    "neutral": <percentage as number 0-100>,
    "negative": <percentage as number 0-100>
  },
  "themes": [
    {
      "name": "Theme name",
      "count": <number of responses mentioning this>,
      "percentage": <percentage as number>,
      "exampleResponses": ["example 1", "example 2"]
    }
  ],
  "keyInsights": [
    {
      "title": "Short insight title",
      "description": "Detailed explanation of the insight",
      "type": "positive|negative|neutral|action"
    }
  ],
  "recommendations": [
    "Actionable recommendation 1",
    "Actionable recommendation 2",
    "Actionable recommendation 3"
  ]
}

Guidelines:
- Identify 3-5 main themes from the responses
- Provide 3-5 key insights that would be valuable for decision-making
- Make recommendations specific and actionable
- For sentiment, analyze the overall tone of responses (especially text responses)
- If data is limited, acknowledge this but still provide useful analysis
- Keep the summary concise but impactful
- Return ONLY valid JSON, no markdown or additional text`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

  // Clean the response - remove any markdown code blocks if present
  let cleanedResponse = responseText.trim();
  if (cleanedResponse.startsWith('```json')) {
    cleanedResponse = cleanedResponse.slice(7);
  }
  if (cleanedResponse.startsWith('```')) {
    cleanedResponse = cleanedResponse.slice(3);
  }
  if (cleanedResponse.endsWith('```')) {
    cleanedResponse = cleanedResponse.slice(0, -3);
  }
  cleanedResponse = cleanedResponse.trim();

  try {
    const analysis = JSON.parse(cleanedResponse) as Omit<AIAnalysisResult, 'generatedAt'>;
    return {
      ...analysis,
      generatedAt: new Date().toISOString(),
    };
  } catch {
    // If parsing fails, return a basic structure with the raw response
    return {
      summary: 'Analysis completed but formatting was unexpected. Raw insights: ' + responseText.slice(0, 500),
      sentiment: { positive: 33, neutral: 34, negative: 33 },
      themes: [],
      keyInsights: [{
        title: 'Analysis Available',
        description: responseText.slice(0, 1000),
        type: 'neutral',
      }],
      recommendations: ['Review the raw analysis data for insights.'],
      generatedAt: new Date().toISOString(),
    };
  }
}
