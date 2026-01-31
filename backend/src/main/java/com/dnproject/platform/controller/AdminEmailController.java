package com.dnproject.platform.controller;

import com.dnproject.platform.domain.User;
import com.dnproject.platform.dto.request.TestEmailRequest;
import com.dnproject.platform.dto.response.ApiResponse;
import com.dnproject.platform.exception.CustomException;
import com.dnproject.platform.exception.NotFoundException;
import com.dnproject.platform.exception.UnauthorizedException;
import com.dnproject.platform.repository.UserRepository;
import com.dnproject.platform.service.EmailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * 관리자 전용 - 이메일 테스트 발송 (Resend 설정 확인용)
 */
@Tag(name = "Admin - Email", description = "관리자 이메일 테스트 API")
@RestController
@RequestMapping("/api/admin/email")
@RequiredArgsConstructor
public class AdminEmailController {

    private final EmailService emailService;
    private final UserRepository userRepository;

    @Operation(summary = "테스트 이메일 발송", description = "Resend를 통해 테스트 메일을 발송합니다. body.to 미입력 시 로그인한 관리자 이메일로 발송.")
    @PostMapping("/test")
    public ApiResponse<String> sendTestEmail(
            HttpServletRequest request,
            @RequestBody(required = false) TestEmailRequest body) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) throw new UnauthorizedException("인증이 필요합니다.");

        String toEmail = (body != null && body.getTo() != null && !body.getTo().isBlank())
                ? body.getTo().trim()
                : null;
        if (toEmail == null) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다."));
            toEmail = user.getEmail();
        }
        if (toEmail == null || toEmail.isBlank()) {
            throw new CustomException("수신 이메일을 지정해 주세요. (body.to 또는 로그인 계정 이메일)", HttpStatus.BAD_REQUEST, "INVALID_REQUEST");
        }

        emailService.sendTestEmail(toEmail);
        return ApiResponse.success("테스트 메일을 발송했습니다. " + toEmail + " 메일함을 확인해 주세요.", toEmail);
    }
}
