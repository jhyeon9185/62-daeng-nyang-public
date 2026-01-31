package com.dnproject.platform.dto.publicapi;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * 공공데이터포털 - 유기동물 조회 API 항목
 * API: 국가동물보호정보시스템 구조동물조회서비스
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class AnimalItem {

    @JsonProperty("desertionNo")
    private String desertionNo;       // 유기번호

    @JsonProperty("filename")
    @JsonAlias({"Filename", "FILENAME"})
    private String filename;          // 썸네일 (구 API)

    @JsonProperty("popfile")
    @JsonAlias({"Popfile", "POPFILE", "popFile"})
    private String popfile;            // 상세 이미지 (구 API)

    @JsonProperty("popfile1")
    @JsonAlias("popFile1")
    private String popfile1;           // 이미지1 (실제 API 필드)

    @JsonProperty("popfile2")
    @JsonAlias("popFile2")
    private String popfile2;           // 이미지2

    @JsonProperty("happenDt")
    private String happenDt;           // 접수일

    @JsonProperty("happenPlace")
    private String happenPlace;        // 발견장소

    @JsonProperty("kindCd")
    private String kindCd;             // 품종코드 (예: 000114)

    @JsonProperty("kindNm")
    private String kindNm;             // 품종명 (예: 믹스견)

    @JsonProperty("kindFullNm")
    private String kindFullNm;         // 품종 전체 (예: [개] 믹스견)

    @JsonProperty("upKindCd")
    private String upKindCd;           // 축종코드 417000=개, 422400=고양이 (종 구분용)

    @JsonProperty("colorCd")
    private String colorCd;            // 색상

    @JsonProperty("age")
    private String age;                // 나이 (예: 2022(년생))

    @JsonProperty("weight")
    private String weight;             // 체중

    @JsonProperty("noticeNo")
    private String noticeNo;           // 공고번호

    @JsonProperty("noticeSdt")
    private String noticeSdt;          // 공고시작일

    @JsonProperty("noticeEdt")
    private String noticeEdt;          // 공고종료일

    @JsonProperty("processState")
    private String processState;       // 상태 (보호중, 입양 등)

    @JsonProperty("sexCd")
    private String sexCd;              // 성별 (M, F, Q)

    @JsonProperty("neuterYn")
    private String neuterYn;           // 중성화 여부 (Y, N, U)

    @JsonProperty("specialMark")
    private String specialMark;         // 특징

    @JsonProperty("careNm")
    private String careNm;              // 보호소명

    @JsonProperty("careTel")
    private String careTel;             // 보호소 전화번호

    @JsonProperty("careAddr")
    private String careAddr;            // 보호소 주소

    @JsonProperty("orgNm")
    private String orgNm;               // 관할기관

    @JsonProperty("chargeNm")
    private String chargeNm;            // 담당자

    @JsonProperty("officetel")
    private String officetel;           // 담당자 연락처
}
