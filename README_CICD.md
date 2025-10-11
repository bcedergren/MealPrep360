# MealPrep360 CI/CD & Deployment

Complete guide to deploying MealPrep360 using Docker and AWS ECS with automated CI/CD via GitHub Actions.

## 📚 Documentation Index

### Getting Started
1. **[Docker Deployment Guide](DOCKER_DEPLOYMENT_GUIDE.md)** - Comprehensive guide for Docker and AWS
2. **[Quick Docker Reference](QUICK_DOCKER_REFERENCE.md)** - Common Docker commands and quick start
3. **[GitHub Actions Setup](GITHUB_ACTIONS_SETUP.md)** - Step-by-step CI/CD setup
4. **[CI/CD Quick Reference](CICD_QUICK_REFERENCE.md)** - Common CI/CD commands and workflows

### Detailed Documentation
- **[GitHub Workflows README](.github/workflows/README.md)** - Workflow details and usage
- **[AWS Deployment](Documents/AWS_DEPLOYMENT.md)** - AWS infrastructure details

## 🚀 Quick Start

### Run Locally with Docker

```bash
# 1. Configure environment
cp env.example .env
# Edit .env with your configuration

# 2. Start all services
docker-compose -f docker-compose.dev.yml up -d

# 3. Access applications
# Frontend: http://localhost:3000
# Admin: http://localhost:3008
# API: http://localhost:3001/api/health
```

### Deploy to AWS

```bash
# 1. Setup AWS infrastructure
./aws/scripts/setup-infrastructure.sh

# 2. Create secrets
./aws/scripts/create-secrets.sh

# 3. Deploy application
export AWS_ACCOUNT_ID=your-account-id
./aws/scripts/deploy-to-aws.sh
```

### Setup CI/CD

```bash
# 1. Setup AWS OIDC provider
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1

# 2. Create IAM role (see GITHUB_ACTIONS_SETUP.md for details)

# 3. Add GitHub secrets:
# - AWS_ACCOUNT_ID
# - AWS_DEPLOY_ROLE_ARN

# 4. Push to develop or main
git push origin develop  # Deploys to staging
git push origin main     # Deploys to production (with approval)
```

## 📦 What's Included

### Docker Infrastructure
- ✅ Dockerfiles for all 9 services
- ✅ Development and production Docker Compose files
- ✅ Nginx load balancer configuration
- ✅ Optimized multi-stage builds
- ✅ Health checks for all services

### AWS Infrastructure
- ✅ CloudFormation templates (VPC, ECS, RDS)
- ✅ Terraform configurations (alternative to CloudFormation)
- ✅ ECS Fargate task definitions
- ✅ Application Load Balancer setup
- ✅ DocumentDB (MongoDB) and ElastiCache (Redis)
- ✅ Automated deployment scripts

### CI/CD Pipelines
- ✅ Automated testing on pull requests
- ✅ Staging deployment on develop branch
- ✅ Production deployment on main branch (with approval)
- ✅ Single service deployment
- ✅ Automated ECR cleanup
- ✅ Security scanning with Trivy
- ✅ Automatic rollback on failure

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Load Balancer               │
│                    (with SSL/TLS termination)               │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┬─────────────┐
        │             │             │             │
   ┌────▼────┐  ┌────▼────┐  ┌────▼────┐  ┌────▼────┐
   │Frontend │  │  Admin  │  │   API   │  │WebSocket│
   │  :3000  │  │  :3008  │  │ Gateway │  │  :3007  │
   └─────────┘  └─────────┘  │  :3001  │  └─────────┘
                              └────┬────┘
                                   │
        ┌──────────────────────────┼──────────────────────┐
        │                          │                      │
   ┌────▼────┐  ┌─────────┐  ┌────▼────┐  ┌──────────┐
   │ Recipe  │  │MealPlan │  │Shopping │  │  Social  │
   │ Service │  │ Service │  │ Service │  │  Service │
   │  :3002  │  │  :3003  │  │  :3004  │  │   :3005  │
   └─────────┘  └─────────┘  └─────────┘  └──────────┘
        │                          │
        └──────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
   ┌────▼────┐            ┌────▼────┐
   │MongoDB  │            │  Redis  │
   │ :27017  │            │  :6379  │
   └─────────┘            └─────────┘
```

## 🔄 CI/CD Workflow

```
Feature Branch → Pull Request → CI Tests
                                    ↓
                           Tests Pass → Merge to develop
                                    ↓
                        Auto Deploy to Staging (ECS)
                                    ↓
                           Test in Staging
                                    ↓
                         Merge to main (with PR)
                                    ↓
                    Production Deployment (needs approval)
                                    ↓
                            Smoke Tests
                                    ↓
                      Success ✅ or Rollback 🔄
```

## 📋 Services

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | Main Next.js application |
| Admin | 3008 | Administrative interface |
| API Gateway | 3001 | Central API routing |
| Recipe Service | 3002 | Recipe management |
| Meal Plan Service | 3003 | Meal planning |
| Shopping Service | 3004 | Shopping lists |
| Social Service | 3005 | Social features |
| Blog Service | 3006 | Blog content |
| WebSocket | 3007 | Real-time updates |
| MongoDB | 27017 | Database |
| Redis | 6379 | Cache & sessions |

## 🛠️ Available Commands

### Docker
```bash
# Start services
docker-compose up -d
docker-compose -f docker-compose.dev.yml up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f [service-name]

# Rebuild service
docker-compose build [service-name]
```

### AWS Deployment
```bash
# Setup infrastructure
./aws/scripts/setup-infrastructure.sh

# Deploy application
./aws/scripts/deploy-to-aws.sh

# Create secrets
./aws/scripts/create-secrets.sh
```

### GitHub Actions
```bash
# View workflow runs
gh run list

# Watch running workflow
gh run watch

# Deploy single service
# Use GitHub UI: Actions → Deploy Single Service
```

## 🔐 Environment Variables

Required environment variables (set in `.env`):

```env
# Database
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=<secure-password>

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

Generate secure keys:
```bash
openssl rand -hex 32
```

## 📊 Monitoring

### Local Development
```bash
# View logs
docker-compose logs -f

# Check resource usage
docker stats

# Health checks
curl http://localhost:3001/api/health
```

### AWS Production
```bash
# ECS service status
aws ecs describe-services \
  --cluster mealprep360-cluster \
  --services frontend

# CloudWatch logs
aws logs tail /ecs/mealprep360/frontend --follow

# Check deployments
gh run list --workflow=deploy-production.yml
```

## 🐛 Troubleshooting

See detailed troubleshooting in:
- [Docker Deployment Guide](DOCKER_DEPLOYMENT_GUIDE.md#troubleshooting)
- [GitHub Actions README](.github/workflows/README.md#troubleshooting)
- [CI/CD Quick Reference](CICD_QUICK_REFERENCE.md#troubleshooting)

## 🎯 Next Steps

1. ✅ **Local Development**
   - Follow [Quick Docker Reference](QUICK_DOCKER_REFERENCE.md)
   - Configure `.env` file
   - Run `docker-compose up`

2. ✅ **AWS Deployment**
   - Follow [Docker Deployment Guide](DOCKER_DEPLOYMENT_GUIDE.md)
   - Setup AWS infrastructure
   - Deploy services

3. ✅ **CI/CD Setup**
   - Follow [GitHub Actions Setup](GITHUB_ACTIONS_SETUP.md)
   - Configure GitHub secrets
   - Test deployments

## 📞 Support

- **Docker Issues**: [DOCKER_DEPLOYMENT_GUIDE.md](DOCKER_DEPLOYMENT_GUIDE.md)
- **AWS Issues**: [AWS_DEPLOYMENT.md](Documents/AWS_DEPLOYMENT.md)
- **CI/CD Issues**: [.github/workflows/README.md](.github/workflows/README.md)

## 🔗 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)

---

**Ready to deploy?** Start with the [Quick Docker Reference](QUICK_DOCKER_REFERENCE.md) for local development or [GitHub Actions Setup](GITHUB_ACTIONS_SETUP.md) for automated deployments! 🚀

