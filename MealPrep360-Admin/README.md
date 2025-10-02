# MealPrep360 Admin Dashboard

The administrative dashboard for MealPrep360, a comprehensive meal planning and recipe management platform.

## Features

- **User Management**: View and manage user accounts, roles, and permissions
- **Recipe Management**: Generate and manage recipes, including image management
- **Blog Management**: Create and manage blog posts
- **Notifications**: Send and manage user notifications
- **Feedback Management**: View and respond to user feedback
- **Performance Monitoring**: Track system performance and health metrics

## Tech Stack

- **Frontend**: Next.js 14, React, Material-UI
- **Authentication**: Clerk
- **Database**: MongoDB
- **API**: Next.js API Routes
- **Styling**: Material-UI, CSS-in-JS

## Prerequisites

- Node.js 18.x or later
- MongoDB instance
- Clerk account for authentication
- Recipe service API endpoint

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Recipe Service
RECIPE_SERVICE_URL=your_recipe_service_url
RECIPE_SERVICE_API_KEY=your_recipe_service_api_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key
```

- `RECIPE_SERVICE_API_KEY` is required to authenticate requests to the recipe service.
- `OPENAI_API_KEY` is required for integrating with OpenAI services.

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/MealPrep360-Admin.git
   cd MealPrep360-Admin
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:

   - Copy `.env.example` to `.env.local`
   - Fill in the required environment variables

4. Run the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── admin/             # Admin dashboard pages
│   ├── api/               # API routes
│   └── _components/       # Shared components
├── lib/                   # Utility functions and configurations
│   ├── mongodb/          # MongoDB connection and schemas
│   └── utils/            # Helper functions
└── types/                # TypeScript type definitions
```

## Development

- **Code Style**: Follow the existing code style and use TypeScript
- **Commits**: Use conventional commits format
- **Branches**: Create feature branches from `main`
- **Testing**: Write tests for new features and maintain existing ones

## Deployment

The application is configured for deployment on Vercel. The deployment process is automated through GitHub integration.

1. Push to the `main` branch
2. Vercel automatically builds and deploys the application
3. Environment variables are managed through the Vercel dashboard

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

## Support

For support, please contact the development team or create an issue in the repository.

## 🏗️ Recent Updates

- Migrated to a pure frontend architecture: all backend logic and API routes have been removed.
- All data operations now use a centralized API client (`src/lib/apiClient.ts`) with Clerk authentication.
- Business logic is now centralized in the MealPrep360-API project.
- See `MIGRATION_COMPLETE.md` and `ENVIRONMENT_SETUP.md` for details on migration and setup.
