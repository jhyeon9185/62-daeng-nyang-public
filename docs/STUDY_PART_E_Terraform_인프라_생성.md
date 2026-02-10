# DN_project01 × Terraform 배포 가이드

> AWS_Gemini에서 배운 **EB + RDS + GitHub Actions** 흐름을 **Terraform + EC2**로 적용하는 가이드입니다.

---

## 0️⃣ AWS 콘솔에서 할 일 (이미 가입했다면)

Terraform과 GitHub Actions가 AWS 리소스를 만들고 접근하려면 **IAM 사용자**와 **Access Key**가 필요합니다. AWS 콘솔에서 다음만 하면 됩니다.

### Step 1: IAM 사용자 생성

1. **AWS 콘솔** → 상단 검색창에 `IAM` 입력 → **IAM** 이동
2. 왼쪽 메뉴 **사용자** → **사용자 만들기**
3. **사용자 이름**: `dn-platform-terraform` (원하는 이름)
4. **액세스 키 - 프로그래매틱 액세스** 선택 → 다음
5. **권한 설정** → **직접 정책 연결** → **정책 생성** 클릭

### Step 2: Terraform용 정책 생성

새 탭에서 정책 편집기:

- **JSON** 탭 선택 후 아래 붙여넣기:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:*",
        "rds:*",
        "iam:PassRole"
      ],
      "Resource": "*"
    }
  ]
}
```

- **다음** → **정책 이름**: `DNPlatformTerraformPolicy` → **정책 생성**
- IAM 사용자 만들기 화면으로 돌아가서 방금 만든 `DNPlatformTerraformPolicy` 선택 → 다음 → **사용자 만들기**

### Step 3: Access Key 저장

1. **액세스 키 ID**와 **비밀 액세스 키**가 보입니다.
2. **비밀 액세스 키**는 이 화면에서만 확인 가능하므로 반드시 저장
3. **.csv 다운로드** 후 안전한 곳에 보관

### Step 4: 로컬에서 AWS CLI 설정

```bash
aws configure
# AWS Access Key ID: (Step 3에서 복사)
# AWS Secret Access Key: (Step 3에서 복사)
# Default region name: ap-northeast-2
# Default output format: json
```

이 설정이 끝나면 Terraform과 GitHub Actions가 이 계정으로 AWS 리소스를 생성·관리합니다.

### 정리: AWS 콘솔 체크리스트

- [ ] IAM 사용자 생성 (`dn-platform-terraform`)
- [ ] Terraform용 정책 연결 (EC2, RDS 권한)
- [ ] Access Key 발급 및 저장
- [ ] `aws configure` 로 로컬 설정

### (선택) 과금 알림 설정

`Billing` → `Billing preferences` → `Receive Free Tier Usage Alerts` 체크  
또는 `Budgets` → 예산 생성 → $5 이상 사용 시 이메일 알림 (과금 방지)

---

## 📋 AWS_Gemini vs DN_project01 비교

| 구분 | AWS_Gemini (책) | DN_project01 (현재 프로젝트) |
|------|-----------------|------------------------------|
| **빌드 도구** | Gradle | **Gradle** (`build.gradle.kts`) |
| **Java** | Java 21 | Java 21 ✓ |
| **JAR 파일명** | `aws-v2-0.0.1.jar` | `platform-0.0.1-SNAPSHOT.jar` |
| **DB** | MariaDB | **MySQL 8.0** |
| **프론트엔드** | 없음 (백엔드만) | **React + Vite** |
| **배포 방식** | Elastic Beanstalk | **EC2 + Nginx** (무료 티어) |
| **인프라 정의** | AWS 콘솔 수동 | **Terraform** |

---

## 🏗️ 아키텍처 매핑

### AWS_Gemini (V4~V5)
```
GitHub push → GitHub Actions → EB 배포 → RDS
```

### Terraform 방식 (DN_project01)
```
Terraform (EC2 + RDS 생성)
    ↓
GitHub push → GitHub Actions → EC2에 배포 (scp + deploy script) → RDS
```

---

## 📁 Terraform 디렉터리 구조

```
DN_project01/
├── terraform/                    # Terraform 인프라 정의
│   ├── main.tf                   # EC2, RDS, Security Group
│   ├── variables.tf              # 변수
│   ├── outputs.tf                # 출력 (IP, RDS 엔드포인트 등)
│   ├── userdata.sh               # EC2 초기 설정 (Java 21, Maven, Node.js, Nginx)
│   └── terraform.tfvars.example  # 변수 예시 (비밀번호 등)
│
├── .github/workflows/
│   └── deploy.yml                # GitHub Actions CI/CD
│
└── scripts/
    └── deploy-to-ec2.sh          # EC2에서 실행할 배포 스크립트
```

---

## 1️⃣ Terraform 설정

### `terraform/main.tf`

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
    cidr_blocks = ["0.0.0.0/0"]  # 보안: 실제 IP로 제한 권장
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
    security_groups = [aws_security_group.web.id]  # SG Chaining
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
  public_key = file(var.ssh_public_key_path)
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
  ami           = data.aws_ami.amazon_linux_2023.id
  instance_type = "t3.micro"
  key_name      = aws_key_pair.deployer.key_name
  vpc_security_group_ids = [aws_security_group.web.id]

  root_block_device {
    volume_size           = 20
    volume_type           = "gp2"
    delete_on_termination = true
  }

  user_data = file("${path.module}/userdata.sh")

  tags = { Name = "dn-platform-web" }
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

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "mon:04:00-mon:05:00"

  skip_final_snapshot = true
  deletion_protection = false

  tags = { Name = "dn-platform-mysql" }
}
```

### `terraform/variables.tf`

```hcl
variable "aws_region" {
  description = "AWS Region"
  type        = string
  default     = "ap-northeast-2"
}

variable "ssh_public_key_path" {
  description = "SSH public key path"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}

variable "db_name" {
  description = "RDS database name"
  type        = string
  default     = "dn_platform"
}

variable "db_username" {
  description = "RDS username"
  type        = string
  default     = "dnadmin"
}

variable "db_password" {
  description = "RDS password"
  type        = string
  sensitive   = true
}
```

### `terraform/outputs.tf`

```hcl
output "ec2_public_ip" {
  description = "EC2 Public IP"
  value       = aws_instance.web.public_ip
}

output "ec2_public_dns" {
  description = "EC2 Public DNS"
  value       = aws_instance.web.public_dns
}

output "rds_endpoint" {
  description = "RDS Endpoint"
  value       = aws_db_instance.mysql.endpoint
}

output "ssh_command" {
  description = "SSH 접속 명령"
  value       = "ssh -i ~/.ssh/id_rsa ec2-user@${aws_instance.web.public_ip}"
}
```

### `terraform/userdata.sh` (DN_project01용 - Java 21, Maven, Node.js)

```bash
#!/bin/bash
set -e

# 시스템 업데이트
sudo dnf update -y

# Java 21 (Corretto)
sudo dnf install -y java-21-amazon-corretto-devel

# Node.js 20 (React 빌드)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20

# Nginx
sudo dnf install -y nginx

# Git
sudo dnf install -y git

# 프로젝트 디렉터리
mkdir -p /home/ec2-user/app
sudo chown -R ec2-user:ec2-user /home/ec2-user/app

# React 빌드 배포 디렉터리
sudo mkdir -p /var/www/dn-platform
sudo chown ec2-user:ec2-user /var/www/dn-platform

# Nginx 기본 설정 (배포 시 덮어씀)
sudo tee /etc/nginx/conf.d/dn-platform.conf <<'NGINX'
server {
    listen 80;
    server_name _;
    root /var/www/dn-platform;
    index index.html;
    try_files $uri $uri/ /index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
NGINX

sudo systemctl enable nginx
sudo systemctl start nginx

echo "Setup completed at $(date)" > /home/ec2-user/setup-done.txt
```

### `terraform/terraform.tfvars.example`

```hcl
aws_region  = "ap-northeast-2"
db_name     = "dn_platform"
db_username = "dnadmin"
db_password = "YourStrongPassword123!"  # 반드시 변경
```

---

## 2️⃣ GitHub Actions (CI/CD)

AWS_Gemini V5처럼 `main` 브랜치 push 시 자동 배포합니다.  
차이점: **Maven** 사용, **React 빌드** 추가, **EC2 배포** (EB 대신).

### `.github/workflows/deploy.yml`

```yaml
name: DN Platform Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      # Java 21
      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: 'gradle'

      # Backend 빌드 (Gradle)
      - name: Build Backend
        run: |
          cd backend
          ./gradlew clean bootJar -x test
          ls -la build/libs/*.jar

      # Node.js + React 빌드
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Build Frontend
        run: |
          cd frontend
          npm ci
          npm run build
          ls -la dist/

      # 배포 패키지 생성
      - name: Create deploy package
        run: |
          mkdir -p deploy
          cp backend/build/libs/platform-0.0.1-SNAPSHOT.jar deploy/
          cp -r frontend/dist deploy/frontend-dist
          tar -czvf deploy.tar.gz deploy/

      # EC2에 업로드 및 배포
      - name: Deploy to EC2
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ec2-user
          key: ${{ secrets.EC2_SSH_KEY }}
          source: "deploy.tar.gz"
          target: "/home/ec2-user/"

      - name: Extract and Restart on EC2
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ec2-user
          key: ${{ secrets.EC2_SSH_KEY }}
          envs: RDS_ENDPOINT,RDS_USERNAME,RDS_PASSWORD
        env:
          RDS_ENDPOINT: ${{ secrets.RDS_ENDPOINT }}
          RDS_USERNAME: ${{ secrets.RDS_USERNAME }}
          RDS_PASSWORD: ${{ secrets.RDS_PASSWORD }}
          script: |
            cd /home/ec2-user
            tar -xzvf deploy.tar.gz
            # JAR 배포
            mkdir -p app
            cp deploy/platform-0.0.1-SNAPSHOT.jar app/
            # React 빌드 배포
            sudo mkdir -p /var/www/dn-platform
            sudo cp -r deploy/frontend-dist/* /var/www/dn-platform/
            # Spring Boot 재시작
            pkill -f platform-0.0.1-SNAPSHOT.jar || true
            sleep 2
            cd app
            nohup java -jar -Dspring.profiles.active=prod platform-0.0.1-SNAPSHOT.jar \
              --spring.datasource.url=jdbc:mysql://${RDS_ENDPOINT}/dn_platform \
              --spring.datasource.username=${RDS_USERNAME} \
              --spring.datasource.password=${RDS_PASSWORD} \
              1>/home/ec2-user/log.out 2>/home/ec2-user/err.out &
            rm -f /home/ec2-user/deploy.tar.gz
```

### GitHub Secrets 등록

| Secret | 설명 |
|--------|------|
| `EC2_HOST` | EC2 Public IP (Terraform output) |
| `EC2_SSH_KEY` | EC2 접속용 개인키 전체 내용 |
| `RDS_ENDPOINT` | RDS 엔드포인트 (예: `dn-platform-db.xxx.rds.amazonaws.com:3306`) |
| `RDS_USERNAME` | DB 사용자명 |
| `RDS_PASSWORD` | DB 비밀번호 |

---

## 3️⃣ DN_project01 백엔드 설정

### `application-prod.yml` 환경변수 매핑

AWS_Gemini처럼 `${rds.hostname}` 등 환경변수 사용:

```yaml
spring:
  profiles: prod
  datasource:
    url: jdbc:mysql://${DB_HOST:localhost}:${DB_PORT:3306}/${DB_NAME:dn_platform}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
```

GitHub Actions의 `--spring.datasource.url=...` 로 런타임에 주입하거나, EC2에서 `.env` 파일로 관리할 수 있습니다.

---

## 4️⃣ 실행 순서

### 1. AWS 콘솔 (위 "0️⃣ AWS 콘솔에서 할 일" 참고)

- IAM 사용자 + Access Key 생성
- `aws configure` 실행

### 2. 사전 준비 (로컬)

```bash
# Terraform 설치
brew install terraform

# SSH 키 확인 (없으면 생성)
ls ~/.ssh/id_rsa.pub
# 없으면: ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa
```

### 3. Terraform 실행

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# terraform.tfvars 에 db_password 수정 (강력한 비밀번호로!)

terraform init
terraform plan
terraform apply   # yes 입력
```

### 4. RDS 초기화 (필수)

`application-prod.yml`이 `ddl-auto: validate` 이므로 **테이블을 먼저 생성**해야 합니다.

RDS는 `publicly_accessible = false` 이므로 **EC2를 경유**해서 접속합니다:

```bash
# 1) schema.sql을 EC2로 복사
scp -i ~/.ssh/id_rsa docs/schema.sql ec2-user@<EC2_PUBLIC_IP>:~/

# 2) EC2 접속
ssh -i ~/.ssh/id_rsa ec2-user@<EC2_PUBLIC_IP>

# 3) MySQL 클라이언트 설치
sudo dnf install -y mysql

# 4) RDS 접속 및 스키마 적용 (rds_endpoint는 host:port 형식)
mysql -h <RDS_HOST> -P 3306 -u dnadmin -p dn_platform < ~/schema.sql
# RDS_HOST: terraform output rds_endpoint 에서 :3306 앞부분만 사용
```

### 5. GitHub Secrets 설정

GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret | 값 |
|--------|-----|
| `EC2_HOST` | `terraform output -raw ec2_public_ip` |
| `EC2_SSH_KEY` | `cat ~/.ssh/id_rsa` 전체 내용 복사 |
| `RDS_ENDPOINT` | `terraform output -raw rds_endpoint` |
| `RDS_USERNAME` | `dnadmin` (terraform.tfvars와 동일) |
| `RDS_PASSWORD` | terraform.tfvars의 db_password와 동일 |

### 6. 첫 배포

```bash
git add .
git commit -m "Add Terraform and CI/CD"
git push origin main
```

---

## 5️⃣ AWS_Gemini 개념 → Terraform 대응표

| AWS_Gemini | Terraform 방식 |
|------------|----------------|
| EB 환경 수동 생성 | `aws_instance` (EC2) |
| RDS 수동 생성 | `aws_db_instance` |
| Security Group Chaining | `security_groups = [aws_security_group.web.id]` |
| EB 환경변수 (RDS_HOSTNAME 등) | GitHub Secrets + `--spring.datasource.*` 또는 EC2 `.env` |
| Procfile | `nohup java -jar ...` (userdata/deploy script) |
| GitHub Actions → EB | GitHub Actions → EC2 (scp + ssh) |

---

## 6️⃣ 비용 (무료 티어)

| 리소스 | 한도 | 비용 |
|--------|------|------|
| EC2 t3.micro | 750h/월 | $0 |
| RDS db.t3.micro | 750h/월 | $0 |
| EBS 20GB | 30GB 이하 | $0 |

**주의**: Elastic IP 미사용, ALB/NAT Gateway 미사용.
