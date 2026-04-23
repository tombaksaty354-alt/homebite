/**
 * Simple in-memory rate limiter for API routes
 * Uses sliding window algorithm
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

/**
 * Check rate limit for a given identifier (e.g. IP address or user ID)
 * 
 * @param identifier - Unique key (IP, user ID, etc.)
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns Object with success status and remaining requests
 */
export function rateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60_000 // 1 minute
): { success: boolean; remaining: number; retryAfterMs?: number } {
  cleanup();

  const now = Date.now();
  const key = identifier;
  const entry = rateLimitMap.get(key);

  // No existing entry or window has expired
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { success: true, remaining: maxRequests - 1 };
  }

  // Within window and under limit
  if (entry.count < maxRequests) {
    entry.count++;
    return { success: true, remaining: maxRequests - entry.count };
  }

  // Rate limited
  return {
    success: false,
    remaining: 0,
    retryAfterMs: entry.resetTime - now,
  };
}

/**
 * Get client IP from request headers (works behind proxies/Vercel)
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  return 'unknown';
}

/**
 * Preset rate limit configurations
 */
export const RATE_LIMITS = {
  // Login: 5 attempts per minute
  login: { maxRequests: 5, windowMs: 60_000 },
  // Register: 3 attempts per 5 minutes
  register: { maxRequests: 3, windowMs: 5 * 60_000 },
  // Order creation: 10 per minute
  orders: { maxRequests: 10, windowMs: 60_000 },
  // Chat messages: 30 per minute
  chat: { maxRequests: 30, windowMs: 60_000 },
  // File upload: 5 per minute
  upload: { maxRequests: 5, windowMs: 60_000 },
  // General API: 60 per minute
  api: { maxRequests: 60, windowMs: 60_000 },
} as const;
