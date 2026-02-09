-- 복수 지역 저장을 위해 region 컬럼 길이 확장 (쉼표 구분: 서울,경기,인천 등)

USE dn_platform;

ALTER TABLE preferences
  MODIFY COLUMN region VARCHAR(200) NULL;
