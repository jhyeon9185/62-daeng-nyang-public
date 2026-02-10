-- 봉사 신청 시 신청 인원(몇 명) 저장용 컬럼 추가
-- 기존 DB에 적용 시 실행. JPA ddl-auto=update 사용 시 자동 반영될 수 있음.

USE dn_platform;

-- volunteers.participant_count (신청 인원, 기본 1)
ALTER TABLE volunteers
  ADD COLUMN participant_count INT NULL COMMENT '신청 인원 (본인 포함)' AFTER special_notes;

UPDATE volunteers SET participant_count = 1 WHERE participant_count IS NULL;
