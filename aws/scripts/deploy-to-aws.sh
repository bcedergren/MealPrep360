#!/bin/bash

# MealPrep360 AWS Deployment Script
# This script deploys the application to AWS ECS using Docker images

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID}
ENVIRONMENT=${ENVIRONMENT:-production}
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install it first.${NC}"
    exit 1
fi

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

# Login to ECR
print_status "Logging in to Amazon ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}

# Services to deploy
SERVICES=(
    "frontend:MealPrep360"
    "admin:MealPrep360-Admin"
    "api-gateway:MealPrep360-API"
    "recipe-service:MealPrep360-RecipeService"
    "mealplan-service:MealPrep360-MealPlanService"
    "shopping-service:MealPrep360-ShoppingListService"
    "social-service:MealPrep360-SocialMediaService"
    "blog-service:MealPrep360-BlogService"
    "websocket-server:MealPrep360-WebsocketServer"
)

# Build and push each service
for service_info in "${SERVICES[@]}"; do
    IFS=':' read -r service_name service_dir <<< "$service_info"
    
    print_status "Building ${service_name}..."
    
    # Build the Docker image
    docker build -t ${service_name}:latest ./${service_dir}
    
    # Tag the image for ECR
    docker tag ${service_name}:latest ${ECR_REGISTRY}/mealprep360/${service_name}:latest
    docker tag ${service_name}:latest ${ECR_REGISTRY}/mealprep360/${service_name}:${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S)
    
    # Push the image to ECR
    print_status "Pushing ${service_name} to ECR..."
    docker push ${ECR_REGISTRY}/mealprep360/${service_name}:latest
    docker push ${ECR_REGISTRY}/mealprep360/${service_name}:${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S)
    
    print_status "${service_name} deployed successfully!"
done

# Update ECS services (if they exist)
print_status "Updating ECS services..."

CLUSTER_NAME="mealprep360-cluster"

for service_info in "${SERVICES[@]}"; do
    IFS=':' read -r service_name service_dir <<< "$service_info"
    
    # Check if service exists
    if aws ecs describe-services --cluster ${CLUSTER_NAME} --services ${service_name} --region ${AWS_REGION} | grep -q "ACTIVE"; then
        print_status "Updating ECS service: ${service_name}..."
        aws ecs update-service \
            --cluster ${CLUSTER_NAME} \
            --service ${service_name} \
            --force-new-deployment \
            --region ${AWS_REGION} > /dev/null
    else
        print_warning "ECS service ${service_name} not found. Skipping update."
    fi
done

print_status "Deployment completed successfully!"
print_status "Your application is now running on AWS ECS."

