package com.dnproject.platform.domain;

import com.dnproject.platform.domain.constant.ActivityCycle;
import com.dnproject.platform.domain.constant.VolunteerStatus;
import com.dnproject.platform.domain.constant.VolunteerType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "volunteers", indexes = {
    @Index(name = "idx_volunteers_user", columnList = "user_id"),
    @Index(name = "idx_volunteers_shelter", columnList = "shelter_id"),
    @Index(name = "idx_volunteers_date", columnList = "volunteer_date_start")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Volunteer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shelter_id", nullable = false)
    private Shelter shelter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recruitment_id")
    private VolunteerRecruitment recruitment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id")
    private Board board;

    @Column(name = "applicant_name", nullable = false, length = 50)
    private String applicantName;

    @Column(name = "applicant_phone", nullable = false, length = 20)
    private String applicantPhone;

    @Column(name = "applicant_email", nullable = false, length = 100)
    private String applicantEmail;

    @Column(name = "activity_region", nullable = false, length = 100)
    private String activityRegion;

    @Column(name = "activity_field", nullable = false, length = 50)
    private String activityField;

    @Column(name = "volunteer_date_start", nullable = false)
    private LocalDate volunteerDateStart;

    @Column(name = "volunteer_date_end")
    private LocalDate volunteerDateEnd;

    @Enumerated(EnumType.STRING)
    @Column(name = "activity_cycle", nullable = false, length = 20)
    private ActivityCycle activityCycle;

    @Column(name = "preferred_time_slot", length = 50)
    private String preferredTimeSlot;

    @Enumerated(EnumType.STRING)
    @Column(name = "volunteer_type", nullable = false, length = 20)
    @Builder.Default
    private VolunteerType volunteerType = VolunteerType.INDIVIDUAL;

    @Column(columnDefinition = "TEXT")
    private String experience;

    @Column(name = "special_notes", columnDefinition = "TEXT")
    private String specialNotes;

    @Column(name = "participant_count")
    @Builder.Default
    private Integer participantCount = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private VolunteerStatus status = VolunteerStatus.PENDING;

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
