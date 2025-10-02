#!/bin/bash

# MealPrep360 Recipe Service - Google Cloud Run Deployment Script
# This script deploys your recipe service to Google Cloud Run

set -e  # Exit on any error

echo "🚀 MealPrep360 Recipe Service - Google Cloud Run Deployment"
echo "============================================================"

# Configuration
PROJECT_ID=${GOOGLE_CLOUD_PROJECT:-"your-project-id"}
SERVICE_NAME="mealprep360-recipe-service"
REGION="us-central1"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

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
    
    # Check if gcloud is installed
    if ! command -v gcloud &> /dev/null; then
        log_error "gcloud CLI is not installed. Please install it from: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    
    # Check if docker is available (for local testing)
    if ! command -v docker &> /dev/null; then
        log_warning "Docker is not installed. Local testing will be skipped."
    fi
    
    # Check if logged in to gcloud
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        log_error "Not logged in to gcloud. Please run: gcloud auth login"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Setup Google Cloud project
setup_project() {
    log_info "Setting up Google Cloud project..."
    
    # Set project if provided
    if [ "$PROJECT_ID" != "your-project-id" ]; then
        gcloud config set project $PROJECT_ID
        log_success "Project set to: $PROJECT_ID"
    else
        PROJECT_ID=$(gcloud config get-value project)
        if [ -z "$PROJECT_ID" ]; then
            log_error "No project set. Please set PROJECT_ID environment variable or run: gcloud config set project YOUR_PROJECT_ID"
            exit 1
        fi
        log_info "Using current project: $PROJECT_ID"
    fi
    
    # Enable required APIs
    log_info "Enabling required Google Cloud APIs..."
    gcloud services enable run.googleapis.com
    gcloud services enable cloudbuild.googleapis.com
    gcloud services enable containerregistry.googleapis.com
    gcloud services enable secretmanager.googleapis.com
    
    log_success "APIs enabled successfully"
}

# Create secrets in Secret Manager
create_secrets() {
    log_info "Setting up secrets in Secret Manager..."
    
    # Check if .env.local exists
    if [ ! -f ".env.local" ]; then
        log_error ".env.local file not found. Please create it with your environment variables."
        log_info "Required variables: MONGODB_URI, REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, OPENAI_API_KEY, OPENAI_GPT_ID, API_KEY"
        exit 1
    fi
    
    # Source the .env.local file
    source .env.local
    
    # Create secrets (will update if they exist)
    secrets=(
        "mealprep360-mongodb-uri:$MONGODB_URI"
        "mealprep360-redis-host:$REDIS_HOST"
        "mealprep360-redis-port:$REDIS_PORT"
        "mealprep360-redis-password:$REDIS_PASSWORD"
        "mealprep360-openai-key:$OPENAI_API_KEY"
        "mealprep360-openai-gpt-id:$OPENAI_GPT_ID"
        "mealprep360-api-key:$API_KEY"
    )
    
    for secret_pair in "${secrets[@]}"; do
        secret_name=$(echo $secret_pair | cut -d: -f1)
        secret_value=$(echo $secret_pair | cut -d: -f2-)
        
        if [ -z "$secret_value" ]; then
            log_warning "Skipping empty secret: $secret_name"
            continue
        fi
        
        # Check if secret exists
        if gcloud secrets describe $secret_name &>/dev/null; then
            log_info "Updating existing secret: $secret_name"
            echo -n "$secret_value" | gcloud secrets versions add $secret_name --data-file=-
        else
            log_info "Creating new secret: $secret_name"
            echo -n "$secret_value" | gcloud secrets create $secret_name --data-file=-
        fi
    done
    
    log_success "Secrets configured successfully"
}

# Build and deploy
deploy_service() {
    log_info "Building and deploying to Cloud Run..."
    
    # Build the application first
    log_info "Building TypeScript application..."
    npm run build
    
    # Deploy using Cloud Build (builds container and deploys)
    gcloud run deploy $SERVICE_NAME \
        --source . \
        --platform managed \
        --region $REGION \
        --allow-unauthenticated \
        --memory 2Gi \
        --cpu 2 \
        --min-instances 1 \
        --max-instances 10 \
        --port 3000 \
        --timeout 900s \
        --set-env-vars NODE_ENV=production,RATE_LIMIT_DELAY_MS=8000,MAX_RECIPE_FAILURES=15 \
        --set-secrets MONGODB_URI=mealprep360-mongodb-uri:latest,REDIS_HOST=mealprep360-redis-host:latest,REDIS_PORT=mealprep360-redis-port:latest,REDIS_PASSWORD=mealprep360-redis-password:latest,OPENAI_API_KEY=mealprep360-openai-key:latest,OPENAI_GPT_ID=mealprep360-openai-gpt-id:latest,API_KEY=mealprep360-api-key:latest
    
    log_success "Service deployed successfully!"
}

# Get service information
get_service_info() {
    log_info "Getting service information..."
    
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
    
    echo ""
    echo "🎉 Deployment Complete!"
    echo "======================="
    echo "Service Name: $SERVICE_NAME"
    echo "Region: $REGION"
    echo "Service URL: $SERVICE_URL"
    echo ""
    echo "🧪 Test your deployment:"
    echo "curl $SERVICE_URL/api/health"
    echo ""
    echo "📊 Monitor your service:"
    echo "https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME/metrics?project=$PROJECT_ID"
    echo ""
    echo "📝 View logs:"
    echo "gcloud logs tail /projects/$PROJECT_ID/logs/run.googleapis.com%2Fstdout --format='value(textPayload)'"
}

# Test the deployment
test_deployment() {
    log_info "Testing deployment..."
    
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
    
    # Test health endpoint
    if curl -f -s "$SERVICE_URL/api/health" > /dev/null; then
        log_success "Health check passed!"
    else
        log_error "Health check failed. Check the logs for issues."
        log_info "View logs with: gcloud logs tail /projects/$PROJECT_ID/logs/run.googleapis.com%2Fstdout"
    fi
}

# Main execution
main() {
    echo ""
    log_info "Starting deployment process..."
    echo ""
    
    check_prerequisites
    setup_project
    create_secrets
    deploy_service
    get_service_info
    test_deployment
    
    echo ""
    log_success "🎉 MealPrep360 Recipe Service is now running on Google Cloud Run!"
    echo ""
    log_info "Next steps:"
    echo "1. Update your DNS to point to: $SERVICE_URL"
    echo "2. Test recipe generation with your frontend"
    echo "3. Monitor performance in the Cloud Console"
    echo "4. Set up alerting for production use"
}

# Run the main function
main "$@" 
