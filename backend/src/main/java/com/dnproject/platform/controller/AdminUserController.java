package com.dnproject.platform.controller;

import com.dnproject.platform.domain.constant.Role;
import com.dnproject.platform.dto.response.ApiResponse;
import com.dnproject.platform.dto.response.PageResponse;
import com.dnproject.platform.dto.response.UserResponse;
import com.dnproject.platform.repository.UserRepository;
import com.dnproject.platform.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 시스템 관리자 전용 - 회원 목록 조회
 */
@Tag(name = "Admin - User", description = "관리자 회원 API")
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

        private final UserRepository userRepository;
        private final AuthService authService;

        @Operation(summary = "회원 목록 조회 (페이지, 역할 필터)")
        @GetMapping
        public ApiResponse<PageResponse<UserResponse>> list(
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size,
                        @RequestParam(required = false) Role role) {
                Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
                var userPage = role != null
                                ? userRepository.findByRoleOrderByCreatedAtDesc(role, pageable)
                                : userRepository.findAll(pageable);
                List<UserResponse> content = userPage.getContent().stream()
                                .map(authService::toUserResponse)
                                .toList();
                PageResponse<UserResponse> data = PageResponse.<UserResponse>builder()
                                .content(content)
                                .page(userPage.getNumber())
                                .size(userPage.getSize())
                                .totalElements(userPage.getTotalElements())
                                .totalPages(userPage.getTotalPages())
                                .first(userPage.isFirst())
                                .last(userPage.isLast())
                                .build();
                return ApiResponse.success("조회 성공", data);
        }

        @Operation(summary = "회원 강제 탈퇴 (슈퍼관리자)")
        @DeleteMapping("/{userId}")
        public ApiResponse<Void> deleteUser(@PathVariable Long userId) {
                userRepository.deleteById(userId);
                return ApiResponse.success("회원이 성공적으로 탈퇴 처리되었습니다.", null);
        }
}
