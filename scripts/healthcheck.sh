#!/bin/bash
# DN Platform 헬스체크 스크립트
# Cron으로 5분마다 실행하여 서비스 자동 재시작

LOG_FILE="/home/ec2-user/healthcheck.log"
MAX_LOG_LINES=1000

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"

  # 로그 파일 크기 제한
  if [ -f "$LOG_FILE" ]; then
    tail -n $MAX_LOG_LINES "$LOG_FILE" > "$LOG_FILE.tmp"
    mv "$LOG_FILE.tmp" "$LOG_FILE"
  fi
}

# Nginx 체크
if ! systemctl is-active --quiet nginx; then
  log "❌ Nginx 다운 감지 - 재시작 시도"
  sudo systemctl restart nginx
  sleep 2
  if systemctl is-active --quiet nginx; then
    log "✅ Nginx 재시작 성공"
  else
    log "⚠️ Nginx 재시작 실패"
  fi
else
  log "✅ Nginx 정상"
fi

# Backend 체크
if ! systemctl is-active --quiet dn-platform; then
  log "❌ Backend 다운 감지 - 재시작 시도"
  sudo systemctl restart dn-platform
  sleep 5
  if systemctl is-active --quiet dn-platform; then
    log "✅ Backend 재시작 성공"
  else
    log "⚠️ Backend 재시작 실패"
  fi
else
  # HTTP 응답 확인
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost 2>/dev/null)
  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
    log "✅ Backend 정상 (HTTP $HTTP_CODE)"
  else
    log "⚠️ Backend HTTP 응답 이상 (HTTP $HTTP_CODE)"
  fi
fi

# 디스크 사용량 체크 (80% 이상 경고)
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
  log "⚠️ 디스크 사용량: ${DISK_USAGE}%"
fi

# 메모리 사용량 체크
MEM_USAGE=$(free | awk 'NR==2 {printf "%.0f", $3*100/$2}')
if [ "$MEM_USAGE" -gt 90 ]; then
  log "⚠️ 메모리 사용량: ${MEM_USAGE}%"
fi
