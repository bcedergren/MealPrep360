#!/bin/bash

# MealPrep360 Recipe Service - Vercel Optimization Setup

set -e

echo "🚀 MealPrep360 Recipe Service - Vercel Optimization Setup"
echo "========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Show options
show_options() {
    echo ""
    echo "Choose your optimization approach:"
    echo ""
    echo "1. 🕐 Vercel Cron Jobs (Simplest)"
    echo "   - No additional infrastructure"
    echo "   - Free (up to 100 cron jobs/month)"
    echo "   - Limited to 10-second processing"
    echo "   - Good for: Low volume, simple setup"
    echo ""
    echo "2. 🚂 Vercel + Railway Worker (Recommended)"
    echo "   - Keep existing Vercel setup"
    echo "   - Add $5/month Railway worker"
    echo "   - Unlimited processing time"
    echo "   - Good for: Production use, reliable processing"
    echo ""
    echo "3. ☁️  Google Cloud Run (Advanced)"
    echo "   - Full migration to Google Cloud"
    echo "   - $35-53/month total cost"
    echo "   - Enterprise-grade features"
    echo "   - Good for: Scaling beyond 1000 recipes/day"
    echo ""
    echo "4. 📊 Show detailed comparison"
    echo ""
    echo "5. ❌ Exit"
    echo ""
}

# Setup Vercel Cron
setup_vercel_cron() {
    log_info "Setting up Vercel Cron Jobs..."
    
    # Check if cron endpoint exists
    if [ ! -f "api/cron/process-recipes.ts" ]; then
        log_error "Cron endpoint not found. Please run this script from the project root."
        return 1
    fi
    
    # Generate a random cron secret
    CRON_SECRET=$(openssl rand -hex 32)
    
    log_info "Setting up environment variables..."
    
    # Add cron secret to Vercel
    echo "Setting CRON_SECRET environment variable..."
    vercel env add CRON_SECRET production <<< "$CRON_SECRET"
    
    log_info "Deploying to Vercel..."
    vercel --prod
    
    log_success "Vercel Cron setup complete!"
    echo ""
    echo "📝 Your cron job will run every 30 seconds"
    echo "🔐 CRON_SECRET: $CRON_SECRET (saved to Vercel)"
    echo "📊 Monitor at: https://vercel.com/dashboard"
    echo ""
    echo "🧪 Test your cron job:"
    echo "curl -H \"Authorization: Bearer $CRON_SECRET\" https://your-app.vercel.app/api/cron/process-recipes"
}

# Setup Railway Worker
setup_railway_worker() {
    log_info "Setting up Railway Worker..."
    
    # Check if Railway CLI is installed
    if ! command -v railway &> /dev/null; then
        log_warning "Railway CLI not found. Installing..."
        npm install -g @railway/cli
    fi
    
    # Check if logged in
    if ! railway whoami &> /dev/null; then
        log_info "Please log in to Railway:"
        railway login
    fi
    
    # Run the Railway deployment script
    if [ -f "deploy-railway-worker.sh" ]; then
        chmod +x deploy-railway-worker.sh
        ./deploy-railway-worker.sh
    else
        log_error "Railway deployment script not found."
        return 1
    fi
}

# Setup Google Cloud Run
setup_google_cloud() {
    log_info "Setting up Google Cloud Run..."
    
    # Check if gcloud CLI is installed
    if ! command -v gcloud &> /dev/null; then
        log_error "Google Cloud CLI not found."
        log_info "Install from: https://cloud.google.com/sdk/docs/install"
        return 1
    fi
    
    # Check if logged in
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        log_info "Please log in to Google Cloud:"
        gcloud auth login
    fi
    
    # Run the GCP deployment script
    if [ -f "deploy-to-gcp.sh" ]; then
        chmod +x deploy-to-gcp.sh
        ./deploy-to-gcp.sh
    else
        log_error "GCP deployment script not found."
        return 1
    fi
}

# Show detailed comparison
show_comparison() {
    echo ""
    echo "📊 Detailed Comparison"
    echo "====================="
    echo ""
    echo "| Feature                | Vercel Cron | Railway Worker | Google Cloud |"
    echo "|------------------------|--------------|----------------|--------------|"
    echo "| Setup Time             | 5 minutes    | 15 minutes     | 30 minutes   |"
    echo "| Monthly Cost           | $0           | $5             | $35-53       |"
    echo "| Processing Time Limit  | 10 seconds   | Unlimited      | Unlimited    |"
    echo "| Scaling                | Limited      | Good           | Excellent    |"
    echo "| Infrastructure Changes | None         | Minimal        | Complete     |"
    echo "| Reliability            | Good         | Excellent      | Enterprise   |"
    echo "| Monitoring             | Basic        | Good           | Advanced     |"
    echo ""
    echo "🎯 Recommendations:"
    echo "• Starting out or low volume: Vercel Cron"
    echo "• Production use: Railway Worker"
    echo "• Enterprise scale: Google Cloud"
    echo ""
}

# Main menu
main_menu() {
    while true; do
        show_options
        read -p "Enter your choice (1-5): " choice
        
        case $choice in
            1)
                setup_vercel_cron
                break
                ;;
            2)
                setup_railway_worker
                break
                ;;
            3)
                setup_google_cloud
                break
                ;;
            4)
                show_comparison
                ;;
            5)
                log_info "Exiting..."
                exit 0
                ;;
            *)
                log_error "Invalid choice. Please enter 1-5."
                ;;
        esac
    done
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -d "src" ]; then
        log_error "Please run this script from the MealPrep360-RecipeService root directory."
        exit 1
    fi
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        log_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    # Check if logged in to Vercel
    if ! vercel whoami &> /dev/null; then
        log_info "Please log in to Vercel:"
        vercel login
    fi
    
    log_success "Prerequisites check passed"
}

# Main execution
main() {
    echo ""
    log_info "Welcome to the MealPrep360 Vercel Optimization Setup!"
    echo ""
    log_info "This script will help you optimize your current Vercel + MongoDB + Redis stack"
    log_info "to handle background job processing reliably."
    echo ""
    
    check_prerequisites
    main_menu
    
    echo ""
    log_success "🎉 Setup complete! Your recipe service is now optimized."
    echo ""
    log_info "Next steps:"
    echo "1. Test your setup with a few recipe generation requests"
    echo "2. Monitor the processing in your chosen platform"
    echo "3. Scale as needed based on usage"
    echo ""
    log_info "Need help? Check the documentation:"
    echo "• VERCEL_OPTIMIZATION_GUIDE.md"
    echo "• CONTAINER_DEPLOYMENT_GUIDE.md"
}

# Run the main function
main "$@" 
