#!/bin/bash

# MealPrep360 AWS Infrastructure Setup Script
# This script sets up the entire AWS infrastructure using CloudFormation

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
ENVIRONMENT_NAME=${ENVIRONMENT_NAME:-mealprep360}
STACK_PREFIX="${ENVIRONMENT_NAME}"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Function to create or update stack
deploy_stack() {
    local stack_name=$1
    local template_file=$2
    local parameters=$3
    
    print_status "Deploying stack: ${stack_name}..."
    
    # Check if stack exists
    if aws cloudformation describe-stacks --stack-name ${stack_name} --region ${AWS_REGION} &> /dev/null; then
        print_status "Updating existing stack..."
        aws cloudformation update-stack \
            --stack-name ${stack_name} \
            --template-body file://${template_file} \
            --parameters ${parameters} \
            --capabilities CAPABILITY_IAM \
            --region ${AWS_REGION} || true
    else
        print_status "Creating new stack..."
        aws cloudformation create-stack \
            --stack-name ${stack_name} \
            --template-body file://${template_file} \
            --parameters ${parameters} \
            --capabilities CAPABILITY_IAM \
            --region ${AWS_REGION}
    fi
    
    print_status "Waiting for stack to complete..."
    aws cloudformation wait stack-create-complete --stack-name ${stack_name} --region ${AWS_REGION} 2>/dev/null || \
    aws cloudformation wait stack-update-complete --stack-name ${stack_name} --region ${AWS_REGION} 2>/dev/null || true
    
    print_status "Stack ${stack_name} deployed successfully!"
}

# Step 1: Deploy VPC Infrastructure
print_status "Step 1: Deploying VPC Infrastructure..."
deploy_stack \
    "${STACK_PREFIX}-vpc" \
    "aws/cloudformation/vpc-infrastructure.yaml" \
    "ParameterKey=EnvironmentName,ParameterValue=${ENVIRONMENT_NAME}"

# Step 2: Deploy ECS Cluster
print_status "Step 2: Deploying ECS Cluster..."

# Get VPC outputs
VPC_ID=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_PREFIX}-vpc \
    --query 'Stacks[0].Outputs[?OutputKey==`VPC`].OutputValue' \
    --output text \
    --region ${AWS_REGION})

PUBLIC_SUBNETS=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_PREFIX}-vpc \
    --query 'Stacks[0].Outputs[?OutputKey==`PublicSubnets`].OutputValue' \
    --output text \
    --region ${AWS_REGION})

PRIVATE_SUBNETS=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_PREFIX}-vpc \
    --query 'Stacks[0].Outputs[?OutputKey==`PrivateSubnets`].OutputValue' \
    --output text \
    --region ${AWS_REGION})

deploy_stack \
    "${STACK_PREFIX}-ecs" \
    "aws/cloudformation/ecs-cluster.yaml" \
    "ParameterKey=EnvironmentName,ParameterValue=${ENVIRONMENT_NAME} ParameterKey=VPC,ParameterValue=${VPC_ID} ParameterKey=PublicSubnets,ParameterValue=\"${PUBLIC_SUBNETS}\" ParameterKey=PrivateSubnets,ParameterValue=\"${PRIVATE_SUBNETS}\""

# Step 3: Deploy Database Infrastructure
print_status "Step 3: Deploying Database Infrastructure..."

read -sp "Enter DocumentDB master password: " DB_PASSWORD
echo

deploy_stack \
    "${STACK_PREFIX}-database" \
    "aws/cloudformation/rds-mongodb.yaml" \
    "ParameterKey=EnvironmentName,ParameterValue=${ENVIRONMENT_NAME} ParameterKey=VPC,ParameterValue=${VPC_ID} ParameterKey=PrivateSubnets,ParameterValue=\"${PRIVATE_SUBNETS}\" ParameterKey=MasterUsername,ParameterValue=admin ParameterKey=MasterPassword,ParameterValue=${DB_PASSWORD}"

# Step 4: Create ECR Repositories
print_status "Step 4: Creating ECR Repositories..."

REPOSITORIES=(
    "frontend"
    "admin"
    "api-gateway"
    "recipe-service"
    "mealplan-service"
    "shopping-service"
    "social-service"
    "blog-service"
    "websocket-server"
)

for repo in "${REPOSITORIES[@]}"; do
    if aws ecr describe-repositories --repository-names "mealprep360/${repo}" --region ${AWS_REGION} &> /dev/null; then
        print_status "Repository mealprep360/${repo} already exists"
    else
        print_status "Creating repository: mealprep360/${repo}..."
        aws ecr create-repository \
            --repository-name "mealprep360/${repo}" \
            --region ${AWS_REGION} \
            --image-scanning-configuration scanOnPush=true > /dev/null
    fi
done

# Display stack outputs
print_status "Infrastructure setup complete!"
print_status ""
print_status "=== Stack Outputs ==="

ALB_DNS=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_PREFIX}-ecs \
    --query 'Stacks[0].Outputs[?OutputKey==`ALBDNSName`].OutputValue' \
    --output text \
    --region ${AWS_REGION})

print_status "Load Balancer DNS: ${ALB_DNS}"

DOCDB_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_PREFIX}-database \
    --query 'Stacks[0].Outputs[?OutputKey==`DocumentDBEndpoint`].OutputValue' \
    --output text \
    --region ${AWS_REGION})

print_status "DocumentDB Endpoint: ${DOCDB_ENDPOINT}"

REDIS_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_PREFIX}-database \
    --query 'Stacks[0].Outputs[?OutputKey==`RedisEndpoint`].OutputValue' \
    --output text \
    --region ${AWS_REGION})

print_status "Redis Endpoint: ${REDIS_ENDPOINT}"

print_status ""
print_status "Next steps:"
print_status "1. Update your Secrets Manager with the connection strings"
print_status "2. Run './aws/scripts/deploy-to-aws.sh' to deploy your application"
print_status "3. Configure your DNS to point to the ALB: ${ALB_DNS}"

