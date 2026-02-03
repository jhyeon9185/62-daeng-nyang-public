-- ============================================================
-- DN Platform 로컬 개발용 MySQL 초기 설정
-- 실행: mysql -u root -p < backend/scripts/init-database.sql
-- root만 쓸 경우: 1번만 실행. 전용 계정 쓸 경우: your_password 수정 후 전체 실행.
-- ============================================================

-- 1) 데이터베이스 생성 (필수)
CREATE DATABASE IF NOT EXISTS dn_platform
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 2) 전용 개발 계정 생성 (선택, root 쓸 경우 아래 2~5번 주석 처리 후 실행)
CREATE USER IF NOT EXISTS 'dev_user'@'localhost' IDENTIFIED BY 'your_password';

-- 3) dn_platform DB에 대한 모든 권한 부여
GRANT ALL PRIVILEGES ON dn_platform.* TO 'dev_user'@'localhost';

-- 4) 권한 반영
FLUSH PRIVILEGES;
