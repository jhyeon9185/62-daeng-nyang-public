# AWS 배포 스터디 — 파트 F: CI/CD와 환경변수

> **프로젝트**: 62댕냥이 (유기동물 입양/임보 매칭 플랫폼)
> **기술 스택**: Spring Boot 3.2 + Java 21 / React 18 + TypeScript + Vite
> **인프라**: AWS EC2 + RDS + Nginx + GitHub Actions CI/CD
> **전편**: [파트 E — Terraform 인프라 생성](./STUDY_PART_E_Terraform_인프라_생성.md)
> **작성 기준**: 실제 프로젝트 코드 (`DN_project01`)

---

## 목차

| 장 | 제목 | 핵심 키워드 |
|---|------|------------|
| 8장 | RDS 초기화 | EC2 경유 접속, schema.sql, 마이그레이션, ENUM 매핑 |
| 9장 | GitHub Secrets | 환경변수 16개, 추적 경로, IP 변경 실수 |
| 10장 | deploy.yml 상세 분석 | GitHub Actions, 빌드→패키징→SCP→SSH |
| 11장 | EC2 내부 구조 | Nginx, Systemd, start.sh, 디버깅 명령어 |

---

# 8장. RDS 초기화 — "Terraform이 DB는 만들지만 테이블은 안 만든다"

## Why — 왜 별도 초기화가 필요한가

파트 A에서 `terraform apply`를 실행하면 RDS 인스턴스와 빈 데이터베이스(`dn_platform`)가 생성된다.
하지만 **테이블은 하나도 없다**. Terraform은 인프라(서버, 네트워크, DB 인스턴스)를 만드는 도구이지, 애플리케이션 레벨의 스키마(Schema)를 관리하지 않는다.

```
terraform apply 결과:
  ✅ EC2 인스턴스 생성
  ✅ RDS MySQL 인스턴스 생성
  ✅ 데이터베이스 "dn_platform" 생성
  ❌ 테이블? → 0개. 직접 만들어야 한다.
```

> **초보자가 가장 많이 빠지는 함정**: Terraform이 다 해줄 줄 알고 바로 애플리케이션을 배포한다
> → Spring Boot가 기동되면서 `Table 'dn_platform.users' doesn't exist` 에러가 터진다.

## How — EC2 경유로 RDS에 접속하기

이 프로젝트의 RDS는 `publicly_accessible = false`로 설정되어 있다.
즉, **로컬 PC에서 직접 RDS에 접속할 수 없다**. 같은 VPC 안에 있는 EC2를 경유해야 한다.

### 왜 외부 접속을 막는가?

| 설정 | 의미 | 보안 |
|------|------|------|
| `publicly_accessible = true` | 인터넷에서 RDS 직접 접속 가능 | 위험 — 무차별 대입 공격 대상 |
| `publicly_accessible = false` | VPC 내부에서만 접속 가능 | 안전 — EC2를 거쳐야만 접근 |

### Step 1: EC2에 SSH 접속

```bash
ssh -i ~/.ssh/id_rsa ec2-user@13.125.175.126
```

- `13.125.175.126`: Elastic IP (고정 IP)
- `ec2-user`: Amazon Linux의 기본 사용자
- `~/.ssh/id_rsa`: Terraform에서 등록한 SSH 키

### Step 2: MySQL 클라이언트 설치

EC2에는 기본적으로 MySQL 클라이언트가 없다. 설치해야 한다.

```bash
# Amazon Linux 2023 (AL2023)
sudo dnf install -y mariadb105

# Amazon Linux 2 (구버전)
sudo yum install -y mariadb
```

> **주의**: `mysql-server`가 아니라 `mariadb105`(클라이언트)만 설치한다.
> EC2에 MySQL 서버를 설치하는 게 아니라, RDS에 접속할 클라이언트만 필요하다.

### Step 3: RDS 접속

```bash
mysql -h dn-platform-db.c98wmqqswrwy.ap-northeast-2.rds.amazonaws.com \
      -P 3306 \
      -u dnadmin \
      -p \
      dn_platform
```

- `-h`: RDS 엔드포인트 (호스트)
- `-P 3306`: 포트 (MySQL 기본 포트)
- `-u dnadmin`: Terraform에서 설정한 DB 사용자명
- `-p`: 비밀번호 입력 프롬프트 (치면 안 보임)
- `dn_platform`: 접속할 데이터베이스 이름

접속 성공하면:

```
Welcome to the MariaDB monitor.
MySQL [(dn_platform)]>
```

### Step 4: schema.sql로 테이블 생성

`docs/schema.sql` 파일에 전체 14개 테이블의 CREATE 문이 정의되어 있다.

**방법 1: 로컬에서 SCP로 파일 전송 후 실행**

```bash
# 로컬에서 EC2로 파일 전송
scp -i ~/.ssh/id_rsa docs/schema.sql ec2-user@13.125.175.126:/home/ec2-user/

# EC2에서 실행
mysql -h dn-platform-db.c98wmqqswrwy.ap-northeast-2.rds.amazonaws.com \
      -u dnadmin -p dn_platform < /home/ec2-user/schema.sql
```

**방법 2: MySQL 프롬프트에서 직접 붙여넣기**

```sql
-- MySQL 접속 후 schema.sql 내용을 복사해서 붙여넣기
-- 테이블 생성 순서 (FK 의존성):
-- 1. users
-- 2. preferences (→ users)
-- 3. shelters (→ users)
-- 4. animals (→ shelters)
-- 5. adoptions (→ users, animals)
-- 6. volunteer_recruitments (→ shelters)
-- 7. donation_requests (→ shelters)
-- 8. boards (→ users, shelters)
-- 9. volunteers (→ users, shelters, volunteer_recruitments, boards)
-- 10. donations (→ users, shelters, donation_requests, boards)
-- 11. comments (→ boards, users)
-- 12. animal_images (→ animals)
-- 12a. animal_favorites (→ users, animals)
-- 13. notifications (→ users)
-- 14. sync_history (독립 테이블)
```

생성 확인:

```sql
SHOW TABLES;
-- 14개 테이블이 보여야 한다
```

### Step 5: 마이그레이션 순차 적용

schema.sql이 초기 스키마라면, 마이그레이션(Migration)은 **이후 변경 사항**이다.
개발 과정에서 추가된 컬럼이나 테이블을 순서대로 적용한다.

```
docs/migrations/
├── V1__add_reject_reason_columns.sql      # 반려 사유 컬럼 추가
├── V2__add_volunteer_participant_count.sql # 봉사 신청 인원 컬럼 추가
├── V3__add_animal_favorites.sql           # 즐겨찾기 테이블 추가
├── V4__alter_preferences_region_length.sql # 선호지역 길이 확장
└── V5__add_sync_history.sql               # 동기화 이력 테이블 추가
```

#### V1: reject_reason 컬럼 추가

```sql
-- 관리자가 신청을 반려할 때 사유를 기록하는 컬럼
ALTER TABLE volunteers
  ADD COLUMN reject_reason TEXT NULL AFTER status;

ALTER TABLE donations
  ADD COLUMN reject_reason TEXT NULL AFTER status;
```

**변경 이유**: 봉사/기부 신청을 관리자가 반려할 때, 왜 반려했는지 사유를 저장할 곳이 없었다.

#### V2: participant_count 추가

```sql
-- 봉사 신청 시 "본인 포함 몇 명"인지 저장
ALTER TABLE volunteers
  ADD COLUMN participant_count INT NULL AFTER special_notes;

UPDATE volunteers SET participant_count = 1 WHERE participant_count IS NULL;
```

**변경 이유**: 봉사는 혼자만 가는 게 아니다. 가족이나 친구와 함께 신청하는 경우가 있다.

#### V3: animal_favorites 테이블 추가

```sql
CREATE TABLE IF NOT EXISTS animal_favorites (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    animal_id BIGINT NOT NULL,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    UNIQUE KEY uk_favorites_user_animal (user_id, animal_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE,
    INDEX idx_favorites_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**변경 이유**: 사용자가 관심 있는 동물을 "찜"해두는 기능 추가.

#### V4: preferences region 길이 변경

```sql
-- VARCHAR(100) → VARCHAR(200)으로 확장
ALTER TABLE preferences
  MODIFY COLUMN region VARCHAR(200) NULL;
```

**변경 이유**: 사용자가 여러 지역을 선택할 수 있게 변경 (쉼표 구분: "서울,경기,인천").
기존 100자로는 부족했다.

#### V5: sync_history 테이블 추가

```sql
CREATE TABLE IF NOT EXISTS sync_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    run_at TIMESTAMP(6) NOT NULL,
    trigger_type ENUM('AUTO', 'MANUAL') NOT NULL,
    added_count INT NOT NULL DEFAULT 0,
    updated_count INT NOT NULL DEFAULT 0,
    deleted_count INT NOT NULL DEFAULT 0,
    corrected_count INT NOT NULL DEFAULT 0,
    error_message VARCHAR(1000),
    days_param INT,
    species_filter VARCHAR(20),
    INDEX idx_sync_history_run_at (run_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**변경 이유**: 공공데이터 API와 동기화할 때마다 "몇 건 추가/수정/삭제했는지" 이력 기록.

#### 마이그레이션 한 번에 적용하기

```bash
# EC2에서 (파일 전송 후)
for f in V1__*.sql V2__*.sql V3__*.sql V4__*.sql V5__*.sql; do
  echo "=== 실행: $f ==="
  mysql -h dn-platform-db.c98wmqqswrwy.ap-northeast-2.rds.amazonaws.com \
        -u dnadmin -p dn_platform < "$f"
done
```

> **참고**: 이 프로젝트는 Flyway 같은 자동 마이그레이션 도구를 쓰지 않고 수동으로 관리한다.
> 그래서 순서를 지켜야 하고, 이미 적용된 마이그레이션을 다시 실행하면 에러가 날 수 있다
> (단, `CREATE TABLE IF NOT EXISTS`와 `ADD COLUMN`은 중복 실행 시 에러 유형이 다르다).

## 실제 시행착오: VARCHAR vs ENUM 매핑 오류

이 프로젝트에서 V5 마이그레이션 작업 중 겪은 실제 문제다.

**❌ 문제**: sync_history 테이블의 `trigger_type` 컬럼을 처음에 `VARCHAR(20)`으로 만들었더니, Spring Boot 기동 시 Hibernate 에러 발생.

```
org.hibernate.MappingException: No dialect mapping for JDBC type
```

**🔍 원인**: JPA Entity에서 `trigger_type` 필드를 이렇게 선언했다:

```java
@Enumerated(EnumType.STRING)
@Column(nullable = false)
private TriggerType triggerType;

public enum TriggerType {
    AUTO, MANUAL
}
```

`@Enumerated(EnumType.STRING)`은 DB 컬럼이 `ENUM` 타입이거나 `VARCHAR`일 때 동작한다.
하지만 MySQL의 `VARCHAR`와 `ENUM`은 Hibernate가 내부적으로 다르게 매핑한다.
특히 DDL 검증(validate) 모드에서 **DB의 실제 타입과 Entity 선언이 불일치**하면 에러가 난다.

**✅ 해결**: DB 컬럼 타입을 `ENUM`으로 변경

```sql
ALTER TABLE sync_history
  MODIFY COLUMN trigger_type ENUM('AUTO', 'MANUAL') NOT NULL;
```

**교훈**:
- JPA Entity의 `@Enumerated(EnumType.STRING)`을 쓸 때, DB 컬럼도 `ENUM` 타입으로 맞추는 것이 안전하다.
- 또는 `spring.jpa.hibernate.ddl-auto=validate`를 쓴다면, Entity와 DB 스키마가 **100% 일치**해야 한다.
- SQL 마이그레이션을 작성할 때 반드시 **JPA Entity 클래스를 옆에 펴놓고** 타입을 맞춰야 한다.

---

# 9장. GitHub Secrets — "배포의 핵심, 환경변수 설정"

## What — GitHub Secrets란 무엇인가

GitHub Secrets는 리포지토리에 **암호화되어 저장되는 환경변수**다.
데이터베이스 비밀번호, API 키, SSH 키 같은 민감한 정보를 코드에 직접 넣지 않고, GitHub가 안전하게 보관해준다.

```
코드에 직접 넣으면?
  application.yml:
    spring.datasource.password: MyPassword123!  ← GitHub에 올리면 전 세계에 노출!

GitHub Secrets를 쓰면?
  deploy.yml:
    --spring.datasource.password="${{ secrets.RDS_PASSWORD }}"
    → 값은 GitHub 서버에 암호화 저장, 로그에도 *** 로 마스킹됨
```

## How — 설정 방법

### 설정 경로

```
GitHub 리포지토리 페이지
  → Settings (탭)
  → 왼쪽 메뉴: Secrets and variables
  → Actions
  → "New repository secret" 버튼
```

### 이 프로젝트의 전체 GitHub Secrets (16개)

| # | Secret 이름 | 값 형식 | 용도 |
|---|-------------|---------|------|
| 1 | `EC2_HOST` | `13.125.175.126` | 배포 대상 서버의 Elastic IP |
| 2 | `EC2_SSH_KEY` | `-----BEGIN OPENSSH PRIVATE KEY-----` ... | EC2 SSH 접속용 개인키 전체 |
| 3 | `RDS_ENDPOINT` | `dn-platform-db.xxx.rds.amazonaws.com:3306` | RDS 접속 주소 (포트 포함!) |
| 4 | `RDS_USERNAME` | `dnadmin` | RDS 계정명 |
| 5 | `RDS_PASSWORD` | `YourStrongPassword123!` | RDS 비밀번호 |
| 6 | `JWT_SECRET` | (64자 이상 랜덤 문자열) | JWT 토큰 서명 키 |
| 7 | `JWT_ACCESS_VALIDITY` | `86400` | Access Token 유효기간 (초) = 24시간 |
| 8 | `JWT_REFRESH_VALIDITY` | `2592000` | Refresh Token 유효기간 (초) = 30일 |
| 9 | `RESEND_API_KEY` | `re_xxxxx` | Resend 이메일 발송 API 키 |
| 10 | `RESEND_FROM_EMAIL` | `noreply@yourdomain.com` | 이메일 발신 주소 |
| 11 | `DATA_API_KEY` | (공공데이터포털 Encoding Key) | 공공데이터 API 인증 키 |
| 12 | `FRONTEND_URL` | `http://13.125.175.126` | 프론트엔드 접속 URL |
| 13 | `VITE_MAP_API_KEY` | (카카오 JavaScript 키) | 프론트엔드 빌드 시 카카오맵 API 키 주입 |
| 14 | `PUBLIC_API_SYNC_ENABLED` | `true` | 공공데이터 자동 동기화 ON/OFF |
| 15 | `PUBLIC_API_SYNC_CRON` | `0 0 17 * * *` | 동기화 스케줄 (Cron 표현식, UTC) |

> **왜 16개라고 했는데 15개인가?**: `EC2_SSH_KEY`는 여러 줄(multi-line)이라 실질적으로 하나지만,
> 등록 시 주의사항이 많아서 별도 항목으로 강조했다. 실제 등록 개수는 15개다.

## Deep Dive — 각 Secret의 생성 → 저장 → 사용 추적

환경변수는 "어디서 만들어지고 → 어디에 저장되고 → 어디서 쓰이는지"를 추적할 수 있어야 한다.
하나라도 끊기면 배포가 실패하거나, 기능이 동작하지 않는다.

### EC2_HOST

```
생성: Terraform apply → Elastic IP 할당 → AWS 콘솔에서 확인
저장: GitHub Secrets
사용: deploy.yml → appleboy/scp-action의 host
                 → appleboy/ssh-action의 host
      (= SCP 파일 전송 대상, SSH 명령 실행 대상)
```

### EC2_SSH_KEY

```
생성: ssh-keygen으로 로컬에서 키 쌍 생성
      → 공개키(id_rsa.pub)는 Terraform으로 EC2에 등록
      → 개인키(id_rsa)를 GitHub Secrets에 등록
저장: GitHub Secrets (multi-line 텍스트)
사용: deploy.yml → appleboy/scp-action의 key
                 → appleboy/ssh-action의 key
      (= EC2에 SCP/SSH 접속 시 인증)
```

### RDS_ENDPOINT

```
생성: Terraform apply → RDS 인스턴스 생성 → 엔드포인트 출력
저장: GitHub Secrets (포트 :3306 포함!)
사용: deploy.yml → SSH script 내부
      → start.sh 동적 생성 시 JDBC URL 조합:
        jdbc:mysql://${RDS_ENDPOINT}/dn_platform?useSSL=false&serverTimezone=Asia/Seoul
      → V5 마이그레이션 실행 시 mysql 명령어의 -h 옵션
```

### RDS_USERNAME / RDS_PASSWORD

```
생성: Terraform 코드(variables.tf)에서 정의
저장: GitHub Secrets
사용: deploy.yml → SSH script →
      1. V5 마이그레이션: mysql -h ${RDS_ENDPOINT} -u ${RDS_USERNAME}
      2. start.sh: --spring.datasource.username / --spring.datasource.password
```

### JWT_SECRET

```
생성: 개발자가 직접 생성 (64자 이상 랜덤 문자열)
      예: openssl rand -base64 64 | tr -d '\n'
저장: GitHub Secrets
사용: deploy.yml → SSH script → start.sh:
      --jwt.secret="${JWT_SECRET}"
      → Spring Boot의 JwtTokenProvider가 토큰 서명/검증에 사용
```

### JWT_ACCESS_VALIDITY / JWT_REFRESH_VALIDITY

```
생성: 개발자가 결정 (초 단위)
      86400초 = 24시간, 2592000초 = 30일
저장: GitHub Secrets
사용: deploy.yml → SSH script → start.sh:
      --jwt.access-token-validity / --jwt.refresh-token-validity
      → Spring Boot에서 토큰 만료 시간 설정
```

### RESEND_API_KEY / RESEND_FROM_EMAIL

```
생성: Resend(https://resend.com) 가입 → API Key 발급
      FROM_EMAIL은 Resend에서 인증한 도메인의 이메일 주소
저장: GitHub Secrets
사용: deploy.yml → SSH script → start.sh:
      --resend.api-key / --resend.from-email
      → Spring Boot의 이메일 발송 서비스 (비밀번호 재설정 등)
```

### DATA_API_KEY

```
생성: 공공데이터포털(data.go.kr) → 활용신청 → 인증키 발급
      ⚠️ "Encoding" 키를 사용 (Decoding 키 아님!)
저장: GitHub Secrets
사용: deploy.yml → SSH script → start.sh:
      --public-api.service-key="${DATA_API_KEY}"
      → Spring Boot의 공공데이터 API 호출 시 인증
```

### FRONTEND_URL

```
생성: Elastic IP 기반으로 구성: http://13.125.175.126
저장: GitHub Secrets
사용 — 3곳에서 사용됨:
  1. deploy.yml → SSH script → start.sh:
     --app.frontend-url="${FRONTEND_URL}"
     → Spring Boot에서 이메일 본문의 링크 생성에 사용
  2. deploy.yml → SSH script → CORS_ORIGINS 조합:
     CORS_ORIGINS="http://localhost:5173,http://localhost:3000,${FRONTEND_URL}"
     → --cors.allowed-origins로 전달
  3. Resend 이메일 템플릿 내 링크 (비밀번호 재설정 URL 등)
```

### VITE_MAP_API_KEY

```
생성: 카카오 개발자센터 → 애플리케이션 → JavaScript 키
저장: GitHub Secrets
사용: deploy.yml → "Build Frontend" Step의 env:
      VITE_MAP_API_KEY: ${{ secrets.VITE_MAP_API_KEY }}
      → Vite가 빌드 시점에 코드에 인라인으로 삽입
      → 빌드된 JS 번들(frontend/dist/)에 포함
      ⚠️ 런타임(서버)에서는 사용되지 않음! 빌드 타임 전용!
```

### PUBLIC_API_SYNC_ENABLED / PUBLIC_API_SYNC_CRON

```
생성: 개발자가 결정
저장: GitHub Secrets
사용: deploy.yml → SSH script → start.sh:
      --public-api.sync-enabled / --public-api.sync-cron
      → Spring Boot의 @Scheduled 동기화 작업 활성화/스케줄 설정
      ⚠️ Cron은 UTC 기준! (아래 시행착오 참조)
```

## 환경변수의 전달 흐름 요약

```
GitHub Secrets (암호화 저장)
     │
     ▼
deploy.yml (GitHub Actions 워크플로우)
     │
     ├── [프론트 빌드 시] VITE_* 변수 → npm run build → dist/에 포함
     │
     └── [SSH Script] 환경변수로 EC2에 전달
              │
              ▼
         start.sh 동적 생성 (환경변수 값이 --args에 평문으로 기록)
              │
              ▼
         Spring Boot 기동 (커맨드라인 인수로 설정값 주입)
```

## 실제 시행착오 모음

### 시행착오 1: Elastic IP 변경 후 Secret 업데이트 누락

**❌ 문제**: EC2에 Elastic IP를 할당했는데, GitHub Secrets의 `EC2_HOST`에 이전 동적 IP(`3.39.187.182`)가 남아있었다. 배포 시 "Connection refused" 에러.

**🔍 원인**: Elastic IP 할당 전에 GitHub Secrets를 설정했다. IP가 바뀌었으니 Secret도 업데이트해야 하는데, 잊었다.

**✅ 해결**:
```
GitHub → Settings → Secrets → EC2_HOST → Update
이전: 3.39.187.182 (동적 IP, 재부팅하면 바뀜)
변경: 13.125.175.126 (Elastic IP, 고정)
```

**교훈**: IP가 바뀌면 **EC2_HOST**와 **FRONTEND_URL** 두 곳을 동시에 업데이트해야 한다.

### 시행착오 2: FRONTEND_URL에 이전 IP가 남아 CORS 에러 + 이메일 링크 깨짐

**❌ 문제**: `EC2_HOST`는 업데이트했는데 `FRONTEND_URL`은 안 했다.
- 브라우저에서 API 호출 시 CORS 에러
- 비밀번호 재설정 이메일의 링크가 옛날 IP로 가서 접속 불가

**🔍 원인**: `FRONTEND_URL`이 3곳(CORS, 이메일 링크, start.sh)에서 쓰이는 줄 몰랐다.

**✅ 해결**: `FRONTEND_URL`을 `http://13.125.175.126`으로 업데이트 후 재배포.

**교훈**: IP가 등장하는 모든 Secret을 한 번에 점검하는 체크리스트가 필요하다.
```
IP 변경 시 체크리스트:
  □ EC2_HOST → 새 IP
  □ FRONTEND_URL → http://새IP
  □ 재배포 실행
```

### 시행착오 3: EC2_SSH_KEY 입력 시 공백/줄바꿈 문제

**❌ 문제**: SSH 개인키를 GitHub Secrets에 붙여넣을 때 앞뒤에 공백이나 빈 줄이 포함되어 SSH 인증 실패.

```
Error: ssh: handshake failed: ssh: unable to authenticate
```

**🔍 원인**: SSH 키는 형식이 매우 엄격하다. 앞뒤 공백, 빈 줄, 줄바꿈 문자가 하나라도 다르면 인증 실패.

**✅ 해결**: 키 파일을 `cat`으로 출력해서 **처음부터 끝까지 정확히** 복사:

```bash
cat ~/.ssh/id_rsa
# -----BEGIN OPENSSH PRIVATE KEY----- 부터
# -----END OPENSSH PRIVATE KEY----- 까지
# 앞뒤 빈 줄 없이 정확히 복사
```

### 시행착오 4: Cron 표현식의 시간대(Timezone) 함정

**❌ 문제**: 공공데이터 동기화를 "한국시간 새벽 2시"에 실행하려고 `0 0 2 * * *`로 설정했는데, 실제로는 **한국시간 오전 11시**에 실행되었다.

**🔍 원인**: Spring Boot의 `@Scheduled(cron = ...)`은 **서버의 시간대**를 따른다. EC2의 시스템 시간이 UTC로 설정되어 있으면:

```
UTC 02:00 = KST 11:00  ← 새벽이 아니라 대낮!
```

**✅ 해결**: UTC 기준으로 역산:

```
한국시간(KST) 02:00 = UTC 17:00
→ Cron: "0 0 17 * * *"
```

```
시간대 변환 공식:
  KST = UTC + 9시간
  UTC = KST - 9시간

  KST 02:00 → UTC 17:00 (전날)
  KST 06:00 → UTC 21:00 (전날)
  KST 12:00 → UTC 03:00
  KST 18:00 → UTC 09:00
```

### 시행착오 5: RDS_ENDPOINT에서 포트 누락

**❌ 문제**: RDS_ENDPOINT에 `dn-platform-db.xxx.rds.amazonaws.com`만 입력하고 `:3306`을 빼먹었다.

```
com.mysql.cj.jdbc.exceptions.CommunicationsException:
  Communications link failure
```

**🔍 원인**: JDBC URL이 `jdbc:mysql://dn-platform-db.xxx.rds.amazonaws.com/dn_platform`이 되어 포트가 생략됨. MySQL JDBC 드라이버의 기본 포트가 3306이라 보통은 동작하지만, deploy.yml의 마이그레이션 스크립트에서 `mysql -h ${RDS_ENDPOINT}` 명령을 쓸 때는 호스트와 포트가 분리되어야 해서 문제 발생.

**✅ 해결**: Secret 값에 포트를 포함:

```
RDS_ENDPOINT = dn-platform-db.c98wmqqswrwy.ap-northeast-2.rds.amazonaws.com:3306
```

### 시행착오 6: JWT_SECRET이 너무 짧아서 에러

**❌ 문제**: JWT_SECRET을 `mysecretkey123` 같은 짧은 문자열로 설정했더니 Spring Security 에러.

```
io.jsonwebtoken.security.WeakKeyException:
  The signing key's size is 104 bits which is not secure enough
  for the HS256 algorithm. The JWT JWA Specification requires
  a minimum key length of 256 bits.
```

**🔍 원인**: HS256 알고리즘은 최소 256비트(32바이트) 이상의 키를 요구한다. 안전을 위해 64자 이상을 권장.

**✅ 해결**: 충분히 긴 랜덤 키 생성:

```bash
openssl rand -base64 64 | tr -d '\n'
# 예: K7gNU3sdo+OL0wNhqoVWhr3g6s1xYv72ol/pe/Unols=... (길고 랜덤한 문자열)
```

---

# 10장. deploy.yml 상세 분석 — GitHub Actions 워크플로우

## What — GitHub Actions란

GitHub Actions는 **코드를 push하면 자동으로 빌드 → 테스트 → 배포까지** 실행해주는 CI/CD 도구다.
`.github/workflows/` 폴더에 YAML 파일을 넣으면 GitHub가 자동으로 인식한다.

```
개발자가 코드를 push
     │
     ▼
GitHub가 deploy.yml을 읽고 실행
     │
     ▼
Ubuntu 서버에서 빌드 (GitHub 제공)
     │
     ▼
빌드 결과물을 EC2에 전송
     │
     ▼
EC2에서 애플리케이션 재시작
```

## 트리거 조건

```yaml
name: DN Platform Deploy

on:
  push:
    branches: [main]
```

`main` 브랜치에 push(또는 PR 머지)할 때만 실행된다.
`develop`, `feature/*` 등 다른 브랜치에서는 실행되지 않는다.

## Step-by-Step 상세 분석

### Step 1: 코드 체크아웃

```yaml
- name: Checkout
  uses: actions/checkout@v4
```

**하는 일**: GitHub 리포지토리의 코드를 빌드 서버(Ubuntu)에 다운로드한다.
`git clone`과 같다고 보면 된다.

**실패 시**: 리포지토리 접근 권한 문제 → 거의 발생하지 않음.

### Step 2: JDK 21 설정

```yaml
- name: Set up JDK 21
  uses: actions/setup-java@v4
  with:
    java-version: '21'
    distribution: 'temurin'
    cache: 'gradle'
```

**하는 일**:
- Eclipse Temurin JDK 21을 설치 (무료 OpenJDK 배포판)
- Gradle 의존성을 **캐시** (다음 빌드 시 다운로드 생략 → 빌드 시간 단축)

**`cache: 'gradle'`의 효과**:

```
첫 빌드:  의존성 다운로드 3분 + 컴파일 2분 = 5분
두번째:   캐시에서 복원 10초 + 컴파일 2분 = 약 2분
```

### Step 3: 백엔드 빌드

```yaml
- name: Build Backend
  run: |
    cd backend
    ./gradlew clean bootJar -x test
    ls -la build/libs/*.jar
```

**하는 일**:
- `clean`: 이전 빌드 산출물 삭제
- `bootJar`: Spring Boot 실행 가능 JAR 생성
- `-x test`: **테스트 스킵**
- `ls -la`: 빌드 결과물 확인 (파일 크기 등 로그에 출력)

**왜 테스트를 스킵하는가?**

```
CI 환경(GitHub Actions의 Ubuntu)에는 DB가 없다.
  → 통합 테스트가 RDS 접속을 시도하면 실패
  → -x test로 스킵하고, 테스트는 로컬에서 실행
```

**빌드 결과물**: `backend/build/libs/platform-0.0.1-SNAPSHOT.jar`

**실패 시 확인**:
- `./gradlew` 실행 권한 없음 → `git update-index --chmod=+x gradlew`
- Java 컴파일 에러 → 로컬에서 `./gradlew bootJar`로 먼저 확인
- 의존성 다운로드 실패 → 네트워크 문제 (재실행하면 대부분 해결)

### Step 4: Node.js 20 설정

```yaml
- name: Set up Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
    cache-dependency-path: frontend/package-lock.json
```

**하는 일**:
- Node.js 20 설치
- npm 의존성을 `package-lock.json` 기준으로 캐시

### Step 5: 프론트엔드 빌드

```yaml
- name: Build Frontend
  env:
    VITE_API_BASE_URL: /api
    VITE_MAP_API_KEY: ${{ secrets.VITE_MAP_API_KEY }}
  run: |
    cd frontend
    npm ci
    npm run build
    ls -la dist/
```

**하는 일**:
1. 환경변수 주입 (빌드 시점에 코드에 삽입)
2. `npm ci`: `package-lock.json` 기반 정확한 의존성 설치
3. `npm run build`: Vite로 프로덕션 빌드 → `dist/` 폴더 생성

**핵심 포인트 — VITE_ 접두사**:

```
Vite는 VITE_ 접두사가 붙은 환경변수만 클라이언트 코드에 노출한다.

  VITE_API_BASE_URL=/api       → import.meta.env.VITE_API_BASE_URL 로 접근 가능
  VITE_MAP_API_KEY=xxxxx       → import.meta.env.VITE_MAP_API_KEY 로 접근 가능
  RDS_PASSWORD=secret          → import.meta.env.RDS_PASSWORD 는 undefined
                                 (VITE_ 접두사 없으므로 노출 안 됨 → 안전!)
```

**`VITE_API_BASE_URL: /api`의 의미**:

```
프론트엔드 코드: axios.get(`${VITE_API_BASE_URL}/animals`)
실제 요청:       GET /api/animals (상대 경로)

상대 경로이므로 같은 도메인(13.125.175.126)의 Nginx로 요청이 가고,
Nginx가 /api/ 요청을 http://127.0.0.1:8080 (Spring Boot)으로 프록시한다.

이렇게 하면 프론트엔드에 백엔드 IP를 하드코딩할 필요가 없다!
```

**`npm ci` vs `npm install`**:

| 명령어 | 동작 | CI/CD에서 |
|--------|------|-----------|
| `npm install` | `package.json` 기반, `lock` 파일 업데이트 가능 | 비권장 — 버전 불일치 위험 |
| `npm ci` | `package-lock.json` 기반, 정확한 버전 설치 | 권장 — 재현 가능한 빌드 |

**실패 시 확인**:
- `VITE_MAP_API_KEY`가 빈 값 → 카카오맵이 로딩 안 됨 (에러는 아니지만 기능 장애)
- `npm ci` 실패 → `package-lock.json`과 `package.json` 버전 불일치 → 로컬에서 `npm install` 후 커밋

### Step 6: 배포 패키지 생성

```yaml
- name: Create deploy package
  run: |
    mkdir -p deploy
    cp backend/build/libs/platform-0.0.1-SNAPSHOT.jar deploy/
    cp -r frontend/dist deploy/frontend-dist
    cp docs/migrations/V5__add_sync_history.sql deploy/
    tar -czvf deploy.tar.gz deploy/
```

**하는 일**:
1. `deploy/` 폴더 생성
2. 백엔드 JAR 복사
3. 프론트엔드 빌드 결과물(`dist/`) 복사
4. V5 마이그레이션 SQL 복사 (EC2에서 자동 실행)
5. `tar.gz`로 압축 (하나의 파일로 전송하기 위해)

```
deploy/
├── platform-0.0.1-SNAPSHOT.jar  # ~45MB
├── frontend-dist/                # ~2MB
│   ├── index.html
│   └── assets/
└── V5__add_sync_history.sql      # ~1KB
```

### Step 7: 시크릿 검증

```yaml
- name: Verify secrets (DB 연결용)
  run: |
    missing=""
    [ -z "${{ secrets.RDS_ENDPOINT }}" ] && missing="RDS_ENDPOINT $missing"
    [ -z "${{ secrets.RDS_USERNAME }}" ] && missing="RDS_USERNAME $missing"
    [ -z "${{ secrets.RDS_PASSWORD }}" ] && missing="RDS_PASSWORD $missing"
    [ -z "${{ secrets.EC2_HOST }}" ] && missing="EC2_HOST $missing"
    [ -z "${{ secrets.EC2_SSH_KEY }}" ] && missing="EC2_SSH_KEY $missing"
    if [ -n "$missing" ]; then
      echo "::error::필수 시크릿이 비어 있음: $missing"
      exit 1
    fi
    echo "[배포] RDS/EC2 시크릿 존재 확인 완료"
```

**하는 일**: 필수 Secret이 하나라도 비어있으면 **빌드를 중단**한다.
SCP/SSH 단계에서 실패하면 에러 메시지가 모호해서, 미리 체크하는 방어 코드다.

**`::error::` 문법**: GitHub Actions 전용 어노테이션. 이 메시지가 Actions UI에 빨간 에러로 표시된다.

### Step 8: EC2에 파일 업로드 (SCP)

```yaml
- name: Deploy to EC2
  uses: appleboy/scp-action@v0.1.7
  with:
    host: ${{ secrets.EC2_HOST }}
    username: ec2-user
    key: ${{ secrets.EC2_SSH_KEY }}
    source: "deploy.tar.gz"
    target: "/home/ec2-user/"
```

**하는 일**: `deploy.tar.gz` 파일을 EC2의 `/home/ec2-user/`에 전송한다.

```
GitHub Actions 서버                    EC2
  deploy.tar.gz ──── SCP (SSH 기반) ────→ /home/ec2-user/deploy.tar.gz
```

**실패 시 확인**:
- `ssh: connect to host ... port 22: Connection refused`
  → `EC2_HOST` 값이 잘못됐거나, EC2 보안 그룹에서 22번 포트가 열려있지 않음
- `Permission denied (publickey)`
  → `EC2_SSH_KEY`가 잘못됐거나, 앞뒤 공백/줄바꿈 문제

### Step 9: EC2에서 배포 실행 (SSH)

이 Step이 가장 복잡하고 중요하다. SSH로 EC2에 접속해서 여러 명령을 순차 실행한다.

```yaml
- name: Extract and Restart on EC2
  uses: appleboy/ssh-action@v1.0.3
  with:
    host: ${{ secrets.EC2_HOST }}
    username: ec2-user
    key: ${{ secrets.EC2_SSH_KEY }}
    command_timeout: 5m
    envs: RDS_ENDPOINT,RDS_USERNAME,RDS_PASSWORD,...(12개 환경변수)
    script: |
      ... (아래에서 하나씩 분석)
```

**`envs` 필드의 역할**:

```
GitHub Secrets → deploy.yml의 env → appleboy/ssh-action의 envs 목록
→ EC2의 SSH 세션 내부에서 ${변수명}으로 접근 가능

envs에 나열하지 않으면 EC2에서 해당 변수를 쓸 수 없다!
```

#### 9-1: 압축 해제

```bash
set -e          # 명령어 하나라도 실패하면 즉시 중단
cd /home/ec2-user
tar -xzvf deploy.tar.gz
```

#### 9-2: 백엔드 JAR 복사

```bash
mkdir -p app
cp deploy/platform-0.0.1-SNAPSHOT.jar app/
```

#### 9-3: 프론트엔드 복사

```bash
sudo mkdir -p /var/www/dn-platform
sudo cp -r deploy/frontend-dist/* /var/www/dn-platform/
```

`/var/www/`는 root 소유이므로 `sudo` 필요.

#### 9-4: Nginx 설정 업데이트

```bash
sudo tee /etc/nginx/conf.d/dn-platform.conf > /dev/null << 'NGINX'
server {
    listen 80;
    server_name _;
    root /var/www/dn-platform;
    index index.html;
    try_files $uri $uri/ /index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /swagger-ui {
        proxy_pass http://127.0.0.1:8080;
        ...
    }

    location /v3/api-docs {
        proxy_pass http://127.0.0.1:8080;
        ...
    }
}
NGINX
sudo nginx -t && sudo systemctl reload nginx
```

**Nginx 설정의 핵심**:

| URL 패턴 | 처리 방식 | 대상 |
|-----------|-----------|------|
| `/` | 정적 파일 서빙 | `/var/www/dn-platform/index.html` |
| `/api/*` | 리버스 프록시 | `http://127.0.0.1:8080` (Spring Boot) |
| `/swagger-ui` | 리버스 프록시 | Spring Boot (API 문서) |
| `/animals`, `/boards` 등 | `try_files → /index.html` | React SPA 클라이언트 라우팅 |

**`try_files $uri $uri/ /index.html`의 의미**:

```
사용자가 http://13.125.175.126/animals 에 접속하면:
  1. /var/www/dn-platform/animals 파일이 있나? → 없음
  2. /var/www/dn-platform/animals/ 디렉터리가 있나? → 없음
  3. /var/www/dn-platform/index.html 을 반환 → React Router가 /animals 경로를 처리

이 설정이 없으면 SPA의 새로고침 시 404 에러가 발생한다!
```

#### 9-5: V5 마이그레이션 자동 실행

```bash
# MySQL 클라이언트가 없으면 설치 시도
if ! command -v mysql >/dev/null 2>&1; then
  sudo yum install -y mariadb 2>/dev/null || \
  sudo yum install -y mariadb105 2>/dev/null || \
  sudo dnf install -y mariadb105 2>/dev/null || true
fi

# MySQL 클라이언트가 있으면 V5 마이그레이션 실행
if command -v mysql >/dev/null 2>&1; then
  export MYSQL_PWD="${RDS_PASSWORD}"
  mysql -h "${RDS_ENDPOINT}" -u "${RDS_USERNAME}" dn_platform \
    < deploy/V5__add_sync_history.sql || \
    echo "[배포] V5 마이그레이션 실행 실패. 백엔드는 재시작됨."
  unset MYSQL_PWD
fi
```

**`MYSQL_PWD` 환경변수**: mysql 명령어에 `-p` 옵션 대신 환경변수로 비밀번호를 전달.
스크립트 자동화에서 비밀번호 프롬프트를 피하기 위해 사용.

#### 9-6: start.sh 동적 생성

```bash
DB_URL="jdbc:mysql://${RDS_ENDPOINT}/dn_platform?useSSL=false&serverTimezone=Asia/Seoul&characterEncoding=UTF-8"

if [ -n "${FRONTEND_URL}" ]; then
  CORS_ORIGINS="http://localhost:5173,http://localhost:3000,${FRONTEND_URL}"
else
  CORS_ORIGINS="http://localhost:5173,http://localhost:3000"
fi

cat > app/start.sh << START
#!/bin/bash
cd /home/ec2-user/app
exec java -jar -Dspring.profiles.active=prod platform-0.0.1-SNAPSHOT.jar \
  --spring.datasource.url="${DB_URL}" \
  --spring.datasource.username="${RDS_USERNAME}" \
  --spring.datasource.password="${RDS_PASSWORD}" \
  --jwt.secret="${JWT_SECRET}" \
  --jwt.access-token-validity="${JWT_ACCESS_VALIDITY:-86400}" \
  --jwt.refresh-token-validity="${JWT_REFRESH_VALIDITY:-2592000}" \
  --resend.api-key="${RESEND_API_KEY}" \
  --resend.from-email="${RESEND_FROM_EMAIL}" \
  --public-api.service-key="${DATA_API_KEY}" \
  --public-api.sync-enabled="${PUBLIC_API_SYNC_ENABLED:-false}" \
  --public-api.sync-cron="${PUBLIC_API_SYNC_CRON:-0 0 17 * * *}" \
  --app.frontend-url="${FRONTEND_URL}" \
  --cors.allowed-origins="${CORS_ORIGINS}"
START
chmod +x app/start.sh
```

**이 구조의 의미**:

```
배포 시점에 start.sh가 생성됨
  → GitHub Secrets 값이 start.sh에 직접 기록됨
  → EC2에 별도 .env 파일이 필요 없음
  → Secret이 변경되면 재배포하면 자동 반영

trade-off:
  ✅ 장점: .env 파일 관리 불필요, 배포 한 번으로 환경변수 완전 동기화
  ❌ 단점: EC2에서 cat app/start.sh 하면 비밀번호가 평문으로 보임
           → EC2 접근 권한 관리가 중요!
```

**`${JWT_ACCESS_VALIDITY:-86400}` 문법**: Bash의 기본값 설정.
Secret이 비어있으면 `86400`을 사용한다. 선택적 설정에 유용.

**`exec` 명령어**: 현재 셸 프로세스를 Java 프로세스로 **교체**한다.
이렇게 하면 Systemd가 Java 프로세스를 직접 관리할 수 있다 (PID가 유지됨).

#### 9-7: Systemd 서비스 등록 및 재시작

```bash
# 서비스 파일이 없으면 생성 (최초 배포 시)
if [ ! -f /etc/systemd/system/dn-platform.service ]; then
  sudo tee /etc/systemd/system/dn-platform.service > /dev/null << 'SVC'
  [Unit]
  Description=DN Platform Backend
  After=network.target

  [Service]
  Type=simple
  User=ec2-user
  WorkingDirectory=/home/ec2-user/app
  ExecStart=/home/ec2-user/app/start.sh
  Restart=on-failure
  RestartSec=5
  StandardOutput=append:/home/ec2-user/log.out
  StandardError=append:/home/ec2-user/err.out

  [Install]
  WantedBy=multi-user.target
  SVC
  sudo systemctl daemon-reload
  sudo systemctl enable dn-platform
fi

# 서비스 재시작
sudo systemctl restart dn-platform
sleep 3
sudo systemctl is-active dn-platform && echo "[배포] 서비스 기동됨" || echo "[배포 경고] 서비스 비활성"

# 에러 로그 출력 (DB 연결 오류 확인용)
tail -30 /home/ec2-user/err.out 2>/dev/null || true

# 배포 패키지 정리
rm -f /home/ec2-user/deploy.tar.gz
```

## GitHub Actions 로그 확인 방법

배포가 실패했을 때 로그를 확인하는 방법:

```
1. GitHub 리포지토리 → Actions 탭
2. 실패한 워크플로우 실행 클릭
3. "build-and-deploy" 잡 클릭
4. 실패한 Step을 클릭하면 로그가 펼쳐진다
```

```
로그에서 자주 보이는 에러와 대응:

"Error: Process completed with exit code 1"
  → build 또는 script에서 오류. 해당 Step 로그를 위로 스크롤

"ssh: connect to host ... port 22: Connection refused"
  → EC2_HOST가 잘못됨 or EC2가 꺼져 있음 or 보안 그룹 22 포트 미개방

"Permission denied (publickey)"
  → EC2_SSH_KEY 값에 문제 (공백, 줄바꿈, 잘못된 키)

"필수 시크릿이 비어 있음: RDS_ENDPOINT"
  → GitHub Secrets에 해당 값이 등록되지 않음

"tar: Error is not recoverable: exiting now"
  → 이전 Step에서 빌드 결과물이 생성되지 않음
```

## 자주 하는 실수 정리

| 실수 | 증상 | 해결 |
|------|------|------|
| `bootJar` 결과물 경로 오타 | "JAR file not found" | `ls build/libs/` 로 실제 파일명 확인 |
| `npm ci` 대신 `npm install` | lock 파일 불일치 에러 | CI에서는 항상 `npm ci` 사용 |
| `VITE_` 접두사 누락 | 프론트에서 `undefined` | Vite 환경변수는 반드시 `VITE_` 접두사 |
| `envs`에 변수 누락 | EC2에서 변수가 빈 값 | `appleboy/ssh-action`의 `envs` 목록 확인 |
| `command_timeout` 너무 짧음 | SSH 스크립트 중간에 끊김 | `5m` 이상 설정 |

---

# 11장. EC2 내부 구조 — "배포된 후 서버는 어떻게 생겼는가"

## 배포 후 디렉터리 구조

배포가 완료되면 EC2 내부는 다음과 같은 구조가 된다:

```
/home/ec2-user/
├── app/
│   ├── platform-0.0.1-SNAPSHOT.jar   # Spring Boot 실행 JAR
│   └── start.sh                       # 실행 스크립트 (환경변수 포함)
├── deploy/                            # 배포 패키지 해제 임시 폴더
│   ├── platform-0.0.1-SNAPSHOT.jar
│   ├── frontend-dist/
│   └── V5__add_sync_history.sql
├── log.out                            # 표준 출력 로그 (Spring Boot)
├── err.out                            # 에러 출력 로그 (Spring Boot)
└── healthcheck.sh                     # 헬스체크 스크립트 (수동)

/var/www/dn-platform/                  # 프론트엔드 정적 파일 (Nginx가 서빙)
├── index.html                         # React SPA 진입점
├── assets/
│   ├── index-xxxxx.js                 # 번들된 JavaScript
│   └── index-xxxxx.css                # 번들된 CSS
└── ...

/etc/nginx/conf.d/dn-platform.conf    # Nginx 사이트 설정

/etc/systemd/system/dn-platform.service  # Systemd 서비스 정의
```

## 각 구성 요소의 역할

### Nginx — 프론트엔드 서빙 + API 프록시

Nginx는 **두 가지 역할**을 한다:

```
브라우저 요청
     │
     ▼
  Nginx (:80)
     │
     ├── /api/*  ──→  proxy_pass → Spring Boot (:8080)
     │
     ├── /swagger-ui  ──→  proxy_pass → Spring Boot (:8080)
     │
     └── /*  ──→  /var/www/dn-platform/ 정적 파일 서빙
                  └── 없으면 → /index.html (React SPA)
```

**왜 Nginx를 쓰는가?**

| 직접 Spring Boot(:8080)를 노출하면? | Nginx를 앞에 두면? |
|-------------------------------------|---------------------|
| 프론트엔드 서빙 불가 | 정적 파일 + API를 하나의 포트(80)로 |
| CORS 설정이 복잡해짐 | 같은 도메인이므로 CORS 불필요 |
| 포트 번호를 URL에 써야 함 (:8080) | 80 포트는 생략 가능 |
| SSL 설정이 어려움 | Nginx가 SSL 처리 가능 (향후) |

### Systemd 서비스 — 프로세스 관리

```ini
[Unit]
Description=DN Platform Backend
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/app
ExecStart=/home/ec2-user/app/start.sh
Restart=on-failure
RestartSec=5
StandardOutput=append:/home/ec2-user/log.out
StandardError=append:/home/ec2-user/err.out

[Install]
WantedBy=multi-user.target
```

| 설정 | 의미 |
|------|------|
| `After=network.target` | 네트워크 준비된 후에 시작 |
| `User=ec2-user` | root가 아닌 ec2-user로 실행 (보안) |
| `ExecStart` | 실행할 스크립트 (start.sh) |
| `Restart=on-failure` | 비정상 종료 시 자동 재시작 |
| `RestartSec=5` | 재시작 전 5초 대기 |
| `StandardOutput=append:` | 로그를 파일에 추가 기록 |
| `WantedBy=multi-user.target` | 부팅 시 자동 시작 |

**Systemd를 쓰는 이유**:

```
Systemd 없이 start.sh를 직접 실행하면:
  - SSH 세션 종료 시 프로세스도 종료됨
  - 프로세스가 죽어도 아무도 재시작 안 해줌
  - EC2 재부팅 시 수동으로 다시 시작해야 함

Systemd를 쓰면:
  ✅ SSH 세션과 무관하게 백그라운드 실행
  ✅ 프로세스 죽으면 5초 후 자동 재시작
  ✅ EC2 재부팅 시 자동 시작 (enable 설정)
  ✅ 로그가 자동으로 파일에 기록
```

### start.sh — 환경변수 보관소

배포 시 동적으로 생성되는 start.sh의 실제 내용 (예시):

```bash
#!/bin/bash
cd /home/ec2-user/app
exec java -jar -Dspring.profiles.active=prod platform-0.0.1-SNAPSHOT.jar \
  --spring.datasource.url="jdbc:mysql://dn-platform-db.c98wmqqswrwy.ap-northeast-2.rds.amazonaws.com:3306/dn_platform?useSSL=false&serverTimezone=Asia/Seoul&characterEncoding=UTF-8" \
  --spring.datasource.username="dnadmin" \
  --spring.datasource.password="YourStrongPassword123!" \
  --jwt.secret="K7gNU3sdo+OL0wNhqoVWhr3g6s1xYv72..." \
  --jwt.access-token-validity="86400" \
  --jwt.refresh-token-validity="2592000" \
  --resend.api-key="re_xxxxx" \
  --resend.from-email="noreply@yourdomain.com" \
  --public-api.service-key="..." \
  --public-api.sync-enabled="true" \
  --public-api.sync-cron="0 0 17 * * *" \
  --app.frontend-url="http://13.125.175.126" \
  --cors.allowed-origins="http://localhost:5173,http://localhost:3000,http://13.125.175.126"
```

> **주의**: 이 파일에는 모든 비밀번호와 키가 **평문**으로 저장된다.
> EC2 접근 권한(SSH 키)을 철저히 관리해야 한다.

## 유용한 EC2 디버깅 명령어

### 서비스 상태 확인

```bash
# 서비스 실행 상태 확인
sudo systemctl status dn-platform

# 출력 예시:
# ● dn-platform.service - DN Platform Backend
#      Loaded: loaded
#      Active: active (running) since ...
#      Main PID: 12345 (java)
```

### 실시간 로그 확인

```bash
# Systemd 저널 로그 (실시간)
sudo journalctl -u dn-platform -f

# 애플리케이션 로그 (실시간)
tail -f ~/log.out ~/err.out

# 에러 로그만 최근 100줄
tail -100 ~/err.out
```

### Nginx 관련

```bash
# Nginx 설정 문법 검사 (재시작 전 반드시!)
sudo nginx -t
# 출력: nginx: the configuration file /etc/nginx/nginx.conf syntax is ok

# Nginx 재시작 (설정 변경 후)
sudo systemctl reload nginx

# Nginx 에러 로그
sudo tail -50 /var/log/nginx/error.log

# Nginx 접속 로그
sudo tail -50 /var/log/nginx/access.log
```

### 백엔드 직접 테스트

```bash
# Spring Boot가 정상 기동되었는지 확인
curl http://localhost:8080/api/animals
# JSON 응답이 오면 정상

# 헬스 체크 (간단)
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/animals
# 200이면 정상, 500이면 에러, 000이면 기동 안 됨
```

### DB 연결 확인

```bash
# EC2에서 RDS 접속 테스트
mysql -h dn-platform-db.c98wmqqswrwy.ap-northeast-2.rds.amazonaws.com \
      -u dnadmin -p dn_platform \
      -e "SELECT COUNT(*) FROM animals;"
```

### 프로세스 확인

```bash
# Java 프로세스 확인
ps aux | grep java

# 포트 사용 확인
sudo ss -tlnp | grep 8080   # Spring Boot
sudo ss -tlnp | grep 80     # Nginx
```

### 서비스 제어

```bash
# 서비스 재시작
sudo systemctl restart dn-platform

# 서비스 중지
sudo systemctl stop dn-platform

# 서비스 로그 리셋 (로그 파일이 커졌을 때)
> ~/log.out
> ~/err.out
sudo systemctl restart dn-platform
```

## 배포 후 확인 체크리스트

배포가 완료되면 다음 순서로 확인한다:

```
□ 1. GitHub Actions 로그에서 모든 Step이 녹색(성공)인지 확인
□ 2. EC2에 SSH 접속
□ 3. sudo systemctl status dn-platform → active (running)
□ 4. tail -30 ~/err.out → DB 연결 에러 없는지 확인
□ 5. curl http://localhost:8080/api/animals → JSON 응답 확인
□ 6. 브라우저에서 http://13.125.175.126 접속 → 프론트엔드 로딩 확인
□ 7. 브라우저에서 동물 목록 등 API 호출 기능 확인
□ 8. 브라우저에서 /animals 경로 직접 접속 후 새로고침 → 404 안 나는지 확인
```

---

## 전체 배포 흐름 요약

```
[개발자 PC]
  git push origin main
       │
       ▼
[GitHub Actions]
  ① 코드 체크아웃
  ② JDK 21 + Gradle 캐시 설정
  ③ ./gradlew clean bootJar -x test → platform-0.0.1-SNAPSHOT.jar
  ④ Node.js 20 + npm 캐시 설정
  ⑤ VITE_* 환경변수 주입 → npm ci → npm run build → dist/
  ⑥ JAR + dist + SQL → deploy.tar.gz 패키징
  ⑦ 필수 Secrets 존재 확인
  ⑧ SCP로 deploy.tar.gz → EC2 전송
  ⑨ SSH로 EC2 접속:
     - 압축 해제
     - 프론트 → /var/www/dn-platform/
     - JAR → /home/ec2-user/app/
     - Nginx 설정 업데이트 + reload
     - V5 마이그레이션 실행
     - start.sh 동적 생성 (모든 환경변수 포함)
     - systemctl restart dn-platform
       │
       ▼
[EC2 서버]
  Nginx (:80) ← 브라우저
    ├── 정적 파일 → /var/www/dn-platform/
    └── /api/* → proxy → Spring Boot (:8080)
                           ├── RDS (MySQL)
                           ├── 공공데이터 API
                           └── Resend 이메일 API
```

---

## 다음 파트 예고

**파트 C**에서는 외부 API 연동(공공데이터 포털, Resend 이메일, 카카오맵)의 실제 구현과
API 키 관리, 에러 처리 패턴을 다룬다.
