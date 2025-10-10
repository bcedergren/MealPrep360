# MealPrep360 AWS Infrastructure Setup Script (PowerShell)
# This script sets up the AWS infrastructure for MealPrep360

$ErrorActionPreference = "Stop"

# Colors
function Write-Header($message) {
    Write-Host "`n========================================" -ForegroundColor Blue
    Write-Host $message -ForegroundColor Blue
    Write-Host "========================================`n" -ForegroundColor Blue
}

function Write-Success($message) {
    Write-Host "✓ $message" -ForegroundColor Green
}

function Write-Warning($message) {
    Write-Host "⚠ $message" -ForegroundColor Yellow
}

function Write-Error($message) {
    Write-Host "✗ $message" -ForegroundColor Red
}

function Write-Info($message) {
    Write-Host "ℹ $message" -ForegroundColor Cyan
}

# Check prerequisites
Write-Header "Checking Prerequisites"

if (!(Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Error "AWS CLI is not installed. Please install it first:"
    Write-Host "  https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
}
Write-Success "AWS CLI installed"

if (!(Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Error "GitHub CLI is not installed. Please install it first:"
    Write-Host "  https://cli.github.com/"
    exit 1
}
Write-Success "GitHub CLI installed"

# Check AWS authentication
try {
    $null = aws sts get-caller-identity 2>$null
    Write-Success "AWS CLI authenticated"
} catch {
    Write-Error "Not authenticated with AWS. Run: aws configure"
    exit 1
}

# Check GitHub authentication
try {
    gh auth status 2>$null
    Write-Success "GitHub CLI authenticated"
} catch {
    Write-Error "Not authenticated with GitHub. Run: gh auth login"
    exit 1
}

# Get repository information
Write-Header "Repository Information"

$repoFull = gh repo view --json nameWithOwner -q .nameWithOwner
$repoOwner = $repoFull.Split('/')[0]
$repoName = $repoFull.Split('/')[1]

Write-Info "Repository: $repoFull"
Write-Info "Owner: $repoOwner"
Write-Info "Name: $repoName"

# Get AWS account ID
$awsAccountId = aws sts get-caller-identity --query Account --output text
$awsRegion = if ($env:AWS_REGION) { $env:AWS_REGION } else { "us-east-1" }

Write-Info "AWS Account ID: $awsAccountId"
Write-Info "AWS Region: $awsRegion"

$continue = Read-Host "Continue with setup? [y/N]"
if ($continue -ne 'y' -and $continue -ne 'Y') {
    exit 0
}

# Step 1: Create OIDC Provider
Write-Header "Step 1: Setting up AWS OIDC Provider"

$oidcProviderArn = "arn:aws:iam::${awsAccountId}:oidc-provider/token.actions.githubusercontent.com"

try {
    $null = aws iam get-open-id-connect-provider --open-id-connect-provider-arn $oidcProviderArn 2>$null
    Write-Success "OIDC provider already exists"
} catch {
    Write-Info "Creating OIDC provider..."
    aws iam create-open-id-connect-provider `
        --url https://token.actions.githubusercontent.com `
        --client-id-list sts.amazonaws.com `
        --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 `
        --tags Key=Project,Value=MealPrep360 Key=Purpose,Value=GitHubActions
    Write-Success "OIDC provider created"
}

# Step 2: Create IAM Role
Write-Header "Step 2: Creating IAM Role for GitHub Actions"

$roleName = "GitHubActionsDeployRole"

# Create trust policy
$trustPolicy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::${awsAccountId}:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:${repoFull}:*"
        }
      }
    }
  ]
}
"@

$trustPolicyPath = "$env:TEMP\github-trust-policy.json"
$trustPolicy | Out-File -FilePath $trustPolicyPath -Encoding UTF8

try {
    $null = aws iam get-role --role-name $roleName 2>$null
    Write-Warning "Role $roleName already exists, updating trust policy..."
    aws iam update-assume-role-policy `
        --role-name $roleName `
        --policy-document file://$trustPolicyPath
} catch {
    Write-Info "Creating IAM role..."
    aws iam create-role `
        --role-name $roleName `
        --assume-role-policy-document file://$trustPolicyPath `
        --description "Role for GitHub Actions to deploy MealPrep360 to ECS" `
        --tags Key=Project,Value=MealPrep360 Key=Purpose,Value=GitHubActions
}

# Attach policies
Write-Info "Attaching policies to role..."

$policies = @(
    "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser",
    "arn:aws:iam::aws:policy/AmazonECS_FullAccess"
)

foreach ($policy in $policies) {
    try {
        aws iam attach-role-policy --role-name $roleName --policy-arn $policy
    } catch {
        # Policy might already be attached
    }
}

Write-Success "IAM role configured"

# Get role ARN
$roleArn = aws iam get-role --role-name $roleName --query 'Role.Arn' --output text
Write-Info "Role ARN: $roleArn"

# Step 3: Add GitHub Secrets
Write-Header "Step 3: Adding GitHub Secrets"

Write-Info "Adding AWS_ACCOUNT_ID secret..."
$awsAccountId | gh secret set AWS_ACCOUNT_ID

Write-Info "Adding AWS_DEPLOY_ROLE_ARN secret..."
$roleArn | gh secret set AWS_DEPLOY_ROLE_ARN

Write-Success "GitHub secrets added"

# Step 4: Create GitHub Environments
Write-Header "Step 4: Creating GitHub Environments"

Write-Info "Creating production environment..."
$userId = gh api user -q .id
try {
    gh api --method PUT `
        "repos/${repoFull}/environments/production" `
        -f wait_timer=0 `
        -F prevent_self_review=true `
        -F "reviewers[0][type]=User" `
        -F "reviewers[0][id]=$userId"
} catch {
    Write-Warning "Could not configure production environment (may need admin access)"
}

Write-Info "Creating staging environment..."
try {
    gh api --method PUT `
        "repos/${repoFull}/environments/staging" `
        -f wait_timer=0
} catch {
    Write-Warning "Could not create staging environment"
}

Write-Success "GitHub environments created"

# Step 5: Verify Setup
Write-Header "Step 5: Verifying Setup"

Write-Info "Checking IAM role..."
try {
    $null = aws iam get-role --role-name $roleName 2>$null
    Write-Success "IAM role exists"
} catch {
    Write-Error "IAM role not found"
}

Write-Info "Checking GitHub secrets..."
$secrets = gh secret list
if ($secrets -match "AWS_ACCOUNT_ID") {
    Write-Success "AWS_ACCOUNT_ID secret set"
} else {
    Write-Error "AWS_ACCOUNT_ID secret not found"
}

if ($secrets -match "AWS_DEPLOY_ROLE_ARN") {
    Write-Success "AWS_DEPLOY_ROLE_ARN secret set"
} else {
    Write-Error "AWS_DEPLOY_ROLE_ARN secret not found"
}

# Cleanup
Remove-Item -Path $trustPolicyPath -ErrorAction SilentlyContinue

# Summary
Write-Header "Setup Complete! 🎉"

Write-Host "`nYour CI/CD pipeline is now configured!`n" -ForegroundColor Green
Write-Host "Next steps:"
Write-Host "1. Push to 'develop' branch to trigger staging deployment"
Write-Host "2. Push to 'main' branch to trigger production deployment (with approval)"
Write-Host "3. Monitor deployments at: https://github.com/${repoFull}/actions"
Write-Host ""
Write-Host "Quick test:"
Write-Host "  git checkout -b test/ci-setup"
Write-Host "  git commit --allow-empty -m 'test: CI/CD setup'"
Write-Host "  git push origin test/ci-setup"
Write-Host "  # Create PR and watch CI run!"
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "  - Setup Guide: GITHUB_ACTIONS_SETUP.md"
Write-Host "  - Quick Reference: CICD_QUICK_REFERENCE.md"
Write-Host "  - Workflow Details: .github/workflows/README.md"

