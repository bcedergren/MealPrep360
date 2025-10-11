# Required API Keys for MealPrep360

## Essential Keys (Required for Basic Functionality)

### 1. Clerk Authentication
**Purpose**: User authentication and management

- **CLERK_SECRET_KEY**: Server-side secret key
- **NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY**: Client-side publishable key

**Get from**: https://dashboard.clerk.com/
- Sign up/login
- Create a new application "MealPrep360"
- Copy keys from API Keys section

### 2. OpenAI API
**Purpose**: AI-powered recipe generation and content creation

- **OPENAI_API_KEY**: API key for GPT models

**Get from**: https://platform.openai.com/api-keys
- Sign up/login
- Create new secret key
- Copy and save (shown only once)

**Cost**: Pay-as-you-go, ~$0.002 per request

## Optional Keys (For Enhanced Features)

### 3. Stripe (Payment Processing)
**Purpose**: Handle subscriptions and payments

- **STRIPE_SECRET_KEY**: Server-side key
- **STRIPE_PUBLISHABLE_KEY**: Client-side key
- **STRIPE_WEBHOOK_SECRET**: For webhook verification

**Get from**: https://dashboard.stripe.com/apikeys
**Needed**: Only if you have paid features

### 4. Google APIs (Search & Services)
**Purpose**: Recipe search, nutrition data

- **GOOGLE_API_KEY**: For search API
- **GOOGLE_SEARCH_ENGINE_ID**: Custom search engine

**Get from**: https://console.cloud.google.com/
**Needed**: Only for recipe search feature

### 5. Resend (Email Services)
**Purpose**: Transactional emails

- **RESEND_API_KEY**: Email sending API

**Get from**: https://resend.com/
**Needed**: Only for email notifications

## Auto-Generated Keys (Already Created) ✅

These were automatically generated during setup:

- ✅ **Service API Keys** (6): For inter-service communication
  - RECIPE_SERVICE_API_KEY
  - MEALPLAN_SERVICE_API_KEY
  - SHOPPING_SERVICE_API_KEY
  - SOCIAL_SERVICE_API_KEY
  - BLOG_SERVICE_API_KEY
  - WEBSOCKET_SERVICE_API_KEY

- ✅ **JWT_SECRET**: For token signing

All stored in AWS Secrets Manager!

## Quick Start (Minimum Required)

For initial deployment and testing, you ONLY need:

1. **Clerk Keys** (authentication)
2. **OpenAI Key** (AI features)

Everything else is optional or auto-generated!

## Current Secret Status

```powershell
# Check what secrets exist
aws secretsmanager list-secrets --query "SecretList[?starts_with(Name,'mealprep360/')].Name" --output table --profile mealprep360
```

## Update Secrets in AWS

```powershell
$env:AWS_PROFILE = "mealprep360"

# Update Clerk keys
aws secretsmanager update-secret --secret-id mealprep360/clerk-publishable-key --secret-string "pk_test_YOUR_KEY_HERE"
aws secretsmanager update-secret --secret-id mealprep360/clerk-secret-key --secret-string "sk_test_YOUR_KEY_HERE"

# Update OpenAI key  
aws secretsmanager update-secret --secret-id mealprep360/openai-api-key --secret-string "sk-proj-YOUR_KEY_HERE"
```

## For Local Development (.env file)

When testing locally with Docker Compose:

```env
# Essential
CLERK_SECRET_KEY=sk_test_your_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key
OPENAI_API_KEY=sk-proj_your_key

# Database (local Docker)
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=yourLocalPassword123

# Auto-generated (any random values for local)
RECIPE_SERVICE_API_KEY=local-recipe-key-123
MEALPLAN_SERVICE_API_KEY=local-mealplan-key-123
SHOPPING_SERVICE_API_KEY=local-shopping-key-123
SOCIAL_SERVICE_API_KEY=local-social-key-123
BLOG_SERVICE_API_KEY=local-blog-key-123
WEBSOCKET_SERVICE_API_KEY=local-websocket-key-123
JWT_SECRET=local-jwt-secret-12345
```

## Summary

**For AWS Deployment:**
- ✅ Service API keys: Auto-generated ✓
- ✅ JWT secret: Auto-generated ✓
- ⏳ **Clerk keys**: Need to add
- ⏳ **OpenAI key**: Need to add

**For Local Testing:**
- Just create a `.env` file with the keys above

