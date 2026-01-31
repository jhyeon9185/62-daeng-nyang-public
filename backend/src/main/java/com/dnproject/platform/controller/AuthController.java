package com.dnproject.platform.controller;

import com.dnproject.platform.dto.request.LoginRequest;
import com.dnproject.platform.dto.request.ShelterSignupRequest;
import com.dnproject.platform.dto.request.SignupRequest;
import com.dnproject.platform.dto.request.UpdateMeRequest;
import com.dnproject.platform.dto.response.ApiResponse;
import com.dnproject.platform.dto.response.ShelterSignupResponse;
import com.dnproject.platform.dto.response.TokenResponse;
import com.dnproject.platform.dto.response.UserResponse;
import com.dnproject.platform.exception.CustomException;
import com.dnproject.platform.exception.UnauthorizedException;
import com.dnproject.platform.service.AuthService;
import com.dnproject.platform.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Tag(name = "Auth", description = "인증 API")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final FileStorageService fileStorageService;

    @Operation(summary = "회원가입")
    @PostMapping("/signup")
    public ApiResponse<UserResponse> signup(@Valid @RequestBody SignupRequest request) {
        UserResponse data = authService.signup(request);
        return ApiResponse.created("회원가입 성공", data);
    }

    @Operation(summary = "보호소 회원가입 (폼 + 사업자등록증 파일, 시스템 관리자 승인 후 이용 가능)")
    @PostMapping(value = "/shelter-signup", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<ShelterSignupResponse> shelterSignupMultipart(
            @RequestParam String email,
            @RequestParam String password,
            @RequestParam String managerName,
            @RequestParam String managerPhone,
            @RequestParam String shelterName,
            @RequestParam String address,
            @RequestParam String shelterPhone,
            @RequestParam(required = false) String businessRegistrationNumber,
            @RequestPart(name = "businessRegistrationFile", required = false) MultipartFile businessRegistrationFile) {
        ShelterSignupRequest request = ShelterSignupRequest.builder()
                .email(email.trim())
                .password(password)
                .managerName(managerName.trim())
                .managerPhone(managerPhone.trim())
                .shelterName(shelterName.trim())
                .address(address.trim())
                .shelterPhone(shelterPhone.trim())
                .businessRegistrationNumber(businessRegistrationNumber != null ? businessRegistrationNumber.trim().replaceAll("-", "") : null)
                .build();
        if (businessRegistrationFile != null && !businessRegistrationFile.isEmpty()) {
            try {
                String path = fileStorageService.storeBusinessRegistration(businessRegistrationFile);
                request.setBusinessRegistrationFile(path);
            } catch (IOException e) {
                throw new CustomException("사업자등록증 파일 저장에 실패했습니다.", org.springframework.http.HttpStatus.BAD_REQUEST, "FILE_UPLOAD_FAILED");
            }
        }
        ShelterSignupResponse data = authService.shelterSignup(request);
        return ApiResponse.created("보호소 가입 신청 완료", data);
    }

    @Operation(summary = "로그인")
    @PostMapping("/login")
    public ApiResponse<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        TokenResponse data = authService.login(request);
        return ApiResponse.success("로그인 성공", data);
    }

    @Operation(summary = "토큰 갱신")
    @PostMapping("/refresh")
    public ApiResponse<TokenResponse> refresh(@RequestBody RefreshRequest request) {
        TokenResponse data = authService.refreshToken(request.getRefreshToken());
        return ApiResponse.success("토큰 갱신 성공", data);
    }

    @Operation(summary = "로그아웃")
    @PostMapping("/logout")
    public ApiResponse<Void> logout() {
        return ApiResponse.success("로그아웃되었습니다.", null);
    }

    @Operation(summary = "내 정보 조회")
    @GetMapping("/me")
    public ApiResponse<UserResponse> getMe(HttpServletRequest httpRequest) {
        Long userId = (Long) httpRequest.getAttribute("userId");
        if (userId == null) {
            throw new UnauthorizedException("인증이 필요합니다.");
        }
        UserResponse data = authService.getMe(userId);
        return ApiResponse.success("조회 성공", data);
    }

    @Operation(summary = "내 정보 수정 (이름, 이메일). 일반/관리자/시스템 관리자 공통")
    @PatchMapping("/me")
    public ApiResponse<UserResponse> updateMe(HttpServletRequest httpRequest, @RequestBody UpdateMeRequest request) {
        Long userId = (Long) httpRequest.getAttribute("userId");
        if (userId == null) {
            throw new UnauthorizedException("인증이 필요합니다.");
        }
        UserResponse data = authService.updateMe(userId, request);
        return ApiResponse.success("수정되었습니다.", data);
    }

    @lombok.Data
    public static class RefreshRequest {
        private String refreshToken;
    }
}
