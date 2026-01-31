package com.dnproject.platform.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TestEmailRequest {

    /** 수신 이메일 (미입력 시 로그인한 관리자 이메일로 발송) */
    private String to;
}
