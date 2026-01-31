package com.dnproject.platform.controller;

import com.dnproject.platform.dto.response.AdoptionResponse;
import com.dnproject.platform.dto.response.ApiResponse;
import com.dnproject.platform.dto.response.DonationResponse;
import com.dnproject.platform.dto.response.PageResponse;
import com.dnproject.platform.dto.response.VolunteerResponse;
import com.dnproject.platform.service.AdoptionService;
import com.dnproject.platform.service.DonationService;
import com.dnproject.platform.service.VolunteerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 시스템 관리자 전용 - 전체 신청 내역 조회 (입양/임보, 봉사, 기부)
 */
@Tag(name = "Admin - Applications", description = "시스템 관리자 신청 내역 API")
@RestController
@RequestMapping("/api/admin/applications")
@RequiredArgsConstructor
public class AdminApplicationController {

    private final AdoptionService adoptionService;
    private final VolunteerService volunteerService;
    private final DonationService donationService;

    @Operation(summary = "전체 입양/임보 신청 내역 (최신순)")
    @GetMapping("/adoptions")
    public ApiResponse<PageResponse<AdoptionResponse>> getAllAdoptions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        PageResponse<AdoptionResponse> data = adoptionService.getAllForAdmin(page, size);
        return ApiResponse.success("조회 성공", data);
    }

    @Operation(summary = "전체 봉사 신청 내역 (최신순)")
    @GetMapping("/volunteers")
    public ApiResponse<PageResponse<VolunteerResponse>> getAllVolunteers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        PageResponse<VolunteerResponse> data = volunteerService.getAllForAdmin(page, size);
        return ApiResponse.success("조회 성공", data);
    }

    @Operation(summary = "전체 기부 신청 내역 (최신순)")
    @GetMapping("/donations")
    public ApiResponse<PageResponse<DonationResponse>> getAllDonations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        PageResponse<DonationResponse> data = donationService.getAllForAdmin(page, size);
        return ApiResponse.success("조회 성공", data);
    }
}
