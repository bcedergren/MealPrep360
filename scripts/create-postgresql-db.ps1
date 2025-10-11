#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Create PostgreSQL RDS instance for MealPrep360

.DESCRIPTION
    This script creates an RDS PostgreSQL database instance using CloudFormation.
    It generates a secure random password and stores it in AWS Secrets Manager.

.EXAMPLE
    .\create-postgresql-db.ps1
#>

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Creating PostgreSQL Database" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$STACK_NAME = "mealprep360-postgresql"
$REGION = "us-east-1"
$VPC_STACK = "mealprep360-vpc"

# Check if VPC stack exists
Write-Host "Checking VPC stack..." -ForegroundColor Yellow
aws cloudformation describe-stacks --stack-name $VPC_STACK --region $REGION 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ VPC stack '$VPC_STACK' not found. Please create it first." -ForegroundColor Red
    exit 1
}
Write-Host "✓ VPC stack found" -ForegroundColor Green

# Generate secure password
Write-Host ""
Write-Host "Generating secure database password..." -ForegroundColor Yellow
$PASSWORD = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
Write-Host "✓ Password generated (length: $($PASSWORD.Length))" -ForegroundColor Green

# Check if stack already exists
Write-Host ""
Write-Host "Checking if stack already exists..." -ForegroundColor Yellow
aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "⚠️  Stack '$STACK_NAME' already exists!" -ForegroundColor Yellow
    Write-Host "Please delete it first or use a different name." -ForegroundColor Yellow
    exit 1
}

# Create stack
$TEMPLATE_FILE = "aws/cloudformation/rds-postgresql.yaml"
if (-not (Test-Path $TEMPLATE_FILE)) {
    Write-Host "❌ Template file not found: $TEMPLATE_FILE" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Creating CloudFormation stack..." -ForegroundColor Cyan

aws cloudformation create-stack `
    --stack-name $STACK_NAME `
    --template-body file://$TEMPLATE_FILE `
    --parameters `
        ParameterKey=VPCStackName,ParameterValue=$VPC_STACK `
        ParameterKey=DBInstanceClass,ParameterValue=db.t4g.micro `
        ParameterKey=DBName,ParameterValue=mealprep360 `
        ParameterKey=DBUsername,ParameterValue=mealprep360admin `
        ParameterKey=DBPassword,ParameterValue=$PASSWORD `
        ParameterKey=AllocatedStorage,ParameterValue=20 `
    --region $REGION `
    --tags `
        Key=Project,Value=MealPrep360 `
        Key=Environment,Value=production `
        Key=ManagedBy,Value=CloudFormation

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create stack" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✓ Stack creation initiated" -ForegroundColor Green
Write-Host ""
Write-Host "Waiting for stack creation to complete..." -ForegroundColor Yellow
Write-Host "(This may take 10-15 minutes for RDS to provision)" -ForegroundColor Gray
Write-Host ""

aws cloudformation wait stack-create-complete `
    --stack-name $STACK_NAME `
    --region $REGION

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Stack creation failed or timed out" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check the CloudFormation console for details:" -ForegroundColor Yellow
    Write-Host "https://console.aws.amazon.com/cloudformation/home?region=$REGION#/stacks" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "PostgreSQL Database Created!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Get stack outputs
Write-Host "Retrieving database information..." -ForegroundColor Yellow
$OUTPUTS = aws cloudformation describe-stacks `
    --stack-name $STACK_NAME `
    --region $REGION `
    --query 'Stacks[0].Outputs' `
    --output json | ConvertFrom-Json

$DB_ENDPOINT = ($OUTPUTS | Where-Object { $_.OutputKey -eq "DBEndpoint" }).OutputValue
$DB_PORT = ($OUTPUTS | Where-Object { $_.OutputKey -eq "DBPort" }).OutputValue
$DB_NAME = ($OUTPUTS | Where-Object { $_.OutputKey -eq "DBName" }).OutputValue
$DB_SECRET_ARN = ($OUTPUTS | Where-Object { $_.OutputKey -eq "DBSecretArn" }).OutputValue

Write-Host ""
Write-Host "Database Details:" -ForegroundColor Cyan
Write-Host "  Endpoint:  $DB_ENDPOINT" -ForegroundColor White
Write-Host "  Port:      $DB_PORT" -ForegroundColor White
Write-Host "  Database:  $DB_NAME" -ForegroundColor White
Write-Host "  Username:  mealprep360admin" -ForegroundColor White
Write-Host "  Secret:    $DB_SECRET_ARN" -ForegroundColor White
Write-Host ""

# Create DATABASE_URL secret
Write-Host "Creating DATABASE_URL secret..." -ForegroundColor Yellow
$DATABASE_URL = "postgresql://mealprep360admin:$PASSWORD@${DB_ENDPOINT}:${DB_PORT}/${DB_NAME}"

aws secretsmanager create-secret `
    --name "mealprep360/database-url" `
    --description "PostgreSQL DATABASE_URL for Prisma" `
    --secret-string $DATABASE_URL `
    --region $REGION 2>$null

if ($LASTEXITCODE -ne 0) {
    # Secret might exist, try updating it
    aws secretsmanager put-secret-value `
        --secret-id "mealprep360/database-url" `
        --secret-string $DATABASE_URL `
        --region $REGION | Out-Null
}

Write-Host "✓ DATABASE_URL secret created/updated" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "1. Set DATABASE_URL in your .env file:" -ForegroundColor Yellow
Write-Host "   DATABASE_URL='$DATABASE_URL'" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Or retrieve it from Secrets Manager:" -ForegroundColor Yellow
Write-Host "   aws secretsmanager get-secret-value --secret-id mealprep360/database-url" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Run the Prisma setup script:" -ForegroundColor Yellow
Write-Host "   .\scripts\setup-prisma-schema.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "Database is ready for migration! 🎉" -ForegroundColor Green
Write-Host ""
