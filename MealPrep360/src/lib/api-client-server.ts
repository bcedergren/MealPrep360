import { auth } from '@clerk/nextjs/server'
import { apiMonitor } from './api-monitoring'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  status?: number
}

class ServerApiClient {
  private baseURL: string
  private timeout: number

  constructor(baseURL: string, timeout: number = 30000) {
    this.baseURL = baseURL
    this.timeout = timeout
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      const { getToken, userId, sessionId } = await auth()
      const token = await getToken()

      console.log('🔑 Auth details for external API:', {
        hasUserId: !!userId,
        hasSessionId: !!sessionId,
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
      })

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      }

      // Add Authorization header with Bearer token
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      // Add User ID header
      if (userId) {
        headers['X-User-Id'] = userId
      }

      // Add Session ID if available (for Clerk compatibility)
      if (sessionId) {
        headers['X-Session-Id'] = sessionId
      }

      // Alternative user header casing for compatibility
      if (userId) {
        headers['X-User-ID'] = userId
      }

      // Add service API keys for external API authentication
      const shoppingApiKey = process.env.SHOPPING_SERVICE_API_KEY
      const mealPlanApiKey = process.env.MEALPLAN_SERVICE_API_KEY

      if (shoppingApiKey) {
        headers['X-Shopping-API-Key'] = shoppingApiKey
      }
      if (mealPlanApiKey) {
        headers['X-MealPlan-API-Key'] = mealPlanApiKey
      }

      // Generic API key header used by some services
      const externalApiKey =
        process.env.EXTERNAL_API_KEY || shoppingApiKey || mealPlanApiKey
      if (externalApiKey) {
        ;(headers as Record<string, string>)['x-api-key'] = externalApiKey
        headers['X-API-Key'] = externalApiKey
      }

      // Optionally override Authorization header scheme if required by external API docs
      const externalAuthScheme = process.env.EXTERNAL_AUTH_SCHEME // e.g., 'ApiKey' or 'Token'
      if (externalAuthScheme && externalApiKey) {
        headers['Authorization'] = `${externalAuthScheme} ${externalApiKey}`
      }

      console.log('🔑 Service API Keys:', {
        hasShoppingKey: !!shoppingApiKey,
        hasMealPlanKey: !!mealPlanApiKey,
      })

      // Try to get session token directly for Clerk compatibility
      try {
        const sessionToken = await getToken({ template: 'supabase' }).catch(
          () => getToken().catch(() => null)
        )
        if (sessionToken && sessionToken !== token) {
          headers['X-Session-Token'] = sessionToken
        }
      } catch (error) {
        console.log('🔑 Could not get session token:', error)
      }

      console.log('🔑 Headers being sent to external API:', {
        hasAuthorization: !!headers['Authorization'],
        hasUserId: !!headers['X-User-Id'],
        hasSessionId: !!headers['X-Session-Id'],
        hasSessionToken: !!headers['X-Session-Token'],
        hasShoppingKey: !!headers['X-Shopping-API-Key'],
        hasMealPlanKey: !!headers['X-MealPlan-API-Key'],
        hasXApiKeyLower: !!(headers as Record<string, string>)['x-api-key'],
        hasXApiKey: !!headers['X-API-Key'],
        hasUserIdAlt: !!headers['X-User-ID'],
        externalAuthScheme: process.env.EXTERNAL_AUTH_SCHEME || '[none]',
      })

      return headers
    } catch (error) {
      console.error('🔑 Error getting auth headers:', error)
      return {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      }
    }
  }

  private async makeRequest<T>(
    url: string,
    options: RequestInit = {},
    requestContext?: any
  ): Promise<ApiResponse<T>> {
    // Extract endpoint from URL for monitoring
    const endpoint = url.replace(this.baseURL, '')
    const startTime = Date.now()

    try {
      console.log('🔗 Making request to:', url)
      console.log('🔗 Base URL:', this.baseURL)
      console.log('🔗 Full URL:', url)

      const defaultHeaders = await this.getAuthHeaders()
      const headers = {
        ...defaultHeaders,
        ...(options.headers || {}),
      }

      // Do not forward browser cookies to the external API to avoid HTML responses from gateways
      if (requestContext && requestContext.headers) {
        const cookieHeader = requestContext.headers.get('cookie')
        if (cookieHeader) {
          // Intentionally not forwarding cookies
        }
      }

      console.log('📤 Request headers:', {
        'Content-Type':
          (headers as Record<string, string>)['Content-Type'] || '[MISSING]',
        Accept: (headers as Record<string, string>)['Accept'] || '[MISSING]',
        Authorization: (headers as Record<string, string>)['Authorization']
          ? '[PRESENT]'
          : '[MISSING]',
        'X-User-Id': (headers as Record<string, string>)['X-User-Id']
          ? '[PRESENT]'
          : '[MISSING]',
        'X-Shopping-API-Key': (headers as Record<string, string>)[
          'X-Shopping-API-Key'
        ]
          ? '[PRESENT]'
          : '[MISSING]',
        'X-MealPlan-API-Key': (headers as Record<string, string>)[
          'X-MealPlan-API-Key'
        ]
          ? '[PRESENT]'
          : '[MISSING]',
        Cookie: (headers as Record<string, string>)['Cookie']
          ? '[PRESENT]'
          : '[MISSING]',
      })

      console.log('📤 Request options:', {
        method: options.method || 'GET',
        hasBody: !!options.body,
        timeout: this.timeout,
      })

      let response = await fetch(url, {
        ...options,
        headers,
        signal: AbortSignal.timeout(this.timeout),
      })

      console.log('📥 Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      })

      // Handle response body
      let responseData: any
      const contentType = response.headers.get('content-type')
      const text = await response.text()

      console.log('📥 Response text length:', text.length)
      console.log('📥 Response text preview:', text.substring(0, 200))

      // Check if response is HTML (error page)
      if (
        text.trim().startsWith('<!DOCTYPE') ||
        text.trim().startsWith('<html')
      ) {
        console.error('❌ External API returned HTML instead of JSON')
        console.error('❌ HTML response preview:', text.substring(0, 500))

        return {
          success: false,
          error:
            'External API returned HTML error page instead of JSON response. The external API at https://api.mealprep360.com may be down or misconfigured.',
          status: 500,
        }
      }

      // Handle JSON or JSON-like responses
      const looksLikeJson =
        text.trim().startsWith('{') || text.trim().startsWith('[')
      const isJsonContentType =
        !!contentType && contentType.toLowerCase().includes('json')

      if (text.trim().length === 0) {
        console.log('📥 Empty response body')
        responseData = undefined
      } else if (isJsonContentType || looksLikeJson) {
        try {
          responseData = JSON.parse(text)
          console.log('📥 Parsed JSON response:', {
            hasData: !!responseData,
            dataType: typeof responseData,
            isArray: Array.isArray(responseData),
            contentType,
          })
        } catch (parseError) {
          console.error('❌ JSON parse error:', parseError)
          console.error('❌ Raw text:', text)
          return {
            success: false,
            error: 'External API returned invalid JSON response',
            status: 500,
          }
        }
      } else {
        console.log('📥 Non-JSON response, content-type:', contentType)
        return {
          success: false,
          error: `External API returned unexpected content type: ${
            contentType ?? '[missing]'
          }.
Expected JSON but received: ${text.substring(0, 120)}...`,
          status: 500,
        }
      }

      // Log the API call for monitoring
      const responseTime = Date.now() - startTime
      if (response.ok) {
        apiMonitor.logSuccess(endpoint, responseTime)
        console.log(
          '✅ API call successful, response time:',
          responseTime + 'ms'
        )
      } else {
        apiMonitor.logFailure(
          endpoint,
          `HTTP ${response.status}: ${response.statusText}`,
          undefined,
          responseTime
        )
        console.error('❌ API call failed:', {
          status: response.status,
          statusText: response.statusText,
          responseTime: responseTime + 'ms',
          error: responseData?.error || responseData?.message,
        })
      }

      if (!response.ok) {
        // If unauthorized due to Clerk mismatch and we have an API key, retry once using API key auth scheme
        const clerkStatus = response.headers.get('x-clerk-auth-status') || ''
        const clerkReason = response.headers.get('x-clerk-auth-reason') || ''
        const hasClerkMismatch =
          response.status === 401 &&
          (clerkStatus.toLowerCase().includes('signed-out') ||
            clerkReason.toLowerCase().includes('jwk'))
        const externalApiKey =
          process.env.EXTERNAL_API_KEY ||
          process.env.SHOPPING_SERVICE_API_KEY ||
          process.env.MEALPLAN_SERVICE_API_KEY

        if (hasClerkMismatch && externalApiKey) {
          console.log(
            '🔁 Retrying request with API key authorization due to Clerk auth mismatch'
          )
          const authScheme = process.env.EXTERNAL_AUTH_SCHEME || 'ApiKey'

          const retryHeaders = {
            ...(headers as Record<string, string>),
            Authorization: `${authScheme} ${externalApiKey}`,
            'x-api-key': externalApiKey,
            'X-API-Key': externalApiKey,
          } as Record<string, string>

          const retryResponse = await fetch(url, {
            ...options,
            headers: retryHeaders,
            signal: AbortSignal.timeout(this.timeout),
          })

          const retryContentType = retryResponse.headers.get('content-type')
          const retryText = await retryResponse.text()

          // Handle HTML error on retry
          if (
            retryText.trim().startsWith('<!DOCTYPE') ||
            retryText.trim().startsWith('<html')
          ) {
            return {
              success: false,
              error:
                'External API returned HTML error page instead of JSON response on retry',
              status: 500,
            }
          }

          let retryData: any = undefined
          if (
            retryContentType &&
            retryContentType.includes('application/json')
          ) {
            if (retryText.trim()) {
              try {
                retryData = JSON.parse(retryText)
              } catch {}
            }
          }

          if (retryResponse.ok) {
            return {
              success: true,
              data: retryData as T,
              status: retryResponse.status,
            }
          }

          // If retry still fails, continue to normal error handling
          responseData = retryData || responseData
          response = retryResponse as any
        }

        const errorMessage =
          responseData?.error ||
          responseData?.message ||
          `HTTP ${response.status}`

        // Provide more specific error messages for common status codes
        let specificError = errorMessage
        if (response.status === 503) {
          specificError = 'External API service is temporarily unavailable'
        } else if (response.status === 502) {
          specificError = 'Bad gateway - external API connection failed'
        } else if (response.status === 504) {
          specificError = 'Gateway timeout - external API request timed out'
        } else if (response.status === 404) {
          specificError = 'External API endpoint not found'
        } else if (response.status === 401) {
          specificError = 'Authentication failed with external API'
        } else if (response.status === 403) {
          specificError = 'Access forbidden to external API'
        }

        return {
          success: false,
          error: specificError,
          status: response.status,
        }
      }

      return {
        success: true,
        data: responseData as T,
        status: response.status,
      }
    } catch (error) {
      console.error('❌ Request error:', error)

      // Log additional debugging information
      console.error('❌ API Configuration:', {
        baseURL: this.baseURL,
        timeout: this.timeout,
        environment: process.env.NODE_ENV,
      })

      if (error instanceof Error) {
        console.error('❌ Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        })

        if (error.name === 'TimeoutError') {
          return {
            success: false,
            error:
              'External API request timeout. Please check if the API service is running on the configured URL.',
            status: 408,
          }
        }
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: 'External API request aborted',
            status: 499,
          }
        }
        if (
          error.message.includes('fetch') ||
          error.message.includes('network')
        ) {
          return {
            success: false,
            error:
              'Network error connecting to external API. Please check your internet connection and ensure the API service is running.',
            status: 503,
          }
        }
        if (
          error.message.includes('ENOTFOUND') ||
          error.message.includes('DNS')
        ) {
          return {
            success: false,
            error:
              'Cannot resolve external API hostname. Please check the API URL configuration in your environment variables.',
            status: 502,
          }
        }
      }

      return {
        success: false,
        error: 'Network error connecting to external API',
      }
    }
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, any>,
    options: { headers?: Record<string, string>; requestContext?: any } = {}
  ): Promise<ApiResponse<T>> {
    let fullUrl = endpoint

    // Handle query parameters
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
      const queryString = searchParams.toString()
      if (queryString) {
        fullUrl += (endpoint.includes('?') ? '&' : '?') + queryString
      }
    }

    // Construct full URL properly
    let url: string
    if (fullUrl.startsWith('http')) {
      // If it's already a full URL, use it as is
      url = fullUrl
    } else {
      // Ensure proper URL construction
      const baseUrl = this.baseURL.endsWith('/')
        ? this.baseURL.slice(0, -1)
        : this.baseURL
      const endpointPath = fullUrl.startsWith('/') ? fullUrl : `/${fullUrl}`
      url = `${baseUrl}${endpointPath}`
    }

    console.log('🔗 Constructed URL:', url)

    return this.makeRequest<T>(
      url,
      {
        method: 'GET',
        headers: options.headers,
      },
      options.requestContext
    )
  }

  async post<T>(
    endpoint: string,
    data?: any,
    options: { headers?: Record<string, string>; requestContext?: any } = {}
  ): Promise<ApiResponse<T>> {
    // Construct full URL properly
    let url: string
    if (endpoint.startsWith('http')) {
      // If it's already a full URL, use it as is
      url = endpoint
    } else {
      // Ensure proper URL construction
      const baseUrl = this.baseURL.endsWith('/')
        ? this.baseURL.slice(0, -1)
        : this.baseURL
      const endpointPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
      url = `${baseUrl}${endpointPath}`
    }

    console.log('🔗 POST Constructed URL:', url)

    return this.makeRequest<T>(
      url,
      {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
        headers: options.headers,
      },
      options.requestContext
    )
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    // Construct full URL properly
    let url: string
    if (endpoint.startsWith('http')) {
      url = endpoint
    } else {
      const baseUrl = this.baseURL.endsWith('/')
        ? this.baseURL.slice(0, -1)
        : this.baseURL
      const endpointPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
      url = `${baseUrl}${endpointPath}`
    }

    return this.makeRequest<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    // Construct full URL properly
    let url: string
    if (endpoint.startsWith('http')) {
      url = endpoint
    } else {
      const baseUrl = this.baseURL.endsWith('/')
        ? this.baseURL.slice(0, -1)
        : this.baseURL
      const endpointPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
      url = `${baseUrl}${endpointPath}`
    }

    return this.makeRequest<T>(url, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    // Construct full URL properly
    let url: string
    if (endpoint.startsWith('http')) {
      url = endpoint
    } else {
      const baseUrl = this.baseURL.endsWith('/')
        ? this.baseURL.slice(0, -1)
        : this.baseURL
      const endpointPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
      url = `${baseUrl}${endpointPath}`
    }

    return this.makeRequest<T>(url, {
      method: 'DELETE',
    })
  }

  async upload<T>(
    endpoint: string,
    formData: FormData
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`
      const { getToken } = await auth()
      const token = await getToken()

      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        signal: AbortSignal.timeout(this.timeout),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || `HTTP ${response.status}`,
          data: data,
        }
      }

      return {
        success: true,
        data: data,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      }
    }
  }
}

// Export singleton instance
// Use SERVER_API_URL for server-side calls (Docker service names)
// Fall back to NEXT_PUBLIC_API_URL for backward compatibility
const baseUrl =
  process.env.SERVER_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://api.mealprep360.com'

export const serverApiClient = new ServerApiClient(baseUrl, 30000) // 30 second timeout
