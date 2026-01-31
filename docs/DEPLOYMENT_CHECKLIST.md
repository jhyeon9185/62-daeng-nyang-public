# DN Platform 배포 체크리스트 (순차 가이드)

> Terraform으로 EC2·RDS가 이미 생성된 상태입니다. 아래 순서대로 진행하세요.

---

## 현재 상태

- ✅ EC2: `3.39.187.182` (실행 중)
- ✅ RDS: `dn-platform-db.c98wmqqswrwy.ap-northeast-2.rds.amazonaws.com:3306`
- ⬜ MySQL 마이그레이션: **아직 미실행**
- ⬜ GitHub Secrets: 설정 필요
- ⬜ 첫 배포: push 후 자동

---

## Step 1: MySQL 마이그레이션 (RDS 초기화)

RDS는 `publicly_accessible=false` 이므로 **EC2를 경유**해서 접속합니다.

### 1-1. 로컬에서 EC2로 파일 복사

```bash
# schema.sql 복사
scp -i ~/.ssh/nas_deploy_key \
  /Volumes/Samsung\ X5/dev_study/DN_project/DN_project01/docs/schema.sql \
  ec2-user@3.39.187.182:~/

# 마이그레이션 파일 복사
scp -i ~/.ssh/nas_deploy_key \
  /Volumes/Samsung\ X5/dev_study/DN_project/DN_project01/docs/migrations/V1__add_reject_reason_columns.sql \
  /Volumes/Samsung\ X5/dev_study/DN_project/DN_project01/docs/migrations/V2__add_volunteer_participant_count.sql \
  ec2-user@3.39.187.182:~/
```

### 1-2. EC2 접속

```bash
ssh -i ~/.ssh/nas_deploy_key ec2-user@3.39.187.182
```

### 1-3. EC2에서 MySQL 클라이언트 설치

```bash
sudo dnf install -y mysql
```

### 1-4. RDS에 스키마 적용 (순서 중요)

RDS 비밀번호는 `terraform/terraform.tfvars`의 `db_password` 값입니다. (기본: `YourStrongPassword123!`)

```bash
# 1) 기본 스키마 (테이블 생성)
mysql -h dn-platform-db.c98wmqqswrwy.ap-northeast-2.rds.amazonaws.com \
  -P 3306 -u dnadmin -p dn_platform < ~/schema.sql

# 2) V1 마이그레이션 (reject_reason 컬럼)
mysql -h dn-platform-db.c98wmqqswrwy.ap-northeast-2.rds.amazonaws.com \
  -P 3306 -u dnadmin -p dn_platform < ~/V1__add_reject_reason_columns.sql

# 3) V2 마이그레이션 (participant_count 컬럼)
mysql -h dn-platform-db.c98wmqqswrwy.ap-northeast-2.rds.amazonaws.com \
  -P 3306 -u dnadmin -p dn_platform < ~/V2__add_volunteer_participant_count.sql
```

> **참고**: RDS는 Terraform으로 `dn_platform` DB가 이미 생성되어 있습니다. `schema.sql`의 `CREATE DATABASE IF NOT EXISTS`는 그대로 실행해도 됩니다.

### 1-5. 적용 확인

```bash
mysql -h dn-platform-db.c98wmqqswrwy.ap-northeast-2.rds.amazonaws.com \
  -P 3306 -u dnadmin -p dn_platform -e "SHOW TABLES;"
```

`users`, `animals`, `shelters` 등 테이블이 보이면 성공입니다.

---

## Step 2: GitHub Secrets 설정

GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### 필수 Secrets (DB + 배포)

| Secret | 값 | 비고 |
|--------|-----|------|
| `EC2_HOST` | `3.39.187.182` | EC2 Public IP |
| `EC2_SSH_KEY` | `cat ~/.ssh/nas_deploy_key` 전체 출력 | 개인키 전체 내용 |
| `RDS_ENDPOINT` | `dn-platform-db.c98wmqqswrwy.ap-northeast-2.rds.amazonaws.com:3306` | |
| `RDS_USERNAME` | `dnadmin` | |
| `RDS_PASSWORD` | terraform.tfvars의 `db_password`와 **반드시 동일** | `YourStrongPassword123!` (RDS 생성 시 사용한 비밀번호) |

### 백엔드 .env 변수 → Secrets (프로덕션 환경변수)

`backend/.env`에 있는 값들을 그대로 GitHub Secrets로 등록합니다.

| Secret | 값 | backend/.env 대응 |
|--------|-----|-------------------|
| `JWT_SECRET` | 32자 이상 랜덤 문자열 | (없으면 새로 생성 권장) |
| `RESEND_API_KEY` | `re_7CWAXtfQ_8ND3ZLPgngKWsbj5Wbzjmzv6` | RESEND_API_KEY |
| `RESEND_FROM_EMAIL` | `noreply@playw.work` | RESEND_FROM_EMAIL |
| `DATA_API_KEY` | `3f6a71b1bf37087b7bf177c8f48e9e47348cfcfb7a894109c239f59082c5d69e` | DATA_API_KEY |
| `FRONTEND_URL` | `http://3.39.187.182` | 운영 시 EC2 IP 또는 도메인 |

> **JWT_SECRET**: `backend/.env`에 없으면 새로 생성. `openssl rand -base64 32` 실행 결과를 사용하세요.

### Secrets 전체 목록 (한 번에 등록용)

```
EC2_HOST
EC2_SSH_KEY
RDS_ENDPOINT
RDS_USERNAME
RDS_PASSWORD
JWT_SECRET
RESEND_API_KEY
RESEND_FROM_EMAIL
DATA_API_KEY
FRONTEND_URL
```

---

## Step 3: GitHub Actions 워크플로 업데이트

`.github/workflows/deploy.yml`이 위 Secrets를 읽어 EC2에서 Spring Boot 실행 시 환경변수로 넘기도록 되어 있어야 합니다. (이미 반영되어 있음)

---

## Step 4: 첫 배포 (git push)

```bash
cd /Volumes/Samsung\ X5/dev_study/DN_project/DN_project01
git add .
git status   # .env, terraform.tfvars 등 민감한 파일 제외 확인
git commit -m "Add deployment config and update workflow"
git push origin main
```

GitHub Actions가 자동으로:
1. 백엔드 빌드 (Maven)
2. 프론트엔드 빌드 (npm)
3. EC2에 업로드
4. Spring Boot 재시작 (환경변수 주입)

---

## Step 5: 배포 확인

1. **GitHub Actions**: Repository → Actions 탭에서 워크플로 실행 결과 확인
2. **프론트엔드**: http://3.39.187.182 접속
3. **API**: http://3.39.187.182/api/ 로 요청. **API 구조(Swagger)**: http://3.39.187.182/swagger-ui.html
4. **로그 확인** (EC2):
   ```bash
   ssh -i ~/.ssh/nas_deploy_key ec2-user@3.39.187.182
   tail -f /home/ec2-user/log.out
   tail -f /home/ec2-user/err.out
   ```

---

## 트러블슈팅

### MySQL 마이그레이션 오류

- `Access denied`: RDS 비밀번호 확인 (`terraform.tfvars`)
- `Unknown database 'dn_platform'`: RDS는 Terraform이 DB를 생성했으므로 `dn_platform`이 있어야 합니다. 없다면 AWS 콘솔 RDS에서 확인.

### Spring Boot 기동 실패

- `err.out` 확인: `tail -100 /home/ec2-user/err.out`
- DB 연결 실패: Security Group, RDS 엔드포인트 확인
- JWT/RESEND 등: GitHub Secrets에 해당 값이 있는지 확인

### CORS 오류

프론트엔드가 `http://3.39.187.182`에서 서빙되므로 `application.yml` 또는 `CorsConfig`에 해당 origin이 허용되어 있어야 합니다. 필요 시 EC2 IP 또는 도메인 추가.
