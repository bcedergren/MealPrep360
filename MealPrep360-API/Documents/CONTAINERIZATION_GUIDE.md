# Containerization Guide for MealPrep360

## Overview
This guide provides comprehensive instructions for containerizing the entire MealPrep360 application using Docker and Docker Compose.

## 🐳 Why Containerize?

### Benefits
- **Consistency**: Same environment across development, staging, and production
- **Scalability**: Easy horizontal scaling with orchestration tools
- **Isolation**: Each service runs in its own container
- **Portability**: Deploy anywhere (Docker, Kubernetes, cloud providers)
- **Dependency Management**: All dependencies bundled in the container
- **Rollback**: Easy version management and rollbacks
- **Resource Management**: Better resource allocation and monitoring

### Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Containerized Architecture                │
├─────────────────────────────────────────────────────────────┤
│  Load Balancer (Nginx)                                      │
│  ├── SSL Termination                                        │
│  ├── Load Balancing                                         │
│  └── Reverse Proxy                                          │
├─────────────────────────────────────────────────────────────┤
│  Application Containers                                     │
│  ├── Frontend Container (Next.js)                          │
│  ├── Admin Container (Next.js)                             │
│  ├── API Gateway Container (Next.js)                       │
│  └── Microservice Containers (Node.js)                     │
│      ├── Recipe Service                                     │
│      ├── Meal Plan Service                                  │
│      ├── Shopping Service                                   │
│      ├── Social Service                                     │
│      ├── Blog Service                                       │
│      └── WebSocket Server                                   │
├─────────────────────────────────────────────────────────────┤
│  Data Containers                                            │
│  ├── MongoDB Container                                      │
│  └── Redis Container                                        │
├─────────────────────────────────────────────────────────────┤
│  Monitoring Containers                                      │
│  ├── Prometheus (Metrics)                                  │
│  ├── Grafana (Visualization)                               │
│  └── ELK Stack (Logging)                                   │
└─────────────────────────────────────────────────────────────┘
```

## 🏗️ Docker Configuration

### Multi-Stage Builds
All Dockerfiles use multi-stage builds for optimization:

1. **Base Stage**: Node.js 18 Alpine image
2. **Dependencies Stage**: Install production dependencies only
3. **Builder Stage**: Build the application
4. **Runner Stage**: Minimal production image with built application

### Security Features
- **Non-root User**: All containers run as non-root user (`nextjs`)
- **Minimal Base Image**: Alpine Linux for smaller attack surface
- **Health Checks**: Built-in health monitoring
- **Resource Limits**: CPU and memory constraints
- **Network Isolation**: Custom Docker networks

## 📦 Container Images

### Image Naming Convention
```
mealprep360/{service-name}:{tag}
```

### Available Images
- `mealprep360/frontend:latest`
- `mealprep360/admin:latest`
- `mealprep360/api-gateway:latest`
- `mealprep360/recipe-service:latest`
- `mealprep360/mealplan-service:latest`
- `mealprep360/shopping-service:latest`
- `mealprep360/social-service:latest`
- `mealprep360/blog-service:latest`
- `mealprep360/websocket-server:latest`

## 🚀 Quick Start

### Prerequisites
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### Development Deployment
```bash
# Clone repository
git clone https://github.com/your-org/mealprep360.git
cd mealprep360

# Create environment file
cp .env.example .env.production

# Edit environment variables
nano .env.production

# Deploy for development
./scripts/docker-deploy.sh development

# Check status
docker-compose ps
```

### Production Deployment
```bash
# Deploy for production
./scripts/docker-deploy.sh production

# Check health
./scripts/health-check-prod.sh
```

## 🔧 Build Commands

### Build All Images
```bash
# Build all images locally
./scripts/docker-build-all.sh

# Build and push to registry
./scripts/docker-build-all.sh --push
```

### Build Individual Services
```bash
# Build specific service
docker build -t mealprep360/frontend:latest ./MealPrep360

# Build with custom tag
docker build -t mealprep360/api-gateway:v1.0.0 ./MealPrep360-API
```

## 📊 Monitoring & Observability

### Built-in Monitoring
- **Health Checks**: All services have health check endpoints
- **Prometheus**: Metrics collection and storage
- **Grafana**: Metrics visualization and dashboards
- **ELK Stack**: Centralized logging (Elasticsearch, Logstash, Kibana)

### Access URLs
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)
- **Kibana**: http://localhost:5601

## 🔄 Scaling

### Horizontal Scaling
```bash
# Scale specific service
docker-compose up --scale recipe-service=3

# Scale multiple services
docker-compose up --scale frontend=2 --scale api-gateway=3
```

### Resource Management
```yaml
# docker-compose.prod.yml
services:
  api-gateway:
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
        reservations:
          memory: 512M
          cpus: '0.5'
```

## 🛠️ Development Workflow

### Local Development
```bash
# Start development environment
docker-compose up -d

# View logs
docker-compose logs -f api-gateway

# Execute commands in container
docker-compose exec api-gateway npm run test

# Rebuild specific service
docker-compose up --build api-gateway
```

### Debugging
```bash
# Access container shell
docker-compose exec api-gateway sh

# View container logs
docker-compose logs --tail=100 api-gateway

# Check container status
docker-compose ps
```

## 🔐 Security Best Practices

### Container Security
- **Non-root User**: All containers run as non-root
- **Minimal Images**: Alpine Linux base images
- **Security Scanning**: Regular vulnerability scans
- **Secrets Management**: Environment variables for sensitive data
- **Network Isolation**: Custom Docker networks

### Image Security
```bash
# Scan images for vulnerabilities
docker scan mealprep360/api-gateway:latest

# Use specific image tags (not latest)
docker run mealprep360/api-gateway:v1.0.0
```

## 📈 Performance Optimization

### Image Optimization
- **Multi-stage Builds**: Reduce final image size
- **Layer Caching**: Optimize build times
- **Alpine Linux**: Smaller base images
- **Production Dependencies**: Only install necessary packages

### Runtime Optimization
- **Resource Limits**: Prevent resource exhaustion
- **Health Checks**: Quick failure detection
- **Graceful Shutdown**: Proper container lifecycle management

## 🚨 Troubleshooting

### Common Issues

#### Container Won't Start
```bash
# Check logs
docker-compose logs service-name

# Check container status
docker-compose ps

# Restart service
docker-compose restart service-name
```

#### Health Check Failures
```bash
# Check health endpoint manually
curl http://localhost:3001/api/health

# Check container logs
docker-compose logs api-gateway
```

#### Memory Issues
```bash
# Check resource usage
docker stats

# Increase memory limits
# Edit docker-compose.yml
```

### Debug Commands
```bash
# List all containers
docker ps -a

# List all images
docker images

# Remove unused containers
docker container prune

# Remove unused images
docker image prune

# View system info
docker system info
```

## 🔄 CI/CD Integration

### GitHub Actions
```yaml
# .github/workflows/docker-build.yml
name: Docker Build and Push

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build Docker images
        run: ./scripts/docker-build-all.sh
      - name: Push to registry
        run: ./scripts/docker-build-all.sh --push
```

### Automated Deployment
```bash
# Deploy with CI/CD
docker-compose -f docker-compose.prod.yml up -d

# Zero-downtime deployment
docker-compose -f docker-compose.prod.yml up -d --no-deps api-gateway
```

## 📚 Additional Resources

### Documentation
- [Docker Official Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Documentation](https://nextjs.org/docs/deployment#docker-image)

### Tools
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Portainer](https://www.portainer.io/) - Docker management UI
- [Docker Scout](https://docs.docker.com/scout/) - Security scanning

### Best Practices
- [Dockerfile Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Container Security Best Practices](https://docs.docker.com/engine/security/)
- [Production Deployment Guide](https://docs.docker.com/compose/production/)

This containerization guide ensures MealPrep360 is properly containerized with best practices for development, testing, and production deployment.
