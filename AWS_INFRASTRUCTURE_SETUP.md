# AWS Infrastructure Setup Guide

## Overview

Setting up complete AWS infrastructure for MealPrep360 with ECS Fargate, DocumentDB, ElastiCache, and Application Load Balancer.

## Prerequisites

✅ AWS CLI configured  
✅ GitHub Actions CI/CD configured  
✅ ECR repositories created  
✅ Sufficient AWS permissions

## Architecture Components

1. **VPC & Networking** - Virtual private cloud with public/private subnets
2. **ECS Fargate Cluster** - Serverless container orchestration
3. **Application Load Balancer** - Traffic distribution with SSL
4. **DocumentDB** - MongoDB-compatible managed database
5. **ElastiCache** - Redis for caching
6. **CloudWatch** - Logging and monitoring
7. **Secrets Manager** - Secure credential storage

## Estimated Costs

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| ECS Fargate | 9 tasks (0.25 vCPU, 512MB) | ~$30-40 |
| DocumentDB | 1x db.t3.medium | ~$200 |
| ElastiCache | 1x cache.t3.micro | ~$15 |
| ALB | Standard | ~$20 |
| Data Transfer | Typical | ~$10-20 |
| **Total** | **Production** | **~$275-295/month** |

### Cost Optimization Tips:
- Start with smallest instances
- Use Fargate Spot for non-production
- Enable auto-scaling
- Set up budget alerts

## Step-by-Step Setup

### Step 1: Create VPC Infrastructure (10 min)

This creates the network foundation.

```bash
# Deploy VPC stack
aws cloudformation create-stack \
  --stack-name mealprep360-vpc \
  --template-body file://aws/cloudformation/vpc-infrastructure.yaml \
  --parameters ParameterKey=EnvironmentName,ParameterValue=mealprep360 \
  --region us-east-1

# Wait for completion
aws cloudformation wait stack-create-complete \
  --stack-name mealprep360-vpc \
  --region us-east-1

# Get outputs
aws cloudformation describe-stacks \
  --stack-name mealprep360-vpc \
  --query 'Stacks[0].Outputs' \
  --region us-east-1
```

### Step 2: Create Database Infrastructure (15-20 min)

**Important:** DocumentDB takes 15-20 minutes to provision.

```bash
# Set your database password (change this!)
DB_PASSWORD="YourSecurePassword123!"

# Get VPC outputs
VPC_ID=$(aws cloudformation describe-stacks \
  --stack-name mealprep360-vpc \
  --query 'Stacks[0].Outputs[?OutputKey==`VPC`].OutputValue' \
  --output text \
  --region us-east-1)

PRIVATE_SUBNETS=$(aws cloudformation describe-stacks \
  --stack-name mealprep360-vpc \
  --query 'Stacks[0].Outputs[?OutputKey==`PrivateSubnets`].OutputValue' \
  --output text \
  --region us-east-1)

# Deploy database stack
aws cloudformation create-stack \
  --stack-name mealprep360-database \
  --template-body file://aws/cloudformation/rds-mongodb.yaml \
  --parameters \
    ParameterKey=EnvironmentName,ParameterValue=mealprep360 \
    ParameterKey=VPC,ParameterValue=$VPC_ID \
    ParameterKey=PrivateSubnets,ParameterValue=\"$PRIVATE_SUBNETS\" \
    ParameterKey=MasterUsername,ParameterValue=admin \
    ParameterKey=MasterPassword,ParameterValue=$DB_PASSWORD \
  --region us-east-1

# This takes 15-20 minutes - get coffee! ☕
aws cloudformation wait stack-create-complete \
  --stack-name mealprep360-database \
  --region us-east-1
```

### Step 3: Create ECS Cluster (5-10 min)

```bash
# Get subnet outputs
PUBLIC_SUBNETS=$(aws cloudformation describe-stacks \
  --stack-name mealprep360-vpc \
  --query 'Stacks[0].Outputs[?OutputKey==`PublicSubnets`].OutputValue' \
  --output text \
  --region us-east-1)

# Deploy ECS stack
aws cloudformation create-stack \
  --stack-name mealprep360-ecs \
  --template-body file://aws/cloudformation/ecs-cluster.yaml \
  --parameters \
    ParameterKey=EnvironmentName,ParameterValue=mealprep360 \
    ParameterKey=VPC,ParameterValue=$VPC_ID \
    ParameterKey=PublicSubnets,ParameterValue=\"$PUBLIC_SUBNETS\" \
    ParameterKey=PrivateSubnets,ParameterValue=\"$PRIVATE_SUBNETS\" \
  --capabilities CAPABILITY_IAM \
  --region us-east-1

# Wait for completion
aws cloudformation wait stack-create-complete \
  --stack-name mealprep360-ecs \
  --region us-east-1
```

### Step 4: Store Secrets in Secrets Manager (5 min)

```bash
# Get database endpoints
DOCDB_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name mealprep360-database \
  --query 'Stacks[0].Outputs[?OutputKey==`DocumentDBEndpoint`].OutputValue' \
  --output text \
  --region us-east-1)

REDIS_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name mealprep360-database \
  --query 'Stacks[0].Outputs[?OutputKey==`RedisEndpoint`].OutputValue' \
  --output text \
  --region us-east-1)

# Create database connection string
MONGODB_URI="mongodb://admin:${DB_PASSWORD}@${DOCDB_ENDPOINT}:27017/mealprep360?ssl=true&replicaSet=rs0&readPreference=secondaryPreferred"

# Store in Secrets Manager
aws secretsmanager create-secret \
  --name mealprep360/mongodb-uri \
  --secret-string "$MONGODB_URI" \
  --region us-east-1

aws secretsmanager create-secret \
  --name mealprep360/redis-url \
  --secret-string "redis://${REDIS_ENDPOINT}:6379" \
  --region us-east-1

# Generate and store service API keys
for service in recipe mealplan shopping social blog websocket; do
  API_KEY=$(openssl rand -hex 32)
  aws secretsmanager create-secret \
    --name "mealprep360/${service}-api-key" \
    --secret-string "$API_KEY" \
    --region us-east-1
done

# Store other secrets
aws secretsmanager create-secret \
  --name mealprep360/jwt-secret \
  --secret-string "$(openssl rand -hex 64)" \
  --region us-east-1

# You'll need to add your Clerk keys manually:
echo "Add these secrets manually with your actual values:"
echo "  - mealprep360/clerk-publishable-key"
echo "  - mealprep360/clerk-secret-key"
echo "  - mealprep360/openai-api-key"
```

### Step 5: Register ECS Task Definitions (5 min)

```bash
# Update task definitions with your account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# For each service, update and register task definition
for service in frontend api-gateway; do
  # Update account ID in task definition
  sed "s/ACCOUNT_ID/$ACCOUNT_ID/g" \
    aws/ecs-task-definitions/${service}-task.json > \
    /tmp/${service}-task.json
  
  # Register task definition
  aws ecs register-task-definition \
    --cli-input-json file:///tmp/${service}-task.json \
    --region us-east-1
done
```

### Step 6: Create ECS Services (10 min)

```bash
# Get cluster and target group info
CLUSTER_ARN=$(aws cloudformation describe-stacks \
  --stack-name mealprep360-ecs \
  --query 'Stacks[0].Outputs[?OutputKey==`ECSCluster`].OutputValue' \
  --output text \
  --region us-east-1)

ECS_SG=$(aws cloudformation describe-stacks \
  --stack-name mealprep360-ecs \
  --query 'Stacks[0].Outputs[?OutputKey==`ECSSecurityGroup`].OutputValue' \
  --output text \
  --region us-east-1)

# Get subnets (as comma-separated list)
PRIVATE_SUBNET_LIST=$(echo $PRIVATE_SUBNETS | tr ',' ' ')

# Create frontend service
aws ecs create-service \
  --cluster $CLUSTER_ARN \
  --service-name frontend \
  --task-definition mealprep360-frontend \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$PRIVATE_SUBNET_LIST],securityGroups=[$ECS_SG],assignPublicIp=DISABLED}" \
  --region us-east-1

# Create api-gateway service
aws ecs create-service \
  --cluster $CLUSTER_ARN \
  --service-name api-gateway \
  --task-definition mealprep360-api-gateway \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$PRIVATE_SUBNET_LIST],securityGroups=[$ECS_SG],assignPublicIp=DISABLED}" \
  --region us-east-1

# Create other services...
for service in recipe-service mealplan-service shopping-service; do
  aws ecs create-service \
    --cluster $CLUSTER_ARN \
    --service-name $service \
    --task-definition mealprep360-$service \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[$PRIVATE_SUBNET_LIST],securityGroups=[$ECS_SG],assignPublicIp=DISABLED}" \
    --region us-east-1
done
```

## Verification Steps

### Check Stack Status

```bash
# List all stacks
aws cloudformation list-stacks \
  --stack-status-filter CREATE_COMPLETE \
  --query 'StackSummaries[?starts_with(StackName, `mealprep360`)].{Name:StackName,Status:StackStatus}' \
  --output table

# Should show:
# - mealprep360-vpc (CREATE_COMPLETE)
# - mealprep360-database (CREATE_COMPLETE)
# - mealprep360-ecs (CREATE_COMPLETE)
```

### Check ECS Services

```bash
# List services
aws ecs list-services \
  --cluster mealprep360-cluster \
  --region us-east-1

# Check service status
aws ecs describe-services \
  --cluster mealprep360-cluster \
  --services frontend api-gateway \
  --region us-east-1 \
  --query 'services[*].{Name:serviceName,Status:status,Running:runningCount,Desired:desiredCount}'
```

### Check Load Balancer

```bash
# Get ALB DNS
aws cloudformation describe-stacks \
  --stack-name mealprep360-ecs \
  --query 'Stacks[0].Outputs[?OutputKey==`ALBDNSName`].OutputValue' \
  --output text

# Test ALB (should return 200 or redirect)
curl -I http://<alb-dns-name>
```

### Check Databases

```bash
# Get DocumentDB endpoint
aws cloudformation describe-stacks \
  --stack-name mealprep360-database \
  --query 'Stacks[0].Outputs[?OutputKey==`DocumentDBEndpoint`].OutputValue' \
  --output text

# Get Redis endpoint
aws cloudformation describe-stacks \
  --stack-name mealprep360-database \
  --query 'Stacks[0].Outputs[?OutputKey==`RedisEndpoint`].OutputValue' \
  --output text
```

## Troubleshooting

### Stack Creation Failed

```bash
# Check stack events for errors
aws cloudformation describe-stack-events \
  --stack-name mealprep360-vpc \
  --max-items 20 \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]'

# Delete failed stack
aws cloudformation delete-stack --stack-name mealprep360-vpc
```

### ECS Tasks Not Starting

```bash
# Check task failures
aws ecs list-tasks \
  --cluster mealprep360-cluster \
  --desired-status STOPPED \
  --region us-east-1

# Get task details
aws ecs describe-tasks \
  --cluster mealprep360-cluster \
  --tasks <task-id> \
  --region us-east-1

# Common issues:
# - Missing secrets in Secrets Manager
# - Incorrect IAM permissions
# - Image not found in ECR (need to push images first!)
```

### Can't Connect to Services

```bash
# Check security group rules
aws ec2 describe-security-groups \
  --group-ids $ECS_SG \
  --query 'SecurityGroups[0].IpPermissions'

# Check target group health
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn>
```

## Next Steps After Infrastructure Setup

1. **Build and push Docker images** (using GitHub Actions or manually)
2. **Deploy services** (trigger via git push or manual deployment)
3. **Configure DNS** (point your domain to ALB)
4. **Set up SSL/TLS** (AWS Certificate Manager)
5. **Configure monitoring** (CloudWatch dashboards, alarms)

## Cost Management

### Set Up Budget Alerts

```bash
aws budgets create-budget \
  --account-id $ACCOUNT_ID \
  --budget file://budget.json \
  --notifications-with-subscribers file://notifications.json
```

### Monitor Costs

```bash
# Check current month costs
aws ce get-cost-and-usage \
  --time-period Start=2025-10-01,End=2025-10-31 \
  --granularity MONTHLY \
  --metrics BlendedCost
```

## Cleanup (if needed)

To delete everything:

```bash
# Delete in reverse order
aws cloudformation delete-stack --stack-name mealprep360-ecs
aws cloudformation delete-stack --stack-name mealprep360-database  
aws cloudformation delete-stack --stack-name mealprep360-vpc

# Delete ECR repositories
for repo in frontend admin api-gateway recipe-service mealplan-service shopping-service social-service blog-service websocket-server; do
  aws ecr delete-repository \
    --repository-name "mealprep360/$repo" \
    --force \
    --region us-east-1
done
```

## Summary

Once complete, you'll have:
- ✅ Production-ready VPC with public/private subnets
- ✅ ECS Fargate cluster ready for containers
- ✅ Application Load Balancer for traffic distribution
- ✅ DocumentDB for MongoDB workloads
- ✅ ElastiCache for Redis caching
- ✅ CloudWatch logging configured
- ✅ Secrets stored securely

**Total Setup Time:** ~45-60 minutes (mostly waiting for DocumentDB)

