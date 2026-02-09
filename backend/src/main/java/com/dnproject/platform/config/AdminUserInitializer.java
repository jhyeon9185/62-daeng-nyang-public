package com.dnproject.platform.config;

import com.dnproject.platform.domain.User;
import com.dnproject.platform.domain.constant.Role;
import com.dnproject.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

/**
 * 애플리케이션 시작 시 특정 사용자에게 시스템 관리자(SUPER_ADMIN) 권한 부여
 * DB가 초기화되거나 변경되었을 때도 항상 관리자 권한을 유지하기 위함.
 */
@Slf4j
@Component
@Order(1) // 다른 초기화 작업보다 먼저 실행
@RequiredArgsConstructor
public class AdminUserInitializer implements ApplicationRunner {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        List<String> adminEmails = Arrays.asList(
                "hayohio@gmail.com",
                "uoou9677@gmail.com",
                "cjoh0407@gmail.com");

        log.info("=== Start AdminUserInitializer ===");

        for (String email : adminEmails) {
            processUser(email);
        }

        log.info("=== End AdminUserInitializer ===");
    }

    private void processUser(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getRole() != Role.SUPER_ADMIN) {
                user.setRole(Role.SUPER_ADMIN);
                userRepository.save(user);
                log.info("Updated role for user [{}]: {} -> SUPER_ADMIN", email, user.getRole());
            } else {
                log.info("User [{}] is already SUPER_ADMIN", email);
            }
        } else {
            log.warn("User [{}] not found. Skipping admin role grant.", email);
        }
    }
}
