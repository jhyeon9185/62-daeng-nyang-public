package com.dnproject.platform.controller;

import com.dnproject.platform.dto.request.PreferenceRequest;
import com.dnproject.platform.dto.response.ApiResponse;
import com.dnproject.platform.dto.response.PreferenceResponse;
import com.dnproject.platform.exception.UnauthorizedException;
import com.dnproject.platform.service.PreferenceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@Tag(name = "User Preference", description = "내 선호도 API")
@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
public class UserPreferenceController {

    private final PreferenceService preferenceService;

    @Operation(summary = "내 선호도 조회")
    @GetMapping("/preferences")
    public ApiResponse<PreferenceResponse> getMyPreference(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            throw new UnauthorizedException("인증이 필요합니다.");
        }
        PreferenceResponse data = preferenceService.getByUserId(userId);
        return ApiResponse.success("조회 성공", data);
    }

    @Operation(summary = "내 선호도 저장/수정")
    @PutMapping("/preferences")
    public ApiResponse<PreferenceResponse> updateMyPreference(
            HttpServletRequest request,
            @RequestBody PreferenceRequest body
    ) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            throw new UnauthorizedException("인증이 필요합니다.");
        }
        PreferenceResponse data = preferenceService.update(userId, body);
        return ApiResponse.success("저장되었습니다.", data);
    }
}
