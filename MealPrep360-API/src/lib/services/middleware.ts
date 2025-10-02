import { NextRequest, NextResponse } from 'next/server';
import { serviceAuth } from './auth';

export interface AuthenticatedRequest extends NextRequest {
  serviceName?: string;
  clientId?: string;
}

export function createServiceAuthMiddleware(serviceName: string) {
  return async function serviceAuthMiddleware(
    request: AuthenticatedRequest
  ): Promise<NextResponse | void> {
    const apiKey = request.headers.get('X-API-Key');
    const clientId = request.headers.get('X-Client-ID') || request.ip || 'unknown';

    // Validate API key
    if (!apiKey || !serviceAuth.validateApiKey(serviceName, apiKey)) {
      return NextResponse.json(
        { 
          error: 'Unauthorized', 
          message: 'Invalid or missing API key',
          code: 'INVALID_API_KEY'
        }, 
        { status: 401 }
      );
    }

    // Check rate limiting
    const rateLimitResult = serviceAuth.checkRateLimit(serviceName, clientId);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded', 
          message: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
          resetTime: rateLimitResult.resetTime
        }, 
        { 
          status: 429,
          headers: {
            'X-RateLimit-Reset': rateLimitResult.resetTime?.toString() || '',
            'Retry-After': Math.ceil(((rateLimitResult.resetTime || 0) - Date.now()) / 1000).toString()
          }
        }
      );
    }

    // Add service context to request
    request.serviceName = serviceName;
    request.clientId = clientId;
  };
}

export function createCorsMiddleware(allowedOrigins: string[] = ['*']) {
  return function corsMiddleware(request: NextRequest): NextResponse | void {
    const origin = request.headers.get('Origin');
    
    if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
      return NextResponse.next({
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-Client-ID',
          'Access-Control-Allow-Credentials': 'true',
        },
      });
    }

    return NextResponse.json(
      { error: 'CORS not allowed for this origin' },
      { status: 403 }
    );
  };
}

export function createLoggingMiddleware() {
  return function loggingMiddleware(request: NextRequest): void {
    const timestamp = new Date().toISOString();
    const method = request.method;
    const url = request.url;
    const userAgent = request.headers.get('User-Agent');
    const clientId = request.headers.get('X-Client-ID') || request.ip;

    console.log(`[${timestamp}] ${method} ${url} - Client: ${clientId} - UA: ${userAgent}`);
  };
}