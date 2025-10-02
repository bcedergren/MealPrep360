#!/bin/bash
# docker-deploy.sh - Deploy MealPrep360 using Docker Compose

set -e

echo "🚀 Deploying MealPrep360 with Docker Compose..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "Checking prerequisites..."

if ! command_exists docker; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

if ! command_exists docker-compose; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}⚠️  .env.production not found. Creating from template...${NC}"
    cp .env.example .env.production
    echo -e "${YELLOW}Please update .env.production with your production values${NC}"
    exit 1
fi

# Determine deployment type
DEPLOYMENT_TYPE=${1:-"development"}

case $DEPLOYMENT_TYPE in
    "development")
        COMPOSE_FILE="docker-compose.yml"
        echo -e "${BLUE}Deploying for development...${NC}"
        ;;
    "production")
        COMPOSE_FILE="docker-compose.prod.yml"
        echo -e "${BLUE}Deploying for production...${NC}"
        ;;
    *)
        echo -e "${RED}❌ Invalid deployment type. Use 'development' or 'production'${NC}"
        exit 1
        ;;
esac

# Check if compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
    echo -e "${RED}❌ $COMPOSE_FILE not found${NC}"
    exit 1
fi

# Stop existing containers
echo "Stopping existing containers..."
docker-compose -f "$COMPOSE_FILE" down

# Pull latest images (if using pre-built images)
if [ "$2" = "--pull" ]; then
    echo "Pulling latest images..."
    docker-compose -f "$COMPOSE_FILE" pull
fi

# Build and start services
echo "Building and starting services..."
docker-compose -f "$COMPOSE_FILE" up --build -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 30

# Health checks
echo "Running health checks..."

# Function to check service health
check_health() {
    local service_name=$1
    local health_url=$2
    
    echo -n "Checking $service_name... "
    
    if curl -f -s "$health_url" > /dev/null; then
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        return 1
    fi
}

# Check all services
HEALTH_CHECKS_PASSED=0

check_health "Frontend" "http://localhost:3000" && ((HEALTH_CHECKS_PASSED++))
check_health "API Gateway" "http://localhost:3001/api/health" && ((HEALTH_CHECKS_PASSED++))
check_health "Admin Panel" "http://localhost:3008" && ((HEALTH_CHECKS_PASSED++))
check_health "Recipe Service" "http://localhost:3002/health" && ((HEALTH_CHECKS_PASSED++))
check_health "Meal Plan Service" "http://localhost:3003/health" && ((HEALTH_CHECKS_PASSED++))
check_health "Shopping Service" "http://localhost:3004/health" && ((HEALTH_CHECKS_PASSED++))
check_health "Social Service" "http://localhost:3005/health" && ((HEALTH_CHECKS_PASSED++))
check_health "Blog Service" "http://localhost:3006/health" && ((HEALTH_CHECKS_PASSED++))
check_health "WebSocket Server" "http://localhost:3007/health" && ((HEALTH_CHECKS_PASSED++))

# Display results
echo ""
echo "Health check results: $HEALTH_CHECKS_PASSED/9 services healthy"

if [ $HEALTH_CHECKS_PASSED -eq 9 ]; then
    echo -e "${GREEN}🎉 All services are healthy!${NC}"
    echo ""
    echo -e "${YELLOW}📋 Service URLs:${NC}"
    echo "  Frontend: http://localhost:3000"
    echo "  API Gateway: http://localhost:3001"
    echo "  Admin Panel: http://localhost:3008"
    echo "  Recipe Service: http://localhost:3002"
    echo "  Meal Plan Service: http://localhost:3003"
    echo "  Shopping Service: http://localhost:3004"
    echo "  Social Service: http://localhost:3005"
    echo "  Blog Service: http://localhost:3006"
    echo "  WebSocket Server: http://localhost:3007"
    
    if [ "$DEPLOYMENT_TYPE" = "production" ]; then
        echo ""
        echo -e "${YELLOW}📊 Monitoring URLs:${NC}"
        echo "  Prometheus: http://localhost:9090"
        echo "  Grafana: http://localhost:3001"
        echo "  Kibana: http://localhost:5601"
    fi
else
    echo -e "${RED}❌ Some services are not healthy. Check logs with:${NC}"
    echo "  docker-compose -f $COMPOSE_FILE logs"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 MealPrep360 deployment completed successfully!${NC}"
