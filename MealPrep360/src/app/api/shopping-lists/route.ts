/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { serverApiClient } from '@/lib/api-client-server'
import { API_CONFIG } from '@/lib/api-config'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// GET /api/shopping-lists - Get user's shopping lists
export async function GET(request: NextRequest) {
  const isDev = process.env.NODE_ENV !== 'production'
  if (isDev) {
    console.log('🛒 Shopping Lists API - GET request started')
    console.log('🛒 Request URL:', request.url)
  }

  try {
    if (isDev) {
      console.log('🛒 Authenticating user...')
    }

    let userId, getToken, token
    try {
      const authResult = await auth()
      userId = authResult.userId
      getToken = authResult.getToken
      token = await getToken()
    } catch (authError) {
      console.error('🛒 Clerk auth() call failed:', {
        error: authError instanceof Error ? authError.message : authError,
        name: authError instanceof Error ? authError.name : 'Unknown',
      })
      return NextResponse.json(
        {
          error: 'Authentication service error',
          details:
            authError instanceof Error
              ? authError.message
              : 'Unknown auth error',
        },
        { status: 401 }
      )
    }

    if (isDev) {
      console.log('🛒 Auth result:', {
        hasUserId: !!userId,
        hasToken: !!token,
        userId: userId ? `${userId.substring(0, 8)}...` : 'null',
      })
    }

    if (!userId) {
      if (isDev) {
        console.log('🛒 Authentication failed - no userId')
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const params: Record<string, string> = Object.fromEntries(
      searchParams.entries()
    )
    // Strip cache-busting param before calling external API
    if ('t' in params) delete params.t

    if (isDev) {
      console.log('🛒 Request parameters:', params)
      console.log('🛒 API endpoint:', API_CONFIG.endpoints.shoppingLists)
      console.log('🛒 Base URL:', API_CONFIG.baseURL)
    }

    // Allow per-service base/path overrides for shopping lists
    // Prefer SERVER_API_URL for server-side calls (Docker service DNS) to avoid localhost from inside containers
    const shoppingApiBaseOverride =
      process.env.NEXT_PUBLIC_SHOPPING_API_URL || process.env.SHOPPING_API_URL
    const shoppingApiPathOverride =
      process.env.NEXT_PUBLIC_SHOPPING_API_PATH || process.env.SHOPPING_API_PATH

    // Fallback base prioritizes SERVER_API_URL for server-side networking
    const fallbackServerBase = process.env.SERVER_API_URL || API_CONFIG.baseURL
    const effectiveBase = (
      shoppingApiBaseOverride || fallbackServerBase
    ).replace(/\/$/, '')
    const effectivePath = (
      shoppingApiPathOverride || API_CONFIG.endpoints.shoppingLists
    ).startsWith('/')
      ? shoppingApiPathOverride || API_CONFIG.endpoints.shoppingLists
      : `/${shoppingApiPathOverride || API_CONFIG.endpoints.shoppingLists}`

    if (isDev) {
      console.log('🛒 Effective Shopping API config:', {
        shoppingApiBaseOverride: shoppingApiBaseOverride || '[none]',
        shoppingApiPathOverride: shoppingApiPathOverride || '[none]',
        effectiveBase,
        serverApiBase: process.env.SERVER_API_URL || '[unset]',
        effectivePath,
        fullURL: `${effectiveBase}${effectivePath}`,
      })
    }

    if (isDev) {
      console.log('🛒 Making external API request...')
      console.log('🛒 Full request details:', {
        endpoint: API_CONFIG.endpoints.shoppingLists,
        baseURL: API_CONFIG.baseURL,
        fullURL: `${API_CONFIG.baseURL}${API_CONFIG.endpoints.shoppingLists}`,
        params: params,
        userId: userId ? `${userId.substring(0, 8)}...` : 'null',
      })
    }

    if (isDev) {
      console.log('🛒 Making request to external API...')
    }

    // Prepare service-specific headers to ensure routing to the correct external service
    const shoppingServiceApiKey = process.env.SHOPPING_SERVICE_API_KEY
    const serviceHeaders: Record<string, string> = {
      // Hint for API gateway/service router if supported
      'X-Service': 'shopping',
      // Prefer explicit shopping service API key for x-api-key headers
      ...(shoppingServiceApiKey
        ? {
            'x-api-key': shoppingServiceApiKey,
            'X-API-Key': shoppingServiceApiKey,
            'X-Shopping-API-Key': shoppingServiceApiKey,
          }
        : {}),
    }

    // Try multiple possible external endpoints based on docs/config
    const primaryEndpoint = `${effectiveBase}${effectivePath}`
    const candidateEndpoints = Array.from(
      new Set([
        // Primary: effective base + effective path (absolute URL)
        primaryEndpoint,
        // Fallbacks on same base with common prefixes
        `${effectiveBase}/api/shopping-lists`,
        `${effectiveBase}/api/v1/shopping-lists`,
        `${effectiveBase}/v1/shopping-lists`,
        `${effectiveBase}/shopping-lists`,
        // Relative path using default config (kept for backward compat)
        API_CONFIG.endpoints.shoppingLists,
      ])
    )

    let response = null as Awaited<
      ReturnType<typeof serverApiClient.get<unknown>>
    > | null
    let attempted: Array<{
      endpoint: string
      status?: number
      error?: string
    }> = []

    for (const ep of candidateEndpoints) {
      if (isDev) {
        console.log('🛒 Attempting external endpoint:', { endpoint: ep })
      }
      const res = await serverApiClient.get(ep, params, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          'X-User-Id': userId,
          ...serviceHeaders,
        },
        requestContext: request,
      })
      attempted.push({ endpoint: ep, status: res.status, error: res.error })
      if (res.success) {
        response = res
        break
      }
      // If the primary, correct endpoint returned 404, interpret this as
      // "no active shopping list" and return a normalized empty result.
      if (res.status === 404 && ep === primaryEndpoint) {
        if (isDev) {
          console.log(
            '🛒 Primary endpoint returned 404. Treating as no active shopping list.'
          )
        }
        return NextResponse.json(
          {
            shoppingLists: [],
            message: 'No active shopping list found for this user',
          },
          { status: 200 }
        )
      }
    }

    // If all attempts failed, try to auto-detect the correct external prefix via health check
    if (!response || !response.success) {
      try {
        if (isDev) {
          console.log(
            '🩺 Auto-detecting external API prefix via health checks...'
          )
        }
        const possiblePrefixes = Array.from(
          new Set([
            // Derive from configured path (e.g., '/api/shopping-lists' -> '/api')
            (API_CONFIG.endpoints.shoppingLists || '').replace(
              /\/?shopping-lists.*$/i,
              ''
            ) || '/api',
            '/api',
            '/api/v1',
            '/v1',
            '',
          ])
        )

        let detectedPrefix: string | null = null
        for (const prefix of possiblePrefixes) {
          const healthUrl = `${effectiveBase}${prefix}/health`
          if (isDev) console.log('🩺 Checking health endpoint:', healthUrl)
          try {
            const res = await fetch(healthUrl, {
              method: 'GET',
              headers: {
                ...(token && { Authorization: `Bearer ${token}` }),
                'X-User-Id': userId || '',
                Accept: 'application/json',
              },
              signal: AbortSignal.timeout(5000),
            })
            const text = await res.text()
            const isJson =
              res.headers.get('content-type')?.includes('application/json') &&
              !!text &&
              (() => {
                try {
                  JSON.parse(text)
                  return true
                } catch {
                  return false
                }
              })()
            if (res.ok && isJson) {
              detectedPrefix = prefix
              if (isDev)
                console.log('🩺 Detected working prefix:', detectedPrefix)
              break
            }
          } catch (e) {
            if (isDev) console.log('🩺 Health check failed for prefix:', prefix)
          }
        }

        if (detectedPrefix !== null) {
          const detectedEndpoint = `${effectiveBase}${detectedPrefix}/shopping-lists`
          if (isDev)
            console.log('🛒 Retrying with detected endpoint:', detectedEndpoint)
          const res = await serverApiClient.get(detectedEndpoint, params, {
            headers: {
              ...(token && { Authorization: `Bearer ${token}` }),
              'X-User-Id': userId,
              ...serviceHeaders,
            },
            requestContext: request,
          })
          attempted.push({
            endpoint: detectedEndpoint,
            status: res.status,
            error: res.error,
          })
          if (res.success) {
            response = res
          }
        }
      } catch (detectError) {
        if (isDev) console.log('🩺 Prefix auto-detection failed')
      }
    }

    if (isDev && response && response.data) {
      console.log('🛒 Response received from external API')
    }

    if (!response || !response.success) {
      console.error('🛒 External API error occurred:', {
        error: response?.error,
        status: response?.status,
        endpoint: API_CONFIG.endpoints.shoppingLists,
        baseURL: API_CONFIG.baseURL,
        fullURL: `${API_CONFIG.baseURL}${API_CONFIG.endpoints.shoppingLists}`,
        userId: userId ? `${userId.substring(0, 8)}...` : 'null',
        timestamp: new Date().toISOString(),
        attempted,
      })

      // Provide more helpful error messages based on the status
      let userFriendlyError = 'Failed to fetch shopping lists from external API'
      if (response?.status === 503 || response?.status === 502) {
        userFriendlyError =
          'The shopping list service is temporarily unavailable. Please try again in a few minutes.'
      } else if (response?.status === 408) {
        userFriendlyError =
          'Request timeout. The API service may be overloaded or not responding.'
      } else if (response?.status === 404) {
        userFriendlyError =
          'Shopping list service not found. Please check your configuration.'
      }

      return NextResponse.json(
        {
          error: userFriendlyError,
          details: response?.error,
          shoppingLists: [],
          debug: {
            endpoint: API_CONFIG.endpoints.shoppingLists,
            status: response?.status,
            baseURL: API_CONFIG.baseURL,
            fullURL: `${API_CONFIG.baseURL}${API_CONFIG.endpoints.shoppingLists}`,
            attempted,
            timestamp: new Date().toISOString(),
          },
        },
        { status: response?.status || 500 }
      )
    }

    // Normalize the response shape for the frontend UI
    // Always return { shoppingLists: [...] }
    let shoppingLists: unknown[] = []
    const data = response.data as unknown

    if (Array.isArray(data)) {
      shoppingLists = data as unknown[]
    } else if (
      data &&
      typeof data === 'object' &&
      Array.isArray((data as { shoppingLists?: unknown[] }).shoppingLists)
    ) {
      shoppingLists = (data as { shoppingLists: unknown[] }).shoppingLists
    } else if (data && typeof data === 'object') {
      // If the gateway returns a single active shopping list object, wrap it
      // so the UI can process it uniformly.
      shoppingLists = [data]
    } else {
      // Fallback: treat unexpected formats as empty
      shoppingLists = []
    }

    if (isDev) console.log('🛒 Successfully returning shopping lists data')
    return NextResponse.json({ shoppingLists })
  } catch (error) {
    console.error('🛒 Unexpected error in shopping lists API:', {
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack?.split('\n').slice(0, 3).join('\n'),
            }
          : error,
      endpoint: API_CONFIG.endpoints.shoppingLists,
      baseURL: API_CONFIG.baseURL,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json(
      {
        error:
          'The shopping list service is temporarily unavailable. Our team has been notified and is working to resolve this issue. Please try again in a few minutes.',
        details: error instanceof Error ? error.message : 'Unknown error',
        shoppingLists: [],
        serviceStatus: 'degraded',
        debug: {
          endpoint: API_CONFIG.endpoints.shoppingLists,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    )
  }
}

// POST /api/shopping-lists - Create shopping list from meal plan
export async function POST(request: NextRequest) {
  const isDev = process.env.NODE_ENV !== 'production'
  if (isDev) {
    console.log('🛒 Shopping Lists API - POST request started')
    console.log('🛒 Request URL:', request.url)
  }

  try {
    if (isDev) console.log('🛒 Authenticating user for POST...')
    const { userId, getToken } = await auth()
    const token = await getToken()

    if (isDev) {
      console.log('🛒 POST Auth result:', {
        hasUserId: !!userId,
        hasToken: !!token,
        userId: userId ? `${userId.substring(0, 8)}...` : 'null',
      })
    }

    if (!userId) {
      console.log('🛒 POST Authentication failed - no userId')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    if (isDev) {
      console.log('🛒 POST request body:', {
        hasBody: !!body,
        bodyKeys: body && typeof body === 'object' ? Object.keys(body) : 'N/A',
        bodyType: typeof body,
      })
      console.log('🛒 Making POST request to external API...')
    }
    const startTime = Date.now()
    const response = await serverApiClient.post(
      API_CONFIG.endpoints.shoppingLists,
      {
        ...body,
        userId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-User-Id': userId,
        },
      }
    )
    const responseTime = Date.now() - startTime

    if (isDev) {
      console.log('🛒 POST response received:', {
        success: response.success,
        status: response.status,
        error: response.error,
        hasData: !!response.data,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
      })
    }

    if (!response.success) {
      console.error('🛒 POST External API error:', {
        error: response.error,
        status: response.status,
        endpoint: API_CONFIG.endpoints.shoppingLists,
        userId: userId ? `${userId.substring(0, 8)}...` : 'null',
        timestamp: new Date().toISOString(),
      })

      return NextResponse.json(
        {
          error: 'Failed to create shopping list on external API',
          details: response.error,
          debug: {
            endpoint: API_CONFIG.endpoints.shoppingLists,
            status: response.status,
            timestamp: new Date().toISOString(),
          },
        },
        { status: response.status || 500 }
      )
    }

    if (isDev) console.log('🛒 Successfully created shopping list')
    return NextResponse.json(response.data)
  } catch (error) {
    console.error('🛒 Unexpected error in POST shopping lists API:', {
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack?.split('\n').slice(0, 3).join('\n'),
            }
          : error,
      endpoint: API_CONFIG.endpoints.shoppingLists,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json(
      {
        error: 'Failed to connect to external API',
        details: error instanceof Error ? error.message : 'Unknown error',
        debug: {
          endpoint: API_CONFIG.endpoints.shoppingLists,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    )
  }
}
