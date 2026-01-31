package com.dnproject.platform.service;

import com.dnproject.platform.domain.Animal;
import com.dnproject.platform.domain.Shelter;
import com.dnproject.platform.domain.constant.AnimalStatus;
import com.dnproject.platform.domain.constant.Size;
import com.dnproject.platform.domain.constant.Species;
import com.dnproject.platform.dto.request.AnimalCreateRequest;
import com.dnproject.platform.dto.response.AnimalResponse;
import com.dnproject.platform.dto.response.PageResponse;
import com.dnproject.platform.exception.NotFoundException;
import com.dnproject.platform.dto.response.PreferenceResponse;
import com.dnproject.platform.repository.AnimalRepository;
import com.dnproject.platform.repository.ShelterRepository;
import com.dnproject.platform.service.PreferenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AnimalService {

    private final AnimalRepository animalRepository;
    private final ShelterRepository shelterRepository;
    private final AnimalSyncService animalSyncService;
    private final PreferenceService preferenceService;

    @Transactional(readOnly = true)
    public PageResponse<AnimalResponse> findAll(Species species, AnimalStatus status, Size size, String region, String sigungu, Pageable pageable) {
        String regionParam = (region != null && !region.isBlank()) ? region.trim() : null;
        String sigunguParam = (sigungu != null && !sigungu.isBlank()) ? sigungu.trim() : null;
        Page<Animal> page = animalRepository.findWithFilters(species, status, size, regionParam, sigunguParam, pageable);
        return toPageResponse(page);
    }

    /** 필터 동일 + 랜덤 정렬 (많은 아이들이 골고루 노출되도록) */
    @Transactional(readOnly = true)
    public PageResponse<AnimalResponse> findAllRandom(Species species, AnimalStatus status, Size size, String region, String sigungu, Pageable pageable) {
        String regionParam = (region != null && !region.isBlank()) ? region.trim() : null;
        String sigunguParam = (sigungu != null && !sigungu.isBlank()) ? sigungu.trim() : null;
        Page<Animal> page = animalRepository.findWithFiltersRandom(species, status, size, regionParam, sigunguParam, pageable);
        return toPageResponse(page);
    }

    private PageResponse<AnimalResponse> toPageResponse(Page<Animal> page) {
        return PageResponse.<AnimalResponse>builder()
                .content(page.getContent().stream().map(this::toResponse).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public AnimalResponse findById(Long id) {
        Animal animal = animalRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("동물을 찾을 수 없습니다. id=" + id));
        return toResponse(animal);
    }

    @Transactional
    public AnimalResponse create(AnimalCreateRequest request) {
        Shelter shelter = shelterRepository.findById(request.getShelterId())
                .orElseThrow(() -> new NotFoundException("보호소를 찾을 수 없습니다."));
        Animal animal = Animal.builder()
                .shelter(shelter)
                .species(request.getSpecies())
                .breed(request.getBreed())
                .name(request.getName())
                .age(request.getAge())
                .gender(request.getGender())
                .size(request.getSize())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .neutered(request.getNeutered() != null ? request.getNeutered() : false)
                .vaccinated(request.getVaccinated() != null ? request.getVaccinated() : false)
                .status(request.getStatus() != null ? request.getStatus() : AnimalStatus.PROTECTED)
                .build();
        animal = animalRepository.save(animal);
        return toResponse(animal);
    }

    @Transactional
    public AnimalResponse update(Long id, AnimalCreateRequest request) {
        Animal animal = animalRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("동물을 찾을 수 없습니다. id=" + id));
        if (request.getShelterId() != null) {
            Shelter shelter = shelterRepository.findById(request.getShelterId())
                    .orElseThrow(() -> new NotFoundException("보호소를 찾을 수 없습니다."));
            animal.setShelter(shelter);
        }
        if (request.getSpecies() != null) animal.setSpecies(request.getSpecies());
        if (request.getBreed() != null) animal.setBreed(request.getBreed());
        if (request.getName() != null) animal.setName(request.getName());
        if (request.getAge() != null) animal.setAge(request.getAge());
        if (request.getGender() != null) animal.setGender(request.getGender());
        if (request.getSize() != null) animal.setSize(request.getSize());
        if (request.getDescription() != null) animal.setDescription(request.getDescription());
        if (request.getImageUrl() != null) animal.setImageUrl(request.getImageUrl());
        if (request.getNeutered() != null) animal.setNeutered(request.getNeutered());
        if (request.getVaccinated() != null) animal.setVaccinated(request.getVaccinated());
        if (request.getStatus() != null) animal.setStatus(request.getStatus());
        animal = animalRepository.save(animal);
        return toResponse(animal);
    }

    @Transactional
    public void delete(Long id) {
        if (!animalRepository.existsById(id)) {
            throw new NotFoundException("동물을 찾을 수 없습니다. id=" + id);
        }
        animalRepository.deleteById(id);
    }

    /**
     * 공공데이터포털 유기동물 API → DB 동기화
     * @param days 최근 N일 데이터
     * @param maxPages 최대 페이지 수 (null이면 전부)
     * @param speciesFilter DOG, CAT 또는 null(전체)
     */
    @Transactional
    public AnimalSyncService.SyncResult syncFromPublicApiWithStatus(int days, Integer maxPages, String speciesFilter) {
        return animalSyncService.syncFromPublicApi(days, maxPages, speciesFilter);
    }

    /**
     * 사용자 선호도에 맞는 동물 목록 (종류·나이 범위·크기 필터)
     */
    @Transactional(readOnly = true)
    public PageResponse<AnimalResponse> findRecommended(Long userId, Pageable pageable) {
        PreferenceResponse pref = preferenceService.getByUserId(userId);
        if (pref == null) {
            return PageResponse.<AnimalResponse>builder()
                    .content(List.of())
                    .page(pageable.getPageNumber())
                    .size(pageable.getPageSize())
                    .totalElements(0L)
                    .totalPages(0)
                    .first(true)
                    .last(true)
                    .build();
        }
        Species species = pref.getSpecies();
        Integer minAge = pref.getMinAge();
        Integer maxAge = pref.getMaxAge();
        Size size = pref.getSize();
        List<AnimalStatus> statuses = List.of(AnimalStatus.PROTECTED, AnimalStatus.FOSTERING);
        Page<Animal> page = animalRepository.findRecommended(statuses, species, minAge, maxAge, size, pageable);
        return PageResponse.<AnimalResponse>builder()
                .content(page.getContent().stream().map(this::toResponse).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }

    private AnimalResponse toResponse(Animal a) {
        Shelter shelter = a.getShelter();
        String shelterName = shelter != null ? shelter.getName() : null;
        String shelterAddress = shelter != null ? shelter.getAddress() : null;
        String shelterPhone = shelter != null ? shelter.getPhone() : null;
        Double shelterLat = shelter != null && shelter.getLatitude() != null ? shelter.getLatitude().doubleValue() : null;
        Double shelterLng = shelter != null && shelter.getLongitude() != null ? shelter.getLongitude().doubleValue() : null;
        return AnimalResponse.builder()
                .id(a.getId())
                .publicApiAnimalId(a.getPublicApiAnimalId())
                .orgName(a.getOrgName())
                .chargeName(a.getChargeName())
                .chargePhone(a.getChargePhone())
                .shelterId(shelter != null ? shelter.getId() : null)
                .shelterName(shelterName)
                .shelterAddress(shelterAddress)
                .shelterPhone(shelterPhone)
                .shelterLatitude(shelterLat)
                .shelterLongitude(shelterLng)
                .species(a.getSpecies())
                .breed(a.getBreed())
                .name(a.getName())
                .age(a.getAge())
                .gender(a.getGender())
                .size(a.getSize())
                .description(a.getDescription())
                .imageUrl(a.getImageUrl())
                .neutered(a.getNeutered())
                .status(a.getStatus())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
