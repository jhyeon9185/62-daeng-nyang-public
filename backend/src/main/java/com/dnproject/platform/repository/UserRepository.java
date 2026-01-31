package com.dnproject.platform.repository;

import com.dnproject.platform.domain.User;
import com.dnproject.platform.domain.constant.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Page<User> findByRoleOrderByCreatedAtDesc(Role role, Pageable pageable);

    /** 이메일 앞뒤 공백 무시하고 조회 (로그인 시 공백 입력 방지) */
    @Query("SELECT u FROM User u WHERE TRIM(u.email) = :email")
    Optional<User> findByEmailTrimmed(@Param("email") String email);

    boolean existsByEmail(String email);

    /** 이메일 앞뒤 공백 무시하고 중복 여부 확인 */
    @Query("SELECT COUNT(u) > 0 FROM User u WHERE TRIM(u.email) = :email")
    boolean existsByEmailTrimmed(@Param("email") String email);
}
