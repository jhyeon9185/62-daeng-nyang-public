package com.dnproject.platform.controller;

import com.dnproject.platform.dto.request.DonationApplyRequest;
import com.dnproject.platform.dto.request.DonationRequestCreateRequest;
import com.dnproject.platform.dto.response.ApiResponse;
import com.dnproject.platform.dto.response.DonationRequestResponse;
import com.dnproject.platform.dto.response.DonationResponse;
import com.dnproject.platform.dto.response.PageResponse;
import com.dnproject.platform.exception.UnauthorizedException;
import com.dnproject.platform.service.DonationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Donation", description = "기부 API")
@RestController
@RequestMapping("/api/donations")
@RequiredArgsConstructor
public class DonationController {

    private final DonationService donationService;

    private Long getUserId(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) throw new UnauthorizedException("인증이 필요합니다.");
        return userId;
    }

    @Operation(summary = "물품 요청 목록")
    @GetMapping("/requests")
    public ApiResponse<PageResponse<DonationRequestResponse>> getAllRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<DonationRequestResponse> data = donationService.getAllRequests(PageRequest.of(page, size));
        return ApiResponse.success("조회 성공", data);
    }

    @Operation(summary = "물품 요청 상세")
    @GetMapping("/requests/{id}")
    public ApiResponse<DonationRequestResponse> getRequestById(@PathVariable Long id) {
        DonationRequestResponse data = donationService.getRequestById(id);
        return ApiResponse.success("조회 성공", data);
    }

    @Operation(summary = "물품 요청 등록 (보호소)")
    @PostMapping("/requests")
    public ApiResponse<DonationRequestResponse> createRequest(
            @Valid @RequestBody DonationRequestCreateRequest request,
            HttpServletRequest httpRequest) {
        Long userId = getUserId(httpRequest);
        DonationRequestResponse data = donationService.createRequest(userId, request);
        return ApiResponse.created("등록 완료", data);
    }

    @Operation(summary = "기부 신청")
    @PostMapping
    public ApiResponse<DonationResponse> donate(@Valid @RequestBody DonationApplyRequest request,
                                                HttpServletRequest httpRequest) {
        Long userId = getUserId(httpRequest);
        DonationResponse data = donationService.donate(userId, request);
        return ApiResponse.created("신청 완료", data);
    }

    @Operation(summary = "보호소 대기 신청 목록 (보호소 관리자)")
    @GetMapping("/shelter/pending")
    public ApiResponse<PageResponse<DonationResponse>> getPendingByShelter(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpServletRequest httpRequest) {
        Long userId = getUserId(httpRequest);
        PageResponse<DonationResponse> data = donationService.getPendingByShelterForCurrentUser(userId, page, size);
        return ApiResponse.success("조회 성공", data);
    }

    @Operation(summary = "내 기부 목록")
    @GetMapping("/my")
    public ApiResponse<PageResponse<DonationResponse>> getMyList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest httpRequest) {
        Long userId = getUserId(httpRequest);
        PageResponse<DonationResponse> data = donationService.getMyList(userId, page, size);
        return ApiResponse.success("조회 성공", data);
    }

    @Operation(summary = "수령 완료 처리 (관리자)")
    @PutMapping("/{id}/complete")
    public ApiResponse<DonationResponse> complete(@PathVariable Long id) {
        DonationResponse data = donationService.complete(id);
        return ApiResponse.success("수령 완료", data);
    }

    @Operation(summary = "기부 신청 거절 (관리자)")
    @PutMapping("/{id}/reject")
    public ApiResponse<DonationResponse> reject(@PathVariable Long id, @RequestBody(required = false) RejectBody body) {
        DonationResponse data = donationService.reject(id, body != null ? body.getRejectReason() : null);
        return ApiResponse.success("거절 완료", data);
    }

    @lombok.Data
    public static class RejectBody {
        private String rejectReason;
    }
}
