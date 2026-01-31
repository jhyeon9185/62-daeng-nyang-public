package com.dnproject.platform.controller;

import com.dnproject.platform.dto.response.ApiResponse;
import com.dnproject.platform.dto.response.NotificationResponse;
import com.dnproject.platform.dto.response.PageResponse;
import com.dnproject.platform.exception.UnauthorizedException;
import com.dnproject.platform.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "Notification", description = "알림 API")
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    private Long getUserId(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) throw new UnauthorizedException("인증이 필요합니다.");
        return userId;
    }

    @Operation(summary = "내 알림 목록")
    @GetMapping
    public ApiResponse<PageResponse<NotificationResponse>> getMyList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpServletRequest httpRequest) {
        Long userId = getUserId(httpRequest);
        PageResponse<NotificationResponse> data = notificationService.getMyList(userId, page, size);
        return ApiResponse.success("조회 성공", data);
    }

    @Operation(summary = "읽지 않은 알림 수")
    @GetMapping("/unread-count")
    public ApiResponse<Map<String, Long>> getUnreadCount(HttpServletRequest httpRequest) {
        Long userId = getUserId(httpRequest);
        long count = notificationService.getUnreadCount(userId);
        return ApiResponse.success("조회 성공", Map.of("unreadCount", count));
    }

    @Operation(summary = "알림 읽음 처리")
    @PutMapping("/{id}/read")
    public ApiResponse<NotificationResponse> markAsRead(@PathVariable Long id,
                                                         HttpServletRequest httpRequest) {
        Long userId = getUserId(httpRequest);
        NotificationResponse data = notificationService.markAsRead(id, userId);
        return ApiResponse.success("읽음 처리 완료", data);
    }
}
