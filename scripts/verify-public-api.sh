#!/bin/bash
# 공공데이터 API 연동 확인 스크립트
# 사용법: 백엔드를 먼저 실행한 뒤, DN_project01 루트에서 ./scripts/verify-public-api.sh
# 필요: curl, mysql(클라이언트), backend/.env 의 DB 비밀번호

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_DIR/backend/.env"
BASE_URL="${API_BASE_URL:-http://localhost:8080/api}"

# backend/.env 로드 (DB 비밀번호 등)
if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

echo "=== 1. 백엔드 연결 확인 (${BASE_URL}) ==="
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/../swagger-ui.html" 2>/dev/null || true)
if [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "302" ]; then
  echo "백엔드에 연결할 수 없습니다. 먼저 ./scripts/run-backend-dev.sh 로 백엔드를 실행하세요."
  exit 1
fi
echo "OK: 백엔드 연결됨"

echo ""
echo "=== 2. 테스트용 관리자 계정 준비 ==="
TEST_EMAIL="admin@test.com"
TEST_PASSWORD="password1234"
# 회원가입 (이미 있으면 409 무시)
SIGNUP_RES=$(curl -s -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"테스트관리자\"}" 2>/dev/null || true)
if echo "$SIGNUP_RES" | grep -q "EMAIL_EXISTS\|이미 사용 중"; then
  echo "이미 존재하는 계정 사용"
elif echo "$SIGNUP_RES" | grep -q "email\|id"; then
  echo "회원가입 완료"
else
  echo "회원가입 응답: $SIGNUP_RES"
fi

# DB에서 해당 계정을 SUPER_ADMIN 으로 변경
export MYSQL_PWD="${DB_PASSWORD:-password1234}"
mysql -u "${DB_USERNAME:-root}" -h 127.0.0.1 dn_platform -e "UPDATE users SET role='SUPER_ADMIN' WHERE email='$TEST_EMAIL';" 2>/dev/null || {
  echo "경고: DB role 업데이트 실패. 이미 SUPER_ADMIN 이거나 mysql 접속을 확인하세요."
}
unset MYSQL_PWD

echo ""
echo "=== 3. 로그인 → 토큰 발급 ==="
LOGIN_RES=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
ACCESS_TOKEN=$(echo "$LOGIN_RES" | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')
if [ -z "$ACCESS_TOKEN" ]; then
  echo "로그인 실패. 응답: $LOGIN_RES"
  exit 1
fi
echo "OK: 토큰 발급됨"

echo ""
echo "=== 4. 공공데이터 동기화 API 호출 (최근 7일, 최대 1페이지) ==="
SYNC_RES=$(curl -s -X POST "$BASE_URL/admin/animals/sync-from-public-api?days=7&maxPages=1" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json")
echo "$SYNC_RES"
if echo "$SYNC_RES" | grep -q "syncedCount"; then
  COUNT=$(echo "$SYNC_RES" | sed -n 's/.*"syncedCount":\([0-9]*\).*/\1/p')
  echo ""
  echo ">>> 동기화된 동물 수: ${COUNT:-0}"
  if [ "${COUNT:-0}" -gt 0 ]; then
    echo ">>> API 연동이 정상적으로 적용되었습니다."
  else
    echo ">>> 동기화는 성공했으나 이번 조회에 새 데이터가 없을 수 있습니다. days 를 늘리거나 maxPages 를 제거해 보세요."
  fi
else
  echo "동기화 요청 실패 또는 권한 없음. 응답 확인 필요."
fi

echo ""
echo "=== 5. 동물 목록 조회 (일부) ==="
curl -s "$BASE_URL/animals?page=0&sizeParam=3" | head -c 500
echo ""
echo ""
echo "--- 확인 완료 ---"
