package com.dnproject.platform.repository;

import com.dnproject.platform.domain.Animal;
import com.dnproject.platform.domain.constant.AnimalStatus;
import com.dnproject.platform.domain.constant.Size;
import com.dnproject.platform.domain.constant.Species;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AnimalRepository extends JpaRepository<Animal, Long>, AnimalRepositoryCustom {

        Page<Animal> findByShelter_Id(Long shelterId, Pageable pageable);

        Page<Animal> findBySpecies(Species species, Pageable pageable);

        Page<Animal> findByStatus(AnimalStatus status, Pageable pageable);

        Optional<Animal> findByPublicApiAnimalId(String publicApiAnimalId);

        /** 공공API 유래, 보호중, 등록일이 N일 초과된 동물 (상태 보정 대상) */
        @Query("SELECT a FROM Animal a WHERE a.publicApiAnimalId IS NOT NULL AND a.publicApiAnimalId != '' " +
                        "AND a.status = :status AND a.registerDate < :cutoff")
        List<Animal> findExpiredFromPublicApi(@Param("status") AnimalStatus status, @Param("cutoff") LocalDate cutoff);

        /** 특정 상태 동물 일괄 삭제 */
        void deleteAllByStatus(AnimalStatus status);

        /** status가 NULL인 동물 삭제 */
        @Query("SELECT a FROM Animal a WHERE a.status IS NULL")
        List<Animal> findAllByStatusIsNull();

        /** ADOPTED 건수 조회 */
        long countByStatus(AnimalStatus status);

}
