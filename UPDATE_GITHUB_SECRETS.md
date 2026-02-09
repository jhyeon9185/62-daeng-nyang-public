# ⚠️ GitHub Secrets 업데이트 필수

> Elastic IP 할당 및 자동 동기화 시간 변경으로 인한 업데이트 필요

---

## 변경 내역

### 1. IP 주소 변경
| 항목 | 이전 값 | 새 값 |
|------|---------|-------|
| Public IP | `3.39.187.182` (변동) | `13.125.175.126` (고정) |
| IP 유형 | 동적 IP (재시작 시 변경) | Elastic IP (영구 고정) |

### 2. 자동 동기화 시간 변경
| 항목 | 이전 값 | 새 값 |
|------|---------|-------|
| Cron 표현식 | `0 0 2 * * *` | `0 0 17 * * *` |
| 실행 시간 (한국시간) | 오전 11:00 | 새벽 02:00 |

---

## 🔧 즉시 업데이트 필요 (배포 전 필수)

### GitHub Secrets 업데이트

1. GitHub 저장소 접속
2. **Settings** → **Secrets and variables** → **Actions**
3. 다음 **3개** Secrets 수정:

#### 1) EC2_HOST
- 기존: `3.39.187.182`
- **신규: `13.125.175.126`** ← 클릭하여 복사

#### 2) FRONTEND_URL
- 기존: `http://3.39.187.182` 또는 `http://13.125.175.126`
- **신규: `http://13.125.175.126.nip.io`** ← 클릭하여 복사 (구글 OAuth는 IP 미지원, nip.io 사용)

#### 3) PUBLIC_API_SYNC_CRON (중요!)
- 기존: `0 0 2 * * *` (또는 미설정)
- **신규: `0 0 17 * * *`** ← 클릭하여 복사
- **설명:** 한국시간 새벽 2시 (UTC 17시)

---

## 📋 전체 GitHub Secrets 목록 (참고)

업데이트가 필요한 Secrets (✏️ 표시):

| Secret | 값 | 상태 |
|--------|-----|------|
| ✏️ `EC2_HOST` | `13.125.175.126` | **업데이트 필요** |
| ✏️ `FRONTEND_URL` | `http://13.125.175.126.nip.io` | **업데이트 필요** (구글 로그인 원본과 일치) |
| ✏️ `PUBLIC_API_SYNC_CRON` | `0 0 17 * * *` | **업데이트 필요** |
| `EC2_SSH_KEY` | (nas_deploy_key 전체 내용) | 변경 없음 |
| `RDS_ENDPOINT` | `dn-platform-db.c98wmqqswrwy.ap-northeast-2.rds.amazonaws.com:3306` | 변경 없음 |
| `RDS_USERNAME` | `dnadmin` | 변경 없음 |
| `RDS_PASSWORD` | `YourStrongPassword123!` | 변경 없음 |
| `JWT_SECRET` | (기존 값 유지) | 변경 없음 |
| `RESEND_API_KEY` | (기존 값 유지) | 변경 없음 |
| `RESEND_FROM_EMAIL` | (기존 값 유지) | 변경 없음 |
| `DATA_API_KEY` | (기존 값 유지) | 변경 없음 |
| `VITE_MAP_API_KEY` | (기존 값 유지) | 변경 없음 |
| `PUBLIC_API_SYNC_ENABLED` | `true` (선택) | 변경 없음 |

---

## ✅ 업데이트 후 확인

### 1. 로컬에서 새 IP 접속 테스트

```bash
curl http://13.125.175.126.nip.io
```

### 2. 브라우저 접속 테스트

1. 브라우저에서 **http://13.125.175.126.nip.io** 접속 (구글 로그인은 이 주소로만 동작)
2. **Cmd+Shift+R** (Mac) 또는 **Ctrl+Shift+R** (Windows) 강제 새로고침
3. 정상 로딩 확인

### 3. 다음 배포 후 동기화 시간 확인

**예정:** 내일(2026-02-03) 새벽 2시

```bash
ssh -i ~/.ssh/nas_deploy_key ec2-user@13.125.175.126
mysql -h dn-platform-db.c98wmqqswrwy.ap-northeast-2.rds.amazonaws.com \
  -u dnadmin -pYourStrongPassword123! dn_platform \
  -e "SELECT id, run_at, trigger_type
      FROM sync_history ORDER BY run_at DESC LIMIT 3;"
```

---

## ⚠️ 업데이트하지 않으면

### EC2_HOST, FRONTEND_URL 미업데이트 시
- 다음 배포 시 이전 IP로 덮어씌워짐
- CORS 오류 발생
- 이메일의 관리자 로그인 버튼 링크 오류

### PUBLIC_API_SYNC_CRON 미업데이트 시
- Secret에 이전 값(`0 0 2 * * *`)이 있으면 **한국시간 오전 11시**에 실행됨
- Secret이 없으면 deploy.yml 기본값(`0 0 17 * * *`) 사용 → 정상

**권장:** Secret을 명시적으로 `0 0 17 * * *`로 설정

---

## 📞 접속 정보 (신규)

- **웹사이트:** http://13.125.175.126.nip.io
- **API:** http://13.125.175.126.nip.io/api
- **Swagger:** http://13.125.175.126.nip.io/swagger-ui.html
- **SSH:** `ssh -i ~/.ssh/nas_deploy_key ec2-user@13.125.175.126`

---

**마지막 업데이트:** 2026-02-02
**적용 버전:** Elastic IP 할당 및 동기화 시간 변경 이후
