package com.dnproject.platform.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class KakaoLoginRequest {

    @NotBlank(message = "카카오 인가 코드는 필수입니다")
    private String code;
}
