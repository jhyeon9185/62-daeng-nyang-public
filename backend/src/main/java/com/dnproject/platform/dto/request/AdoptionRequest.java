package com.dnproject.platform.dto.request;

import com.dnproject.platform.domain.constant.AdoptionType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdoptionRequest {

    @NotNull(message = "동물 ID는 필수입니다")
    private Long animalId;

    @NotNull(message = "신청 유형은 필수입니다")
    private AdoptionType type;

    private String reason;
    private String experience;
    private String livingEnv;

    @NotNull(message = "가족 동의 여부는 필수입니다")
    private Boolean familyAgreement;
}
