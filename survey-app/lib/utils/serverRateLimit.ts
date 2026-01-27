import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter for serverless functions
// In production, you'd want to use Redis or a similar distributed store

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Store rate limit data (resets on cold start, which is acceptable for basic protection)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
const CLEANUP_INTERVAL = 60000; // 1 minute
let lastCleanup = Date.now();

function cleanupOldEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  Array.from(rateLimitStore.entries()).forEach(([key, entry]) => {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  });
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export const RATE_LIMIT_CONFIGS = {
  // Strict limits for expensive operations
  aiGeneration: { maxRequests: 5, windowMs: 60000 }, // 5 per minute
  stripeCheckout: { maxRequests: 10, windowMs: 60000 }, // 10 per minute
  surveySubmission: { maxRequests: 30, windowMs: 60000 }, // 30 per minute

  // More relaxed for reads
  default: { maxRequests: 100, windowMs: 60000 }, // 100 per minute
} as const;

function getClientIdentifier(request: NextRequest): string {
  // Try to get IP from various headers (works with proxies/load balancers)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  // Use the first available identifier
  const ip = cfConnectingIp || realIp || forwardedFor?.split(',')[0]?.trim() || 'unknown';

  return ip;
}

export function checkServerRateLimit(
  request: NextRequest,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.default,
  identifier?: string
): { allowed: boolean; remaining: number; resetAt: number } {
  cleanupOldEntries();

  const clientId = identifier || getClientIdentifier(request);
  const key = `${request.nextUrl.pathname}:${clientId}`;
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    // New window
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    rateLimitStore.set(key, newEntry);
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: newEntry.resetAt,
    };
  }

  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

export function rateLimitResponse(resetAt: number): NextResponse {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);

  return NextResponse.json(
    {
      error: 'Too many requests',
      message: 'Please try again later',
      retryAfter,
    },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Reset': new Date(resetAt).toISOString(),
      },
    }
  );
}

// Middleware helper for easy integration
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.default
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const { allowed, resetAt } = checkServerRateLimit(request, config);

    if (!allowed) {
      return rateLimitResponse(resetAt);
    }

    return handler(request);
  };
}
