terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

locals {
  ssh_key_path = pathexpand(var.ssh_public_key_path)
}

# VPC (기본 VPC 사용)
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Security Group - EC2 (웹 서버)
resource "aws_security_group" "web" {
  name        = "dn-platform-web-sg"
  description = "HTTP, HTTPS, SSH for DN Platform"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "dn-platform-web-sg" }
}

# Security Group - RDS (EC2에서만 접근)
resource "aws_security_group" "rds" {
  name        = "dn-platform-rds-sg"
  description = "MySQL from EC2 only"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "dn-platform-rds-sg" }
}

# EC2 Key Pair
resource "aws_key_pair" "deployer" {
  key_name   = "dn-platform-key"
  public_key = file(local.ssh_key_path)
}

# Amazon Linux 2023 AMI
data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# EC2 Instance
resource "aws_instance" "web" {
  ami                    = data.aws_ami.amazon_linux_2023.id
  instance_type          = "t3.micro"
  key_name               = aws_key_pair.deployer.key_name
  vpc_security_group_ids = [aws_security_group.web.id]

  root_block_device {
    volume_size           = 20
    volume_type           = "gp2"
    delete_on_termination = true
  }

  user_data = file("${path.module}/userdata.sh")

  tags = { Name = "dn-platform-web" }
}

# Elastic IP (고정 IP 할당)
resource "aws_eip" "web" {
  instance = aws_instance.web.id
  domain   = "vpc"

  tags = { Name = "dn-platform-web-eip" }
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "dn-platform-subnet-group"
  subnet_ids = data.aws_subnets.default.ids
  tags       = { Name = "dn-platform-db-subnet" }
}

# RDS MySQL
resource "aws_db_instance" "mysql" {
  identifier     = "dn-platform-db"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.t3.micro"

  allocated_storage     = 20
  max_allocated_storage = 20
  storage_type          = "gp2"

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password
  port     = 3306

  multi_az            = false
  publicly_accessible = false

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 1  # Free Tier: 1일
  backup_window           = "03:00-04:00"
  maintenance_window      = "mon:04:00-mon:05:00"

  skip_final_snapshot = true
  deletion_protection = false

  tags = { Name = "dn-platform-mysql" }
}
