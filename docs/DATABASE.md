# 데이터베이스 설정 가이드

백엔드는 **localhost:3306**의 MySQL에 연결합니다.  
**로컬에 설치한 MySQL**을 쓰거나, **Docker MySQL**을 쓰거나 **둘 중 하나**만 맞추면 됩니다.  
나중에 AWS에 올릴 때는 RDS 등에 DB를 만들고, 배포용 설정(예: `application-prod.yml`)에서 그 주소로 연결하면 됩니다.

---

## 1. 로컬 MySQL 사용 (도커 없이, 익스텐션/설치형)

이미 로컬에 MySQL을 설치해 두었다면 **도커는 사용하지 않아도 됩니다.**

### 1-1. DB 생성

MySQL에 접속해서 DB와 계정을 만듭니다.

```sql
CREATE DATABASE IF NOT EXISTS dn_platform
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

기본 설정은 **root / root**로 접속하는 것을 전제로 합니다.  
다른 계정을 쓰려면 `application-dev.yml`의 `DB_USERNAME`, `DB_PASSWORD`(또는 환경 변수)로 맞추면 됩니다.

### 1-2. 테이블 생성

**방법 A: JPA 자동 생성 (가장 간단)**  
`application-dev.yml`에 `ddl-auto: update`가 있으므로, **백엔드를 dev 프로필로 한 번 실행**하면 테이블이 자동 생성/수정됩니다.

1. MySQL 서비스 실행(로컬)
2. 백엔드 실행: `./mvnw spring-boot:run -Dspring-boot.run.profiles=dev` (또는 IDE에서 dev 프로필로 실행)

**방법 B: 스크립트로 한 번에 생성**  
프로젝트 루트(`DN_project01`)에서:

```bash
# MySQL root 비밀번호를 환경 변수로 넘겨 실행
DB_PASSWORD=내MySQL비밀번호 ./scripts/setup-db.sh
```

비밀번호를 입력받아 실행하려면:

```bash
./scripts/setup-db.sh
```

**방법 C: mysql 명령으로 직접**  
스키마를 직접 넣고 싶다면:

```bash
# 터미널 (비밀번호가 root인 경우)
mysql -u root -proot < DN_project01/docs/schema.sql
```

또는 MySQL 클라이언트(Workbench, DBeaver, VS Code MySQL 익스텐션 등)에서 `docs/schema.sql` 파일을 열어 실행하면 됩니다.

### 1-3. 백엔드 연결 설정

`backend/src/main/resources/application-dev.yml` 기본값:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/dn_platform?useSSL=false&serverTimezone=Asia/Seoul&characterEncoding=UTF-8&allowPublicKeyRetrieval=true
    username: ${DB_USERNAME:root}
    password: ${DB_PASSWORD:root}
```

로컬 MySQL의 포트/DB이름/계정이 위와 같으면 추가 수정 없이 사용 가능합니다. 다르면 URL·username·password만 맞추면 됩니다.

---

## 2. Docker로 MySQL 사용 (선택)

Docker를 쓰고 싶을 때만 사용합니다. 프로젝트 루트(`DN_project01`)에서:

```bash
docker compose up -d
```

- **컨테이너**: `dn-mysql` (MySQL 8.0)
- **포트**: `3306`
- **DB 이름**: `dn_platform`
- **계정** (기본값): root / `root`, 또는 사용자 `dn` / `dn`

테이블은 **JPA 자동 생성**(백엔드 dev 프로필 실행) 또는 아래처럼 스키마 수동 적용:

```bash
cat DN_project01/docs/schema.sql | docker exec -i dn-mysql mysql -u root -proot
```

접속 확인:

```bash
docker exec -it dn-mysql mysql -u root -proot dn_platform -e "SHOW TABLES;"
```

---

## 3. AWS 등 배포 시

DB는 AWS RDS(MySQL) 등에 만들고, 배포 환경용 설정(예: `application-prod.yml`)에서 다음만 바꾸면 됩니다.

- `spring.datasource.url` → RDS 엔드포인트
- `spring.datasource.username` / `password` → RDS 계정

로컬은 **로컬 MySQL**, 배포는 **RDS**로 나누어 두는 구성이 일반적입니다.

---

## 4. 요약

| 환경       | DB 위치        | 도커 필요 |
|------------|-----------------|-----------|
| 로컬 개발  | 로컬 MySQL      | 아니오    |
| 로컬 개발  | Docker MySQL    | 예        |
| AWS 배포  | RDS 등          | DB는 RDS 사용 시 도커 불필요 |
