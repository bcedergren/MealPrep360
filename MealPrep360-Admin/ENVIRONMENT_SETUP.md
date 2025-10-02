# Admin Project Environment Setup

## Overview

After the migration to centralized API, the Admin project requires specific environment variables to connect to the MealPrep360-API service.

## Required Environment Variables

Create a `.env.local` file in the Admin project root with the following variables:

```bash
# API Configuration - URL of the centralized MealPrep360-API service
NEXT_PUBLIC_API_URL=http://localhost:3000

# Clerk Authentication (if needed)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

## Environment Configuration by Stage

### Development

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Production

```bash
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

## Setup Instructions

1. Create `.env.local` file in the Admin project root
2. Copy the required environment variables from above
3. Update the `NEXT_PUBLIC_API_URL` to point to your API service
4. Add your Clerk authentication keys if using Clerk
5. Restart your development server

## Important Notes

- The `NEXT_PUBLIC_API_URL` must point to the MealPrep360-API service
- All admin API calls will be routed through this centralized API
- Ensure the API service is running before starting the Admin project
- The Admin project no longer contains its own API routes after migration
