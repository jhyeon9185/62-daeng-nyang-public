## AWS 무료 티어 학습용 프로젝트 구성 (2026년 1월 기준)

### 🎯 **AWS Free Tier 최신 정책 (2025년 7월 변경사항 반영)**

2025년 7월 15일부터 AWS Free Tier 정책이 크게 변경되었습니다: [dev](https://dev.to/aws-builders/whats-new-in-aws-free-tier-2025-2ba5)
- **기존**: 12개월 무료 체험
- **신규**: 6개월 크레딧 기반 Free Plan ($100+ 크레딧 제공)
- **Always Free**: 영구 무료 서비스는 그대로 유지

***

### 💰 **무료 티어 한도 (12개월, 2026년 기준)**

#### EC2 (컴퓨팅)
- **750시간/월** - t2.micro 또는 t3.micro 인스턴스 [sourcefuse](https://www.sourcefuse.com/resources/blog/aws-free-tier-limits/)
- ⚠️ 주의: 1개 인스턴스만 24/7 실행 가능 (2개 실행 시 16일이면 초과) [cloudoptimo](https://www.cloudoptimo.com/blog/aws-free-tier-isnt-unlimited-know-the-limits-before-you-get-billed/)
- 30GB EBS 스토리지 (General Purpose SSD) [sourcefuse](https://www.sourcefuse.com/resources/blog/aws-free-tier-limits/)

#### RDS (데이터베이스)
- **750시간/월** - db.t3.micro 또는 db.t4g.micro (MySQL, MariaDB, PostgreSQL) [aws.amazon](https://aws.amazon.com/rds/free/)
- **20GB** General Purpose SSD 스토리지 [aws.amazon](https://aws.amazon.com/rds/free/)
- **20GB** 백업 스토리지 [amazonaws](https://www.amazonaws.cn/en/new/2022/amazon-rds-free-tier-now-includes-more-instances-in-china-regions/)
- ⚠️ Single-AZ만 무료 (Multi-AZ는 유료)

#### S3 (스토리지)
- **5GB** 표준 스토리지 [sourcefuse](https://www.sourcefuse.com/resources/blog/aws-free-tier-limits/)
- 20,000 GET 요청, 2,000 PUT 요청 [sourcefuse](https://www.sourcefuse.com/resources/blog/aws-free-tier-limits/)

#### Lambda (Always Free - 영구 무료)
- **100만 요청/월** [github](https://github.com/cloudcommunity/Cloud-Free-Tier-Comparison)
- **400,000 GB-초** 컴퓨팅 시간 [reddit](https://www.reddit.com/r/aws/comments/1kmyzsy/ecs_completely_within_free_tier_possible_sanity/)

#### 주의사항 [lemontia.tistory](https://lemontia.tistory.com/1120)
- ❌ **ALB/ELB는 무료 티어 없음** → 과금 발생
- ❌ **Elastic IP를 사용하지 않으면** 월 $4 과금 [lemontia.tistory](https://lemontia.tistory.com/1120)
- ❌ **NAT Gateway** 유료 ($0.045/시간)
- ⚠️ **리전별 제한이 아닌 계정 전체 합산** [cloudoptimo](https://www.cloudoptimo.com/blog/aws-free-tier-isnt-unlimited-know-the-limits-before-you-get-billed/)

***

### ✅ **무료 티어만으로 구성하는 최적 아키텍처**

#### 아키텍처 1: EC2 단일 인스턴스 구성 (권장)

```
┌─────────────────────────────────┐
│      EC2 t3.micro (750h)        │
│  ┌──────────────────────────┐   │
│  │ Nginx (포트 80/443)       │   │
│  │   ├─ React (빌드 정적파일) │   │
│  │   └─ Spring Boot (8080)   │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
                │
                ▼
      ┌─────────────────┐
      │ RDS db.t3.micro │
      │    MySQL 8.0    │
      │     (750h)      │
      └─────────────────┘
```

**비용**: **$0/월** (무료 티어 내)

**장점**:
- ALB 불필요 (비용 절감)
- 설정 간단
- 학습 목적에 충분한 성능

**단점**:
- Auto Scaling 불가
- 고가용성 없음 (학습용이므로 문제없음)

***

#### 아키텍처 2: Lambda + API Gateway (서버리스)

```
┌──────────────────────┐
│  S3 (5GB) + CloudFront
│  React 정적 호스팅   │
└──────────────────────┘
           │
           ▼
┌──────────────────────┐
│  API Gateway (1M req)│
└──────────────────────┘
           │
           ▼
┌──────────────────────┐
│  Lambda (1M invokes) │
│  Spring Boot → Jar   │
└──────────────────────┘
           │
           ▼
┌──────────────────────┐
│ RDS Proxy (선택사항) │
│ RDS db.t3.micro      │
└──────────────────────┘
```

**비용**: **$0/월** (무료 티어 내) [reddit](https://www.reddit.com/r/aws/comments/1kmyzsy/ecs_completely_within_free_tier_possible_sanity/)

**장점**:
- **영구 무료** (12개월 이후에도 계속 사용 가능)
- Auto Scaling 자동
- SSL 기본 제공

**단점**:
- Spring Boot를 Lambda로 전환 필요
- Cold Start 이슈 (첫 요청 느림)

***

### 🛠️ **Terraform 코드 (무료 티어 EC2 구성)**

#### 디렉토리 구조
```
terraform-free-tier/
├── main.tf              # 메인 리소스
├── variables.tf         # 변수 정의
├── outputs.tf           # 출력 값
├── userdata.sh          # EC2 초기 설정 스크립트
└── terraform.tfvars     # 변수 값
```

#### `main.tf`
```hcl
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

# VPC (기본 VPC 사용으로 무료)
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Security Group - EC2
resource "aws_security_group" "web" {
  name        = "web-sg"
  description = "Allow HTTP, HTTPS, SSH"
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
    cidr_blocks = ["0.0.0.0/0"]  # 보안상 자신의 IP로 제한 권장
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "web-security-group"
  }
}

# Security Group - RDS
resource "aws_security_group" "rds" {
  name        = "rds-sg"
  description = "Allow MySQL from EC2"
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

  tags = {
    Name = "rds-security-group"
  }
}

# EC2 Key Pair (사전에 생성 필요)
resource "aws_key_pair" "deployer" {
  key_name   = "deployer-key"
  public_key = file("~/.ssh/id_rsa.pub")  # 로컬 SSH 키 경로
}

# EC2 Instance - t3.micro (Free Tier)
resource "aws_instance" "web" {
  ami           = data.aws_ami.amazon_linux_2023.id
  instance_type = "t3.micro"  # Free Tier 적격

  key_name               = aws_key_pair.deployer.key_name
  vpc_security_group_ids = [aws_security_group.web.id]
  
  # EBS 볼륨 (30GB 이하로 무료 티어)
  root_block_device {
    volume_size           = 20  # GB
    volume_type           = "gp2"
    delete_on_termination = true
  }

  user_data = file("userdata.sh")

  tags = {
    Name = "web-server"
  }
}

# Amazon Linux 2023 최신 AMI
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

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "main-subnet-group"
  subnet_ids = data.aws_subnets.default.ids

  tags = {
    Name = "Main DB subnet group"
  }
}

# RDS MySQL - db.t3.micro (Free Tier)
resource "aws_db_instance" "mysql" {
  identifier        = "app-mysql-db"
  engine            = "mysql"
  engine_version    = "8.0.39"
  instance_class    = "db.t3.micro"  # Free Tier 적격
  
  allocated_storage     = 20  # GB (20GB까지 무료)
  max_allocated_storage = 20  # 자동 확장 비활성화 (과금 방지)
  storage_type          = "gp2"

  db_name  = "appdb"
  username = var.db_username
  password = var.db_password
  port     = 3306

  # Single-AZ (Multi-AZ는 유료)
  multi_az               = false
  publicly_accessible    = false
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  # 백업 설정 (20GB까지 무료)
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"

  # 삭제 보호 해제 (학습용)
  skip_final_snapshot = true
  deletion_protection = false

  tags = {
    Name = "app-mysql"
  }
}
```

#### `variables.tf`
```hcl
variable "aws_region" {
  description = "AWS Region"
  type        = string
  default     = "ap-northeast-2"  # 서울 리전
}

variable "db_username" {
  description = "RDS MySQL username"
  type        = string
  default     = "admin"
}

variable "db_password" {
  description = "RDS MySQL password"
  type        = string
  sensitive   = true
}
```

#### `outputs.tf`
```hcl
output "ec2_public_ip" {
  description = "EC2 Public IP (도메인 대신 사용)"
  value       = aws_instance.web.public_ip
}

output "ec2_public_dns" {
  description = "EC2 Public DNS"
  value       = aws_instance.web.public_dns
}

output "rds_endpoint" {
  description = "RDS MySQL Endpoint"
  value       = aws_db_instance.mysql.endpoint
}

output "rds_address" {
  description = "RDS MySQL Address"
  value       = aws_db_instance.mysql.address
}

output "connection_command" {
  description = "SSH Connection Command"
  value       = "ssh -i ~/.ssh/id_rsa ec2-user@${aws_instance.web.public_ip}"
}
```

#### `userdata.sh` (EC2 초기 설정)
```bash
#!/bin/bash
# Amazon Linux 2023 초기 설정

# 시스템 업데이트
sudo dnf update -y

# Docker 설치
sudo dnf install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Nginx 설치
sudo dnf install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Java 17 설치 (Spring Boot용)
sudo dnf install -y java-17-amazon-corretto

# Git 설치
sudo dnf install -y git

# Node.js 설치 (React 빌드용 - 선택사항)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

echo "Setup completed!" > /home/ec2-user/setup-done.txt
```

#### `terraform.tfvars`
```hcl
aws_region  = "ap-northeast-2"
db_username = "admin"
db_password = "YourStrongPassword123!"  # 강력한 비밀번호로 변경
```

***

### 🚀 **Cursor IDE에서 배포하기**

#### 1. Terraform 설치 (터미널)
```bash
# macOS
brew install terraform

# 설치 확인
terraform version
```

#### 2. AWS CLI 설정
```bash
# AWS CLI 설치
brew install awscli

# AWS 자격증명 설정
aws configure
# AWS Access Key ID: (입력)
# AWS Secret Access Key: (입력)
# Default region name: ap-northeast-2
# Default output format: json
```

#### 3. SSH 키 생성
```bash
# SSH 키가 없다면 생성
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa
```

#### 4. Cursor에서 Terraform 실행
```bash
# 프로젝트 디렉토리 이동
cd terraform-free-tier

# Terraform 초기화
terraform init

# 실행 계획 확인
terraform plan

# 배포 실행
terraform apply
# "yes" 입력하여 승인
```

#### 5. 배포 완료 후 접속
```bash
# Output에 표시된 IP로 SSH 접속
ssh -i ~/.ssh/id_rsa ec2-user@<EC2_PUBLIC_IP>

# MySQL 접속 테스트
mysql -h <RDS_ENDPOINT> -u admin -p
```

***

### 📦 **애플리케이션 배포 (EC2에서)**

#### Nginx 설정 (`/etc/nginx/nginx.conf`)
```nginx
server {
    listen 80;
    server_name _;

    # React 정적 파일
    location / {
        root /var/www/react-build;
        try_files $uri /index.html;
    }

    # Spring Boot API 프록시
    location /api/ {
        proxy_pass http://localhost:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

#### Docker Compose로 Spring Boot 실행
```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://<RDS_ENDPOINT>:3306/appdb
      SPRING_DATASOURCE_USERNAME: admin
      SPRING_DATASOURCE_PASSWORD: YourStrongPassword123!
    restart: always
```

#### React 빌드 및 배포
```bash
# 로컬에서 빌드
cd frontend
npm run build

# EC2로 전송
scp -i ~/.ssh/id_rsa -r build/* ec2-user@<EC2_IP>:/var/www/react-build/
```

***

### ⚠️ **과금 방지 체크리스트**

#### 반드시 확인할 것 [lemontia.tistory](https://lemontia.tistory.com/1120)
- [ ] EC2 인스턴스 **1개만** 실행 (750시간 = 1개 24/7)
- [ ] RDS **Single-AZ** 설정 (Multi-AZ는 과금)
- [ ] RDS 스토리지 **20GB 고정** (자동 확장 비활성화)
- [ ] EBS 볼륨 **30GB 이하**
- [ ] **Elastic IP 미사용** 또는 EC2에 연결된 상태 유지
- [ ] **ALB/NLB 사용 안 함** (무료 티어 없음)
- [ ] **NAT Gateway 사용 안 함** (시간당 과금)
- [ ] 다른 리전에 리소스 생성 안 함 (계정 전체 합산)

#### AWS Cost Explorer 설정
```bash
# AWS 콘솔 → Billing → Budget 생성
# $1 이상 사용 시 이메일 알림 설정
```

***

### 🌐 **도메인 없이 접속하기**

#### 접속 방법
```
프론트엔드: http://<EC2_PUBLIC_IP>
API 엔드포인트: http://<EC2_PUBLIC_IP>/api
```

#### EC2 Public DNS 사용 (선택사항)
```
http://ec2-13-124-123-456.ap-northeast-2.compute.amazonaws.com
```

**참고**: Route 53은 유료이므로 학습용에서는 IP 주소 직접 사용 권장

***

### 🧹 **실습 종료 후 리소스 정리**

```bash
# Terraform으로 모든 리소스 삭제
terraform destroy
# "yes" 입력하여 승인

# 수동 확인 필요
# - EBS 스냅샷 삭제
# - S3 버킷 비우기 (사용했다면)
# - CloudWatch 로그 그룹 삭제
```

***

### 📊 **예상 비용 (무료 티어 준수 시)**

| 리소스 | 사용량 | 무료 한도 | 비용 |
|--------|--------|-----------|------|
| EC2 t3.micro | 750h/월 | 750h | **$0** |
| RDS db.t3.micro | 750h/월 | 750h | **$0** |
| EBS 20GB | 20GB | 30GB | **$0** |
| RDS Storage 20GB | 20GB | 20GB | **$0** |
| RDS Backup 20GB | 20GB | 20GB | **$0** |
| **총계** | | | **$0/월** |

***

제이든님, 이 구성이면 완전히 무료로 학습 프로젝트를 운영할 수 있습니다! Cursor에서 Terraform 코드를 작성하고 바로 실행하시면 됩니다. 추가 질문이나 특정 부분에 대한 상세 설명이 필요하시면 말씀해주세요! 🚀