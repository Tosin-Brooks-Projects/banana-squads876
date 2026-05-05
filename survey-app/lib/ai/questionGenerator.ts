import Anthropic from '@anthropic-ai/sdk';
import { Question, MultipleChoiceQuestion, RatingQuestion, TextQuestion } from '@/lib/types';

export interface SurveyPreferences {
  questionCount: '3-5' | '5-10' | '10-15' | '15+';
  questionStyle: 'mostly-options' | 'balanced' | 'mostly-open';
  anonymity: 'anonymous' | 'collect-info';
}

export interface GeneratedQuestionsResponse {
  questions: Question[];
}

// Map preference to actual question counts
const QUESTION_COUNTS: Record<string, { min: number; max: number }> = {
  '3-5': { min: 3, max: 5 },
  '5-10': { min: 5, max: 10 },
  '10-15': { min: 10, max: 15 },
  '15+': { min: 15, max: 20 },
};

// Map question style to distribution
const STYLE_DISTRIBUTION: Record<string, { multipleChoice: number; rating: number; text: number }> = {
  'mostly-options': { multipleChoice: 60, rating: 30, text: 10 },
  'balanced': { multipleChoice: 40, rating: 30, text: 30 },
  'mostly-open': { multipleChoice: 20, rating: 20, text: 60 },
};

// Themed adventures only support multiple-choice and rating questions (visual/clickable, no text input)
const THEMED_ADVENTURES = ['ice-cream-sundae', 'pizza-builder', 'garden-grower', 'dream-home', 'coffee-brewer'];

// Distribution for themed adventures (no text questions - all visual/clickable)
const THEMED_DISTRIBUTION = { multipleChoice: 65, rating: 35, text: 0 };

export async function generateQuestions(
  context: string,
  theme: string,
  preferences?: SurveyPreferences
): Promise<GeneratedQuestionsResponse> {
  // Mock fallback for design work if API key is missing
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('No ANTHROPIC_API_KEY found, using mock data for design.');
    // Simulate a slight delay for realism
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      questions: [
        {
          id: 'mock-1',
          type: 'multiple-choice',
          question: 'How would you describe your current mood?',
          options: ['Excited 🚀', 'Relaxed 🌊', 'Focused 🧠', 'Curious 🔍'],
          required: true,
          order: 0
        },
        {
          id: 'mock-2',
          type: 'rating',
          question: 'How much do you love this new design?',
          scale: 5,
          startLabel: 'Meh',
          endLabel: 'Obsessed',
          required: true,
          order: 1
        },
        {
          id: 'mock-3',
          type: 'text',
          question: 'Any suggestions for the "Quest Builder" flow?',
          placeholder: 'Share your thoughts...',
          maxLength: 500,
          required: false,
          order: 2
        }
      ]
    } as GeneratedQuestionsResponse;
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  // Determine question count based on preferences
  const countRange = preferences?.questionCount || '5-10';
  const { min, max } = QUESTION_COUNTS[countRange];
  const targetCount = Math.floor((min + max) / 2);

  // Determine question distribution based on style
  // Themed adventures don't support text questions (only visual/clickable options)
  const isThemedAdventure = THEMED_ADVENTURES.includes(theme);
  const style = preferences?.questionStyle || 'balanced';
  const distribution = isThemedAdventure ? THEMED_DISTRIBUTION : STYLE_DISTRIBUTION[style];

  // Build the prompt with appropriate question types
  const questionTypesSection = isThemedAdventure
    ? `Question Distribution (approximate):
- ${Math.round(targetCount * distribution.multipleChoice / 100)} multiple choice questions (3-5 options each)
- ${Math.round(targetCount * distribution.rating / 100)} rating questions (scale of 5)

IMPORTANT: This is a themed visual adventure. Only use "multiple-choice" and "rating" question types. DO NOT use "text" questions - the theme only supports clickable/visual options.`
    : `Question Distribution (approximate):
- ${Math.round(targetCount * distribution.multipleChoice / 100)} multiple choice questions (3-5 options each)
- ${Math.round(targetCount * distribution.rating / 100)} rating questions (scale of 5)
- ${Math.round(targetCount * distribution.text / 100)} open-ended text questions`;

  const prompt = `You are a survey expert creating questions for an engaging survey platform called "Unboring Surveys".

Survey Context/Goal:
"${context}"

Adventure Theme: ${theme}

Create exactly ${targetCount} survey questions that will provide actionable insights.

${questionTypesSection}

IMPORTANT: Make questions specific, engaging, and directly relevant to their stated goal. Avoid generic questions.

${isThemedAdventure ? `Return ONLY valid JSON in this EXACT format (no markdown, no code blocks, just JSON):
{
  "questions": [
    {
      "type": "multiple-choice",
      "question": "Your question text here?",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "required": true
    },
    {
      "type": "rating",
      "question": "Your rating question here?",
      "scale": 5,
      "startLabel": "Poor",
      "endLabel": "Excellent",
      "required": true
    }
  ]
}

Rules:
- "type" must be exactly: "multiple-choice" or "rating" (NO "text" type for themed adventures)
- Multiple choice must have "options" array with 3-5 choices
- Rating must have "scale": 5, "startLabel", and "endLabel"
- Mix required: true and required: false appropriately
- Start with an engaging question` : `Return ONLY valid JSON in this EXACT format (no markdown, no code blocks, just JSON):
{
  "questions": [
    {
      "type": "multiple-choice",
      "question": "Your question text here?",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "required": true
    },
    {
      "type": "rating",
      "question": "Your rating question here?",
      "scale": 5,
      "startLabel": "Poor",
      "endLabel": "Excellent",
      "required": true
    },
    {
      "type": "text",
      "question": "Your open-ended question here?",
      "placeholder": "Share your thoughts...",
      "maxLength": 500,
      "required": false
    }
  ]
}

Rules:
- "type" must be exactly: "multiple-choice", "rating", or "text"
- Multiple choice must have "options" array with 3-5 choices
- Rating must have "scale": 5, "startLabel", and "endLabel"
- Text must have "placeholder" and "maxLength": 500
- Mix required: true and required: false appropriately
- Start with an engaging question, end with an open feedback question`}`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20240620',
    max_tokens: 2048,
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

  // Clean up the response - remove markdown code blocks if present
  let jsonText = content.text.trim();
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.slice(7);
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.slice(3);
  }
  if (jsonText.endsWith('```')) {
    jsonText = jsonText.slice(0, -3);
  }
  jsonText = jsonText.trim();

  // Parse the JSON
  const parsed = JSON.parse(jsonText);

  // Validate the response structure
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid AI response: expected an object');
  }

  if (!Array.isArray(parsed.questions)) {
    throw new Error('Invalid AI response: expected questions array');
  }

  if (parsed.questions.length === 0) {
    throw new Error('Invalid AI response: no questions generated');
  }

  // Validate and transform questions to match our types
  const questions: Question[] = parsed.questions.map((q: Record<string, unknown>, index: number) => {
    // Validate required fields
    if (!q || typeof q !== 'object') {
      throw new Error(`Invalid question at index ${index}: expected an object`);
    }

    if (!q.question || typeof q.question !== 'string') {
      throw new Error(`Invalid question at index ${index}: missing or invalid question text`);
    }

    if (!q.type || typeof q.type !== 'string') {
      throw new Error(`Invalid question at index ${index}: missing or invalid type`);
    }
    const baseQuestion = {
      id: `ai-${index}`,
      question: q.question as string,
      required: q.required as boolean ?? true,
      order: index,
    };

    switch (q.type) {
      case 'multiple-choice':
        return {
          ...baseQuestion,
          type: 'multiple-choice',
          options: q.options as string[],
        } as MultipleChoiceQuestion;

      case 'rating':
        return {
          ...baseQuestion,
          type: 'rating',
          scale: (q.scale as 5 | 10) || 5,
          startLabel: q.startLabel as string || 'Poor',
          endLabel: q.endLabel as string || 'Excellent',
        } as RatingQuestion;

      case 'text':
        // For themed adventures, convert text questions to rating (themed UIs don't support text input)
        if (isThemedAdventure) {
          return {
            ...baseQuestion,
            type: 'rating',
            scale: 5 as const,
            startLabel: 'Not at all',
            endLabel: 'Very much',
          } as RatingQuestion;
        }
        return {
          ...baseQuestion,
          type: 'text',
          placeholder: q.placeholder as string || 'Share your thoughts...',
          maxLength: q.maxLength as number || 500,
        } as TextQuestion;

      default:
        // For themed adventures, default to rating instead of text
        if (isThemedAdventure) {
          return {
            ...baseQuestion,
            type: 'rating',
            scale: 5 as const,
            startLabel: 'Poor',
            endLabel: 'Excellent',
          } as RatingQuestion;
        }
        // Default to text for unknown types
        return {
          ...baseQuestion,
          type: 'text',
          placeholder: 'Share your thoughts...',
          maxLength: 500,
        } as TextQuestion;
    }
  });

  return { questions };
}
