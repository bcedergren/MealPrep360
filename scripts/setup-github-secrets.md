# GitHub Secrets Setup Guide

This guide helps you set up the required secrets for your MealPrep360 CI/CD pipelines.

## Required Secrets

### 1. Kubernetes Configuration Secrets

These should contain base64-encoded kubeconfig files for your clusters.

#### Staging Cluster
```bash
# Get your staging kubeconfig
kubectl config view --raw > staging-kubeconfig.yaml

# Encode it to base64
base64 -i staging-kubeconfig.yaml -o staging-kubeconfig.b64

# Add to GitHub Secrets
# Name: KUBE_CONFIG_STAGING
# Value: [contents of staging-kubeconfig.b64]
```

#### Production Cluster
```bash
# Get your production kubeconfig
kubectl config view --raw > production-kubeconfig.yaml

# Encode it to base64
base64 -i production-kubeconfig.yaml -o production-kubeconfig.b64

# Add to GitHub Secrets
# Name: KUBE_CONFIG_PRODUCTION
# Value: [contents of production-kubeconfig.b64]
```

### 2. Optional Secrets

#### Slack Webhook (Optional)
If you want Slack notifications:
```bash
# Get webhook URL from Slack
# Add to GitHub Secrets
# Name: SLACK_WEBHOOK
# Value: https://hooks.slack.com/services/...
```

#### Container Registry Authentication
GitHub Container Registry uses GITHUB_TOKEN automatically, but if you need custom authentication:
```bash
# Add to GitHub Secrets
# Name: REGISTRY_USERNAME
# Name: REGISTRY_PASSWORD
```

## How to Add Secrets to GitHub

1. Go to your repository on GitHub
2. Click **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Enter the secret name and value
6. Click **Add secret**

## Environment Variables

These should be set in your environment files (`.env.production`, etc.):

```bash
# Database
MONGODB_URI=mongodb://your-mongodb-connection-string
REDIS_URL=redis://your-redis-connection-string

# Authentication
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# AI Services
OPENAI_API_KEY=your_openai_api_key
OPENROUTER_API_KEY=your_openrouter_api_key

# Payments
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Service API Keys
RECIPE_SERVICE_API_KEY=your_recipe_service_key
MEALPLAN_SERVICE_API_KEY=your_mealplan_service_key
SHOPPING_SERVICE_API_KEY=your_shopping_service_key
SOCIAL_SERVICE_API_KEY=your_social_service_key
BLOG_SERVICE_API_KEY=your_blog_service_key
WEBSOCKET_SERVICE_API_KEY=your_websocket_service_key
```

## Testing Your Setup

### 1. Test Kubernetes Access
```bash
# Test staging access
kubectl --kubeconfig=staging-kubeconfig.yaml get pods -n mealprep360-staging

# Test production access
kubectl --kubeconfig=production-kubeconfig.yaml get pods -n mealprep360
```

### 2. Test GitHub Actions
Create a simple test workflow to verify secrets are accessible:

```yaml
name: Test Secrets
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Test Kube Config
        run: |
          if [ -n "${{ secrets.KUBE_CONFIG_STAGING }}" ]; then
            echo "✅ KUBE_CONFIG_STAGING is set"
          else
            echo "❌ KUBE_CONFIG_STAGING is not set"
          fi
```

## Troubleshooting

### Common Issues

1. **Base64 encoding issues**
   - Make sure to use the `--raw` flag with kubectl
   - Verify the base64 encoding is correct

2. **Permission issues**
   - Ensure your kubeconfig has the necessary permissions
   - Check that the service account can create/update deployments

3. **Network access**
   - Verify your GitHub Actions runners can access your Kubernetes clusters
   - Check firewall rules and network policies

### Verification Commands

```bash
# Check if secrets are properly encoded
echo "$SECRET_VALUE" | base64 -d | kubectl --kubeconfig=- get pods

# Test cluster connectivity
kubectl cluster-info

# Verify namespaces exist
kubectl get namespaces | grep mealprep360
```

## Security Best Practices

1. **Rotate secrets regularly**
2. **Use least privilege access**
3. **Monitor secret usage**
4. **Never commit secrets to code**
5. **Use environment-specific secrets**

---

For more help, check the GitHub Actions documentation or contact your DevOps team.
