# Register ECS Task Definitions for MealPrep360
$ACCOUNT_ID = "588443559352"
$AWS_REGION = "us-east-1"
$PROFILE = "mealprep360"

Write-Host ""
Write-Host "Registering ECS Task Definitions..." -ForegroundColor Cyan
Write-Host ""

# Get IAM roles
$ecsStack = aws cloudformation describe-stacks --stack-name mealprep360-ecs --output json --profile $PROFILE | ConvertFrom-Json
$TASK_EXEC_ROLE = ($ecsStack.Stacks[0].Outputs | Where-Object {$_.OutputKey -eq "ECSTaskExecutionRole"}).OutputValue
$TASK_ROLE = ($ecsStack.Stacks[0].Outputs | Where-Object {$_.OutputKey -eq "ECSTaskRole"}).OutputValue

Write-Host "Execution Role: $TASK_EXEC_ROLE" -ForegroundColor Green
Write-Host "Task Role: $TASK_ROLE" -ForegroundColor Green
Write-Host ""

# Register a simple task definition for frontend first
Write-Host "Registering frontend task..." -ForegroundColor Yellow

$frontendTask = @"
{
  "family": "mealprep360-frontend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "$TASK_EXEC_ROLE",
  "taskRoleArn": "$TASK_ROLE",
  "containerDefinitions": [
    {
      "name": "frontend",
      "image": "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/mealprep360/frontend:latest",
      "cpu": 512,
      "memory": 1024,
      "essential": true,
      "portMappings": [{"containerPort": 3000, "protocol": "tcp"}],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "3000"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-create-group": "true",
          "awslogs-group": "/ecs/mealprep360/frontend",
          "awslogs-region": "$AWS_REGION",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
"@

$frontendTask | Out-File -FilePath "$env:TEMP\frontend-task.json" -Encoding UTF8
aws ecs register-task-definition --cli-input-json file://$env:TEMP/frontend-task.json --region $AWS_REGION --profile $PROFILE
Remove-Item "$env:TEMP\frontend-task.json" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Task definition registered!" -ForegroundColor Green

