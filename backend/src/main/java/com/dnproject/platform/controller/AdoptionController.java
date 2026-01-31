package com.dnproject.platform.controller;

import com.dnproject.platform.dto.request.AdoptionRequest;
import com.dnproject.platform.dto.response.AdoptionResponse;
import com.dnproject.platform.dto.response.ApiResponse;
import com.dnproject.platform.dto.response.PageResponse;
import com.dnproject.platform.exception.UnauthorizedException;
import com.dnproject.platform.service.AdoptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Adoption", description = "입양/임보 신청 API")
@RestController
@RequestMapping("/api/adoptions")
@RequiredArgsConstructor
public class AdoptionController {

    private final AdoptionService adoptionService;

    private Long getUserId(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) throw new UnauthorizedException("인증이 필요합니다.");
        return userId;
    }

    @Operation(summary = "입양/임보 신청")
    @PostMapping
    public ApiResponse<AdoptionResponse> apply(@Valid @RequestBody AdoptionRequest request,
                                               HttpServletRequest httpRequest) {
        Long userId = getUserId(httpRequest);
        AdoptionResponse data = adoptionService.apply(userId, request);
        return ApiResponse.created("신청 완료", data);
    }

    @Operation(summary = "보호소 대기 신청 목록 (보호소 관리자)")
    @GetMapping("/shelter/pending")
    public ApiResponse<PageResponse<AdoptionResponse>> getPendingByShelter(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpServletRequest httpRequest) {
        Long userId = getUserId(httpRequest);
        PageResponse<AdoptionResponse> data = adoptionService.getPendingByShelterForCurrentUser(userId, page, size);
        return ApiResponse.success("조회 성공", data);
    }

    @Operation(summary = "내 신청 목록")
    @GetMapping("/my")
    public ApiResponse<PageResponse<AdoptionResponse>> getMyList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest httpRequest) {
        Long userId = getUserId(httpRequest);
        PageResponse<AdoptionResponse> data = adoptionService.getMyList(userId, page, size);
        return ApiResponse.success("조회 성공", data);
    }

    @Operation(summary = "신청 취소")
    @PutMapping("/{id}/cancel")
    public ApiResponse<AdoptionResponse> cancel(@PathVariable Long id, HttpServletRequest httpRequest) {
        Long userId = getUserId(httpRequest);
        AdoptionResponse data = adoptionService.cancel(id, userId);
        return ApiResponse.success("취소 완료", data);
    }

    @Operation(summary = "신청 승인 (관리자)")
    @PutMapping("/{id}/approve")
    public ApiResponse<AdoptionResponse> approve(@PathVariable Long id) {
        AdoptionResponse data = adoptionService.approve(id);
        return ApiResponse.success("승인 완료", data);
    }

    @Operation(summary = "신청 거절 (관리자)")
    @PutMapping("/{id}/reject")
    public ApiResponse<AdoptionResponse> reject(@PathVariable Long id, @RequestBody RejectBody body) {
        AdoptionResponse data = adoptionService.reject(id, body != null ? body.getRejectReason() : null);
        return ApiResponse.success("거절 완료", data);
    }

    @lombok.Data
    public static class RejectBody {
        private String rejectReason;
    }
}
