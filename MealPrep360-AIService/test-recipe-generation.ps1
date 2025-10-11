# Test recipe generation
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Recipe Generation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$body = @{
    season = "fall"
    servings = 6
    dietary_restrictions = @("vegetarian")
} | ConvertTo-Json

Write-Host "Sending request to AI service..." -ForegroundColor Yellow
Write-Host "Request: $body" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/recipes/generate" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body `
        -TimeoutSec 60
    
    Write-Host "✓ Recipe generated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Recipe Title:" -ForegroundColor Cyan
    Write-Host "  $($response.recipe.title)" -ForegroundColor White
    Write-Host ""
    Write-Host "Generation Time:" -ForegroundColor Cyan
    Write-Host "  $($response.generation_time) seconds" -ForegroundColor White
    Write-Host ""
    Write-Host "Cost:" -ForegroundColor Cyan
    Write-Host "  `$$($response.cost)" -ForegroundColor White
    Write-Host ""
    Write-Host "Model Used:" -ForegroundColor Cyan
    Write-Host "  $($response.model_used)" -ForegroundColor White
    Write-Host ""
    Write-Host "Full response saved to: recipe-test-result.json" -ForegroundColor Gray
    $response | ConvertTo-Json -Depth 10 | Out-File "recipe-test-result.json"
    
} catch {
    Write-Host "❌ Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Check service logs:" -ForegroundColor Yellow
    Write-Host "  docker logs mealprep360-ai-service" -ForegroundColor Gray
}

