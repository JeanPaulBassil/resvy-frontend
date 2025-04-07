import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

interface RateLimitStore {
  timestamp: number;
  requests: number;
}

const WINDOW_SIZE = 60 * 1000; // 1 minute
const MAX_REQUESTS = 200;
const rateLimitStore = new Map<string, RateLimitStore>();

export function rateLimitMiddleware(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ??
    request.headers.get('x-real-ip') ??
    'anonymous';
  const now = Date.now();

  // Get or create rate limit data for this IP
  let rateLimit = rateLimitStore.get(ip);

  if (!rateLimit || now - rateLimit.timestamp > WINDOW_SIZE) {
    rateLimit = { timestamp: now, requests: 0 };
    rateLimitStore.set(ip, rateLimit);

    // Schedule deletion after the window expires to prevent iteration
    setTimeout(() => rateLimitStore.delete(ip), WINDOW_SIZE);
  }

  rateLimit.requests++;

  // Check if rate limit exceeded
  if (rateLimit.requests > MAX_REQUESTS) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': '60',
        'Content-Type': 'text/plain',
      },
    });
  }

  // Add response headers for rate limit monitoring
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', MAX_REQUESTS.toString());
  response.headers.set('X-RateLimit-Remaining', (MAX_REQUESTS - rateLimit.requests).toString());
  response.headers.set(
    'X-RateLimit-Reset',
    Math.floor((rateLimit.timestamp + WINDOW_SIZE) / 1000).toString() // Convert to seconds
  );

  return response;
}
