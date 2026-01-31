package com.dnproject.platform.repository;

import com.dnproject.platform.domain.VolunteerRecruitment;
import com.dnproject.platform.domain.constant.RecruitmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VolunteerRecruitmentRepository extends JpaRepository<VolunteerRecruitment, Long> {

    Page<VolunteerRecruitment> findByShelter_IdOrderByCreatedAtDesc(Long shelterId, Pageable pageable);

    Page<VolunteerRecruitment> findByStatusOrderByDeadlineAsc(RecruitmentStatus status, Pageable pageable);

    Page<VolunteerRecruitment> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
