# MealPrep360 - Quick Docker Reference

## 🚀 Quick Start

### Local Development (Fastest)

```bash
# Option 1: Use convenience script
chmod +x scripts/start-local.sh scripts/stop-local.sh
./scripts/start-local.sh dev

# Option 2: Direct command
docker-compose -f docker-compose.dev.yml up -d
```

### Production Mode (Local)

```bash
docker-compose up -d
```

### Stop All Services

```bash
# Option 1: Use script
./scripts/stop-local.sh

# Option 2: Direct command
docker-compose down
```

## 📋 Essential Commands

### Service Management

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart a specific service
docker-compose restart api-gateway

# View running services
docker-compose ps
```

### Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100 api-gateway
```

### Building

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build frontend

# Rebuild without cache
docker-compose build --no-cache
```

### Database

```bash
# Access MongoDB shell
docker-compose exec mongodb mongosh -u admin -p yourPassword

# Backup MongoDB
docker-compose exec mongodb mongodump --out /backup

# Access Redis CLI
docker-compose exec redis redis-cli
```

## 🔧 Troubleshooting

### Service won't start

```bash
# Check logs
docker-compose logs <service-name>

# Restart service
docker-compose restart <service-name>

# Rebuild and restart
docker-compose up -d --build <service-name>
```

### Port already in use

```bash
# Find process using port (Linux/Mac)
lsof -i :3000

# Find process using port (Windows PowerShell)
Get-NetTCPConnection -LocalPort 3000

# Kill process
kill -9 <PID>
```

### Reset everything

```bash
# Stop and remove all containers, networks, volumes
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Start fresh
docker-compose up -d
```

## 🌐 Service URLs

| Service | Local URL | Port |
|---------|-----------|------|
| Frontend | http://localhost:3000 | 3000 |
| Admin | http://localhost:3008 | 3008 |
| API Gateway | http://localhost:3001 | 3001 |
| Recipe Service | http://localhost:3002 | 3002 |
| Meal Plan Service | http://localhost:3003 | 3003 |
| Shopping Service | http://localhost:3004 | 3004 |
| Social Service | http://localhost:3005 | 3005 |
| Blog Service | http://localhost:3006 | 3006 |
| WebSocket | ws://localhost:3007 | 3007 |
| MongoDB | mongodb://localhost:27017 | 27017 |
| Redis | redis://localhost:6379 | 6379 |

## 🔐 Environment Variables

Required in `.env`:

```env
# Database
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=<your-password>

# Service API Keys
RECIPE_SERVICE_API_KEY=<random-key>
MEALPLAN_SERVICE_API_KEY=<random-key>
SHOPPING_SERVICE_API_KEY=<random-key>
SOCIAL_SERVICE_API_KEY=<random-key>
BLOG_SERVICE_API_KEY=<random-key>
WEBSOCKET_SERVICE_API_KEY=<random-key>

# Authentication
CLERK_SECRET_KEY=<clerk-secret>
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<clerk-public>

# Security
JWT_SECRET=<random-secret>
```

Generate random keys:

```bash
# Linux/Mac
openssl rand -hex 32

# Windows PowerShell
-join ((48..57) + (97..102) | Get-Random -Count 32 | % {[char]$_})
```

## ☁️ AWS Deployment

### Quick Deploy

```bash
# 1. Setup infrastructure
chmod +x aws/scripts/*.sh
./aws/scripts/setup-infrastructure.sh

# 2. Create secrets
./aws/scripts/create-secrets.sh

# 3. Deploy application
export AWS_ACCOUNT_ID=<your-account-id>
export AWS_REGION=us-east-1
./aws/scripts/deploy-to-aws.sh
```

### Update Deployment

```bash
# Rebuild and push images
./aws/scripts/deploy-to-aws.sh

# Force ECS to use new images
aws ecs update-service \
  --cluster mealprep360-cluster \
  --service <service-name> \
  --force-new-deployment
```

## 📊 Monitoring

### Docker Stats

```bash
# Real-time resource usage
docker stats

# Specific containers
docker stats frontend api-gateway
```

### Health Checks

```bash
# Check service health
curl http://localhost:3001/api/health

# Check all services
for port in 3000 3001 3002 3003 3004 3005 3006; do
  curl -s http://localhost:$port/health || echo "Port $port: Down"
done
```

### AWS Monitoring

```bash
# View CloudWatch logs
aws logs tail /ecs/mealprep360/frontend --follow

# Check ECS service status
aws ecs describe-services \
  --cluster mealprep360-cluster \
  --services frontend
```

## 🛠️ Common Tasks

### Update a Service

```bash
# 1. Make code changes
# 2. Rebuild service
docker-compose build <service-name>

# 3. Restart service
docker-compose up -d <service-name>
```

### Add New Service

1. Create Dockerfile in service directory
2. Add to `docker-compose.yml`
3. Update nginx config if needed
4. Rebuild and start

### Scale Services

```bash
# Run multiple instances
docker-compose up -d --scale frontend=3 --scale api-gateway=2
```

### Clean Up

```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Clean everything
docker system prune -a
```

## 🔗 Related Documentation

- [Full Deployment Guide](DOCKER_DEPLOYMENT_GUIDE.md)
- [AWS Deployment Details](Documents/AWS_DEPLOYMENT.md)
- [Architecture Overview](Documents/ARCHITECTURE.md)

## ⚡ Pro Tips

1. **Use development compose for hot-reload**: `docker-compose -f docker-compose.dev.yml up`
2. **Keep images small**: Use `.dockerignore` files (already configured)
3. **Monitor resource usage**: `docker stats` shows real-time metrics
4. **Tag images with versions**: Never use just `latest` in production
5. **Regular backups**: Schedule MongoDB backups regularly
6. **Security**: Never commit `.env` files
7. **Logs**: Rotate logs to prevent disk space issues

## 📞 Support

For issues:
1. Check logs: `docker-compose logs -f <service>`
2. Review [Troubleshooting Guide](DOCKER_DEPLOYMENT_GUIDE.md#troubleshooting)
3. Verify environment variables in `.env`
4. Check service health endpoints

