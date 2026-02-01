#!/bin/bash
# V5__add_sync_history.sql 마이그레이션 실행 (sync_history 테이블 생성)
# 로컬: backend/.env 의 DB_USERNAME, DB_PASSWORD 사용
# 운영(EC2 등): DB_HOST, DB_USERNAME, DB_PASSWORD 환경변수로 RDS 접속
#
# 사용법:
#   로컬) ./scripts/run-migration-v5.sh
#   운영) DB_HOST=rds-xxx.region.rds.amazonaws.com DB_USERNAME=admin DB_PASSWORD=비밀번호 ./scripts/run-migration-v5.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SQL_FILE="$PROJECT_DIR/docs/migrations/V5__add_sync_history.sql"

# backend/.env 로드 (있으면)
if [ -f "$PROJECT_DIR/backend/.env" ]; then
  set -a
  . "$PROJECT_DIR/backend/.env"
  set +a
fi

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_USERNAME="${DB_USERNAME:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_NAME="${DB_NAME:-dn_platform}"

if [ -z "$DB_PASSWORD" ]; then
  echo "DB_PASSWORD가 비어 있습니다. backend/.env 또는 환경변수 DB_PASSWORD를 설정하세요."
  exit 1
fi

export MYSQL_PWD="$DB_PASSWORD"
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" "$DB_NAME" < "$SQL_FILE"
unset MYSQL_PWD

echo "OK: sync_history 테이블 생성 완료 (V5)."
