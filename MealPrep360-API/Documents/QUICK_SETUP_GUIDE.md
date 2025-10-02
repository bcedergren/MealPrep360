# Quick Setup Guide - Multi-Clerk Authentication

## Current Status ✅

You already have the code changes implemented! The API now supports multi-Clerk authentication and is configured to use your existing environment variable names:

- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

## What You Need to Do

### 1. Set Environment Variables

You mentioned you have these environment variables. Make sure they're set for the `eminent-earwig-25.clerk.accounts.dev` instance:

#### For Local Development (.env.local)

Create or update `.env.local` in your project root:

```env
CLERK_SECRET_KEY=sk_test_your_development_secret_key_here
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_development_publishable_key_here
```

#### For Production Deployment

Set these in your hosting platform (Vercel, etc.):

```env
CLERK_SECRET_KEY=sk_live_your_production_secret_key_here
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_production_publishable_key_here
```

### 2. Get Your Clerk Keys (If You Don't Have Them)

1. **Go to Clerk Dashboard:** https://dashboard.clerk.com/
2. **Find Your Instance:** Look for "eminent-earwig-25" or instance ID `ins_2vkNfPYyMCHNH2XG4OE8Ou78jlN`
3. **Navigate to API Keys:**
   - Go to "Configure" → "API Keys"
   - Copy the **Secret key** (starts with `sk_test_` or `sk_live_`)
   - Copy the **Publishable key** (starts with `pk_test_` or `pk_live_`)

### 3. Test the Setup

Once your environment variables are set:

#### Local Testing

```bash
# Start your development server
npm run dev

# Test the authentication endpoint
curl -X GET http://localhost:3001/api/test-auth \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN_FROM_FRONTEND"
```

#### Production Testing

```bash
# Test the deployed API
curl -X GET https://api.mealprep360.com/api/test-auth \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN_FROM_FRONTEND"
```

### 4. Expected Success Response

When working correctly, you should see:

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

## What's Already Implemented ✅

✅ **Multi-Clerk Authentication System** - Can validate tokens from multiple Clerk instances
✅ **Enhanced Test Endpoint** - `/api/test-auth` provides detailed debugging
✅ **Environment Configuration** - Uses your existing variable names
✅ **Backward Compatibility** - Falls back to standard Clerk auth for local development
✅ **Automatic User Creation** - Creates users in database when they first authenticate

## Troubleshooting

### "No configured Clerk instances found"

- Check that `CLERK_SECRET_KEY` is set and not empty
- Restart your development server after setting environment variables

### "Token verification failed"

- Ensure the token is from the `eminent-earwig-25.clerk.accounts.dev` instance
- Verify you're using the correct secret key for that instance
- Check that the token hasn't expired

### "Authentication works locally but not in production"

- Verify production environment variables are deployed
- Ensure you're using live keys (not test keys) in production
- Check your hosting platform's environment variable settings

## Next Steps

1. **Set your environment variables** (if not already done)
2. **Deploy your API** with the new code
3. **Test with your frontend's Clerk tokens**
4. **Verify the response shows `"authMethod": "multi-clerk"`**

That's it! Your API should now accept authentication tokens from your frontend's Clerk instance (`eminent-earwig-25.clerk.accounts.dev`).
