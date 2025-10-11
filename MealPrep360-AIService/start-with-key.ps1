# Start AI Service with OpenAI key from global env file

# Extract OpenAI key
$KEY_LINE = Get-Content ..\env.local.complete | Select-String "OPENAI_API_KEY=" | Select-Object -First 1
$OPENAI_KEY = $KEY_LINE.ToString().Split('=', 2)[1]

# Set environment variable
$env:OPENAI_API_KEY = $OPENAI_KEY

Write-Host "✓ OpenAI API key loaded" -ForegroundColor Green
Write-Host ""
Write-Host "Starting AI Service..." -ForegroundColor Cyan

# Start service
docker-compose up -d

Write-Host ""
Write-Host "✓ AI Service started!" -ForegroundColor Green
Write-Host ""
Write-Host "Test it:" -ForegroundColor Yellow
Write-Host "  http://localhost:8000/docs" -ForegroundColor Cyan

