# MealPrep360 - Complete Meal Planning Platform

A comprehensive microservices-based meal planning application with AI-powered recipe generation, meal planning, shopping lists, and social features.

## 🏗️ Architecture Overview

MealPrep360 is built as a modern microservices architecture with the following components:

### Frontend Services
- **Frontend** (`/services/frontend`) - Main Next.js application
- **Admin Panel** (`/services/admin`) - Administrative interface
- **Mobile App** (`/mobile`) - React Native mobile application

### Backend Services
- **API Gateway** (`/services/api-gateway`) - Central API routing and authentication
- **Recipe Service** (`/services/recipe-service`) - AI-powered recipe generation
- **Meal Plan Service** (`/services/meal-plan-service`) - Meal planning logic
- **Shopping List Service** (`/services/shopping-service`) - Shopping list management
- **Social Media Service** (`/services/social-service`) - Social features and sharing
- **Blog Service** (`/services/blog-service`) - Content management
- **WebSocket Server** (`/services/websocket-server`) - Real-time communication

### Infrastructure
- **Docker Compose** - Local development environment
- **Kubernetes** - Production deployment
- **Monitoring** - Prometheus, Grafana, ELK stack
- **Database** - MongoDB with Redis caching

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- MongoDB (or use Docker)
- Redis (or use Docker)

### Development Setup

#### Option 1: Docker (Full Stack - Easiest)

1. **Clone and start**
   ```bash
   git clone <repository-url>
   cd MealPrep360
   docker compose up -d
   ```

2. **Access the applications**
   - Frontend: http://localhost:3000
   - Admin Panel: http://localhost:3008
   - API Gateway: http://localhost:3001

#### Option 2: Local Development (Best for Development)

1. **Setup workspace**
   ```bash
   git clone <repository-url>
   cd MealPrep360
   npm install  # Installs all workspaces
   ```

2. **Run services**
   ```bash
   # Windows
   .\scripts\dev-local.ps1
   
   # Mac/Linux
   ./scripts/dev-local.sh
   ```

#### Option 3: VSCode Workspace (Best IDE Experience)

1. **Open workspace**
   ```bash
   code MealPrep360.code-workspace
   ```

2. **Use integrated tasks and debugging**
   - Press `Ctrl/Cmd + Shift + P` → "Tasks: Run Task"
   - Select "Start All Services (Docker)" or any other task

### 📚 Complete Workspace Guide

See [WORKSPACE_SETUP.md](./WORKSPACE_SETUP.md) for detailed instructions on:
- npm workspaces configuration
- Running individual services
- VSCode integration
- Debugging setup
- Troubleshooting

### Production Deployment

1. **Kubernetes Deployment**
   ```bash
   kubectl apply -f k8s/
   ```

2. **Environment Configuration**
   - Set production environment variables
   - Configure SSL certificates
   - Set up monitoring and logging

## 📁 Project Structure

```
MealPrep360/
├── .gitignore                 # Git ignore rules
├── README.md                  # This file
├── docker-compose.yml         # Development environment
├── docker-compose.prod.yml    # Production environment
├── k8s/                       # Kubernetes configurations
│   ├── namespace.yaml
│   ├── ingress.yaml
│   └── api-gateway-deployment.yaml
├── services/                  # Microservices
│   ├── frontend/              # Main Next.js app
│   ├── admin/                 # Admin panel
│   ├── api-gateway/           # API gateway
│   ├── recipe-service/        # Recipe generation
│   ├── meal-plan-service/     # Meal planning
│   ├── shopping-service/      # Shopping lists
│   ├── social-service/        # Social features
│   ├── blog-service/          # Content management
│   └── websocket-server/      # WebSocket server
├── mobile/                    # React Native app
├── infrastructure/            # Infrastructure configs
│   ├── nginx/                 # Nginx configurations
│   ├── monitoring/            # Monitoring setup
│   └── scripts/               # Deployment scripts
└── docs/                      # Documentation
```

## 🔧 Technology Stack

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Query** - Data fetching
- **Framer Motion** - Animations

### Backend
- **Node.js** - Runtime environment
- **Next.js API Routes** - API endpoints
- **MongoDB** - Primary database
- **Redis** - Caching and sessions
- **Docker** - Containerization

### AI & External Services
- **OpenAI GPT** - Recipe generation
- **Clerk** - Authentication
- **Stripe** - Payment processing
- **Firebase** - Additional services

### Infrastructure
- **Docker Compose** - Local development
- **Kubernetes** - Production orchestration
- **Prometheus** - Metrics collection
- **Grafana** - Metrics visualization
- **ELK Stack** - Logging

## 🔐 Environment Variables

Each service requires specific environment variables. See the `.env.example` files in each service directory for detailed configuration.

### Common Variables
- `MONGODB_URI` - MongoDB connection string
- `REDIS_URL` - Redis connection string
- `NODE_ENV` - Environment (development/production)

### API Keys
- `OPENAI_API_KEY` - OpenAI API access
- `CLERK_SECRET_KEY` - Clerk authentication
- `STRIPE_SECRET_KEY` - Stripe payments

## 🧪 Testing

### Run Tests
```bash
# All services
npm run test

# Specific service
cd services/recipe-service
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

## 📊 Monitoring

The application includes comprehensive monitoring:

- **Prometheus** - Metrics collection
- **Grafana** - Dashboards and visualization
- **ELK Stack** - Centralized logging
- **Health Checks** - Service health monitoring

Access monitoring at:
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000 (default credentials: admin/admin)

## 🚀 Deployment

### Docker Compose (Development)
```bash
docker-compose up -d
```

### Kubernetes (Production)
```bash
kubectl apply -f k8s/
```

### CI/CD
The repository is configured for automated deployment with:
- GitHub Actions for CI/CD
- Docker image building
- Kubernetes deployment
- Automated testing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow the existing code style

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in `/docs`
- Review the troubleshooting guides

## 🔄 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.

---

**MealPrep360** - Making meal planning simple, smart, and social.
