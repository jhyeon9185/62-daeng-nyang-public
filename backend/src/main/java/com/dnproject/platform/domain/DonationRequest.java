package com.dnproject.platform.domain;

import com.dnproject.platform.domain.constant.RequestStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "donation_requests", indexes = {
    @Index(name = "idx_donation_requests_shelter", columnList = "shelter_id"),
    @Index(name = "idx_donation_requests_status", columnList = "status"),
    @Index(name = "idx_donation_requests_deadline", columnList = "deadline")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DonationRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shelter_id", nullable = false)
    private Shelter shelter;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "item_category", nullable = false, length = 50)
    private String itemCategory;

    @Column(name = "target_quantity", nullable = false)
    private Integer targetQuantity;

    @Column(name = "current_quantity", nullable = false)
    @Builder.Default
    private Integer currentQuantity = 0;

    @Column(nullable = false)
    private LocalDate deadline;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private RequestStatus status = RequestStatus.OPEN;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }
}
