#!/bin/bash
# 프론트엔드 + 백엔드 동시 시작 (각각 별도 터미널에서 실행 권장)
# 이 스크립트는 백엔드를 백그라운드로 띄운 뒤 프론트엔드를 포그라운드로 실행합니다.
# 사용법: DN_project01 루트에서 ./start-all.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/backend/.env"

# 백엔드가 이미 떠 있는지 확인
if lsof -ti :8080 >/dev/null 2>&1; then
  echo ">>> 백엔드가 이미 실행 중입니다 (포트 8080)"
else
  echo ">>> 백엔드 백그라운드 시작..."
  if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE"
    set +a
  fi
  if [ -z "$JAVA_HOME" ] && command -v /usr/libexec/java_home >/dev/null 2>&1; then
    export JAVA_HOME=$(/usr/libexec/java_home -v 21 2>/dev/null || true)
  fi
  cd "$SCRIPT_DIR/backend"
  if [ -f ./mvnw ]; then
    ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev -q &
  elif command -v mvn >/dev/null 2>&1; then
    mvn spring-boot:run -Dspring-boot.run.profiles=dev -q &
  else
    echo "Maven이 없습니다. ./start-backend.sh 를 별도 터미널에서 먼저 실행하세요."
  fi
  sleep 5
fi

# 프론트엔드가 이미 떠 있는지 확인
if lsof -ti :5173 >/dev/null 2>&1; then
  echo ">>> 프론트엔드가 이미 실행 중입니다 (포트 5173)"
  echo ">>> http://localhost:5173 에 접속하세요."
else
  echo ">>> 프론트엔드 시작..."
  cd "$SCRIPT_DIR/frontend"
  npm run dev
fi
