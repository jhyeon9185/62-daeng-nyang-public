---
name: public-api
description: Integrates with Korean public data APIs for animal shelter data. Use when syncing animal data from government APIs. Keywords: public api, 공공데이터, 동물보호, sync, api integration.
---

# Public API Integration (공공데이터 API)

## Purpose
Integrate with Korean public data APIs:
- 유기동물 정보 조회
- 보호소 정보 조회
- 데이터 동기화

## API Overview

### 농림축산식품부 - 유기동물 조회 서비스
- **Base URL**: `http://apis.data.go.kr/1543061/abandonmentPublicSrvc`
- **Documentation**: https://www.data.go.kr/tcs/dss/selectApiDataDetailView.do?publicDataPk=15098931

### Available Endpoints
1. `abandonmentPublic` - 유기동물 조회
2. `shelter` - 보호소 조회
3. `sido` - 시도 조회
4. `sigungu` - 시군구 조회
5. `kind` - 품종 조회

## Public API Client
Location: `backend/src/main/java/com/dnproject/platform/service/PublicApiService.java`

```java
package com.dnproject.platform.service;

import com.dnproject.platform.dto.publicapi.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PublicApiService {

    private final WebClient webClient;

    @Value("${public-api.service-key}")
    private String serviceKey;

    private static final String BASE_URL = "http://apis.data.go.kr/1543061/abandonmentPublicSrvc";
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd");

    /**
     * 유기동물 목록 조회
     */
    public PublicApiResponse<AnimalItem> getAbandonedAnimals(
            String uprCd,          // 시도 코드
            String orgCd,          // 시군구 코드
            String upkind,         // 축종 코드 (417000: 개, 422400: 고양이)
            String state,          // 상태 (notice: 공고중, protect: 보호중)
            LocalDate bgnde,       // 검색 시작일
            LocalDate endde,       // 검색 종료일
            int pageNo,
            int numOfRows) {

        String uri = UriComponentsBuilder.fromHttpUrl(BASE_URL + "/abandonmentPublic")
                .queryParam("serviceKey", serviceKey)
                .queryParam("uprCd", uprCd)
                .queryParam("orgCd", orgCd)
                .queryParam("upkind", upkind)
                .queryParam("state", state)
                .queryParam("bgnde", bgnde != null ? bgnde.format(DATE_FORMAT) : null)
                .queryParam("endde", endde != null ? endde.format(DATE_FORMAT) : null)
                .queryParam("pageNo", pageNo)
                .queryParam("numOfRows", numOfRows)
                .queryParam("_type", "json")
                .build()
                .toUriString();

        log.info("Fetching abandoned animals from: {}", uri);

        return webClient.get()
                .uri(uri)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<PublicApiResponse<AnimalItem>>() {})
                .block();
    }

    /**
     * 보호소 목록 조회
     */
    public PublicApiResponse<ShelterItem> getShelters(String uprCd, String orgCd) {
        String uri = UriComponentsBuilder.fromHttpUrl(BASE_URL + "/shelter")
                .queryParam("serviceKey", serviceKey)
                .queryParam("upr_cd", uprCd)
                .queryParam("org_cd", orgCd)
                .queryParam("_type", "json")
                .build()
                .toUriString();

        log.info("Fetching shelters from: {}", uri);

        return webClient.get()
                .uri(uri)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<PublicApiResponse<ShelterItem>>() {})
                .block();
    }

    /**
     * 시도 코드 조회
     */
    public PublicApiResponse<SidoItem> getSido() {
        String uri = UriComponentsBuilder.fromHttpUrl(BASE_URL + "/sido")
                .queryParam("serviceKey", serviceKey)
                .queryParam("_type", "json")
                .build()
                .toUriString();

        return webClient.get()
                .uri(uri)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<PublicApiResponse<SidoItem>>() {})
                .block();
    }

    /**
     * 시군구 코드 조회
     */
    public PublicApiResponse<SigunguItem> getSigungu(String uprCd) {
        String uri = UriComponentsBuilder.fromHttpUrl(BASE_URL + "/sigungu")
                .queryParam("serviceKey", serviceKey)
                .queryParam("upr_cd", uprCd)
                .queryParam("_type", "json")
                .build()
                .toUriString();

        return webClient.get()
                .uri(uri)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<PublicApiResponse<SigunguItem>>() {})
                .block();
    }

    /**
     * 품종 코드 조회
     */
    public PublicApiResponse<KindItem> getKinds(String upkind) {
        String uri = UriComponentsBuilder.fromHttpUrl(BASE_URL + "/kind")
                .queryParam("serviceKey", serviceKey)
                .queryParam("up_kind_cd", upkind)  // 417000: 개, 422400: 고양이
                .queryParam("_type", "json")
                .build()
                .toUriString();

        return webClient.get()
                .uri(uri)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<PublicApiResponse<KindItem>>() {})
                .block();
    }
}
```

## DTO Classes

### AnimalItem.java
```java
package com.dnproject.platform.dto.publicapi;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class AnimalItem {
    private String desertionNo;       // 유기번호
    private String filename;          // 이미지
    private String happenDt;          // 접수일
    private String happenPlace;       // 발견장소
    private String kindCd;            // 품종
    private String colorCd;           // 색상
    private String age;               // 나이
    private String weight;            // 체중
    private String noticeNo;          // 공고번호
    private String noticeSdt;         // 공고시작일
    private String noticeEdt;         // 공고종료일
    private String popfile;           // 이미지 (팝업)
    private String processState;      // 상태 (보호중, 입양완료 등)
    private String sexCd;             // 성별 (M, F, Q)
    private String neuterYn;          // 중성화 여부 (Y, N, U)
    private String specialMark;       // 특징
    private String careNm;            // 보호소명
    private String careTel;           // 보호소 전화번호
    private String careAddr;          // 보호소 주소
    private String orgNm;             // 관할기관
    private String chargeNm;          // 담당자
    private String officetel;         // 담당자 연락처
}
```

### ShelterItem.java
```java
package com.dnproject.platform.dto.publicapi;

import lombok.Data;

@Data
public class ShelterItem {
    private String careRegNo;         // 보호소 등록번호
    private String careNm;            // 보호소명
    private String orgNm;             // 관할기관명
    private String divisionNm;        // 관할기관 부서명
    private String saveTrgtAnimal;    // 구조대상동물
    private String careAddr;          // 보호소 주소
    private String jibunAddr;         // 지번주소
    private String lat;               // 위도
    private String lng;               // 경도
    private String dsignationDate;    // 지정일자
    private String weekOprStime;      // 평일 운영시작
    private String weekOprEtime;      // 평일 운영종료
    private String weekCellStime;     // 평일 분양시작
    private String weekCellEtime;     // 평일 분양종료
    private String weekendOprStime;   // 주말 운영시작
    private String weekendOprEtime;   // 주말 운영종료
    private String weekendCellStime;  // 주말 분양시작
    private String weekendCellEtime;  // 주말 분양종료
    private String closeDay;          // 휴무일
    private String vetPersonCnt;      // 수의사 수
    private String specsPersonCnt;    // 사양관리사 수
    private String medicalCnt;        // 진료실 수
    private String breedCnt;          // 사육실 수
    private String quarabtineCnt;     // 격리실 수
    private String feedCnt;           // 사료보관실 수
    private String transCarCnt;       // 구조운반차량 수
    private String careTel;           // 보호소 전화번호
    private String dataStdDt;         // 데이터 기준일자
}
```

## Data Sync Service
Location: `backend/src/main/java/com/dnproject/platform/service/AnimalSyncService.java`

```java
package com.dnproject.platform.service;

import com.dnproject.platform.domain.*;
import com.dnproject.platform.dto.publicapi.*;
import com.dnproject.platform.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnimalSyncService {

    private final PublicApiService publicApiService;
    private final AnimalRepository animalRepository;
    private final ShelterRepository shelterRepository;

    /**
     * 매일 새벽 2시에 유기동물 데이터 동기화
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void syncAnimals() {
        log.info("Starting animal data sync...");

        try {
            // 최근 7일간의 데이터 조회
            LocalDate endDate = LocalDate.now();
            LocalDate startDate = endDate.minusDays(7);

            // 개 데이터 동기화
            syncAnimalsByType("417000", startDate, endDate);

            // 고양이 데이터 동기화
            syncAnimalsByType("422400", startDate, endDate);

            log.info("Animal data sync completed successfully");
        } catch (Exception e) {
            log.error("Animal data sync failed", e);
        }
    }

    private void syncAnimalsByType(String upkind, LocalDate startDate, LocalDate endDate) {
        int pageNo = 1;
        int numOfRows = 100;
        boolean hasMore = true;

        while (hasMore) {
            PublicApiResponse<AnimalItem> response = publicApiService.getAbandonedAnimals(
                    null, null, upkind, "protect", startDate, endDate, pageNo, numOfRows);

            if (response != null && response.getBody() != null && response.getBody().getItems() != null) {
                List<AnimalItem> items = response.getBody().getItems().getItem();

                for (AnimalItem item : items) {
                    upsertAnimal(item);
                }

                int totalCount = response.getBody().getTotalCount();
                hasMore = pageNo * numOfRows < totalCount;
                pageNo++;
            } else {
                hasMore = false;
            }
        }
    }

    @Transactional
    public void upsertAnimal(AnimalItem item) {
        // 기존 데이터 확인
        Animal existing = animalRepository.findByPublicApiAnimalId(item.getDesertionNo())
                .orElse(null);

        if (existing != null) {
            // 업데이트
            updateAnimalFromApi(existing, item);
        } else {
            // 신규 생성
            createAnimalFromApi(item);
        }
    }

    private void updateAnimalFromApi(Animal animal, AnimalItem item) {
        animal.setImageUrl(item.getPopfile());
        animal.setStatus(mapStatus(item.getProcessState()));
        // 기타 필드 업데이트...
        animalRepository.save(animal);
    }

    private void createAnimalFromApi(AnimalItem item) {
        // 보호소 찾기 또는 생성
        Shelter shelter = findOrCreateShelter(item);

        Animal animal = Animal.builder()
                .publicApiAnimalId(item.getDesertionNo())
                .shelter(shelter)
                .species(mapSpecies(item.getKindCd()))
                .breed(extractBreed(item.getKindCd()))
                .name(generateName(item))
                .age(parseAge(item.getAge()))
                .gender(mapGender(item.getSexCd()))
                .size(estimateSize(item.getWeight()))
                .weight(parseWeight(item.getWeight()))
                .description(item.getSpecialMark())
                .neutered("Y".equals(item.getNeuterYn()))
                .imageUrl(item.getPopfile())
                .status(mapStatus(item.getProcessState()))
                .build();

        animalRepository.save(animal);
    }

    private Shelter findOrCreateShelter(AnimalItem item) {
        // 보호소명으로 검색
        return shelterRepository.findByName(item.getCareNm())
                .orElseGet(() -> createShelterFromApi(item));
    }

    private Shelter createShelterFromApi(AnimalItem item) {
        Shelter shelter = Shelter.builder()
                .name(item.getCareNm())
                .address(item.getCareAddr())
                .phone(item.getCareTel())
                .managerName("관리자")
                .managerPhone(item.getCareTel())
                .verificationStatus(VerificationStatus.APPROVED) // 공공API 출처는 자동 승인
                .build();

        return shelterRepository.save(shelter);
    }

    // Helper methods
    private Species mapSpecies(String kindCd) {
        return kindCd.contains("[개]") ? Species.DOG : Species.CAT;
    }

    private String extractBreed(String kindCd) {
        // "[개] 믹스견" -> "믹스견"
        return kindCd.replaceAll("\\[.*?\\]\\s*", "");
    }

    private Gender mapGender(String sexCd) {
        return switch (sexCd) {
            case "M" -> Gender.MALE;
            case "F" -> Gender.FEMALE;
            default -> null;
        };
    }

    private AnimalStatus mapStatus(String processState) {
        return switch (processState) {
            case "보호중" -> AnimalStatus.PROTECTED;
            case "입양" -> AnimalStatus.ADOPTED;
            case "임시보호" -> AnimalStatus.FOSTERING;
            default -> AnimalStatus.PROTECTED;
        };
    }

    private Integer parseAge(String age) {
        // "2022(년생)" -> 계산
        try {
            int birthYear = Integer.parseInt(age.replaceAll("[^0-9]", ""));
            return LocalDate.now().getYear() - birthYear;
        } catch (Exception e) {
            return null;
        }
    }

    private java.math.BigDecimal parseWeight(String weight) {
        try {
            return new java.math.BigDecimal(weight.replaceAll("[^0-9.]", ""));
        } catch (Exception e) {
            return null;
        }
    }

    private Size estimateSize(String weight) {
        try {
            double w = Double.parseDouble(weight.replaceAll("[^0-9.]", ""));
            if (w < 5) return Size.SMALL;
            if (w < 15) return Size.MEDIUM;
            return Size.LARGE;
        } catch (Exception e) {
            return Size.MEDIUM;
        }
    }

    private String generateName(AnimalItem item) {
        // 품종과 번호로 임시 이름 생성
        String breed = extractBreed(item.getKindCd());
        return breed + "-" + item.getDesertionNo().substring(item.getDesertionNo().length() - 4);
    }
}
```

## Configuration

```yaml
# application.yml
public-api:
  service-key: ${PUBLIC_API_SERVICE_KEY}

# WebClient 설정
spring:
  webflux:
    base-path: /

# Scheduler 활성화
  task:
    scheduling:
      pool:
        size: 2
```

## WebClient Configuration
```java
package com.dnproject.platform.config;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Configuration
public class WebClientConfig {

    @Bean
    public WebClient webClient() {
        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 5000)
                .responseTimeout(Duration.ofSeconds(30))
                .doOnConnected(conn ->
                        conn.addHandlerLast(new ReadTimeoutHandler(30, TimeUnit.SECONDS))
                            .addHandlerLast(new WriteTimeoutHandler(30, TimeUnit.SECONDS)));

        return WebClient.builder()
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build();
    }
}
```
