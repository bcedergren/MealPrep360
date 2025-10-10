#!/bin/bash

# MealPrep360 Local Development Startup Script
# This script starts all services for local development

set -e

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[MealPrep360]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[MealPrep360]${NC} $1"
}

print_error() {
    echo -e "${RED}[MealPrep360]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker Desktop first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not installed. Please install it first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from env.example..."
    if [ -f env.example ]; then
        cp env.example .env
        print_status ".env file created. Please edit it with your values."
        print_warning "You'll need to set values for:"
        echo "  - MONGO_ROOT_PASSWORD"
        echo "  - Service API keys"
        echo "  - CLERK_SECRET_KEY"
        echo "  - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
        echo ""
        read -p "Press Enter to continue once you've configured .env..."
    else
        print_error "env.example not found. Cannot create .env file."
        exit 1
    fi
fi

print_status "Starting MealPrep360 services..."

# Check if we should use dev or prod compose file
COMPOSE_FILE="docker-compose.yml"
if [ "$1" == "dev" ]; then
    COMPOSE_FILE="docker-compose.dev.yml"
    print_status "Using development configuration..."
else
    print_status "Using production configuration..."
fi

# Start services
if docker compose version &> /dev/null; then
    docker compose -f $COMPOSE_FILE up -d
else
    docker-compose -f $COMPOSE_FILE up -d
fi

print_status "Waiting for services to be healthy..."
sleep 10

# Show status
print_status "Service status:"
if docker compose version &> /dev/null; then
    docker compose -f $COMPOSE_FILE ps
else
    docker-compose -f $COMPOSE_FILE ps
fi

print_status ""
print_status "MealPrep360 is now running!"
print_status ""
print_status "Access your applications at:"
print_status "  Frontend:    http://localhost:3000"
print_status "  Admin Panel: http://localhost:3008"
print_status "  API Gateway: http://localhost:3001/api/health"
print_status ""
print_status "To view logs: docker-compose logs -f"
print_status "To stop:      docker-compose down"
print_status ""

