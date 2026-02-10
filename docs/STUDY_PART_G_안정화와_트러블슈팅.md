# AWS 배포 스터디 — 파트 G: 안정화와 트러블슈팅

> **프로젝트**: 62댕냥이 (유기동물 입양/임보 매칭 플랫폼)
> **기술 스택**: Spring Boot 3.2 + Java 21 / React 18 + TypeScript + Vite
> **인프라**: AWS EC2 (t3.micro) + RDS (db.t3.micro) + Nginx + Systemd
> **전편**: [파트 E — Terraform 인프라 생성](./STUDY_PART_E_Terraform_인프라_생성.md) / [파트 F — CI/CD와 환경변수](./STUDY_PART_F_CICD와_환경변수.md)
> **작성 기준**: 실제 프로젝트 코드 (`DN_project01`) 및 운영 중 겪은 장애 사례

---

## 목차

| 장 | 제목 | 핵심 키워드 |
|---|------|------------|
| 12장 | Elastic IP | 동적 IP → 고정 IP, IP 변경 시 5곳 수정, EIP 과금 |
| 13장 | 헬스체크 자동화 | healthcheck.sh, Cron, Systemd 자동 재시작 |
| 14장 | 시간대 문제 | UTC vs KST, Cron 역산, RDS 백업 윈도우 |
| 15장 | DB 스키마 불일치 | VARCHAR vs ENUM, ddl-auto, validate |
| 16장 | CORS 문제 디버깅 | FRONTEND_URL, allowed-origins, DevTools |
| 17장 | 무료 티어 과금 방지 | EC2/RDS 한도, EIP, terraform destroy 잔재 |
| 18장 | 전체 배포 플로우 정리 | 처음부터 끝까지 시퀀스, 트러블슈팅 체크리스트 |

---

# 12장. Elastic IP — "IP가 바뀌면 모든 것이 무너진다"

## Why — 왜 고정 IP가 필요한가

AWS EC2의 공인 IP(Public IP)는 **임시**다. 인스턴스를 중지(Stop)하고 다시 시작(Start)하면 **새로운 IP**가 할당된다.

```
월요일: EC2 시작 → Public IP = 3.39.187.182
화요일: EC2 중지 후 재시작 → Public IP = 52.78.xxx.xxx  ← 바뀜!
```

IP가 바뀌면 일어나는 일:

```
브라우저에서 http://3.39.187.182 접속 → ❌ 접속 불가 (더 이상 그 IP가 아님)
GitHub Actions 배포 → ❌ SSH 접속 실패 (EC2_HOST가 옛날 IP)
프론트엔드 API 호출 → ❌ CORS 에러 (FRONTEND_URL이 옛날 IP)
이메일 링크 클릭 → ❌ 깨진 링크 (app.frontend-url이 옛날 IP)
```

## 이 프로젝트의 실제 경험

**❌ 문제**: EC2를 재시작했더니 Public IP가 `3.39.187.182`에서 다른 IP로 변경되었다. 프론트엔드 접속 불가, API 호출 실패, GitHub Actions 배포 실패.

**🔍 원인**: EC2의 동적 IP는 인스턴스 중지/시작 시 반드시 변경된다. 이것은 버그가 아니라 AWS의 정상 동작이다.

**✅ 해결**: Elastic IP(탄력적 IP, EIP) 할당.

```
Elastic IP 할당 후:
  이전: 3.39.187.182 (동적, 재시작마다 변경)
  이후: 13.125.175.126 (고정, EC2 재시작해도 유지)
```

**💡 교훈**: EC2를 생성하면 **가장 먼저** Elastic IP를 할당하라. 이 프로젝트에서는 Terraform 코드(`terraform/main.tf`)에 EIP 리소스를 포함시켜서 `terraform apply` 시 자동 할당되도록 했다:

```hcl
# terraform/main.tf
resource "aws_eip" "web" {
  instance = aws_instance.web.id
  domain   = "vpc"
  tags     = { Name = "dn-platform-web-eip" }
}
```

## IP 변경 시 수정해야 하는 곳 — 총 5곳

Elastic IP를 새로 할당하거나, 인프라를 재생성해서 IP가 바뀌면 **5곳**을 모두 업데이트해야 한다.
하나라도 빠뜨리면 일부 기능이 깨진다.

```
┌─────────────────────────────────────────────────────────────────┐
│  IP 변경 시 수정 체크리스트                                       │
├─────┬───────────────────────────────┬───────────────────────────┤
│  #  │ 수정 위치                      │ 빠뜨리면 생기는 문제        │
├─────┼───────────────────────────────┼───────────────────────────┤
│  1  │ GitHub Secrets → EC2_HOST     │ 배포(SCP/SSH) 실패         │
│  2  │ GitHub Secrets → FRONTEND_URL │ CORS 에러 + 이메일 링크 깨짐 │
│  3  │ EC2 start.sh (재배포로 갱신)   │ CORS, 프론트 URL 불일치     │
│  4  │ 브라우저 북마크/접속 URL         │ 접속 불가                   │
│  5  │ 카카오 개발자 콘솔 → JS SDK 도메인│ 카카오맵 로딩 실패          │
└─────┴───────────────────────────────┴───────────────────────────┘
```

### 수정 순서

```bash
# 1. GitHub Secrets 업데이트
#    Repository → Settings → Secrets and variables → Actions
#    EC2_HOST = 새_IP
#    FRONTEND_URL = http://새_IP

# 2. 재배포 (start.sh가 자동 재생성됨)
git commit --allow-empty -m "trigger deploy for IP change"
git push origin main

# 3. 카카오 개발자 콘솔
#    내 애플리케이션 → 플랫폼 → Web → 사이트 도메인
#    http://새_IP 추가

# 4. 브라우저에서 http://새_IP 접속 확인
```

> 3번(start.sh)은 별도 수정이 필요 없다. GitHub Actions가 재배포할 때 `FRONTEND_URL` Secret의 새 값으로 start.sh를 **동적 생성**하기 때문이다. 이것이 파트 F에서 설명한 "start.sh 동적 생성 구조"의 장점이다.

## EIP 과금 주의

> **경고**: Elastic IP는 **EC2에 연결되어 있으면 무료**지만, EC2 없이 EIP만 남아있으면 과금된다!

| 상태 | 과금 |
|------|------|
| EIP가 실행 중인 EC2에 연결됨 | 무료 |
| EIP가 중지된 EC2에 연결됨 | **시간당 $0.005** (월 ~$3.6) |
| EIP가 어떤 EC2에도 연결 안 됨 | **시간당 $0.005** (월 ~$3.6) |

```
흔한 실수:
  terraform destroy로 EC2 삭제
    → EIP도 삭제됨 (Terraform이 관리하므로 OK)

  AWS 콘솔에서 EC2만 종료(Terminate)
    → EIP가 해제(Release)되지 않고 남아있음 → 과금 시작!
```

**확인 방법**:

```
AWS 콘솔 → EC2 → 왼쪽 메뉴: 네트워크 및 보안 → 탄력적 IP
→ "연결된 인스턴스 ID"가 비어있는 EIP가 있으면 → 즉시 릴리스(Release)
```

---

# 13장. 헬스체크 자동화 — "새벽에 서버가 죽어도 괜찮다"

## Why — 왜 헬스체크가 필요한가

서버는 예고 없이 죽을 수 있다:

```
- Java 프로세스가 OutOfMemoryError로 죽음
- Nginx가 설정 오류로 비정상 종료
- 디스크 100% 차서 로그 기록 실패 → 서비스 장애
- 새벽 3시에 이런 일이 터지면? → 아침에 출근해서야 알게 됨
```

이 프로젝트는 2가지 레벨의 자동 복구를 구성했다:

| 레벨 | 도구 | 역할 |
|------|------|------|
| 1차 | Systemd `Restart=on-failure` | 프로세스 죽으면 5초 후 자동 재시작 |
| 2차 | healthcheck.sh + Cron | 5분마다 서비스 상태 + HTTP 응답 확인, 리소스 경고 |

## healthcheck.sh 상세 분석

이 스크립트는 `scripts/healthcheck.sh`에 있으며, EC2의 `/home/ec2-user/healthcheck.sh`에 배치된다.

### 전체 구조

```bash
#!/bin/bash
# DN Platform 헬스체크 스크립트
# Cron으로 5분마다 실행하여 서비스 자동 재시작

LOG_FILE="/home/ec2-user/healthcheck.log"
MAX_LOG_LINES=1000
```

### 로그 함수 — 로그 파일 무한 증가 방지

```bash
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"

  # 로그 파일 크기 제한: 최대 1000줄만 유지
  if [ -f "$LOG_FILE" ]; then
    tail -n $MAX_LOG_LINES "$LOG_FILE" > "$LOG_FILE.tmp"
    mv "$LOG_FILE.tmp" "$LOG_FILE"
  fi
}
```

**왜 1000줄 제한인가?** EC2 t3.micro는 디스크가 20GB밖에 없다.
5분마다 2줄씩 기록하면 하루 576줄, 이틀이면 1000줄을 넘긴다.
오래된 로그는 자동으로 잘려나간다.

### 체크 1: Nginx 상태

```bash
if ! systemctl is-active --quiet nginx; then
  log "❌ Nginx 다운 감지 - 재시작 시도"
  sudo systemctl restart nginx
  sleep 2
  if systemctl is-active --quiet nginx; then
    log "✅ Nginx 재시작 성공"
  else
    log "⚠️ Nginx 재시작 실패"
  fi
else
  log "✅ Nginx 정상"
fi
```

**동작**: Nginx가 죽어있으면 재시작 시도 → 2초 대기 → 결과 확인.

### 체크 2: Backend(dn-platform) 상태

```bash
if ! systemctl is-active --quiet dn-platform; then
  log "❌ Backend 다운 감지 - 재시작 시도"
  sudo systemctl restart dn-platform
  sleep 5
  if systemctl is-active --quiet dn-platform; then
    log "✅ Backend 재시작 성공"
  else
    log "⚠️ Backend 재시작 실패"
  fi
else
  # 서비스는 살아있지만 HTTP 응답이 정상인지도 확인
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost 2>/dev/null)
  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
    log "✅ Backend 정상 (HTTP $HTTP_CODE)"
  else
    log "⚠️ Backend HTTP 응답 이상 (HTTP $HTTP_CODE)"
  fi
fi
```

**포인트**: `systemctl is-active`는 프로세스가 살아있는지만 확인한다.
프로세스가 살아있어도 DB 연결 끊김 등으로 HTTP 500을 반환할 수 있다.
그래서 **HTTP 응답 코드까지 확인**한다.

- `200`: 정상
- `304`: Not Modified (정상 — 캐시 응답)
- `500`: 서버 내부 에러 → 로그 확인 필요
- `000`: 연결 불가 → 서비스 기동 중이거나 포트 미바인딩

### 체크 3: 디스크 사용량

```bash
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
  log "⚠️ 디스크 사용량: ${DISK_USAGE}%"
fi
```

**80%를 넘기면 경고하는 이유**: 디스크가 100%가 되면:
- 로그 기록 불가 → Spring Boot 에러
- RDS 로컬 캐시 생성 불가
- 시스템 임시 파일 생성 불가 → 서비스 전체 장애

### 체크 4: 메모리 사용량

```bash
MEM_USAGE=$(free | awk 'NR==2 {printf "%.0f", $3*100/$2}')
if [ "$MEM_USAGE" -gt 90 ]; then
  log "⚠️ 메모리 사용량: ${MEM_USAGE}%"
fi
```

**t3.micro의 메모리는 1GB**. Java(Spring Boot)가 기본 256~512MB를 쓰고, Nginx와 OS가 나머지를 쓰면 금방 90%에 도달한다.

## Cron 등록

EC2에 SSH 접속 후:

```bash
# 실행 권한 부여
chmod +x /home/ec2-user/healthcheck.sh

# Cron 등록 (5분마다 실행)
(crontab -l 2>/dev/null | grep -v healthcheck.sh; \
 echo "*/5 * * * * /home/ec2-user/healthcheck.sh") | crontab -

# 등록 확인
crontab -l
# 출력: */5 * * * * /home/ec2-user/healthcheck.sh

# Cron 서비스 동작 확인
sudo systemctl status crond
```

**Cron 표현식 `*/5 * * * *` 해석**:

```
*/5  = 매 5분 (0, 5, 10, 15, ..., 55분)
*    = 매 시간
*    = 매 일
*    = 매 월
*    = 매 요일
```

## Systemd 자동 재시작 — 1차 방어선

Cron 헬스체크는 5분 간격이므로, 그 사이에 서비스가 죽으면 최대 5분간 다운된다.
**Systemd의 자동 재시작**이 1차 방어선 역할을 한다.

```ini
# /etc/systemd/system/dn-platform.service
[Service]
Restart=on-failure
RestartSec=5
```

| 설정 | 의미 |
|------|------|
| `Restart=on-failure` | 비정상 종료(exit code ≠ 0) 시 재시작 |
| `RestartSec=5` | 재시작 전 5초 대기 (연속 재시작 방지) |

```
서비스 죽음 → 5초 후 Systemd가 자동 재시작 (1차)
         → 그래도 안 살아나면 → 5분 후 Cron 헬스체크가 감지 (2차)
```

## 모니터링 명령어 정리

```bash
# ── 헬스체크 로그 ──
tail -f ~/healthcheck.log                    # 실시간 확인
grep "❌" ~/healthcheck.log                  # 장애 이력만 필터

# ── 서비스 상태 ──
sudo systemctl status nginx dn-platform      # 두 서비스 상태 동시 확인
sudo journalctl -u dn-platform --since "1 hour ago"  # 최근 1시간 로그

# ── 리소스 사용량 ──
df -h                                        # 디스크 사용량
free -h                                      # 메모리 사용량
top -bn1 | head -20                          # CPU/메모리 상위 프로세스

# ── 애플리케이션 로그 ──
tail -f ~/log.out                            # Spring Boot 표준 출력
tail -f ~/err.out                            # Spring Boot 에러 출력
tail -100 ~/err.out | grep -i "error"        # 최근 에러만 필터
```

---

# 14장. 시간대 문제 — "UTC와 KST의 9시간 차이"

## Why — 왜 시간대가 문제가 되는가

한국에서 개발하면 모든 시간을 KST(한국 표준시, UTC+9)로 생각한다.
하지만 서버 세계에서는 **거의 모든 것이 UTC**를 기본으로 쓴다.

```
개발자의 생각: "새벽 2시에 동기화 돌려야지" → Cron: 0 0 2 * * *
실제 동작:     UTC 02:00 = KST 11:00 (오전!) → 대낮에 동기화 실행
```

## 이 프로젝트의 실제 실수

**❌ 문제**: 공공데이터 자동 동기화를 "한국시간 새벽 2시"에 실행하려고 Cron을 `0 0 2 * * *`로 설정했다. 실제로는 **한국시간 오전 11시**에 실행되어, 사용자가 서비스를 이용하는 시간에 대량 동기화가 돌아갔다.

**🔍 원인**: Spring Boot의 `@Scheduled(cron = "...")` 은 JVM의 시간대를 따른다. EC2(Amazon Linux)의 시스템 시간대는 **UTC가 기본**이다.

```bash
# EC2에서 시간대 확인
date
# Thu Feb  6 15:30:00 UTC 2025  ← UTC!

timedatectl
# Time zone: UTC (UTC, +0000)
```

**✅ 해결**: UTC 기준으로 역산해서 Cron 표현식 수정.

```
목표: KST 02:00 (한국시간 새벽 2시)
계산: KST 02:00 - 9시간 = UTC 17:00
결과: "0 0 17 * * *"
```

GitHub Secrets의 `PUBLIC_API_SYNC_CRON` 값을 `0 0 17 * * *`로 변경 후 재배포.

**💡 교훈**: 서버에서 시간을 다룰 때는 **항상 UTC로 생각**하고, 사용자에게 보여줄 때만 KST로 변환하라.

## 시간대 변환 조견표

이 프로젝트에서 자주 필요한 KST ↔ UTC 변환:

```
KST (한국)    UTC (서버)     용도
──────────    ──────────    ────────────────
00:00         15:00 (전날)  자정
02:00         17:00 (전날)  새벽 (이 프로젝트의 동기화 시간)
06:00         21:00 (전날)  이른 아침
09:00         00:00         업무 시작
12:00         03:00         점심
18:00         09:00         퇴근
23:59         14:59         하루 끝

변환 공식:
  KST → UTC: 시간에서 9를 뺀다 (음수면 전날 + 24)
  UTC → KST: 시간에 9를 더한다 (24 이상이면 다음날 - 24)
```

## 이 프로젝트에서 시간대가 영향을 미치는 곳

### 1. Spring Boot @Scheduled (Cron)

```java
// start.sh에서 주입:
// --public-api.sync-cron="0 0 17 * * *"

@Scheduled(cron = "${public-api.sync-cron}")
public void scheduledSync() { ... }
```

UTC 17:00 = KST 02:00. **이 값은 GitHub Secrets `PUBLIC_API_SYNC_CRON`에 저장**된다.

### 2. RDS 백업 윈도우

```hcl
# terraform/main.tf
backup_window      = "03:00-04:00"       # UTC 03:00 = KST 12:00
maintenance_window = "mon:04:00-mon:05:00" # UTC 04:00 = KST 13:00
```

| 설정 | UTC | KST | 의미 |
|------|-----|-----|------|
| backup_window | 03:00-04:00 | 12:00-13:00 | 매일 자동 백업 |
| maintenance_window | 월 04:00-05:00 | 월 13:00-14:00 | 엔진 패치 등 유지보수 |

> 이 시간대는 서비스 이용이 활발한 점심 시간이라 이상적이지는 않다.
> 운영 환경이라면 `backup_window = "17:00-18:00"` (KST 02:00-03:00)으로 변경하는 것이 좋다.

### 3. GitHub Actions 실행 시간

GitHub Actions의 `on.schedule` 역시 UTC 기준이다.
(이 프로젝트는 push 트리거만 사용하므로 해당 없지만 참고용)

```yaml
# 예: 매일 KST 09:00에 실행하고 싶다면
on:
  schedule:
    - cron: '0 0 * * *'  # UTC 00:00 = KST 09:00
```

### 4. 로그 타임스탬프

```bash
# EC2의 Spring Boot 로그
tail -1 ~/log.out
# 2025-02-06 17:00:01.123 INFO  ...  ← UTC 시간!

# healthcheck.sh 로그
tail -1 ~/healthcheck.log
# [2025-02-06 17:00:00] ✅ Backend 정상  ← UTC 시간!
```

로그를 볼 때 **"이 시간은 UTC다"**를 항상 기억해야 한다.
KST로 보고 싶으면 +9시간 하면 된다.

### 5. DB TIMESTAMP vs DATETIME

```sql
-- schema.sql에서의 사용 예
created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6)
```

| 타입 | 저장 | 조회 시 | 시간대 변환 |
|------|------|---------|------------|
| `TIMESTAMP` | UTC로 저장 | 세션 시간대로 변환해서 반환 | 자동 |
| `DATETIME` | 입력값 그대로 저장 | 그대로 반환 | 없음 |

이 프로젝트는 `TIMESTAMP`를 사용하므로, JDBC URL에 `serverTimezone=Asia/Seoul`을 설정해서 KST로 조회된다:

```
jdbc:mysql://...?useSSL=false&serverTimezone=Asia/Seoul&characterEncoding=UTF-8
```

---

# 15장. DB 스키마 불일치 문제 — "JPA Entity와 실제 DB가 다르면"

## 이 프로젝트의 실제 사례

### 사건의 전말

V5 마이그레이션(`V5__add_sync_history.sql`)으로 `sync_history` 테이블을 생성할 때,
`trigger_type` 컬럼을 **처음에 `VARCHAR(20)`으로** 만들었다.

```sql
-- 최초 (잘못된) 버전
CREATE TABLE sync_history (
    ...
    trigger_type VARCHAR(20) NOT NULL,  -- ← 여기가 문제
    ...
);
```

한편, JPA Entity(`SyncHistory.java`)에서는 이렇게 선언했다:

```java
// backend/src/main/java/com/dnproject/platform/domain/SyncHistory.java
@Enumerated(EnumType.STRING)
@Column(name = "trigger_type", nullable = false, length = 20)
private SyncTriggerType triggerType;
```

```java
// backend/src/main/java/com/dnproject/platform/domain/constant/SyncTriggerType.java
public enum SyncTriggerType {
    AUTO,   // 스케줄(매일 새벽 2시 등)
    MANUAL  // 관리자 수동 실행
}
```

**❌ 문제**: 자동 동기화(`AnimalSyncService`)가 실행되면 SyncHistory를 저장하는데, DB에 INSERT할 때 Hibernate가 ENUM 매핑 에러를 발생시켰다.

```
org.hibernate.MappingException: No dialect mapping for JDBC type
```

**🔍 원인**: MySQL의 `VARCHAR(20)`과 `ENUM('AUTO','MANUAL')`은 JDBC 드라이버 레벨에서 다르게 매핑된다. Hibernate의 `@Enumerated(EnumType.STRING)`은 VARCHAR에도 동작하지만, DDL 검증(validate) 시 ENUM 타입을 기대하는 상황에서 불일치가 발생했다.

**✅ 해결**: DB 컬럼 타입을 ENUM으로 변경:

```sql
ALTER TABLE sync_history
  MODIFY COLUMN trigger_type ENUM('AUTO', 'MANUAL') NOT NULL;
```

수정된 V5 마이그레이션 파일(`docs/migrations/V5__add_sync_history.sql`)의 최종 버전:

```sql
CREATE TABLE IF NOT EXISTS sync_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    run_at TIMESTAMP(6) NOT NULL,
    trigger_type ENUM('AUTO', 'MANUAL') NOT NULL,  -- ← ENUM으로 수정
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

**💡 교훈**: SQL 마이그레이션을 작성할 때 반드시 **JPA Entity 클래스를 옆에 펴놓고** 타입을 맞춰야 한다.

## JPA ddl-auto 설정별 동작

이 프로젝트의 `application-prod.yml`:

```yaml
# backend/src/main/resources/application-prod.yml
spring:
  jpa:
    hibernate:
      ddl-auto: update  # 엔티티 기반 테이블 자동 생성/수정
```

| ddl-auto 값 | 동작 | 언제 사용 |
|-------------|------|----------|
| `none` | 아무것도 안 함 | 수동 마이그레이션 완전 관리 |
| `validate` | Entity와 DB 불일치 시 **즉시 에러로 기동 실패** | prod 권장 |
| `update` | 없는 컬럼/테이블 자동 추가 (삭제는 안 함) | 개발 편의 (위험!) |
| `create` | 기동 시 테이블 DROP 후 재생성 | 절대 prod에서 쓰지 말 것 |
| `create-drop` | 종료 시 테이블 DROP | 테스트 전용 |

> **이 프로젝트의 교훈**: prod에서 `validate`를 썼다면, V5 마이그레이션의 VARCHAR/ENUM 불일치를 **배포 시점에 즉시 감지**했을 것이다. `update`를 쓰고 있었기 때문에 기동은 성공했지만, 실제 동기화 실행 시점에 런타임 에러가 터진 것이다.

```
ddl-auto=update (현재):
  기동 성공 → 운영 중 SyncHistory 저장 시 에러 → 원인 찾기 어려움

ddl-auto=validate (권장):
  기동 실패 → 에러 메시지에 "trigger_type 타입 불일치" 명시 → 즉시 수정 가능
```

## 스키마 불일치 디버깅 방법

```bash
# 1. EC2에서 현재 DB 스키마 확인
mysql -h dn-platform-db.c98wmqqswrwy.ap-northeast-2.rds.amazonaws.com \
      -u dnadmin -p dn_platform \
      -e "DESCRIBE sync_history;"

# 2. 특정 컬럼 타입 확인
mysql ... -e "SELECT COLUMN_NAME, COLUMN_TYPE, DATA_TYPE
             FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_NAME = 'sync_history'
             AND COLUMN_NAME = 'trigger_type';"

# 3. JPA Entity 확인 (로컬에서)
# SyncHistory.java의 @Enumerated, @Column 어노테이션 확인

# 4. 불일치 발견 시 ALTER로 수정
mysql ... -e "ALTER TABLE sync_history
             MODIFY COLUMN trigger_type ENUM('AUTO','MANUAL') NOT NULL;"
```

---

# 16장. CORS 문제 디버깅 — "프론트는 되는데 API가 안 될 때"

## What — CORS 에러란

브라우저에서 **다른 출처(Origin)**의 API를 호출하면 브라우저가 차단한다.
"출처"는 프로토콜 + 도메인 + 포트의 조합이다.

```
같은 출처:
  http://13.125.175.126 (프론트) → http://13.125.175.126/api (API)
  → Nginx가 같은 도메인으로 서빙하므로 CORS 문제 없음!

다른 출처 (개발 환경):
  http://localhost:5173 (Vite dev server) → http://localhost:8080/api (Spring Boot)
  → 포트가 다르므로 CORS 설정 필요!
```

## 이 프로젝트의 CORS 설정 경로

```
GitHub Secrets → FRONTEND_URL = http://13.125.175.126
       │
       ▼
deploy.yml → SSH Script:
  CORS_ORIGINS="http://localhost:5173,http://localhost:3000,${FRONTEND_URL}"
       │
       ▼
start.sh → --cors.allowed-origins="${CORS_ORIGINS}"
       │
       ▼
CorsConfig.java:
  @Value("${cors.allowed-origins:http://localhost:5173,http://localhost:3000}")
  private String allowedOrigins;

  config.setAllowedOrigins(List.of(allowedOrigins.split(",")));
```

최종적으로 Spring Boot가 허용하는 출처(Origins) 목록:

```
1. http://localhost:5173  (로컬 Vite 개발 서버)
2. http://localhost:3000  (로컬 React 개발 서버)
3. http://13.125.175.126  (프로덕션 프론트엔드)
```

## CORS 에러가 발생하는 시나리오

### 시나리오 1: Elastic IP 변경 후 FRONTEND_URL 미업데이트

**❌ 문제**: Elastic IP를 새로 할당했는데 `FRONTEND_URL`을 안 바꿨다.

```
브라우저: http://13.125.175.126 에서 /api/animals 호출
백엔드 CORS: http://3.39.187.182 만 허용 (옛날 IP)
결과: Access-Control-Allow-Origin 헤더 없음 → CORS 에러
```

### 시나리오 2: 재배포 없이 EC2에서 직접 start.sh 수정

**❌ 문제**: GitHub Secrets는 업데이트했지만 재배포를 안 했다.

```
GitHub Secrets: FRONTEND_URL = http://13.125.175.126 (새 IP, 정확함)
EC2 start.sh: --cors.allowed-origins="...,http://3.39.187.182" (옛날 IP, 아직 안 바뀜)
→ 재배포해야 start.sh가 새 값으로 재생성됨!
```

### 시나리오 3: VITE_API_BASE_URL 설정 오류

```
빌드 시: VITE_API_BASE_URL=/api (상대 경로)
    → axios.get("/api/animals")
    → 같은 도메인 → CORS 문제 없음 ✅

빌드 시: VITE_API_BASE_URL=http://13.125.175.126:8080/api (절대 경로, 실수)
    → axios.get("http://13.125.175.126:8080/api/animals")
    → 포트가 다름 (80 vs 8080) → CORS 에러 ❌
```

## 디버깅 순서

### Step 1: 브라우저 DevTools에서 확인

```
Chrome → F12 (개발자 도구) → Network 탭
→ 실패한 API 요청 클릭 → Headers 탭

확인할 것:
  Request Headers:
    Origin: http://13.125.175.126
  Response Headers:
    Access-Control-Allow-Origin: (이 헤더가 없으면 CORS 에러!)
```

### Step 2: 에러 메시지 확인

```
Console 탭에서 보이는 에러:

"Access to XMLHttpRequest at 'http://13.125.175.126/api/animals'
 from origin 'http://13.125.175.126' has been blocked by CORS policy:
 No 'Access-Control-Allow-Origin' header is present on the requested resource."
```

### Step 3: EC2에서 start.sh 확인

```bash
ssh -i ~/.ssh/id_rsa ec2-user@13.125.175.126

# start.sh에서 CORS 설정 확인
grep "cors" ~/app/start.sh
# --cors.allowed-origins="http://localhost:5173,http://localhost:3000,http://13.125.175.126"
#                                                                      ↑ 이 URL이 정확한지 확인!
```

### Step 4: 백엔드 직접 테스트

```bash
# CORS 헤더 포함 요청 시뮬레이션
curl -v -H "Origin: http://13.125.175.126" \
     http://localhost:8080/api/animals 2>&1 | grep -i "access-control"

# 정상이면:
# < Access-Control-Allow-Origin: http://13.125.175.126
# < Access-Control-Allow-Credentials: true

# 비정상이면:
# (Access-Control-Allow-Origin 헤더가 아예 없음)
```

### Step 5: Nginx 프록시 확인

```bash
# Nginx가 CORS 헤더를 먹고 있는지 확인
curl -v http://localhost/api/animals 2>&1 | grep -i "access-control"

# localhost:8080 직접 호출과 localhost(Nginx) 경유 호출 결과가 다르면
# → Nginx 설정 문제
```

---

# 17장. 무료 티어 과금 방지 체크리스트

## AWS 무료 티어의 함정

AWS 무료 티어는 "12개월간 무료"이지만, **한도를 넘으면 바로 과금**된다.
그리고 그 한도가 은근히 좁다.

> **경고**: AWS 과금은 "사용한 만큼" 즉시 청구된다. "실수로 ALB를 켜놨다가 한 달에 $20 과금"같은 사례가 매우 흔하다.

## EC2 과금 주의사항

| 항목 | 무료 한도 | 이 프로젝트 설정 | 초과 시 |
|------|----------|-----------------|--------|
| 인스턴스 | t3.micro 750시간/월 | t3.micro 1개 24시간 | 시간당 ~$0.013 |
| EBS 스토리지 | 30GB (gp2/gp3) | 20GB gp2 | GB당 ~$0.114/월 |
| Elastic IP | EC2 연결 시 무료 | 1개, EC2 연결 | 미연결 시 시간당 $0.005 |
| 데이터 전송 | 월 100GB (아웃바운드) | 소규모 트래픽 | GB당 ~$0.126 |

```
⚠️ 주의: t3.micro 인스턴스를 2개 동시에 실행하면
  → 각각 24시간 × 31일 = 744시간 × 2 = 1,488시간
  → 750시간 초과분 738시간 과금!

⚠️ 주의: "중지(Stop)"와 "종료(Terminate)"는 다르다!
  중지 = 일시정지 (EBS 비용은 계속 발생, EIP 미연결 과금)
  종료 = 인스턴스 삭제 (delete_on_termination=true면 EBS도 삭제)
```

## RDS 과금 주의사항

| 항목 | 무료 한도 | 이 프로젝트 설정 | 주의 |
|------|----------|-----------------|------|
| 인스턴스 | db.t3.micro 750시간/월 | db.t3.micro 1개 | 2개 이상 X |
| 스토리지 | 20GB | 20GB | 자동 확장 방지 설정 필수 |
| 백업 스토리지 | DB 크기와 동일 (20GB) | retention 1일 | 스냅샷 누적 주의 |
| Multi-AZ | 무료 아님! | `multi_az = false` | 절대 켜지 말 것 |

이 프로젝트의 Terraform 설정이 과금을 방지하는 방법:

```hcl
# terraform/main.tf — RDS 설정
resource "aws_db_instance" "mysql" {
  instance_class = "db.t3.micro"       # 무료 티어 인스턴스

  allocated_storage     = 20           # 초기 20GB
  max_allocated_storage = 20           # ← 핵심! 자동 확장 방지
                                       #    이 값을 안 쓰거나 더 크게 하면
                                       #    데이터가 늘어날 때 자동으로 스토리지 확장 → 과금

  multi_az = false                     # Multi-AZ는 가격이 2배!

  backup_retention_period = 1          # 백업 1일만 유지 (스냅샷 누적 방지)
  skip_final_snapshot     = true       # 삭제 시 최종 스냅샷 안 만듦 (과금 방지)
}
```

> **경고**: `max_allocated_storage`를 설정하지 않으면 AWS가 자동으로 스토리지를 확장한다. 20GB에서 시작해서 데이터가 쌓이면 30GB, 40GB... 로 늘어나면서 무료 한도를 초과한다.

## 이 프로젝트가 사용하지 않는 (과금 위험) 서비스

| 서비스 | 과금 | 이 프로젝트에서 |
|--------|------|----------------|
| ALB (Application Load Balancer) | 시간당 ~$0.025 + 트래픽 | 미사용 (Nginx 직접 사용) |
| NAT Gateway | 시간당 $0.045 + 데이터 | 미사용 (기본 VPC 사용) |
| CloudWatch 상세 모니터링 | 메트릭당 과금 | 기본(무료)만 사용 |
| Route 53 호스팅 영역 | 영역당 $0.50/월 | 미사용 (IP 직접 접속) |
| S3 | 5GB/월 무료 | 미사용 |

> **ALB를 쓰지 않는 이유**: 이 프로젝트는 EC2 1대에 Nginx를 직접 설치했다. ALB는 여러 EC2에 트래픽을 분산하는 용도인데, 서버 1대짜리 프로젝트에서는 불필요하고 과금만 발생한다.

## terraform destroy 시 주의

`terraform destroy`는 Terraform이 만든 모든 리소스를 삭제한다.

```bash
cd terraform
terraform destroy
```

**삭제되는 것**:

```
✅ EC2 인스턴스
✅ EBS 볼륨 (delete_on_termination=true)
✅ Elastic IP
✅ RDS 인스턴스 (skip_final_snapshot=true)
✅ Security Group
✅ DB Subnet Group
✅ Key Pair
```

**삭제되지 않을 수 있는 것**:

```
⚠️ RDS 수동 스냅샷 (콘솔에서 직접 만든 경우)
⚠️ EBS 수동 스냅샷
⚠️ CloudWatch 로그 그룹
⚠️ S3 버킷 (이 프로젝트는 미사용)
```

```bash
# destroy 후 잔재 확인
# AWS 콘솔 → RDS → 스냅샷 → 수동 스냅샷 확인
# AWS 콘솔 → EC2 → 스냅샷 → EBS 스냅샷 확인
# AWS 콘솔 → EC2 → 탄력적 IP → 연결 안 된 EIP 확인
```

## 과금 확인 및 알림 설정

### 현재 과금 확인

```
AWS 콘솔 → 우측 상단 계정명 클릭 → 결제 대시보드 (Billing Dashboard)
→ Cost Explorer → 일별/서비스별 비용 확인
```

### 예산 알림 설정 (강력 권장)

```
AWS 콘솔 → 결제 → 예산 (Budgets) → 예산 생성
→ 비용 예산 → 월별 → 예산 금액: $1.00
→ 실제 비용이 100% ($1) 도달 시 이메일 알림
→ 예상 비용이 100% ($1) 도달 시 이메일 알림
```

이렇게 설정하면 **$1라도 과금이 발생하면 즉시 이메일**이 온다.
학생/개인 프로젝트에서는 반드시 설정해야 한다.

```
비용 패턴 예시 (이 프로젝트, 정상 운영 시):
  EC2 t3.micro:     $0.00 (무료 티어)
  RDS db.t3.micro:  $0.00 (무료 티어)
  EBS 20GB:         $0.00 (30GB 한도 내)
  EIP:              $0.00 (EC2 연결)
  데이터 전송:       $0.00 (100GB 한도 내)
  ────────────────────────
  총계:             $0.00/월
```

---

# 18장. 전체 배포 플로우 정리 — 처음부터 끝까지

## 완전한 배포 시퀀스

새 프로젝트를 AWS에 배포하는 **처음부터 끝까지**의 전체 과정이다.

```
 Phase 1. 사전 준비 (로컬)
 ─────────────────────────
  ① AWS 계정 가입 + IAM 사용자 생성
     → Access Key ID + Secret Access Key 발급
  ② aws configure로 CLI 설정
  ③ SSH 키페어 생성: ssh-keygen -t rsa -b 4096
     → 공개키(.pub)는 Terraform용, 개인키는 GitHub Secrets용

 Phase 2. 인프라 생성 (Terraform) — 파트 E
 ─────────────────────────────────────────
  ④ terraform.tfvars 작성 (DB 비밀번호 등)
  ⑤ terraform init → plan → apply
     → EC2, RDS, Security Group, Elastic IP 생성
  ⑥ terraform output 확인
     → ec2_public_ip = "13.125.175.126"
     → rds_endpoint  = "dn-platform-db.xxx.rds.amazonaws.com:3306"

 Phase 3. DB 초기화 (EC2 경유) — 파트 F 8장
 ─────────────────────────────────────────
  ⑦ EC2 SSH 접속: ssh -i ~/.ssh/id_rsa ec2-user@13.125.175.126
  ⑧ MySQL 클라이언트 설치: sudo dnf install -y mariadb105
  ⑨ RDS 접속 → schema.sql 실행 (14개 테이블 생성)
  ⑩ 마이그레이션 V1~V5 순차 적용

 Phase 4. CI/CD 설정 (GitHub) — 파트 F 9장
 ─────────────────────────────────────────
  ⑪ GitHub Secrets 15개 등록
     → EC2_HOST, EC2_SSH_KEY, RDS_ENDPOINT, RDS_USERNAME, RDS_PASSWORD,
        JWT_SECRET, JWT_ACCESS_VALIDITY, JWT_REFRESH_VALIDITY,
        RESEND_API_KEY, RESEND_FROM_EMAIL, DATA_API_KEY,
        FRONTEND_URL, VITE_MAP_API_KEY,
        PUBLIC_API_SYNC_ENABLED, PUBLIC_API_SYNC_CRON

 Phase 5. 첫 배포 (GitHub Actions) — 파트 F 10장
 ─────────────────────────────────────────────────
  ⑫ git push origin main → GitHub Actions 자동 실행
     → 백엔드 빌드 (Gradle bootJar)
     → 프론트엔드 빌드 (npm ci + npm run build)
     → deploy.tar.gz 패키징
     → SCP로 EC2 전송
     → SSH로 압축 해제 + Nginx 설정 + start.sh 생성 + 서비스 시작

 Phase 6. 동작 확인
 ──────────────────
  ⑬ 브라우저: http://13.125.175.126 → 프론트엔드 로딩 확인
  ⑭ 브라우저: 동물 목록, 회원가입 등 기능 테스트
  ⑮ EC2 SSH: systemctl status dn-platform → active 확인

 Phase 7. 안정화 — 이 문서 (파트 G)
 ──────────────────────────────────
  ⑯ healthcheck.sh 배포 + Cron 등록 (5분마다)
  ⑰ AWS 예산 알림 설정 ($1 초과 시 이메일)
  ⑱ 카카오 개발자 콘솔에 프로덕션 도메인 등록
```

## 전체 아키텍처 다이어그램

```
                    ┌──────────────────────────────────────────────────────┐
                    │                  AWS Cloud (ap-northeast-2)          │
                    │                                                      │
 [개발자 PC]         │   ┌─────────────────────────────────────┐            │
     │              │   │         EC2 (t3.micro)              │            │
     │ git push     │   │         13.125.175.126 (EIP)        │            │
     ▼              │   │                                     │            │
 [GitHub Actions]   │   │  ┌─────────┐    ┌───────────────┐  │            │
     │              │   │  │  Nginx  │    │ Spring Boot   │  │            │
     │ SCP + SSH    │   │  │  (:80)  │───→│  (:8080)      │  │            │
     └──────────────┼──→│  │         │    │               │  │            │
                    │   │  │ /       │    │ /api/*        │──┼──→ [공공데이터 API]
 [브라우저]          │   │  │ /api/* ─┘    │               │  │            │
     │              │   │  └────┬────┘    │               │──┼──→ [Resend 이메일]
     │ HTTP (:80)   │   │       │         └───────┬───────┘  │            │
     └──────────────┼──→│  /var/www/              │          │            │
                    │   │  dn-platform/           │          │            │
                    │   │  (React SPA)            │          │            │
                    │   └─────────────────────────┼──────────┘            │
                    │                             │                        │
                    │   ┌─────────────────────────▼──────────┐            │
                    │   │         RDS (db.t3.micro)          │            │
                    │   │         MySQL 8.0                   │            │
                    │   │         dn_platform DB              │            │
                    │   │   (publicly_accessible = false)     │            │
                    │   └────────────────────────────────────┘            │
                    │                                                      │
                    │   Security Groups:                                    │
                    │     web-sg: 80, 443, 22 ← 0.0.0.0/0               │
                    │     rds-sg: 3306 ← web-sg only                      │
                    └──────────────────────────────────────────────────────┘
```

## "배포가 안 될 때" 트러블슈팅 체크리스트

위에서 아래로 순서대로 확인한다. 상위 항목이 해결되지 않으면 하위 항목은 당연히 실패한다.

```
Layer 1: AWS 인프라
─────────────────────────────────────────────────────────────────
□ AWS 콘솔에서 EC2 → "Running" 상태인가?
  → 확인: EC2 대시보드 → 인스턴스 → 상태
  → 아니면: 인스턴스 시작(Start)

□ Security Group에 필요한 포트가 열려있는가?
  → 확인: EC2 → 보안 그룹 → 인바운드 규칙
  → 필요: 80(HTTP), 443(HTTPS), 22(SSH)

□ Elastic IP가 EC2에 연결되어 있는가?
  → 확인: EC2 → 탄력적 IP → 연결된 인스턴스
  → 아니면: EIP를 EC2에 연결

Layer 2: GitHub Actions 빌드
─────────────────────────────────────────────────────────────────
□ GitHub Actions 로그에서 어느 Step에서 실패했는가?
  → 확인: Repository → Actions 탭 → 실패한 워크플로우

□ 빌드 에러인가? (Step 3: Build Backend, Step 5: Build Frontend)
  → 로컬에서 동일 명령어 실행해서 재현:
    cd backend && ./gradlew clean bootJar -x test
    cd frontend && npm ci && npm run build

□ Secret 검증 실패인가? (Step 7: Verify secrets)
  → GitHub Settings → Secrets 에서 누락된 Secret 등록

Layer 3: EC2 연결 (SCP/SSH)
─────────────────────────────────────────────────────────────────
□ EC2_HOST가 현재 Elastic IP와 일치하는가?
  → 확인: GitHub Secrets → EC2_HOST 값
  → AWS 콘솔의 EIP와 비교

□ EC2_SSH_KEY가 올바른 개인키인가?
  → 확인: 키에 공백/빈 줄 없이 BEGIN~END 포함되어 있는가
  → 테스트: 로컬에서 ssh -i ~/.ssh/id_rsa ec2-user@{EIP}

Layer 4: EC2 내부 서비스
─────────────────────────────────────────────────────────────────
□ dn-platform 서비스가 실행 중인가?
  → ssh 접속 후: sudo systemctl status dn-platform
  → Active: active (running) 이어야 정상

□ err.out에 Java 에러 로그가 있는가?
  → ssh 접속 후: tail -50 ~/err.out
  → DB 연결 에러, Bean 생성 에러 등 확인

□ Spring Boot가 8080 포트에서 응답하는가?
  → ssh 접속 후: curl http://localhost:8080/api/animals
  → JSON 응답이면 정상, Connection refused면 기동 안 됨

Layer 5: Nginx + 프론트엔드
─────────────────────────────────────────────────────────────────
□ Nginx 설정이 문법적으로 올바른가?
  → ssh 접속 후: sudo nginx -t
  → "syntax is ok" 이면 정상

□ Nginx가 프론트엔드를 서빙하는가?
  → ssh 접속 후: curl http://localhost
  → HTML이 반환되면 정상

□ 브라우저에서 http://{EIP} 접속 시 프론트엔드가 보이는가?
  → 안 보이면: Security Group 80 포트 확인

Layer 6: DB 연결
─────────────────────────────────────────────────────────────────
□ RDS Security Group이 EC2 Security Group을 허용하는가?
  → 확인: RDS SG → 인바운드 규칙 → 3306 포트 → web-sg 허용

□ EC2에서 RDS에 직접 접속되는가?
  → ssh 접속 후:
    mysql -h {RDS_ENDPOINT} -u dnadmin -p dn_platform -e "SELECT 1;"

□ start.sh의 JDBC URL이 올바른가?
  → ssh 접속 후: grep "datasource.url" ~/app/start.sh
  → jdbc:mysql://{RDS_ENDPOINT}/dn_platform?... 형식 확인
```

## 빠른 복구 명령어 모음

```bash
# EC2 접속
ssh -i ~/.ssh/id_rsa ec2-user@13.125.175.126

# ── 서비스 재시작 ──
sudo systemctl restart dn-platform     # 백엔드 재시작
sudo systemctl restart nginx           # Nginx 재시작

# ── 상태 확인 ──
sudo systemctl status dn-platform nginx  # 두 서비스 상태
tail -30 ~/err.out                       # 최근 에러 로그
tail -f ~/healthcheck.log               # 헬스체크 실시간

# ── 리소스 확인 ──
df -h                                    # 디스크
free -h                                  # 메모리
top -bn1 | head -5                       # CPU

# ── DB 확인 ──
mysql -h dn-platform-db.c98wmqqswrwy.ap-northeast-2.rds.amazonaws.com \
      -u dnadmin -p dn_platform \
      -e "SELECT COUNT(*) as total FROM animals;"

# ── 로그 정리 (디스크 부족 시) ──
> ~/log.out                              # 로그 파일 비우기
> ~/err.out
sudo systemctl restart dn-platform      # 재시작
```

---

## 파트 E~G 전체 요약

| 파트 | 주제 | 한 줄 요약 |
|------|------|-----------|
| **E** | Terraform 인프라 생성 | `terraform apply` 한 번에 EC2 + RDS + SG + EIP 생성 |
| **F** | CI/CD와 환경변수 | `git push`하면 GitHub Actions가 빌드 → EC2 배포까지 자동 |
| **G** | 안정화와 트러블슈팅 | EIP 고정, 헬스체크 자동화, 시간대/CORS/과금 함정 대응 |

```
인프라(E) → CI/CD(F) → 안정화(G)

"서버를 만들고 → 코드를 배포하고 → 안 죽게 관리한다"
```
