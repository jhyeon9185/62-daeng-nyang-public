---
name: database-schema
description: Creates MySQL database schemas, DDL scripts, and migration files. Use when creating tables, modifying schema, database design. Keywords: database, mysql, schema, ddl, migration, table.
---

# Database Schema Generator

## Purpose
Generate MySQL database schemas:
- DDL scripts
- Index optimization
- Foreign key relationships
- Migration files

## Database Configuration
```yaml
# application.yml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/dn_platform?useSSL=false&serverTimezone=Asia/Seoul&characterEncoding=UTF-8
    username: ${DB_USERNAME:root}
    password: ${DB_PASSWORD:password}
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    hibernate:
      ddl-auto: validate  # Use 'create' for initial setup, 'validate' for production
    properties:
      hibernate:
        dialect: org.hibernate.dialect.MySQL8Dialect
        format_sql: true
    show-sql: true
```

## Complete DDL Script (DN Platform)

```sql
-- Database creation
CREATE DATABASE IF NOT EXISTS dn_platform
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE dn_platform;

-- ============================================
-- 1. USERS (회원)
-- ============================================
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    address VARCHAR(255),
    role ENUM('USER', 'SHELTER_ADMIN', 'SUPER_ADMIN') NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. PREFERENCES (선호도)
-- ============================================
CREATE TABLE preferences (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    species ENUM('DOG', 'CAT'),
    min_age INT,
    max_age INT,
    size ENUM('SMALL', 'MEDIUM', 'LARGE'),
    region VARCHAR(50),
    temperament VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. SHELTERS (보호소)
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
    verification_status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    public_api_shelter_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP NULL,

    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_shelters_name (name),
    INDEX idx_shelters_verification (verification_status),
    INDEX idx_shelters_public_api_id (public_api_shelter_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. ANIMALS (동물)
-- ============================================
CREATE TABLE animals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    shelter_id BIGINT NOT NULL,
    public_api_animal_id VARCHAR(50),
    species ENUM('DOG', 'CAT') NOT NULL,
    breed VARCHAR(50),
    name VARCHAR(50),
    age INT,
    gender ENUM('MALE', 'FEMALE'),
    size ENUM('SMALL', 'MEDIUM', 'LARGE'),
    weight DECIMAL(5, 2),
    description TEXT,
    temperament VARCHAR(100),
    health_status VARCHAR(255),
    neutered BOOLEAN DEFAULT FALSE,
    vaccinated BOOLEAN DEFAULT FALSE,
    image_url VARCHAR(500),
    status ENUM('PROTECTED', 'ADOPTED', 'FOSTERING') NOT NULL DEFAULT 'PROTECTED',
    register_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (shelter_id) REFERENCES shelters(id) ON DELETE CASCADE,
    INDEX idx_animals_species (species),
    INDEX idx_animals_status (status),
    INDEX idx_animals_shelter (shelter_id),
    INDEX idx_animals_public_api_id (public_api_animal_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. ANIMAL_IMAGES (동물 이미지)
-- ============================================
CREATE TABLE animal_images (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    animal_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    is_main BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE,
    INDEX idx_animal_images_animal (animal_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. ADOPTIONS (입양/임보 신청)
-- ============================================
CREATE TABLE adoptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    animal_id BIGINT NOT NULL,
    type ENUM('ADOPTION', 'FOSTERING') NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    reason TEXT,
    experience TEXT,
    living_env TEXT,
    family_agreement BOOLEAN DEFAULT FALSE,
    reject_reason TEXT,
    processed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE,
    INDEX idx_adoptions_user (user_id),
    INDEX idx_adoptions_animal (animal_id),
    INDEX idx_adoptions_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. VOLUNTEER_RECRUITMENTS (봉사 모집공고)
-- ============================================
CREATE TABLE volunteer_recruitments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    shelter_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    activity_field VARCHAR(50) NOT NULL,
    max_applicants INT NOT NULL,
    current_applicants INT DEFAULT 0,
    volunteer_date DATE NOT NULL,
    deadline DATE NOT NULL,
    status ENUM('RECRUITING', 'CLOSED') NOT NULL DEFAULT 'RECRUITING',
    is_urgent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (shelter_id) REFERENCES shelters(id) ON DELETE CASCADE,
    INDEX idx_volunteer_recruitments_shelter (shelter_id),
    INDEX idx_volunteer_recruitments_status (status),
    INDEX idx_volunteer_recruitments_deadline (deadline)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 8. VOLUNTEERS (봉사 신청)
-- ============================================
CREATE TABLE volunteers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    recruitment_id BIGINT NOT NULL,
    user_id BIGINT,
    applicant_name VARCHAR(50) NOT NULL,
    applicant_phone VARCHAR(20) NOT NULL,
    applicant_email VARCHAR(100) NOT NULL,
    activity_region VARCHAR(100) NOT NULL,
    activity_field VARCHAR(50) NOT NULL,
    volunteer_date_start DATE NOT NULL,
    volunteer_date_end DATE,
    activity_cycle ENUM('REGULAR', 'IRREGULAR') NOT NULL,
    preferred_time_slot VARCHAR(50),
    volunteer_type ENUM('INDIVIDUAL', 'GROUP') NOT NULL DEFAULT 'INDIVIDUAL',
    experience TEXT,
    special_notes TEXT,
    status ENUM('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (recruitment_id) REFERENCES volunteer_recruitments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_volunteers_recruitment (recruitment_id),
    INDEX idx_volunteers_user (user_id),
    INDEX idx_volunteers_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 9. DONATION_REQUESTS (물품 기부 요청)
-- ============================================
CREATE TABLE donation_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    shelter_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    item_category VARCHAR(50) NOT NULL,
    target_quantity INT NOT NULL,
    current_quantity INT DEFAULT 0,
    deadline DATE NOT NULL,
    status ENUM('OPEN', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    is_urgent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (shelter_id) REFERENCES shelters(id) ON DELETE CASCADE,
    INDEX idx_donation_requests_shelter (shelter_id),
    INDEX idx_donation_requests_status (status),
    INDEX idx_donation_requests_deadline (deadline)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 10. DONATIONS (물품 기부 신청)
-- ============================================
CREATE TABLE donations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    request_id BIGINT NOT NULL,
    user_id BIGINT,
    donor_name VARCHAR(50) NOT NULL,
    donor_phone VARCHAR(20) NOT NULL,
    donor_email VARCHAR(100) NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    delivery_method VARCHAR(50) NOT NULL,
    tracking_number VARCHAR(50),
    receipt_requested BOOLEAN DEFAULT FALSE,
    status ENUM('PENDING', 'APPROVED', 'SHIPPED', 'RECEIVED') NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (request_id) REFERENCES donation_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_donations_request (request_id),
    INDEX idx_donations_user (user_id),
    INDEX idx_donations_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 11. BOARDS (게시판)
-- ============================================
CREATE TABLE boards (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    shelter_id BIGINT,
    type ENUM('NOTICE', 'FAQ', 'FREE', 'VOLUNTEER', 'DONATION') NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    views INT DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shelter_id) REFERENCES shelters(id) ON DELETE SET NULL,
    INDEX idx_boards_user (user_id),
    INDEX idx_boards_type (type),
    INDEX idx_boards_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 12. COMMENTS (댓글)
-- ============================================
CREATE TABLE comments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    board_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_comments_board (board_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 13. NOTIFICATIONS (알림)
-- ============================================
CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL,
    message VARCHAR(255) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notifications_user (user_id),
    INDEX idx_notifications_is_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Initial Data (Optional)
-- ============================================
-- Super Admin account (password: admin123)
INSERT INTO users (email, password, name, role) VALUES
('admin@dnplatform.com', '$2a$10$example_hashed_password', '시스템 관리자', 'SUPER_ADMIN');
```

## Index Strategy

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| users | idx_users_email | email | Login lookup |
| users | idx_users_role | role | Role-based queries |
| animals | idx_animals_species | species | Filter by species |
| animals | idx_animals_status | status | Filter by status |
| animals | idx_animals_shelter | shelter_id | Shelter's animals |
| adoptions | idx_adoptions_status | status | Status queries |
| boards | idx_boards_type | type | Board type filter |
| boards | idx_boards_created_at | created_at DESC | Latest posts |

## Migration Guidelines

1. Always use `ddl-auto: validate` in production
2. Create migration files for schema changes
3. Test migrations in development first
4. Backup database before applying migrations
5. Use transactions for data migrations
