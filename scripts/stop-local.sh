#!/bin/bash

# MealPrep360 Local Development Stop Script

set -e

GREEN='\033[0;32m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[MealPrep360]${NC} $1"
}

COMPOSE_FILE="docker-compose.yml"
if [ "$1" == "dev" ]; then
    COMPOSE_FILE="docker-compose.dev.yml"
fi

print_status "Stopping MealPrep360 services..."

if docker compose version &> /dev/null; then
    docker compose -f $COMPOSE_FILE down
else
    docker-compose -f $COMPOSE_FILE down
fi

print_status "All services stopped."

if [ "$1" == "--clean" ]; then
    print_status "Removing volumes..."
    docker volume prune -f
    print_status "Cleanup complete."
fi

