# MealPrep360 Account Setup Script
# This script sets up everything in the MealPrep360 AWS account (588443559352)
# Run this after configuring: aws configure --profile mealprep360

$ErrorActionPreference = "Continue"

# Configuration
$MEALPREP_ACCOUNT_ID = "588443559352"
$AWS_REGION = "us-east-1"
$PROFILE = "mealprep360"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MealPrep360 AWS Account Setup" -ForegroundColor Cyan
Write-Host "Account: $MEALPREP_ACCOUNT_ID" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Verify we're in the correct account
Write-Host "Verifying AWS account..." -ForegroundColor Yellow
$currentAccount = aws sts get-caller-identity --profile $PROFILE --query Account --output text 2>&1

if ($LASTEXITCODE -ne 0)
{
    Write-Host "ERROR: Could not authenticate with AWS!" -ForegroundColor Red
    Write-Host "Please configure the mealprep360 profile:" -ForegroundColor Yellow
    Write-Host "  aws configure --profile mealprep360" -ForegroundColor Yellow
    exit 1
}

if ($currentAccount -ne $MEALPREP_ACCOUNT_ID)
{
    Write-Host "ERROR: Wrong AWS account!" -ForegroundColor Red
    Write-Host "Expected: $MEALPREP_ACCOUNT_ID" -ForegroundColor Red
    Write-Host "Got: $currentAccount" -ForegroundColor Red
    Write-Host "`nPlease configure the mealprep360 profile:" -ForegroundColor Yellow
    Write-Host "  aws configure --profile mealprep360" -ForegroundColor Yellow
    exit 1
}

Write-Host "Confirmed MealPrep360 account: $currentAccount`n" -ForegroundColor Green

# Get repository info
Write-Host "Getting GitHub repository info..." -ForegroundColor Yellow
$repoFull = gh repo view --json nameWithOwner -q .nameWithOwner
Write-Host "Repository: $repoFull`n" -ForegroundColor Green

# Step 1: Create OIDC Provider
Write-Host "Step 1: Creating OIDC Provider..." -ForegroundColor Cyan
$oidcArn = "arn:aws:iam::${MEALPREP_ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"
aws iam get-open-id-connect-provider --open-id-connect-provider-arn $oidcArn --profile $PROFILE 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0)
{
    Write-Host "OIDC provider already exists`n" -ForegroundColor Green
}
else
{
    Write-Host "Creating OIDC provider..." -ForegroundColor Yellow
    aws iam create-open-id-connect-provider --url https://token.actions.githubusercontent.com --client-id-list sts.amazonaws.com --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 --tags Key=Project,Value=MealPrep360 --profile $PROFILE
    Write-Host "OIDC provider created`n" -ForegroundColor Green
}

# Step 2: Create IAM Role
Write-Host "Step 2: Creating IAM Role..." -ForegroundColor Cyan

$trustPolicy = "{`"Version`":`"2012-10-17`",`"Statement`":[{`"Effect`":`"Allow`",`"Principal`":{`"Federated`":`"arn:aws:iam::${MEALPREP_ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com`"},`"Action`":`"sts:AssumeRoleWithWebIdentity`",`"Condition`":{`"StringEquals`":{`"token.actions.githubusercontent.com:aud`":`"sts.amazonaws.com`"},`"StringLike`":{`"token.actions.githubusercontent.com:sub`":`"repo:${repoFull}:*`"}}}]}"

$trustPolicyPath = "$env:TEMP\mealprep360-trust-policy.json"
$trustPolicy | Out-File -FilePath $trustPolicyPath -Encoding UTF8

$roleName = "GitHubActionsDeployRole"

# Check if role exists
aws iam get-role --role-name $roleName --profile $PROFILE 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0)
{
    Write-Host "IAM role already exists, updating trust policy..." -ForegroundColor Yellow
    aws iam update-assume-role-policy --role-name $roleName --policy-document file://$trustPolicyPath --profile $PROFILE
}
else
{
    Write-Host "Creating IAM role..." -ForegroundColor Yellow
    aws iam create-role --role-name $roleName --assume-role-policy-document file://$trustPolicyPath --description "Role for GitHub Actions to deploy MealPrep360 to ECS" --tags Key=Project,Value=MealPrep360 --profile $PROFILE
}

# Attach policies
Write-Host "Attaching IAM policies..." -ForegroundColor Yellow
aws iam attach-role-policy --role-name $roleName --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser --profile $PROFILE 2>&1 | Out-Null
aws iam attach-role-policy --role-name $roleName --policy-arn arn:aws:iam::aws:policy/AmazonECS_FullAccess --profile $PROFILE 2>&1 | Out-Null

$roleArn = aws iam get-role --role-name $roleName --query 'Role.Arn' --output text --profile $PROFILE
Write-Host "IAM role configured: $roleArn`n" -ForegroundColor Green

# Step 3: Update GitHub Secrets
Write-Host "Step 3: Updating GitHub Secrets..." -ForegroundColor Cyan
$MEALPREP_ACCOUNT_ID | gh secret set AWS_ACCOUNT_ID
$roleArn | gh secret set AWS_DEPLOY_ROLE_ARN
Write-Host "GitHub secrets updated`n" -ForegroundColor Green

# Step 4: Create ECR Repositories
Write-Host "Step 4: Creating ECR Repositories..." -ForegroundColor Cyan
$services = @("frontend","admin","api-gateway","recipe-service","mealplan-service","shopping-service","social-service","blog-service","websocket-server")

foreach ($service in $services)
{
    aws ecr describe-repositories --repository-names "mealprep360/$service" --region $AWS_REGION --profile $PROFILE 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0)
    {
        Write-Host "Repository mealprep360/$service already exists" -ForegroundColor Gray
    }
    else
    {
        Write-Host "Creating repository: mealprep360/$service..." -ForegroundColor Yellow
        aws ecr create-repository --repository-name "mealprep360/$service" --region $AWS_REGION --image-scanning-configuration scanOnPush=true --tags Key=Project,Value=MealPrep360 --profile $PROFILE 2>&1 | Out-Null
        Write-Host "Created mealprep360/$service" -ForegroundColor Green
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  AWS Account: $MEALPREP_ACCOUNT_ID" -ForegroundColor Green
Write-Host "  OIDC Provider: Created" -ForegroundColor Green
Write-Host "  IAM Role: $roleArn" -ForegroundColor Green
Write-Host "  GitHub Secrets: Updated" -ForegroundColor Green
Write-Host "  ECR Repositories: 9 created" -ForegroundColor Green

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "  1. Set AWS profile: `$env:AWS_PROFILE = 'mealprep360'" -ForegroundColor Yellow
Write-Host "  2. Deploy infrastructure: Follow AWS_INFRASTRUCTURE_SETUP.md" -ForegroundColor Yellow

Write-Host "`nECR Registry:" -ForegroundColor Cyan
Write-Host "  ${MEALPREP_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com" -ForegroundColor White

Remove-Item -Path $trustPolicyPath -ErrorAction SilentlyContinue
