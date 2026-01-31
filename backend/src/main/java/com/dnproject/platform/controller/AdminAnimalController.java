package com.dnproject.platform.controller;

import com.dnproject.platform.dto.response.ApiResponse;
import com.dnproject.platform.service.AnimalService;
import com.dnproject.platform.service.PublicApiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 관리자 전용 - 동물 공공API 동기화
 */
@Tag(name = "Admin - Animal", description = "관리자 동물 API")
@RestController
@RequestMapping("/api/admin/animals")
@RequiredArgsConstructor
public class AdminAnimalController {

    private final AnimalService animalService;
    private final PublicApiService publicApiService;

    @Operation(summary = "공공데이터 유기동물 동기화")
    @PostMapping("/sync-from-public-api")
    public ApiResponse<Map<String, Object>> syncFromPublicApi(
            @RequestParam(defaultValue = "7") int days,
            @RequestParam(required = false) Integer maxPages,
            @RequestParam(required = false) String species) {
        boolean apiKeyConfigured = publicApiService.isApiKeyConfigured();
        var result = animalService.syncFromPublicApiWithStatus(days, maxPages, species);
        return ApiResponse.success("동기화 완료", Map.of(
                "syncedCount", result.syncedCount(),
                "statusSyncCount", result.statusSyncCount(),
                "statusCorrectedCount", result.statusCorrectedCount(),
                "days", days,
                "species", species != null ? species : "ALL",
                "apiKeyConfigured", apiKeyConfigured
        ));
    }
}
