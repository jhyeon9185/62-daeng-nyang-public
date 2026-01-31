package com.dnproject.platform.repository;

import com.dnproject.platform.domain.Shelter;
import com.dnproject.platform.domain.constant.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ShelterRepository extends JpaRepository<Shelter, Long> {

    Optional<Shelter> findByManager_Id(Long managerId);

    Optional<Shelter> findByBusinessRegistrationNumber(String businessRegistrationNumber);

    Optional<Shelter> findByPublicApiShelterId(String publicApiShelterId);

    Optional<Shelter> findByName(String name);

    /** 동일 이름 보호소 다수 시 NonUniqueResultException 방지 (공공API 동기화용) */
    Optional<Shelter> findFirstByName(String name);

    List<Shelter> findByVerificationStatus(VerificationStatus status);
}
