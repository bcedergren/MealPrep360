variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment_name" {
  description = "Environment name prefix"
  type        = string
  default     = "mealprep360"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "db_master_username" {
  description = "Master username for database"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "db_master_password" {
  description = "Master password for database"
  type        = string
  sensitive   = true
}

