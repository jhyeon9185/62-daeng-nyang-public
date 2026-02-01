package com.dnproject.platform.repository;

import com.dnproject.platform.domain.Favorite;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    Optional<Favorite> findByUser_IdAndAnimal_Id(Long userId, Long animalId);

    boolean existsByUser_IdAndAnimal_Id(Long userId, Long animalId);

    Page<Favorite> findByUser_IdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    @Query("SELECT f.animal.id FROM Favorite f WHERE f.user.id = :userId")
    List<Long> findAnimalIdsByUser_Id(@Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM Favorite f WHERE f.user.id = :userId AND f.animal.id = :animalId")
    void deleteByUser_IdAndAnimal_Id(@Param("userId") Long userId, @Param("animalId") Long animalId);
}
