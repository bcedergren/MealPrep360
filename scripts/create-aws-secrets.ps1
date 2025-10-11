# Create AWS Secrets Manager Secrets for MealPrep360
# Run this after database stack completes

param(
    [string]$ClerkPublishable = "",
    [string]$ClerkSecret = "",
    [string]$OpenAIKey = ""
)

$ErrorActionPreference = "Continue"
$PROFILE = "mealprep360"
$AWS_REGION = "us-east-1"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Creating AWS Secrets for MealPrep360" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get database endpoints
Write-Host "Getting database endpoints..." -ForegroundColor Yellow

$DOCDB_ENDPOINT = aws cloudformation describe-stacks --stack-name mealprep360-database --query 'Stacks[0].Outputs[?OutputKey==``DocumentDBEndpoint``].OutputValue' --output text --region $AWS_REGION --profile $PROFILE

$REDIS_ENDPOINT = aws cloudformation describe-stacks --stack-name mealprep360-database --query 'Stacks[0].Outputs[?OutputKey==``RedisEndpoint``].OutputValue' --output text --region $AWS_REGION --profile $PROFILE

Write-Host "DocumentDB: $DOCDB_ENDPOINT" -ForegroundColor Green
Write-Host "Redis: $REDIS_ENDPOINT" -ForegroundColor Green
Write-Host ""

# Database password
$DB_PASSWORD = "MealPrep360SecurePass2024!"

# Create MongoDB connection string
$MONGODB_URI = "mongodb://dbadmin:${DB_PASSWORD}@${DOCDB_ENDPOINT}:27017/mealprep360?ssl=true&replicaSet=rs0&readPreference=secondaryPreferred"

Write-Host "Creating database secrets..." -ForegroundColor Yellow
aws secretsmanager create-secret --name mealprep360/mongodb-uri --secret-string $MONGODB_URI --region $AWS_REGION --profile $PROFILE 2>&1 | Out-Null
Write-Host "  Created: mealprep360/mongodb-uri" -ForegroundColor Green

aws secretsmanager create-secret --name mealprep360/redis-url --secret-string "redis://${REDIS_ENDPOINT}:6379" --region $AWS_REGION --profile $PROFILE 2>&1 | Out-Null
Write-Host "  Created: mealprep360/redis-url" -ForegroundColor Green
Write-Host ""

# Generate service API keys
Write-Host "Generating service API keys..." -ForegroundColor Yellow
$services = @("recipe","mealplan","shopping","social","blog","websocket")

foreach ($service in $services)
{
    $bytes = New-Object Byte[] 32
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $apiKey = [System.BitConverter]::ToString($bytes).Replace("-","").ToLower()
    
    aws secretsmanager create-secret --name "mealprep360/${service}-api-key" --secret-string $apiKey --region $AWS_REGION --profile $PROFILE 2>&1 | Out-Null
    Write-Host "  Created: mealprep360/${service}-api-key" -ForegroundColor Green
}
Write-Host ""

# Generate JWT secret
Write-Host "Generating JWT secret..." -ForegroundColor Yellow
$jwtBytes = New-Object Byte[] 64
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($jwtBytes)
$jwtSecret = [System.BitConverter]::ToString($jwtBytes).Replace("-","").ToLower()

aws secretsmanager create-secret --name mealprep360/jwt-secret --secret-string $jwtSecret --region $AWS_REGION --profile $PROFILE 2>&1 | Out-Null
Write-Host "  Created: mealprep360/jwt-secret" -ForegroundColor Green
Write-Host ""

# Get ALB DNS
$ALB_DNS = aws cloudformation describe-stacks --stack-name mealprep360-ecs --query 'Stacks[0].Outputs[?OutputKey==``ALBDNSName``].OutputValue' --output text --region $AWS_REGION --profile $PROFILE

# Create API URL secrets
Write-Host "Creating API URL secrets..." -ForegroundColor Yellow
aws secretsmanager create-secret --name mealprep360/api-url --secret-string "http://${ALB_DNS}" --region $AWS_REGION --profile $PROFILE 2>&1 | Out-Null
Write-Host "  Created: mealprep360/api-url" -ForegroundColor Green

aws secretsmanager create-secret --name mealprep360/ws-url --secret-string "ws://${ALB_DNS}" --region $AWS_REGION --profile $PROFILE 2>&1 | Out-Null
Write-Host "  Created: mealprep360/ws-url" -ForegroundColor Green
Write-Host ""

# Clerk keys (use parameters or prompt)
Write-Host "Creating Clerk secrets..." -ForegroundColor Yellow
if ($ClerkPublishable -eq "")
{
    $ClerkPublishable = Read-Host "Enter Clerk Publishable Key"
}
if ($ClerkSecret -eq "")
{
    $ClerkSecret = Read-Host "Enter Clerk Secret Key"
}

aws secretsmanager create-secret --name mealprep360/clerk-publishable-key --secret-string $ClerkPublishable --region $AWS_REGION --profile $PROFILE 2>&1 | Out-Null
Write-Host "  Created: mealprep360/clerk-publishable-key" -ForegroundColor Green

aws secretsmanager create-secret --name mealprep360/clerk-secret-key --secret-string $ClerkSecret --region $AWS_REGION --profile $PROFILE 2>&1 | Out-Null
Write-Host "  Created: mealprep360/clerk-secret-key" -ForegroundColor Green
Write-Host ""

# OpenAI key
Write-Host "Creating OpenAI secret..." -ForegroundColor Yellow
if ($OpenAIKey -eq "")
{
    $OpenAIKey = Read-Host "Enter OpenAI API Key"
}

aws secretsmanager create-secret --name mealprep360/openai-api-key --secret-string $OpenAIKey --region $AWS_REGION --profile $PROFILE 2>&1 | Out-Null
Write-Host "  Created: mealprep360/openai-api-key" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All Secrets Created!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Database Endpoints:" -ForegroundColor Cyan
Write-Host "  DocumentDB: $DOCDB_ENDPOINT" -ForegroundColor White
Write-Host "  Redis: $REDIS_ENDPOINT" -ForegroundColor White
Write-Host "  Username: dbadmin" -ForegroundColor White
Write-Host ""

Write-Host "Load Balancer:" -ForegroundColor Cyan
Write-Host "  $ALB_DNS" -ForegroundColor White
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Update ECS task definitions" -ForegroundColor White
Write-Host "  2. Create ECS services" -ForegroundColor White
Write-Host "  3. Deploy via GitHub Actions!" -ForegroundColor White
