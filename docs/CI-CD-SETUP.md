# CI/CD Setup Guide for MealPrep360

This guide explains how to set up and configure the CI/CD pipeline for the MealPrep360 monorepo.

## 🏗️ Overview

The CI/CD pipeline includes:
- **Continuous Integration**: Automated testing, linting, and building
- **Continuous Deployment**: Automated deployment to staging and production
- **Security Scanning**: Vulnerability scanning and license compliance
- **Docker Builds**: Multi-arch container builds with security scanning
- **Pull Request Validation**: Comprehensive PR checks

## 📋 Prerequisites

### GitHub Repository Setup
1. **Repository Settings**
   - Enable GitHub Actions
   - Set up branch protection rules
   - Configure required status checks

2. **Required Secrets**
   ```bash
   # Add these secrets in GitHub Repository Settings > Secrets and variables > Actions
   
   # Container Registry
   GITHUB_TOKEN  # Automatically provided
   
   # Kubernetes Configuration (Base64 encoded kubeconfig files)
   KUBE_CONFIG_STAGING     # Staging cluster config
   KUBE_CONFIG_PRODUCTION  # Production cluster config
   
   # Notification
   SLACK_WEBHOOK           # Slack webhook for notifications
   
   # Optional: External services
   OPENAI_API_KEY         # For AI features
   CLERK_SECRET_KEY       # For authentication
   STRIPE_SECRET_KEY      # For payments
   ```

3. **Environment Protection Rules**
   - Create `staging` environment with required reviewers
   - Create `production` environment with required reviewers and deployment branches

## 🚀 Workflows

### 1. Continuous Integration (`ci.yml`)
**Triggers:** Push to main/develop, Pull requests

**Jobs:**
- **Lint Check**: ESLint validation across all services
- **Type Check**: TypeScript compilation check
- **Unit Tests**: Jest tests with coverage reporting
- **Build Test**: Verify all services can build successfully

**Services Required:**
- MongoDB (for integration tests)
- Redis (for caching tests)

### 2. Docker Build (`docker-build.yml`)
**Triggers:** Push to main/develop, Tags, Pull requests

**Jobs:**
- **Build and Push**: Multi-arch Docker images to GitHub Container Registry
- **Security Scan**: Trivy vulnerability scanning
- **Multi-arch Test**: Verify images work on different architectures
- **Cleanup**: Remove old image versions

**Features:**
- Multi-platform builds (linux/amd64, linux/arm64)
- Build caching for faster builds
- SBOM (Software Bill of Materials) generation
- Automatic cleanup of old images

### 3. Deployment (`deploy.yml`)
**Triggers:** Push to main, Tags, Manual dispatch

**Jobs:**
- **Deploy to Staging**: Automatic deployment to staging environment
- **Integration Tests**: End-to-end testing on staging
- **Deploy to Production**: Production deployment with approval
- **Rollback**: Automatic rollback on deployment failure

**Deployment Flow:**
```
main branch → staging → integration tests → production → monitoring
```

### 4. Pull Request Validation (`pull-request.yml`)
**Triggers:** Pull requests to main/develop

**Jobs:**
- **PR Validation**: Security checks, large file detection
- **Unit Tests**: Test execution
- **Build Test**: Build verification
- **Docker Build Test**: Container build test
- **PR Comment**: Automated status comments

### 5. Security Scanning (`security-scan.yml`)
**Triggers:** Push, Pull requests, Weekly schedule

**Jobs:**
- **CodeQL Analysis**: Static code analysis
- **Dependency Scan**: npm audit for vulnerabilities
- **Docker Security**: Container vulnerability scanning
- **License Check**: License compliance verification

## ⚙️ Configuration

### Branch Protection Rules
Set up the following branch protection rules for `main`:

1. **Require status checks to pass before merging**
   - `lint`
   - `type-check`
   - `test`
   - `build`
   - `docker-build-test`

2. **Require branches to be up to date before merging**
3. **Require pull request reviews before merging**
4. **Restrict pushes that create files larger than 50MB**

### Environment Configuration

#### Staging Environment
```yaml
# .github/environments/staging.yml
protection_rules:
  - type: required_reviewers
    reviewers: ["dev-team"]
    required_approving_review_count: 1
```

#### Production Environment
```yaml
# .github/environments/production.yml
protection_rules:
  - type: required_reviewers
    reviewers: ["senior-dev-team"]
    required_approving_review_count: 2
  - type: deployment_branch_policy
    protected_branches: true
    custom_branch_policies: false
```

## 🐳 Docker Configuration

### Multi-arch Builds
The pipeline builds images for multiple architectures:
- `linux/amd64` (Intel/AMD 64-bit)
- `linux/arm64` (ARM 64-bit)

### Image Naming Convention
```
ghcr.io/username/mealprep360/service-name:tag
```

**Tags:**
- `latest` - Latest from main branch
- `develop` - Latest from develop branch
- `v1.0.0` - Semantic version tags
- `sha-abc123` - Commit SHA

### Security Scanning
All images are automatically scanned for vulnerabilities using:
- **Trivy**: Container vulnerability scanner
- **SBOM**: Software Bill of Materials generation
- **GitHub Security**: Integration with GitHub Security tab

## 🚀 Deployment Process

### Automatic Deployments

#### Staging Deployment
1. **Trigger**: Push to `main` branch
2. **Process**:
   - Build Docker images
   - Deploy to staging cluster
   - Run health checks
   - Execute integration tests
3. **Notification**: Slack notification with status

#### Production Deployment
1. **Trigger**: Git tags (`v*`) or manual dispatch
2. **Process**:
   - Create backup of current deployment
   - Deploy to production cluster
   - Run comprehensive health checks
   - Monitor for issues
3. **Rollback**: Automatic rollback on failure
4. **Notification**: Slack notification with status

### Manual Deployment
Use GitHub Actions manual dispatch:
```bash
# Deploy to staging
gh workflow run deploy.yml --ref main -f environment=staging

# Deploy to production
gh workflow run deploy.yml --ref main -f environment=production
```

## 📊 Monitoring and Notifications

### Slack Integration
Configure Slack notifications for:
- Deployment status (success/failure)
- Security alerts
- Build failures
- Production deployments

**Setup:**
1. Create Slack webhook URL
2. Add `SLACK_WEBHOOK` secret to repository
3. Configure channel notifications in workflows

### GitHub Security Tab
Security scanning results are automatically uploaded to:
- **CodeQL**: Static analysis results
- **Dependabot**: Dependency vulnerability alerts
- **Trivy**: Container vulnerability scans

## 🔧 Troubleshooting

### Common Issues

#### Build Failures
1. **Check Node.js version compatibility**
2. **Verify all dependencies are properly installed**
3. **Check for TypeScript compilation errors**
4. **Review test failures**

#### Deployment Failures
1. **Verify Kubernetes cluster connectivity**
2. **Check resource limits and quotas**
3. **Review environment variables**
4. **Check service health endpoints**

#### Security Scan Failures
1. **Review vulnerability reports**
2. **Update dependencies with known vulnerabilities**
3. **Check license compliance issues**
4. **Review container security findings**

### Debug Commands

#### Local Testing
```bash
# Test Docker builds locally
docker build -t test-frontend ./services/frontend
docker build -t test-api-gateway ./services/api-gateway

# Test with Docker Compose
docker-compose up --build

# Run tests locally
cd services/frontend && npm test
cd services/api-gateway && npm test
```

#### Kubernetes Debugging
```bash
# Check pod status
kubectl get pods -n mealprep360

# View pod logs
kubectl logs -f deployment/frontend -n mealprep360

# Check service endpoints
kubectl get services -n mealprep360

# Test health endpoints
kubectl port-forward svc/api-gateway 3001:3001 -n mealprep360
curl http://localhost:3001/api/health
```

## 📈 Performance Optimization

### Build Optimization
1. **Docker Layer Caching**: Use GitHub Actions cache for Docker builds
2. **Parallel Jobs**: Run tests and builds in parallel
3. **Selective Building**: Only build changed services
4. **Dependency Caching**: Cache npm dependencies

### Deployment Optimization
1. **Blue-Green Deployments**: Zero-downtime deployments
2. **Rolling Updates**: Gradual service updates
3. **Health Checks**: Comprehensive health monitoring
4. **Resource Limits**: Proper resource allocation

## 🔒 Security Best Practices

1. **Secret Management**: Use GitHub Secrets for sensitive data
2. **Least Privilege**: Minimal required permissions
3. **Regular Scanning**: Automated security scanning
4. **Dependency Updates**: Regular dependency updates
5. **Container Security**: Secure base images and scanning

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Multi-arch Builds](https://docs.docker.com/buildx/working-with-buildx/)
- [Kubernetes Deployment Strategies](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [Trivy Security Scanner](https://trivy.dev/)
- [CodeQL Documentation](https://codeql.github.com/docs/)

---

For questions or issues with the CI/CD setup, please create an issue in the repository or contact the development team.
