package com.dnproject.platform.service;

import com.dnproject.platform.domain.SyncHistory;
import com.dnproject.platform.domain.constant.SyncTriggerType;
import com.dnproject.platform.repository.SyncHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 공공데이터 동기화 이력 저장·조회
 */
@Service
@RequiredArgsConstructor
public class SyncHistoryService {

    private final SyncHistoryRepository syncHistoryRepository;

    @Transactional
    public SyncHistory save(AnimalSyncService.SyncResult result, SyncTriggerType triggerType,
                            Integer daysParam, String speciesFilter, String errorMessage) {
        SyncHistory history = SyncHistory.builder()
                .runAt(java.time.Instant.now())
                .triggerType(triggerType)
                .addedCount(result.addedCount())
                .updatedCount(result.updatedCount())
                .deletedCount(0)
                .correctedCount(result.removedCount())
                .errorMessage(errorMessage != null && errorMessage.length() > 1000 ? errorMessage.substring(0, 1000) : errorMessage)
                .daysParam(daysParam)
                .speciesFilter(speciesFilter)
                .build();
        return syncHistoryRepository.save(history);
    }

    @Transactional(readOnly = true)
    public Page<SyncHistory> getHistory(Pageable pageable) {
        return syncHistoryRepository.findAllByOrderByRunAtDesc(pageable);
    }
}
