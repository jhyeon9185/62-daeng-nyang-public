package com.dnproject.platform.repository;

import com.dnproject.platform.domain.AnimalImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AnimalImageRepository extends JpaRepository<AnimalImage, Long> {

    List<AnimalImage> findByAnimal_IdOrderByIsMainDesc(Long animalId);

    Optional<AnimalImage> findByAnimal_IdAndIsMainTrue(Long animalId);
}
