package com.dnproject.platform.service;

import com.dnproject.platform.domain.Animal;
import com.dnproject.platform.domain.Shelter;
import com.dnproject.platform.domain.constant.*;
import com.dnproject.platform.dto.publicapi.AnimalItem;
import com.dnproject.platform.repository.AnimalRepository;
import com.dnproject.platform.repository.ShelterRepository;
import com.dnproject.platform.util.AddressRegionParser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 공공데이터포털 유기동물 API → DB 동기화
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AnimalSyncService {

    private static final String DOG_CODE = "417000";
    private static final String CAT_CODE = "422400";
    private static final DateTimeFormatter API_DATE = DateTimeFormatter.ofPattern("yyyyMMdd");
    /** animal.go.kr 이미지 뷰어 (형식: ?f=/files/shelter/YYYY/MM/파일명) */
    private static final String IMAGE_VIEW_BASE = "https://www.animal.go.kr/front/fileMng/imageView.do?f=";

    /** 품종코드 → 품종명 캐시 (getKindList 결과) */
    private final Map<String, String> kindCodeToName = new ConcurrentHashMap<>();

    private final PublicApiService publicApiService;
    private final AnimalRepository animalRepository;
    private final ShelterRepository shelterRepository;

    /** 기간 지난 동물을 ADOPTED로 보정하는 기준 일수 (등록일 + N일 초과 시) */
    private static final int EXPIRED_DAYS_THRESHOLD = 30;
    /** 신규 추가용 기간 (1일) */
    private static final int NEW_DAYS = 1;
    /** 상태 동기화용 기간 (30일) */
    private static final int STATUS_SYNC_DAYS = 30;

    /** addedCount: 신규 추가, updatedCount: 기존 수정, statusCorrectedCount: 만료→입양 보정 */
    public record SyncResult(int addedCount, int updatedCount, int statusCorrectedCount) {
        public int syncedCount() { return addedCount + updatedCount; }
    }

    /**
     * N일치 변경분만 동기화 (증분 동기화).
     * - API의 bgnde/endde는 변경일(수정일) 기준
     * - N일 내 신규 등록 또는 상태 변경된 동물만 API가 반환
     * - full upsert로 모든 필드 갱신
     * - 30일 초과 보호중 → ADOPTED(추정) 보정
     */
    @Transactional
    public SyncResult syncFromPublicApi(int days, Integer maxPages, String speciesFilter) {
        ensureKindMapLoaded();
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days);

        int added = 0, updated = 0;
        if (speciesFilter == null || "DOG".equalsIgnoreCase(speciesFilter)) {
            var c = syncByUpkind(DOG_CODE, startDate, endDate, maxPages);
            added += c[0]; updated += c[1];
        }
        if (speciesFilter == null || "CAT".equalsIgnoreCase(speciesFilter)) {
            var c = syncByUpkind(CAT_CODE, startDate, endDate, maxPages);
            added += c[0]; updated += c[1];
        }

        int corrected = markExpiredAsAdopted();
        if (corrected > 0) {
            log.info("기간 지난 동물 상태 보정: {}마리 → ADOPTED(추정)", corrected);
        }
        return new SyncResult(added, updated, corrected);
    }

    /**
     * 스케줄용: 1일치 변경분 동기화.
     * - bgnde/endde가 변경일 기준이므로 1일 조회만으로 신규+상태변경 모두 처리됨
     */
    @Transactional
    public SyncResult syncDailySchedule() {
        ensureKindMapLoaded();
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(NEW_DAYS);

        int added = 0, updated = 0;
        var dog = syncByUpkind(DOG_CODE, startDate, endDate, null);
        added += dog[0]; updated += dog[1];
        var cat = syncByUpkind(CAT_CODE, startDate, endDate, null);
        added += cat[0]; updated += cat[1];

        int corrected = markExpiredAsAdopted();
        if (corrected > 0) {
            log.info("기간 지난 동물 상태 보정: {}마리 → ADOPTED(추정)", corrected);
        }
        return new SyncResult(added, updated, corrected);
    }

    /** 기존 DB 동물만 상태(status) 갱신. 신규는 추가하지 않음. */
    private int syncStatusOnlyByUpkind(String upkind, LocalDate startDate, LocalDate endDate) {
        int pageNo = 1;
        int numOfRows = 100;
        int[] updated = {0};
        for (String state : new String[]{"notice", "protect"}) {
            pageNo = 1;
            while (true) {
                List<AnimalItem> items = publicApiService.getAbandonedAnimals(
                        null, null, upkind, state, startDate, endDate, pageNo, numOfRows);
                if (items == null || items.isEmpty()) break;
                for (AnimalItem item : items) {
                    if (item.getDesertionNo() == null || item.getDesertionNo().isBlank()) continue;
                    animalRepository.findByPublicApiAnimalId(item.getDesertionNo()).ifPresent(existing -> {
                        AnimalStatus newStatus = mapStatus(item.getProcessState());
                        if (!existing.getStatus().equals(newStatus)) {
                            existing.setStatus(newStatus);
                            animalRepository.save(existing);
                            updated[0]++;
                        }
                    });
                }
                if (items.size() < numOfRows) break;
                pageNo++;
            }
        }
        return updated[0];
    }

    /**
     * 공공API 유래 + 등록일이 N일 초과 + 보호중 → ADOPTED(추정)로 보정.
     * API 기간 조회에 포함되지 않는 동물이 계속 PROTECTED로 쌓이는 것 방지.
     */
    private int markExpiredAsAdopted() {
        LocalDate cutoff = LocalDate.now().minusDays(EXPIRED_DAYS_THRESHOLD);
        List<Animal> expired = animalRepository.findExpiredFromPublicApi(AnimalStatus.PROTECTED, cutoff);
        for (Animal a : expired) {
            a.setStatus(AnimalStatus.ADOPTED);
            animalRepository.save(a);
        }
        return expired.size();
    }

    /** 품종코드→품종명 매핑 로드 (동기화 시작 시 1회) */
    private void ensureKindMapLoaded() {
        if (!kindCodeToName.isEmpty()) return;
        for (String upkind : new String[]{DOG_CODE, CAT_CODE}) {
            publicApiService.getKindList(upkind).forEach(k -> {
                if (k.getKindCd() != null && k.getKNm() != null && !k.getKNm().isBlank()) {
                    kindCodeToName.put(k.getKindCd().trim(), k.getKNm().trim());
                }
            });
        }
        log.debug("품종코드 매핑 로드: {}건", kindCodeToName.size());
    }

    /** @return int[2] = { addedCount, updatedCount } */
    private int[] syncByUpkind(String upkind, LocalDate startDate, LocalDate endDate, Integer maxPages) {
        int pageNo = 1;
        int numOfRows = 100;
        int added = 0, updated = 0;
        for (String state : new String[]{"notice", "protect"}) {
            pageNo = 1;
            while (true) {
                List<AnimalItem> items = publicApiService.getAbandonedAnimals(
                        null, null, upkind, state, startDate, endDate, pageNo, numOfRows);
                if (items == null || items.isEmpty()) break;
                for (AnimalItem item : items) {
                    if (item.getDesertionNo() == null || item.getDesertionNo().isBlank()) {
                        log.warn("desertionNo 없음, 스킵");
                        continue;
                    }
                    if (added + updated == 0 && (item.getPopfile1() == null || item.getPopfile1().isBlank())
                            && (item.getPopfile2() == null || item.getPopfile2().isBlank())
                            && (item.getPopfile() == null || item.getPopfile().isBlank())
                            && (item.getFilename() == null || item.getFilename().isBlank())) {
                        log.info("첫 건 이미지 미제공: desertionNo={}", item.getDesertionNo());
                    }
                    try {
                        if (upsertAnimal(item)) added++;
                        else updated++;
                    } catch (Exception e) {
                        log.warn("동물 upsert 실패 desertionNo={}: {}", item.getDesertionNo(), e.getMessage());
                    }
                }
                if (items.size() < numOfRows) break;
                if (maxPages != null && pageNo >= maxPages) break;
                pageNo++;
            }
        }
        return new int[]{added, updated};
    }

    /** @return true = 신규 추가, false = 기존 수정 */
    private boolean upsertAnimal(AnimalItem item) {
        var existing = animalRepository.findByPublicApiAnimalId(item.getDesertionNo());
        if (existing.isPresent()) {
            updateAnimalFromApi(existing.get(), item);
            return false;
        }
        createAnimalFromApi(item);
        return true;
    }

    private void updateAnimalFromApi(Animal animal, AnimalItem item) {
        animal.setSpecies(mapSpecies(item));
        animal.setBreed(extractBreed(item));
        animal.setName(generateName(item));
        animal.setImageUrl(resolveImageUrl(item));
        animal.setStatus(mapStatus(item.getProcessState()));
        animal.setDescription(buildDescription(item));
        animal.setOrgName(nullToBlank(item.getOrgNm(), 100));
        animal.setChargeName(nullToBlank(item.getChargeNm(), 50));
        animal.setChargePhone(nullToBlank(item.getOfficetel(), 30));
        animalRepository.save(animal);
    }

    private void createAnimalFromApi(AnimalItem item) {
        Shelter shelter = findOrCreateShelter(item);
        Animal animal = Animal.builder()
                .publicApiAnimalId(item.getDesertionNo())
                .shelter(shelter)
                .species(mapSpecies(item))
                .breed(extractBreed(item))
                .name(generateName(item))
                .age(parseAge(item.getAge()))
                .gender(mapGender(item.getSexCd()))
                .size(estimateSize(item.getWeight()))
                .weight(parseWeight(item.getWeight()))
                .description(buildDescription(item))
                .neutered("Y".equalsIgnoreCase(item.getNeuterYn()))
                .imageUrl(resolveImageUrl(item))
                .status(mapStatus(item.getProcessState()))
                .registerDate(parseDate(item.getHappenDt()))
                .orgName(nullToBlank(item.getOrgNm(), 100))
                .chargeName(nullToBlank(item.getChargeNm(), 50))
                .chargePhone(nullToBlank(item.getOfficetel(), 30))
                .build();
        animalRepository.save(animal);
    }

    /**
     * popfile1 → popfile2 → popfile → filename 순으로 우선.
     * 실제 API는 popfile1, popfile2에 전체 URL 반환.
     */
    private String resolveImageUrl(AnimalItem item) {
        String raw = null;
        if (item.getPopfile1() != null && !item.getPopfile1().isBlank()) raw = item.getPopfile1();
        if (raw == null && item.getPopfile2() != null && !item.getPopfile2().isBlank()) raw = item.getPopfile2();
        if (raw == null && item.getPopfile() != null && !item.getPopfile().isBlank()) raw = item.getPopfile();
        if (raw == null && item.getFilename() != null && !item.getFilename().isBlank()) raw = item.getFilename();
        if (raw == null || raw.isBlank()) return null;
        if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
        String relPath;
        if (raw.startsWith("/files/")) {
            relPath = raw;
        } else if (raw.startsWith("/")) {
            relPath = raw.startsWith("/files") ? raw : "/files" + raw;
        } else if (raw.startsWith("shelter/")) {
            relPath = "/files/" + raw;
        } else {
            LocalDate dt = parseDate(item.getHappenDt());
            String filePart = raw.contains("/") ? raw.substring(raw.lastIndexOf('/') + 1) : raw;
            if (dt != null) {
                relPath = String.format("/files/shelter/%d/%02d/%s", dt.getYear(), dt.getMonthValue(), filePart);
            } else {
                relPath = "/files/shelter/" + filePart;
            }
        }
        return IMAGE_VIEW_BASE + relPath;
    }

    /** description: 발견장소 + 특징 조합 (규격에 맞게, TEXT 컬럼이지만 2000자 제한) */
    private String buildDescription(AnimalItem item) {
        StringBuilder sb = new StringBuilder();
        if (item.getHappenPlace() != null && !item.getHappenPlace().isBlank()) {
            sb.append("[발견장소] ").append(item.getHappenPlace());
        }
        if (item.getSpecialMark() != null && !item.getSpecialMark().isBlank()) {
            if (sb.length() > 0) sb.append(" ");
            sb.append("[특징] ").append(item.getSpecialMark());
        }
        if (sb.length() == 0) return null;
        return sb.length() > 2000 ? sb.substring(0, 2000) : sb.toString();
    }

    /** null/blank면 null, 아니면 trim 후 maxLen 자르기 (관할기관·담당자·담당자연락처용) */
    private static String nullToBlank(String s, int maxLen) {
        if (s == null || s.isBlank()) return null;
        String t = s.trim();
        return t.length() > maxLen ? t.substring(0, maxLen) : t;
    }

    private Shelter findOrCreateShelter(AnimalItem item) {
        String careNm = item.getCareNm();
        if (careNm == null || careNm.isBlank()) careNm = "미상";
        return shelterRepository.findFirstByName(careNm)
                .map(s -> {
                    if (s.getRegionSido() == null && s.getAddress() != null && !s.getAddress().isBlank()) {
                        String[] r = AddressRegionParser.parse(s.getAddress());
                        s.setRegionSido(r[0]);
                        s.setRegionSigungu(r[1]);
                        shelterRepository.save(s);
                    }
                    return s;
                })
                .orElseGet(() -> createShelterFromApi(item));
    }

    private Shelter createShelterFromApi(AnimalItem item) {
        String name = item.getCareNm() != null && !item.getCareNm().isBlank() ? item.getCareNm() : "미상";
        String addr = item.getCareAddr() != null ? item.getCareAddr() : "";
        String tel = item.getCareTel() != null ? item.getCareTel() : "000-0000-0000";
        String[] region = AddressRegionParser.parse(addr);
        return shelterRepository.save(Shelter.builder()
                .name(name)
                .address(addr)
                .regionSido(region[0])
                .regionSigungu(region[1])
                .phone(tel)
                .managerName("공공API")
                .managerPhone(tel)
                .verificationStatus(VerificationStatus.APPROVED)
                .build());
    }

    /** upKindCd(축종코드) 우선. 422400=고양이, 417000=개 */
    private Species mapSpecies(AnimalItem item) {
        if (CAT_CODE.equals(item.getUpKindCd())) return Species.CAT;
        if (DOG_CODE.equals(item.getUpKindCd())) return Species.DOG;
        String full = item.getKindFullNm();
        if (full != null && (full.contains("고양이") || full.contains("[고양이]"))) return Species.CAT;
        return Species.DOG;
    }

    /** kindNm(품종명) 우선, 없으면 kindFullNm 파싱, 없으면 kindCd 코드조회 */
    private String extractBreed(AnimalItem item) {
        if (item.getKindNm() != null && !item.getKindNm().isBlank()) {
            String s = item.getKindNm().trim();
            return s.length() > 50 ? s.substring(0, 50) : s;
        }
        String kindCd = item.getKindCd();
        String full = item.getKindFullNm();
        String s = full != null ? full.replaceAll("\\[.*?\\]\\s*", "").trim() : (kindCd != null ? kindCd : "");
        if (s.isEmpty()) return "믹스";
        String name = kindCodeToName.get(s);
        if (name != null) return name.length() > 50 ? name.substring(0, 50) : name;
        if (s.matches("\\d{4,}")) return "믹스";
        return s.length() > 50 ? s.substring(0, 50) : s;
    }

    private Integer parseAge(String age) {
        if (age == null || age.isBlank()) return null;
        try {
            String num = age.replaceAll("[^0-9]", "");
            if (num.length() >= 4) {
                int year = Integer.parseInt(num.substring(0, 4));
                return LocalDate.now().getYear() - year;
            }
            return Integer.parseInt(num);
        } catch (Exception e) {
            return null;
        }
    }

    private Gender mapGender(String sexCd) {
        if (sexCd == null) return null;
        return switch (sexCd.toUpperCase()) {
            case "M" -> Gender.MALE;
            case "F" -> Gender.FEMALE;
            default -> null;
        };
    }

    private AnimalStatus mapStatus(String processState) {
        if (processState == null) return AnimalStatus.PROTECTED;
        if (processState.contains("입양")) return AnimalStatus.ADOPTED;
        if (processState.contains("임시보호")) return AnimalStatus.FOSTERING;
        return AnimalStatus.PROTECTED;
    }

    private BigDecimal parseWeight(String weight) {
        if (weight == null || weight.isBlank()) return null;
        try {
            String num = weight.replaceAll("[^0-9.]", "");
            if (num.isEmpty()) return null;
            return new BigDecimal(num);
        } catch (Exception e) {
            return null;
        }
    }

    private Size estimateSize(String weight) {
        if (weight == null) return Size.MEDIUM;
        try {
            String num = weight.replaceAll("[^0-9.]", "");
            double w = Double.parseDouble(num.isEmpty() ? "0" : num);
            if (w < 5) return Size.SMALL;
            if (w < 15) return Size.MEDIUM;
            return Size.LARGE;
        } catch (Exception e) {
            return Size.MEDIUM;
        }
    }

    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.length() < 8) return null;
        try {
            return LocalDate.parse(dateStr.substring(0, 8), API_DATE);
        } catch (Exception e) {
            return null;
        }
    }

    /** 가명용 이름 풀 (desertionNo 해시로 고정 배정) */
    private static final String[] PLACEHOLDER_NAMES = {
            "똘이", "초코", "감자", "콩이", "나비", "링고", "토리", "초롱", "루니", "모카",
            "달이", "별이", "하늘이", "꼬미", "보리", "찰리", "해피", "코코", "두부", "깜이"
    };

    private String generateName(AnimalItem item) {
        String no = item.getDesertionNo();
        int idx = no != null ? Math.abs(no.hashCode() % PLACEHOLDER_NAMES.length) : 0;
        String base = PLACEHOLDER_NAMES[idx];
        return base + "(가명)";
    }
}
