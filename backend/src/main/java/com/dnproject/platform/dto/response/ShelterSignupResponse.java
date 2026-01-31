package com.dnproject.platform.dto.response;

import com.dnproject.platform.domain.constant.VerificationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShelterSignupResponse {

    private Long userId;
    private Long shelterId;
    private VerificationStatus verificationStatus;
    private String message;
}
