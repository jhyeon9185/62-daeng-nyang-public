package com.dnproject.platform.dto.response;

import com.dnproject.platform.domain.constant.Size;
import com.dnproject.platform.domain.constant.Species;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PreferenceResponse {

    private Long id;
    private Long userId;
    private Species species;
    private Integer minAge;
    private Integer maxAge;
    private Size size;
    /** 선호 지역 복수 (시·도 단위) */
    private List<String> regions;
}
