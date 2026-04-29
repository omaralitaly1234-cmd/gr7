// ============================================
// API Rate Limiter — In-Memory
// Prevents API abuse and DoS attacks
// ============================================

// In-memory store (reset on server restart)
const requestCounts = new Map();

// Cleanup old entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  
  for (const [key, data] of requestCounts.entries()) {
    if (now - data.windowStart > 60000) {
      requestCounts.delete(key);
    }
  }
}

/**
 * Check if a request should be rate limited
 * @param {string} identifier - User ID or IP address
 * @param {number} maxRequests - Max requests per window (default: 30)
 * @param {number} windowMs - Time window in ms (default: 60 seconds)
 * @returns {{ limited: boolean, remaining: number, retryAfter: number }}
 */
export function checkRateLimit(identifier, maxRequests = 30, windowMs = 60000) {
  cleanup();
  
  const now = Date.now();
  const key = `rate:${identifier}`;
  
  let data = requestCounts.get(key);
  
  if (!data || now - data.windowStart > windowMs) {
    // New window
    data = { count: 1, windowStart: now };
    requestCounts.set(key, data);
    return { limited: false, remaining: maxRequests - 1, retryAfter: 0 };
  }
  
  data.count++;
  requestCounts.set(key, data);
  
  if (data.count > maxRequests) {
    const retryAfter = Math.ceil((data.windowStart + windowMs - now) / 1000);
    return { limited: true, remaining: 0, retryAfter };
  }
  
  return { limited: false, remaining: maxRequests - data.count, retryAfter: 0 };
}

/**
 * Rate limit Response helper
 */
export function rateLimitResponse(retryAfter) {
  return new Response(
    JSON.stringify({
      error: 'rate_limited',
      message: `Too many requests. Retry after ${retryAfter} seconds.`,
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
      },
    }
  );
}
