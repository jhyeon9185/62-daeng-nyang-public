package com.dnproject.platform.repository;

import com.dnproject.platform.domain.Donation;
import com.dnproject.platform.domain.constant.DonationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DonationRepository extends JpaRepository<Donation, Long> {

    Page<Donation> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Donation> findByUser_IdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Page<Donation> findByShelter_Id(Long shelterId, Pageable pageable);

    Page<Donation> findByShelter_IdAndStatus(Long shelterId, DonationStatus status, Pageable pageable);
}
