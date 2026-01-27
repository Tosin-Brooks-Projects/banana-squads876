/**
 * Rate limiting utilities for API calls and submissions
 * Uses localStorage to persist rate limit data across page reloads
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // Unix timestamp
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
  storageKey: string;
}

// Default rate limit configurations
export const RATE_LIMITS = {
  // Question generation: max 10 per hour
  questionGeneration: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    storageKey: 'rl_question_gen',
  },
  // Survey submission: max 5 per minute per survey
  surveySubmission: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
    storageKey: 'rl_survey_submit',
  },
  // Username availability check: max 30 per minute
  usernameCheck: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minute
    storageKey: 'rl_username_check',
  },
  // Survey creation: max 20 per hour
  surveyCreation: {
    maxRequests: 20,
    windowMs: 60 * 60 * 1000, // 1 hour
    storageKey: 'rl_survey_create',
  },
} as const;

/**
 * Get rate limit entry from localStorage
 */
function getRateLimitEntry(key: string): RateLimitEntry | null {
  if (typeof window === 'undefined') return null;

  try {
    const data = localStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Save rate limit entry to localStorage
 */
function setRateLimitEntry(key: string, entry: RateLimitEntry): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // localStorage might be full or disabled
  }
}

/**
 * Check if an action is rate limited
 * Returns { allowed: boolean, remaining: number, resetIn: number }
 */
export function checkRateLimit(config: RateLimitConfig, identifier?: string): {
  allowed: boolean;
  remaining: number;
  resetIn: number; // milliseconds until reset
} {
  const key = identifier ? `${config.storageKey}_${identifier}` : config.storageKey;
  const now = Date.now();

  const entry = getRateLimitEntry(key);

  // No existing entry or window has expired
  if (!entry || now > entry.resetAt) {
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetAt - now,
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count - 1,
    resetIn: entry.resetAt - now,
  };
}

/**
 * Record a request for rate limiting
 * Call this after a successful request
 */
export function recordRequest(config: RateLimitConfig, identifier?: string): void {
  const key = identifier ? `${config.storageKey}_${identifier}` : config.storageKey;
  const now = Date.now();

  const entry = getRateLimitEntry(key);

  if (!entry || now > entry.resetAt) {
    // Start new window
    setRateLimitEntry(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
  } else {
    // Increment existing window
    setRateLimitEntry(key, {
      count: entry.count + 1,
      resetAt: entry.resetAt,
    });
  }
}

/**
 * Format reset time for display
 */
export function formatResetTime(resetInMs: number): string {
  const seconds = Math.ceil(resetInMs / 1000);

  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }

  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }

  const hours = Math.ceil(minutes / 60);
  return `${hours} hour${hours !== 1 ? 's' : ''}`;
}

/**
 * Check rate limit and throw error if exceeded
 * Useful for wrapping async functions
 */
export function enforceRateLimit(config: RateLimitConfig, identifier?: string): void {
  const result = checkRateLimit(config, identifier);

  if (!result.allowed) {
    throw new RateLimitError(
      `Rate limit exceeded. Please try again in ${formatResetTime(result.resetIn)}.`,
      result.resetIn
    );
  }
}

/**
 * Custom error class for rate limiting
 */
export class RateLimitError extends Error {
  public resetIn: number;

  constructor(message: string, resetIn: number) {
    super(message);
    this.name = 'RateLimitError';
    this.resetIn = resetIn;
  }
}

/**
 * Higher-order function to wrap async functions with rate limiting
 */
export function withRateLimit<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  config: RateLimitConfig,
  getIdentifier?: (...args: Parameters<T>) => string
): T {
  return (async (...args: Parameters<T>) => {
    const identifier = getIdentifier?.(...args);
    enforceRateLimit(config, identifier);

    const result = await fn(...args);
    recordRequest(config, identifier);

    return result;
  }) as T;
}

/**
 * Spam detection for survey submissions
 * Checks for suspicious patterns
 */
export function detectSpamSubmission(data: {
  answers: unknown[];
  completionTimeMs: number;
  surveyQuestionCount: number;
}): { isSpam: boolean; reason?: string } {
  // Check for impossibly fast completion (less than 1 second per question)
  const minTimePerQuestion = 1000; // 1 second
  const minExpectedTime = data.surveyQuestionCount * minTimePerQuestion;

  if (data.completionTimeMs < minExpectedTime) {
    return {
      isSpam: true,
      reason: 'Completion time too fast - possible automated submission',
    };
  }

  // Check for all identical answers (suspicious for multiple choice)
  const answerValues = data.answers.map(a => {
    const answer = a as { value?: unknown };
    return JSON.stringify(answer.value);
  });
  const uniqueAnswers = new Set(answerValues);

  if (data.answers.length > 2 && uniqueAnswers.size === 1) {
    return {
      isSpam: true,
      reason: 'All answers identical - possible spam',
    };
  }

  return { isSpam: false };
}

/**
 * Clear all rate limit data (useful for testing/debugging)
 */
export function clearRateLimits(): void {
  if (typeof window === 'undefined') return;

  Object.values(RATE_LIMITS).forEach(config => {
    // Clear base key
    localStorage.removeItem(config.storageKey);

    // Clear any keys with identifiers (scan localStorage)
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(config.storageKey + '_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  });
}
