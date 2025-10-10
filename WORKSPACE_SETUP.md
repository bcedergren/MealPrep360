# MealPrep360 Unified Workspace Setup Guide

This guide explains how to work with all MealPrep360 services in a unified workspace.

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Development Options](#development-options)
- [Workspace Commands](#workspace-commands)
- [VSCode Integration](#vscode-integration)
- [Service Architecture](#service-architecture)
- [Troubleshooting](#troubleshooting)

## Overview

MealPrep360 is a microservices-based application with the following services:

| Service | Port | Technology | Description |
|---------|------|------------|-------------|
| Frontend | 3000 | Next.js | Main user-facing application |
| API Gateway | 3001 | Next.js API | Central API routing & auth |
| Admin Panel | 3008 | Next.js | Administrative dashboard |
| Recipe Service | 3002 | Express/TS | Recipe generation & management |
| Meal Plan Service | 3003 | Next.js API | Meal planning logic |
| Shopping Service | 3004 | Express/TS | Shopping list management |
| Social Service | 3005 | Next.js | Social features |
| Blog Service | 3006 | Next.js | Content management |
| WebSocket Server | 3007 | Node.js | Real-time communication |
| MongoDB | 27017 | Database | Primary data store |
| Redis | 6379 | Cache | Caching & sessions |

## Quick Start

### Option 1: Docker (Recommended for Full Stack)

**Start all services with one command:**

```bash
# Start all services
npm run docker:up

# View logs
npm run docker:logs

# Stop all services
npm run docker:down
```

**Access the applications:**
- Frontend: http://localhost:3000
- Admin Panel: http://localhost:3008
- API Gateway: http://localhost:3001
- API Health: http://localhost:3001/api/health

### Option 2: Local Development (Recommended for Active Development)

**1. Install all dependencies once:**

```bash
npm install
```

This uses npm workspaces to install dependencies for all services.

**2. Run individual services:**

```bash
# Frontend
npm run dev:frontend

# API Gateway
npm run dev:api

# Recipe Service
npm run dev:recipe

# Admin Panel
npm run dev:admin

# And so on...
```

### Option 3: VSCode Workspace (Best IDE Experience)

**1. Open the workspace file:**

```bash
# From the root directory
code MealPrep360.code-workspace
```

**2. The workspace provides:**
- All services in separate folders
- Pre-configured debugging for each service
- Integrated terminal for each service
- Recommended extensions
- Tasks for common operations

## Development Options

### Working on a Single Service

If you're only working on one service:

```bash
# Navigate to service directory
cd MealPrep360-RecipeService

# Install dependencies (if not using workspaces)
npm install

# Run in development mode
npm run dev
```

### Working on Multiple Services

**Using npm workspaces (from root):**

```bash
# Start API Gateway and Frontend together
npm run dev:api & npm run dev:frontend

# Or use a process manager like concurrently (install if needed)
npx concurrently "npm:dev:api" "npm:dev:frontend" "npm:dev:recipe"
```

### Using Docker for Infrastructure Only

Run databases in Docker, services locally:

```bash
# Start only MongoDB and Redis
docker compose up -d mongodb redis

# Then run services locally
npm run dev:api
npm run dev:frontend
```

## Workspace Commands

### Installation & Setup

```bash
# Install all dependencies (uses workspaces)
npm install

# Install for specific service
npm install --workspace=MealPrep360-API
```

### Development

```bash
# Individual services
npm run dev:frontend      # Start Frontend (port 3000)
npm run dev:admin         # Start Admin Panel (port 3008)
npm run dev:api           # Start API Gateway (port 3001)
npm run dev:recipe        # Start Recipe Service (port 3002)
npm run dev:mealplan      # Start Meal Plan Service (port 3003)
npm run dev:shopping      # Start Shopping Service (port 3004)
npm run dev:social        # Start Social Service (port 3005)
npm run dev:blog          # Start Blog Service (port 3006)
npm run dev:websocket     # Start WebSocket Server (port 3007)
```

### Building

```bash
# Build all services
npm run build:all

# Build specific service
npm run build:frontend
npm run build:api
# etc...
```

### Testing

```bash
# Test all services
npm run test:all

# Test specific service (from root)
npm test --workspace=MealPrep360-API

# Or navigate to service and test
cd MealPrep360-API && npm test
```

### Linting

```bash
# Lint all services
npm run lint:all

# Lint specific service
npm run lint --workspace=MealPrep360
```

### Docker Commands

```bash
# Start all services
npm run docker:up

# Stop all services
npm run docker:down

# View logs (all services)
npm run docker:logs

# View logs (specific service)
docker compose logs -f frontend

# Rebuild and restart
npm run docker:rebuild

# Restart specific service
docker compose restart api-gateway
```

## VSCode Integration

### Opening the Workspace

```bash
code MealPrep360.code-workspace
```

### Features

1. **Multi-root Workspace**: Each service appears as a separate folder
2. **Debugging**: Pre-configured debug configurations for each service
3. **Tasks**: Quick access to common commands via Command Palette (Ctrl/Cmd + Shift + P → "Tasks: Run Task")
4. **Recommended Extensions**: Auto-prompts to install useful extensions
5. **Unified Settings**: Consistent formatting and linting across all services

### Using Tasks

Press `Ctrl/Cmd + Shift + P` and type "Tasks: Run Task", then select:

- **Start All Services (Docker)**: Starts all services using Docker Compose
- **Stop All Services (Docker)**: Stops all Docker services
- **View Docker Logs**: Shows logs from all services
- **Install All Dependencies**: Runs npm install for all workspaces
- **Build All Services**: Builds all services
- **Test All Services**: Runs tests for all services

### Debugging

1. Open the Run and Debug panel (Ctrl/Cmd + Shift + D)
2. Select a configuration from the dropdown:
   - Debug Frontend
   - Debug API Gateway
   - Debug Recipe Service
   - Debug All Frontend Services (runs multiple)
3. Press F5 to start debugging

## Service Architecture

### Communication Flow

```
User Browser
    ↓
Frontend (3000) ← WebSocket Server (3007)
    ↓
API Gateway (3001)
    ↓
┌────────────┬──────────────┬─────────────┬──────────────┐
↓            ↓              ↓             ↓              ↓
Recipe     Meal Plan    Shopping      Social         Blog
Service    Service      Service       Service        Service
(3002)     (3003)       (3004)        (3005)         (3006)
```

### Environment Variables

Each service needs its own environment variables. See:
- Root: `env.example`
- Each service has its own `.env.example` or `.env.local.example`

**Key variables:**
- `MONGODB_URI`: MongoDB connection string
- `REDIS_URL`: Redis connection string
- Service API keys for inter-service communication
- `NEXT_PUBLIC_API_URL`: API Gateway URL for frontend
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk auth key

### Port Assignments

| Port | Service | Notes |
|------|---------|-------|
| 3000 | Frontend | Main app |
| 3001 | API Gateway | All API routes go through here |
| 3002 | Recipe Service | Direct access for testing |
| 3003 | Meal Plan Service | Direct access for testing |
| 3004 | Shopping Service | Direct access for testing |
| 3005 | Social Service | Direct access for testing |
| 3006 | Blog Service | Direct access for testing |
| 3007 | WebSocket Server | Real-time updates |
| 3008 | Admin Panel | Admin interface |
| 27017 | MongoDB | Database |
| 6379 | Redis | Cache |

## Troubleshooting

### Docker Issues

**Docker daemon not running:**
```bash
# Windows: Start Docker Desktop
# Check if running:
docker ps
```

**Port conflicts:**
```bash
# Check what's using a port (Windows PowerShell)
netstat -ano | findstr :3000

# Stop the process using the port
taskkill /PID <PID> /F
```

**Container won't start:**
```bash
# View logs for specific service
docker compose logs api-gateway

# Rebuild specific service
docker compose up -d --build api-gateway
```

### npm Workspaces Issues

**Dependency conflicts:**
```bash
# Clean install
npm run clean
rm -rf node_modules package-lock.json
npm install
```

**Service not found:**
```bash
# Verify workspaces are configured
npm query .workspaces

# List all workspaces
npm ls --workspaces
```

### Development Issues

**Port already in use:**
```bash
# Change port in service's package.json or .env
# Example: MealPrep360-API/.env
PORT=3011
```

**TypeScript errors:**
```bash
# Navigate to specific service
cd MealPrep360-API

# Check TypeScript
npm run build

# Or use tsc directly
npx tsc --noEmit
```

**Service can't connect to others:**

1. Check if all required services are running
2. Verify environment variables (API URLs, API keys)
3. Check if MongoDB/Redis are running
4. Review service logs for connection errors

### Database Issues

**MongoDB connection failed:**
```bash
# If using Docker
docker compose up -d mongodb

# Check MongoDB logs
docker compose logs mongodb

# Verify connection string in .env
MONGODB_URI=mongodb://admin:devStrongPass!123@localhost:27017/mealprep360_prod?authSource=admin
```

**Redis connection failed:**
```bash
# If using Docker
docker compose up -d redis

# Test Redis connection
docker compose exec redis redis-cli ping
# Should return "PONG"
```

## Best Practices

### For Local Development

1. **Use Docker for databases**: Run MongoDB and Redis in Docker, services locally
2. **Watch mode**: Use `npm run dev:*` commands for hot-reload
3. **Single service focus**: Only run services you're actively working on
4. **Environment variables**: Copy `env.example` to `.env` and customize

### For Testing

1. **Use Docker**: Run full stack in Docker for integration testing
2. **Isolated tests**: Run unit tests locally in each service
3. **API testing**: Use tools like Postman or the provided collection

### For Production-like Testing

1. **Use docker-compose.prod.yml**: Simulates production environment
2. **Build images**: Test with built images, not development mode
3. **Environment separation**: Use `.env.production`

## Additional Resources

- [Architecture Documentation](./Documents/ARCHITECTURE.md)
- [Developer Guide](./Documents/DEVELOPER_GUIDE.md)
- [Running Guide](./Documents/RUNNING.md)
- [Deployment Guide](./Documents/DEPLOYMENT_GUIDE.md)
- [API Documentation](http://localhost:3001/api/docs) (when API is running)

## Quick Reference

```bash
# Full Docker setup
npm run docker:up && npm run docker:logs

# Local development (common services)
docker compose up -d mongodb redis
npm run dev:api & npm run dev:frontend

# VSCode workspace
code MealPrep360.code-workspace

# Clean restart
npm run docker:down
npm run docker:up --build
```

---

**Happy Coding! 🚀**

For issues or questions, check the [GitHub Issues](https://github.com/bcedergren/MealPrep360/issues).


