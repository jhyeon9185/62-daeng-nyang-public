package com.dnproject.platform.dto.response;

import com.dnproject.platform.domain.constant.AnimalStatus;
import com.dnproject.platform.domain.constant.Gender;
import com.dnproject.platform.domain.constant.Size;
import com.dnproject.platform.domain.constant.Species;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnimalResponse {

    private Long id;
    /** 공공 API 유기번호 (보호소 전화 문의 시 식별용, desertionNo) */
    private String publicApiAnimalId;
    /** 관할기관 (공공 API orgNm) */
    private String orgName;
    /** 담당자 (공공 API chargeNm) */
    private String chargeName;
    /** 담당자 연락처 (공공 API officetel) */
    private String chargePhone;
    private Long shelterId;
    private String shelterName;
    /** 보호소 주소 (상세페이지·지도 표시용) */
    private String shelterAddress;
    /** 보호소 전화번호 */
    private String shelterPhone;
    /** 보호소 위도 (지도 마커용, 없으면 주소로 검색) */
    private Double shelterLatitude;
    /** 보호소 경도 */
    private Double shelterLongitude;
    private Species species;
    private String breed;
    private String name;
    private Integer age;
    private Gender gender;
    private Size size;
    private String description;
    private String imageUrl;
    private Boolean neutered;
    private AnimalStatus status;
    private Instant createdAt;
}
