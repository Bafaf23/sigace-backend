CREATE DATABASE IF NOT EXISTS sigace_db;
USE sigace_db;

-- =========================================================================
-- 1. TABLAS MAESTRAS (Sin dependencias externas)
-- =========================================================================

CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS representatives (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document VARCHAR(15) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    repEmail VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS schools (
    SIG VARCHAR(10) PRIMARY KEY,
    company_name VARCHAR(50) NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    type ENUM('Pública', 'Privada', 'Municipal') NOT NULL,
    DEA_CODE VARCHAR(50) UNIQUE,
    RIF VARCHAR(20) UNIQUE,
    logo_school VARCHAR(255) DEFAULT 'default-logo.png',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_school_type_codes CHECK (
        (type = 'Pública' AND DEA_CODE IS NOT NULL AND RIF IS NULL AND company_name IS NULL)
        OR 
        (type IN ('Privada', 'Municipal') AND RIF IS NOT NULL AND DEA_CODE IS NULL AND company_name IS NOT NULL)
    )
);

-- =========================================================================
-- 2. TABLAS SUB-MAESTRAS (Dependen de Schools o Roles)
-- =========================================================================

CREATE TABLE IF NOT EXISTS academic_periods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    SIG VARCHAR(10) NOT NULL,
    FOREIGN KEY (SIG) REFERENCES schools (SIG) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lapses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    id_period INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_period) REFERENCES academic_periods (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document VARCHAR(15) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(50) NOT NULL UNIQUE,
    pass VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    is_first_login BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS years (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    SIG VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    order_year INT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (SIG) REFERENCES schools (SIG) ON DELETE CASCADE
);

-- =========================================================================
-- 3. PERSONAL (Profesores y Administradores)
-- =========================================================================

CREATE TABLE IF NOT EXISTS teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_user INT NOT NULL,
    SIG VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (SIG) REFERENCES schools (SIG) ON DELETE CASCADE,
    FOREIGN KEY (id_user) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS administrators (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_user INT NOT NULL,
    SIG VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (SIG) REFERENCES schools (SIG) ON DELETE CASCADE,
    FOREIGN KEY (id_user) REFERENCES users (id) ON DELETE CASCADE
);

-- =========================================================================
-- 4. CONTROL DE ESTUDIOS Y PROCESOS ACADÉMICOS
-- =========================================================================

CREATE TABLE IF NOT EXISTS sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    SIG VARCHAR(10) NOT NULL,
    id_period INT NOT NULL,
    id_year INT NOT NULL,
    capacity INT NOT NULL DEFAULT 35,
    guide_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (SIG) REFERENCES schools (SIG) ON DELETE CASCADE,
    FOREIGN KEY (id_period) REFERENCES academic_periods (id) ON DELETE RESTRICT,
    FOREIGN KEY (id_year) REFERENCES years (id) ON DELETE RESTRICT,
    FOREIGN KEY (guide_id) REFERENCES teachers (id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS subjects (
    code_subject VARCHAR(20) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    abbreviation VARCHAR(5) DEFAULT NULL, -- Agregada la coma que faltaba y unificado a 5 caracteres
    year_id INT NOT NULL,
    SIG VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (SIG) REFERENCES schools (SIG) ON DELETE CASCADE,
    FOREIGN KEY (year_id) REFERENCES years (id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_user INT NOT NULL,
    SIG VARCHAR(10) NOT NULL,
    representative_id INT NOT NULL,
    tuition_number VARCHAR(255) NOT NULL UNIQUE,
    allergies TEXT NULL,
    medical_condition TEXT NULL,
    weight INT NOT NULL,
    height INT NOT NULL,
    shirt_size VARCHAR(50) NOT NULL,
    pants_size VARCHAR(50) NOT NULL,
    shoe_size VARCHAR(50) NOT NULL,
    gender ENUM('Masculino', 'Femenino') NOT NULL DEFAULT 'Masculino',
    birth_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `condition` ENUM('Regular', 'Nuevo Ingreso', 'Retirado', 'Repitiente') DEFAULT "Nuevo Ingreso",
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_user) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (SIG) REFERENCES schools (SIG) ON DELETE CASCADE,
    FOREIGN KEY (representative_id) REFERENCES representatives (id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_student INT NOT NULL,
    id_section INT NULL,
    id_period INT NULL, -- Seteado inicialmente admitiendo NULL para prevenir errores de alteración previos
    status ENUM('Activo', 'Aprobado', 'Retirado', 'Materia Pendiente', 'Reprobado', 'Pre-inscrito') DEFAULT 'Activo',
    id_year INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_student_period (id_student, id_period),
    FOREIGN KEY (id_student) REFERENCES students (id) ON DELETE RESTRICT,
    FOREIGN KEY (id_section) REFERENCES sections (id) ON DELETE RESTRICT,
    FOREIGN KEY (id_year) REFERENCES years (id) ON DELETE RESTRICT,
    FOREIGN KEY (id_period) REFERENCES academic_periods (id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS load_academic (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_teacher INT NOT NULL,
    id_section INT NOT NULL,
    id_period INT NOT NULL,
    id_subject VARCHAR(20) NOT NULL,
    SIG VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_teacher) REFERENCES teachers (id) ON DELETE RESTRICT,
    FOREIGN KEY (id_section) REFERENCES sections (id) ON DELETE RESTRICT,
    FOREIGN KEY (id_period) REFERENCES academic_periods (id) ON DELETE RESTRICT,
    FOREIGN KEY (id_subject) REFERENCES subjects (code_subject) ON DELETE RESTRICT,
    FOREIGN KEY (SIG) REFERENCES schools (SIG) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS evaluation_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_load_academic INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_lapse INT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE (id_load_academic, id_lapse),
    FOREIGN KEY (id_load_academic) REFERENCES load_academic (id) ON DELETE RESTRICT,
    FOREIGN KEY (id_lapse) REFERENCES lapses (id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS evaluation_plan_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_evaluation_plan INT NOT NULL,
    date DATE NOT NULL,
    referent_teorical TEXT NOT NULL,
    activity TEXT NOT NULL,
    technical TEXT NOT NULL,
    instrument TEXT NOT NULL,
    porcentage INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_evaluation_plan) REFERENCES evaluation_plans (id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_evaluation INT NOT NULL,
    id_student INT NOT NULL,
    grade DECIMAL(4, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_evaluation) REFERENCES evaluation_plan_details (id) ON DELETE RESTRICT,
    FOREIGN KEY (id_student) REFERENCES students (id) ON DELETE RESTRICT,
    CONSTRAINT unique_student_evaluation UNIQUE (id_student, id_evaluation)
);

CREATE TABLE IF NOT EXISTS pending_subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_student INT NOT NULL,
    id_subject VARCHAR(20) NOT NULL,
    id_period_origin INT NOT NULL,
    status ENUM("Aprobada", "Reprobado"),
    FOREIGN KEY (id_student) REFERENCES students (id),
    FOREIGN KEY (id_subject) REFERENCES subjects (code_subject),
    FOREIGN KEY (id_period_origin) REFERENCES academic_periods (id)
);

CREATE TABLE IF NOT EXISTS auth_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_user INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_user) REFERENCES users (id) ON DELETE CASCADE
);

-- =========================================================================
-- 5. INSERCIONES DE DATOS INICIALES (Data Semilla)
-- =========================================================================

INSERT INTO roles (name) VALUES 
('SuperAdmin'),
('Estudiante'),
('Profesor'),
('Director'),
('Administrador');

INSERT INTO schools (SIG, company_name, name, address, phone, email, type, DEA_CODE) VALUES 
('SIG1234', NULL, 'Escuela 1', 'Direccion 1', '1234567890', 'escuela1@gmail.com', 'Pública', 'DEA001');

INSERT INTO academic_periods (name, start_date, end_date, is_active, SIG) VALUES 
('2025-2026', '2025-09-15', '2026-07-31', TRUE, 'SIG1234');

INSERT INTO users (document, name, last_name, email, phone, pass, role_id) VALUES 
('V-30021867', 'Bryant', 'Facenda', 'bryantffacen@gmail.com', '1234567890', '$2b$10$bRnuv6.gvFqGmd.E2rvx4uI.E0Wta9yvSdtqH2AwAMO478qCTYHk.', 1);

-- Corregido: Asociados a 'SIG1234' para cumplir con la integridad referencial de la FK
INSERT INTO years (name, SIG, order_year) VALUES 
('1er Año', 'SIG1234', 1),
('2do Año', 'SIG1234', 2),
('3er Año', 'SIG1234', 3),
('4to Año', 'SIG1234', 4),
('5to Año', 'SIG1234', 5),
('6to Año', 'SIG1234', 6);

