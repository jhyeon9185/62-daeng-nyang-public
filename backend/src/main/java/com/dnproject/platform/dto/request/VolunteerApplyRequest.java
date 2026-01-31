package com.dnproject.platform.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VolunteerApplyRequest {

    @NotNull(message = "모집공고 ID는 필수입니다")
    private Long recruitmentId;

    @NotBlank(message = "신청자 이름은 필수입니다")
    private String applicantName;

    private String applicantPhone;
    private String applicantEmail;

    /** 활동 지역 (미입력 시 서비스에서 빈 문자열로 저장) */
    private String activityRegion;

    @NotBlank(message = "활동 분야는 필수입니다")
    private String activityField;

    @NotNull(message = "희망 시작일은 필수입니다")
    private LocalDate startDate;

    private LocalDate endDate;

    /** 신청 인원 (몇 명이 함께 봉사할지, 미입력 시 1) */
    private Integer participantCount;

    /** 신청 내용 (하고 싶은 말, 메모) */
    private String message;
}
