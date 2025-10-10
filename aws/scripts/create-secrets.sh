#!/bin/bash

# MealPrep360 AWS Secrets Manager Setup Script
# This script creates all necessary secrets in AWS Secrets Manager

set -e

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}

print_status() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

# Function to create or update secret
create_secret() {
    local secret_name=$1
    local secret_value=$2
    
    if aws secretsmanager describe-secret --secret-id ${secret_name} --region ${AWS_REGION} &> /dev/null; then
        print_status "Updating secret: ${secret_name}"
        aws secretsmanager update-secret \
            --secret-id ${secret_name} \
            --secret-string "${secret_value}" \
            --region ${AWS_REGION} > /dev/null
    else
        print_status "Creating secret: ${secret_name}"
        aws secretsmanager create-secret \
            --name ${secret_name} \
            --secret-string "${secret_value}" \
            --region ${AWS_REGION} > /dev/null
    fi
}

# Get database endpoints from CloudFormation
DOCDB_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name mealprep360-database \
    --query 'Stacks[0].Outputs[?OutputKey==`DocumentDBEndpoint`].OutputValue' \
    --output text \
    --region ${AWS_REGION})

REDIS_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name mealprep360-database \
    --query 'Stacks[0].Outputs[?OutputKey==`RedisEndpoint`].OutputValue' \
    --output text \
    --region ${AWS_REGION})

# Prompt for credentials
read -sp "Enter DocumentDB master password: " DOCDB_PASSWORD
echo
read -p "Enter Clerk Publishable Key: " CLERK_KEY
read -sp "Enter Clerk Secret Key: " CLERK_SECRET
echo
read -p "Enter API URL (e.g., https://api.mealprep360.com): " API_URL
read -p "Enter WebSocket URL (e.g., wss://ws.mealprep360.com): " WS_URL

# Generate random API keys for services
RECIPE_API_KEY=$(openssl rand -hex 32)
MEALPLAN_API_KEY=$(openssl rand -hex 32)
SHOPPING_API_KEY=$(openssl rand -hex 32)
SOCIAL_API_KEY=$(openssl rand -hex 32)
BLOG_API_KEY=$(openssl rand -hex 32)
WEBSOCKET_API_KEY=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 64)

# Create secrets
print_status "Creating secrets in AWS Secrets Manager..."

create_secret "mealprep360/mongodb-uri" "mongodb://admin:${DOCDB_PASSWORD}@${DOCDB_ENDPOINT}:27017/mealprep360?ssl=true&replicaSet=rs0&readPreference=secondaryPreferred"
create_secret "mealprep360/redis-url" "redis://${REDIS_ENDPOINT}:6379"
create_secret "mealprep360/clerk-publishable-key" "${CLERK_KEY}"
create_secret "mealprep360/clerk-secret-key" "${CLERK_SECRET}"
create_secret "mealprep360/api-url" "${API_URL}"
create_secret "mealprep360/ws-url" "${WS_URL}"
create_secret "mealprep360/recipe-api-key" "${RECIPE_API_KEY}"
create_secret "mealprep360/mealplan-api-key" "${MEALPLAN_API_KEY}"
create_secret "mealprep360/shopping-api-key" "${SHOPPING_API_KEY}"
create_secret "mealprep360/social-api-key" "${SOCIAL_API_KEY}"
create_secret "mealprep360/blog-api-key" "${BLOG_API_KEY}"
create_secret "mealprep360/websocket-api-key" "${WEBSOCKET_API_KEY}"
create_secret "mealprep360/jwt-secret" "${JWT_SECRET}"

print_status "All secrets created successfully!"
print_status ""
print_status "=== Service API Keys (Save these for reference) ==="
print_status "Recipe Service API Key: ${RECIPE_API_KEY}"
print_status "Meal Plan Service API Key: ${MEALPLAN_API_KEY}"
print_status "Shopping Service API Key: ${SHOPPING_API_KEY}"
print_status "Social Service API Key: ${SOCIAL_API_KEY}"
print_status "Blog Service API Key: ${BLOG_API_KEY}"
print_status "WebSocket Service API Key: ${WEBSOCKET_API_KEY}"
print_status "JWT Secret: ${JWT_SECRET}"

