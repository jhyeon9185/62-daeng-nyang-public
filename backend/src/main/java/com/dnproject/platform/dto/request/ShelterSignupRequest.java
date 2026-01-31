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
public class ShelterSignupRequest {

    @NotBlank(message = "이메일은 필수입니다")
    @Email
    private String email;

    @NotBlank(message = "비밀번호는 필수입니다")
    @Size(min = 8)
    private String password;

    /** 담당자 이름 */
    @NotBlank(message = "담당자 이름은 필수입니다")
    @Size(max = 50)
    private String managerName;

    @NotBlank(message = "담당자 연락처는 필수입니다")
    @Size(max = 20)
    private String managerPhone;

    @NotBlank(message = "보호소명은 필수입니다")
    @Size(max = 100)
    private String shelterName;

    @NotBlank(message = "보호소 주소는 필수입니다")
    @Size(max = 255)
    private String address;

    @NotBlank(message = "보호소 전화번호는 필수입니다")
    @Size(max = 20)
    private String shelterPhone;

    /** 사업자등록번호 (10자리, 하이픈 제외) */
    @Size(max = 20)
    private String businessRegistrationNumber;

    /** 사업자등록증 파일 저장 경로 (업로드 후 서버가 설정) */
    @Size(max = 500)
    private String businessRegistrationFile;
}
