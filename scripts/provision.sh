#!/bin/bash

# Variables
VPC_ID="vpc-0bb02d3185a3dd758"          # Updated VPC ID
SUBNET_ID="subnet-00b00f2ac07466c83"    # Updated Subnet ID
SG_ID="sg-09903b1ab2cce9e96"            # Updated Security Group ID
DB_USER="mealprepuser"
DB_PASS="SuperSecretPassword123"
DB_NAME="mealprep360"
KEY_NAME="mealprep360-key"

echo "Using VPC: $VPC_ID"
echo "Using subnet: $SUBNET_ID"
echo "Using security group: $SG_ID"

# Allow inbound SSH, HTTP, HTTPS, and Postgres (skip if already exists)
for PORT in 22 80 443 5432; do
  aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port $PORT --cidr 0.0.0.0/0 2>/dev/null
done

# Create RDS Postgres only if it doesn't exist
DB_EXISTS=$(aws rds describe-db-instances --db-instance-identifier mealprep360-db --query 'DBInstances' --output text)
if [ -z "$DB_EXISTS" ]; then
  aws rds create-db-instance \
    --db-instance-identifier mealprep360-db \
    --db-name $DB_NAME \
    --master-username $DB_USER \
    --master-user-password $DB_PASS \
    --allocated-storage 20 \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --vpc-security-group-ids $SG_ID \
    --no-publicly-accessible \
    --db-subnet-group-name $SUBNET_ID
  echo "RDS instance created."
else
  echo "RDS instance 'mealprep360-db' already exists. Skipping creation."
fi

echo "Provisioning complete."