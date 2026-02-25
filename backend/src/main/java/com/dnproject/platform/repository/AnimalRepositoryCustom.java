package com.dnproject.platform.repository;

import com.dnproject.platform.domain.Animal;
import com.dnproject.platform.domain.constant.AnimalStatus;
import com.dnproject.platform.domain.constant.Size;
import com.dnproject.platform.domain.constant.Species;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface AnimalRepositoryCustom {

    Page<Animal> findWithFilters(Species species, AnimalStatus status, Size size, String region, String sigungu,
            String search, Pageable pageable);

    Page<Animal> findWithFiltersRandom(Species species, AnimalStatus status, Size size, String region, String sigungu,
            String search, Pageable pageable);

    Page<Animal> findRecommended(List<AnimalStatus> statuses, Species species, Integer minAge, Integer maxAge,
            Size size, List<String> regions, Pageable pageable);
}
