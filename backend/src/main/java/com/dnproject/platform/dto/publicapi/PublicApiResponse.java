package com.dnproject.platform.dto.publicapi;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * 공공데이터포털 API 공통 응답 래퍼
 * 예: { "response": { "body": { "items": { "item": [...] }, "totalCount": 123 } } }
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class PublicApiResponse {

    @JsonProperty("response")
    private ResponseWrapper response;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ResponseWrapper {
        @JsonProperty("body")
        private BodyWrapper body;
        @JsonProperty("header")
        private HeaderWrapper header;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class BodyWrapper {
        @JsonProperty("items")
        private ItemsWrapper items;
        @JsonProperty("totalCount")
        private Integer totalCount;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ItemsWrapper {
        @JsonProperty("item")
        private Object item; // 단일 객체 또는 배열 - PublicApiService에서 List로 변환
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class HeaderWrapper {
        @JsonProperty("resultCode")
        private String resultCode;
        @JsonProperty("resultMsg")
        private String resultMsg;
    }
}
