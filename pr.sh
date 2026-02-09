#!/bin/bash

echo "=========================================="
echo "   62댕냥이 Team Safe Deploy Script 🚀   "
echo "=========================================="

# 1. Git repo 체크
if [ ! -d ".git" ]; then
    echo "❌ Error: Not a git repository."
    exit 1
fi

# 2. 현재 브랜치
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "📌 Current branch: $CURRENT_BRANCH"

# 3. 위험 브랜치 차단
PROTECTED_BRANCHES=("main" "develop")
for branch in "${PROTECTED_BRANCHES[@]}"; do
    if [ "$CURRENT_BRANCH" = "$branch" ]; then
        echo "❌ Direct push to '$branch' is not allowed."
        echo "👉 Please use a feature branch and open a PR."
        exit 1
    fi
done

echo "------------------------------------------"

# 4. 변경사항 확인
if git diff --quiet && git diff --cached --quiet; then
    echo "⚠️ No changes to commit."
    exit 0
fi

# 5. git add 선택
read -p "Add all changes? (git add .) (y/n): " ADD_ALL
if [[ "$ADD_ALL" =~ ^[Yy]$ ]]; then
    git add .
else
    echo "👉 Please stage files manually, then re-run script."
    exit 0
fi

# 6. 커밋 메시지
read -p "Enter commit message: " COMMIT_MSG
if [ -z "$COMMIT_MSG" ]; then
    echo "❌ Commit message cannot be empty."
    exit 1
fi

git commit -m "$COMMIT_MSG" || {
    echo "❌ Commit failed."
    exit 1
}

# 7. push (현재 브랜치만 허용)
echo "------------------------------------------"
echo "🚀 Pushing to origin/$CURRENT_BRANCH..."
git push origin "$CURRENT_BRANCH" || {
    echo "❌ Push failed."
    exit 1
}

echo "=========================================="
echo "   ✅ Push Successful!                    "
echo "=========================================="

# 8. PR 생성 (선택)
if command -v gh &> /dev/null; then
    read -p "Create Pull Request to main now? (y/n): " CREATE_PR
    if [[ "$CREATE_PR" =~ ^[Yy]$ ]]; then
        if ! gh auth status &> /dev/null; then
            gh auth login
        fi

        gh pr create \
          --base main \
          --head "$CURRENT_BRANCH" \
          --title "$COMMIT_MSG" \
          --body "$COMMIT_MSG" \
          --web
    fi
else
    echo "ℹ️ GitHub CLI not installed. Skipping PR creation."
fi
