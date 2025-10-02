# Multi-Clerk Authentication Solution

## Problem Summary

The MealPrep360 API (this project) was receiving 401 authentication errors when the frontend sent requests with Clerk JWT tokens. The issue was that:

1. **This project IS the external API** at `api.mealprep360.com`
2. The frontend uses Clerk instance `eminent-earwig-25.clerk.accounts.dev`
3. The API was only configured for local development Clerk authentication
4. Production deployments need to accept tokens from multiple Clerk instances

## Solution Implemented

### 1. Multi-Clerk Authentication System

Created `src/lib/auth/multiClerkAuth.ts` that:

- Supports multiple Clerk instances simultaneously
- Attempts token verification against each configured instance
- Provides detailed debugging information
- Falls back gracefully between instances

### 2. Enhanced Test Endpoint

Updated `/api/test-auth` to:

- Try multi-Clerk authentication first
- Fall back to standard Clerk auth for local development
- Provide detailed debugging information
- Show which Clerk instance successfully validated the token

### 3. Environment Configuration

The API now supports these environment variables:

```env
# Frontend Clerk Instance (eminent-earwig-25)
CLERK_SECRET_KEY_EARWIG=sk_live_your_secret_key_here
CLERK_PUBLISHABLE_KEY_EARWIG=pk_live_your_publishable_key

# Additional Clerk Instances
CLERK_SECRET_KEY_MAIN=sk_live_another_secret_key
CLERK_PUBLISHABLE_KEY_MAIN=pk_live_another_publishable_key
CLERK_DOMAIN_MAIN=another-instance.clerk.accounts.dev

# Fallback Instance
CLERK_SECRET_KEY=sk_live_fallback_key
CLERK_PUBLISHABLE_KEY=pk_live_fallback_key
CLERK_DOMAIN=fallback-instance.clerk.accounts.dev
```

## Implementation Details

### Multi-Clerk Authentication Flow

1. **Extract Token:** Get Bearer token from Authorization header
2. **Try Each Instance:** Attempt verification with each configured Clerk instance
3. **Return Success:** First successful verification returns user info
4. **Fallback:** If all fail, try standard Clerk auth for local development
5. **Error Handling:** Provide detailed error messages for debugging

### Code Structure

```
src/lib/auth/
├── multiClerkAuth.ts     # Multi-instance authentication
├── ensureUser.ts         # User creation utilities
└── withAuth.ts          # Route wrappers
```

### Key Functions

- `verifyMultiClerkToken()` - Verifies token against multiple instances
- `authenticateMultiClerk()` - Main authentication function
- `withMultiClerkAuth()` - Route wrapper for multi-Clerk auth

## Next Steps

### 1. Get Clerk Keys for Frontend Instance

You need to obtain the secret keys for the frontend's Clerk instance:

1. **Go to Clerk Dashboard:** https://dashboard.clerk.com/
2. **Find Instance:** Look for "eminent-earwig-25" or instance ID `ins_2vkNfPYyMCHNH2XG4OE8Ou78jlN`
3. **Get API Keys:**
   - Secret Key (starts with `sk_test_` or `sk_live_`)
   - Publishable Key (starts with `pk_test_` or `pk_live_`)

### 2. Configure Environment Variables

Add the keys to your deployment environment:

**For Development:**

```env
CLERK_SECRET_KEY_EARWIG=sk_test_your_dev_secret_key
CLERK_PUBLISHABLE_KEY_EARWIG=pk_test_your_dev_publishable_key
```

**For Production:**

```env
CLERK_SECRET_KEY_EARWIG=sk_live_your_production_secret_key
CLERK_PUBLISHABLE_KEY_EARWIG=pk_live_your_production_publishable_key
```

### 3. Deploy and Test

1. **Deploy** the updated API with environment variables
2. **Test** using the frontend's Clerk tokens:
   ```bash
   curl -X GET https://api.mealprep360.com/api/test-auth \
     -H "Authorization: Bearer FRONTEND_CLERK_TOKEN"
   ```
3. **Verify** the response shows `"authMethod": "multi-clerk"`

## Testing the Solution

### Test Commands

```bash
# Test multi-Clerk authentication
curl -X GET https://api.mealprep360.com/api/test-auth \
  -H "Authorization: Bearer YOUR_FRONTEND_TOKEN"

# Test user endpoint
curl -X GET https://api.mealprep360.com/api/user \
  -H "Authorization: Bearer YOUR_FRONTEND_TOKEN"

# Test any protected endpoint
curl -X GET https://api.mealprep360.com/api/recipes \
  -H "Authorization: Bearer YOUR_FRONTEND_TOKEN"
```

### Expected Success Response

```json
{
  "success": true,
  "authMethod": "multi-clerk",
  "auth": {
    "clerkUserId": "user_xxx",
    "sessionId": "sess_xxx",
    "instanceDomain": "eminent-earwig-25.clerk.accounts.dev"
  },
  "database": {
    "userFound": true,
    "user": { ... }
  }
}
```

## Benefits of This Solution

1. **Flexible:** Supports multiple Clerk instances
2. **Backward Compatible:** Falls back to standard Clerk auth
3. **Debuggable:** Detailed error messages and logging
4. **Scalable:** Easy to add new Clerk instances
5. **Secure:** Proper token verification for each instance

## Troubleshooting

### Common Issues

1. **"Token verification failed for all configured Clerk instances"**
   - Check environment variables are set correctly
   - Verify you're using the right keys (test vs live)
   - Ensure the token is from the expected Clerk instance

2. **"No configured Clerk instances found"**
   - At least one `CLERK_SECRET_KEY_*` must be set
   - Check environment variable names match exactly
   - Restart the application after adding variables

3. **Authentication works locally but not in production**
   - Verify production environment variables are deployed
   - Check you're using live keys (not test keys) in production
   - Ensure the hosting platform has the environment variables

### Debug Information

The `/api/test-auth` endpoint provides comprehensive debugging:

- Which Clerk instances are configured
- Whether a token was provided
- Detailed error messages for each failed verification attempt
- Success information including which instance validated the token

## Security Considerations

- **Key Management:** Keep Clerk secret keys secure and rotate regularly
- **Environment Separation:** Use different keys for dev/staging/production
- **Access Control:** Limit who has access to production Clerk keys
- **Monitoring:** Monitor authentication patterns in Clerk dashboard

This solution ensures the MealPrep360 API can accept authentication tokens from multiple Clerk instances while maintaining security and providing excellent debugging capabilities.
