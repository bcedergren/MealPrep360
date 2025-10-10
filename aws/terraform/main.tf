terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "mealprep360-terraform-state"
    key    = "production/terraform.tfstate"
    region = "us-east-1"
    encrypt = true
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"
  
  environment_name = var.environment_name
  vpc_cidr        = var.vpc_cidr
}

# ECS Module
module "ecs" {
  source = "./modules/ecs"
  
  environment_name = var.environment_name
  vpc_id          = module.vpc.vpc_id
  public_subnets  = module.vpc.public_subnets
  private_subnets = module.vpc.private_subnets
}

# Database Module
module "database" {
  source = "./modules/database"
  
  environment_name = var.environment_name
  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnets
  ecs_security_group_id = module.ecs.ecs_security_group_id
  
  db_master_username = var.db_master_username
  db_master_password = var.db_master_password
}

# ECR Repositories
resource "aws_ecr_repository" "frontend" {
  name                 = "${var.environment_name}/frontend"
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "admin" {
  name                 = "${var.environment_name}/admin"
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "api_gateway" {
  name                 = "${var.environment_name}/api-gateway"
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "recipe_service" {
  name                 = "${var.environment_name}/recipe-service"
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "mealplan_service" {
  name                 = "${var.environment_name}/mealplan-service"
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "shopping_service" {
  name                 = "${var.environment_name}/shopping-service"
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "social_service" {
  name                 = "${var.environment_name}/social-service"
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "blog_service" {
  name                 = "${var.environment_name}/blog-service"
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "websocket_server" {
  name                 = "${var.environment_name}/websocket-server"
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
}

