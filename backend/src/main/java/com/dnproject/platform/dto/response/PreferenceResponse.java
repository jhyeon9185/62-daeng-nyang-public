package com.dnproject.platform.dto.response;

import com.dnproject.platform.domain.constant.Size;
import com.dnproject.platform.domain.constant.Species;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
}
