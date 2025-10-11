#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Test the MealPrep360 AI Service

.DESCRIPTION
    This script helps you test the Python AI service locally.
#>

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing MealPrep360 AI Service" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Creating .env from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✓ Created .env file" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Edit .env and add your OPENAI_API_KEY!" -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "Press Enter when you've added your API key (or type 'skip' to continue without it)"
    if ($response -eq "skip") {
        Write-Host "⚠️  Continuing without API key - service may fail" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Starting AI Service with Docker Compose..." -ForegroundColor Cyan
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start service" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✓ Service started!" -ForegroundColor Green
Write-Host ""
Write-Host "Waiting for service to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test health endpoint
Write-Host ""
Write-Host "Testing health endpoint..." -ForegroundColor Cyan
$response = curl -s http://localhost:8000/health 2>$null
Write-Host $response
Write-Host ""

if ($response -like "*healthy*") {
    Write-Host "✓ Service is healthy!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Service might not be ready yet" -ForegroundColor Yellow
    Write-Host "Check logs with: docker logs mealprep360-ai-service" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "AI Service is Running!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Available endpoints:" -ForegroundColor Cyan
Write-Host "  Health:  http://localhost:8000/health" -ForegroundColor White
Write-Host "  Metrics: http://localhost:8000/metrics" -ForegroundColor White
Write-Host "  Docs:    http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "Test commands:" -ForegroundColor Cyan
Write-Host '  curl http://localhost:8000/health' -ForegroundColor Gray
Write-Host '  curl http://localhost:8000/metrics' -ForegroundColor Gray
Write-Host ""
Write-Host "View logs:" -ForegroundColor Cyan
Write-Host "  docker logs -f mealprep360-ai-service" -ForegroundColor Gray
Write-Host ""
Write-Host "Stop service:" -ForegroundColor Cyan
Write-Host "  docker-compose down" -ForegroundColor Gray
Write-Host ""

