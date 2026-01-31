package com.dnproject.platform.dto.response;

import com.dnproject.platform.domain.constant.VerificationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShelterResponse {

    private Long id;
    private String name;
    private String address;
    private String phone;
    private String email;
    private Long managerId;
    private String managerName;
    private String managerPhone;
    private String businessRegistrationNumber;
    private String businessRegistrationFile;
    private VerificationStatus verificationStatus;
    private Instant createdAt;
}
