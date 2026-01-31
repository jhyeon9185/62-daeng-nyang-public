package com.dnproject.platform.dto.response;

import com.dnproject.platform.domain.constant.AdoptionStatus;
import com.dnproject.platform.domain.constant.AdoptionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdoptionResponse {

    private Long id;
    private Long userId;
    private Long animalId;
    private String applicantName;
    private String animalName;
    private AdoptionType type;
    private AdoptionStatus status;
    private String reason;
    private String experience;
    private String livingEnv;
    private Instant createdAt;
}
