#!/bin/bash

# MealPrep360 Recipe Service - Railway Worker Deployment Script

set -e  # Exit on any error

echo "🚂 MealPrep360 Recipe Worker - Railway Deployment"
echo "================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if railway CLI is installed
    if ! command -v railway &> /dev/null; then
        log_error "Railway CLI is not installed."
        log_info "Install with: npm install -g @railway/cli"
        log_info "Or visit: https://railway.app/cli"
        exit 1
    fi
    
    # Check if logged in to Railway
    if ! railway whoami &> /dev/null; then
        log_error "Not logged in to Railway. Please run: railway login"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Setup worker directory
setup_worker() {
    log_info "Setting up worker service..."
    
    # Create worker directory if it doesn't exist
    if [ ! -d "railway-worker" ]; then
        log_error "railway-worker directory not found. Please create it first."
        exit 1
    fi
    
    cd railway-worker
    
    # Copy necessary files from main project
    log_info "Copying source files..."
    
    # Create src directories
    mkdir -p src/workers src/services src/utils src/constants src/models src/types
    
    # Copy workers
    cp -r ../src/workers/* src/workers/ 2>/dev/null || log_warning "No workers to copy"
    
    # Copy services (excluding tests)
    for service in ../src/services/*.ts; do
        if [[ ! "$service" == *".test.ts" && ! "$service" == *"/__tests__"* ]]; then
            cp "$service" src/services/ 2>/dev/null || true
        fi
    done
    
    # Copy utilities
    cp -r ../src/utils/* src/utils/ 2>/dev/null || log_warning "No utils to copy"
    cp -r ../src/constants/* src/constants/ 2>/dev/null || log_warning "No constants to copy"
    cp -r ../src/models/* src/models/ 2>/dev/null || log_warning "No models to copy"
    cp -r ../src/types/* src/types/ 2>/dev/null || log_warning "No types to copy"
    
    # Copy config files
    cp ../tsconfig.json . 2>/dev/null || log_warning "No tsconfig.json to copy"
    
    log_success "Source files copied"
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    
    # Install packages
    npm install
    
    log_success "Dependencies installed"
}

# Build the project
build_project() {
    log_info "Building TypeScript project..."
    
    # Build
    npm run build
    
    log_success "Project built successfully"
}

# Deploy to Railway
deploy_to_railway() {
    log_info "Deploying to Railway..."
    
    # Initialize Railway project if needed
    if [ ! -f "railway.toml" ]; then
        log_error "railway.toml not found. Please run this from the railway-worker directory."
        exit 1
    fi
    
    # Deploy
    railway up
    
    log_success "Deployed to Railway!"
}

# Set environment variables
set_environment_variables() {
    log_info "Setting environment variables..."
    
    # Check if .env.local exists in parent directory
    if [ -f "../.env.local" ]; then
        log_info "Found .env.local, setting Railway environment variables..."
        
        # Source the environment file
        source ../.env.local
        
        # Set Railway environment variables
        railway variables set NODE_ENV=production
        railway variables set MONGODB_URI="$MONGODB_URI"
        railway variables set REDIS_HOST="$REDIS_HOST"
        railway variables set REDIS_PORT="$REDIS_PORT"
        railway variables set REDIS_PASSWORD="$REDIS_PASSWORD"
        railway variables set OPENAI_API_KEY="$OPENAI_API_KEY"
        railway variables set OPENAI_GPT_ID="$OPENAI_GPT_ID"
        railway variables set API_KEY="$API_KEY"
        railway variables set RATE_LIMIT_DELAY_MS=8000
        railway variables set MAX_RECIPE_FAILURES=15
        
        log_success "Environment variables set"
    else
        log_warning ".env.local not found. You'll need to set environment variables manually:"
        log_info "railway variables set MONGODB_URI=your_mongodb_uri"
        log_info "railway variables set REDIS_HOST=your_redis_host"
        log_info "And so on..."
    fi
}

# Get deployment info
get_deployment_info() {
    log_info "Getting deployment information..."
    
    # Get the Railway URL
    RAILWAY_URL=$(railway domain)
    
    echo ""
    echo "🎉 Deployment Complete!"
    echo "======================="
    echo "Service: MealPrep360 Recipe Worker"
    echo "Platform: Railway"
    echo "URL: $RAILWAY_URL"
    echo ""
    echo "🧪 Test your worker:"
    echo "curl $RAILWAY_URL/health"
    echo "curl -X POST $RAILWAY_URL/process"
    echo ""
    echo "📊 Monitor your service:"
    echo "railway logs --follow"
    echo ""
    echo "🔧 Manage your service:"
    echo "railway open  # Opens Railway dashboard"
}

# Test the deployment
test_deployment() {
    log_info "Testing deployment..."
    
    RAILWAY_URL=$(railway domain)
    
    # Test health endpoint
    if curl -f -s "$RAILWAY_URL/health" > /dev/null; then
        log_success "Health check passed!"
    else
        log_error "Health check failed. Check the logs:"
        log_info "railway logs"
    fi
}

# Main execution
main() {
    echo ""
    log_info "Starting Railway worker deployment..."
    echo ""
    
    check_prerequisites
    setup_worker
    install_dependencies
    build_project
    set_environment_variables
    deploy_to_railway
    get_deployment_info
    test_deployment
    
    echo ""
    log_success "🎉 MealPrep360 Recipe Worker is now running on Railway!"
    echo ""
    log_info "Next steps:"
    echo "1. Update your Vercel environment with the Railway worker URL"
    echo "2. Test the worker with your main application"
    echo "3. Monitor logs and performance"
    echo "4. Scale as needed in the Railway dashboard"
    
    echo ""
    log_info "To update Vercel environment:"
    echo "vercel env add WORKER_URL production"
    echo "# Enter: $RAILWAY_URL"
}

# Run the main function
main "$@" 
