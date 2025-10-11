#!/bin/bash

# MealPrep360 Local Development Script
# This script helps you run services locally for development

set -e

echo "🚀 MealPrep360 Local Development Setup"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running. Please start Docker Desktop.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker is running${NC}"
}

# Start infrastructure services
start_infrastructure() {
    echo ""
    echo "Starting infrastructure services (MongoDB, Redis)..."
    docker compose up -d mongodb redis
    echo -e "${GREEN}✅ Infrastructure services started${NC}"
}

# Display service menu
show_menu() {
    echo ""
    echo "Select services to run:"
    echo "1) Full Stack (All services via Docker)"
    echo "2) Infrastructure + Frontend + API"
    echo "3) Infrastructure + API + Recipe + MealPlan + Shopping"
    echo "4) Infrastructure Only (MongoDB + Redis)"
    echo "5) Custom Selection"
    echo "6) Exit"
    echo ""
}

# Start full Docker stack
start_full_docker() {
    echo ""
    echo "Starting full Docker stack..."
    docker compose up -d
    echo ""
    echo -e "${GREEN}✅ All services started via Docker${NC}"
    echo ""
    echo "Access points:"
    echo "  Frontend:    http://localhost:3000"
    echo "  Admin:       http://localhost:3008"
    echo "  API Gateway: http://localhost:3001"
    echo ""
    echo "View logs: docker compose logs -f"
}

# Start frontend stack
start_frontend_stack() {
    start_infrastructure
    echo ""
    echo "Starting Frontend + API locally..."
    echo ""
    echo -e "${YELLOW}Opening terminals for:${NC}"
    echo "  - API Gateway (port 3001)"
    echo "  - Frontend (port 3000)"
    echo ""
    echo "Run these commands in separate terminals:"
    echo ""
    echo -e "${GREEN}Terminal 1:${NC} npm run dev:api"
    echo -e "${GREEN}Terminal 2:${NC} npm run dev:frontend"
}

# Start backend stack
start_backend_stack() {
    start_infrastructure
    echo ""
    echo "Starting Backend services locally..."
    echo ""
    echo -e "${YELLOW}Opening terminals for:${NC}"
    echo "  - API Gateway (port 3001)"
    echo "  - Recipe Service (port 3002)"
    echo "  - Meal Plan Service (port 3003)"
    echo "  - Shopping Service (port 3004)"
    echo ""
    echo "Run these commands in separate terminals:"
    echo ""
    echo -e "${GREEN}Terminal 1:${NC} npm run dev:api"
    echo -e "${GREEN}Terminal 2:${NC} npm run dev:recipe"
    echo -e "${GREEN}Terminal 3:${NC} npm run dev:mealplan"
    echo -e "${GREEN}Terminal 4:${NC} npm run dev:shopping"
}

# Custom selection
start_custom() {
    start_infrastructure
    echo ""
    echo "Available services to run locally:"
    echo ""
    echo "  npm run dev:frontend   - Frontend (port 3000)"
    echo "  npm run dev:admin      - Admin Panel (port 3008)"
    echo "  npm run dev:api        - API Gateway (port 3001)"
    echo "  npm run dev:recipe     - Recipe Service (port 3002)"
    echo "  npm run dev:mealplan   - Meal Plan Service (port 3003)"
    echo "  npm run dev:shopping   - Shopping Service (port 3004)"
    echo "  npm run dev:social     - Social Service (port 3005)"
    echo "  npm run dev:blog       - Blog Service (port 3006)"
    echo "  npm run dev:websocket  - WebSocket Server (port 3007)"
    echo ""
    echo "Run these commands in separate terminals as needed."
}

# Main script
main() {
    check_docker
    
    show_menu
    read -p "Enter your choice [1-6]: " choice
    
    case $choice in
        1)
            start_full_docker
            ;;
        2)
            start_frontend_stack
            ;;
        3)
            start_backend_stack
            ;;
        4)
            start_infrastructure
            echo ""
            echo -e "${GREEN}✅ Infrastructure ready. MongoDB and Redis are running.${NC}"
            echo ""
            echo "You can now start services manually:"
            echo "  npm run dev:api"
            echo "  npm run dev:frontend"
            echo "  etc..."
            ;;
        5)
            start_custom
            ;;
        6)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid choice. Please select 1-6.${NC}"
            exit 1
            ;;
    esac
}

main


