#!/bin/bash

# MealPrep360 GitHub Actions CI/CD Setup Script
# This script configures GitHub Actions with AWS OIDC authentication

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check prerequisites
print_header "Checking Prerequisites"

if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first:"
    echo "  https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi
print_status "AWS CLI installed"

if ! command -v gh &> /dev/null; then
    print_error "GitHub CLI is not installed. Please install it first:"
    echo "  https://cli.github.com/"
    exit 1
fi
print_status "GitHub CLI installed"

# Check if authenticated
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "Not authenticated with AWS. Run: aws configure"
    exit 1
fi
print_status "AWS CLI authenticated"

if ! gh auth status &> /dev/null; then
    print_error "Not authenticated with GitHub. Run: gh auth login"
    exit 1
fi
print_status "GitHub CLI authenticated"

# Get repository information
print_header "Repository Information"

REPO_FULL=$(gh repo view --json nameWithOwner -q .nameWithOwner)
REPO_NAME=$(echo $REPO_FULL | cut -d'/' -f2)
REPO_OWNER=$(echo $REPO_FULL | cut -d'/' -f1)

print_info "Repository: $REPO_FULL"
print_info "Owner: $REPO_OWNER"
print_info "Name: $REPO_NAME"

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=${AWS_REGION:-us-east-1}

print_info "AWS Account ID: $AWS_ACCOUNT_ID"
print_info "AWS Region: $AWS_REGION"

read -p "$(echo -e ${YELLOW}Continue with setup? [y/N]:${NC} )" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Step 1: Create OIDC Provider
print_header "Step 1: Setting up AWS OIDC Provider"

if aws iam get-open-id-connect-provider \
    --open-id-connect-provider-arn "arn:aws:iam::${AWS_ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com" \
    &> /dev/null; then
    print_status "OIDC provider already exists"
else
    print_info "Creating OIDC provider..."
    aws iam create-open-id-connect-provider \
        --url https://token.actions.githubusercontent.com \
        --client-id-list sts.amazonaws.com \
        --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 \
        --tags Key=Project,Value=MealPrep360 Key=Purpose,Value=GitHubActions
    print_status "OIDC provider created"
fi

# Step 2: Create IAM Role
print_header "Step 2: Creating IAM Role for GitHub Actions"

ROLE_NAME="GitHubActionsDeployRole"

# Create trust policy
cat > /tmp/github-trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::${AWS_ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:${REPO_FULL}:*"
        }
      }
    }
  ]
}
EOF

if aws iam get-role --role-name $ROLE_NAME &> /dev/null; then
    print_warning "Role $ROLE_NAME already exists, updating trust policy..."
    aws iam update-assume-role-policy \
        --role-name $ROLE_NAME \
        --policy-document file:///tmp/github-trust-policy.json
else
    print_info "Creating IAM role..."
    aws iam create-role \
        --role-name $ROLE_NAME \
        --assume-role-policy-document file:///tmp/github-trust-policy.json \
        --description "Role for GitHub Actions to deploy MealPrep360 to ECS" \
        --tags Key=Project,Value=MealPrep360 Key=Purpose,Value=GitHubActions
fi

# Attach policies
print_info "Attaching policies to role..."

POLICIES=(
    "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser"
    "arn:aws:iam::aws:policy/AmazonECS_FullAccess"
)

for policy in "${POLICIES[@]}"; do
    aws iam attach-role-policy \
        --role-name $ROLE_NAME \
        --policy-arn $policy || true
done

print_status "IAM role configured"

# Get role ARN
ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text)
print_info "Role ARN: $ROLE_ARN"

# Step 3: Add GitHub Secrets
print_header "Step 3: Adding GitHub Secrets"

print_info "Adding AWS_ACCOUNT_ID secret..."
echo -n "$AWS_ACCOUNT_ID" | gh secret set AWS_ACCOUNT_ID

print_info "Adding AWS_DEPLOY_ROLE_ARN secret..."
echo -n "$ROLE_ARN" | gh secret set AWS_DEPLOY_ROLE_ARN

print_status "GitHub secrets added"

# Step 4: Create GitHub Environments
print_header "Step 4: Creating GitHub Environments"

print_info "Creating production environment..."
gh api --method PUT \
    "repos/${REPO_FULL}/environments/production" \
    -f wait_timer=0 \
    -F prevent_self_review=true \
    -F reviewers[0][type]=User \
    -F reviewers[0][id]=$(gh api user -q .id) || true

print_info "Creating staging environment..."
gh api --method PUT \
    "repos/${REPO_FULL}/environments/staging" \
    -f wait_timer=0 || true

print_status "GitHub environments created"

# Step 5: Enable Branch Protection
print_header "Step 5: Setting up Branch Protection"

read -p "$(echo -e ${YELLOW}Enable branch protection for main? [y/N]:${NC} )" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Enabling branch protection for main..."
    gh api --method PUT \
        "repos/${REPO_FULL}/branches/main/protection" \
        -f required_status_checks[strict]=true \
        -f required_status_checks[contexts][]=CI \
        -f required_pull_request_reviews[required_approving_review_count]=1 \
        -f required_pull_request_reviews[dismiss_stale_reviews]=true \
        -f enforce_admins=false \
        -f restrictions=null || print_warning "Could not enable branch protection (may need admin access)"
    print_status "Branch protection enabled for main"
fi

# Step 6: Verify Setup
print_header "Step 6: Verifying Setup"

print_info "Checking IAM role..."
if aws iam get-role --role-name $ROLE_NAME &> /dev/null; then
    print_status "IAM role exists"
else
    print_error "IAM role not found"
fi

print_info "Checking GitHub secrets..."
if gh secret list | grep -q "AWS_ACCOUNT_ID"; then
    print_status "AWS_ACCOUNT_ID secret set"
else
    print_error "AWS_ACCOUNT_ID secret not found"
fi

if gh secret list | grep -q "AWS_DEPLOY_ROLE_ARN"; then
    print_status "AWS_DEPLOY_ROLE_ARN secret set"
else
    print_error "AWS_DEPLOY_ROLE_ARN secret not found"
fi

# Cleanup
rm -f /tmp/github-trust-policy.json

# Summary
print_header "Setup Complete! 🎉"

echo -e "${GREEN}Your CI/CD pipeline is now configured!${NC}\n"
echo "Next steps:"
echo "1. Push to 'develop' branch to trigger staging deployment"
echo "2. Push to 'main' branch to trigger production deployment (with approval)"
echo "3. Monitor deployments at: https://github.com/${REPO_FULL}/actions"
echo ""
echo "Quick test:"
echo "  git checkout -b test/ci-setup"
echo "  git commit --allow-empty -m 'test: CI/CD setup'"
echo "  git push origin test/ci-setup"
echo "  # Create PR and watch CI run!"
echo ""
echo -e "${BLUE}Documentation:${NC}"
echo "  - Setup Guide: GITHUB_ACTIONS_SETUP.md"
echo "  - Quick Reference: CICD_QUICK_REFERENCE.md"
echo "  - Workflow Details: .github/workflows/README.md"

