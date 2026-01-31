package com.dnproject.platform.controller;

import com.dnproject.platform.domain.constant.VerificationStatus;
import com.dnproject.platform.dto.request.ShelterVerifyRequest;
import com.dnproject.platform.dto.response.ApiResponse;
import com.dnproject.platform.dto.response.ShelterResponse;
import com.dnproject.platform.exception.NotFoundException;
import com.dnproject.platform.exception.UnauthorizedException;
import com.dnproject.platform.service.FileStorageService;
import com.dnproject.platform.service.ShelterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.util.List;

/**
 * 시스템 관리자 전용 - 보호소 인증 승인/거절, 사업자등록증 파일 조회
 * 보호소 관리자 - 내 보호소 조회
 */
@Tag(name = "Admin - Shelter", description = "관리자 보호소 API")
@RestController
@RequestMapping("/api/admin/shelters")
@RequiredArgsConstructor
@Slf4j
public class AdminShelterController {

    private final ShelterService shelterService;
    private final FileStorageService fileStorageService;

    @Operation(summary = "내 보호소 조회 (보호소 관리자 로그인 시)")
    @GetMapping("/my")
    public ApiResponse<ShelterResponse> getMyShelter(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) throw new UnauthorizedException("인증이 필요합니다.");
        ShelterResponse data = shelterService.getMyShelter(userId);
        return ApiResponse.success("조회 성공", data);
    }

    @Operation(summary = "보호소 목록 조회 (상태별, 인증 대기 목록 등)")
    @GetMapping
    public ApiResponse<List<ShelterResponse>> list(
            @RequestParam(defaultValue = "PENDING") VerificationStatus status) {
        List<ShelterResponse> data = shelterService.findByVerificationStatus(status);
        return ApiResponse.success("조회 성공", data);
    }

    @Operation(summary = "보호소 인증 승인/거절")
    @PutMapping("/{id}/verify")
    public ApiResponse<ShelterResponse> verify(
            @PathVariable Long id,
            @RequestBody ShelterVerifyRequest request) {
        ShelterResponse data = shelterService.verify(id, request);
        return ApiResponse.success(
                request.getStatus() == VerificationStatus.APPROVED ? "승인되었습니다." : "거절 처리되었습니다.",
                data);
    }

    @Operation(summary = "사업자등록증 파일 조회 (승인 검토 시 확인용)")
    @GetMapping("/{id}/business-registration-file")
    public ResponseEntity<Resource> getBusinessRegistrationFile(@PathVariable Long id) {
        ShelterResponse shelter = shelterService.getById(id);
        String path = shelter.getBusinessRegistrationFile();
        if (path == null || path.isBlank()) {
            throw new NotFoundException("등록된 사업자등록증 파일이 없습니다.");
        }
        try {
            Resource resource = fileStorageService.loadBusinessRegistration(path);
            if (resource == null) {
                log.warn("사업자등록증 파일 로드 실패: shelterId={}, path={}", id, path);
                throw new NotFoundException("파일을 찾을 수 없습니다. 업로드 디렉터리(file.upload-dir) 또는 서버 실행 경로를 확인하세요.");
            }
            String filename = path.contains("/") ? path.substring(path.lastIndexOf('/') + 1) : path;
            String contentType = getContentType(filename);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (IOException e) {
            log.warn("사업자등록증 파일 읽기 오류: shelterId={}, path={}", id, path, e);
            throw new NotFoundException("사업자등록증 파일을 읽는 중 오류가 발생했습니다. 파일 경로 또는 권한을 확인하세요.");
        } catch (IllegalArgumentException e) {
            log.warn("사업자등록증 경로 오류: shelterId={}, path={}", id, path, e);
            throw new NotFoundException("잘못된 파일 경로입니다.");
        }
    }

    private static String getContentType(String filename) {
        if (filename == null) return "application/octet-stream";
        String lower = filename.toLowerCase();
        if (lower.endsWith(".pdf")) return "application/pdf";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".png")) return "image/png";
        return "application/octet-stream";
    }
}
