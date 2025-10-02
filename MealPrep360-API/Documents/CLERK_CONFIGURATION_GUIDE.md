# Clerk Configuration Guide for External API

## Problem

Your frontend uses Clerk instance `eminent-earwig-25.clerk.accounts.dev` but the external API at `api.mealprep360.com` is not configured to validate tokens from this instance.

## Solution A: Configure External API to Accept Your Clerk Tokens

If you control the external API at `api.mealprep360.com`, you need to configure it with your Clerk instance details:

### 1. Environment Variables for External API

Add these environment variables to the external API server:

```env
# Your Clerk instance configuration
CLERK_PUBLISHABLE_KEY=pk_test_xxx  # Your publishable key
CLERK_SECRET_KEY=sk_test_xxx       # Your secret key
CLERK_JWT_KEY=                     # Your JWT verification key

# Clerk instance domain
CLERK_DOMAIN=eminent-earwig-25.clerk.accounts.dev
```

### 2. Clerk JWKS Configuration

The external API needs to be configured to validate JWTs from your Clerk instance:

**JWKS URL:** `https://eminent-earwig-25.clerk.accounts.dev/.well-known/jwks.json`
**Clerk Instance ID:** `ins_2vkNfPYyMCHNH2XG4OE8Ou78jlN`

### 3. Update External API Middleware

The external API's Clerk middleware should be configured like this:

```typescript
// External API middleware configuration
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware({
	// Configure for your specific Clerk instance
	publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
	secretKey: process.env.CLERK_SECRET_KEY,

	// JWT verification settings
	jwtKey: process.env.CLERK_JWT_KEY,

	// Domain configuration
	domain: process.env.CLERK_DOMAIN || 'eminent-earwig-25.clerk.accounts.dev',
});
```

### 4. Verify Configuration

Test the external API configuration:

```bash
# Test with your Clerk token
curl -X GET https://api.mealprep360.com/api/test-auth \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

## Solution B: Use Local Development API

If you don't control the external API, use your local development API instead:

### 1. Update Frontend Configuration

Point your frontend to your local API:

```env
# Frontend .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 2. Start Local API Server

Make sure your local API is running:

```bash
npm run dev  # or yarn dev
```

### 3. Update API Calls

Ensure your frontend API calls use the local URL:

```javascript
// Frontend API client
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const response = await fetch(`${API_BASE_URL}/api/user`, {
	headers: {
		Authorization: `Bearer ${clerkToken}`,
		'Content-Type': 'application/json',
	},
});
```

## Solution C: Create API Proxy

If you need to use the external API but can't configure it, create a proxy:

### 1. Create Proxy Endpoint

```typescript
// src/app/api/proxy/[...path]/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

export async function GET(
	req: NextRequest,
	{ params }: { params: { path: string[] } }
) {
	const { userId } = await auth();

	if (!userId) {
		return new Response('Unauthorized', { status: 401 });
	}

	// Forward request to external API with different auth
	const externalApiUrl = `https://api.mealprep360.com/api/${params.path.join('/')}`;

	// Use external API's expected auth format
	const response = await fetch(externalApiUrl, {
		headers: {
			// Convert your Clerk auth to external API's expected format
			Authorization: `Bearer ${await getExternalApiToken(userId)}`,
			'Content-Type': 'application/json',
		},
	});

	return response;
}

async function getExternalApiToken(userId: string) {
	// Implement logic to get/generate token for external API
	// This depends on the external API's authentication system
}
```

### 2. Update Frontend to Use Proxy

```javascript
// Use proxy instead of direct external API calls
const response = await fetch('/api/proxy/user', {
	headers: {
		Authorization: `Bearer ${clerkToken}`, // Your Clerk token
		'Content-Type': 'application/json',
	},
});
```

## Recommended Approach

**For Development:** Use Solution B (local API)
**For Production:** Use Solution A (configure external API) if you control it, otherwise Solution C (proxy)

## Verification Steps

1. Check which Clerk instance the external API is configured for
2. Verify your frontend is using the correct Clerk instance
3. Ensure environment variables match between frontend and API
4. Test authentication with `/api/test-auth` endpoint
5. Check server logs for detailed error messages

## Common Issues

- **Different Clerk environments:** Dev vs Production Clerk instances
- **Mismatched JWT keys:** External API using different JWT verification key
- **CORS issues:** External API not allowing your frontend domain
- **Token expiration:** Clerk tokens expire frequently in development
