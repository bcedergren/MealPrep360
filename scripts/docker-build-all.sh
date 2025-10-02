#!/bin/bash
# docker-build-all.sh - Build all Docker images for MealPrep360

set -e

echo "🐳 Building all MealPrep360 Docker images..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to build Docker image
build_image() {
    local service_name=$1
    local service_path=$2
    local image_tag=$3
    
    echo -e "${BLUE}Building $service_name...${NC}"
    cd "$service_path"
    
    if docker build -t "$image_tag" .; then
        echo -e "${GREEN}✅ $service_name built successfully${NC}"
    else
        echo -e "${RED}❌ $service_name build failed${NC}"
        exit 1
    fi
    
    cd - > /dev/null
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"

# Build all services
echo "Starting Docker builds..."

# Frontend Services
build_image "Frontend" "MealPrep360" "mealprep360/frontend:latest"
build_image "Admin Panel" "MealPrep360-Admin" "mealprep360/admin:latest"

# API Gateway
build_image "API Gateway" "MealPrep360-API" "mealprep360/api-gateway:latest"

# Microservices
build_image "Recipe Service" "MealPrep360-RecipeService" "mealprep360/recipe-service:latest"
build_image "Meal Plan Service" "MealPrep360-MealPlanService" "mealprep360/mealplan-service:latest"
build_image "Shopping Service" "MealPrep360-ShoppingListService" "mealprep360/shopping-service:latest"
build_image "Social Service" "MealPrep360-SocialMediaService" "mealprep360/social-service:latest"
build_image "Blog Service" "MealPrep360-BlogService" "mealprep360/blog-service:latest"
build_image "WebSocket Server" "MealPrep360-WebsocketServer" "mealprep360/websocket-server:latest"

echo -e "${GREEN}🎉 All Docker images built successfully!${NC}"

# List all images
echo -e "${YELLOW}📦 Built images:${NC}"
docker images | grep mealprep360

# Optional: Push to registry
if [ "$1" = "--push" ]; then
    echo -e "${YELLOW}Pushing images to registry...${NC}"
    
    # Push all images
    docker push mealprep360/frontend:latest
    docker push mealprep360/admin:latest
    docker push mealprep360/api-gateway:latest
    docker push mealprep360/recipe-service:latest
    docker push mealprep360/mealplan-service:latest
    docker push mealprep360/shopping-service:latest
    docker push mealprep360/social-service:latest
    docker push mealprep360/blog-service:latest
    docker push mealprep360/websocket-server:latest
    
    echo -e "${GREEN}✅ All images pushed to registry${NC}"
fi

echo -e "${GREEN}🎉 Docker build process completed!${NC}"
