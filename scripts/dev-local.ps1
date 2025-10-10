# MealPrep360 Local Development Script (PowerShell)
# This script helps you run services locally for development

$ErrorActionPreference = "Stop"

Write-Host "🚀 MealPrep360 Local Development Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
function Test-Docker {
    try {
        docker info | Out-Null
        Write-Host "✅ Docker is running" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
        exit 1
    }
}

# Start infrastructure services
function Start-Infrastructure {
    Write-Host ""
    Write-Host "Starting infrastructure services (MongoDB, Redis)..." -ForegroundColor Yellow
    docker compose up -d mongodb redis
    Write-Host "✅ Infrastructure services started" -ForegroundColor Green
}

# Display service menu
function Show-Menu {
    Write-Host ""
    Write-Host "Select services to run:" -ForegroundColor Cyan
    Write-Host "1) Full Stack (All services via Docker)"
    Write-Host "2) Infrastructure + Frontend + API"
    Write-Host "3) Infrastructure + API + Recipe + MealPlan + Shopping"
    Write-Host "4) Infrastructure Only (MongoDB + Redis)"
    Write-Host "5) Custom Selection"
    Write-Host "6) Exit"
    Write-Host ""
}

# Start full Docker stack
function Start-FullDocker {
    Write-Host ""
    Write-Host "Starting full Docker stack..." -ForegroundColor Yellow
    docker compose up -d
    Write-Host ""
    Write-Host "✅ All services started via Docker" -ForegroundColor Green
    Write-Host ""
    Write-Host "Access points:" -ForegroundColor Cyan
    Write-Host "  Frontend:    http://localhost:3000"
    Write-Host "  Admin:       http://localhost:3008"
    Write-Host "  API Gateway: http://localhost:3001"
    Write-Host ""
    Write-Host "View logs: docker compose logs -f" -ForegroundColor Yellow
}

# Start frontend stack
function Start-FrontendStack {
    Start-Infrastructure
    Write-Host ""
    Write-Host "Starting Frontend + API locally..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Opening terminals for:" -ForegroundColor Cyan
    Write-Host "  - API Gateway (port 3001)"
    Write-Host "  - Frontend (port 3000)"
    Write-Host ""
    Write-Host "Opening new PowerShell windows..." -ForegroundColor Yellow
    
    # Open API Gateway in new window
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\..' ; npm run dev:api"
    
    # Wait a bit for API to start
    Start-Sleep -Seconds 2
    
    # Open Frontend in new window
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\..' ; npm run dev:frontend"
    
    Write-Host ""
    Write-Host "✅ Services started in separate windows" -ForegroundColor Green
}

# Start backend stack
function Start-BackendStack {
    Start-Infrastructure
    Write-Host ""
    Write-Host "Starting Backend services locally..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Opening terminals for:" -ForegroundColor Cyan
    Write-Host "  - API Gateway (port 3001)"
    Write-Host "  - Recipe Service (port 3002)"
    Write-Host "  - Meal Plan Service (port 3003)"
    Write-Host "  - Shopping Service (port 3004)"
    Write-Host ""
    Write-Host "Opening new PowerShell windows..." -ForegroundColor Yellow
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\..' ; npm run dev:api"
    Start-Sleep -Seconds 1
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\..' ; npm run dev:recipe"
    Start-Sleep -Seconds 1
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\..' ; npm run dev:mealplan"
    Start-Sleep -Seconds 1
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\..' ; npm run dev:shopping"
    
    Write-Host ""
    Write-Host "✅ Services started in separate windows" -ForegroundColor Green
}

# Custom selection
function Start-Custom {
    Start-Infrastructure
    Write-Host ""
    Write-Host "Available services to run locally:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  npm run dev:frontend   - Frontend (port 3000)"
    Write-Host "  npm run dev:admin      - Admin Panel (port 3008)"
    Write-Host "  npm run dev:api        - API Gateway (port 3001)"
    Write-Host "  npm run dev:recipe     - Recipe Service (port 3002)"
    Write-Host "  npm run dev:mealplan   - Meal Plan Service (port 3003)"
    Write-Host "  npm run dev:shopping   - Shopping Service (port 3004)"
    Write-Host "  npm run dev:social     - Social Service (port 3005)"
    Write-Host "  npm run dev:blog       - Blog Service (port 3006)"
    Write-Host "  npm run dev:websocket  - WebSocket Server (port 3007)"
    Write-Host ""
    Write-Host "Run these commands in separate terminals as needed." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Example: Open new PowerShell and run 'npm run dev:api'" -ForegroundColor Green
}

# Main script
function Main {
    Test-Docker
    
    Show-Menu
    $choice = Read-Host "Enter your choice [1-6]"
    
    switch ($choice) {
        "1" {
            Start-FullDocker
        }
        "2" {
            Start-FrontendStack
        }
        "3" {
            Start-BackendStack
        }
        "4" {
            Start-Infrastructure
            Write-Host ""
            Write-Host "✅ Infrastructure ready. MongoDB and Redis are running." -ForegroundColor Green
            Write-Host ""
            Write-Host "You can now start services manually:" -ForegroundColor Cyan
            Write-Host "  npm run dev:api"
            Write-Host "  npm run dev:frontend"
            Write-Host "  etc..."
        }
        "5" {
            Start-Custom
        }
        "6" {
            Write-Host "Exiting..." -ForegroundColor Yellow
            exit 0
        }
        default {
            Write-Host "❌ Invalid choice. Please select 1-6." -ForegroundColor Red
            exit 1
        }
    }
}

# Run the main function
Main


