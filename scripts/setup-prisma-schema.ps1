#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Set up Prisma schema and create initial migration

.DESCRIPTION
    This script installs Prisma, copies the schema, and creates the initial database migration.

.EXAMPLE
    .\setup-prisma-schema.ps1
#>

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setting Up Prisma Schema" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "MealPrep360-API")) {
    Write-Host "❌ Please run this script from the repository root" -ForegroundColor Red
    exit 1
}

# Navigate to API service
Set-Location MealPrep360-API

# Check if Prisma is installed
Write-Host "Checking Prisma installation..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules/@prisma/client")) {
    Write-Host "Installing Prisma packages..." -ForegroundColor Yellow
    npm install -D prisma
    npm install @prisma/client
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Prisma" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
    Write-Host "✓ Prisma installed" -ForegroundColor Green
} else {
    Write-Host "✓ Prisma already installed" -ForegroundColor Green
}

# Create prisma directory if it doesn't exist
if (-not (Test-Path "prisma")) {
    Write-Host ""
    Write-Host "Creating prisma directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "prisma" | Out-Null
    Write-Host "✓ Directory created" -ForegroundColor Green
}

# Copy schema file
Write-Host ""
Write-Host "Copying Prisma schema..." -ForegroundColor Yellow
if (Test-Path "../prisma/schema.prisma") {
    Copy-Item "../prisma/schema.prisma" -Destination "prisma/schema.prisma" -Force
    Write-Host "✓ Schema copied" -ForegroundColor Green
} else {
    Write-Host "❌ Schema file not found at ../prisma/schema.prisma" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Check for DATABASE_URL
Write-Host ""
Write-Host "Checking DATABASE_URL..." -ForegroundColor Yellow
if (-not $env:DATABASE_URL) {
    Write-Host "⚠️  DATABASE_URL not set in environment" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Retrieving from AWS Secrets Manager..." -ForegroundColor Yellow
    
    $SECRET_JSON = aws secretsmanager get-secret-value `
        --secret-id "mealprep360/database-url" `
        --region us-east-1 `
        --query SecretString `
        --output text 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        $env:DATABASE_URL = $SECRET_JSON
        Write-Host "✓ DATABASE_URL retrieved from AWS" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Could not retrieve DATABASE_URL" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please set DATABASE_URL manually:" -ForegroundColor Yellow
        Write-Host '  $env:DATABASE_URL = "postgresql://user:pass@host:5432/dbname"' -ForegroundColor Gray
        Write-Host ""
        Write-Host "Or create the PostgreSQL database first:" -ForegroundColor Yellow
        Write-Host "  .\scripts\create-postgresql-db.ps1" -ForegroundColor Gray
        Write-Host ""
        Set-Location ..
        exit 1
    }
} else {
    Write-Host "✓ DATABASE_URL found" -ForegroundColor Green
}

# Create .env file
Write-Host ""
Write-Host "Creating .env file..." -ForegroundColor Yellow
@"
# Database
DATABASE_URL="$env:DATABASE_URL"

# Optional: Shadow database for development
# SHADOW_DATABASE_URL="postgresql://user:pass@host:5432/dbname_shadow"
"@ | Out-File -FilePath ".env" -Encoding UTF8
Write-Host "✓ .env file created" -ForegroundColor Green

# Generate Prisma Client
Write-Host ""
Write-Host "Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate Prisma Client" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "✓ Prisma Client generated" -ForegroundColor Green

# Prompt for migration
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Ready to create initial migration!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will:" -ForegroundColor Yellow
Write-Host "  1. Create all tables in PostgreSQL" -ForegroundColor White
Write-Host "  2. Set up relationships and indexes" -ForegroundColor White
Write-Host "  3. Create a migration history" -ForegroundColor White
Write-Host ""
$response = Read-Host "Create initial migration? (yes/no)"

if ($response -eq "yes") {
    Write-Host ""
    Write-Host "Creating initial migration..." -ForegroundColor Yellow
    npx prisma migrate dev --name init
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Migration failed" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
    
    Write-Host ""
    Write-Host "✓ Migration complete!" -ForegroundColor Green
    
    # Open Prisma Studio
    Write-Host ""
    $response = Read-Host "Open Prisma Studio to view database? (yes/no)"
    if ($response -eq "yes") {
        Write-Host ""
        Write-Host "Starting Prisma Studio..." -ForegroundColor Cyan
        Write-Host "Opening at http://localhost:5555" -ForegroundColor Gray
        Write-Host ""
        npx prisma studio
    }
} else {
    Write-Host ""
    Write-Host "Skipped migration." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Run manually later with:" -ForegroundColor Yellow
    Write-Host "  npx prisma migrate dev --name init" -ForegroundColor Gray
}

Set-Location ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Prisma Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Test Prisma connection:" -ForegroundColor Yellow
Write-Host "     cd MealPrep360-API" -ForegroundColor Gray
Write-Host '     npx prisma studio' -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Start migrating services:" -ForegroundColor Yellow
Write-Host "     See POSTGRESQL_MIGRATION_PLAN.md" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Update service code to use Prisma Client" -ForegroundColor Yellow
Write-Host ""

