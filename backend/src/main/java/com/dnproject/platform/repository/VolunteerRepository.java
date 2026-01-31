package com.dnproject.platform.repository;

import com.dnproject.platform.domain.Volunteer;
import com.dnproject.platform.domain.constant.VolunteerStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VolunteerRepository extends JpaRepository<Volunteer, Long> {

    Page<Volunteer> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Volunteer> findByUser_IdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Page<Volunteer> findByShelter_Id(Long shelterId, Pageable pageable);

    Page<Volunteer> findByShelter_IdAndStatus(Long shelterId, VolunteerStatus status, Pageable pageable);
}
