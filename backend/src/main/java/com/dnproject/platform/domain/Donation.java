package com.dnproject.platform.domain;

import com.dnproject.platform.domain.constant.DonationStatus;
import com.dnproject.platform.domain.constant.DonationType;
import com.dnproject.platform.domain.constant.DonorType;
import com.dnproject.platform.domain.constant.PaymentMethod;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "donations", indexes = {
    @Index(name = "idx_donations_user", columnList = "user_id"),
    @Index(name = "idx_donations_shelter", columnList = "shelter_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Donation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shelter_id")
    private Shelter shelter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id")
    private DonationRequest request;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id")
    private Board board;

    @Column(name = "donor_name", nullable = false, length = 50)
    private String donorName;

    @Column(name = "donor_birthdate")
    private LocalDate donorBirthdate;

    @Column(name = "donor_phone", nullable = false, length = 20)
    private String donorPhone;

    @Column(name = "donor_email", nullable = false, length = 100)
    private String donorEmail;

    @Enumerated(EnumType.STRING)
    @Column(name = "donor_type", nullable = false, length = 20)
    @Builder.Default
    private DonorType donorType = DonorType.INDIVIDUAL;

    @Enumerated(EnumType.STRING)
    @Column(name = "donation_type", nullable = false, length = 20)
    private DonationType donationType;

    @Column(name = "donation_category", nullable = false, length = 50)
    private String donationCategory;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 20)
    private PaymentMethod paymentMethod;

    @Column(name = "receipt_requested", nullable = false)
    @Builder.Default
    private Boolean receiptRequested = false;

    @Column(name = "resident_registration_number", length = 20)
    private String residentRegistrationNumber;

    @Column(name = "newsletter_consent", nullable = false)
    @Builder.Default
    private Boolean newsletterConsent = false;

    @Column(name = "item_name", length = 100)
    private String itemName;

    @Column(name = "quantity")
    private Integer quantity;

    @Column(name = "delivery_method", length = 50)
    private String deliveryMethod;

    @Column(name = "tracking_number", length = 50)
    private String trackingNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private DonationStatus status = DonationStatus.PENDING;

    @Column(name = "reject_reason", columnDefinition = "TEXT")
    private String rejectReason;

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
