-- 공공데이터 유기동물 동기화 이력 (자동/수동, 추가·수정·삭제·보정 건수)

USE dn_platform;

CREATE TABLE IF NOT EXISTS sync_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    run_at TIMESTAMP(6) NOT NULL,
    trigger_type ENUM('AUTO', 'MANUAL') NOT NULL,
    added_count INT NOT NULL DEFAULT 0,
    updated_count INT NOT NULL DEFAULT 0,
    deleted_count INT NOT NULL DEFAULT 0,
    corrected_count INT NOT NULL DEFAULT 0,
    error_message VARCHAR(1000),
    days_param INT,
    species_filter VARCHAR(20),
    INDEX idx_sync_history_run_at (run_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
