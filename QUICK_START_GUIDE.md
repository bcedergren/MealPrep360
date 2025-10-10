# 🚀 MealPrep360 Quick Start Guide

One-page guide to get started quickly with MealPrep360 workspace.

## ⚡ Quick Commands

### Get Everything Running (Docker)
```bash
docker compose up -d
```
Access at: http://localhost:3000

### Get Everything Running (Local Development)
```powershell
# Windows
.\scripts\dev-local.ps1

# Mac/Linux  
./scripts/dev-local.sh
```

### Open in VSCode
```bash
code MealPrep360.code-workspace
```

## 📦 Installation

```bash
# One command to install all services
npm install
```

## 🎯 Common Tasks

### Start Individual Services

```bash
npm run dev:frontend      # Main app (port 3000)
npm run dev:api          # API Gateway (port 3001)
npm run dev:admin        # Admin panel (port 3008)
npm run dev:recipe       # Recipe service (port 3002)
npm run dev:mealplan     # Meal plan service (port 3003)
npm run dev:shopping     # Shopping service (port 3004)
```

### Build All Services

```bash
npm run build:all
```

### Test All Services

```bash
npm run test:all
```

### Docker Commands

```bash
npm run docker:up        # Start all services
npm run docker:down      # Stop all services
npm run docker:logs      # View all logs
npm run docker:rebuild   # Rebuild and restart
```

## 🌐 Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | Main user app |
| Admin | http://localhost:3008 | Admin panel |
| API Gateway | http://localhost:3001 | API endpoint |
| API Health | http://localhost:3001/api/health | Health check |

## 🔧 Typical Development Workflows

### Working on Frontend Only

```bash
# Option 1: Use Docker for everything
docker compose up -d

# Option 2: Docker for backend, local for frontend
docker compose up -d mongodb redis api-gateway
npm run dev:frontend
```

### Working on a Backend Service

```bash
# Start infrastructure
docker compose up -d mongodb redis

# Start API Gateway
npm run dev:api

# Start your service (e.g., Recipe)
npm run dev:recipe
```

### Full Local Development

```bash
# Terminal 1: Infrastructure
docker compose up -d mongodb redis

# Terminal 2: API Gateway
npm run dev:api

# Terminal 3: Frontend
npm run dev:frontend

# Terminal 4+: Other services as needed
npm run dev:recipe
```

### Using VSCode

1. Open workspace: `code MealPrep360.code-workspace`
2. Press `Ctrl/Cmd + Shift + P`
3. Type "Tasks: Run Task"
4. Select "Start All Services (Docker)"

## 🐛 Quick Debugging

### Check if Docker is Running

```bash
docker ps
```

### Check Service Health

```bash
# API Gateway
curl http://localhost:3001/api/health

# Recipe Service
curl http://localhost:3002/health
```

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f api-gateway
```

### Restart a Service

```bash
docker compose restart api-gateway
```

## 🔑 Environment Setup

1. Copy example env file:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` with your keys:
   - MongoDB credentials
   - Clerk authentication keys
   - OpenAI API key
   - Service API keys

3. Each service may need its own `.env` file in its directory

## 📁 Project Structure

```
MealPrep360/
├── MealPrep360/                    # Frontend (Next.js)
├── MealPrep360-API/                # API Gateway
├── MealPrep360-Admin/              # Admin Panel
├── MealPrep360-RecipeService/      # Recipe Service
├── MealPrep360-MealPlanService/    # Meal Plan Service
├── MealPrep360-ShoppingListService/# Shopping Service
├── MealPrep360-SocialMediaService/ # Social Service
├── MealPrep360-BlogService/        # Blog Service
├── MealPrep360-WebsocketServer/    # WebSocket Server
├── docker-compose.yml              # Docker config
├── package.json                    # Root package (workspaces)
└── MealPrep360.code-workspace      # VSCode workspace
```

## 🆘 Troubleshooting

### Docker not starting?
- Ensure Docker Desktop is running
- Try: `docker compose down && docker compose up -d`

### Port already in use?
```powershell
# Windows - Find process using port 3000
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <PID> /F
```

### npm install failing?
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Service can't connect to database?
```bash
# Check if MongoDB is running
docker compose ps mongodb

# View MongoDB logs
docker compose logs mongodb
```

## 📚 Next Steps

- Read the full [Workspace Setup Guide](./WORKSPACE_SETUP.md)
- Check [Architecture Documentation](./Documents/ARCHITECTURE.md)
- Review [Developer Guide](./Documents/DEVELOPER_GUIDE.md)
- See [API Documentation](http://localhost:3001/api/docs) (when running)

## 💡 Pro Tips

1. **Use the VSCode workspace** for the best development experience
2. **Run only what you need** - don't start all services if you're only working on one
3. **Use Docker for infrastructure** (MongoDB, Redis) even when developing locally
4. **Keep Docker Desktop running** in the background for quick starts
5. **Check logs often** when debugging - they're your best friend

---

**Need Help?** Check the [full documentation](./WORKSPACE_SETUP.md) or create an issue on GitHub.


