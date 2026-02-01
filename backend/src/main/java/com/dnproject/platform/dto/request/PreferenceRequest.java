package com.dnproject.platform.dto.request;

import com.dnproject.platform.domain.constant.Size;
import com.dnproject.platform.domain.constant.Species;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PreferenceRequest {

    private Species species;
    private Integer minAge;
    private Integer maxAge;
    private Size size;
    /** 선호 지역 (시·도 단위, 예: 서울, 경기) */
    private String region;
}
