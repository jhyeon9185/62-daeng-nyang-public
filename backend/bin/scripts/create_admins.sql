
USE dn_platform;

-- Create Super Admin
INSERT INTO users (email, password, name, role, phone, address)
VALUES ('admin@admin.com', '$2a$10$x/f5qE47WXOi40ABeUFY5ux2meFDmSaX.XPQc.etiKbNaNmQbK/YWluace', 'Super Admin', 'SUPER_ADMIN', '010-9999-9999', 'Admin Office');

-- Create Shelter Admin
INSERT INTO users (email, password, name, role, phone, address)
VALUES ('shelter@shelter.com', '$2a$10$x/f5qE47WXOi40ABeUFY5ux2meFDmSaX.XPQc.etiKbNaNmQbK/YWluace', 'Shelter Admin', 'SHELTER_ADMIN', '010-8888-8888', 'Happy Shelter');

-- Get Shelter Admin ID to link to shelter
SET @shelter_admin_id = (SELECT id FROM users WHERE email='shelter@shelter.com');

-- Create Dummy Shelter linked to Shelter Admin
INSERT INTO shelters (name, address, phone, manager_id, manager_name, manager_phone, verification_status)
VALUES ('행복 보호소', '서울시 강남구 역삼동 123-45', '02-1234-5678', @shelter_admin_id, 'Shelter Manager', '010-8888-8888', 'APPROVED');
