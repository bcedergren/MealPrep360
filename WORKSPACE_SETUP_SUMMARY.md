# 🎉 MealPrep360 Unified Workspace Setup - Complete!

## What Was Set Up

Your MealPrep360 workspace is now fully configured for unified development across all services. Here's what's been implemented:

### ✅ Completed Setup

#### 1. **npm Workspaces Configuration** (`package.json`)
- Configured npm workspaces for all 9 services
- Centralized dependency management
- Added convenient npm scripts for all common tasks
- Single `npm install` installs all service dependencies

#### 2. **Docker Compose Updates**
- ✅ Removed obsolete `version` field from docker-compose files
- ✅ All 11 services properly configured:
  - Frontend (port 3000)
  - Admin Panel (port 3008)
  - API Gateway (port 3001)
  - Recipe Service (port 3002)
  - Meal Plan Service (port 3003)
  - Shopping Service (port 3004)
  - Social Service (port 3005)
  - Blog Service (port 3006)
  - WebSocket Server (port 3007)
  - MongoDB (port 27017)
  - Redis (port 6379)

#### 3. **VSCode Workspace** (`MealPrep360.code-workspace`)
- Multi-root workspace with all services as separate folders
- Pre-configured debugging for Frontend, API, and Recipe Service
- Integrated tasks for common operations
- Recommended extensions for optimal development
- Launch configurations for debugging individual or multiple services
- Consistent editor settings across all services

#### 4. **Development Scripts**
- **Windows PowerShell**: `scripts/dev-local.ps1`
- **Mac/Linux Bash**: `scripts/dev-local.sh`
- Interactive menu to choose development mode
- Automatically starts infrastructure (MongoDB, Redis)
- Options for full Docker, frontend stack, backend stack, or custom selection

#### 5. **Documentation**
- **WORKSPACE_SETUP.md**: Comprehensive 200+ line guide
- **QUICK_START_GUIDE.md**: One-page reference for common tasks
- **Updated README.md**: Includes workspace setup options

## 🚀 How to Use Your New Workspace

### Option 1: Docker (Simplest - Everything in Containers)

```bash
# Start everything
npm run docker:up

# View logs
npm run docker:logs

# Stop everything
npm run docker:down
```

**Access:**
- Frontend: http://localhost:3000
- Admin: http://localhost:3008
- API: http://localhost:3001

### Option 2: Local Development (Best for Active Development)

```powershell
# Windows - Interactive menu
.\scripts\dev-local.ps1

# Or use npm scripts directly
npm run dev:frontend
npm run dev:api
npm run dev:recipe
```

```bash
# Mac/Linux - Interactive menu
./scripts/dev-local.sh

# Or use npm scripts directly
npm run dev:frontend
npm run dev:api
npm run dev:recipe
```

### Option 3: VSCode Workspace (Best IDE Experience)

```bash
# Open the workspace
code MealPrep360.code-workspace
```

**Then use:**
- **Tasks**: `Ctrl/Cmd + Shift + P` → "Tasks: Run Task"
  - Start All Services (Docker)
  - Stop All Services (Docker)
  - View Docker Logs
  - Build All Services
  - Test All Services

- **Debugging**: `F5` or Run panel
  - Debug Frontend
  - Debug API Gateway
  - Debug Recipe Service
  - Debug All Frontend Services (compound)

## 📦 Available npm Commands

### Development Commands

```bash
# Start individual services
npm run dev:frontend      # Frontend (3000)
npm run dev:admin         # Admin (3008)
npm run dev:api           # API Gateway (3001)
npm run dev:recipe        # Recipe Service (3002)
npm run dev:mealplan      # Meal Plan (3003)
npm run dev:shopping      # Shopping (3004)
npm run dev:social        # Social (3005)
npm run dev:blog          # Blog (3006)
npm run dev:websocket     # WebSocket (3007)
```

### Build Commands

```bash
npm run build:all         # Build all services
npm run build:frontend    # Build specific service
npm run build:api
# etc...
```

### Testing & Quality

```bash
npm run test:all          # Test all services
npm run lint:all          # Lint all services
```

### Docker Commands

```bash
npm run docker:up         # Start all services
npm run docker:down       # Stop all services
npm run docker:logs       # View all logs
npm run docker:rebuild    # Rebuild and restart
npm run docker:restart    # Restart services
```

### Workspace Management

```bash
npm install               # Install all workspace dependencies
npm run clean             # Clean all node_modules
```

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    User Browser                      │
└─────────────────────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────┐
│              Frontend (Next.js - 3000)               │
│              Admin Panel (Next.js - 3008)            │
└─────────────────────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────┐
│           API Gateway (Next.js API - 3001)           │
│         (Authentication, Routing, Rate Limiting)     │
└─────────────────────────────────────────────────────┘
                           │
            ┌──────────────┴──────────────┐
            ↓                             ↓
┌────────────────────────┐    ┌────────────────────────┐
│   Microservices        │    │   Infrastructure       │
│                        │    │                        │
│ • Recipe (3002)        │    │ • MongoDB (27017)      │
│ • Meal Plan (3003)     │    │ • Redis (6379)         │
│ • Shopping (3004)      │    │ • WebSocket (3007)     │
│ • Social (3005)        │    │                        │
│ • Blog (3006)          │    │                        │
└────────────────────────┘    └────────────────────────┘
```

## 🎯 Recommended Development Workflows

### For Frontend Development

```bash
# Start infrastructure and API with Docker
docker compose up -d mongodb redis api-gateway

# Run frontend locally for fast hot-reload
npm run dev:frontend
```

### For Backend Service Development

```bash
# Start infrastructure with Docker
docker compose up -d mongodb redis

# Run API and your service locally
npm run dev:api
npm run dev:recipe  # or whichever service you're working on
```

### For Full Stack Development

```bash
# Option 1: Everything in Docker
npm run docker:up

# Option 2: Use the development script
.\scripts\dev-local.ps1  # Windows
./scripts/dev-local.sh   # Mac/Linux

# Option 3: VSCode workspace tasks
code MealPrep360.code-workspace
# Then: Ctrl/Cmd + Shift + P → "Tasks: Run Task"
```

### For Testing/Integration Work

```bash
# Full Docker stack for consistent environment
npm run docker:up
npm run test:all
```

## 📂 Workspace Structure

```
MealPrep360/
├── 📄 package.json                    # ✨ Root package with workspaces
├── 📄 MealPrep360.code-workspace      # ✨ VSCode workspace config
├── 📄 docker-compose.yml              # ✅ Updated (no version warning)
├── 📄 docker-compose.prod.yml         # ✅ Updated (no version warning)
├── 📄 WORKSPACE_SETUP.md              # ✨ Complete setup guide
├── 📄 QUICK_START_GUIDE.md            # ✨ Quick reference
├── 📄 README.md                       # ✅ Updated with workspace info
│
├── 📂 scripts/
│   ├── dev-local.ps1                  # ✨ Windows development script
│   └── dev-local.sh                   # ✨ Mac/Linux development script
│
├── 📂 MealPrep360/                    # Frontend workspace
├── 📂 MealPrep360-API/                # API Gateway workspace
├── 📂 MealPrep360-Admin/              # Admin Panel workspace
├── 📂 MealPrep360-RecipeService/      # Recipe Service workspace
├── 📂 MealPrep360-MealPlanService/    # Meal Plan Service workspace
├── 📂 MealPrep360-ShoppingListService/# Shopping Service workspace
├── 📂 MealPrep360-SocialMediaService/ # Social Service workspace
├── 📂 MealPrep360-BlogService/        # Blog Service workspace
└── 📂 MealPrep360-WebsocketServer/    # WebSocket Server workspace
```

## 🔑 Key Features

### 1. Unified Dependency Management
- One `npm install` for all services
- Shared dependencies hoisted to root
- Reduced disk space and installation time

### 2. Consistent Development Experience
- Same commands work across all services
- Integrated debugging in VSCode
- Unified linting and formatting

### 3. Flexible Development Options
- Full Docker for production-like testing
- Local services for fast development
- Mix of Docker (infrastructure) + local (services)

### 4. Developer-Friendly Tools
- Interactive scripts for Windows and Mac/Linux
- VSCode tasks for one-click operations
- Pre-configured debugging sessions

### 5. Comprehensive Documentation
- WORKSPACE_SETUP.md: Detailed guide with troubleshooting
- QUICK_START_GUIDE.md: Fast reference for daily use
- README.md: Updated with all options

## 📚 Next Steps

1. **Try it out:**
   ```bash
   # Quick test with Docker
   npm run docker:up
   
   # Or open VSCode workspace
   code MealPrep360.code-workspace
   ```

2. **Read the guides:**
   - [QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md) - Start here!
   - [WORKSPACE_SETUP.md](./WORKSPACE_SETUP.md) - Complete reference
   - [Documents/RUNNING.md](./Documents/RUNNING.md) - Service details

3. **Set up your environment:**
   - Copy `env.example` to `.env`
   - Add your API keys and credentials
   - Each service may need its own `.env` file

4. **Start developing:**
   - Choose your preferred workflow (Docker, local, or VSCode)
   - Start with the services you need
   - Use the debugging tools in VSCode

## 🆘 Getting Help

- **Quick issues**: Check [QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md) troubleshooting section
- **Detailed help**: See [WORKSPACE_SETUP.md](./WORKSPACE_SETUP.md) troubleshooting section
- **Architecture questions**: Read [Documents/ARCHITECTURE.md](./Documents/ARCHITECTURE.md)
- **Deployment**: See [Documents/DEPLOYMENT_GUIDE.md](./Documents/DEPLOYMENT_GUIDE.md)

## ✨ What's New Summary

| Feature | Status | Location |
|---------|--------|----------|
| npm Workspaces | ✅ Configured | `package.json` |
| Docker Compose Fix | ✅ Updated | `docker-compose.yml`, `docker-compose.prod.yml` |
| VSCode Workspace | ✅ Created | `MealPrep360.code-workspace` |
| Dev Scripts | ✅ Created | `scripts/dev-local.ps1`, `scripts/dev-local.sh` |
| Workspace Guide | ✅ Created | `WORKSPACE_SETUP.md` |
| Quick Start Guide | ✅ Created | `QUICK_START_GUIDE.md` |
| README Update | ✅ Updated | `README.md` |
| npm Scripts | ✅ Added | `package.json` - 20+ new scripts |

---

**🎉 Your workspace is ready! Happy coding!**

Start with: `npm run docker:up` or `code MealPrep360.code-workspace`


