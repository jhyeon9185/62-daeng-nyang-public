#!/bin/bash
# 프론트엔드 서버 재시작 (포트 5173 프로세스 종료 후 재실행)
# 사용법: DN_project01 루트에서 ./restart-frontend.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT=5173

# 포트 사용 중인 프로세스 찾아 종료
PIDS=$(lsof -ti :$PORT 2>/dev/null)
if [ -n "$PIDS" ]; then
  echo ">>> 포트 $PORT 프로세스 종료 중..."
  echo "$PIDS" | xargs kill 2>/dev/null || true
  sleep 2
fi

echo ">>> 프론트엔드 시작 (http://localhost:$PORT)"
cd "$SCRIPT_DIR/frontend"
npm run dev
