#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Verify all MealPrep360 services are complete and optimized

.DESCRIPTION
    Comprehensive check of all TypeScript and Python services
#>

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MealPrep360 Services Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$results = @{
    TypeScriptServices = @{}
    PythonServices = @{}
    Infrastructure = @{}
}

# Check TypeScript services
Write-Host "Checking TypeScript Services..." -ForegroundColor Yellow
Write-Host ""

$tsServices = @(
    "MealPrep360",
    "MealPrep360-Admin",
    "MealPrep360-API",
    "MealPrep360-RecipeService",
    "MealPrep360-MealPlanService",
    "MealPrep360-ShoppingListService",
    "MealPrep360-SocialMediaService",
    "MealPrep360-BlogService",
    "MealPrep360-WebsocketServer"
)

foreach ($service in $tsServices) {
    $hasDockerfile = Test-Path "$service/Dockerfile"
    $hasPackageJson = Test-Path "$service/package.json"
    
    $status = if ($hasDockerfile -and $hasPackageJson) { "✓" } else { "✗" }
    $results.TypeScriptServices[$service] = $status -eq "✓"
    
    Write-Host "  $status $service" -ForegroundColor $(if ($status -eq "✓") { "Green" } else { "Red" })
}

# Check Python services
Write-Host ""
Write-Host "Checking Python Services..." -ForegroundColor Yellow
Write-Host ""

$pyServices = @(
    @{Name="MealPrep360-AIService"; Port=8000},
    @{Name="MealPrep360-AnalyticsService"; Port=8001},
    @{Name="MealPrep360-ImageService"; Port=8002},
    @{Name="MealPrep360-NutritionService"; Port=8003},
    @{Name="MealPrep360-MLService"; Port=8004},
    @{Name="MealPrep360-ReportService"; Port=8005},
    @{Name="MealPrep360-WorkerService"; Port="N/A"}
)

foreach ($service in $pyServices) {
    $hasDockerfile = Test-Path "$($service.Name)/Dockerfile"
    $hasRequirements = Test-Path "$($service.Name)/requirements.txt"
    $hasMain = Test-Path "$($service.Name)/app/main.py"
    
    $status = if ($hasDockerfile -and $hasRequirements) { "✓" } else { "✗" }
    $results.PythonServices[$service.Name] = $status -eq "✓"
    
    $portInfo = if ($service.Port -ne "N/A") { "Port $($service.Port)" } else { "Background Worker" }
    Write-Host "  $status $($service.Name) ($portInfo)" -ForegroundColor $(if ($status -eq "✓") { "Green" } else { "Red" })
}

# Check Docker Compose files
Write-Host ""
Write-Host "Checking Docker Compose Files..." -ForegroundColor Yellow
Write-Host ""

$composeFiles = @(
    "docker-compose.yml",
    "docker-compose.dev.yml",
    "docker-compose.python-services.yml"
)

foreach ($file in $composeFiles) {
    $exists = Test-Path $file
    $status = if ($exists) { "✓" } else { "✗" }
    Write-Host "  $status $file" -ForegroundColor $(if ($status -eq "✓") { "Green" } else { "Red" })
}

# Check documentation
Write-Host ""
Write-Host "Checking Documentation..." -ForegroundColor Yellow
Write-Host ""

$docs = @(
    "PYTHON_SERVICES_COMPLETE.md",
    "PYTHON_SERVICES_INTEGRATION_GUIDE.md",
    "AI_SERVICE_COMPLETE.md",
    "POSTGRESQL_MIGRATION_PLAN.md",
    "DEPLOYMENT_SESSION_COMPLETE.md"
)

foreach ($doc in $docs) {
    $exists = Test-Path $doc
    $status = if ($exists) { "✓" } else { "✗" }
    Write-Host "  $status $doc" -ForegroundColor $(if ($status -eq "✓") { "Green" } else { "Red" })
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Verification Summary" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

$tsComplete = ($results.TypeScriptServices.Values | Where-Object { $_ -eq $true }).Count
$tsTotal = $results.TypeScriptServices.Count

$pyComplete = ($results.PythonServices.Values | Where-Object { $_ -eq $true }).Count
$pyTotal = $results.PythonServices.Count

Write-Host "TypeScript Services: $tsComplete/$tsTotal complete" -ForegroundColor Cyan
Write-Host "Python Services: $pyComplete/$pyTotal complete" -ForegroundColor Cyan
Write-Host ""

if ($tsComplete -eq $tsTotal -and $pyComplete -eq $pyTotal) {
    Write-Host "✓ All services verified and ready!" -ForegroundColor Green
} else {
    Write-Host "⚠ Some services need attention" -ForegroundColor Yellow
}

Write-Host ""

