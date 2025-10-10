MealPrep360 AWS Deployment Planning Document

1. Preparation
   Audit codebase for:
   Backend (API) technologies (e.g., .NET, Node.js, Python)
   Frontend (UI) framework (e.g., React, Angular)
   Database usage (e.g., SQL Server, MySQL, PostgreSQL, DynamoDB)
   Storage needs (e.g., images, files)
   Third-party integrations (e.g., email, payment)
   List environment variables and secrets required
   Identify build and runtime dependencies
2. AWS Account & CLI Setup
   Create/Access AWS account
   Install and configure AWS CLI (aws configure)
   Set up IAM user/roles with least privilege
3. Infrastructure Planning
   Compute
   Choose between EC2, Elastic Beanstalk, ECS (Docker), or Lambda (serverless)
   Database
   RDS (SQL), DynamoDB (NoSQL), or Aurora
   Storage
   S3 buckets for static assets, uploads
   Networking
   VPC, subnets, security groups, load balancer
   Domain & SSL
   Route 53 for DNS, ACM for SSL certificates
   Monitoring
   CloudWatch for logs and metrics
4. Backend/API Deployment
   Package backend code (zip, Docker image, etc.)
   Create compute resources (EC2, ECS, Lambda)
   Configure environment variables/secrets (SSM Parameter Store, Secrets Manager)
   Set up API Gateway (if using serverless)
   Configure security groups and IAM roles
   Set up auto-scaling and health checks
5. Frontend/UI Deployment
   Build frontend assets
   Create S3 bucket for static hosting
   Configure bucket policy for public access (if needed)
   Set up CloudFront distribution for CDN
   Point domain to CloudFront via Route 53
6. Database Setup
   Provision RDS/DynamoDB instance
   Configure security groups, backups, and monitoring
   Run migrations/seeding scripts
7. Storage Setup
   Create S3 buckets for uploads/static files
   Set bucket policies and lifecycle rules
8. CI/CD Pipeline (Optional)
   Set up CodePipeline/CodeBuild for automated deployments
   Configure buildspec files and deployment scripts
9. Monitoring & Logging
   Enable CloudWatch logs for all services
   Set up alarms for errors, downtime, and resource usage
10. Testing & Validation
    Deploy to staging environment
    Run integration and smoke tests
    Validate endpoints, UI, and database connectivity
11. Production Deployment
    Deploy to production environment
    Update DNS records
    Monitor deployment and roll back if needed
12. Post-Deployment
    Document deployment process
    Set up regular backups and disaster recovery
    Review security posture (IAM, VPC, encryption)

MealPrep360 AWS Deployment Plan (Next.js + Postgres)

1. Preparation
   No CLI commands; review codebase and list environment variables.
2. AWS Account & CLI Setup
   aws configure
   Enter your AWS Access Key, Secret Key, region, and output format.

3. Infrastructure Planning
   a. VPC & Networking
   aws ec2 create-vpc --cidr-block 10.0.0.0/16
   aws ec2 create-subnet --vpc-id <vpc-id> --cidr-block 10.0.1.0/24
   aws ec2 create-security-group --group-name mealprep360-sg --description "MealPrep360 SG" --vpc-id <vpc-id>

b. IAM Role for EC2
aws iam create-role --role-name MealPrep360EC2Role --assume-role-policy-document file://trust-policy.json

b. IAM Role for EC2
aws iam create-role --role-name MealPrep360EC2Role --assume-role-policy-document file://trust-policy.json

4. Database Setup (Postgres on RDS)
   aws rds create-db-instance \
    --db-instance-identifier mealprep360-db \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --master-username <username> \
    --master-user-password <password> \
    --allocated-storage 20 \
    --vpc-security-group-ids <sg-id>

5. Backend/API & Frontend Deployment (Next.js on EC2)
   a. Create EC2 Instance
   aws ec2 run-instances \
    --image-id <ami-id> \
    --count 1 \
    --instance-type t3.micro \
    --key-name <key-pair> \
    --security-group-ids <sg-id> \
    --subnet-id <subnet-id> \
    --iam-instance-profile Name=MealPrep360EC2Role

b. (Optional) Elastic IP for EC2
aws s3 mb s3://mealprep360-static
aws s3 sync ./public s3://mealprep360-static

c. (Optional) S3 for Static Assets
aws s3 mb s3://mealprep360-static
aws s3 sync ./public s3://mealprep360-static

d. (Optional) CloudFront for CDN
aws cloudfront create-distribution \
 --origin-domain-name mealprep360-static.s3.amazonaws.com

6. Domain & SSL (Route 53 & ACM)
   a. Create Hosted Zone
   aws route53 create-hosted-zone --name mealprep360.com --caller-reference $(date +%s)

b. Request SSL Certificate
aws acm request-certificate --domain-name mealprep360.com --validation-method DNS

7. Environment Variables & Secrets
   a. Store Secrets in SSM Parameter Store

aws ssm put-parameter --name "/mealprep360/db/password" --value "<password>" --type "SecureString"

8. Monitoring & Logging (CloudWatch)
   a. Create Log Group
   aws logs create-log-group --log-group-name mealprep360-logs

9. Testing & Validation
   No CLI commands; SSH into EC2, run tests, validate endpoints.

10. CI/CD Pipeline (Optional)
    a. Create CodePipeline
    aws codepipeline create-pipeline --cli-input-json file://pipeline.json

11. Production Deployment
    Update DNS records in Route 53 to point to EC2/CloudFront.
    No direct CLI command; use AWS Console or CLI for record changes.

12. Post-Deployment
    Set up backups for RDS:
    aws rds modify-db-instance --db-instance-identifier mealprep360-db --backup-retention-period 7

Review security groups and IAM roles.

Note:

Replace placeholders (<ami-id>, <sg-id>, <subnet-id>, <instance-id>, <allocation-id>, <username>, <password>, <key-pair>) with your actual values.
For Next.js, you may want to use Elastic Beanstalk or ECS for easier scaling and deployment.
For production, consider using environment variables for secrets and not hardcoding them.

1. Provisioning Script
   #!/bin/bash

# filepath: scripts/provision.sh

# Variables

VPC_CIDR="10.0.0.0/16"
SUBNET_CIDR="10.0.1.0/24"
DB_USER="mealprepuser"
DB_PASS="SuperSecretPassword123"
DB_NAME="mealprep360"
KEY_NAME="mealprep360-key"

# Create VPC

VPC_ID=$(aws ec2 create-vpc --cidr-block $VPC_CIDR --query 'Vpc.VpcId' --output text)
echo "VPC created: $VPC_ID"

# Create Subnet

SUBNET_ID=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block $SUBNET_CIDR --query 'Subnet.SubnetId' --output text)
echo "Subnet created: $SUBNET_ID"

# Create Security Group

SG_ID=$(aws ec2 create-security-group --group-name mealprep360-sg --description "MealPrep360 SG" --vpc-id $VPC_ID --query 'GroupId' --output text)
echo "Security Group created: $SG_ID"

# Allow inbound SSH, HTTP, HTTPS, and Postgres

aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 22 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 443 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 5432 --cidr 0.0.0.0/0

# Create RDS Postgres

aws rds create-db-instance \
 --db-instance-identifier mealprep360-db \
 --db-instance-class db.t3.micro \
 --engine postgres \
 --master-username $DB_USER \
 --master-user-password $DB_PASS \
 --allocated-storage 20 \
 --vpc-security-group-ids $SG_ID \
 --db-name $DB_NAME

echo "Provisioning complete."

2. Deployment Script (Next.js on EC2)
   #!/bin/bash

# filepath: scripts/deploy.sh

# Variables

AMI_ID="ami-xxxxxxxx" # Use latest Ubuntu AMI
INSTANCE_TYPE="t3.micro"
KEY_NAME="mealprep360-key"
SG_ID="sg-xxxxxxxx"
SUBNET_ID="subnet-xxxxxxxx"

# Launch EC2 Instance

INSTANCE_ID=$(aws ec2 run-instances \
 --image-id $AMI_ID \
 --count 1 \
 --instance-type $INSTANCE_TYPE \
 --key-name $KEY_NAME \
 --security-group-ids $SG_ID \
 --subnet-id $SUBNET_ID \
 --query 'Instances[0].InstanceId' \
 --output text)

echo "EC2 Instance launched: $INSTANCE_ID"

# Wait for instance to be running

aws ec2 wait instance-running --instance-ids $INSTANCE_ID

# Get public IP

PUBLIC_IP=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)
echo "Instance Public IP: $PUBLIC_IP"

# SSH and deploy Next.js (manual or via script)

echo "SSH into the instance and run your deployment steps:"
echo "ssh -i $KEY_NAME.pem ubuntu@$PUBLIC_IP"
echo "git clone <your-repo> && cd <your-repo>"
echo "npm install && npm run build && npm start"

3. Automation Script (Static Assets to S3 & CloudFront)
   #!/bin/bash

# filepath: scripts/static_deploy.sh

# Variables

BUCKET_NAME="mealprep360-static"

# Create S3 bucket

aws s3 mb s3://$BUCKET_NAME

# Sync static assets

aws s3 sync ./public s3://$BUCKET_NAME

# Create CloudFront distribution (manual step for full config)

aws cloudfront create-distribution \
 --origin-domain-name $BUCKET_NAME.s3.amazonaws.com

echo "Static assets deployed to S3 and CloudFront."

Notes:

Replace placeholder values with your actual resource IDs and secrets.
For production, use environment variables and secure secret management.
For full automation, consider using AWS CloudFormation or Terraform.

Sample GitHub Actions CI/CD workflow for Next.js + AWS EC2/S3
A Markdown document capturing all provisioning, deployment, and CI/CD steps

1. Sample GitHub Actions Workflow
   Create this file in your repo:

name: Deploy MealPrep360 to AWS

on:
push:
branches: - main

jobs:
build-and-deploy:
runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Build Next.js app
        run: npm run build

      - name: Export static assets
        run: npm run export

      - name: Upload static assets to S3
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: 'us-east-1'
        run: |
          aws s3 sync ./out s3://mealprep360-static --delete

      # Optional: SSH deploy to EC2
      - name: Deploy to EC2
        env:
          HOST: ${{ secrets.EC2_HOST }}
          USER: ${{ secrets.EC2_USER }}
          KEY: ${{ secrets.EC2_SSH_KEY }}
        run: |
          echo "$KEY" > key.pem
          chmod 600 key.pem
          ssh -o StrictHostKeyChecking=no -i key.pem $USER@$HOST "
            cd /var/www/mealprep360 &&
            git pull &&
            npm install &&
            npm run build &&
            pm2 restart mealprep360
          "

2. Comprehensive Deployment Documentation

# MealPrep360 AWS Deployment & CI/CD Guide

## 1. Provisioning

- **VPC, Subnet, Security Group**

  - Create VPC:  
    `aws ec2 create-vpc --cidr-block 10.0.0.0/16`
  - Create Subnet:  
    `aws ec2 create-subnet --vpc-id <vpc-id> --cidr-block 10.0.1.0/24`
  - Create Security Group:  
    `aws ec2 create-security-group --group-name mealprep360-sg --description "MealPrep360 SG" --vpc-id <vpc-id>`

- **RDS Postgres**

  - Create DB:  
    `aws rds create-db-instance --db-instance-identifier mealprep360-db --db-instance-class db.t3.micro --engine postgres --master-username <username> --master-user-password <password> --allocated-storage 20 --vpc-security-group-ids <sg-id>`

- **S3 Bucket for Static Assets**
  - Create bucket:  
    `aws s3 mb s3://mealprep360-static`

## 2. Deployment

- **EC2 Instance for Next.js**

  - Launch instance:  
    `aws ec2 run-instances --image-id <ami-id> --count 1 --instance-type t3.micro --key-name <key-pair> --security-group-ids <sg-id> --subnet-id <subnet-id>`

- **Static Assets**

  - Sync assets:  
    `aws s3 sync ./public s3://mealprep360-static`

- **CloudFront CDN**
  - Create distribution:  
    `aws cloudfront create-distribution --origin-domain-name mealprep360-static.s3.amazonaws.com`

## 3. CI/CD with GitHub Actions

- **Workflow File:** `.github/workflows/deploy.yml`
- **Secrets Required:**

  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `EC2_HOST`
  - `EC2_USER`
  - `EC2_SSH_KEY` (private key for SSH)

- **Workflow Steps:**
  1. Checkout code
  2. Install dependencies
  3. Build Next.js app
  4. Export static assets
  5. Upload static assets to S3
  6. SSH into EC2 and deploy backend

## 4. Post-Deployment

- **Monitor logs:**  
  `aws logs create-log-group --log-group-name mealprep360-logs`
- **Backups:**  
  `aws rds modify-db-instance --db-instance-identifier mealprep360-db --backup-retention-period 7`
- **DNS & SSL:**  
  Use Route 53 and ACM for domain and SSL setup.

---

**References:**

- [AWS CLI Documentation](https://docs.aws.amazon.com/cli/latest/reference/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
