package com.dnproject.platform.dto.publicapi;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * 공공데이터포털 - 보호소 조회 API 항목
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ShelterItem {

    @JsonProperty("careRegNo")
    private String careRegNo;         // 보호소 등록번호

    @JsonProperty("careNm")
    private String careNm;             // 보호소명

    @JsonProperty("careAddr")
    private String careAddr;           // 주소

    @JsonProperty("careTel")
    private String careTel;            // 전화번호

    @JsonProperty("lat")
    private String lat;

    @JsonProperty("lng")
    private String lng;
}
