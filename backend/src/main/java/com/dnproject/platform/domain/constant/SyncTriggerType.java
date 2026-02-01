package com.dnproject.platform.domain.constant;

/**
 * 공공데이터 동기화 실행 구분: 스케줄(자동) / 관리자 수동
 */
public enum SyncTriggerType {
    AUTO,   // 스케줄(매일 새벽 2시 등)
    MANUAL  // 관리자 수동 실행
}
