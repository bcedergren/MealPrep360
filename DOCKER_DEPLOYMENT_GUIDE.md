# MealPrep360 Docker Deployment Guide

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Local Development Setup](#local-development-setup)
4. [Production Docker Deployment](#production-docker-deployment)
5. [AWS Deployment](#aws-deployment)
6. [Troubleshooting](#troubleshooting)

## Overview

MealPrep360 is a microservices-based application that can be deployed using Docker containers. This guide covers:

- Running all services locally with Docker Compose
- Deploying to production using Docker
- Deploying to AWS using ECS (Elastic Container Service)

### Architecture

The application consists of the following services:

- **Frontend** (Port 3000): Main Next.js application
- **Admin Panel** (Port 3008): Administrative interface
- **API Gateway** (Port 3001): Central API routing and authentication
- **Recipe Service** (Port 3002): Recipe management and generation
- **Meal Plan Service** (Port 3003): Meal planning functionality
- **Shopping List Service** (Port 3004): Shopping list management
- **Social Media Service** (Port 3005): Social features
- **Blog Service** (Port 3006): Blog content management
- **WebSocket Server** (Port 3007): Real-time updates
- **MongoDB** (Port 27017): Database
- **Redis** (Port 6379): Caching and sessions

## Prerequisites

### Required Software

- **Docker Desktop** (20.10+): [Download here](https://www.docker.com/products/docker-desktop/)
- **Docker Compose** (2.0+): Included with Docker Desktop
- **Git**: For cloning the repository
- **Node.js** (18+): For local development (optional)

### For AWS Deployment

- **AWS CLI** (2.0+): [Installation guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- **AWS Account**: With appropriate permissions
- **Terraform** (optional): For infrastructure as code

## Local Development Setup

### Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd MealPrep360
```

### Step 2: Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp env.example .env
```

Edit `.env` with your values:

```env
# Database
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=yourSecurePassword123

# Service API Keys (generate random keys)
RECIPE_SERVICE_API_KEY=your_random_key_here
MEALPLAN_SERVICE_API_KEY=your_random_key_here
SHOPPING_SERVICE_API_KEY=your_random_key_here
SOCIAL_SERVICE_API_KEY=your_random_key_here
BLOG_SERVICE_API_KEY=your_random_key_here
WEBSOCKET_SERVICE_API_KEY=your_random_key_here

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# Clerk Authentication
CLERK_SECRET_KEY=your_clerk_secret
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# External Services
OPENAI_API_KEY=your_openai_key
```

### Step 3: Generate API Keys

You can generate secure API keys using:

```bash
# On Linux/Mac
openssl rand -hex 32

# On Windows (PowerShell)
-join ((48..57) + (97..102) | Get-Random -Count 32 | % {[char]$_})
```

### Step 4: Start All Services

#### Development Mode (with hot-reload)

```bash
docker-compose -f docker-compose.dev.yml up
```

#### Production Mode (locally)

```bash
docker-compose up
```

To run in detached mode (background):

```bash
docker-compose up -d
```

### Step 5: Verify Services

Check that all services are running:

```bash
docker-compose ps
```

Access the applications:

- **Frontend**: http://localhost:3000
- **Admin Panel**: http://localhost:3008
- **API Gateway**: http://localhost:3001/api/health

### Step 6: View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f api-gateway
```

### Step 7: Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: This deletes all data)
docker-compose down -v
```

## Production Docker Deployment

### Building for Production

```bash
# Build all images
docker-compose -f docker-compose.prod.yml build

# Build specific service
docker-compose -f docker-compose.prod.yml build frontend
```

### Running in Production

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Health Checks

All services include health checks. Monitor them with:

```bash
docker inspect --format='{{.State.Health.Status}}' <container_name>
```

### Scaling Services

```bash
# Scale specific services
docker-compose -f docker-compose.prod.yml up -d --scale frontend=3 --scale api-gateway=2
```

## AWS Deployment

### Architecture Overview

The AWS deployment uses:

- **ECS (Fargate)**: Serverless container orchestration
- **DocumentDB**: MongoDB-compatible managed database
- **ElastiCache**: Redis caching
- **Application Load Balancer**: Traffic distribution
- **ECR**: Container image registry
- **CloudWatch**: Logging and monitoring
- **Secrets Manager**: Secure credential storage

### Prerequisites for AWS

1. AWS Account with appropriate permissions
2. AWS CLI configured (`aws configure`)
3. Domain name (optional, for custom domains)

### Step 1: Setup AWS Infrastructure

#### Option A: Using CloudFormation

```bash
# Make scripts executable
chmod +x aws/scripts/*.sh

# Run infrastructure setup
./aws/scripts/setup-infrastructure.sh
```

This script will:
- Create VPC and networking
- Set up ECS cluster
- Deploy DocumentDB and Redis
- Create ECR repositories

#### Option B: Using Terraform

```bash
cd aws/terraform

# Initialize Terraform
terraform init

# Review planned changes
terraform plan

# Apply infrastructure
terraform apply
```

### Step 2: Create Secrets in AWS Secrets Manager

```bash
# Run the secrets setup script
./aws/scripts/create-secrets.sh
```

This will prompt you for:
- DocumentDB password
- Clerk API keys
- Application URLs
- Other sensitive credentials

### Step 3: Build and Push Docker Images

```bash
# Set your AWS account ID
export AWS_ACCOUNT_ID=123456789012
export AWS_REGION=us-east-1

# Run deployment script
./aws/scripts/deploy-to-aws.sh
```

This script will:
- Build all Docker images
- Tag images for ECR
- Push images to ECR
- Update ECS services

### Step 4: Create ECS Services

For each service, create an ECS service using the task definitions in `aws/ecs-task-definitions/`:

```bash
# Example: Create frontend service
aws ecs create-service \
  --cluster mealprep360-cluster \
  --service-name frontend \
  --task-definition mealprep360-frontend \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=frontend,containerPort=3000"
```

### Step 5: Configure DNS

Point your domain to the Application Load Balancer:

1. Get the ALB DNS name:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name mealprep360-ecs \
     --query 'Stacks[0].Outputs[?OutputKey==`ALBDNSName`].OutputValue' \
     --output text
   ```

2. Create a CNAME record in Route 53 or your DNS provider:
   - `mealprep360.com` → ALB DNS name
   - `admin.mealprep360.com` → ALB DNS name

### Step 6: Set Up SSL/TLS

1. Request a certificate in AWS Certificate Manager (ACM)
2. Validate the certificate
3. Update the ALB listener to use HTTPS

```bash
aws elbv2 create-listener \
  --load-balancer-arn <alb-arn> \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=<certificate-arn> \
  --default-actions Type=forward,TargetGroupArn=<target-group-arn>
```

### Monitoring and Logs

#### View CloudWatch Logs

```bash
# List log streams
aws logs describe-log-streams \
  --log-group-name /ecs/mealprep360/frontend

# Get recent logs
aws logs tail /ecs/mealprep360/frontend --follow
```

#### Monitor ECS Services

```bash
# Check service status
aws ecs describe-services \
  --cluster mealprep360-cluster \
  --services frontend api-gateway

# View running tasks
aws ecs list-tasks \
  --cluster mealprep360-cluster \
  --service-name frontend
```

### Updating Services

To deploy new versions:

```bash
# Build and push new images
./aws/scripts/deploy-to-aws.sh

# Force new deployment (ECS will pull latest images)
aws ecs update-service \
  --cluster mealprep360-cluster \
  --service frontend \
  --force-new-deployment
```

## Troubleshooting

### Common Issues

#### Services Won't Start

```bash
# Check service logs
docker-compose logs <service-name>

# Check container status
docker ps -a

# Restart specific service
docker-compose restart <service-name>
```

#### Port Conflicts

If you get "port already in use" errors:

```bash
# Find what's using the port (example for port 3000)
# Linux/Mac
lsof -i :3000

# Windows (PowerShell)
Get-NetTCPConnection -LocalPort 3000
```

#### Database Connection Issues

```bash
# Verify MongoDB is running
docker-compose logs mongodb

# Connect to MongoDB shell
docker-compose exec mongodb mongosh -u admin -p yourPassword

# Check if databases exist
show dbs
```

#### Out of Memory

Increase Docker memory:
- Docker Desktop → Settings → Resources → Memory

Or reduce service count:
```bash
# Start only essential services
docker-compose up frontend api-gateway mongodb redis
```

### AWS Specific Issues

#### ECS Tasks Failing to Start

```bash
# Check task stopped reason
aws ecs describe-tasks \
  --cluster mealprep360-cluster \
  --tasks <task-id>

# Common issues:
# - Missing environment variables
# - Invalid secrets
# - Health check failures
```

#### Can't Access Services

1. Check security groups allow inbound traffic
2. Verify target group health checks
3. Check ALB listener rules

```bash
# Check target health
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn>
```

## Best Practices

### Development

1. Use `docker-compose.dev.yml` for development
2. Mount volumes for hot-reload
3. Use environment-specific `.env` files
4. Regular backups of MongoDB data

### Production

1. Use specific image tags (not `latest`)
2. Set resource limits (CPU/memory)
3. Enable health checks
4. Use secrets management
5. Implement proper logging
6. Set up monitoring and alerts
7. Regular security updates

### Security

1. Never commit `.env` files
2. Use AWS Secrets Manager for credentials
3. Enable SSL/TLS in production
4. Restrict security group rules
5. Regular dependency updates
6. Enable container scanning in ECR

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS DocumentDB Documentation](https://docs.aws.amazon.com/documentdb/)

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review service logs
3. Check AWS CloudWatch logs
4. Contact the development team

