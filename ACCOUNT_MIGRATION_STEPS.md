# MealPrep360 AWS Account Migration

## Issue
Initially configured CI/CD in Jindo AWS account (788331564948) instead of MealPrep360 account (588443559352).

## What Needs to Be Redone

### In MealPrep360 Account (588443559352)
1. ✅ OIDC Provider for GitHub Actions
2. ✅ IAM Role (GitHubActionsDeployRole)
3. ✅ ECR Repositories (9 services)
4. ⏳ VPC Infrastructure
5. ⏳ ECS Cluster & Services
6. ⏳ DocumentDB & ElastiCache
7. ⏳ Application Load Balancer
8. ⏳ CloudWatch Log Groups
9. ⏳ Secrets Manager secrets

### In GitHub
1. ✅ Update AWS_ACCOUNT_ID secret
2. ✅ Update AWS_DEPLOY_ROLE_ARN secret

### In Code
No code changes needed - everything is parameterized.

## Migration Steps

### Step 1: Configure MealPrep360 AWS Profile

```powershell
# Configure the profile with MealPrep360 credentials
aws configure --profile mealprep360

# Enter when prompted:
# AWS Access Key ID: <your-mealprep360-access-key>
# AWS Secret Access Key: <your-mealprep360-secret-key>
# Default region: us-east-1
# Default output format: json

# Verify correct account
aws sts get-caller-identity --profile mealprep360
# Should show Account: 588443559352
```

### Step 2: Run Setup Script

```powershell
# Set AWS profile for this session
$env:AWS_PROFILE = "mealprep360"

# Run the setup script
.\scripts\setup-mealprep360-account.ps1
```

This script will:
- ✅ Verify you're in the correct account
- ✅ Create OIDC provider
- ✅ Create IAM role
- ✅ Attach necessary policies
- ✅ Update GitHub secrets
- ✅ Create all ECR repositories

### Step 3: Deploy Infrastructure

```powershell
# Ensure profile is set
$env:AWS_PROFILE = "mealprep360"

# Create VPC
aws cloudformation create-stack `
  --stack-name mealprep360-vpc `
  --template-body file://aws/cloudformation/vpc-infrastructure.yaml `
  --parameters ParameterKey=EnvironmentName,ParameterValue=mealprep360 `
  --region us-east-1

# Wait for VPC completion
aws cloudformation wait stack-create-complete `
  --stack-name mealprep360-vpc `
  --region us-east-1

# Create Database (takes 15-20 min)
# ... follow AWS_INFRASTRUCTURE_SETUP.md
```

### Step 4: Verify Setup

```powershell
# Check account
aws sts get-caller-identity --profile mealprep360

# Check ECR repositories
aws ecr describe-repositories --profile mealprep360 --region us-east-1

# Check GitHub secrets
gh secret list
# Should show AWS_ACCOUNT_ID updated today

# Check CloudFormation stacks
aws cloudformation list-stacks `
  --stack-status-filter CREATE_COMPLETE `
  --profile mealprep360 `
  --region us-east-1
```

## What Was Removed from Jindo Account

Nothing was created in the Jindo account except:
- ✅ GitHub Actions tested the CI workflow (harmless, just ran tests)
- ✅ ECR repositories were created (can be deleted if desired)

### Optional: Clean Up Jindo Account

If you want to remove the ECR repositories from Jindo account:

```powershell
# Switch back to jindo profile
$env:AWS_PROFILE = "default"  # or whatever jindo profile name

# Delete ECR repos
$services = "frontend","admin","api-gateway","recipe-service","mealplan-service","shopping-service","social-service","blog-service","websocket-server"
foreach ($s in $services) {
    aws ecr delete-repository `
        --repository-name "mealprep360/$s" `
        --force `
        --region us-east-1
}

# Delete OIDC provider
aws iam delete-open-id-connect-provider `
    --open-id-connect-provider-arn "arn:aws:iam::788331564948:oidc-provider/token.actions.githubusercontent.com"

# Delete IAM role
aws iam detach-role-policy `
    --role-name GitHubActionsDeployRole `
    --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser

aws iam detach-role-policy `
    --role-name GitHubActionsDeployRole `
    --policy-arn arn:aws:iam::aws:policy/AmazonECS_FullAccess

aws iam delete-role --role-name GitHubActionsDeployRole
```

## Timeline

- **Step 1 & 2:** 5-10 minutes (setup AWS profile and run script)
- **Step 3:** 45-60 minutes (infrastructure deployment)
- **Step 4:** 5 minutes (verification)

**Total:** ~1 hour

## Checklist

- [ ] Configure mealprep360 AWS profile
- [ ] Verify correct account (588443559352)
- [ ] Run setup script (OIDC, IAM, ECR)
- [ ] Verify GitHub secrets updated
- [ ] Deploy VPC infrastructure
- [ ] Deploy database infrastructure
- [ ] Deploy ECS cluster
- [ ] Create Secrets Manager secrets
- [ ] Test deployment with GitHub Actions

## Notes

- All infrastructure will be 100% in MealPrep360 account
- Nothing shared with Jindo
- Fresh start with no VPC limits
- Clean separation of concerns

## After Migration

You'll have:
- ✅ MealPrep360 in account 588443559352
- ✅ Jindo in account 788331564948
- ✅ Complete isolation between projects
- ✅ Clean AWS organization

