package com.dnproject.platform.repository;

import com.dnproject.platform.domain.SyncHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SyncHistoryRepository extends JpaRepository<SyncHistory, Long> {

    Page<SyncHistory> findAllByOrderByRunAtDesc(Pageable pageable);
}
