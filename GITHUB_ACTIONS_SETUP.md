# GitHub Actions CI/CD Setup Guide

This guide will help you set up GitHub Actions for automated deployments to AWS ECS.

## 📋 Prerequisites

- GitHub repository with admin access
- AWS account with appropriate permissions
- AWS CLI installed and configured
- Git installed locally

## 🚀 Quick Setup (5 Steps)

### Step 1: Set Up AWS OIDC Provider

This allows GitHub Actions to authenticate with AWS without long-lived credentials.

```bash
# Create OIDC provider in AWS
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

### Step 2: Create IAM Role for GitHub Actions

Replace `YOUR_GITHUB_ORG` and `YOUR_REPO_NAME` with your values:

```bash
# Set variables
export GITHUB_ORG="YOUR_GITHUB_ORG"
export REPO_NAME="YOUR_REPO_NAME"
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Create trust policy
cat > github-trust-policy.json << EOF
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
          "token.actions.githubusercontent.com:sub": "repo:${GITHUB_ORG}/${REPO_NAME}:*"
        }
      }
    }
  ]
}
EOF

# Create IAM role
aws iam create-role \
  --role-name GitHubActionsDeployRole \
  --assume-role-policy-document file://github-trust-policy.json \
  --description "Role for GitHub Actions to deploy to ECS"

# Attach necessary policies
aws iam attach-role-policy \
  --role-name GitHubActionsDeployRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser

aws iam attach-role-policy \
  --role-name GitHubActionsDeployRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonECS_FullAccess

# Get the role ARN (save this for Step 3)
aws iam get-role \
  --role-name GitHubActionsDeployRole \
  --query 'Role.Arn' \
  --output text
```

### Step 3: Add GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these secrets:

| Secret Name | Value | Example |
|-------------|-------|---------|
| `AWS_ACCOUNT_ID` | Your AWS Account ID | `123456789012` |
| `AWS_DEPLOY_ROLE_ARN` | Role ARN from Step 2 | `arn:aws:iam::123456789012:role/GitHubActionsDeployRole` |

### Step 4: Configure GitHub Environments

1. Go to **Settings** → **Environments**
2. Click **New environment**
3. Create `production` environment:
   - Add required reviewers (yourself or team members)
   - Add deployment branch rule: `main` only
4. Create `staging` environment (no protection needed)

### Step 5: Enable Workflows

The workflows are already in your `.github/workflows/` directory and will activate automatically when:

- **CI** (`ci.yml`): Runs on pull requests and pushes to `develop`
- **Staging** (`deploy-staging.yml`): Runs when code is pushed to `develop`
- **Production** (`deploy-production.yml`): Runs when code is pushed to `main` (requires approval)

## ✅ Verification

### Test CI Pipeline

```bash
# Create a test branch
git checkout -b test/ci-setup

# Make a small change
echo "# CI Test" >> README.md
git add README.md
git commit -m "test: verify CI pipeline"
git push origin test/ci-setup

# Create a pull request on GitHub
# CI should run automatically
```

### Test Staging Deployment

```bash
# Merge to develop branch
git checkout develop
git merge test/ci-setup
git push origin develop

# Check GitHub Actions tab - staging deployment should start
# Monitor at: https://github.com/YOUR_ORG/YOUR_REPO/actions
```

### Test Production Deployment

```bash
# Merge to main (requires approval in production environment)
git checkout main
git merge develop
git push origin main

# Deployment will start but wait for approval
# Approve at: https://github.com/YOUR_ORG/YOUR_REPO/actions
```

## 📊 Monitoring Deployments

### GitHub Actions UI

1. Go to repository → **Actions** tab
2. View running workflows
3. Click on workflow to see detailed logs

### AWS Console

1. **ECR**: Check if images are being pushed
   ```
   AWS Console → ECR → Repositories → mealprep360/*
   ```

2. **ECS**: Monitor service deployments
   ```
   AWS Console → ECS → Clusters → mealprep360-cluster
   ```

3. **CloudWatch**: View application logs
   ```
   AWS Console → CloudWatch → Log Groups → /ecs/mealprep360/*
   ```

### AWS CLI

```bash
# Check latest workflow runs
gh run list --limit 5

# View specific run
gh run view <run-id>

# Check ECS service status
aws ecs describe-services \
  --cluster mealprep360-cluster \
  --services frontend api-gateway

# View recent deployments
aws ecs list-task-definitions \
  --family-prefix mealprep360 \
  --max-items 5

# Check ECR images
aws ecr describe-images \
  --repository-name mealprep360/frontend \
  --max-items 5
```

## 🔧 Advanced Configuration

### Deploy Specific Service

Use the manual workflow:

1. Go to **Actions** → **Deploy Single Service**
2. Click **Run workflow**
3. Select:
   - Service to deploy
   - Target environment
   - Whether to skip tests

### Create Release

```bash
# Create and push a version tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# This triggers production deployment with semantic versioning
```

### Emergency Hotfix

```bash
# 1. Create hotfix branch from main
git checkout -b hotfix/critical-fix main

# 2. Make the fix
# ... make changes ...
git commit -m "fix: critical security patch"
git push origin hotfix/critical-fix

# 3. Deploy directly using "Deploy Single Service" workflow
#    - Select the service
#    - Choose "production"
#    - Enable "skip_tests" if truly urgent
#    - Run workflow

# 4. After verification, merge back
git checkout main
git merge hotfix/critical-fix
git push origin main

git checkout develop
git merge hotfix/critical-fix
git push origin develop
```

## 🔐 Security Best Practices

### Rotate Credentials

```bash
# If using access keys (not recommended), rotate them regularly
aws iam create-access-key --user-name github-actions-user

# Update GitHub secrets with new keys
# Delete old keys
aws iam delete-access-key --user-name github-actions-user --access-key-id OLD_KEY_ID
```

### Audit Permissions

```bash
# Review IAM role permissions
aws iam list-attached-role-policies --role-name GitHubActionsDeployRole

# Check trust relationship
aws iam get-role --role-name GitHubActionsDeployRole
```

### Enable Branch Protection

1. Go to **Settings** → **Branches**
2. Add rule for `main`:
   - ✅ Require pull request reviews
   - ✅ Require status checks to pass (select CI workflow)
   - ✅ Require conversation resolution before merging
   - ✅ Require linear history
3. Add rule for `develop`:
   - ✅ Require status checks to pass

## 🐛 Troubleshooting

### "Role not found" Error

```bash
# Verify role exists
aws iam get-role --role-name GitHubActionsDeployRole

# Check trust relationship allows GitHub
aws iam get-role --role-name GitHubActionsDeployRole \
  --query 'Role.AssumeRolePolicyDocument'
```

### "Permission Denied" Error

```bash
# Check attached policies
aws iam list-attached-role-policies --role-name GitHubActionsDeployRole

# Attach missing policies
aws iam attach-role-policy \
  --role-name GitHubActionsDeployRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonECS_FullAccess
```

### ECR Login Fails

```bash
# Test ECR login
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com

# Check ECR permissions
aws ecr describe-repositories
```

### Deployment Stalls

```bash
# Check ECS service events
aws ecs describe-services \
  --cluster mealprep360-cluster \
  --services frontend \
  --query 'services[0].events[:5]'

# Check task failures
aws ecs list-tasks \
  --cluster mealprep360-cluster \
  --service-name frontend \
  --desired-status STOPPED

# Force new deployment
aws ecs update-service \
  --cluster mealprep360-cluster \
  --service frontend \
  --force-new-deployment
```

## 📚 Workflow Reference

### Branch Strategy

```
main (production)
  ↑
  └── develop (staging)
        ↑
        ├── feature/feature-name
        ├── fix/bug-name
        └── hotfix/critical-fix → main
```

### Deployment Flow

1. **Feature Development**
   ```bash
   feature/* → develop → staging deployment
   ```

2. **Release to Production**
   ```bash
   develop → main → production deployment (with approval)
   ```

3. **Hotfix**
   ```bash
   hotfix/* → main → production deployment
                  ↘ develop
   ```

## 🎯 Next Steps

1. ✅ Complete all 5 setup steps
2. ✅ Test CI pipeline with a pull request
3. ✅ Test staging deployment
4. ✅ Test production deployment (with approval)
5. ✅ Configure Slack/Discord notifications (optional)
6. ✅ Set up CloudWatch alarms
7. ✅ Document custom deployment procedures

## 📞 Support

- **GitHub Actions Issues**: Check `.github/workflows/README.md`
- **AWS Issues**: Check CloudWatch logs
- **General Help**: Review [DOCKER_DEPLOYMENT_GUIDE.md](DOCKER_DEPLOYMENT_GUIDE.md)

## 🔗 Additional Resources

- [GitHub Actions OIDC with AWS](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)
- [AWS ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [Docker Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)

---

**Congratulations!** 🎉 Your CI/CD pipeline is now set up and ready to automatically deploy to AWS!

