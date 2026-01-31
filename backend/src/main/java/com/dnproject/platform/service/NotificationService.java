package com.dnproject.platform.service;

import com.dnproject.platform.domain.Notification;
import com.dnproject.platform.domain.User;
import com.dnproject.platform.dto.response.NotificationResponse;
import com.dnproject.platform.dto.response.PageResponse;
import com.dnproject.platform.exception.CustomException;
import com.dnproject.platform.exception.NotFoundException;
import com.dnproject.platform.repository.NotificationRepository;
import com.dnproject.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public Notification create(Long userId, String type, String message, String relatedUrl) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다."));
        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .message(message)
                .relatedUrl(relatedUrl)
                .isRead(false)
                .build();
        return notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> getMyList(Long userId, int page, int size) {
        var pageable = PageRequest.of(page, size);
        var notifications = notificationRepository.findByUser_IdOrderByCreatedAtDesc(userId, pageable);
        List<NotificationResponse> content = notifications.stream().map(this::toResponse).toList();
        return PageResponse.<NotificationResponse>builder()
                .content(content)
                .page(notifications.getNumber())
                .size(notifications.getSize())
                .totalElements(notifications.getTotalElements())
                .totalPages(notifications.getTotalPages())
                .first(notifications.isFirst())
                .last(notifications.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUser_IdAndIsReadFalse(userId);
    }

    @Transactional
    public NotificationResponse markAsRead(Long id, Long userId) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("알림을 찾을 수 없습니다."));
        if (!notification.getUser().getId().equals(userId)) {
            throw new CustomException("본인의 알림만 읽음 처리할 수 있습니다.", HttpStatus.FORBIDDEN, "FORBIDDEN");
        }
        notification.setIsRead(true);
        notification = notificationRepository.save(notification);
        return toResponse(notification);
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .type(n.getType())
                .message(n.getMessage())
                .isRead(n.getIsRead())
                .relatedUrl(n.getRelatedUrl())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
