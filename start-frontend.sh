#!/bin/bash
# 프론트엔드 개발 서버 시작 (Vite, 포트 5173)
# 사용법: DN_project01 루트에서 ./start-frontend.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/frontend"
echo ">>> 프론트엔드 시작 (http://localhost:5173)"
npm run dev
