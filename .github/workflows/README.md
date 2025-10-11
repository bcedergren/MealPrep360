# GitHub Actions CI/CD Workflows

## Overview

This directory contains automated CI/CD pipelines for MealPrep360 that handle building, testing, and deploying Docker containers to AWS ECS.

## Workflows

### 1. CI - Build and Test (`ci.yml`)

**Triggers:**
- Pull requests to `main` or `develop`
- Pushes to `develop`

**What it does:**
- Runs tests for all services
- Validates Docker builds
- Performs security scanning with Trivy
- Ensures code quality before merging

### 2. Deploy to Staging (`deploy-staging.yml`)

**Triggers:**
- Pushes to `develop` branch
- Manual dispatch

**What it does:**
- Builds Docker images for all services
- Pushes images to ECR with staging tags
- Deploys to staging ECS cluster
- Waits for service stability

### 3. Deploy to Production (`deploy-production.yml`)

**Triggers:**
- Pushes to `main` branch
- Version tags (e.g., `v1.0.0`)
- Manual dispatch (with approval)

**What it does:**
- Runs comprehensive tests
- Builds and scans Docker images
- Deploys to production ECS with approval
- Runs smoke tests
- Automatic rollback on failure

**Features:**
- Sequential deployment (2 services at a time)
- Production environment protection
- Health checks after deployment
- Automatic rollback on failure

### 4. Deploy Single Service (`deploy-single-service.yml`)

**Triggers:**
- Manual dispatch only

**What it does:**
- Deploys a single service to staging or production
- Useful for hotfixes or targeted updates
- Optional test skipping for emergencies

**Use cases:**
- Hotfix deployment
- Individual service updates
- Testing specific changes

### 5. Cleanup ECR Images (`cleanup-ecr.yml`)

**Triggers:**
- Weekly schedule (Sundays at 2 AM UTC)
- Manual dispatch

**What it does:**
- Removes old ECR images (keeps last 10)
- Reduces storage costs
- Maintains clean registry

## Setup Instructions

### 1. Configure AWS Credentials (OIDC - Recommended)

Create an IAM role for GitHub Actions with OIDC:

```bash
# Create the trust policy
cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_ORG/YOUR_REPO:*"
        }
      }
    }
  ]
}
EOF

# Create the IAM role
aws iam create-role \
  --role-name GitHubActionsDeployRole \
  --assume-role-policy-document file://trust-policy.json

# Attach necessary policies
aws iam attach-role-policy \
  --role-name GitHubActionsDeployRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser

aws iam attach-role-policy \
  --role-name GitHubActionsDeployRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonECS_FullAccess
```

### 2. Add GitHub Secrets

Go to your repository settings → Secrets and variables → Actions, and add:

#### Required Secrets:
- `AWS_ACCOUNT_ID`: Your AWS account ID (e.g., 123456789012)
- `AWS_DEPLOY_ROLE_ARN`: ARN of the IAM role created above

#### Optional (for legacy credential method):
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key

### 3. Enable GitHub OIDC Provider in AWS

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

### 4. Configure Branch Protection

1. Go to Settings → Branches
2. Add rule for `main`:
   - Require pull request reviews
   - Require status checks (CI workflow)
   - Require approval before merging

### 5. Set Up Environments

1. Go to Settings → Environments
2. Create `production` environment:
   - Add required reviewers
   - Enable deployment protection rules
3. Create `staging` environment (optional protection)

## Usage

### Automatic Deployments

**To Staging:**
```bash
git checkout develop
git commit -m "feat: add new feature"
git push origin develop
# Automatically triggers staging deployment
```

**To Production:**
```bash
git checkout main
git merge develop
git push origin main
# Automatically triggers production deployment (with approval)
```

### Manual Deployments

**Deploy Single Service:**
1. Go to Actions tab
2. Select "Deploy Single Service"
3. Click "Run workflow"
4. Choose service and environment
5. Run

**Deploy with Tag:**
```bash
git tag v1.0.0
git push origin v1.0.0
# Triggers production deployment
```

### Emergency Hotfix

```bash
# 1. Create hotfix branch
git checkout -b hotfix/critical-fix main

# 2. Make fixes
git commit -m "fix: critical security issue"

# 3. Deploy single service (skip tests if needed)
# Use GitHub Actions UI to deploy with skip_tests=true

# 4. Merge back
git checkout main
git merge hotfix/critical-fix
git push origin main
```

## Workflow Diagram

```
Pull Request → CI Tests → Merge to develop → Deploy to Staging
                                                      ↓
                                              Test in Staging
                                                      ↓
                                          Merge to main (with approval)
                                                      ↓
                                            Deploy to Production
                                                      ↓
                                              Smoke Tests
                                                      ↓
                                         Success ✅ or Rollback 🔄
```

## Monitoring Deployments

### View Workflow Status

```bash
# Using GitHub CLI
gh run list --workflow=deploy-production.yml
gh run view <run-id>
```

### Check ECS Deployment

```bash
# Check service status
aws ecs describe-services \
  --cluster mealprep360-cluster \
  --services frontend \
  --region us-east-1

# View recent deployments
aws ecs list-tasks \
  --cluster mealprep360-cluster \
  --service-name frontend \
  --region us-east-1
```

### View Logs

```bash
# CloudWatch logs via AWS CLI
aws logs tail /ecs/mealprep360/frontend --follow

# Or use GitHub Actions logs
gh run view <run-id> --log
```

## Troubleshooting

### Deployment Fails

1. **Check workflow logs:**
   - Go to Actions tab
   - Click on failed workflow
   - Review error messages

2. **Check ECS service:**
   ```bash
   aws ecs describe-services \
     --cluster mealprep360-cluster \
     --services <service-name>
   ```

3. **Check task logs:**
   ```bash
   aws logs tail /ecs/mealprep360/<service-name> --follow
   ```

### Authentication Issues

If you see AWS authentication errors:

1. Verify secrets are set correctly
2. Check IAM role permissions
3. Verify OIDC provider is configured
4. Check trust relationship in IAM role

### ECR Push Fails

```bash
# Test ECR login manually
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com
```

### Service Won't Update

If ECS service doesn't pick up new image:

1. Check task definition is updated
2. Force new deployment:
   ```bash
   aws ecs update-service \
     --cluster mealprep360-cluster \
     --service <service-name> \
     --force-new-deployment
   ```

## Best Practices

1. **Always test in staging first**
2. **Use semantic versioning for releases** (v1.0.0)
3. **Never skip tests in production** unless emergency
4. **Review deployment logs** after each deployment
5. **Monitor CloudWatch** for errors
6. **Set up alerts** for failed deployments
7. **Keep secrets secure** - never commit them
8. **Regular ECR cleanup** to save costs

## Security Considerations

- ✅ Use OIDC instead of long-lived credentials
- ✅ Scan images for vulnerabilities
- ✅ Require approval for production deployments
- ✅ Use least privilege IAM policies
- ✅ Enable branch protection
- ✅ Rotate secrets regularly
- ✅ Use environment-specific secrets

## Cost Optimization

- Cleanup old ECR images weekly
- Use cache for Docker builds
- Deploy only changed services when possible
- Use spot instances for staging

## Support

For issues with CI/CD:
1. Check workflow logs in GitHub Actions
2. Review CloudWatch logs for service issues
3. Verify AWS credentials and permissions
4. Check ECS service events

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

