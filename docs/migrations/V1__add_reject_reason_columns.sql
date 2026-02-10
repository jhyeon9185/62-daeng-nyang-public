-- 신청 반려 사유 컬럼 추가 (관리자 승인/반려 기능)
-- 기존 DB에 적용 시 실행. JPA ddl-auto=update 사용 시 자동 반영될 수 있음.
-- 이미 컬럼이 있으면 해당 ALTER 문은 건너뛰세요.

USE dn_platform;

-- volunteers.reject_reason (봉사 신청 반려 사유)
ALTER TABLE volunteers
  ADD COLUMN reject_reason TEXT NULL COMMENT '반려 사유 (관리자 입력)' AFTER status;

-- donations.reject_reason (기부 신청 반려 사유)
ALTER TABLE donations
  ADD COLUMN reject_reason TEXT NULL COMMENT '반려 사유 (관리자 입력)' AFTER status;
