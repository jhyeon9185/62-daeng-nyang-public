package com.dnproject.platform.dto.response;

import com.dnproject.platform.domain.constant.RecruitmentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VolunteerRecruitmentResponse {

    private Long id;
    private Long shelterId;
    private String shelterName;
    private String title;
    private String content;
    private Integer maxApplicants;
    private LocalDate deadline;
    private RecruitmentStatus status;
    private Instant createdAt;
}
