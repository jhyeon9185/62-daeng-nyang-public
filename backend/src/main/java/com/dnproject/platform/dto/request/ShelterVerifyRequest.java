package com.dnproject.platform.dto.request;

import com.dnproject.platform.domain.constant.VerificationStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShelterVerifyRequest {

    @NotNull(message = "승인 상태는 필수입니다 (APPROVED 또는 REJECTED)")
    private VerificationStatus status;

    private String rejectReason;
}
