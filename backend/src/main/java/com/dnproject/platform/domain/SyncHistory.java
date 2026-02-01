package com.dnproject.platform.domain;

import com.dnproject.platform.domain.constant.SyncTriggerType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * 공공데이터 유기동물 동기화 실행 이력 (자동/수동, 추가·수정·삭제·보정 건수)
 */
@Entity
@Table(name = "sync_history", indexes = {
    @Index(name = "idx_sync_history_run_at", columnList = "run_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SyncHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "run_at", nullable = false)
    private Instant runAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "trigger_type", nullable = false, length = 20)
    private SyncTriggerType triggerType;

    @Column(name = "added_count", nullable = false)
    @Builder.Default
    private int addedCount = 0;

    @Column(name = "updated_count", nullable = false)
    @Builder.Default
    private int updatedCount = 0;

    @Column(name = "deleted_count", nullable = false)
    @Builder.Default
    private int deletedCount = 0;

    /** 만료→입양 보정 건수 */
    @Column(name = "corrected_count", nullable = false)
    @Builder.Default
    private int correctedCount = 0;

    @Column(name = "error_message", length = 1000)
    private String errorMessage;

    /** 수동 실행 시 적용한 days (선택) */
    @Column(name = "days_param")
    private Integer daysParam;

    /** 수동 실행 시 종 필터 (ALL, DOG, CAT 등) */
    @Column(name = "species_filter", length = 20)
    private String speciesFilter;
}
