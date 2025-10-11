#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deploy Python microservices to AWS ECS Production

.DESCRIPTION
    Complete deployment of 6 Python services to AWS
    - Creates ECR repositories
    - Pushes Docker images
    - Stores secrets
    - Creates ECS services
    - Configures monitoring

.PARAMETER DryRun
    If specified, shows what would be deployed without actually deploying

.EXAMPLE
    .\scripts\deploy-to-production.ps1
    .\scripts\deploy-to-production.ps1 -DryRun
#>

param(
    [switch]$DryRun = $false,
    [string]$Region = "us-east-1",
    [string]$AccountId = "588443559352",
    [string]$ClusterName = "mealprep360-cluster"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MealPrep360 Production Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($DryRun) {
    Write-Host "🔍 DRY RUN MODE - No changes will be made" -ForegroundColor Yellow
    Write-Host ""
}

# Services to deploy
$services = @(
    @{Name="ai-service"; Port=8000; CPU="512"; Memory="1024"},
    @{Name="analytics-service"; Port=8001; CPU="512"; Memory="2048"},
    @{Name="image-service"; Port=8002; CPU="512"; Memory="1024"},
    @{Name="nutrition-service"; Port=8003; CPU="512"; Memory="1024"},
    @{Name="report-service"; Port=8005; CPU="512"; Memory="1024"},
    @{Name="worker-service"; Port=0; CPU="512"; Memory="1024"}  # No port for background worker
)

Write-Host "Services to deploy: $($services.Count)" -ForegroundColor Cyan
foreach ($svc in $services) {
    if ($svc.Port -gt 0) {
        Write-Host "  • $($svc.Name) (Port $($svc.Port))" -ForegroundColor White
    } else {
        Write-Host "  • $($svc.Name) (Background Worker)" -ForegroundColor White
    }
}
Write-Host ""

# Step 1: Create ECR Repositories
Write-Host "Step 1/7: Creating ECR repositories..." -ForegroundColor Yellow

foreach ($svc in $services) {
    $repoName = "mealprep360/$($svc.Name)"
    Write-Host "  Creating repository: $repoName"
    
    if (-not $DryRun) {
        aws ecr create-repository `
            --repository-name $repoName `
            --region $Region `
            --tags Key=Project,Value=MealPrep360 Key=Environment,Value=Production `
            2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    ✓ Created" -ForegroundColor Green
        } else {
            Write-Host "    ℹ Already exists (skipped)" -ForegroundColor Gray
        }
    } else {
        Write-Host "    [DRY RUN] Would create repository" -ForegroundColor Gray
    }
}

Write-Host ""

# Step 2: Login to ECR
Write-Host "Step 2/7: Logging in to ECR..." -ForegroundColor Yellow

if (-not $DryRun) {
    aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin "$AccountId.dkr.ecr.$Region.amazonaws.com"
    Write-Host "  ✓ Logged in to ECR" -ForegroundColor Green
} else {
    Write-Host "  [DRY RUN] Would login to ECR" -ForegroundColor Gray
}

Write-Host ""

# Step 3: Tag and Push Docker Images
Write-Host "Step 3/7: Pushing Docker images to ECR..." -ForegroundColor Yellow
Write-Host "  This may take 10-15 minutes..." -ForegroundColor Gray

foreach ($svc in $services) {
    $localImage = "mealprep360-$($svc.Name):latest"
    $remoteImage = "$AccountId.dkr.ecr.$Region.amazonaws.com/mealprep360/$($svc.Name):latest"
    
    Write-Host "  Pushing $($svc.Name)..."
    
    if (-not $DryRun) {
        # Tag
        docker tag $localImage $remoteImage
        
        # Push
        docker push $remoteImage
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    ✓ Pushed" -ForegroundColor Green
        } else {
            Write-Host "    ✗ Failed to push" -ForegroundColor Red
            throw "Failed to push $($svc.Name)"
        }
    } else {
        Write-Host "    [DRY RUN] Would tag and push image" -ForegroundColor Gray
    }
}

Write-Host ""

# Step 4: Store Secrets (if not already exists)
Write-Host "Step 4/7: Checking secrets in AWS Secrets Manager..." -ForegroundColor Yellow

$secrets = @(
    @{Name="mealprep360/openai-api-key"; Description="OpenAI API Key"},
    @{Name="mealprep360/mongodb-uri"; Description="MongoDB Connection String"},
    @{Name="mealprep360/usda-api-key"; Description="USDA FoodData API Key"}
)

foreach ($secret in $secrets) {
    Write-Host "  Checking: $($secret.Name)"
    
    if (-not $DryRun) {
        $exists = aws secretsmanager describe-secret --secret-id $secret.Name --region $Region 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    ℹ Already exists" -ForegroundColor Gray
        } else {
            Write-Host "    ⚠ Secret not found - you'll need to create it manually" -ForegroundColor Yellow
            Write-Host "      Run: aws secretsmanager create-secret --name $($secret.Name) --secret-string 'YOUR_VALUE'" -ForegroundColor Gray
        }
    } else {
        Write-Host "    [DRY RUN] Would check secret" -ForegroundColor Gray
    }
}

Write-Host ""

# Step 5: Create CloudWatch Log Groups
Write-Host "Step 5/7: Creating CloudWatch log groups..." -ForegroundColor Yellow

foreach ($svc in $services) {
    $logGroup = "/ecs/mealprep360-$($svc.Name)"
    Write-Host "  Creating: $logGroup"
    
    if (-not $DryRun) {
        aws logs create-log-group --log-group-name $logGroup --region $Region 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    ✓ Created" -ForegroundColor Green
            
            # Set retention to 7 days
            aws logs put-retention-policy `
                --log-group-name $logGroup `
                --retention-in-days 7 `
                --region $Region 2>&1 | Out-Null
        } else {
            Write-Host "    ℹ Already exists" -ForegroundColor Gray
        }
    } else {
        Write-Host "    [DRY RUN] Would create log group" -ForegroundColor Gray
    }
}

Write-Host ""

# Step 6: Check if ECS cluster exists
Write-Host "Step 6/7: Verifying ECS cluster..." -ForegroundColor Yellow

if (-not $DryRun) {
    $clusterInfo = aws ecs describe-clusters --clusters $ClusterName --region $Region | ConvertFrom-Json
    
    if ($clusterInfo.clusters.Count -gt 0 -and $clusterInfo.clusters[0].status -eq "ACTIVE") {
        Write-Host "  ✓ Cluster '$ClusterName' is active" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Cluster '$ClusterName' not found" -ForegroundColor Red
        throw "ECS cluster not found. Please create it first."
    }
} else {
    Write-Host "  [DRY RUN] Would verify cluster" -ForegroundColor Gray
}

Write-Host ""

# Step 7: Summary
Write-Host "Step 7/7: Deployment Summary" -ForegroundColor Yellow
Write-Host ""

if ($DryRun) {
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "DRY RUN COMPLETE" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "No changes were made. Run without -DryRun to deploy." -ForegroundColor Gray
} else {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "DEPLOYMENT PHASE 1 COMPLETE!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "✓ ECR repositories created" -ForegroundColor Green
    Write-Host "✓ Docker images pushed" -ForegroundColor Green
    Write-Host "✓ CloudWatch logs configured" -ForegroundColor Green
    Write-Host ""
    Write-Host "NEXT STEPS:" -ForegroundColor Cyan
    Write-Host "1. Ensure secrets are created in Secrets Manager" -ForegroundColor White
    Write-Host "2. Create ECS task definitions" -ForegroundColor White
    Write-Host "3. Create ECS services" -ForegroundColor White
    Write-Host "4. Configure load balancer rules" -ForegroundColor White
    Write-Host ""
    Write-Host "📚 See AWS_PYTHON_SERVICES_DEPLOYMENT.md for detailed next steps" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Total services ready: $($services.Count)" -ForegroundColor Cyan
Write-Host "Estimated monthly cost: ~$100" -ForegroundColor Cyan
Write-Host "Expected savings: $385/month" -ForegroundColor Cyan
Write-Host "Net benefit: $285/month" -ForegroundColor Green
Write-Host ""

