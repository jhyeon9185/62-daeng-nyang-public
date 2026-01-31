#!/bin/bash
# 백엔드 개발 서버 시작 (Spring Boot, 포트 8080)
# 사용법: DN_project01 루트에서 ./start-backend.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/backend/.env"

if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
fi
if [ -z "$JAVA_HOME" ] && command -v /usr/libexec/java_home >/dev/null 2>&1; then
  export JAVA_HOME=$(/usr/libexec/java_home -v 21 2>/dev/null || true)
fi
cd "$SCRIPT_DIR/backend"
echo ">>> 백엔드 시작 (http://localhost:8080)"
if [ -f ./mvnw ]; then
  ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
elif command -v mvn >/dev/null 2>&1; then
  mvn spring-boot:run -Dspring-boot.run.profiles=dev
else
  echo "Maven이 없습니다. brew install maven 또는 backend/에 mvnw 추가 후 다시 실행하세요."
  exit 1
fi
