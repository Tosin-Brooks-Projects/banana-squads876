import Anthropic from '@anthropic-ai/sdk';

export interface GeneratedQuestion {
  text: string;
  type: 'multiple_choice' | 'rating' | 'open_ended';
  options?: string[];
  required: boolean;
}

export interface GeneratedQuestionsResponse {
  questions: GeneratedQuestion[];
}

export async function generateQuestions(context: string, theme: string): Promise<GeneratedQuestionsResponse> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  const prompt = `You are a survey expert. Based on this context:

"${context}"

Theme/Goal: ${theme}

Generate 5-7 questions that will provide actionable insights.
Include a mix of:
- 4 multiple choice questions (3-4 options each)
- 2 rating scale questions (1-5)
- 1 optional open-ended question

Make questions specific and relevant to their goal.
Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "text": "question text here",
      "type": "multiple_choice",
      "options": ["option1", "option2", "option3"],
      "required": true
    },
    {
      "text": "rating question here",
      "type": "rating",
      "required": true
    },
    {
      "text": "open ended question here",
      "type": "open_ended",
      "required": false
    }
  ]
}`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });

  // Extract text content from the response
  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude API');
  }

  // Parse and return JSON
  const parsed = JSON.parse(content.text) as GeneratedQuestionsResponse;
  return parsed;
}
