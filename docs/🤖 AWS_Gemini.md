---
type: "LLM,SN"
title: "_Gemini"
created: 2026-01-12
---
> [!summary]+ 3줄 요약
> - **단계별 배포 아키텍처 진화 분석**: 수동(V1)에서 스크립트 자동화(V2), PaaS(EB) 도입(V3), RDS 연동(V4), 최종적으로 CI/CD 파이프라인(V5)까지 AWS 기반 배포 방식의 점진적 발전을 심층 분석했습니다.
> - **핵심 기술 및 문제 해결**: EC2, RDS, Elastic Beanstalk, GitHub Actions 등 AWS 서비스와 `nohup`, `cron`, `Security Group Chaining`, `Procfile` 같은 핵심 기술을 활용해 각 배포 단계의 문제점과 해결책을 제시했습니다.
> - **실무 Best Practice 및 보안**: 코드와 이론을 연결하여 `kill -9` 대신 `kill -15` 사용, 환경 변수 분리, 최소 권한 원칙 준수 등 실무에 적용할 수 있는 모범 사례와 보안 고려 사항을 강조했습니다.

---

## 1. 전체 아키텍처 및 학습 로드맵 (Structure & Roadmap)

이 책은 **"배포의 버전(Version)"**을 올리며 불편함을 해소해 나가는 방식으로 구성되어 있습니다. 각 단계는 이전 단계의 한계를 기술적으로 해결하며 진화합니다.

| 단계 | 챕터 | 주요 기술 및 아키텍처 | 핵심 목표 |
| --- | --- | --- | --- |
| **V1** | Ch 01 ~ 03 | **EC2 + Shell Script + Nohup** | 리눅스 환경 이해, 수동 배포 프로세스 정립, 백그라운드 실행 관리 |
| **V2** | Ch 04 | **EC2 + Script Automation + Cron** | 배포 스크립트 고도화, 환경변수 관리, 재부팅 시 자동 실행(Crontab) |
| **V3** | Ch 05 | **Elastic Beanstalk (EB)** | 인프라 구성 자동화(PaaS), 로드밸런서 및 오토스케일링 기초 |
| **V4** | Ch 06 | **EB + RDS (MariaDB)** | 데이터베이스 분리, 보안 그룹(Security Group) 및 인바운드 규칙 관리 |
| **V5** | Ch 07 | **GitHub Actions + EB + RDS** | **CI/CD 완전 자동화**. 코드 푸시 시 자동 테스트, 빌드, 배포 파이프라인 구축 |

---

## 2. 기술적 핵심 개념 및 환경 (Tech Stack & Environment)

본격적인 코드 분석에 앞서, 이 책에서 정의하는 표준 환경을 명시합니다.

- **Language & Framework**: Java 21 (LTS), Spring Boot
- **Infrastructure**: AWS EC2 (Ubuntu 24.04 LTS), AWS RDS (MariaDB), AWS Elastic Beanstalk
- **CI/CD Tool**: GitHub Actions
- **Key Utilities**: `nohup`, `cron`, `vim`, `chmod`, `pgrep`

---
# AWS EC2 기본 배포 (V1)
---

## 3. Chapter 03: AWS EC2 기본 배포 (V1) - 핵심 분석

> **챕터 개요**: 이 챕터는 CI/CD의 전 단계로, **"서버에 접속하지 않아도 애플리케이션이 계속 실행되게 하는 법(Daemon 화)"**과 **"표준 입출력 관리"**를 다룹니다.

## 3.1 기술적 문제(Problem)와 솔루션(Solution)

- **Problem (문제)**:
	1. SSH 터미널 세션을 종료하면 실행 중인 Java 애플리케이션도 함께 종료됨 (Foreground Process).
	2. `System.out.println` 으로 출력되는 로그가 휘발되거나 관리가 어려움.
	3. 배포할 때마다 기존 프로세스를 찾아서(`ps -ef`) 수동으로 종료(`kill`)하고 다시 실행해야 하는 번거로움.
- **Solution (해결)**:
	1. **Nohup**: 리눅스 표준 입출력을 터미널에서 분리하여 세션 종료 후에도 프로세스를 유지.
	2. **Redirection (>)**: 표준 출력(1)과 에러 출력(2)을 파일로 분리하여 영구 저장.
	3. **Shell Script**: PID 검색 및 종료 과정을 스크립트로 추상화하여 휴먼 에러 방지.

## 3.2 소스 코드의 온전한 보존 및 시각화

### [Code 1] 프로세스 안전 종료 스크립트 (spring-stop.sh)

이 스크립트는 실행 중인 특정 JAR 애플리케이션의 PID를 찾아 안전하게 종료하는 역할을 합니다.

```Bash
#!/bin/bash
# -----------------------------------------------------------
# 파일명: spring-stop.sh
# 역할: 실행 중인 Spring Boot 애플리케이션의 PID를 찾아 종료
# -----------------------------------------------------------

echo "Springboot Stop......."

# 1. pgrep 명령어를 사용하여 실행 중인 jar 프로세스의 PID를 찾습니다.
# -f 옵션: 프로세스 이름(커맨드 라인 전체) 매칭을 통해 정확한 프로세스를 찾음
# v1-0.0.1-SNAPSHOT.jar: 찾고자 하는 구체적인 JAR 파일명
Spring_PID=$(pgrep -f v1-0.0.1-SNAPSHOT.jar)

# 2. 찾은 PID를 화면에 출력하여 확인합니다.
echo "Found PID: $Spring_PID"

# 3. PID가 존재하는지 확인 후 종료 명령을 수행합니다.
# (책의 예제는 단순화를 위해 바로 kill을 수행하지만, 실무에선 if문 체크 권장)
if [ -n "$Spring_PID" ]; then
    # kill -9: 강제 종료 시그널 (SIGKILL). 
    # 데이터 무결성이 중요하다면 -15 (SIGTERM)을 먼저 시도하는 것이 Best Practice.
    kill -9 $Spring_PID
    echo "Process Killed."
else
    echo "No process found."
fi
```

### [Code 2] 무중단/백그라운드 실행 및 로그 분리 명령어

스크립트 파일은 아니지만, 이 책에서 가장 강조하는 **배포 실행 명령어의 원형** 입니다.

```Bash
# -----------------------------------------------------------
# 명령어 설명: 
# 1. nohup: 터미널 세션이 끊겨도 프로세스가 종료되지 않도록 함 (Hang Up 시그널 무시)
# 2. java -jar ...: JAR 파일 실행
# 3. 1>log.out: 표준 출력(Standard Output, FD 1)을 log.out 파일에 저장
# 4. 2>err.out: 표준 에러(Standard Error, FD 2)를 err.out 파일에 저장
# 5. &: 프로세스를 백그라운드(Background) 모드로 실행
# -----------------------------------------------------------

nohup java -jar v1-0.0.1-SNAPSHOT.jar 1>log.out 2>err.out &
```

## 3.3 코드와 이론의 논리적 연결 (Code-Context Mapping)

1. **PID 탐색 (`pgrep -f ...`)**:
	- 기존에는 `ps -ef | grep java | grep -v grep | awk '{print $2}'` 와 같이 복잡한 파이프라인을 사용했으나, 저자는 `pgrep` 을 통해 이를 단순화했습니다. 이는 스크립트의 가독성을 높이고 유지보수를 용이하게 합니다.
2. **로그 리다이렉션 (`1>log.out 2>err.out`)**:
	- Java 애플리케이션에서 발생하는 정상 로그(`INFO`)와 에러 로그(`ERROR`, `WARN` 등 StackTrace)를 물리적으로 다른 파일에 저장합니다.
	- **이유**: 서버 장애 발생 시 `err.out` 파일만 빠르게 확인하여 디버깅 시간을 단축하기 위함입니다.
3. **권한 부여 (`chmod +x`)**:
	- 작성한 `.sh` 파일은 기본적으로 실행 권한이 없습니다. `chmod +x spring-stop.sh` 명령어를 통해 실행 권한(Executable)을 부여해야 스크립트로 동작합니다.

## 3.4 심화 분석 및 Best Practice 도출

- **Anti-pattern (주의사항)**:
	- 책에서는 편의상 `kill -9` (SIGKILL)을 사용했습니다. 이는 프로세스를 즉시 사살하므로, 데이터베이스 트랜잭션이 열려 있거나 파일 쓰기 작업 중일 경우 **데이터 손실** 이 발생할 수 있습니다.
	- **Best Practice**: 실무에서는 `kill -15` (SIGTERM)을 먼저 전송하여 애플리케이션이 리소스를 정리할 시간(Graceful Shutdown)을 주고, 일정 시간 후에도 종료되지 않을 때 `-9` 를 사용하는 방식을 권장합니다.
- **Hardcoding Issue**:
	- 스크립트 내에 `v1-0.0.1-SNAPSHOT.jar` 라는 파일명이 하드코딩되어 있습니다. 버전이 `0.0.2` 로 올라가면 스크립트도 수정해야 합니다. 이는 다음 챕터(V2)에서 **환경 변수** 를 통해 해결해야 할 과제입니다.

---
# V2: Script Automation
---

## 1. 전체 아키텍처 및 학습 로드맵 (V2: Script Automation)

V2 단계의 핵심은 **"사람의 손을 떠난 배포"**입니다. 개발자는 로컬에서 코드를 푸시하고, 운영 서버에서 스크립트만 실행하면 나머지 과정(종료-빌드-배포-재시작등록)이 자동으로 수행됩니다.

- **Infrastructure**: AWS EC2 (Ubuntu 24.04) + **Elastic IP (고정 IP)**
- **Automation**: Shell Script (`deploy.sh`, `check-and-restart.sh`)
- **Scheduling**: Linux `crontab` (1분마다 서버 상태 체크)
- **Config Management**: 환경 변수 파일 분리 (`var.sh`)

---

## 2. 기술적 핵심 개념 및 해결 과제 (Problem & Solution)

### 2.1 Problem (기술적 문제)

1. **반복적인 노동**: 배포 시마다 4~5개의 명령어를 실수 없이 입력해야 함.
2. **가용성 이슈**: 새벽에 서버가 예기치 않게 종료되면, 관리자가 깨어나서 수동으로 켤 때까지 서비스가 중단됨 (Downtime 발생).
3. **환경 의존성**: 스크립트 내부에 파일 경로, 버전 등이 하드코딩되어 유지보수가 어려움.

### 2.2 Solution (핵심 솔루션)

1. **Deploy Script**: 배포의 전 과정을 하나의 `.sh` 파일로 추상화.
2. **Crontab Monitoring**: 리눅스 스케줄러가 1분마다 프로세스를 감시하다가 죽어있으면 자동으로 살려냄.
3. **Variable Externalization**: `var.sh` 파일에 공통 변수를 분리하여 `source` 명령어로 주입, 스크립트 재사용성 증대.

---

## 3. 소스 코드의 온전한 보존 및 시각화 (Automation Scripts)

이 챕터의 핵심인 3가지 스크립트(환경변수, 배포, 모니터링)를 상세 분석합니다.

### [Code 1] 공통 환경 변수 파일 (var.sh)

모든 스크립트에서 공통으로 사용할 상수를 정의합니다. 버전이 바뀌면 이 파일만 수정하면 됩니다.

```Bash
#!/bin/bash
# -----------------------------------------------------------
# 파일명: var.sh
# 역할: 프로젝트 전반에 사용되는 환경 변수 정의 (설정 파일 역할)
# -----------------------------------------------------------

# GitHub 사용자 ID (본인의 ID로 수정 필요)
GITHUB_ID="metacoding-books"

# 프로젝트 명 (GitHub 리포지토리 이름과 동일해야 함)
PROJECT_NAME="aws-v2"

# 프로젝트 버전 (빌드된 jar 파일명에 사용)
PROJECT_VERSION="0.0.1"

# 실행 중인 애플리케이션의 PID를 찾기 위한 명령어 변수
# pgrep -f: 프로세스 전체 커맨드 라인에서 패턴 매칭
PROJECT_PID=$(pgrep -f ${PROJECT_NAME}-${PROJECT_VERSION}.jar)

# 실행될 JAR 파일의 절대 경로
JAR_PATH="${HOME}/${PROJECT_NAME}/build/libs/${PROJECT_NAME}-${PROJECT_VERSION}.jar"

# export를 통해 다른 스크립트에서 이 변수들을 사용할 수 있도록 함
export GITHUB_ID
export PROJECT_NAME
export PROJECT_VERSION
export PROJECT_PID
export JAR_PATH
```

[Code 2] 배포 자동화 스크립트 (`deploy.sh`)

이 스크립트 하나로 **기존 서버 종료 -> 코드 다운로드 -> 빌드 -> 실행 -> 크론 등록** 까지 한 번에 처리합니다.

```Bash
#!/bin/bash
# -----------------------------------------------------------
# 파일명: deploy.sh
# 역할: 기존 서버 종료, 코드 갱신, 빌드, 재배포 실행
# -----------------------------------------------------------

# 1. 환경 변수 로드 (var.sh 파일을 읽어와 변수 적용)
source ./var.sh
echo "1. env variable setting complete"

# 2. 기존 Cron 작업 삭제
# (배포 중에 Cron이 돌아서 서버를 중복 실행하는 것을 방지)
touch crontab_delete
crontab crontab_delete
rm crontab_delete
echo "2. cron delete complete"

# 3. 실행 중인 서버 종료
if [ -n "${PROJECT_PID}" ]; then
    # PID가 존재하면(-n), 해당 프로세스를 강제 종료(kill -9)
    kill -9 $PROJECT_PID
    echo "3. project kill complete"
else
    # 실행 중인 프로세스가 없다면 넘어감 (최초 배포 시 등)
    echo "3. no project to kill"
fi

# 4. 기존 프로젝트 폴더 삭제 (Clean Deploy)
# 홈 디렉토리 하위의 프로젝트 폴더를 통째로 날리고 새로 받음
rm -rf ${HOME}/${PROJECT_NAME}
echo "4. project folder delete complete"

# 5. Git Clone (최신 코드 다운로드)
git clone https://github.com/${GITHUB_ID}/${PROJECT_NAME}.git
# 다운로드 완료까지 잠시 대기 (네트워크 지연 대비)
sleep 3s
echo "5. git clone complete"

# 6. Gradlew 실행 권한 부여
chmod u+x ${HOME}/${PROJECT_NAME}/gradlew
echo "6. gradlew u+x complete"

# 7. 프로젝트 빌드
cd ${HOME}/${PROJECT_NAME}
# 테스트는 제외(-x test)하고 빌드하여 속도 향상 (실무에선 테스트 권장)
./gradlew build -x test
echo "7. gradlew build complete"

# 8. JAR 파일 실행 (백그라운드)
# nohup: 세션 종료 후 유지
# 1>... 2>...: 표준 출력과 에러를 각각 파일로 분리 저장
nohup java -jar -Dspring.profiles.active=prod ${JAR_PATH} 1>${HOME}/log.out 2>${HOME}/err.out &
echo "8. start server complete"

# 9. Cron 재등록 (자동 재시작 활성화)
# crontab_new 파일을 만들어 cron 설정 내용을 쓴 뒤 등록
touch crontab_new
# * * * * *: 1분마다 실행
# check-and-restart.sh 스크립트를 실행하고 로그는 버림(1>/dev/null)
echo "* * * * * ${HOME}/check-and-restart.sh 1>>${HOME}/cron.log 2>&1" >> crontab_new
crontab crontab_new
rm crontab_new
echo "9. cron registration complete"
```

[Code 3] 자가 치유 스크립트 (`check-and-restart.sh`)

`crontab` 에 의해 1분마다 실행되며, 서버가 죽어있을 경우에만 다시 살립니다.

```Bash
#!/bin/bash
# -----------------------------------------------------------
# 파일명: check-and-restart.sh
# 역할: 프로세스 생존 여부 확인 및 자동 재시작
# -----------------------------------------------------------

source /home/ubuntu/var.sh

# PROJECT_PID 변수를 다시 구함 (var.sh 로딩 시점의 PID가 아닌 현재 시점 PID 필요)
# 주의: var.sh의 PROJECT_PID는 스크립트 실행 시점에 고정되므로, 
# 여기서 다시 pgrep을 수행하는 로직이 필요할 수 있음.
# 책의 예제 로직에 따르면:

if [ -z "$PROJECT_PID" ]; then
    # -z: 문자열 길이가 0이면 참 (즉, PID가 없으면 = 서버가 꺼져있으면)
    echo "Server is down. Restarting..." $(date)
    
    # 서버 재시작 명령어 (deploy.sh의 실행부와 동일)
    nohup java -jar -Dspring.profiles.active=prod ${JAR_PATH} 1>${HOME}/log.out 2>${HOME}/err.out &
else
    # 프로세스가 살아있으면 아무것도 하지 않음
    echo "Server is running..." $(date)
fi
```

---

## 4. 코드와 이론의 논리적 연결 (Code-Context Mapping)

1. **`source ./var.sh`**:
	- **의도**: Java의 `import` 와 유사합니다. 외부 파일의 변수를 현재 스크립트 컨텍스트로 불러옵니다. 이를 통해 `GITHUB_ID` 등의 변경이 필요할 때 `deploy.sh`, `check-and-restart.sh` 를 모두 수정할 필요 없이 `var.sh` 하나만 수정하면 됩니다.
2. **`crontab` 초기화 및 재등록**:
	- **의도**: `deploy.sh` 가 실행되는 동안(빌드 중일 때) `check-and-restart.sh` 가 1분마다 돌면서 "어? 서버 꺼졌네?" 하고 **중복 실행** 을 시도하는 것을 막기 위해, 배포 시작 시 cron을 끄고 배포 완료 후 다시 켭니다.
3. **`kill -9` vs `kill -15`**:
	- 책에서는 확실한 종료를 위해 `kill -9` (SIGKILL)를 사용했습니다. 하지만 데이터 무결성을 위해선 `kill -15` (SIGTERM)으로 정상 종료를 유도하고, 안 될 경우 `-9` 를 쓰는 것이 정석입니다.
4. **`sleep 3s`**:
	- **의도**: `git clone` 직후 파일 시스템 I/O가 완전히 끝나거나 네트워크 연결이 정리될 시간을 벌어주는 방어적 코드입니다.

---

## 5. 심화 분석 및 Best Practice 도출

- **Anti-pattern: 하드코딩 경로**
	- V1에서는 `/home/ubuntu/...` 경로를 직접 썼지만, V2에서는 `${HOME}` 환경변수를 사용하여 이식성을 높였습니다. 이는 사용자 계정명이 `ubuntu` 가 아닌 다른 것으로 바뀌어도 스크립트가 동작하게 하는 Best Practice입니다.
- **Cron 로깅**:
	- Cron은 기본적으로 출력을 버리거나 메일로 보냅니다. `1>>cron.log 2>&1` 처럼 리다이렉션을 걸어두어야 나중에 크론이 돌았는지, 에러가 났는지 추적할 수 있습니다.
- **Idempotency (멱등성)**:
	- `check-and-restart.sh` 는 여러 번 실행되어도 결과가 같아야 합니다. 이미 프로세스가 떠 있다면 실행하지 않고(`if [ -z ... ]`), 없을 때만 실행하는 로직이 멱등성을 보장합니다.

---
# V3: Elastic Beanstalk
---

## 1. 전체 아키텍처 및 학습 로드맵 (V3: Elastic Beanstalk)

이 챕터의 핵심은 **"인프라 관리의 추상화"**입니다. 개발자는 더 이상 OS 업데이트, JDK 설치, 로드밸런서 설정에 시간을 쏟지 않고, 오직 **애플리케이션 코드(JAR)**만 업로드하면 됩니다.

- **Infrastructure**: AWS Elastic Beanstalk (PaaS)
- **Architecture**:
	- **Load Balancer**: 트래픽 분산 (자동 생성)
	- **Auto Scaling**: 트래픽 증가 시 서버 자동 증설 (자동 설정)
	- **Reverse Proxy (Nginx)**: 80번 포트 요청을 받아 내부 5000번 포트로 전달
	- **Application Server**: Spring Boot (Port 5000)

---

## 2. 기술적 핵심 개념 및 해결 과제 (Problem & Solution)

### 2.1 Problem (기술적 문제)

1. **복잡한 초기 세팅**: EC2 생성, 고정 IP 할당, JDK 설치, 환경변수 설정 등 반복 작업이 과다함.
2. **확장성(Scalability) 부재**: 사용자가 몰릴 때 서버를 늘리는(Scale-out) 작업이나, 서버가 죽었을 때 살리는 작업을 수동으로 해야 함.
3. **보안/네트워크 설정**: 로드밸런서와 보안 그룹(Firewall) 연결이 까다로움.

### 2.2 Solution (핵심 솔루션)

1. **Elastic Beanstalk (EB)**: "JAR 파일만 주세요, 나머지는 제가 다 합니다."라는 컨셉의 완전 관리형 서비스.
2. **Nginx Reverse Proxy**: EB 내부적으로 **Nginx** 를 웹 서버로 앞단에 배치하여, 정적 리소스 처리 및 요청 포워딩(80 -> 5000)을 담당.
3. **Port 5000 Convention**: EB 환경에서 Spring Boot는 기본적으로 **5000번 포트** 를 사용하도록 약속(Convention)되어 있습니다.

---

## 3. 소스 코드의 온전한 보존 및 시각화 (Internal Verification)

이 챕터는 코드를 작성하는 것보다, **EB가 내부적으로 어떻게 동작하는지** 검증하는 것이 핵심입니다. 책에서는 SSH로 EB 인스턴스에 접속하여 다음 내용들을 확인합니다.

### [Code 1] 프로세스 실행 확인 (ps -ef)

EB는 사용자가 업로드한 JAR 파일(`aws-v3-0.0.1.jar`)을 자동으로 `application.jar` 라는 이름으로 변경하여 실행합니다.

```Bash
# EB 인스턴스 내부 접속 후 실행 (SSH)
ps -ef | grep java

# [출력 결과 예시]
# root  3510  ... java -jar application.jar
```

- **분석**: 사용자가 `aws-v3` 로 올리든 `my-app` 으로 올리든, EB는 내부 스크립트를 통해 실행 파일명을 `application.jar` 로 통일하여 관리합니다.

### [Code 2] 포트 바인딩 확인 (netstat -nlpt)

외부 요청 흐름: **Client -> Nginx(80) -> Spring Boot(5000)**

```Bash
# 네트워크 상태 확인 명령어
netstat -nlpt

# [출력 결과 해석]
# tcp  0  0  0.0.0.0:80    0.0.0.0:* LISTEN   (nginx)
# tcp  0  0  :::5000       :::* LISTEN   (java)
```

- **Nginx (80)**: 외부 인터넷 망에 열려있으며 클라이언트의 요청을 가장 먼저 받습니다.
- **Java (5000)**: 외부에는 닫혀있고, 오직 로컬(Nginx)에서의 접근만 허용됩니다.

### [Code 3] Nginx 리버스 프록시 설정 (nginx.conf)

EB가 자동으로 생성해준 Nginx 설정 파일을 확인하여 포워딩 로직을 이해합니다.

---

## 4. 코드와 이론의 논리적 연결 (Code-Context Mapping)

1. **왜 5000번 포트인가?**:
	- Spring Boot의 기본 포트는 8080이지만, EB의 Java 플랫폼 기본 설정은 5000번 포트를 리스닝하도록 되어 있습니다.
	- 만약 8080을 쓰고 싶다면 EB 환경 변수(Environment Properties)에서 `SERVER_PORT=5000` 설정을 변경하거나, Nginx 설정을 커스텀해야 합니다. 책에서는 **EB의 표준(5000)**을 따르는 방식을 권장합니다.
2. **IAM Role (역할)**:
	- EB를 생성하기 위해서는 `aws-elasticbeanstalk-ec2-role` (EC2가 다른 AWS 서비스에 접근할 권한)과 `aws-elasticbeanstalk-service-role` (EB 서비스 자체가 AWS 리소스를 관리할 권한) 두 가지가 필수적으로 필요합니다. 책에서는 이를 생성하는 과정을 먼저 수행합니다.

---

## 5. 심화 분석 및 Best Practice 도출

- **Anti-pattern (주의사항)**:
	- **하드코딩된 포트**: `application.yml` 에 `server.port: 8080` 을 강제로 박아두면 EB 배포 시 **502 Bad Gateway** 에러가 발생합니다. Nginx는 5000번으로 보내는데 앱은 8080에서 기다리기 때문입니다.
	- **Solution**: `application.yml` 에서 포트를 명시하지 않거나(기본값 사용), EB 환경 변수 설정을 통해 제어해야 합니다.
- **Health Check**:
	- EB는 `/` 경로로 지속적인 헬스 체크를 보냅니다. 해당 경로가 200 OK를 반환하지 않으면 인스턴스를 비정상으로 간주하고 종료 후 재생성(Self-healing)을 무한 반복할 수 있으므로 주의해야 합니다.

---
# V4: EB + RDS
---

## 1. 전체 아키텍처 및 학습 로드맵 (V4: EB + RDS)

V4 단계의 핵심은 **"상태(State)의 분리"**입니다. 애플리케이션 서버(Stateless)와 데이터베이스(Stateful)를 물리적으로 분리하여 확장성과 안정성을 확보합니다.

| 구성 요소 | 역할 | 주요 설정 |
| --- | --- | --- |
| **Client** | 요청 발생 | 브라우저 / Postman |
| **Elastic Beanstalk** | WAS (Spring Boot) | 환경 변수를 통해 DB 접속 정보 주입 |
| **Security Group** | 가상 방화벽 | **SG Chaining** (가장 중요) |
| **RDS (MariaDB)** | 데이터 저장소 | 3306 포트 리스닝, 자동 백업 및 패치 관리 |

---

## 2. 기술적 핵심 개념 및 해결 과제 (Problem & Solution)

### 2.1 Problem (기술적 문제)

1. **데이터 소실 위험**: EC2(EB 인스턴스)는 언제든지 종료되거나 교체될 수 있는 '임시 자원'입니다. 로컬 DB를 사용하면 인스턴스 종료 시 데이터도 함께 사라집니다.
2. **보안 취약점**: 데이터베이스 포트(3306)를 `0.0.0.0/0` (전체 허용)으로 열어두면 해킹의 표적이 됩니다.
3. **하드코딩된 설정**: 소스 코드(`application.yml`)에 DB 비밀번호를 적어서 깃허브에 올리는 것은 보안상 최악의 패턴입니다.

### 2.2 Solution (핵심 솔루션)

1. **AWS RDS**: 관리형 DB 서비스를 사용하여 백업, 복구, 이중화를 위임합니다.
2. **Security Group Chaining**: IP 주소 기반이 아니라, **"특정 보안 그룹(ID)을 가진 녀석만 들어오라"**는 논리적 규칙을 사용하여 EC2와 RDS를 연결합니다.
3. **Environment Properties**: DB 접속 정보를 코드에서 지우고, EB의 **환경 속성(Environment Properties)**에 Key-Value로 등록하여 런타임에 주입합니다.

---

## 3. 소스 코드 및 설정의 온전한 보존 (Configuration & Code)

이 챕터는 Java 코드보다 **인프라 설정(Configuration)**이 코드의 역할을 대신합니다.

### [Config 1] Spring Boot 설정 (application.yml)

소스 코드 내에는 실제 접속 정보가 없어야 합니다. `${변수명}` 문법을 사용하여 환경 변수로부터 값을 주입받도록 작성합니다.

```YAML
spring:
  profiles: 
    active: prod # 배포 환경(production) 활성화

  datasource:
    # 환경 변수(Environment Variable)를 바인딩하여 사용
    # RDS 엔드포인트와 포트, DB명을 동적으로 할당받음
    url: jdbc:mariadb://${rds.hostname}:${rds.port}/${rds.db.name}
    driver-class-name: org.mariadb.jdbc.Driver
    username: ${rds.username}
    password: ${rds.password}

  jpa:
    hibernate:
      ddl-auto: update # 실무에서는 validate나 none을 권장하나, 학습용이므로 update 사용
    show-sql: true
```

### [Config 2] 보안 그룹(Security Group) 인바운드 규칙 정의

AWS 콘솔에서 설정하는 내용이지만, 이를 '코드'처럼 명확한 규칙으로 정리합니다. **RDS 보안 그룹(`rds_group`)**의 인바운드 규칙입니다.

| 유형 | 프로토콜 | 포트 범위 | 소스 (Source) | 설명 |
| --- | --- | --- | --- | --- |
| **MySQL/Aurora** | TCP | **3306** | **My IP** | 개발자 로컬 PC(HeidiSQL 등)에서 접근 허용 |
| **MySQL/Aurora** | TCP | **3306** | **sg-xxxxx (EB_SG)** | **[핵심]** EB 인스턴스가 속한 보안 그룹 ID를 지정 |

### [Code 3] 테이블 생성 SQL (테스트용)

RDS에 접속 후 다음 쿼리를 실행하여 테이블을 생성합니다.

```SQL
-- 데이터베이스 생성
CREATE DATABASE metadb;

-- 데이터베이스 선택
USE metadb;

-- 도서 정보 테이블 생성
CREATE TABLE book_tb (
    id INTEGER AUTO_INCREMENT PRIMARY KEY, -- PK, 자동 증가
    title VARCHAR(255),                    -- 책 제목
    content VARCHAR(255),                  -- 책 내용
    author VARCHAR(255)                    -- 저자
) DEFAULT CHARSET=utf8mb4;                 -- 한글 지원을 위해 utf8mb4 권장
```

---

## 4. 코드와 이론의 논리적 연결 (Code-Context Mapping)

1. **`${rds.hostname}` 의 매핑 원리**:
	- Spring Boot는 OS 환경 변수나 시스템 프로퍼티에서 `.`(점)을 `_` (언더스코어)로 치환하거나, 대소문자를 구분하지 않고 매핑해주는 **Relaxed Binding** 을 지원합니다.
	- **EB 환경 속성 설정**:
		- `RDS_HOSTNAME`: `aws-v4-mariadb.xxxx.ap-northeast-2.rds.amazonaws.com` (엔드포인트)
		- `RDS_PORT`: `3306`
		- `RDS_USERNAME`: `metacoding`
		- `RDS_PASSWORD`: `metacoding1234`
		- `RDS_DB_NAME`: `metadb`
	- 이렇게 EB 콘솔에서 설정한 `RDS_HOSTNAME` 값이 Spring의 `${rds.hostname}` 자리로 주입됩니다.
2. **보안 그룹 체이닝(Chaining)의 의미**:
	- EC2 인스턴스의 IP는 오토스케일링이나 재배포 시 변경될 수 있습니다. 따라서 "IP 123.123.123.123 허용" 같은 규칙은 금방 깨집니다.
	- **해결**: "IP는 모르겠고, **`eb-ec2-sg` 라는 명찰(보안 그룹)을 찬 인스턴스** 라면 무조건 3306 포트를 열어줘"라는 방식이 체이닝입니다. 이는 클라우드 네트워킹의 핵심 패턴입니다.

---

## 5. 심화 분석 및 Best Practice 도출

- **Security Best Practice (보안)**:
	- **Anti-pattern**: RDS를 `Public Access: Yes` 로 설정하고 `0.0.0.0/0` 을 여는 것.
	- **Book's Approach**: 책에서는 실습 편의를 위해 `Public Access: Yes` 로 두지만, **보안 그룹** 을 통해 "내 IP"와 "EB 보안 그룹"만 허용함으로써 최소한의 보안을 챙겼습니다.
	- **Real World**: 실무에서는 RDS를 **Private Subnet** 에 배치하여 외부 인터넷에서의 접근을 원천 차단하고, 배스천 호스트(Bastion Host)나 VPN을 통해서만 접근하도록 구성해야 합니다.
- **VPC (Virtual Private Cloud) 이해**:
	- VPC는 논리적으로 격리된 가상 네트워크입니다. V4 아키텍처에서 EB(EC2)와 RDS는 **동일한 VPC** 내에 있어야 사설 네트워크 통신이 원활합니다. (기본 VPC 사용)


---
# V5: CI/CD Pipeline
---

## 1. 전체 아키텍처 및 학습 로드맵 (V5: CI/CD Pipeline)

V5 단계는 **"Zero-Touch Deployment"**를 지향합니다. 인프라(EB, RDS)는 이미 구축되어 있고, 이를 연결하는 파이프라인만 설치하면 됩니다.

| 단계 | 구성 요소 | 역할 | 핵심 기술 |
| --- | --- | --- | --- |
| **CI** | **GitHub Actions** | 코드 통합, 테스트, 빌드 | `deploy.yml`, `Gradle` |
| **CD** | **Elastic Beanstalk** | 빌드된 산출물(Zip) 배포 | `Procfile`, `Beanstalk Deploy Action` |
| **DB** | **AWS RDS** | 데이터 영속성 관리 | MariaDB, Security Group |

---

## 2. 기술적 핵심 개념 및 해결 과제 (Problem & Solution)

### 2.1 Problem (기술적 문제)

1. **휴먼 에러**: 배포 과정에서 스크립트를 잘못 실행하거나, 설정을 빼먹는 실수 발생.
2. **배포 병목**: 배포 담당자가 자리에 없으면 서비스 업데이트가 불가능함.
3. **반복 작업**: 코드 한 줄 수정할 때마다 '빌드 -> 압축 -> 업로드 -> 배포' 과정을 반복해야 함.

### 2.2 Solution (핵심 솔루션)

1. **GitHub Actions**: GitHub 저장소에 내장된 CI/CD 도구로, 별도의 서버(Jenkins 등) 구축 없이 `.yml` 설정만으로 파이프라인을 구축합니다.
2. **IAM User for CI**: 개발자 개인의 키가 아니라, 배포만을 담당하는 **봇(Bot)용 IAM 사용자** 를 생성하여 최소한의 권한만 부여합니다.
3. **Deploy Package (Zip)**: 단순 JAR 배포를 넘어, `Procfile` 과 설정 파일(`.ebextensions`)을 함께 묶어 배포하여 EB 설정을 코드 레벨에서 제어합니다.

---

## 3. 소스 코드의 온전한 보존 및 시각화 (CI/CD Implementation)

CI/CD의 핵심은 `.github/workflows/deploy.yml` 파일입니다. 책의 실습 환경(Java 21, Gradle)에 맞춰 구성된 코드를 제시합니다.

### [Code 1] 배포 파이프라인 정의 (.github/workflows/deploy.yml)

이 코드는 `main` 브랜치에 푸시가 발생하면 자동으로 실행됩니다.

```YAML
name: aws-v5-deploy # 워크플로우 이름

on:
  push:
    branches:
      - main # main 브랜치에 push 될 때만 트리거

jobs:
  build:
    runs-on: ubuntu-latest # GitHub가 제공하는 최신 우분투 러너 사용

    steps:
      # 1. 저장소 코드 체크아웃 (내려받기)
      - name: Checkout
        uses: actions/checkout@v4

      # 2. JDK 21 설치 (책의 표준 환경)
      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'

      # 3. Gradle 실행 권한 부여
      - name: Grant execute permission for gradlew
        run: chmod +x gradlew

      # 4. Gradle 빌드 (테스트 제외: -x test, 실무에선 포함 권장)
      - name: Build with Gradle
        run: ./gradlew clean build -x test

      # 5. 현재 시간 가져오기 (배포 버전 라벨링 용도)
      - name: Get current time
        uses: 1466587594/get-current-time@v2
        id: current-time
        with:
          format: YYYY-MM-DDTHH-mm-ss
          utcOffset: "+09:00" # 한국 시간 기준

      # 6. 배포 패키지 생성 (Jar + Procfile -> Zip)
      # Elastic Beanstalk은 Zip 파일 배포 시 Procfile을 통해 실행 명령을 제어함
      - name: Generate deployment package
        run: |
          mkdir -p deploy
          cp build/libs/*.jar deploy/application.jar
          cp Procfile deploy/Procfile
          cd deploy && zip -r deploy.zip .

      # 7. Elastic Beanstalk으로 배포 (오픈소스 액션 사용)
      - name: Deploy to EB
        uses: einaregilsson/beanstalk-deploy@v21
        with:
          aws_access_key: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws_secret_key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          application_name: aws-v5         # EB 애플리케이션 이름
          environment_name: Aws-v5-env     # EB 환경 이름
          version_label: github-action-${{steps.current-time.outputs.formattedTime}}
          region: ap-northeast-2           # 서울 리전
          deployment_package: deploy/deploy.zip
```

### [Code 2] 실행 프로세스 정의 (Procfile)

Elastic Beanstalk에게 "Zip 파일을 받으면 이렇게 실행해"라고 알려주는 설정 파일입니다. 프로젝트 루트(root)에 생성합니다.

```Plaintext
# 파일명: Procfile (확장자 없음)
# 5000번 포트 설정은 EB 환경 변수(SERVER_PORT=5000)에서 처리하거나
# application.yml에서 server.port: 5000 설정 필요

web: java -jar application.jar -Dspring.profiles.active=prod
```

---

## 4. 코드와 이론의 논리적 연결 (Code-Context Mapping)

1. **IAM User (`aws-v5-ci-user`)**:
	- `deploy.yml` 의 7번 단계에서 사용하는 `secrets.AWS_...` 키는 루트 계정의 키가 아닙니다.
	- **CI/CD 전용 IAM 사용자** 를 생성하고, `AdministratorAccess-AWSElasticBeanstalk` (EB 관리자 권한) 정책을 연결하여 발급받은 액세스 키를 사용해야 합니다.
2. **Github Secrets**:
	- 소스 코드에 액세스 키를 노출하는 것은 **보안 사고의 지름길** 입니다.
	- GitHub Repository Settings -> Security -> Secrets and variables -> Actions에 `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` 를 등록하여 안전하게 주입합니다.
3. **Procfile의 역할**:
	- 단순 Jar 배포 시에는 EB가 알아서 `java -jar` 를 실행해주지만, **옵션(Profiles 등)**을 주거나 **Nginx 설정** 등을 커스텀하려면 Zip 배포와 `Procfile` 이 필수입니다.

---

## 5. 심화 분석 및 Best Practice 도출

- **Security Best Practice (최소 권한 원칙)**:
	- 책에서는 편의상 `AdministratorAccess-AWSElasticBeanstalk` 을 부여하지만, 실무에서는 **S3 업로드 권한** 과 **CodeDeploy 권한** 등 필요한 권한만 쪼개서 부여하는 Custom Policy를 사용하는 것이 안전합니다.
- **Cost Management (비용 관리)**:
	- GitHub Actions는 Public Repository에서는 무료이지만, Private에서는 월 사용량 제한(분 단위 과금)이 있습니다.
	- AWS EB 인스턴스와 RDS는 켜져 있는 동안 계속 과금되므로, 학습이 끝나면 반드시 **"환경 종료(Terminate Environment)"**와 **"RDS 삭제"**를 수행해야 합니다.

---
