# Environment Setup for Multi-Clerk Authentication

This guide explains how to configure the MealPrep360 API to accept authentication tokens from multiple Clerk instances.

## Required Environment Variables

To support authentication from the frontend's Clerk instance (`eminent-earwig-25.clerk.accounts.dev`), add these environment variables:

### Production Environment (.env.production)

```env
# Your existing Clerk instance (eminent-earwig-25) - Production Keys
CLERK_SECRET_KEY=sk_live_your_secret_key_here
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_publishable_key_here

# Additional Clerk instances (if needed)
CLERK_SECRET_KEY_ADDITIONAL=sk_live_additional_secret_key_here
CLERK_PUBLISHABLE_KEY_ADDITIONAL=pk_live_additional_publishable_key_here
CLERK_DOMAIN_ADDITIONAL=additional-instance.clerk.accounts.dev

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Other required variables
NODE_ENV=production
```

### Development Environment (.env.local)

```env
# Your existing Clerk instance (eminent-earwig-25) - Development Keys
CLERK_SECRET_KEY=sk_test_your_dev_secret_key_here
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_dev_publishable_key_here

# Additional Clerk instances (if needed)
CLERK_SECRET_KEY_ADDITIONAL=sk_test_additional_dev_secret_key_here
CLERK_PUBLISHABLE_KEY_ADDITIONAL=pk_test_additional_dev_publishable_key_here
CLERK_DOMAIN_ADDITIONAL=additional-instance.clerk.accounts.dev

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Other required variables
NODE_ENV=development
```

## How to Get Clerk Keys

### For the Frontend's Clerk Instance (eminent-earwig-25)

1. **Go to Clerk Dashboard:** https://dashboard.clerk.com/
2. **Select the Instance:** Look for "eminent-earwig-25" or the instance ID `ins_2vkNfPYyMCHNH2XG4OE8Ou78jlN`
3. **Navigate to API Keys:**
   - Go to "Configure" → "API Keys"
   - Copy the "Secret key" (starts with `sk_test_` or `sk_live_`)
   - Copy the "Publishable key" (starts with `pk_test_` or `pk_live_`)

### Important Notes

- **Test vs Live Keys:** Use `sk_test_` and `pk_test_` for development, `sk_live_` and `pk_live_` for production
- **Keep Keys Secure:** Never commit these keys to version control
- **Environment Specific:** Use different keys for development and production

## Deployment Configuration

### Vercel Deployment

1. **Go to Vercel Dashboard:** https://vercel.com/dashboard
2. **Select Your Project:** Choose the MealPrep360-API project
3. **Go to Settings → Environment Variables**
4. **Add each environment variable:**
   - Name: `CLERK_SECRET_KEY`
   - Value: `sk_live_your_actual_secret_key`
   - Environment: Production
   - Click "Save"

Repeat for all required variables.

### Other Hosting Platforms

For other platforms (AWS, Google Cloud, etc.), add the environment variables through their respective configuration interfaces.

## Testing the Configuration

### 1. Test Multi-Clerk Authentication

```bash
# Test with a token from the frontend's Clerk instance
curl -X GET https://api.mealprep360.com/api/test-auth \
  -H "Authorization: Bearer YOUR_FRONTEND_CLERK_TOKEN"
```

Expected response:

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

### 2. Check Configuration Status

```bash
# Check which Clerk instances are configured
curl -X GET https://api.mealprep360.com/api/admin/monitoring/services \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

This will show the health status of all configured Clerk instances.

## Troubleshooting

### Common Issues

1. **"Token verification failed for all configured Clerk instances"**
   - Check that the correct secret keys are set
   - Verify the token is from the expected Clerk instance
   - Ensure environment variables are properly deployed

2. **"No configured Clerk instances found"**
   - At least one set of `CLERK_SECRET_KEY_*` and domain must be set
   - Check environment variable names are correct
   - Restart the application after adding variables

3. **"Authentication works locally but not in production"**
   - Verify production environment variables are set
   - Check that you're using live keys (not test keys) in production
   - Ensure the deployment platform has the environment variables

### Debug Information

The `/api/test-auth` endpoint provides detailed debug information:

```json
{
	"error": "Authentication failed",
	"debug": {
		"configuredInstances": [
			"eminent-earwig-25.clerk.accounts.dev",
			"your-main-clerk-domain.clerk.accounts.dev"
		],
		"hasToken": true,
		"multiClerkError": "Token verification failed..."
	}
}
```

## Security Considerations

- **Rotate Keys Regularly:** Change Clerk secret keys periodically
- **Monitor Usage:** Check Clerk dashboard for unusual authentication patterns
- **Separate Environments:** Use different Clerk instances for dev/staging/production
- **Access Control:** Limit who has access to production Clerk keys

## Adding New Clerk Instances

To support additional Clerk instances:

1. **Add Environment Variables:**

   ```env
   CLERK_SECRET_KEY_NEWINSTANCE=sk_live_new_secret_key
   CLERK_PUBLISHABLE_KEY_NEWINSTANCE=pk_live_new_publishable_key
   CLERK_DOMAIN_NEWINSTANCE=new-instance.clerk.accounts.dev
   ```

2. **Update Configuration:**
   Edit `src/lib/auth/multiClerkAuth.ts` and add the new instance to the `CLERK_INSTANCES` array:

   ```typescript
   {
     domain: process.env.CLERK_DOMAIN_NEWINSTANCE || '',
     secretKey: process.env.CLERK_SECRET_KEY_NEWINSTANCE || '',
     publishableKey: process.env.CLERK_PUBLISHABLE_KEY_NEWINSTANCE || '',
   }
   ```

3. **Deploy and Test:**
   Deploy the changes and test with tokens from the new instance.
