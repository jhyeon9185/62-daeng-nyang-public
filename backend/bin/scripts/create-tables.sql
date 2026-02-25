-- DN Platform - 테이블 수동 생성 DDL (MySQL 8.0)
-- 실행 전에 dn_platform DB가 이미 생성되어 있어야 함. (DATABASE_SETUP.md 2단계)
-- 실행: mysql -u root -p dn_platform < backend/scripts/create-tables.sql

USE dn_platform;

-- ============================================
-- 1. users (회원)
-- ============================================
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    address VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. preferences (선호도)
-- ============================================
CREATE TABLE preferences (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    species VARCHAR(10),
    min_age INT,
    max_age INT,
    size VARCHAR(10),
    region VARCHAR(200),
    temperament VARCHAR(100),
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. shelters (보호소)
-- ============================================
CREATE TABLE shelters (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    manager_id BIGINT,
    manager_name VARCHAR(50) NOT NULL,
    manager_phone VARCHAR(20) NOT NULL,
    business_registration_number VARCHAR(20) UNIQUE,
    business_registration_file VARCHAR(500),
    verification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    public_api_shelter_id VARCHAR(50),
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    verified_at DATETIME(6) NULL,
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_shelters_name (name),
    INDEX idx_shelters_business_reg (business_registration_number),
    INDEX idx_shelters_verification (verification_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. animals (동물)
-- ============================================
CREATE TABLE animals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    shelter_id BIGINT NOT NULL,
    public_api_animal_id VARCHAR(50),
    org_name VARCHAR(100),
    charge_name VARCHAR(50),
    charge_phone VARCHAR(30),
    species VARCHAR(10) NOT NULL,
    breed VARCHAR(50),
    name VARCHAR(50),
    age INT,
    gender VARCHAR(10),
    size VARCHAR(10),
    weight DECIMAL(5, 2),
    description TEXT,
    temperament VARCHAR(100),
    health_status VARCHAR(255),
    neutered BOOLEAN DEFAULT FALSE,
    vaccinated BOOLEAN DEFAULT FALSE,
    image_url VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'PROTECTED',
    register_date DATE,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    FOREIGN KEY (shelter_id) REFERENCES shelters(id) ON DELETE CASCADE,
    INDEX idx_animals_species (species),
    INDEX idx_animals_status (status),
    INDEX idx_animals_shelter (shelter_id),
    INDEX idx_animals_public_api_id (public_api_animal_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. adoptions (입양/임보 신청)
-- ============================================
CREATE TABLE adoptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    animal_id BIGINT NOT NULL,
    type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    reason TEXT,
    experience TEXT,
    living_env TEXT,
    family_agreement BOOLEAN DEFAULT FALSE,
    reject_reason TEXT,
    processed_at DATETIME(6) NULL,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE,
    INDEX idx_adoptions_user (user_id),
    INDEX idx_adoptions_animal (animal_id),
    INDEX idx_adoptions_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. volunteer_recruitments (봉사 모집공고)
-- ============================================
CREATE TABLE volunteer_recruitments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    shelter_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    max_applicants INT NOT NULL,
    deadline DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'RECRUITING',
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    FOREIGN KEY (shelter_id) REFERENCES shelters(id) ON DELETE CASCADE,
    INDEX idx_volunteer_recruitments_shelter (shelter_id),
    INDEX idx_volunteer_recruitments_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. donation_requests (물품 기부 요청)
-- ============================================
CREATE TABLE donation_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    shelter_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    item_category VARCHAR(50) NOT NULL,
    target_quantity INT NOT NULL,
    current_quantity INT NOT NULL DEFAULT 0,
    deadline DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    FOREIGN KEY (shelter_id) REFERENCES shelters(id) ON DELETE CASCADE,
    INDEX idx_donation_requests_shelter (shelter_id),
    INDEX idx_donation_requests_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 8. boards (게시판)
-- ============================================
CREATE TABLE boards (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    shelter_id BIGINT NULL,
    type VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    views INT DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shelter_id) REFERENCES shelters(id) ON DELETE SET NULL,
    INDEX idx_boards_type (type),
    INDEX idx_boards_created (created_at),
    INDEX idx_boards_shelter (shelter_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 9. volunteers (봉사 신청)
-- ============================================
CREATE TABLE volunteers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    shelter_id BIGINT NOT NULL,
    recruitment_id BIGINT NULL,
    board_id BIGINT NULL,
    applicant_name VARCHAR(50) NOT NULL,
    applicant_phone VARCHAR(20) NOT NULL,
    applicant_email VARCHAR(100) NOT NULL,
    activity_region VARCHAR(100) NOT NULL,
    activity_field VARCHAR(50) NOT NULL,
    volunteer_date_start DATE NOT NULL,
    volunteer_date_end DATE NULL,
    activity_cycle VARCHAR(20) NOT NULL,
    preferred_time_slot VARCHAR(50),
    volunteer_type VARCHAR(20) NOT NULL DEFAULT 'INDIVIDUAL',
    experience TEXT,
    special_notes TEXT,
    participant_count INT NULL COMMENT '신청 인원 (본인 포함)',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shelter_id) REFERENCES shelters(id) ON DELETE CASCADE,
    FOREIGN KEY (recruitment_id) REFERENCES volunteer_recruitments(id) ON DELETE SET NULL,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE SET NULL,
    INDEX idx_volunteers_user (user_id),
    INDEX idx_volunteers_shelter (shelter_id),
    INDEX idx_volunteers_date (volunteer_date_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 10. donations (기부 신청)
-- ============================================
CREATE TABLE donations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    shelter_id BIGINT NULL,
    request_id BIGINT NULL,
    board_id BIGINT NULL,
    donor_name VARCHAR(50) NOT NULL,
    donor_birthdate DATE,
    donor_phone VARCHAR(20) NOT NULL,
    donor_email VARCHAR(100) NOT NULL,
    donor_type VARCHAR(20) NOT NULL DEFAULT 'INDIVIDUAL',
    donation_type VARCHAR(20) NOT NULL,
    donation_category VARCHAR(50) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    receipt_requested BOOLEAN DEFAULT FALSE,
    resident_registration_number VARCHAR(20),
    newsletter_consent BOOLEAN DEFAULT FALSE,
    item_name VARCHAR(100),
    quantity INT,
    delivery_method VARCHAR(50),
    tracking_number VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shelter_id) REFERENCES shelters(id) ON DELETE SET NULL,
    FOREIGN KEY (request_id) REFERENCES donation_requests(id) ON DELETE SET NULL,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE SET NULL,
    INDEX idx_donations_user (user_id),
    INDEX idx_donations_shelter (shelter_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 11. comments (댓글)
-- ============================================
CREATE TABLE comments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    board_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_comments_board (board_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 12. animal_images (동물 이미지)
-- ============================================
CREATE TABLE animal_images (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    animal_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    is_main BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE,
    INDEX idx_animal_images_animal (animal_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 13. animal_favorites (즐겨찾기/찜)
-- ============================================
CREATE TABLE animal_favorites (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    animal_id BIGINT NOT NULL,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    UNIQUE KEY uk_favorites_user_animal (user_id, animal_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE,
    INDEX idx_favorites_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 14. notifications (알림)
-- ============================================
CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL,
    message VARCHAR(255) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    related_url VARCHAR(255),
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notifications_user (user_id),
    INDEX idx_notifications_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 15. sync_history (공공데이터 동기화 이력)
-- ============================================
CREATE TABLE sync_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    run_at TIMESTAMP(6) NOT NULL,
    trigger_type VARCHAR(20) NOT NULL,
    added_count INT NOT NULL DEFAULT 0,
    updated_count INT NOT NULL DEFAULT 0,
    deleted_count INT NOT NULL DEFAULT 0,
    corrected_count INT NOT NULL DEFAULT 0,
    error_message VARCHAR(1000),
    days_param INT,
    species_filter VARCHAR(20),
    INDEX idx_sync_history_run_at (run_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
