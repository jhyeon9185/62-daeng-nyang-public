package com.dnproject.platform.domain;

import com.dnproject.platform.domain.constant.VerificationStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "shelters", indexes = {
    @Index(name = "idx_shelters_name", columnList = "name"),
    @Index(name = "idx_shelters_business_reg", columnList = "business_registration_number"),
    @Index(name = "idx_shelters_verification", columnList = "verification_status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shelter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 255)
    private String address;

    /** 주소에서 파싱한 시·도 (필터 정확 매칭용, 예: 서울, 경기) */
    @Column(name = "region_sido", length = 20)
    private String regionSido;

    /** 주소에서 파싱한 시·군·구 (필터 정확 매칭용, 예: 강남구, 남양주시) */
    @Column(name = "region_sigungu", length = 30)
    private String regionSigungu;

    private BigDecimal latitude;
    private BigDecimal longitude;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(length = 100)
    private String email;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private User manager;

    @Column(name = "manager_name", nullable = false, length = 50)
    private String managerName;

    @Column(name = "manager_phone", nullable = false, length = 20)
    private String managerPhone;

    @Column(name = "business_registration_number", unique = true, length = 20)
    private String businessRegistrationNumber;

    @Column(name = "business_registration_file", length = 500)
    private String businessRegistrationFile;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false, length = 20)
    @Builder.Default
    private VerificationStatus verificationStatus = VerificationStatus.PENDING;

    @Column(name = "public_api_shelter_id", length = 50)
    private String publicApiShelterId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
