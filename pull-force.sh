#!/bin/bash

echo "⚠️  경고: 로컬 변경사항이 영구 삭제됩니다!"
echo "데이터 손실 위험이 있으니 백업 후 진행하세요."
echo "계속하시겠습니까? (y/N): "
read confirm

if [[ $confirm =~ ^[Yy]$ ]]; then
  git fetch origin
  git reset --hard origin/main
  echo "✅ 강제 풀 완료."
else
  echo "❌ 취소됨."
fi