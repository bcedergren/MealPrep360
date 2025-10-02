# MealPrep360

A comprehensive AI-powered meal planning and preparation platform that helps users organize their meals, manage recipes, plan shopping, and streamline their cooking process with intelligent recommendations and social features.

## 🏗️ Architecture

MealPrep360 is built with a microservices architecture for better scalability and maintainability:

- **MealPrep360** - Main web application (Next.js frontend)
- **MealPrep360-API** - Core API service handling all data operations
- **MealPrep360-RecipeService** - Dedicated service for recipe generation and management
- **MealPrep360-MealPlanService** - Service for meal planning operations
- **MealPrep360-ShoppingListService** - Shopping list generation and management
- **MealPrep360-BlogService** - Content management service
- **MealPrep360-SocialMediaService** - Social features and interactions
- **MealPrep360-Admin** - Administrative dashboard
- **MealPrep360Mobile** - Mobile application (React Native)

## 🌟 Features

### 🤖 AI-Powered Intelligence

- **Smart Recipe Generation**: Generate custom recipes using OpenAI GPT-4 based on ingredients, dietary preferences, and restrictions
- **Intelligent Meal Planning**: AI-optimized weekly meal plans that consider your preferences, schedule, and nutritional goals
- **Recipe Recommendations**: Personalized recipe suggestions based on your taste profile and cooking history
- **Image Generation**: AI-generated recipe images using DALL-E integration
- **Nutritional Analysis**: Automated nutritional breakdown and dietary compliance checking

### 🍳 Recipe Management

- **Comprehensive Recipe Database**: Create, edit, organize, and import recipes from multiple sources
- **Spoonacular API Integration**: Access to thousands of professionally curated recipes
- **Multi-language Support**: Recipe content available in 10+ languages (English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Korean, Chinese)
- **Advanced Search & Filtering**: Find recipes by ingredients, cuisine, dietary restrictions, cooking time, and more
- **Recipe Analytics**: Track popularity, success rates, and user ratings
- **Ingredient Parsing**: Smart ingredient recognition and measurement conversion
- **Recipe Reporting**: Community-driven quality control system

### 📅 Advanced Meal Planning

- **Weekly/Monthly Planning**: Intuitive drag-and-drop meal planning interface
- **Calendar Integration**: Sync with Google Calendar and other calendar services
- **Meal Plan Optimization**: AI algorithms to balance nutrition, variety, and preferences
- **Batch Cooking Support**: Plan meals that utilize leftovers and batch cooking techniques
- **Seasonal Suggestions**: Recipes that match seasonal ingredient availability
- **Skip Date Management**: Flexible planning for vacations and special occasions

### 🛒 Smart Shopping & Inventory

- **Automated Shopping Lists**: Generate comprehensive shopping lists from meal plans
- **Smart Categorization**: Organize items by store sections for efficient shopping
- **Inventory Tracking**: Keep track of pantry staples and expiration dates
- **Quantity Optimization**: Calculate exact quantities needed to minimize waste
- **Multi-store Support**: Separate lists for different stores or family members
- **Freezer Management**: Track freezer inventory with defrosting reminders and storage guidelines

### 👥 Social Features

- **Group Meal Prep**: Coordinate cooking sessions with friends and family
- **Social Feed**: Share recipes, meal photos, and cooking achievements
- **User Profiles**: Follow other users and discover their favorite recipes
- **Community Interaction**: Like, comment, and save recipes from the community
- **Collaborative Planning**: Share meal plans and shopping lists with household members

### 📝 Content Management

- **Rich Blog System**: Built-in CMS with TipTap editor for recipe blogs and cooking articles
- **Content Categories**: Organize blog posts by topics, difficulty, cuisine types
- **SEO Optimization**: Built-in SEO features for content discovery
- **Comment System**: Engage with readers through integrated commenting

### 💳 Subscription & Premium Features

- **Stripe Integration**: Secure payment processing for premium subscriptions
- **Tiered Access**: Free tier with premium features for subscribers
- **Subscription Management**: Easy upgrade, downgrade, and cancellation
- **Usage Analytics**: Track API usage and feature utilization

### 🔐 Security & Privacy

- **Clerk Authentication**: Secure user authentication with social login options
- **Two-Factor Authentication (2FA)**: Additional security layer with TOTP support
- **Data Privacy**: GDPR-compliant data handling and user privacy controls
- **Security Headers**: Comprehensive security headers and XSS protection

### 🔔 Notifications & Communication

- **Push Notifications**: Web push notifications for meal reminders and updates
- **Email Integration**: Automated emails using Resend for important updates
- **Preference Management**: Granular control over notification types and frequency
- **Newsletter System**: Optional newsletter subscription for cooking tips and updates

## 🛠 Tech Stack

### Frontend

- **Next.js 14**: React framework with App Router and Server Components
- **TypeScript**: Type-safe development across the entire application
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Radix UI**: Accessible, unstyled UI components
- **Material-UI (MUI)**: Additional component library for complex interactions
- **Framer Motion**: Animation library for smooth user interactions
- **React Query (TanStack)**: Data fetching and caching
- **React Beautiful DnD**: Drag and drop functionality for meal planning

### Backend & Microservices

- **Next.js API Routes**: Serverless API endpoints
- **MongoDB**: Primary database with Mongoose ODM
- **Firebase**: Real-time features, hosting, and additional storage
- **Firestore**: Real-time database for live features
- **Firebase Functions**: Serverless functions for background processing
- **Node.js**: Server-side JavaScript runtime
- **Express.js**: Used in some microservices for API routing

### AI & External Services

- **OpenAI GPT-4**: Recipe generation and intelligent suggestions
- **DALL-E**: AI image generation for recipes
- **Spoonacular API**: External recipe database integration
- **Google APIs**: Calendar integration and additional services

### Authentication & Payments

- **Clerk**: User authentication and management
- **Stripe**: Payment processing and subscription management
- **NextAuth**: Additional authentication options

### Development & Deployment

- **Jest**: Unit testing framework
- **ESLint**: Code linting and formatting
- **Firebase Hosting**: Static site hosting
- **Vercel**: API and frontend deployment platform
- **Docker**: Containerization for microservices

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn package manager
- MongoDB database (local or cloud)
- Firebase project
- Required API keys (see Environment Variables section)

### Installation

1. **Clone the repository:**

```bash
git clone https://github.com/yourusername/MealPrep360.git
cd MealPrep360
```

2. **Set up the main application:**

```bash
# Install dependencies
cd MealPrep360
npm install

# Set up environment variables
cp .env.example .env.local
```

3. **Set up the API service:**

```bash
# Navigate to API directory
cd ../MealPrep360-API

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

4. **Set up Firebase:**

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase project (in main directory)
cd ../MealPrep360
firebase init
```

5. **Set up the database:**

```bash
# For local MongoDB
# Make sure MongoDB is running locally on port 27017

# For MongoDB Atlas
# Use the connection string in your .env.local files

# Run database optimization script
npm run optimize-db
```

6. **Start the services:**

```bash
# Terminal 1 - Start API service (from MealPrep360-API)
cd MealPrep360-API
npm run dev

# Terminal 2 - Start main application (from MealPrep360)
cd MealPrep360
npm run dev
```

The application will be available at:

- Main app: `http://localhost:3000`
- API: `http://localhost:3001`

### 🔧 Environment Variables

#### Main Application (MealPrep360/.env.local)

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# Database
MONGODB_URI=mongodb://localhost:27017/mealprep360

# Authentication (Clerk)
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Other Services
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### API Service (MealPrep360-API/.env.local)

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/mealprep360

# Authentication (Clerk)
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_WEBHOOK_SECRET=your_webhook_secret

# AI Services
OPENROUTER_API_KEY=sk-or-your_openrouter_api_key

# External APIs
SPOONACULAR_API_KEY=your_spoonacular_api_key

# Payments
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Email Services
RESEND_API_KEY=your_resend_api_key

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# API URL
API_URL=http://localhost:3001

# Other Services
# API Configuration - All calls automatically routed to api.mealprep360.com via middleware
# No additional configuration needed
```

## 📱 API Documentation

The API is now a separate service running on `http://api.mealprep360.com` (or `http://localhost:3001` in development).

### Base URL

```
Development: http://localhost:3001
Production: http://api.mealprep360.com
```

### Core Endpoints

#### Recipes

- `GET /api/recipes` - List recipes with filtering and pagination
- `GET /api/recipes/[id]` - Get specific recipe details
- `POST /api/recipes` - Create new recipe
- `PUT /api/recipes/[id]` - Update recipe
- `DELETE /api/recipes/[id]` - Delete recipe
- `GET /api/recipes/recommended` - Get AI-recommended recipes
- `GET /api/recipes/search` - Search recipes with advanced filters
- `POST /api/user/recipes/save` - Save a recipe to user's collection
- `POST /api/user/recipes/unsave` - Remove a recipe from user's collection
- `GET /api/user/recipes/saved` - Get user's saved recipes with filtering

#### Meal Planning

- `GET /api/meal-plans` - Get user's meal plans
- `POST /api/meal-plans` - Create new meal plan
- `GET /api/meal-plans/[id]` - Get specific meal plan
- `PUT /api/meal-plans/[id]` - Update meal plan
- `POST /api/meal-plans/generate` - Generate AI-optimized meal plan

#### Shopping Lists

- `GET /api/shopping-lists` - Get user's shopping lists
- `POST /api/shopping-lists` - Create shopping list from meal plan
- `PUT /api/shopping-lists/[id]` - Update shopping list
- `POST /api/shopping-lists/generate` - Generate optimized shopping list

#### AI Services

- `POST /api/ai/suggestions` - Get AI recipe suggestions
- `POST /api/generate-image` - Generate recipe images
- `POST /api/ai/analyze` - Analyze recipe nutrition and properties

#### Social Features

- `GET /api/social/posts` - Get social feed
- `POST /api/social/posts` - Create social post
- `GET /api/social/profile` - Get user profile
- `POST /api/social/follow` - Follow/unfollow user

### Authentication

All API endpoints require authentication via Clerk. Include the authorization header:

```bash
Authorization: Bearer <clerk_session_token>
```

### CORS

The API service is configured with CORS to accept requests from the frontend application. In production, update the `FRONTEND_URL` environment variable to match your deployed frontend URL.

### Rate Limiting

- Free tier: 100 requests/hour
- Premium tier: 1000 requests/hour
- AI endpoints: Limited by OpenAI usage quotas

## 🏗 Project Structure

```
MealPrep360/                    # Main application root
├── MealPrep360/               # Frontend application
│   ├── src/
│   │   ├── app/               # Next.js App Router
│   │   ├── components/        # Reusable UI components
│   │   ├── lib/              # Utility libraries
│   │   ├── hooks/            # Custom React hooks
│   │   ├── contexts/         # React contexts
│   │   ├── types/            # TypeScript type definitions
│   │   └── translations/     # Multi-language support
│   └── public/               # Static assets
│
├── MealPrep360-API/          # Core API service
│   ├── src/
│   │   ├── app/api/          # API endpoints
│   │   ├── lib/              # Shared utilities
│   │   └── middleware.ts     # API middleware
│   └── package.json
│
├── MealPrep360-RecipeService/    # Recipe generation service
├── MealPrep360-MealPlanService/  # Meal planning service
├── MealPrep360-ShoppingListService/ # Shopping list service
├── MealPrep360-BlogService/      # Blog/CMS service
├── MealPrep360-SocialMediaService/ # Social features service
├── MealPrep360-Admin/            # Admin dashboard
└── MealPrep360Mobile/            # Mobile application
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

### Test Structure

- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Full user journey testing (planned)

### Writing Tests

Tests are located in `src/lib/__tests__/` and follow the pattern `*.test.ts` or `*.test.tsx`.

## 🚀 Deployment

### Deploying the Frontend (Vercel Recommended)

1. **Connect your repository to Vercel**
2. **Set environment variables in Vercel dashboard**
   - Add `NEXT_PUBLIC_API_URL` pointing to your deployed API
3. **Deploy automatically on push to main branch**

### Deploying the API

#### Option 1: Vercel (Recommended)

1. **Create a new Vercel project for MealPrep360-API**
2. **Set all required environment variables**
3. **Deploy with automatic scaling**

#### Option 2: Railway/Render

1. **Create new service from GitHub repo**
2. **Point to MealPrep360-API directory**
3. **Configure environment variables**
4. **Deploy with automatic HTTPS**

#### Option 3: Docker

```bash
# Build Docker image
cd MealPrep360-API
docker build -t mealprep360-api .

# Run container
docker run -p 3001:3001 --env-file .env mealprep360-api
```

### Environment-specific Configurations

#### Production

- Set `NODE_ENV=production`
- Use MongoDB Atlas or other cloud database
- Configure CDN for static assets
- Set up monitoring and logging
- Update CORS settings for production URLs

#### Staging

- Use separate database instance
- Test payment flows with Stripe test mode
- Validate AI integrations with usage limits

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Follow the coding standards (ESLint configuration)
4. Write tests for new features
5. Update documentation as needed

### Code Standards

- **TypeScript**: All new code must be typed
- **ESLint**: Follow the existing linting rules
- **Prettier**: Code formatting is enforced
- **Conventional Commits**: Use conventional commit messages

### Areas for Contribution

- **Frontend**: React components, UI/UX improvements
- **Backend**: API endpoints, database optimization
- **AI Features**: Recipe generation algorithms, recommendation improvements
- **Mobile**: React Native app development (planned)
- **Testing**: Unit tests, integration tests, E2E tests
- **Documentation**: API docs, user guides, developer documentation

### Pull Request Process

1. Update the README.md with details of changes if applicable
2. Update the API documentation for any endpoint changes
3. Increase version numbers following [SemVer](http://semver.org/)
4. Submit PR with clear description of changes

## 📊 Performance & Optimization

### Database Optimization

- MongoDB indexes are configured for common queries
- Connection pooling and caching implemented
- Regular optimization scripts in `/scripts/optimize-database.js`

### Frontend Performance

- Next.js Image optimization for recipe photos
- React Query for efficient data caching
- Lazy loading for non-critical components
- Bundle analysis and code splitting

### API Performance

- Memory caching for frequently accessed data
- Database connection pooling
- Response compression
- Query optimization with proper indexing

### AI Usage Optimization

- Intelligent caching of AI responses
- Rate limiting to prevent API overuse
- Fallback mechanisms for AI service failures

## 🔒 Security

### Authentication & Authorization

- Clerk handles user authentication and session management
- JWT tokens for API authentication
- Role-based access control for admin features
- CORS configuration for API security

### Data Protection

- Input validation and sanitization
- SQL injection prevention (NoSQL injection for MongoDB)
- XSS protection headers
- HTTPS enforcement in production

### API Security

- Rate limiting on all endpoints
- Request validation with Zod schemas
- Webhook signature verification
- Environment variable security

## 📈 Monitoring & Analytics

### Application Monitoring

- Error tracking and reporting
- Performance monitoring
- User analytics (privacy-compliant)
- API usage tracking

### Business Metrics

- User engagement tracking
- Recipe popularity analytics
- Subscription conversion rates
- Feature usage statistics

## 🗺 Roadmap

### Short Term (Q1 2024)

- [x] Microservices architecture migration
- [ ] Mobile app development (React Native)
- [ ] Advanced nutrition tracking
- [ ] Recipe video integration
- [ ] Enhanced social features

### Medium Term (Q2-Q3 2024)

- [ ] Voice integration for hands-free cooking
- [ ] Smart kitchen appliance integration
- [ ] Meal delivery service partnerships
- [ ] Advanced dietary goal tracking

### Long Term (Q4 2024+)

- [ ] AI nutritionist chat feature
- [ ] Augmented reality cooking assistance
- [ ] IoT integration for smart kitchens
- [ ] Multi-household family planning

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

### Documentation

- [API Documentation](docs/api.md)
- [User Guide](docs/user-guide.md)
- [Developer Guide](docs/developer-guide.md)

### Community

- [Discord Server](https://discord.gg/mealprep360)
- [GitHub Discussions](https://github.com/yourusername/MealPrep360/discussions)
- [Twitter](https://twitter.com/mealprep360)

### Bug Reports

Please report bugs using GitHub Issues with the bug report template.

### Feature Requests

Submit feature requests through GitHub Issues with the feature request template.

---

**MealPrep360** - Transforming meal planning with AI-powered intelligence and community collaboration.

## 🚀 Recent Updates

- Migrated to a microservices architecture for improved scalability and maintainability.
- All business logic and data operations are now handled by dedicated backend services (see below).
- The API is now a separate service (`MealPrep360-API`), and all data operations are routed through it.
- Enhanced security with Clerk authentication, JWT, and role-based access control.
- Improved monitoring, analytics, and error tracking across all services.
- Updated contribution guidelines: All PRs must update the README and API docs as needed.
- Mobile app development is in progress and leverages the same API as the web app.
