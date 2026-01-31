#!/bin/bash
set -e

# 시스템 업데이트
sudo dnf update -y

# Java 21 (Corretto)
sudo dnf install -y java-21-amazon-corretto-devel

# Maven
sudo dnf install -y maven

# Node.js 20 (React 빌드용 - EC2에서 빌드할 경우)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
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
chown -R ec2-user:ec2-user /home/ec2-user/app

# React 빌드 배포 디렉터리
sudo mkdir -p /var/www/dn-platform
sudo chown -R ec2-user:ec2-user /var/www/dn-platform

# Nginx 설정
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

# 기본 index.html (배포 전 빈 페이지)
echo "<html><body>Deploy in progress...</body></html>" | sudo tee /var/www/dn-platform/index.html

sudo systemctl enable nginx
sudo systemctl start nginx

echo "Setup completed at $(date)" > /home/ec2-user/setup-done.txt
