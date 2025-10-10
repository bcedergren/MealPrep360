# Deployment Guide for MealPrep360

This guide covers the deployment process for the MealPrep360 application across different environments.

## 🏗️ Architecture Overview

MealPrep360 is deployed as a containerized microservices application with the following components:

### Services
- **Frontend** - Next.js application (Port 3000)
- **Admin Panel** - Administrative interface (Port 3008)
- **API Gateway** - Central API routing (Port 3001)
- **Recipe Service** - AI-powered recipe generation (Port 3002)
- **Meal Plan Service** - Meal planning logic (Port 3003)
- **Shopping Service** - Shopping list management (Port 3004)
- **Social Service** - Social features (Port 3005)
- **Blog Service** - Content management (Port 3006)
- **WebSocket Server** - Real-time communication (Port 3007)

### Infrastructure
- **MongoDB** - Primary database
- **Redis** - Caching and sessions
- **Nginx** - Load balancer and reverse proxy
- **Prometheus** - Metrics collection
- **Grafana** - Metrics visualization
- **ELK Stack** - Centralized logging

## 🚀 Deployment Methods

### 1. Docker Compose (Development)

#### Prerequisites
- Docker and Docker Compose
- Environment variables configured
- Sufficient system resources (8GB RAM recommended)

#### Setup
```bash
# Clone the repository
git clone <repository-url>
cd MealPrep360

# Copy environment template
cp env.example .env.production

# Edit environment variables
nano .env.production

# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

#### Access Points
- **Frontend**: http://localhost:3000
- **Admin Panel**: http://localhost:3008
- **API Gateway**: http://localhost:3001
- **Monitoring**: http://localhost:9090 (Prometheus)

### 2. Kubernetes (Production)

#### Prerequisites
- Kubernetes cluster (1.21+)
- kubectl configured
- Helm (optional, for package management)
- Sufficient cluster resources

#### Setup

##### 1. Create Namespace
```bash
kubectl apply -f k8s/namespace.yaml
```

##### 2. Deploy Services
```bash
# Deploy all services
kubectl apply -f k8s/ -n mealprep360

# Or deploy individually
kubectl apply -f k8s/frontend-deployment.yaml -n mealprep360
kubectl apply -f k8s/api-gateway-deployment.yaml -n mealprep360
# ... other services
```

##### 3. Configure Ingress
```bash
kubectl apply -f k8s/ingress.yaml -n mealprep360
```

##### 4. Verify Deployment
```bash
# Check pod status
kubectl get pods -n mealprep360

# Check services
kubectl get services -n mealprep360

# Check ingress
kubectl get ingress -n mealprep360
```

#### Production URLs
- **Frontend**: https://mealprep360.com
- **Admin Panel**: https://admin.mealprep360.com
- **API Gateway**: https://api.mealprep360.com

## 🔧 Environment Configuration

### Environment Variables

#### Required Variables
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/mealprep360_prod
REDIS_URL=redis://localhost:6379

# Authentication
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# AI Services
OPENAI_API_KEY=your_openai_api_key

# Payments
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

#### Service-Specific Variables
```bash
# Internal API Keys
RECIPE_SERVICE_API_KEY=your_recipe_service_key
MEALPLAN_SERVICE_API_KEY=your_mealplan_service_key
SHOPPING_SERVICE_API_KEY=your_shopping_service_key
SOCIAL_SERVICE_API_KEY=your_social_service_key
BLOG_SERVICE_API_KEY=your_blog_service_key
WEBSOCKET_SERVICE_API_KEY=your_websocket_service_key
```

### Configuration Files

#### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build:
      context: ./services/frontend
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=http://api-gateway:3001
    depends_on:
      - api-gateway
```

#### Kubernetes
```yaml
# k8s/frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: frontend
  template:
    spec:
      containers:
      - name: frontend
        image: ghcr.io/username/mealprep360/frontend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
```

## 📊 Monitoring and Observability

### Health Checks

#### Service Health Endpoints
```bash
# API Gateway
curl https://api.mealprep360.com/api/health

# Recipe Service
curl https://api.mealprep360.com/api/recipes/health

# Meal Plan Service
curl https://api.mealprep360.com/api/meal-plans/health

# Shopping Service
curl https://api.mealprep360.com/api/shopping-lists/health
```

#### Kubernetes Health Checks
```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

### Metrics and Logging

#### Prometheus Metrics
- **Application Metrics**: Custom business metrics
- **System Metrics**: CPU, memory, disk usage
- **Service Metrics**: Request rates, response times, error rates

#### Grafana Dashboards
- **Application Overview**: Key performance indicators
- **Service Health**: Individual service status
- **Infrastructure**: System resource usage
- **Business Metrics**: User activity, feature usage

#### ELK Stack Logging
- **Centralized Logs**: All service logs in one place
- **Log Analysis**: Search and analyze logs
- **Alerting**: Automated alerts for errors and issues

## 🔄 Deployment Strategies

### 1. Rolling Deployment
```bash
# Update deployment
kubectl set image deployment/frontend frontend=ghcr.io/username/mealprep360/frontend:v1.1.0 -n mealprep360

# Monitor rollout
kubectl rollout status deployment/frontend -n mealprep360

# Rollback if needed
kubectl rollout undo deployment/frontend -n mealprep360
```

### 2. Blue-Green Deployment
```bash
# Deploy new version to green environment
kubectl apply -f k8s/frontend-green.yaml -n mealprep360

# Switch traffic to green
kubectl patch service frontend -n mealprep360 -p '{"spec":{"selector":{"version":"green"}}}'

# Clean up blue environment
kubectl delete deployment frontend-blue -n mealprep360
```

### 3. Canary Deployment
```bash
# Deploy canary version
kubectl apply -f k8s/frontend-canary.yaml -n mealprep360

# Gradually increase traffic
kubectl patch service frontend -n mealprep360 -p '{"spec":{"selector":{"version":"canary"}}}'
```

## 🚨 Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check pod status
kubectl get pods -n mealprep360

# View pod logs
kubectl logs -f deployment/frontend -n mealprep360

# Check events
kubectl get events -n mealprep360 --sort-by='.lastTimestamp'
```

#### Database Connection Issues
```bash
# Check MongoDB connection
kubectl exec -it deployment/mongodb -n mealprep360 -- mongosh --eval "db.adminCommand('ping')"

# Check Redis connection
kubectl exec -it deployment/redis -n mealprep360 -- redis-cli ping
```

#### Performance Issues
```bash
# Check resource usage
kubectl top pods -n mealprep360

# Check service endpoints
kubectl get endpoints -n mealprep360

# Check ingress status
kubectl describe ingress mealprep360-ingress -n mealprep360
```

### Debug Commands

#### Docker Compose
```bash
# View service logs
docker-compose logs -f frontend

# Execute commands in container
docker-compose exec frontend sh

# Restart specific service
docker-compose restart frontend

# Check resource usage
docker stats
```

#### Kubernetes
```bash
# Port forward for local access
kubectl port-forward svc/frontend 3000:3000 -n mealprep360

# Execute commands in pod
kubectl exec -it deployment/frontend -n mealprep360 -- sh

# Scale deployment
kubectl scale deployment frontend --replicas=3 -n mealprep360

# Update deployment
kubectl patch deployment frontend -n mealprep360 -p '{"spec":{"template":{"metadata":{"annotations":{"kubectl.kubernetes.io/restartedAt":"'$(date +%Y-%m-%dT%H:%M:%S%z)'"}}}}}'
```

## 🔒 Security Considerations

### Network Security
- **TLS/SSL**: All external communications encrypted
- **Network Policies**: Kubernetes network segmentation
- **Firewall Rules**: Restrict access to necessary ports only

### Container Security
- **Base Images**: Use official, minimal base images
- **Vulnerability Scanning**: Regular security scans
- **Non-root Users**: Run containers as non-root users

### Secrets Management
- **Environment Variables**: Use Kubernetes secrets
- **External Secrets**: Integrate with external secret management
- **Rotation**: Regular secret rotation

## 📈 Scaling

### Horizontal Scaling
```bash
# Scale frontend service
kubectl scale deployment frontend --replicas=5 -n mealprep360

# Scale API gateway
kubectl scale deployment api-gateway --replicas=3 -n mealprep360
```

### Vertical Scaling
```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

### Auto-scaling
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: frontend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: frontend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## 🔄 Backup and Recovery

### Database Backup
```bash
# MongoDB backup
kubectl exec -it deployment/mongodb -n mealprep360 -- mongodump --out /backup/$(date +%Y%m%d)

# Redis backup
kubectl exec -it deployment/redis -n mealprep360 -- redis-cli BGSAVE
```

### Configuration Backup
```bash
# Backup Kubernetes manifests
kubectl get all -n mealprep360 -o yaml > backup-$(date +%Y%m%d).yaml

# Backup secrets
kubectl get secrets -n mealprep360 -o yaml > secrets-backup-$(date +%Y%m%d).yaml
```

## 📚 Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Redis Documentation](https://redis.io/documentation)

---

For deployment issues or questions, please refer to the troubleshooting section or contact the development team.
