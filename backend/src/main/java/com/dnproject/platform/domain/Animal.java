package com.dnproject.platform.domain;

import com.dnproject.platform.domain.constant.AnimalStatus;
import com.dnproject.platform.domain.constant.Gender;
import com.dnproject.platform.domain.constant.Size;
import com.dnproject.platform.domain.constant.Species;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "animals", indexes = {
    @Index(name = "idx_animals_species", columnList = "species"),
    @Index(name = "idx_animals_status", columnList = "status"),
    @Index(name = "idx_animals_shelter", columnList = "shelter_id"),
    @Index(name = "idx_animals_public_api_id", columnList = "public_api_animal_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Animal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shelter_id", nullable = false)
    private Shelter shelter;

    @Column(name = "public_api_animal_id", length = 50)
    private String publicApiAnimalId;

    /** 관할기관 (공공 API orgNm) */
    @Column(name = "org_name", length = 100)
    private String orgName;
    /** 담당자 (공공 API chargeNm) */
    @Column(name = "charge_name", length = 50)
    private String chargeName;
    /** 담당자 연락처 (공공 API officetel) */
    @Column(name = "charge_phone", length = 30)
    private String chargePhone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Species species;

    @Column(length = 50)
    private String breed;

    @Column(length = 50)
    private String name;

    private Integer age;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private Gender gender;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private Size size;

    @Column(precision = 5, scale = 2)
    private BigDecimal weight;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 100)
    private String temperament;

    @Column(name = "health_status", length = 255)
    private String healthStatus;

    @Column(nullable = false)
    @Builder.Default
    private Boolean neutered = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean vaccinated = false;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private AnimalStatus status = AnimalStatus.PROTECTED;

    @Column(name = "register_date")
    private LocalDate registerDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "animal", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<AnimalImage> images = new ArrayList<>();

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
