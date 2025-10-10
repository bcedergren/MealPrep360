output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "ecs_cluster_name" {
  description = "ECS Cluster Name"
  value       = module.ecs.cluster_name
}

output "alb_dns_name" {
  description = "ALB DNS Name"
  value       = module.ecs.alb_dns_name
}

output "docdb_endpoint" {
  description = "DocumentDB Cluster Endpoint"
  value       = module.database.docdb_endpoint
}

output "redis_endpoint" {
  description = "Redis Cluster Endpoint"
  value       = module.database.redis_endpoint
}

output "ecr_repositories" {
  description = "ECR Repository URLs"
  value = {
    frontend         = aws_ecr_repository.frontend.repository_url
    admin           = aws_ecr_repository.admin.repository_url
    api_gateway     = aws_ecr_repository.api_gateway.repository_url
    recipe_service  = aws_ecr_repository.recipe_service.repository_url
    mealplan_service = aws_ecr_repository.mealplan_service.repository_url
    shopping_service = aws_ecr_repository.shopping_service.repository_url
    social_service  = aws_ecr_repository.social_service.repository_url
    blog_service    = aws_ecr_repository.blog_service.repository_url
    websocket_server = aws_ecr_repository.websocket_server.repository_url
  }
}

