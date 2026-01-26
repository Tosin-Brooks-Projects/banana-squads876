export interface PreviousUsername {
  username: string;
  changedAt: Date;
  expiresAt: Date; // 30 days after change - redirects expire after this
}

// Pricing Types (defined early for use in other interfaces)
export type PricingTier = 'free' | 'starter' | 'pro' | 'business' | 'enterprise';

export interface User {
  id: string;
  email: string;
  username?: string; // Optional - null/undefined for users who haven't completed onboarding
  displayName?: string;
  photoURL?: string;
  previousUsernames?: PreviousUsername[]; // Track old usernames for redirects
  createdAt: Date;
  updatedAt: Date;
  // Pricing tracking
  hasUsedFreeTier?: boolean;
  freeTierSurveyId?: string;
  stripeCustomerId?: string;
}

export interface Survey {
  id: string;
  userId: string;
  title: string;
  slug: string;
  description?: string;
  adventureType: AdventureType;
  questions: Question[];
  settings: SurveySettings;
  status: 'draft' | 'published' | 'closed';
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  // Pricing fields
  pricingTier?: PricingTier;
  responseLimit?: number;
  paymentStatus?: 'unpaid' | 'paid' | 'free';
  paymentId?: string;
  dataExpiresAt?: Date;
}

export type AdventureType =
  | 'classic'
  | 'ice-cream-sundae'
  | 'pizza-builder'
  | 'garden-grower'
  | 'dream-home'
  | 'coffee-brewer';

// Adventure themes available for free tier
export const FREE_TIER_THEMES: AdventureType[] = ['classic', 'ice-cream-sundae'];

export type QuestionType = 'multiple-choice' | 'rating' | 'text';

export interface BaseQuestion {
  id: string;
  question: string;
  required: boolean;
  order: number;
  type: QuestionType;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple-choice';
  options: string[];
  allowMultiple?: boolean; // If true, users can select multiple options
}

export interface RatingQuestion extends BaseQuestion {
  type: 'rating';
  scale: 5 | 10;
  startLabel?: string;
  endLabel?: string;
}

export interface TextQuestion extends BaseQuestion {
  type: 'text';
  placeholder?: string;
  maxLength?: number;
}

export type Question = MultipleChoiceQuestion | RatingQuestion | TextQuestion;

// Helper to check question type
export function isMultipleChoiceQuestion(q: Question): q is MultipleChoiceQuestion {
  return q.type === 'multiple-choice';
}

export function isRatingQuestion(q: Question): q is RatingQuestion {
  return q.type === 'rating';
}

export function isTextQuestion(q: Question): q is TextQuestion {
  return q.type === 'text';
}

export interface SurveySettings {
  allowAnonymous: boolean;
  showProgressBar: boolean;
  randomizeQuestions: boolean;
  maxResponses?: number;
  expiresAt?: Date;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  respondentId?: string;
  respondentName?: string;
  respondentEmail?: string;
  answers: Answer[] | Record<string, string>;
  completedAt: Date;
  metadata: ResponseMetadata;
}

export interface ResponseMetadata {
  userAgent?: string;
  ipAddress?: string;
  completionTime: number; // in seconds
}

export interface SurveyStats {
  totalResponses: number;
  averageCompletionTime: number;
  questionStats: QuestionStats[];
}

export interface QuestionStats {
  questionId: string;
  question: string;
  responses: Record<string, number>;
}

export interface Answer {
  questionId: string;
  value: string | number | string[];
}

export interface SurveyQuickStats {
  totalResponses: number;
  completedResponses: number;
  startedResponses: number;
  completionRate: number;
  averageCompletionTime: number;
  lastResponseDate: Date | null;
}

// Partial Response Types (for milestone-based saves)
export interface PartialResponse {
  id: string;
  surveyId: string;
  sessionId: string;
  answers: Answer[];
  currentStage: number;
  totalStages: number;
  percentComplete: number;
  lastMilestone: number; // 25, 50, or 75
  respondentName?: string;
  respondentEmail?: string;
  adventureState?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

export interface ProgressUpdate {
  currentStage: number;
  totalStages: number;
  answers: Answer[];
  adventureState?: Record<string, unknown>;
  respondentName?: string;
  respondentEmail?: string;
}

export type OnProgressCallback = (progress: ProgressUpdate) => void;

// Pricing Configuration
export interface PricingTierConfig {
  id: PricingTier;
  name: string;
  price: number; // in dollars, 0 for free
  responseLimit: number;
  retentionDays: number;
  features: string[];
  stripePriceId?: string; // Will be set after creating Stripe products
}

export const PRICING_TIERS: Record<PricingTier, PricingTierConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    responseLimit: 25,
    retentionDays: 30,
    features: [
      'Unlimited surveys',
      '25 responses per survey',
      '30-day data retention',
    ],
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 9,
    responseLimit: 100,
    retentionDays: 90,
    features: [
      'AI question suggestions',
      'CSV export',
      '90-day data retention',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 25,
    responseLimit: 500,
    retentionDays: 365,
    features: [
      'AI question suggestions',
      'Sentiment analysis',
      'CSV export',
      '1-year data retention',
    ],
  },
  business: {
    id: 'business',
    name: 'Business',
    price: 59,
    responseLimit: 2000,
    retentionDays: 365,
    features: [
      'AI question suggestions',
      'Sentiment analysis',
      'CSV export',
      '1-year data retention',
      'Priority customer support',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 149,
    responseLimit: 10000,
    retentionDays: 365,
    features: [
      'AI question suggestions',
      'Sentiment analysis',
      'CSV export',
      '1-year data retention',
      'Priority customer support',
    ],
  },
};

export interface SurveyPayment {
  id: string;
  surveyId: string;
  userId: string;
  tier: PricingTier;
  amount: number; // in cents
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  stripePaymentIntentId?: string;
  stripeSessionId?: string;
  createdAt: Date;
  completedAt?: Date;
}


