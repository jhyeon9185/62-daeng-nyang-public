package com.dnproject.platform.repository;

import com.dnproject.platform.domain.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByUser_IdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    long countByUser_IdAndIsReadFalse(Long userId);

    boolean existsByIdAndUser_Id(Long id, Long userId);
}
