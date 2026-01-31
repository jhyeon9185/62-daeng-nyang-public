package com.dnproject.platform.repository;

import com.dnproject.platform.domain.DonationRequest;
import com.dnproject.platform.domain.constant.RequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DonationRequestRepository extends JpaRepository<DonationRequest, Long> {

    Page<DonationRequest> findByShelter_IdOrderByCreatedAtDesc(Long shelterId, Pageable pageable);

    Page<DonationRequest> findByStatusOrderByDeadlineAsc(RequestStatus status, Pageable pageable);

    Page<DonationRequest> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
