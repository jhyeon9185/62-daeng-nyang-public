package com.dnproject.platform.dto.response;

import com.dnproject.platform.domain.constant.VolunteerStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VolunteerResponse {

    private Long id;
    private Long recruitmentId;
    /** 어떤 모집공고에 대한 봉사 신청인지 - 제목 */
    private String recruitmentTitle;
    private String shelterName;
    private String applicantName;
    private String applicantPhone;
    private String applicantEmail;
    private String activityRegion;
    private String activityField;
    private String startDate;
    private String endDate;
    /** 신청 인원 (몇 명이 함께 봉사할지) */
    private Integer participantCount;
    /** 신청 내용 (하고 싶은 말, 메모) */
    private String message;
    private VolunteerStatus status;
    private Instant createdAt;
}
