# Authentication Setup Guide

## Quick Fix for "No userId for protected endpoint"

The error you're seeing means the frontend is not sending authentication tokens with API requests. Here's how to fix it:

## Step 1: Set Environment Variables

Create a `.env.local` file in your project root with:

```env
# Required for authentication
CLERK_SECRET_KEY=sk_test_your_development_secret_key_here
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_development_publishable_key_here

# Required for database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Optional: Enable debug mode for development
DEBUG_MODE=true
```

## Step 2: Get Your Clerk Keys

1. Go to https://dashboard.clerk.com/
2. Find your instance (eminent-earwig-25.clerk.accounts.dev)
3. Go to "Configure" → "API Keys"
4. Copy the Secret key and Publishable key

## Step 3: Fix Frontend Code

Your frontend needs to include authentication tokens. Add this to your API calls:

```javascript
// For Bearer token authentication
const token = await auth().getToken();

const response = await fetch('/api/shopping-lists/generate', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${token}`, // Add this line
	},
	body: JSON.stringify({ mealPlanId, startDate, endDate }),
});
```

## Step 4: Test Authentication

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Test the authentication endpoint:

   ```bash
   # Test without auth (should fail)
   curl -X GET http://localhost:3001/api/test-auth

   # Test with auth (should work)
   curl -X GET http://localhost:3001/api/test-auth \
     -H "Authorization: Bearer YOUR_CLERK_TOKEN"
   ```

## Step 5: Debug Mode (Development Only)

If you need to test without authentication during development:

1. Set `DEBUG_MODE=true` in your `.env.local`
2. The API will use a debug user ID for testing
3. **Never use debug mode in production**

## Common Issues

### "No userId for protected endpoint"

- **Cause**: Frontend not sending authentication token
- **Fix**: Add `Authorization: Bearer <token>` header

### "Token verification failed"

- **Cause**: Invalid or expired token
- **Fix**: Get a fresh token from your logged-in session

### "No configured Clerk instances found"

- **Cause**: Missing environment variables
- **Fix**: Set `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

## Testing Your Setup

Run this command to test your authentication:

```bash
node test-auth-debug.js
```

This will help identify where the authentication is failing.

## Next Steps

1. Set your environment variables
2. Update your frontend to include authentication headers
3. Test with the debug script
4. Deploy with proper production keys

The authentication system is working correctly - you just need to ensure the frontend sends the proper credentials!
