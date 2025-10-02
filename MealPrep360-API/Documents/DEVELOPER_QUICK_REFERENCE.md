# MealPrep360 Developer Quick Reference

## 🚀 Quick Start Commands

### Development Setup

#### Option 1: Docker Compose (Recommended)
```bash
# Clone and setup
git clone https://github.com/yourusername/MealPrep360.git
cd MealPrep360

# Create environment file
cp .env.example .env.production

# Deploy with Docker Compose
./scripts/docker-deploy.sh development

# Check status
docker-compose ps
```

#### Option 2: Manual Setup
```bash
# Clone and setup
git clone https://github.com/yourusername/MealPrep360.git
cd MealPrep360

# Install all dependencies
npm run install:all

# Start all services
npm run dev:all

# Or start individually
npm run dev:web        # Web app (port 3000)
npm run dev:api        # API gateway (port 3001)
npm run dev:recipe     # Recipe service (port 3002)
npm run dev:mealplan   # Meal plan service (port 3003)
npm run dev:shopping   # Shopping service (port 3004)
npm run dev:social     # Social service (port 3005)
npm run dev:blog       # Blog service (port 3006)
npm run dev:websocket  # WebSocket server (port 3007)
npm run dev:admin      # Admin panel (port 3008)
```

### Container Management
```bash
# Build all Docker images
./scripts/docker-build-all.sh

# Deploy for development
./scripts/docker-deploy.sh development

# Deploy for production
./scripts/docker-deploy.sh production

# Scale services
docker-compose up --scale api-gateway=3

# Check container health
docker-compose ps

# View logs
docker-compose logs -f api-gateway

# Execute commands in container
docker-compose exec api-gateway npm run test
```

### Testing
```bash
# Run all tests
npm run test:all

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:api
npm run test:performance

# Run with coverage
npm run test:coverage
```

### Service Communication
```bash
# Test service communication
npm run test:real-communication

# Validate service configuration
npm run validate-services

# Setup service communication
npm run setup-services
```

## 📁 Project Structure

```
MealPrep360/
├── MealPrep360/                    # Main web app (Next.js)
├── MealPrep360-API/               # API gateway (Next.js)
├── MealPrep360-RecipeService/     # Recipe service (Express)
├── MealPrep360-MealPlanService/   # Meal plan service (Next.js)
├── MealPrep360-ShoppingListService/ # Shopping service (Express)
├── MealPrep360-SocialMediaService/ # Social service (Next.js)
├── MealPrep360-BlogService/       # Blog service (Next.js)
├── MealPrep360-WebsocketServer/   # WebSocket server (Node.js)
├── MealPrep360-Admin/             # Admin dashboard (Next.js)
├── MealPrep360Mobile/             # Mobile app (React Native)
└── Documents/                     # Documentation
```

## 🐳 Container Information

### Docker Images
| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| Frontend | `mealprep360/frontend:latest` | 3000 | Main user interface |
| API Gateway | `mealprep360/api-gateway:latest` | 3001 | Core API service |
| Recipe Service | `mealprep360/recipe-service:latest` | 3002 | Recipe management |
| Meal Plan Service | `mealprep360/mealplan-service:latest` | 3003 | Meal planning |
| Shopping Service | `mealprep360/shopping-service:latest` | 3004 | Shopping lists |
| Social Service | `mealprep360/social-service:latest` | 3005 | Social features |
| Blog Service | `mealprep360/blog-service:latest` | 3006 | Content management |
| WebSocket Server | `mealprep360/websocket-server:latest` | 3007 | Real-time features |
| Admin Panel | `mealprep360/admin:latest` | 3008 | Admin dashboard |

### Container Commands
```bash
# Build specific image
docker build -t mealprep360/frontend:latest ./MealPrep360

# Run container
docker run -p 3000:3000 mealprep360/frontend:latest

# View running containers
docker ps

# View container logs
docker logs <container-id>

# Execute command in container
docker exec -it <container-id> sh
```

## 🔧 Service Ports

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| Web App | 3000 | http://localhost:3000 | Main user interface |
| API Gateway | 3001 | http://localhost:3001 | Core API service |
| Recipe Service | 3002 | http://localhost:3002 | Recipe management |
| Meal Plan Service | 3003 | http://localhost:3003 | Meal planning |
| Shopping Service | 3004 | https://shopping.mealprep360.com | Shopping lists |
| Social Service | 3005 | http://localhost:3005 | Social features |
| Blog Service | 3006 | http://localhost:3006 | Content management |
| WebSocket Server | 3007 | http://localhost:3007 | Real-time features |
| Admin Panel | 3008 | http://localhost:3008 | Admin dashboard |

## 🔑 Environment Variables

### Required for All Services
```env
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/mealprep360
REDIS_URL=redis://localhost:6379
```

### API Gateway (.env.local)
```env
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_test_...
SPOONACULAR_API_KEY=...
```

### Service Communication
```env
RECIPE_SERVICE_URL=http://localhost:3002
RECIPE_SERVICE_API_KEY=generated-key
MEALPLAN_SERVICE_URL=http://localhost:3003
MEALPLAN_SERVICE_API_KEY=generated-key
SHOPPING_SERVICE_URL=https://shopping.mealprep360.com
SHOPPING_SERVICE_API_KEY=generated-key
SOCIAL_SERVICE_URL=http://localhost:3005
SOCIAL_SERVICE_API_KEY=generated-key
BLOG_SERVICE_URL=http://localhost:3006
BLOG_SERVICE_API_KEY=generated-key
WEBSOCKET_SERVICE_URL=http://localhost:3007
WEBSOCKET_SERVICE_API_KEY=generated-key
```

## 🛠️ Common Development Tasks

### Adding a New API Endpoint
1. Create route file in `src/app/api/`
2. Add to API configuration in `src/lib/api-config.ts`
3. Update tests in `src/tests/api/`
4. Document in API documentation

### Adding a New Service
1. Create service directory
2. Add to service configuration in `src/lib/services/config.ts`
3. Update service discovery
4. Add health check endpoint
5. Update monitoring

### Database Changes
1. Update Mongoose schemas
2. Create migration scripts
3. Update TypeScript types
4. Test with sample data

### Testing New Features
1. Write unit tests
2. Add integration tests
3. Update E2E tests
4. Run performance tests

## 🐛 Common Issues & Solutions

### Service Won't Start
```bash
# Check if port is in use
netstat -ano | findstr :3001

# Kill process using port
taskkill /PID <PID> /F

# Check environment variables
npm run validate-env
```

### Database Connection Issues
```bash
# Check MongoDB status
mongosh --eval "db.adminCommand('ismaster')"

# Test connection string
node -e "console.log(process.env.MONGODB_URI)"
```

### Service Communication Issues
```bash
# Test service health
curl http://localhost:3001/api/health

# Check service discovery
npm run test:real-communication

# Validate configuration
npm run validate-services
```

### Authentication Issues
```bash
# Check Clerk configuration
npm run show-keys

# Test authentication
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/user
```

## 📊 Monitoring & Debugging

### Health Checks
```bash
# Check all services
curl http://localhost:3001/api/admin/services/health

# Check individual service
curl http://localhost:3002/health
```

### Logs
```bash
# View API logs
npm run logs:api

# View service logs
npm run logs:recipe
npm run logs:mealplan
```

### Performance
```bash
# Run performance tests
npm run test:performance

# Check service metrics
npm run metrics
```

## 🔄 Git Workflow

### Branch Naming
- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `hotfix/description` - Critical fixes
- `refactor/description` - Code refactoring

### Commit Messages
```
feat: add new recipe search endpoint
fix: resolve authentication issue
docs: update API documentation
test: add unit tests for user service
refactor: improve error handling
```

### Pull Request Process
1. Create feature branch
2. Make changes and test
3. Create pull request
4. Code review
5. Merge to main

## 📚 Useful Resources

### Documentation
- [Comprehensive Documentation](./COMPREHENSIVE_APPLICATION_DOCUMENTATION.md)
- [Architecture Diagram](./ARCHITECTURE_DIAGRAM.md)
- [Testing Guide](./TESTING_GUIDE.md)
- [API Documentation](./API_DOCUMENTATION.md)

### External Services
- [Clerk Documentation](https://clerk.com/docs)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [MongoDB Atlas](https://docs.atlas.mongodb.com/)
- [Stripe API Docs](https://stripe.com/docs/api)

### Development Tools
- [Next.js Docs](https://nextjs.org/docs)
- [React Native Docs](https://reactnative.dev/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Testing](https://jestjs.io/docs)

## 🆘 Getting Help

### Internal Resources
- GitHub Issues: Bug reports and feature requests
- Documentation: Comprehensive guides
- Code Comments: Inline documentation
- Team Chat: Internal communication

### External Resources
- Stack Overflow: Technical questions
- GitHub Discussions: Community support
- Official Docs: Service documentation
- Community Forums: User discussions

---

*This quick reference is updated regularly. For the most current information, check the main documentation.*
