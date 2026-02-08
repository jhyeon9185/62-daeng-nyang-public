package com.dnproject.platform.config;

import com.dnproject.platform.domain.constant.SyncTriggerType;
import com.dnproject.platform.service.AnimalSyncService;
import com.dnproject.platform.service.SyncHistoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 공공데이터 유기동물 스케줄 동기화.
 * public-api.sync-enabled=true 일 때만 동작하며, 하루 1회(기본 새벽 2시) 최근 7일치 데이터를 가져옵니다.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "public-api.sync-enabled", havingValue = "true")
public class PublicApiSyncScheduler {

    private final AnimalSyncService animalSyncService;
    private final SyncHistoryService syncHistoryService;

    /** 매일 지정 시간(기본 02:00)에 최근 7일 유기동물 동기화. cron은 application.yml public-api.sync-cron 으로 변경 가능 */
    @Scheduled(cron = "${public-api.sync-cron:0 0 2 * * *}")
    public void syncFromPublicApi() {
        log.info("공공데이터 유기동물 스케줄 동기화 시작");
        try {
            var result = animalSyncService.syncDailySchedule();
            syncHistoryService.save(result, SyncTriggerType.AUTO, null, "ALL", null);
            log.info("공공데이터 유기동물 스케줄 동기화 완료: 신규={}, 수정={}, 삭제={}", result.addedCount(), result.updatedCount(), result.removedCount());
        } catch (Exception e) {
            log.error("공공데이터 유기동물 스케줄 동기화 실패", e);
            syncHistoryService.save(new AnimalSyncService.SyncResult(0, 0, 0), SyncTriggerType.AUTO, null, "ALL", e.getMessage());
        }
    }
}
