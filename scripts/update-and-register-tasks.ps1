# Update ECS Task Definitions with correct account ID and register them

$ErrorActionPreference = "Continue"
$ACCOUNT_ID = "588443559352"
$AWS_REGION = "us-east-1"
$PROFILE = "mealprep360"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Registering ECS Task Definitions" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get IAM role ARNs
$ecsOutputs = aws cloudformation describe-stacks --stack-name mealprep360-ecs --query "Stacks[0].Outputs" --output json --profile $PROFILE | ConvertFrom-Json
$TASK_EXEC_ROLE = ($ecsOutputs | Where-Object {$_.OutputKey -eq "ECSTaskExecutionRole"}).OutputValue
$TASK_ROLE = ($ecsOutputs | Where-Object {$_.OutputKey -eq "ECSTaskRole"}).OutputValue

Write-Host "Task Execution Role: $TASK_EXEC_ROLE" -ForegroundColor Green
Write-Host "Task Role: $TASK_ROLE" -ForegroundColor Green
Write-Host ""

# Define services
$services = @(
    @{name="frontend"; port=3000; cpu=512; memory=1024},
    @{name="admin"; port=3008; cpu=512; memory=1024},
    @{name="api-gateway"; port=3001; cpu=1024; memory=2048},
    @{name="recipe-service"; port=3002; cpu=512; memory=1024},
    @{name="mealplan-service"; port=3003; cpu=512; memory=1024},
    @{name="shopping-service"; port=3004; cpu=512; memory=1024},
    @{name="social-service"; port=3005; cpu=512; memory=1024},
    @{name="blog-service"; port=3006; cpu=512; memory=1024},
    @{name="websocket-server"; port=3007; cpu=512; memory=1024}
)

foreach ($svc in $services)
{
    $serviceName = $svc.name
    Write-Host "Registering task for $serviceName..." -ForegroundColor Yellow
    
    # Create task definition
    $taskDef = @{
        family = "mealprep360-$serviceName"
        networkMode = "awsvpc"
        requiresCompatibilities = @("FARGATE")
        cpu = "$($svc.cpu)"
        memory = "$($svc.memory)"
        executionRoleArn = $TASK_EXEC_ROLE
        taskRoleArn = $TASK_ROLE
        containerDefinitions = @(
            @{
                name = $serviceName
                image = "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/mealprep360/${serviceName}:latest"
                cpu = $svc.cpu
                memory = $svc.memory
                essential = $true
                portMappings = @(
                    @{
                        containerPort = $svc.port
                        protocol = "tcp"
                    }
                )
                environment = @(
                    @{name="NODE_ENV"; value="production"},
                    @{name="PORT"; value="$($svc.port)"}
                )
                secrets = @(
                    @{name="MONGODB_URI"; valueFrom="arn:aws:secretsmanager:${AWS_REGION}:${ACCOUNT_ID}:secret:mealprep360/mongodb-uri"},
                    @{name="REDIS_URL"; valueFrom="arn:aws:secretsmanager:${AWS_REGION}:${ACCOUNT_ID}:secret:mealprep360/redis-url"},
                    @{name="JWT_SECRET"; valueFrom="arn:aws:secretsmanager:${AWS_REGION}:${ACCOUNT_ID}:secret:mealprep360/jwt-secret"}
                )
                logConfiguration = @{
                    logDriver = "awslogs"
                    options = @{
                        "awslogs-create-group" = "true"
                        "awslogs-group" = "/ecs/mealprep360/$serviceName"
                        "awslogs-region" = $AWS_REGION
                        "awslogs-stream-prefix" = "ecs"
                    }
                }
            }
        )
    }
    
    # Convert and save
    $taskDefJson = $taskDef | ConvertTo-Json -Depth 10 -Compress
    $taskDefPath = "$env:TEMP\task-$serviceName.json"
    $taskDefJson | Out-File -FilePath $taskDefPath -Encoding UTF8
    
    # Register
    $result = aws ecs register-task-definition --cli-input-json file://$taskDefPath --region $AWS_REGION --profile $PROFILE 2>&1
    
    if ($LASTEXITCODE -eq 0)
    {
        Write-Host "  ✓ Registered: mealprep360-$serviceName" -ForegroundColor Green
    }
    else
    {
        Write-Host "  ✗ Failed: $serviceName" -ForegroundColor Red
        Write-Host "    Error: $result" -ForegroundColor Red
    }
    
    Remove-Item -Path $taskDefPath -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Task Definitions Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# List registered task definitions
Write-Host "Registered task definitions:" -ForegroundColor Cyan
aws ecs list-task-definitions --family-prefix mealprep360 --region $AWS_REGION --profile $PROFILE --query "taskDefinitionArns[-9:]" --output table

Write-Host ""
Write-Host "Next: Create ECS services" -ForegroundColor Yellow
