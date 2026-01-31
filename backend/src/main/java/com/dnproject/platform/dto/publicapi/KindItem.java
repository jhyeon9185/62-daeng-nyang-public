package com.dnproject.platform.dto.publicapi;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * 공공데이터포털 - 품종 조회 API 항목
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class KindItem {

    @JsonProperty("kindCd")
    @JsonAlias({"kind_cd", "KindCd"})
    private String kindCd;   // 품종코드 (예: 000114)

    @JsonProperty("kNm")
    @JsonAlias({"KNm", "kindNm", "kind_name"})
    private String kNm;      // 품종명 (예: 믹스견)
}
