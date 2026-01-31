package com.dnproject.platform.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateMeRequest {

    @Size(max = 50, message = "이름은 50자 이하여야 합니다")
    private String name;

    @Email(message = "올바른 이메일 형식이 아닙니다")
    @Size(max = 100)
    private String email;
}
