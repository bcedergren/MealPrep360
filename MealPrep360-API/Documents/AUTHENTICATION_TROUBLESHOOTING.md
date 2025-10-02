# Authentication Troubleshooting Guide

This guide helps resolve 401 authentication errors when the frontend sends requests to the MealPrep360 API.

## Overview

The MealPrep360 API uses Clerk for authentication and maintains user records in MongoDB. When a user authenticates:

1. Frontend sends requests with Clerk JWT token in `Authorization: Bearer <token>` header
2. Clerk middleware validates the token
3. API ensures the user exists in MongoDB (auto-creates if needed)
4. Request proceeds with authenticated user context

## Common 401 Error Causes

### 1. Missing or Invalid Authorization Header

**Symptoms:**

- 401 Unauthorized on all API requests
- No `authorization` header in request logs

**Solution:**
Ensure frontend sends the Authorization header:

```javascript
// Frontend example
const response = await fetch('https://api.mealprep360.com/api/user', {
	headers: {
		Authorization: `Bearer ${clerkToken}`,
		'Content-Type': 'application/json',
	},
});
```

### 2. Token Format Issues

**Symptoms:**

- Token present but Clerk returns null userId
- Token doesn't start with "eyJ" (JWT format)

**Common Mistakes:**

- Missing "Bearer " prefix
- Using Clerk API key instead of session token
- Token from different Clerk instance/environment

**Solution:**
Get the correct token from Clerk:

```javascript
// Frontend - using Clerk React
import { useAuth } from '@clerk/nextjs';

const { getToken } = useAuth();
const token = await getToken();
```

### 3. CORS Issues

**Symptoms:**

- Preflight OPTIONS requests failing
- Browser console shows CORS errors
- Requests work in Postman but not browser

**Solution:**
The middleware now includes proper CORS headers. Ensure your frontend domain is in the allowed origins list in `src/middleware.ts`.

### 4. User Not in Database

**Symptoms:**

- Clerk authentication succeeds (userId present)
- But user operations fail with "User not found"

**Solution:**
The API now automatically creates users in the database when they first authenticate. This is handled by the `ensureUser()` function.

## Testing Authentication

### 1. Use the Test Endpoint

Test your authentication setup:

```bash
curl -X GET https://api.mealprep360.com/api/test-auth \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

This endpoint provides detailed debugging information:

- Clerk authentication status
- Database user lookup results
- Header information
- Helpful error messages

### 2. Check Middleware Logs

The middleware logs all requests. Look for:

```
🔧 Middleware Debug: {
  path: '/api/user',
  userId: 'user_xxx',  // Should have a value
  hasToken: true,      // Should be true
  tokenPreview: 'Bearer eyJ...'
}
```

### 3. Verify User Creation

After first authentication, check if user was created:

```bash
# In your database
db.users.findOne({ clerkId: "user_xxx" })
```

## Implementation Patterns

### For New API Routes

Use the `withAuth` wrapper for protected routes:

```typescript
// src/app/api/protected/route.ts
import { withAuth } from '@/lib/auth/withAuth';
import { NextResponse } from 'next/server';

export const GET = withAuth(async (req) => {
	// req.userId and req.user are guaranteed to exist
	return NextResponse.json({
		userId: req.userId,
		userEmail: req.user.email,
	});
});
```

### For Optional Auth Routes

Use `withOptionalAuth` for routes that work with or without auth:

```typescript
// src/app/api/public/route.ts
import { withOptionalAuth } from '@/lib/auth/withAuth';

export const GET = withOptionalAuth(async (req) => {
	if (req.userId) {
		// User is authenticated
		return NextResponse.json({
			message: `Hello ${req.user.name}`,
		});
	} else {
		// User is not authenticated
		return NextResponse.json({
			message: 'Hello guest',
		});
	}
});
```

### Manual Authentication Check

For custom authentication flows:

```typescript
import { auth } from '@clerk/nextjs/server';
import { ensureUser } from '@/lib/auth/ensureUser';

export async function GET(req: Request) {
	const { userId } = await auth();

	if (!userId) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Ensure user exists in database
	const user = await ensureUser();

	if (!user) {
		return NextResponse.json({ error: 'User setup failed' }, { status: 500 });
	}

	// Continue with your logic...
}
```

## Frontend Integration

### Next.js App Router

```typescript
// app/components/ApiClient.tsx
import { useAuth } from '@clerk/nextjs';

export function useApiClient() {
	const { getToken } = useAuth();

	const apiCall = async (endpoint: string, options: RequestInit = {}) => {
		const token = await getToken();

		if (!token) {
			throw new Error('Not authenticated');
		}

		const response = await fetch(
			`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
			{
				...options,
				headers: {
					...options.headers,
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			}
		);

		if (!response.ok) {
			throw new Error(`API error: ${response.status}`);
		}

		return response.json();
	};

	return { apiCall };
}
```

### React SPA

```javascript
// Using Clerk React
import { useAuth } from '@clerk/clerk-react';

function useApi() {
	const { getToken } = useAuth();

	const fetchWithAuth = async (url, options = {}) => {
		const token = await getToken();

		return fetch(url, {
			...options,
			headers: {
				...options.headers,
				Authorization: `Bearer ${token}`,
			},
		});
	};

	return { fetchWithAuth };
}
```

## Environment Variables

Ensure these are set correctly:

```env
# Backend (.env.local)
CLERK_SECRET_KEY=sk_test_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx
MONGODB_URI=mongodb+srv://...

# Frontend (.env.local)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
NEXT_PUBLIC_API_URL=https://api.mealprep360.com
```

## Debugging Checklist

When encountering 401 errors:

1. [ ] Check browser Network tab - is Authorization header present?
2. [ ] Verify token format - starts with "eyJ"?
3. [ ] Test with `/api/test-auth` endpoint
4. [ ] Check middleware logs for userId
5. [ ] Verify Clerk environment matches (dev/prod)
6. [ ] Ensure CORS origin is allowed
7. [ ] Check if user exists in database
8. [ ] Verify Clerk webhook is creating users

## Support

If issues persist after following this guide:

1. Check Clerk dashboard for user status
2. Verify MongoDB connection and user collection
3. Review server logs for detailed error messages
4. Test with a fresh token from a new login session
