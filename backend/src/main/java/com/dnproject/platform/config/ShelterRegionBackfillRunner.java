package com.dnproject.platform.config;

import com.dnproject.platform.service.ShelterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * 기동 시 regionSido/regionSigungu가 비어 있는 보호소에 대해 주소 파싱으로 채움.
 * 기존 데이터 및 공공API로 생성된 보호소 보정용.
 */
@Slf4j
@Component
@Order(10)
@RequiredArgsConstructor
public class ShelterRegionBackfillRunner implements ApplicationRunner {

    private final ShelterService shelterService;

    @Override
    public void run(ApplicationArguments args) {
        try {
            int updated = shelterService.backfillRegionFromAddress();
            if (updated > 0) {
                log.info("Shelter region backfill completed: {} shelters updated", updated);
            }
        } catch (Exception e) {
            log.warn("Shelter region backfill failed (non-fatal): {}", e.getMessage());
        }
    }
}
