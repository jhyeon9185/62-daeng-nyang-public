package com.dnproject.platform.controller;

import com.dnproject.platform.domain.constant.SyncTriggerType;
import com.dnproject.platform.dto.response.ApiResponse;
import com.dnproject.platform.dto.response.PageResponse;
import com.dnproject.platform.service.AnimalService;
import com.dnproject.platform.service.PublicApiService;
import com.dnproject.platform.service.SyncHistoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 관리자 전용 - 동물 공공API 동기화 및 동기화 이력 //
 */
@Tag(name = "Admin - Animal", description = "관리자 동물 API")
@RestController
@RequestMapping("/api/admin/animals")
@RequiredArgsConstructor
public class AdminAnimalController {

        private final AnimalService animalService;
        private final PublicApiService publicApiService;
        private final SyncHistoryService syncHistoryService;

        @Operation(summary = "공공데이터 유기동물 동기화")
        @PostMapping("/sync-from-public-api")
        public ApiResponse<Map<String, Object>> syncFromPublicApi(
                        @RequestParam(defaultValue = "7") int days,
                        @RequestParam(required = false) Integer maxPages,
                        @RequestParam(required = false) String species) {
                boolean apiKeyConfigured = publicApiService.isApiKeyConfigured();
                try {
                        var result = animalService.syncFromPublicApiWithStatus(days, maxPages, species);
                        syncHistoryService.save(result, SyncTriggerType.MANUAL, days, species != null ? species : "ALL",
                                        null);
                        return ApiResponse.success("동기화 완료", Map.of(
                                        "addedCount", result.addedCount(),
                                        "updatedCount", result.updatedCount(),
                                        "syncedCount", result.syncedCount(),
                                        "removedCount", result.removedCount(),
                                        "days", days,
                                        "species", species != null ? species : "ALL",
                                        "apiKeyConfigured", apiKeyConfigured));
                } catch (Exception e) {
                        syncHistoryService.save(
                                        new com.dnproject.platform.service.AnimalSyncService.SyncResult(0, 0, 0),
                                        SyncTriggerType.MANUAL, days, species != null ? species : "ALL",
                                        e.getMessage());
                        throw e;
                }
        }

        @Operation(summary = "동기화 실행 후 비보호 상태 동물 일괄 정리 (입양·안락사·반환 등)")
        @DeleteMapping("/cleanup-invalid")
        public ApiResponse<Map<String, Object>> cleanupInvalidStatus(
                        @RequestParam(defaultValue = "30") int days) {
                int syncRemoved = 0, syncAdded = 0, syncUpdated = 0;
                String syncError = null;

                // 1) 먼저 동기화 실행 → 공공API에서 전체 상태 조회하여 비보호 동물 삭제
                try {
                        var syncResult = animalService.syncFromPublicApiWithStatus(days, null, null);
                        syncRemoved = syncResult.removedCount();
                        syncAdded = syncResult.addedCount();
                        syncUpdated = syncResult.updatedCount();
                } catch (Exception e) {
                        syncError = e.getMessage();
                        // 동기화 실패해도 DB 정리는 계속 진행
                }

                // 2) 혹시 남은 ADOPTED / NULL 상태 레코드도 정리
                int[] dbCleanup = animalService.cleanupInvalidStatus();

                int totalRemoved = syncRemoved + dbCleanup[0] + dbCleanup[1];
                String message = syncError != null
                                ? "동기화 일부 실패, DB 정리 완료 (" + syncError + ")"
                                : "동기화 + 정리 완료";
                return ApiResponse.success(message, Map.of(
                                "syncRemoved", syncRemoved,
                                "syncAdded", syncAdded,
                                "syncUpdated", syncUpdated,
                                "adoptedDeleted", dbCleanup[0],
                                "nullDeleted", dbCleanup[1],
                                "totalRemoved", totalRemoved));
        }

        @Operation(summary = "동기화 이력 목록 (자동/수동, 추가·수정·삭제·보정 건수)")
        @GetMapping("/sync-history")
        public ApiResponse<PageResponse<SyncHistoryResponse>> getSyncHistory(
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size) {
                var p = syncHistoryService.getHistory(PageRequest.of(page, size));
                var content = p.getContent().stream()
                                .map(h -> new SyncHistoryResponse(
                                                h.getId(),
                                                h.getRunAt().toString(),
                                                h.getTriggerType().name(),
                                                h.getAddedCount(),
                                                h.getUpdatedCount(),
                                                h.getDeletedCount(),
                                                h.getCorrectedCount(),
                                                h.getErrorMessage(),
                                                h.getDaysParam(),
                                                h.getSpeciesFilter()))
                                .toList();
                return ApiResponse.success("OK", PageResponse.<SyncHistoryResponse>builder()
                                .content(content)
                                .page(p.getNumber())
                                .size(p.getSize())
                                .totalElements(p.getTotalElements())
                                .totalPages(p.getTotalPages())
                                .first(p.isFirst())
                                .last(p.isLast())
                                .build());
        }

        public record SyncHistoryResponse(
                        Long id,
                        String runAt,
                        String triggerType,
                        int addedCount,
                        int updatedCount,
                        int deletedCount,
                        int correctedCount,
                        String errorMessage,
                        Integer daysParam,
                        String speciesFilter) {
        }
}
