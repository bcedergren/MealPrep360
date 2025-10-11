# AWS Deployment Plan for Python Microservices

**Date:** October 11, 2025  
**Services:** 6 Python microservices ready for AWS ECS  
**Status:** Production-Ready

---

## 🎯 Deployment Strategy

### Phase 1: Infrastructure Setup (30 minutes)
1. ECR repositories for Python images
2. ECS task definitions
3. ECS services
4. Load balancer rules
5. CloudWatch logging

### Phase 2: Service Deployment (1 hour)
1. Push Docker images to ECR
2. Deploy services to ECS
3. Configure auto-scaling
4. Set up health checks

### Phase 3: Integration (30 minutes)
1. Update TypeScript services to use Python endpoints
2. Test end-to-end flows
3. Monitor performance

---

## 📋 Prerequisites

✅ AWS Account (588443559352)  
✅ AWS CLI configured  
✅ Docker images built locally  
✅ VPC and subnets (mealprep360-vpc)  
✅ ECS cluster (mealprep360-cluster)  

---

## 🐳 ECR Repository Setup

### Create Repositories for Each Service

```bash
# Set region
$REGION = "us-east-1"
$ACCOUNT_ID = "588443559352"

# Create ECR repositories
$services = @(
    "ai-service",
    "analytics-service",
    "image-service",
    "nutrition-service",
    "report-service",
    "worker-service"
)

foreach ($service in $services) {
    Write-Host "Creating ECR repository for $service..."
    aws ecr create-repository `
        --repository-name "mealprep360/$service" `
        --region $REGION `
        --tags Key=Project,Value=MealPrep360 Key=Type,Value=Python
}
```

---

## 📤 Push Images to ECR

### Build and Push Script

```powershell
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 588443559352.dkr.ecr.us-east-1.amazonaws.com

# Tag and push each service
$services = @(
    @{Name="ai-service"; LocalImage="mealprep360-ai-service"},
    @{Name="analytics-service"; LocalImage="mealprep360-analytics-service"},
    @{Name="image-service"; LocalImage="mealprep360-image-service"},
    @{Name="nutrition-service"; LocalImage="mealprep360-nutrition-service"},
    @{Name="report-service"; LocalImage="mealprep360-report-service"},
    @{Name="worker-service"; LocalImage="mealprep360-worker-service"}
)

foreach ($svc in $services) {
    Write-Host "Pushing $($svc.Name)..."
    
    # Tag
    docker tag "$($svc.LocalImage):latest" "588443559352.dkr.ecr.us-east-1.amazonaws.com/mealprep360/$($svc.Name):latest"
    
    # Push
    docker push "588443559352.dkr.ecr.us-east-1.amazonaws.com/mealprep360/$($svc.Name):latest"
}
```

---

## 📝 ECS Task Definitions

### 1. AI Service Task Definition

```json
{
  "family": "mealprep360-ai-service",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::588443559352:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "ai-service",
      "image": "588443559352.dkr.ecr.us-east-1.amazonaws.com/mealprep360/ai-service:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "ENVIRONMENT",
          "value": "production"
        },
        {
          "name": "REDIS_HOST",
          "value": "mealprep360-redis.abc123.ng.0001.use1.cache.amazonaws.com"
        }
      ],
      "secrets": [
        {
          "name": "OPENAI_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:588443559352:secret:mealprep360/openai-api-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/mealprep360-ai-service",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    }
  ]
}
```

### 2. Analytics Service Task Definition

```json
{
  "family": "mealprep360-analytics-service",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::588443559352:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "analytics-service",
      "image": "588443559352.dkr.ecr.us-east-1.amazonaws.com/mealprep360/analytics-service:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 8001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "ENVIRONMENT",
          "value": "production"
        },
        {
          "name": "REDIS_HOST",
          "value": "mealprep360-redis.abc123.ng.0001.use1.cache.amazonaws.com"
        }
      ],
      "secrets": [
        {
          "name": "MONGODB_URI",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:588443559352:secret:mealprep360/mongodb-uri"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/mealprep360-analytics-service",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### 3. Worker Service Task Definition

```json
{
  "family": "mealprep360-worker-service",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::588443559352:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "worker-service",
      "image": "588443559352.dkr.ecr.us-east-1.amazonaws.com/mealprep360/worker-service:latest",
      "essential": true,
      "environment": [
        {
          "name": "REDIS_HOST",
          "value": "mealprep360-redis.abc123.ng.0001.use1.cache.amazonaws.com"
        }
      ],
      "secrets": [
        {
          "name": "MONGODB_URI",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:588443559352:secret:mealprep360/mongodb-uri"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/mealprep360-worker-service",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

---

## 🚀 Quick Deploy Script

```powershell
# Complete deployment script
.\scripts\deploy-python-services-to-aws.ps1
```

### Create Deployment Script

```powershell
# scripts/deploy-python-services-to-aws.ps1

param(
    [string]$Region = "us-east-1",
    [string]$ClusterName = "mealprep360-cluster"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deploying Python Services to AWS ECS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Create ECR repositories
Write-Host "Step 1: Creating ECR repositories..." -ForegroundColor Yellow
$services = @("ai-service", "analytics-service", "image-service", "nutrition-service", "report-service", "worker-service")

foreach ($service in $services) {
    aws ecr create-repository `
        --repository-name "mealprep360/$service" `
        --region $Region `
        --tags Key=Project,Value=MealPrep360 `
        2>&1 | Out-Null
}

# 2. Login to ECR
Write-Host "Step 2: Logging in to ECR..." -ForegroundColor Yellow
aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin "588443559352.dkr.ecr.$Region.amazonaws.com"

# 3. Tag and push images
Write-Host "Step 3: Pushing images to ECR..." -ForegroundColor Yellow
$serviceImages = @(
    @{Name="ai-service"; LocalImage="mealprep360-ai-service"},
    @{Name="analytics-service"; LocalImage="mealprep360-analytics-service"},
    @{Name="image-service"; LocalImage="mealprep360-image-service"},
    @{Name="nutrition-service"; LocalImage="mealprep360-nutrition-service"},
    @{Name="report-service"; LocalImage="mealprep360-report-service"},
    @{Name="worker-service"; LocalImage="mealprep360-worker-service"}
)

foreach ($svc in $serviceImages) {
    Write-Host "  Pushing $($svc.Name)..."
    docker tag "$($svc.LocalImage):latest" "588443559352.dkr.ecr.$Region.amazonaws.com/mealprep360/$($svc.Name):latest"
    docker push "588443559352.dkr.ecr.$Region.amazonaws.com/mealprep360/$($svc.Name):latest"
}

# 4. Register task definitions
Write-Host "Step 4: Registering task definitions..." -ForegroundColor Yellow
foreach ($service in $services) {
    $taskDefFile = "aws/ecs/python-services/$service-task-definition.json"
    if (Test-Path $taskDefFile) {
        aws ecs register-task-definition --cli-input-json file://$taskDefFile --region $Region
    }
}

# 5. Create/Update services
Write-Host "Step 5: Creating/Updating ECS services..." -ForegroundColor Yellow
# Services with load balancers (web-facing)
$webServices = @("ai-service", "analytics-service", "image-service", "nutrition-service", "report-service")

foreach ($service in $webServices) {
    Write-Host "  Deploying $service..."
    
    aws ecs create-service `
        --cluster $ClusterName `
        --service-name "mealprep360-$service" `
        --task-definition "mealprep360-$service" `
        --desired-count 1 `
        --launch-type FARGATE `
        --network-configuration "awsvpcConfiguration={subnets=[subnet-0ae0a250bc8c8b432,subnet-076d8d7e0be353dee],securityGroups=[sg-XXXXXX],assignPublicIp=ENABLED}" `
        --region $Region `
        2>&1 | Out-Null
}

# Worker service (no load balancer)
Write-Host "  Deploying worker-service..."
aws ecs create-service `
    --cluster $ClusterName `
    --service-name "mealprep360-worker-service" `
    --task-definition "mealprep360-worker-service" `
    --desired-count 1 `
    --launch-type FARGATE `
    --network-configuration "awsvpcConfiguration={subnets=[subnet-0ae0a250bc8c8b432],securityGroups=[sg-XXXXXX],assignPublicIp=ENABLED}" `
    --region $Region

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Services deployed:" -ForegroundColor Cyan
foreach ($service in $services) {
    Write-Host "  ✓ $service" -ForegroundColor Green
}
```

---

## 🔐 Secrets Management

### Store API Keys in AWS Secrets Manager

```bash
# OpenAI API Key
aws secretsmanager create-secret `
    --name mealprep360/openai-api-key `
    --description "OpenAI API key for AI service" `
    --secret-string "sk-proj-..."

# MongoDB URI
aws secretsmanager create-secret `
    --name mealprep360/mongodb-uri `
    --description "MongoDB connection string" `
    --secret-string "mongodb://..."

# USDA API Key (for Nutrition Service)
aws secretsmanager create-secret `
    --name mealprep360/usda-api-key `
    --description "USDA FoodData Central API key" `
    --secret-string "YOUR_USDA_KEY"
```

---

## 📊 CloudWatch Logging

### Create Log Groups

```bash
$services = @("ai-service", "analytics-service", "image-service", "nutrition-service", "report-service", "worker-service")

foreach ($service in $services) {
    aws logs create-log-group `
        --log-group-name "/ecs/mealprep360-$service" `
        --region us-east-1
    
    # Set retention to 7 days
    aws logs put-retention-policy `
        --log-group-name "/ecs/mealprep360-$service" `
        --retention-in-days 7 `
        --region us-east-1
}
```

---

## 🔄 Auto-Scaling Configuration

### Enable Auto-Scaling for Each Service

```bash
# Register scalable target
aws application-autoscaling register-scalable-target `
    --service-namespace ecs `
    --resource-id service/mealprep360-cluster/mealprep360-ai-service `
    --scalable-dimension ecs:service:DesiredCount `
    --min-capacity 1 `
    --max-capacity 5

# Create scaling policy (CPU-based)
aws application-autoscaling put-scaling-policy `
    --service-namespace ecs `
    --resource-id service/mealprep360-cluster/mealprep360-ai-service `
    --scalable-dimension ecs:service:DesiredCount `
    --policy-name cpu-scaling-policy `
    --policy-type TargetTrackingScaling `
    --target-tracking-scaling-policy-configuration '{
        "TargetValue": 70.0,
        "PredefinedMetricSpecification": {
            "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
        },
        "ScaleInCooldown": 300,
        "ScaleOutCooldown": 60
    }'
```

---

## 🌐 Load Balancer Rules

### Add Target Groups and Rules

```bash
# Create target group for AI Service
aws elbv2 create-target-group `
    --name mealprep360-ai-service `
    --protocol HTTP `
    --port 8000 `
    --vpc-id vpc-0920898c0a4c35b63 `
    --target-type ip `
    --health-check-path /health `
    --health-check-interval-seconds 30

# Create listener rule
aws elbv2 create-rule `
    --listener-arn arn:aws:elasticloadbalancing:us-east-1:588443559352:listener/... `
    --priority 10 `
    --conditions Field=path-pattern,Values='/api/ai/*' `
    --actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:588443559352:targetgroup/mealprep360-ai-service/...
```

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] All Docker images built locally
- [ ] Services tested locally
- [ ] Secrets created in AWS Secrets Manager
- [ ] VPC and subnets configured
- [ ] ECS cluster exists
- [ ] Security groups configured

### Deployment
- [ ] ECR repositories created
- [ ] Images pushed to ECR
- [ ] Task definitions registered
- [ ] CloudWatch log groups created
- [ ] ECS services created
- [ ] Load balancer rules configured
- [ ] Auto-scaling policies set

### Post-Deployment
- [ ] Health checks passing
- [ ] Services accessible via load balancer
- [ ] CloudWatch logs streaming
- [ ] Metrics being collected
- [ ] Cost tracking enabled

---

## 💰 Cost Estimate

### Monthly Costs (1 task per service)

| Service | vCPU | Memory | Cost/Month |
|---------|------|---------|------------|
| AI Service | 0.5 | 1GB | ~$15 |
| Analytics | 0.5 | 2GB | ~$25 |
| Image | 0.5 | 1GB | ~$15 |
| Nutrition | 0.5 | 1GB | ~$15 |
| Report | 0.5 | 1GB | ~$15 |
| Worker | 0.5 | 1GB | ~$15 |
| **Total** | | | **~$100/month** |

**Savings:** $385/month (from optimization) - $100/month (infrastructure) = **$285/month net savings!**

---

## 🎯 Next Steps

1. **Run health checks** (done locally)
2. **Create ECR repositories**
3. **Push images to ECR**
4. **Register task definitions**
5. **Deploy services**
6. **Configure load balancer**
7. **Test end-to-end**
8. **Monitor performance**

---

## 📝 Monitoring

### CloudWatch Dashboards

Create custom dashboard:
- Service CPU/Memory usage
- Request counts
- Error rates
- Latency metrics
- Cost tracking

### Alarms

Set up alarms for:
- High CPU (>80%)
- High memory (>90%)
- Service unhealthy
- Error rate spike
- Cost anomalies

---

**Ready to deploy all 6 Python services to AWS ECS!** 🚀

Total setup time: ~2 hours
Expected downtime: 0 minutes (blue/green deployment)

