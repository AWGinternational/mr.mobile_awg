import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Development fallback - in-memory rate limiting
class MemoryStore {
  private store = new Map<string, { count: number; resetTime: number }>()

  async check(key: string, limit: number, windowMs: number) {
    const now = Date.now()
    const record = this.store.get(key)

    if (!record || now > record.resetTime) {
      this.store.set(key, { count: 1, resetTime: now + windowMs })
      return { success: true, remaining: limit - 1 }
    }

    if (record.count >= limit) {
      return { success: false, remaining: 0 }
    }

    record.count++
    return { success: true, remaining: limit - record.count }
  }
}

// Initialize Redis only if URL is properly configured
let redis: Redis | undefined = undefined

// Only use Redis if we have a proper HTTPS URL
if (process.env.UPSTASH_REDIS_REST_URL && 
    process.env.UPSTASH_REDIS_REST_URL.startsWith('https://') &&
    process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  } catch (error) {
    console.warn('Redis initialization failed, using memory store:', error)
    redis = undefined
  }
}

const memoryStore = new MemoryStore()

// Create fallback rate limiters that match the Upstash Ratelimit interface
const createFallbackRateLimit = (limit: number, windowMs: number) => ({
  check: async (identifier: string) => {
    return memoryStore.check(identifier, limit, windowMs)
  }
})

// Rate limiting instances with consistent interface
export const rateLimit = {
  login: redis ? new Ratelimit({
    redis,
    limiter: process.env.NODE_ENV === 'development' 
      ? Ratelimit.slidingWindow(50, '15 m')  // 50 attempts per 15 min in dev
      : Ratelimit.slidingWindow(5, '15 m'),  // 5 attempts per 15 min in prod
    analytics: true,
    prefix: 'rl:login',
  }) : createFallbackRateLimit(
    process.env.NODE_ENV === 'development' ? 100 : 5, 
    15 * 60 * 1000 // 15 minutes
  ),

  register: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 h'), // 3 registration attempts per hour
    analytics: true,
    prefix: 'rl:register',
  }) : createFallbackRateLimit(
    process.env.NODE_ENV === 'development' ? 10 : 3,
    60 * 60 * 1000 // 1 hour
  ),

  api: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 API calls per minute
    analytics: true,
    prefix: 'rl:api',
  }) : createFallbackRateLimit(
    process.env.NODE_ENV === 'development' ? 1000 : 100,
    60 * 1000 // 1 minute
  )
}

// Helper function to get client IP
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
}

// Legacy exports for backward compatibility
export const loginRateLimit = rateLimit.login
export const registrationRateLimit = rateLimit.register
export const generalAPIRateLimit = rateLimit.api
