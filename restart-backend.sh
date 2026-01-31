#!/bin/bash
# 백엔드 서버 재시작 (포트 8080 프로세스 종료 후 재실행)
# 사용법: DN_project01 루트에서 ./restart-backend.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT=8080
ENV_FILE="$SCRIPT_DIR/backend/.env"

# 포트 사용 중인 프로세스 찾아 종료 (Spring Boot)
PIDS=$(lsof -ti :$PORT 2>/dev/null)
if [ -n "$PIDS" ]; then
  echo ">>> 포트 $PORT 프로세스 종료 중..."
  echo "$PIDS" | xargs kill 2>/dev/null || true
  sleep 3
fi

if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
fi
if [ -z "$JAVA_HOME" ] && command -v /usr/libexec/java_home >/dev/null 2>&1; then
  export JAVA_HOME=$(/usr/libexec/java_home -v 21 2>/dev/null || true)
fi
cd "$SCRIPT_DIR/backend"
echo ">>> 백엔드 시작 (http://localhost:$PORT)"
if [ -f ./mvnw ]; then
  ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
elif command -v mvn >/dev/null 2>&1; then
  mvn spring-boot:run -Dspring-boot.run.profiles=dev
else
  echo "Maven이 없습니다. brew install maven 또는 backend/에 mvnw 추가 후 다시 실행하세요."
  exit 1
fi
