# MySQL 데이터베이스 로컬 설정 (처음 셋업)

프로젝트를 **처음 클론한 뒤**, 로컬에서 백엔드를 돌리기 위해 MySQL DB를 **처음부터** 만드는 순서입니다.  
(이미 `dn_platform` DB가 있고 테이블까지 있다면 이 문서는 생략해도 됩니다.)

---

## 전제

- 로컬 PC에 **아직 MySQL이 없거나**, 있어도 **`dn_platform` DB는 없는** 상태를 가정합니다.
- 아래 순서대로 하면 **DB 생성 → 계정(선택) → 앱 설정 → 테이블 수동 생성**까지 한 번에 맞출 수 있습니다.
- 테이블은 JPA 자동 생성이 아니라 **아래 제공하는 DDL을 수동 실행**해서 만듭니다.

---

## 1. MySQL 설치 (미설치 시)

| 환경 | 방법 |
|------|------|
| **macOS** | `brew install mysql` 후 `brew services start mysql` |
| **Windows** | [MySQL 공식 설치 프로그램](https://dev.mysql.com/downloads/installer/) |
| **Linux (Ubuntu/Debian)** | `sudo apt install mysql-server` |

- **버전**: 8.0 이상 권장 (5.7도 동작 가능)
- 설치 후 **root 비밀번호**를 설정해 두세요.

---

## 2. 데이터베이스 생성 (필수, 처음 한 번만)

MySQL에 접속할 수 있는 클라이언트(`mysql` CLI, DBeaver, MySQL Workbench 등)를 열고 아래 중 **한 가지** 방식으로 실행합니다.

### 방법 A — SQL만 실행

**root만 쓸 경우** (DB만 만들 때):

```sql
CREATE DATABASE IF NOT EXISTS dn_platform
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

**전용 개발 계정도 만들 경우** — `'dev_user'`, `'your_password'`를 원하는 값으로 바꾼 뒤 전체 실행:

```sql
CREATE DATABASE IF NOT EXISTS dn_platform
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'dev_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON dn_platform.* TO 'dev_user'@'localhost';
FLUSH PRIVILEGES;
```

### 방법 B — 스크립트 파일로 실행 (프로젝트 루트에서)

```bash
mysql -u root -p < backend/scripts/init-database.sql
```

- root만 쓸 경우: `backend/scripts/init-database.sql`에서 **2~4번(USER/GRANT/FLUSH)을 주석 처리**한 뒤 실행.
- 전용 계정 쓸 경우: 스크립트 안의 `'your_password'`를 실제 비밀번호로 바꾼 뒤 **전체** 실행.

이 단계까지 하면 **빈 `dn_platform` DB**(와 선택 시 전용 계정)만 있는 상태입니다. 다음 4단계에서 테이블을 수동으로 생성합니다.

---

## 3. 백엔드 환경 설정 (처음 한 번만)

### 3.1 `.env` 파일 만들기

`backend/.env`가 없으면 생성합니다. 예시 파일을 복사한 뒤 수정하는 방식이 좋습니다.

```bash
# 프로젝트 루트에서
cp backend/.env.example backend/.env
```

### 3.2 DB 접속 정보 넣기

`backend/.env`를 열어 다음을 **본인 MySQL 계정에 맞게** 수정합니다.

```env
DB_USERNAME=root
DB_PASSWORD=실제_비밀번호
```

전용 계정(`dev_user`)을 썼다면:

```env
DB_USERNAME=dev_user
DB_PASSWORD=위에서_지정한_비밀번호
```

### 3.3 MySQL 포트가 3306이 아닐 때

`backend/src/main/resources/application-dev.yml`의 `datasource.url`에서 `3306`을 사용 중인 포트로 바꿉니다.

---

## 4. 테이블 수동 생성 (DDL 실행)

테이블은 **자동 생성하지 않고**, 아래 DDL 스크립트를 **한 번 수동 실행**해서 만듭니다.

### 4.1 스크립트 파일로 실행 (권장)

**2단계**에서 `dn_platform` DB를 만든 뒤, 프로젝트 루트에서:

```bash
mysql -u root -p dn_platform < backend/scripts/create-tables.sql
```

전용 계정을 쓰는 경우 `-u dev_user -p` 등으로 바꿔 실행하면 됩니다.

### 4.2 DDL 파일 위치

- **전체 테이블 생성 DDL**: `backend/scripts/create-tables.sql`
- `users`, `preferences`, `shelters`, `animals`, `adoptions`, `volunteer_recruitments`, `donation_requests`, `boards`, `volunteers`, `donations`, `comments`, `animal_images`, `animal_favorites`, `notifications`, `sync_history` 가 정의되어 있습니다.
- FK 의존 순서대로 작성되어 있으므로, **파일 전체를 그대로 한 번 실행**하면 됩니다.

### 4.3 주의사항

- 이미 테이블이 있는 DB에 다시 실행하면 `Table already exists` 오류가 납니다. **빈 DB**에서만 실행하세요.
- 백엔드 설정에서 JPA `ddl-auto`는 **`none` 또는 `validate`** 로 두어, 앱이 스키마를 자동으로 바꾸지 않도록 하는 것을 권장합니다.

---

## 5. 접속 확인

- 백엔드 실행 후 Swagger: `http://localhost:8080/swagger-ui.html` 이 뜨면 DB 연결 정상.
- CLI로 확인:

```bash
mysql -u root -p -e "USE dn_platform; SHOW TABLES;"
```

(사용 중인 계정/비밀번호로 `-u`, `-p` 값 조정)

---

## 요약 체크리스트 (처음 셋업 시)

- [ ] MySQL 8.0+ (또는 5.7) 설치 및 서비스 기동
- [ ] `dn_platform` DB 생성 (utf8mb4), 필요 시 전용 계정 생성
- [ ] `backend/.env` 생성 후 `DB_USERNAME`, `DB_PASSWORD` 설정
- [ ] `backend/scripts/create-tables.sql` 수동 실행 → 테이블 생성 확인
- [ ] 백엔드 실행 → DB 접속 및 동작 확인
