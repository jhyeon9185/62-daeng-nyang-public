package com.dnproject.platform.repository;

import com.dnproject.platform.domain.Preference;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PreferenceRepository extends JpaRepository<Preference, Long> {

    Optional<Preference> findByUser_Id(Long userId);
}
