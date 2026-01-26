import { SurveyResponse, QuestionStats, Question } from '@/lib/types';

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function generateUniqueId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function calculateQuestionStats(
  responses: SurveyResponse[],
  questions: Question[]
): QuestionStats[] {
  return questions.map((question) => {
    const responseCounts: Record<string, number> = {};

    question.options.forEach((option) => {
      responseCounts[option] = 0;
    });

    responses.forEach((response) => {
      const answer = response.answers[question.id];
      if (answer && responseCounts[answer] !== undefined) {
        responseCounts[answer]++;
      }
    });

    return {
      questionId: question.id,
      question: question.question,
      responses: responseCounts,
    };
  });
}

export function calculateAverageCompletionTime(responses: SurveyResponse[]): number {
  if (responses.length === 0) return 0;

  const totalTime = responses.reduce(
    (sum, response) => sum + response.metadata.completionTime,
    0
  );

  return Math.round(totalTime / responses.length);
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export function exportToCSV(
  responses: SurveyResponse[],
  questions: Question[]
): string {
  const headers = ['Response ID', 'Completed At', ...questions.map((q) => q.question)];
  const rows = responses.map((response) => [
    response.id,
    formatDateTime(response.completedAt),
    ...questions.map((q) => response.answers[q.id] || ''),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

export function getAdventureEmoji(adventureType: string): string {
  const emojis: Record<string, string> = {
    'classic': '📋',
    'ice-cream-sundae': '🍨',
    'pizza-builder': '🍕',
    'garden-grower': '🌻',
    'dream-home': '🏠',
    'coffee-brewer': '☕',
  };
  return emojis[adventureType] || '📋';
}

export function getAdventureLabel(adventureType: string): string {
  const labels: Record<string, string> = {
    'classic': 'Classic',
    'ice-cream-sundae': 'Ice Cream Sundae',
    'pizza-builder': 'Pizza Builder',
    'garden-grower': 'Garden Grower',
    'dream-home': 'Dream Home',
    'coffee-brewer': 'Coffee Brewer',
  };
  return labels[adventureType] || 'Survey';
}

export interface AggregatedData {
  name: string;
  value: number;
}

export type QuestionType = 'multiple_choice' | 'rating' | 'text';

export interface QuestionAggregation {
  questionId: string;
  questionText: string;
  type: QuestionType;
  data: AggregatedData[];
  totalResponses: number;
  average?: number;
  maxRating?: number;
  textResponses?: string[];
}

export function aggregateResponses(
  question: Question,
  responses: SurveyResponse[]
): QuestionAggregation {
  const counts: Record<string, number> = {};
  let total = 0;
  let sum = 0;
  let isRating = false;
  let maxRating = 0;
  const textResponses: string[] = [];

  // Check if this is a text question (no predefined options or empty options)
  const isTextQuestion = !question.options || question.options.length === 0;

  // Check if all options are numeric (rating question)
  const allOptionsNumeric = !isTextQuestion && question.options.every((opt) => !isNaN(Number(opt)));

  if (allOptionsNumeric && !isTextQuestion) {
    isRating = true;
    maxRating = Math.max(...question.options.map(Number));
  }

  // Initialize counts for all options (if not text question)
  if (!isTextQuestion) {
    question.options.forEach((option) => {
      counts[option] = 0;
    });
  }

  // Count responses for each option
  responses.forEach((response) => {
    let answerValue: string | number | string[] | undefined;

    if (Array.isArray(response.answers)) {
      const answer = response.answers.find((a) => a.questionId === question.id);
      answerValue = answer?.value;
    } else {
      answerValue = (response.answers as Record<string, string>)[question.id];
    }

    if (answerValue !== undefined && answerValue !== null && answerValue !== '') {
      const valueStr = String(answerValue);

      if (isTextQuestion) {
        // For text questions, collect the responses
        textResponses.push(valueStr);
        total++;
      } else {
        // For choice/rating questions
        const numericValue = Number(valueStr);
        if (isRating && !isNaN(numericValue)) {
          sum += numericValue;
        }

        if (counts[valueStr] !== undefined) {
          counts[valueStr]++;
        } else {
          counts[valueStr] = 1;
        }
        total++;
      }
    }
  });

  // Convert to array format for charts
  const data: AggregatedData[] = Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => {
      // Sort numerically if options are numbers (for rating questions)
      const aNum = Number(a.name);
      const bNum = Number(b.name);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }
      // Otherwise sort by count descending
      return b.value - a.value;
    });

  // Determine question type
  let type: QuestionType = 'multiple_choice';
  if (isTextQuestion) {
    type = 'text';
  } else if (isRating) {
    type = 'rating';
  }

  return {
    questionId: question.id,
    questionText: question.question,
    type,
    data,
    totalResponses: total,
    average: isRating && total > 0 ? sum / total : undefined,
    maxRating: isRating ? maxRating : undefined,
    textResponses: isTextQuestion ? textResponses : undefined,
  };
}

export function aggregateAllQuestions(
  questions: Question[],
  responses: SurveyResponse[]
): QuestionAggregation[] {
  return questions.map((question) => aggregateResponses(question, responses));
}

export interface ResponseOverTime {
  name: string;
  value: number;
  date: Date;
}

export function getResponsesOverTime(
  responses: SurveyResponse[],
  groupBy: 'day' | 'week' | 'month' = 'day'
): ResponseOverTime[] {
  if (responses.length === 0) return [];

  const grouped: Record<string, { count: number; date: Date }> = {};

  responses.forEach((response) => {
    const date = response.completedAt;
    let key: string;

    switch (groupBy) {
      case 'week': {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        key = startOfWeek.toISOString().split('T')[0];
        break;
      }
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'day':
      default:
        key = date.toISOString().split('T')[0];
    }

    if (!grouped[key]) {
      grouped[key] = { count: 0, date: new Date(key) };
    }
    grouped[key].count++;
  });

  return Object.entries(grouped)
    .map(([key, { count, date }]) => ({
      name: formatDateShort(key, groupBy),
      value: count,
      date,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

function formatDateShort(dateStr: string, groupBy: 'day' | 'week' | 'month'): string {
  const date = new Date(dateStr);

  switch (groupBy) {
    case 'month':
      return new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit' }).format(date);
    case 'week':
      return `Week of ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date)}`;
    case 'day':
    default:
      return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  }
}
