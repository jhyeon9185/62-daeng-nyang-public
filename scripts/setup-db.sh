#!/bin/bash
# 로컬 MySQL에 dn_platform DB 및 테이블 생성
# 사용법:
#   ./scripts/setup-db.sh
#   DB_USERNAME=root DB_PASSWORD=내비밀번호 ./scripts/setup-db.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SCHEMA="$PROJECT_DIR/docs/schema.sql"

USER="${DB_USERNAME:-root}"
PASS="${DB_PASSWORD:-}"

if [ -n "$PASS" ]; then
  mysql -u "$USER" -p"$PASS" < "$SCHEMA"
else
  echo "DB_PASSWORD가 비어 있으면 비밀번호 입력 프롬프트로 진행합니다."
  mysql -u "$USER" -p < "$SCHEMA"
fi

echo "OK: dn_platform DB 및 테이블 생성 완료."
