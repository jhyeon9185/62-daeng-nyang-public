#!/bin/bash
# 지정 이메일을 SUPER_ADMIN으로 설정
# 사용법: ./scripts/set-super-admin.sh
#         EMAIL=reijung7@gmail.com DB_PASSWORD=비밀번호 ./scripts/set-super-admin.sh
# backend/.env 가 있으면 자동으로 DB_USERNAME, DB_PASSWORD 로드

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_DIR/backend/.env"
EMAIL="${EMAIL:-reijung7@gmail.com}"

if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

USER="${DB_USERNAME:-root}"
PASS="${DB_PASSWORD:-}"

if [ -z "$PASS" ]; then
  echo "DB_PASSWORD가 비어 있습니다. backend/.env 또는 환경변수 DB_PASSWORD를 설정하세요."
  exit 1
fi

mysql -u "$USER" -p"$PASS" dn_platform -e "UPDATE users SET role='SUPER_ADMIN' WHERE email='$EMAIL';"
echo "OK: $EMAIL 을(를) SUPER_ADMIN으로 설정했습니다."
