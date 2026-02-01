# 동기화 및 이메일 URL 수정 리포트

> 날짜: 2026-02-02
> 이슈: IP 변경으로 인한 자동 동기화 미실행 및 이메일 URL 확인

---

## 🔍 발견된 문제

### 1. ❌ 자동 동기화 미실행

**원인:** `sync_history` 테이블 스키마 오류
- `trigger_type` 컬럼이 **VARCHAR(20)**로 생성됨
- Hibernate는 **ENUM('AUTO', 'MANUAL')**을 기대
- Schema validation 실패로 백엔드가 제대로 시작되지 못함

**영향:**
- 마지막 동기화: 2026-02-01 20:42 (MANUAL, 수동)
- 새벽 2시 자동 동기화: **실행 안 됨**

**에러 로그:**
```
Schema-validation: wrong column type encountered in column [trigger_type] in table [sync_history];
found [varchar (Types#VARCHAR)], but expecting [enum ('auto','manual') (Types#ENUM)]
```

### 2. ⚠️ start.sh에 이전 IP 하드코딩

**위치:** `/home/ec2-user/app/start.sh`

**문제:**
```bash
--app.frontend-url=http://3.39.187.182/
--cors.allowed-origins=http://localhost:5173,http://localhost:3000,http://3.39.187.182/
```

**원인:** GitHub Secrets가 업데이트되지 않아 배포 시 이전 IP 사용

### 3. ✅ 이메일 URL - 문제 없음

**확인 결과:** `EmailService.java:134`
```java
String adminLoginHref = (frontendUrl != null && !frontendUrl.isBlank())
    ? frontendUrl.replaceAll("/+$", "") + "/admin/login"
    : "#";
```

- `@Value("${app.frontend-url}")` 환경변수 사용
- 하드코딩 없음
- GitHub Secrets 업데이트하면 자동 반영

---

## ✅ 적용된 수정

### 1. sync_history 테이블 스키마 수정

```sql
ALTER TABLE sync_history
MODIFY COLUMN trigger_type ENUM('AUTO', 'MANUAL') NOT NULL;
```

**결과:**
```
Field           Type                    Null  Key  Default
trigger_type    enum('AUTO','MANUAL')   NO         NULL
```

### 2. start.sh 임시 수정 (EC2)

```bash
sed -i 's|http://3.39.187.182|http://13.125.175.126|g' /home/ec2-user/app/start.sh
```

**수정 후:**
```bash
--app.frontend-url="http://13.125.175.126/"
--cors.allowed-origins="http://localhost:5173,http://localhost:3000,http://13.125.175.126/"
```

### 3. 백엔드 재시작

```bash
sudo systemctl restart dn-platform
```

**상태:** ✅ 정상 실행 중
- PID: 3308
- 포트 8080: 리스닝
- API 응답: 정상

### 4. V5 마이그레이션 파일 수정

**파일:** `docs/migrations/V5__add_sync_history.sql`

**변경:**
```sql
-- 이전
trigger_type VARCHAR(20) NOT NULL,

-- 수정
trigger_type ENUM('AUTO', 'MANUAL') NOT NULL,
```

---

## 📋 다음 배포 시 자동 반영될 사항

다음 배포(`git push` 시)에는 다음이 자동으로 반영됩니다:

1. ✅ **V5 마이그레이션** - ENUM으로 테이블 생성
2. ✅ **start.sh** - GitHub Secrets의 `FRONTEND_URL` 사용
3. ✅ **이메일 URL** - 새 IP 자동 반영

---

## ⚠️ 필수 조치: GitHub Secrets 업데이트

**현재 상태:**
- EC2: ✅ 임시 수정으로 정상 작동 중
- GitHub Secrets: ❌ 이전 IP 사용 중

**다음 배포 전 반드시 업데이트:**

### GitHub 저장소 → Settings → Secrets and variables → Actions

| Secret | 현재 값 (추정) | 신규 값 |
|--------|---------------|---------|
| `EC2_HOST` | `3.39.187.182` | `13.125.175.126` |
| `FRONTEND_URL` | `http://3.39.187.182` | `http://13.125.175.126` |

**업데이트하지 않으면:**
- 다음 배포 시 이전 IP로 덮어씌워짐
- CORS 오류 발생
- 이메일의 관리자 로그인 버튼 링크 오류

---

## 🔄 자동 동기화 검증

### 다음 실행 예정 시간

- **Cron 설정:** `0 0 17 * * *` (매일 UTC 17시)
- **한국 시간:** 매일 새벽 02:00 ✅

### 검증 방법

**내일 새벽 2시 이후 확인:**

```bash
# SSH 접속
ssh -i ~/.ssh/nas_deploy_key ec2-user@13.125.175.126

# 동기화 이력 조회
mysql -h dn-platform-db.c98wmqqswrwy.ap-northeast-2.rds.amazonaws.com \
  -u dnadmin -pYourStrongPassword123! dn_platform \
  -e "SELECT id, run_at, trigger_type, added_count, updated_count
      FROM sync_history
      ORDER BY run_at DESC LIMIT 5;"
```

**예상 결과:**
```
id  run_at                  trigger_type  added_count  updated_count
2   2026-02-02 02:00:xx     AUTO          XX           XXX
1   2026-02-01 20:42:13     MANUAL        15           339
```

### 로그 확인

```bash
# 스케줄러 로그
tail -100 /home/ec2-user/log.out | grep -i "sync\|schedule"

# 에러 로그
tail -100 /home/ec2-user/err.out
```

---

## 📊 현재 상태

### 시스템 상태

| 항목 | 상태 | 비고 |
|------|------|------|
| EC2 | ✅ 실행 중 | Elastic IP: 13.125.175.126 |
| RDS | ✅ 정상 | MySQL 8.0 |
| Nginx | ✅ 정상 | 포트 80 리스닝 |
| Backend | ✅ 정상 | 포트 8080 리스닝 |
| API | ✅ 정상 | `/api/animals` 응답 확인 |
| 스키마 | ✅ 수정 완료 | `trigger_type` ENUM |
| start.sh | ✅ 임시 수정 | 새 IP 반영 |
| GitHub Secrets | ⚠️ 업데이트 필요 | 배포 전 필수 |

### 동기화 이력

| ID | 실행 시각 | 유형 | 추가 | 수정 | 상태 |
|----|-----------|------|------|------|------|
| 1 | 2026-02-01 20:42 | MANUAL | 15 | 339 | SUCCESS |

---

## 🎯 액션 아이템

### 즉시 조치 (완료)

- [x] sync_history 스키마 수정 (ENUM)
- [x] start.sh IP 주소 수정
- [x] 백엔드 재시작
- [x] V5 마이그레이션 파일 수정
- [x] API 동작 확인

### 다음 배포 전 (필수)

- [ ] **GitHub Secrets 업데이트**
  - [ ] `EC2_HOST` → `13.125.175.126`
  - [ ] `FRONTEND_URL` → `http://13.125.175.126`
- [ ] `UPDATE_GITHUB_SECRETS.md` 참고

### 내일 확인 (2026-02-03)

- [ ] 오전 11시 이후 동기화 이력 확인
- [ ] `trigger_type = 'AUTO'` 레코드 생성 확인
- [ ] 에러 없이 실행되었는지 로그 확인

---

## 📚 관련 문서

- [UPDATE_GITHUB_SECRETS.md](UPDATE_GITHUB_SECRETS.md) - GitHub Secrets 업데이트 가이드
- [AWS_STABILITY_GUIDE.md](docs/AWS_STABILITY_GUIDE.md) - AWS 안정성 가이드
- [DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md) - 배포 체크리스트

---

**작성:** 2026-02-02
**상태:** sync_history 스키마 수정 완료, GitHub Secrets 업데이트 대기 중
