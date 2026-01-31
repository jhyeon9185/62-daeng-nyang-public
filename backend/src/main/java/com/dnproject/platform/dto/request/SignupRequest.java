package com.dnproject.platform.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignupRequest {

    @NotBlank(message = "이메일은 필수입니다")
    @Email
    private String email;

    @NotBlank(message = "비밀번호는 필수입니다")
    @Size(min = 8)
    private String password;

    @NotBlank(message = "이름은 필수입니다")
    @Size(max = 50)
    private String name;

    @Size(max = 20)
    private String phone;

    @Size(max = 255)
    private String address;
}
