#!/bin/bash
# DN Platform - GitHub Actions 배포 트리거
# 실행 시 main 브랜치에 push하여 자동 배포

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo "=== DN Platform 배포 ==="
echo "변경사항 확인 중..."
git status

if [[ -n $(git status -s) ]]; then
  read -p "커밋 메시지 (기본: Deploy): " msg
  msg=${msg:-Deploy}
  git add .
  git commit -m "$msg"
  git push origin main
  echo ""
  echo "✅ Push 완료. GitHub Actions에서 배포가 진행됩니다."
  echo "   확인: https://github.com/every-git/62dn/actions"
  echo "   접속: http://3.39.187.182"
else
  echo "변경사항이 없습니다. 강제 push하려면: git push origin main"
fi
