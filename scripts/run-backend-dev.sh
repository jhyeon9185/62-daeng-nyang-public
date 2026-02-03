#!/bin/bash
# backend/.env 를 로드한 뒤 백엔드(dev) 실행
# 사용법: DN_project01 루트에서 ./scripts/run-backend-dev.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_DIR/backend/.env"

if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
fi
# 백엔드는 Java 21 기준 (Java 25 사용 시 Lombok 호환 문제 방지)
if [ -z "$JAVA_HOME" ] && command -v /usr/libexec/java_home >/dev/null 2>&1; then
  export JAVA_HOME=$(/usr/libexec/java_home -v 21 2>/dev/null || true)
fi
cd "$PROJECT_DIR/backend"
if [ -f ./gradlew ]; then
  ./gradlew bootRun --args='--spring.profiles.active=dev'
else
  echo "Gradle Wrapper(gradlew)가 없습니다. backend/ 디렉터리에 gradlew가 있는지 확인한 뒤 다시 실행하세요."
  echo "  또는 IDE에서 DnPlatformApplication 을 dev 프로필로 실행 (환경 변수에 backend/.env 로드)"
  exit 1
fi
