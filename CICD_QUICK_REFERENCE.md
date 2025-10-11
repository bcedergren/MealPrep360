# CI/CD Quick Reference

## 🚀 Quick Start Checklist

- [ ] Set up AWS OIDC provider
- [ ] Create IAM role for GitHub Actions
- [ ] Add GitHub secrets (`AWS_ACCOUNT_ID`, `AWS_DEPLOY_ROLE_ARN`)
- [ ] Configure GitHub environments (production, staging)
- [ ] Enable branch protection for `main`
- [ ] Test with a pull request

## 📝 Common Commands

### GitHub CLI

```bash
# View recent workflow runs
gh run list --limit 10

# View specific workflow
gh run list --workflow=deploy-production.yml

# Watch a running workflow
gh run watch

# View logs
gh run view <run-id> --log

# Rerun failed workflow
gh run rerun <run-id>

# Cancel running workflow
gh run cancel <run-id>
```

### AWS CLI

```bash
# Check ECS deployment status
aws ecs describe-services \
  --cluster mealprep360-cluster \
  --services frontend api-gateway \
  --region us-east-1

# View service events (last 5)
aws ecs describe-services \
  --cluster mealprep360-cluster \
  --services frontend \
  --query 'services[0].events[:5]' \
  --region us-east-1

# List recent task definitions
aws ecs list-task-definitions \
  --family-prefix mealprep360 \
  --max-items 5 \
  --region us-east-1

# View ECR images
aws ecr describe-images \
  --repository-name mealprep360/frontend \
  --region us-east-1 \
  --query 'sort_by(imageDetails,& imagePushedAt)[-5:]'

# Force new deployment
aws ecs update-service \
  --cluster mealprep360-cluster \
  --service frontend \
  --force-new-deployment \
  --region us-east-1
```

## 🔄 Deployment Workflows

### Automatic Deployment

| Branch | Environment | Approval Required | Triggers |
|--------|-------------|-------------------|----------|
| `develop` | Staging | No | Automatic on push |
| `main` | Production | Yes | Automatic on push/merge |
| `v*.*.*` tags | Production | Yes | Automatic on tag push |

### Manual Deployment

**Deploy Single Service:**
```
GitHub → Actions → Deploy Single Service → Run workflow
```

**Deploy All Services:**
```
GitHub → Actions → Deploy to Production/Staging → Run workflow
```

## 🏷️ Git Workflow

### Feature Development

```bash
# 1. Create feature branch
git checkout -b feature/new-feature develop

# 2. Make changes and commit
git add .
git commit -m "feat: add new feature"

# 3. Push and create PR
git push origin feature/new-feature
# Create PR on GitHub targeting 'develop'

# 4. Merge to develop (deploys to staging)
# After PR approval, merge on GitHub
```

### Release to Production

```bash
# 1. Merge develop to main
git checkout main
git merge develop
git push origin main

# 2. Wait for approval in GitHub Actions

# 3. Approve deployment
# Go to Actions → View workflow → Review deployments → Approve

# 4. Tag release (optional)
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin v1.0.0
```

### Hotfix

```bash
# 1. Create hotfix from main
git checkout -b hotfix/critical-fix main

# 2. Make fix
git add .
git commit -m "fix: critical security issue"

# 3. Push
git push origin hotfix/critical-fix

# 4. Deploy via GitHub Actions UI
# Actions → Deploy Single Service
# Select: service, production, skip_tests (if needed)

# 5. Merge back to main and develop
git checkout main
git merge hotfix/critical-fix
git push origin main

git checkout develop
git merge hotfix/critical-fix
git push origin develop
```

## 📊 Monitoring

### Check Deployment Status

```bash
# GitHub workflow status
gh run list --workflow=deploy-production.yml --limit 1

# ECS service status
aws ecs describe-services \
  --cluster mealprep360-cluster \
  --services frontend \
  --query 'services[0].{status:status,running:runningCount,desired:desiredCount}' \
  --region us-east-1

# View CloudWatch logs
aws logs tail /ecs/mealprep360/frontend --follow --region us-east-1
```

### Health Checks

```bash
# Check service health
curl https://mealprep360.com
curl https://api.mealprep360.com/api/health
curl https://admin.mealprep360.com

# Or use a loop to check all services
for url in \
  "https://mealprep360.com" \
  "https://api.mealprep360.com/api/health" \
  "https://admin.mealprep360.com"; do
  echo -n "$url: "
  curl -s -o /dev/null -w "%{http_code}\n" "$url"
done
```

## 🐛 Troubleshooting

### Workflow Fails on Authentication

```bash
# Check GitHub secrets
gh secret list

# Verify AWS role
aws iam get-role --role-name GitHubActionsDeployRole

# Test AWS credentials locally
aws sts get-caller-identity
```

### Deployment Stuck

```bash
# Check ECS service events
aws ecs describe-services \
  --cluster mealprep360-cluster \
  --services frontend \
  --query 'services[0].events[:10]'

# Check task status
aws ecs list-tasks \
  --cluster mealprep360-cluster \
  --service-name frontend \
  --desired-status RUNNING

# Force new deployment
aws ecs update-service \
  --cluster mealprep360-cluster \
  --service frontend \
  --force-new-deployment
```

### Image Not Updating

```bash
# Verify image was pushed
aws ecr describe-images \
  --repository-name mealprep360/frontend \
  --query 'sort_by(imageDetails,& imagePushedAt)[-1:]'

# Check task definition image
aws ecs describe-task-definition \
  --task-definition mealprep360-frontend \
  --query 'taskDefinition.containerDefinitions[0].image'

# Force pull latest image
aws ecs update-service \
  --cluster mealprep360-cluster \
  --service frontend \
  --force-new-deployment
```

### Rollback Deployment

```bash
# List task definitions
aws ecs list-task-definitions \
  --family-prefix mealprep360-frontend \
  --max-items 5

# Update to previous task definition
aws ecs update-service \
  --cluster mealprep360-cluster \
  --service frontend \
  --task-definition mealprep360-frontend:PREVIOUS_REVISION
```

## 🔐 Security Checks

### Audit IAM Permissions

```bash
# List role policies
aws iam list-attached-role-policies \
  --role-name GitHubActionsDeployRole

# Get role trust policy
aws iam get-role \
  --role-name GitHubActionsDeployRole \
  --query 'Role.AssumeRolePolicyDocument'
```

### Scan Images for Vulnerabilities

```bash
# Manual Trivy scan
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image \
  ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/mealprep360/frontend:latest
```

### Check Secrets

```bash
# List GitHub secrets (values hidden)
gh secret list

# List AWS Secrets Manager
aws secretsmanager list-secrets \
  --query 'SecretList[?starts_with(Name, `mealprep360`)].[Name]' \
  --output table
```

## 📈 Performance

### Build Cache

Workflows use GitHub Actions cache for Docker layers:
- Cache is automatic with `docker/build-push-action@v5`
- Speeds up builds by 50-80%
- Shared across workflow runs

### Parallel Deployments

- Staging: All services deploy in parallel
- Production: 2 services at a time (controlled with `max-parallel`)
- Reduces production deployment time while maintaining safety

## 🎯 Best Practices

1. ✅ **Always test in staging first**
2. ✅ **Use semantic versioning** for releases (v1.0.0)
3. ✅ **Review workflow logs** after deployment
4. ✅ **Monitor CloudWatch** for errors
5. ✅ **Tag stable releases** for easy rollback
6. ✅ **Keep secrets secure** - never commit them
7. ✅ **Use branch protection** on main/develop
8. ✅ **Require PR reviews** before merging
9. ✅ **Run smoke tests** after deployment
10. ✅ **Set up alerts** for failed deployments

## 📞 Quick Links

- **GitHub Actions**: `https://github.com/YOUR_ORG/YOUR_REPO/actions`
- **AWS ECS Console**: `https://console.aws.amazon.com/ecs/`
- **AWS CloudWatch**: `https://console.aws.amazon.com/cloudwatch/`
- **AWS ECR**: `https://console.aws.amazon.com/ecr/`

## 📚 Documentation

- [Full Setup Guide](GITHUB_ACTIONS_SETUP.md)
- [Workflow Details](.github/workflows/README.md)
- [Docker Guide](DOCKER_DEPLOYMENT_GUIDE.md)
- [Quick Docker Reference](QUICK_DOCKER_REFERENCE.md)

## 💡 Tips

- Use `gh run watch` to follow deployment in terminal
- Enable GitHub notifications for workflow failures
- Set up Slack/Discord webhooks for deployment alerts
- Create custom GitHub Actions composite actions for reusable steps
- Use GitHub Environments for deployment approval gates
- Tag important commits for easy identification
- Keep workflow files DRY with reusable workflows

