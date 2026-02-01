# ⚠️ GitHub Secrets 업데이트 필수

> Elastic IP 할당으로 인해 IP 주소가 변경되었습니다. 배포 전 반드시 업데이트하세요!

---

## 변경 내역

| 항목 | 이전 값 | 새 값 |
|------|---------|-------|
| Public IP | `3.39.187.182` (변동) | `13.125.175.126` (고정) |
| IP 유형 | 동적 IP (재시작 시 변경) | Elastic IP (영구 고정) |

---

## 🔧 즉시 업데이트 필요 (배포 전 필수)

### GitHub Secrets 업데이트

1. GitHub 저장소 접속
2. **Settings** → **Secrets and variables** → **Actions**
3. 다음 2개 Secrets 수정:

#### 1) EC2_HOST
- 기존: `3.39.187.182`
- **신규: `13.125.175.126`** ← 여기를 클릭하여 복사

#### 2) FRONTEND_URL
- 기존: `http://3.39.187.182`
- **신규: `http://13.125.175.126`** ← 여기를 클릭하여 복사

---

## 📋 전체 GitHub Secrets 목록 (참고)

업데이트가 필요한 Secrets (✏️ 표시):

| Secret | 값 | 상태 |
|--------|-----|------|
| ✏️ `EC2_HOST` | `13.125.175.126` | **업데이트 필요** |
| ✏️ `FRONTEND_URL` | `http://13.125.175.126` | **업데이트 필요** |
| `EC2_SSH_KEY` | (nas_deploy_key 전체 내용) | 변경 없음 |
| `RDS_ENDPOINT` | `dn-platform-db.c98wmqqswrwy.ap-northeast-2.rds.amazonaws.com:3306` | 변경 없음 |
| `RDS_USERNAME` | `dnadmin` | 변경 없음 |
| `RDS_PASSWORD` | `YourStrongPassword123!` | 변경 없음 |
| `JWT_SECRET` | (기존 값 유지) | 변경 없음 |
| `RESEND_API_KEY` | (기존 값 유지) | 변경 없음 |
| `RESEND_FROM_EMAIL` | (기존 값 유지) | 변경 없음 |
| `DATA_API_KEY` | (기존 값 유지) | 변경 없음 |
| `VITE_MAP_API_KEY` | (기존 값 유지) | 변경 없음 |

---

## ✅ 업데이트 후 확인

### 1. 로컬에서 새 IP 접속 테스트

```bash
curl http://13.125.175.126
```

예상 결과:
```html
<!DOCTYPE html>
<html lang="ko">
  <head>
    <title>62댕냥</title>
  ...
```

### 2. 브라우저 접속 테스트

1. 브라우저에서 **http://13.125.175.126** 접속
2. **Cmd+Shift+R** (Mac) 또는 **Ctrl+Shift+R** (Windows) 강제 새로고침
3. 정상 로딩 확인

### 3. 첫 배포 테스트

```bash
./deploy.sh
```

GitHub Actions에서 배포가 성공하는지 확인:
- https://github.com/every-git/62dn/actions

---

## 🚀 개선된 기능

### 1. ✅ Elastic IP (고정 IP)

- EC2 재시작해도 IP 유지
- DNS 설정 시 IP 변경 걱정 없음

### 2. ✅ 자동 헬스체크

- 5분마다 Nginx, Backend 상태 확인
- 서비스 다운 시 자동 재시작
- 디스크/메모리 사용량 모니터링

### 3. ✅ Systemd 자동 재시작

- EC2 부팅 시 자동으로 서비스 시작
- 서비스 크래시 시 5초 후 재시작

---

## 📞 접속 정보 (신규)

- **웹사이트:** http://13.125.175.126
- **API:** http://13.125.175.126/api
- **Swagger:** http://13.125.175.126/swagger-ui.html
- **SSH:** `ssh -i ~/.ssh/nas_deploy_key ec2-user@13.125.175.126`

---

## 🆘 문제 발생 시

### 배포가 실패함

**원인:** GitHub Secrets가 업데이트되지 않음

**해결:**
1. GitHub Secrets에서 `EC2_HOST`와 `FRONTEND_URL` 확인
2. 값이 `13.125.175.126`인지 확인
3. 재배포 시도

### 브라우저에서 접속이 안 됨

**원인:** 브라우저 캐시

**해결:**
1. **Cmd+Shift+R** (강제 새로고침)
2. 시크릿 모드로 접속 시도
3. 개발자 도구(F12) → Network 탭에서 실제 오류 확인

### 이전 IP로 계속 접속됨

**원인:** DNS 캐시

**해결:**
```bash
# Mac
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# 브라우저 캐시 삭제
# Chrome: chrome://net-internals/#dns → Clear host cache
```

---

## 📚 관련 문서

- [AWS 안정성 개선 가이드](docs/AWS_STABILITY_GUIDE.md) - 상세 설명
- [배포 체크리스트](docs/DEPLOYMENT_CHECKLIST.md) - 배포 절차
- [Terraform 가이드](docs/TERRAFORM_DEPLOY_GUIDE.md) - 인프라 설정

---

**마지막 업데이트:** 2026-02-02
**적용 버전:** Elastic IP 할당 이후
