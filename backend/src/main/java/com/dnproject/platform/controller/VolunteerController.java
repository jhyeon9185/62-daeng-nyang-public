package com.dnproject.platform.controller;

import com.dnproject.platform.dto.request.VolunteerApplyRequest;
import com.dnproject.platform.dto.request.VolunteerRecruitmentCreateRequest;
import com.dnproject.platform.dto.response.ApiResponse;
import com.dnproject.platform.dto.response.PageResponse;
import com.dnproject.platform.dto.response.VolunteerRecruitmentResponse;
import com.dnproject.platform.dto.response.VolunteerResponse;
import com.dnproject.platform.exception.UnauthorizedException;
import com.dnproject.platform.service.VolunteerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Volunteer", description = "봉사 API")
@RestController
@RequestMapping("/api/volunteers")
@RequiredArgsConstructor
public class VolunteerController {

    private final VolunteerService volunteerService;

    private Long getUserId(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) throw new UnauthorizedException("인증이 필요합니다.");
        return userId;
    }

    @Operation(summary = "봉사 모집공고 목록")
    @GetMapping("/recruitments")
    public ApiResponse<PageResponse<VolunteerRecruitmentResponse>> getAllRecruitments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<VolunteerRecruitmentResponse> data = volunteerService.getAllRecruitments(PageRequest.of(page, size));
        return ApiResponse.success("조회 성공", data);
    }

    @Operation(summary = "봉사 모집공고 상세")
    @GetMapping("/recruitments/{id}")
    public ApiResponse<VolunteerRecruitmentResponse> getRecruitmentById(@PathVariable Long id) {
        VolunteerRecruitmentResponse data = volunteerService.getRecruitmentById(id);
        return ApiResponse.success("조회 성공", data);
    }

    @Operation(summary = "봉사 모집공고 등록 (보호소)")
    @PostMapping("/recruitments")
    public ApiResponse<VolunteerRecruitmentResponse> createRecruitment(
            @Valid @RequestBody VolunteerRecruitmentCreateRequest request,
            HttpServletRequest httpRequest) {
        Long userId = getUserId(httpRequest);
        VolunteerRecruitmentResponse data = volunteerService.createRecruitment(userId, request);
        return ApiResponse.created("등록 완료", data);
    }

    @Operation(summary = "봉사 신청")
    @PostMapping
    public ApiResponse<VolunteerResponse> apply(@Valid @RequestBody VolunteerApplyRequest request,
                                                HttpServletRequest httpRequest) {
        Long userId = getUserId(httpRequest);
        VolunteerResponse data = volunteerService.apply(userId, request);
        return ApiResponse.created("신청 완료", data);
    }

    @Operation(summary = "보호소 대기 신청 목록 (보호소 관리자)")
    @GetMapping("/shelter/pending")
    public ApiResponse<PageResponse<VolunteerResponse>> getPendingByShelter(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpServletRequest httpRequest) {
        Long userId = getUserId(httpRequest);
        PageResponse<VolunteerResponse> data = volunteerService.getPendingByShelterForCurrentUser(userId, page, size);
        return ApiResponse.success("조회 성공", data);
    }

    @Operation(summary = "내 봉사 목록")
    @GetMapping("/my")
    public ApiResponse<PageResponse<VolunteerResponse>> getMyList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest httpRequest) {
        Long userId = getUserId(httpRequest);
        PageResponse<VolunteerResponse> data = volunteerService.getMyList(userId, page, size);
        return ApiResponse.success("조회 성공", data);
    }

    @Operation(summary = "봉사 신청 승인 (관리자)")
    @PutMapping("/{id}/approve")
    public ApiResponse<VolunteerResponse> approve(@PathVariable Long id) {
        VolunteerResponse data = volunteerService.approve(id);
        return ApiResponse.success("승인 완료", data);
    }

    @Operation(summary = "봉사 신청 거절 (관리자)")
    @PutMapping("/{id}/reject")
    public ApiResponse<VolunteerResponse> reject(@PathVariable Long id, @RequestBody(required = false) RejectBody body) {
        VolunteerResponse data = volunteerService.reject(id, body != null ? body.getRejectReason() : null);
        return ApiResponse.success("거절 완료", data);
    }

    @lombok.Data
    public static class RejectBody {
        private String rejectReason;
    }
}
