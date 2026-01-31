package com.dnproject.platform.repository;

import com.dnproject.platform.domain.Adoption;
import com.dnproject.platform.domain.constant.AdoptionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdoptionRepository extends JpaRepository<Adoption, Long> {

    Page<Adoption> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Adoption> findByUser_IdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Page<Adoption> findByAnimal_Id(Long animalId, Pageable pageable);

    Page<Adoption> findByAnimal_Shelter_IdAndStatusOrderByCreatedAtDesc(Long shelterId, AdoptionStatus status, Pageable pageable);

    long countByUser_IdAndStatus(Long userId, AdoptionStatus status);
}
