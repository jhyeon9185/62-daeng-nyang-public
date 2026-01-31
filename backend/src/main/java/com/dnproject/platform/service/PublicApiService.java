package com.dnproject.platform.service;

import com.dnproject.platform.dto.publicapi.AnimalItem;
import com.dnproject.platform.dto.publicapi.KindItem;
import com.dnproject.platform.dto.publicapi.PublicApiResponse;
import com.dnproject.platform.dto.publicapi.ShelterItem;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

import jakarta.annotation.PostConstruct;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * 공공데이터포털 - 국가동물보호정보시스템 구조동물조회 API 클라이언트 (v2)
 * API 문서: https://www.data.go.kr/data/15098931/openapi.do
 * End Point: https://apis.data.go.kr/1543061/abandonmentPublicService_v2
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PublicApiService {

    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;

    @Value("${public-api.service-key:}")
    private String serviceKey;

    /** 구조동물 조회 v2: https://apis.data.go.kr/1543061/abandonmentPublicService_v2 */
    @Value("${public-api.base-url:https://apis.data.go.kr/1543061}")
    private String apiBaseUrl;

    private String getAbandonmentBase() {
        return apiBaseUrl + "/abandonmentPublicService_v2";
    }

    public boolean isApiKeyConfigured() {
        return serviceKey != null && !serviceKey.isBlank() && !"your-public-api-service-key".equals(serviceKey);
    }

    @PostConstruct
    void logApiKeyStatus() {
        if (isApiKeyConfigured()) {
            log.info("공공 API 키 로드됨 (접두사: {})", serviceKey != null && serviceKey.length() >= 8 ? serviceKey.substring(0, 8) + "..." : "?");
        } else {
            log.warn("공공 API 키 미설정. backend/.env 의 DATA_API_KEY 를 확인하세요.");
        }
    }
    private static final String ABANDONMENT_LIST_PATH = "/abandonmentPublic_v2";
    private static final String KIND_LIST_PATH = "/getKindList";
    /** data_go_kr.md 동물보호센터 정보 조회 서비스 End Point (v2) */
    private static final String SHELTER_BASE = "https://apis.data.go.kr/1543061/animalShelterSrvc_v2";
    private static final String SHELTER_LIST_PATH = "/shelterInfo_v2";
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd");

    /**
     * 유기동물 목록 조회
     * @param uprCd 시도코드 (없으면 null)
     * @param orgCd 시군구코드 (없으면 null)
     * @param upkind 축종 417000=개, 422400=고양이
     * @param state notice=공고중, protect=보호중
     */
    public List<AnimalItem> getAbandonedAnimals(String uprCd, String orgCd, String upkind,
                                                 String state, LocalDate bgnde, LocalDate endde,
                                                 int pageNo, int numOfRows) {
        if (serviceKey == null || serviceKey.isBlank() || "your-public-api-service-key".equals(serviceKey)) {
            log.warn("공공 API 서비스 키가 설정되지 않았습니다. 빈 목록을 반환합니다.");
            return Collections.emptyList();
        }
        var builder = UriComponentsBuilder.fromHttpUrl(getAbandonmentBase() + ABANDONMENT_LIST_PATH)
                .queryParam("serviceKey", serviceKey)
                .queryParam("pageNo", pageNo)
                .queryParam("numOfRows", numOfRows)
                .queryParam("_type", "json");
        if (uprCd != null && !uprCd.isBlank()) builder.queryParam("upr_cd", uprCd);
        if (orgCd != null && !orgCd.isBlank()) builder.queryParam("org_cd", orgCd);
        if (upkind != null && !upkind.isBlank()) builder.queryParam("upkind", upkind);
        builder.queryParam("state", state != null && !state.isBlank() ? state : "protect");
        if (bgnde != null) builder.queryParam("bgnde", bgnde.format(DATE_FORMAT));
        if (endde != null) builder.queryParam("endde", endde.format(DATE_FORMAT));
        String uri = builder.build().toUriString();

        try {
            String json = webClientBuilder.build()
                    .get()
                    .uri(uri)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            List<AnimalItem> result = parseAnimalItems(json);
            if (result.isEmpty() && json != null && json.length() < 2000) {
                log.info("공공 API 유기동물 조회 빈 결과. 응답(앞 1500자): {}", json.substring(0, Math.min(1500, json.length())));
            } else if (result.isEmpty()) {
                log.info("공공 API 유기동물 조회 빈 결과. upkind={} state={} bgnde={} endde={} pageNo={}", upkind, state,
                        bgnde != null ? bgnde.format(DATE_FORMAT) : "", endde != null ? endde.format(DATE_FORMAT) : "", pageNo);
            }
            return result;
        } catch (org.springframework.web.reactive.function.client.WebClientResponseException e) {
            log.error("공공 API 유기동물 조회 실패: {} - 응답본문: {}", e.getMessage(), e.getResponseBodyAsString());
            return Collections.emptyList();
        } catch (Exception e) {
            log.error("공공 API 유기동물 조회 실패: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * 응답 JSON에서 item 리스트 추출 (단일 객체인 경우 리스트로 감싸서 처리)
     */
    @SuppressWarnings("unchecked")
    private List<AnimalItem> parseAnimalItems(String json) {
        try {
            if (json == null || json.isBlank()) return Collections.emptyList();
            Map<String, Object> map = objectMapper.readValue(json, new TypeReference<>() {});
            Object response = map.get("response");
            if (response == null) return Collections.emptyList();
            Map<String, Object> bodyMap = (Map<String, Object>) response;
            Object body = bodyMap.get("body");
            if (body == null) {
                Object header = bodyMap.get("header");
                if (header instanceof Map) {
                    Object rc = ((Map<?, ?>) header).get("resultCode");
                    Object msg = ((Map<?, ?>) header).get("resultMsg");
                    log.warn("공공 API body 없음. header resultCode={} resultMsg={}", rc, msg);
                }
                return Collections.emptyList();
            }
            Object items = ((Map<String, Object>) body).get("items");
            if (items == null) return Collections.emptyList();
            if (!(items instanceof Map)) return Collections.emptyList();
            Object item = ((Map<String, Object>) items).get("item");
            if (item == null) return Collections.emptyList();
            if (item instanceof List) {
                return objectMapper.convertValue(item, new TypeReference<List<AnimalItem>>() {});
            }
            AnimalItem single = objectMapper.convertValue(item, AnimalItem.class);
            return List.of(single);
        } catch (Exception e) {
            log.warn("공공 API 응답 파싱 실패: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * 보호소 목록 조회
     */
    public List<ShelterItem> getShelters(String uprCd, String orgCd) {
        if (serviceKey == null || serviceKey.isBlank()) {
            return Collections.emptyList();
        }
        String uri = UriComponentsBuilder.fromHttpUrl(SHELTER_BASE + SHELTER_LIST_PATH)
                .queryParam("serviceKey", serviceKey)
                .queryParam("upr_cd", uprCd != null ? uprCd : "")
                .queryParam("org_cd", orgCd != null ? orgCd : "")
                .queryParam("_type", "json")
                .build()
                .toUriString();
        try {
            String json = webClientBuilder.build().get().uri(uri).retrieve().bodyToMono(String.class).block();
            return parseShelterItems(json);
        } catch (Exception e) {
            log.error("공공 API 보호소 조회 실패: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    @SuppressWarnings("unchecked")
    private List<ShelterItem> parseShelterItems(String json) {
        try {
            Map<String, Object> map = objectMapper.readValue(json, new TypeReference<>() {});
            Object response = map.get("response");
            if (response == null) return Collections.emptyList();
            Object body = ((Map<String, Object>) response).get("body");
            if (body == null) return Collections.emptyList();
            Object items = ((Map<String, Object>) body).get("items");
            if (items == null) return Collections.emptyList();
            Object item = ((Map<String, Object>) items).get("item");
            if (item == null) return Collections.emptyList();
            if (item instanceof List) {
                return objectMapper.convertValue(item, new TypeReference<List<ShelterItem>>() {});
            }
            ShelterItem single = objectMapper.convertValue(item, ShelterItem.class);
            return List.of(single);
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    /**
     * 품종 목록 조회 (kindCd → 품종명 매핑용)
     * @param upkind 417000=개, 422400=고양이
     */
    public List<KindItem> getKindList(String upkind) {
        if (serviceKey == null || serviceKey.isBlank()) return Collections.emptyList();
        String uri = UriComponentsBuilder.fromHttpUrl(getAbandonmentBase() + KIND_LIST_PATH)
                .queryParam("serviceKey", serviceKey)
                .queryParam("upkind", upkind != null ? upkind : "417000")
                .queryParam("_type", "json")
                .build()
                .toUriString();
        try {
            String json = webClientBuilder.build().get().uri(uri).retrieve().bodyToMono(String.class).block();
            return parseKindItems(json);
        } catch (Exception e) {
            log.warn("공공 API 품종 조회 실패 upkind={}: {}", upkind, e.getMessage());
            return Collections.emptyList();
        }
    }

    @SuppressWarnings("unchecked")
    private List<KindItem> parseKindItems(String json) {
        try {
            if (json == null || json.isBlank()) return Collections.emptyList();
            Map<String, Object> map = objectMapper.readValue(json, new TypeReference<>() {});
            Object response = map.get("response");
            if (response == null) return Collections.emptyList();
            Object body = ((Map<String, Object>) response).get("body");
            if (body == null) return Collections.emptyList();
            Object items = ((Map<String, Object>) body).get("items");
            if (items == null) return Collections.emptyList();
            if (!(items instanceof Map)) return Collections.emptyList();
            Object item = ((Map<String, Object>) items).get("item");
            if (item == null) return Collections.emptyList();
            if (item instanceof List) {
                return objectMapper.convertValue(item, new TypeReference<List<KindItem>>() {});
            }
            return List.of(objectMapper.convertValue(item, KindItem.class));
        } catch (Exception e) {
            log.warn("품종 API 응답 파싱 실패: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
}
