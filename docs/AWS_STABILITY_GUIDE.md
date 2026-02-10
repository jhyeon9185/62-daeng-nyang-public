# AWS 안정성 개선 가이드

> Elastic IP 할당 및 자동 헬스체크로 안정적인 운영 환경 구축

---

## ✅ 완료된 개선사항

### 1. Elastic IP 할당 (고정 IP)

**변경 전:**
- Public IP: `3.39.187.182` (EC2 재시작 시 변경됨)

**변경 후:**
- Elastic IP: `13.125.175.126` (고정 IP, 영구 유지)

**효과:**
- EC2가 재시작되어도 IP 주소가 바뀌지 않음
- DNS 설정이나 외부 연동 시 IP 변경 걱정 없음

### 2. 자동 헬스체크 (5분마다)

**위치:** `/home/ec2-user/healthcheck.sh`

**모니터링 항목:**
- ✅ Nginx 서비스 상태 (다운 시 자동 재시작)
- ✅ Backend 서비스 상태 (다운 시 자동 재시작)
- ✅ HTTP 응답 확인 (200/304 체크)
- ⚠️ 디스크 사용량 (80% 이상 경고)
- ⚠️ 메모리 사용량 (90% 이상 경고)

**로그 위치:** `/home/ec2-user/healthcheck.log`

**수동 실행:**
```bash
ssh -i ~/.ssh/nas_deploy_key ec2-user@13.125.175.126
~/healthcheck.sh
tail -f ~/healthcheck.log
```

### 3. Systemd 서비스 자동 시작

- ✅ `nginx.service`: enabled (부팅 시 자동 시작)
- ✅ `dn-platform.service`: enabled (부팅 시 자동 시작)
- ✅ 서비스 실패 시 자동 재시작 (RestartSec=5)

---

## 🔧 필수 업데이트 사항

### GitHub Secrets 업데이트

새로운 Elastic IP로 다음 Secrets를 업데이트하세요:

1. **GitHub** → **Settings** → **Secrets and variables** → **Actions**

| Secret | 기존 값 | 새 값 |
|--------|---------|-------|
| `EC2_HOST` | `3.39.187.182` | `13.125.175.126` |
| `FRONTEND_URL` | `http://3.39.187.182` | `http://13.125.175.126` |

> **중요:** 위 2개 Secrets를 업데이트하지 않으면 다음 배포 시 실패합니다!

### 로컬 문서 업데이트

다음 파일에서 IP 주소를 변경하세요:

```bash
# 프로젝트 전체에서 이전 IP 검색
grep -r "3.39.187.182" docs/ deploy.sh
```

**업데이트 필요 파일:**
- [ ] `deploy.sh` (접속 URL)
- [ ] `docs/DEPLOYMENT_CHECKLIST.md`
- [ ] `docs/TERRAFORM_DEPLOY_GUIDE.md`
- [ ] 기타 IP가 하드코딩된 문서

---

## 📊 모니터링 방법

### 1. 헬스체크 로그 확인

```bash
ssh -i ~/.ssh/nas_deploy_key ec2-user@13.125.175.126
tail -f ~/healthcheck.log
```

**예시 출력:**
```
[2026-02-01 20:43:12] ✅ Nginx 정상
[2026-02-01 20:43:12] ✅ Backend 정상 (HTTP 200)
[2026-02-01 20:48:00] ✅ Nginx 정상
[2026-02-01 20:48:00] ✅ Backend 정상 (HTTP 200)
```

### 2. 서비스 상태 확인

```bash
ssh -i ~/.ssh/nas_deploy_key ec2-user@13.125.175.126
sudo systemctl status nginx dn-platform
```

### 3. 백엔드 로그 확인

```bash
ssh -i ~/.ssh/nas_deploy_key ec2-user@13.125.175.126
tail -f /home/ec2-user/log.out   # 일반 로그
tail -f /home/ec2-user/err.out   # 에러 로그
```

### 4. 리소스 사용량 확인

```bash
ssh -i ~/.ssh/nas_deploy_key ec2-user@13.125.175.126
# 디스크 사용량
df -h

# 메모리 사용량
free -h

# CPU 사용량
top
```

---

## 🚀 배포 프로세스 (업데이트)

### 자동 배포 (GitHub Actions)

```bash
./deploy.sh
# 또는
git add .
git commit -m "변경사항"
git push origin main
```

**배포 순서:**
1. Backend 빌드 (Maven)
2. Frontend 빌드 (Vite)
3. EC2에 파일 업로드
4. Nginx 설정 업데이트
5. Backend 재시작
6. 헬스체크 자동 실행 (5분 이내)

### 수동 배포

```bash
ssh -i ~/.ssh/nas_deploy_key ec2-user@13.125.175.126

# Backend 재시작
sudo systemctl restart dn-platform

# Nginx 재시작
sudo systemctl restart nginx

# 헬스체크 수동 실행
~/healthcheck.sh
```

---

## 🛡️ 보안 및 백업

### RDS 자동 백업

- ✅ 백업 주기: 매일 (retention: 1일)
- ✅ 백업 시간: 03:00-04:00 UTC (한국 시간 12:00-13:00)
- ✅ 유지 관리: 월요일 04:00-05:00 UTC (한국 시간 13:00-14:00)

### EC2 백업 (선택사항)

AMI 스냅샷 생성:
```bash
aws ec2 create-image \
  --instance-id i-0f91c8b4bf05ea2d9 \
  --name "dn-platform-backup-$(date +%Y%m%d)" \
  --description "DN Platform backup"
```

---

## 📈 추가 개선 가능 사항

### 1. CloudWatch 알람 (선택)

비용이 발생하지만, 더 강력한 모니터링 가능:
- CPU 사용률 > 80%
- 메모리 사용률 > 90%
- 디스크 사용률 > 80%
- HTTP 5xx 에러 급증

### 2. Route 53 도메인 연결

도메인이 있다면:
```
dn-platform.com → 13.125.175.126 (Elastic IP)
```

### 3. HTTPS 설정 (Let's Encrypt)

```bash
sudo dnf install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### 4. 로그 로테이션

```bash
# /etc/logrotate.d/dn-platform
/home/ec2-user/log.out
/home/ec2-user/err.out
/home/ec2-user/healthcheck.log
{
    daily
    rotate 7
    compress
    missingok
    notifempty
}
```

---

## 🆘 트러블슈팅

### EC2 재시작 후 IP가 바뀜

**증상:** Elastic IP 적용했는데도 IP가 바뀜

**해결:**
```bash
cd terraform
terraform apply
```

### 헬스체크가 실행되지 않음

**확인:**
```bash
ssh -i ~/.ssh/nas_deploy_key ec2-user@13.125.175.126
crontab -l
sudo systemctl status crond
```

**재설정:**
```bash
(crontab -l 2>/dev/null | grep -v healthcheck.sh; echo "*/5 * * * * /home/ec2-user/healthcheck.sh") | crontab -
```

### 서비스가 계속 다운됨

**로그 확인:**
```bash
tail -100 /home/ec2-user/err.out
journalctl -u dn-platform -n 50
```

**일반적인 원인:**
- DB 연결 실패 (RDS_ENDPOINT 확인)
- 메모리 부족 (free -h 확인)
- 포트 충돌 (8080 포트 사용 중인지 확인)

---

## 📞 접속 정보 (업데이트)

- **웹사이트:** http://13.125.175.126
- **API:** http://13.125.175.126/api
- **Swagger:** http://13.125.175.126/swagger-ui.html
- **SSH:** `ssh -i ~/.ssh/nas_deploy_key ec2-user@13.125.175.126`

---

## ✅ 체크리스트

- [x] Elastic IP 할당
- [x] Terraform 설정 업데이트
- [x] 헬스체크 스크립트 배포
- [x] Cron 자동 실행 설정
- [ ] GitHub Secrets 업데이트 (EC2_HOST, FRONTEND_URL)
- [ ] 문서 내 IP 주소 변경
- [ ] 첫 배포 테스트
- [ ] 브라우저에서 새 IP 접속 확인
