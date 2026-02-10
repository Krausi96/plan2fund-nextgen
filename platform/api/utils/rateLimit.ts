/**
 * Rate Limiting Utilities
 * In-memory rate limiting for API routes to prevent abuse
 * Note: In production with multiple server instances, consider Redis-based rate limiting
 */

import { NextApiRequest } from 'next';

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
  windowMs: number;        // Time window in milliseconds
  maxRequests: number;     // Max requests per window
  keyPrefix?: string;      // Optional prefix for cache keys
}

/**
 * Default configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Strict limit for expensive LLM calls
  LLM: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 requests per minute
  
  // Stricter for recommendation endpoint
  RECOMMEND: { windowMs: 60 * 1000, maxRequests: 5 }, // 5 requests per minute
  
  // Moderate for blueprint generation (expensive)
  BLUEPRINT: { windowMs: 60 * 1000, maxRequests: 5 }, // 5 requests per minute
  
  // General API limit
  GENERAL: { windowMs: 60 * 1000, maxRequests: 60 }, // 60 requests per minute
};

/**
 * In-memory rate limit storage
 * Uses Map with timestamp-based expiration
 */
class RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    // Clean expired entries every 5 minutes
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanExpired(), 5 * 60 * 1000);
    }
  }

  /**
   * Get client identifier from request
   */
  private getClientKey(req: NextApiRequest): string {
    // Try to get real IP from various headers (handles proxies)
    const forwardedFor = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    
    let ip: string;
    if (typeof forwardedFor === 'string') {
      // Take first IP from comma-separated list
      ip = forwardedFor.split(',')[0].trim();
    } else if (typeof realIp === 'string') {
      ip = realIp;
    } else if (Array.isArray(forwardedFor)) {
      ip = forwardedFor[0];
    } else {
      ip = req.socket?.remoteAddress || 'unknown';
    }

    // Normalize localhost
    if (ip === '::1' || ip === '127.0.0.1') {
      ip = 'localhost';
    }

    const prefix = this.config.keyPrefix || 'ratelimit';
    return `${prefix}:${ip}`;
  }

  /**
   * Check if request is allowed and increment counter
   * Returns { allowed: boolean, remaining: number, resetTime: number }
   */
  check(req: NextApiRequest): { allowed: boolean; remaining: number; resetTime: number; limit: number } {
    const key = this.getClientKey(req);
    const now = Date.now();
    const resetTime = now + this.config.windowMs;

    const entry = this.store.get(key);

    if (!entry || entry.resetTime < now) {
      // New window
      this.store.set(key, { count: 1, resetTime });
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime,
        limit: this.config.maxRequests
      };
    }

    if (entry.count >= this.config.maxRequests) {
      // Rate limited
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        limit: this.config.maxRequests
      };
    }

    // Increment counter
    entry.count++;
    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime,
      limit: this.config.maxRequests
    };
  }

  /**
   * Remove expired entries from store
   */
  private cleanExpired(): void {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (value.resetTime < now) {
        this.store.delete(key);
      }
    }
  }
}

// Create rate limiters for different purposes
const recommendLimiter = new RateLimitStore({
  ...RATE_LIMITS.RECOMMEND,
  keyPrefix: 'recommend'
});

const blueprintLimiter = new RateLimitStore({
  ...RATE_LIMITS.BLUEPRINT,
  keyPrefix: 'blueprint'
});

const llmLimiter = new RateLimitStore({
  ...RATE_LIMITS.LLM,
  keyPrefix: 'llm'
});

/**
 * Check rate limit for recommendation endpoint
 */
export function checkRecommendRateLimit(req: NextApiRequest) {
  return recommendLimiter.check(req);
}

/**
 * Check rate limit for blueprint endpoint
 */
export function checkBlueprintRateLimit(req: NextApiRequest) {
  return blueprintLimiter.check(req);
}

/**
 * Check general LLM rate limit
 */
export function checkLLMRateLimit(req: NextApiRequest) {
  return llmLimiter.check(req);
}

/**
 * Create response headers for rate limit information
 */
export function rateLimitHeaders(result: { limit: number; remaining: number; resetTime: number }) {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
  };
}

/**
 * Get rate limit exceeded response
 */
export function rateLimitExceededResponse(result: { resetTime: number; limit: number }) {
  const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
  return {
    success: false,
    error: 'Rate limit exceeded',
    message: `Too many requests. Please wait ${retryAfter} seconds before trying again.`,
    retryAfter,
    limit: result.limit
  };
}
