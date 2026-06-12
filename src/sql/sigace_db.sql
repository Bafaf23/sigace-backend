CREATE DATABASE IF NOT EXISTS sigace_db;

USE sigace_db;

-- =========================================================================
-- 1. TABLAS MAESTRAS (Reordenadas por dependencias estrictas)
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
    birthCertificate VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 🌟 Movida arriba: Las escuelas no dependen de nadie
CREATE TABLE IF NOT EXISTS schools (
    SIG VARCHAR(10) PRIMARY KEY,
    company_name VARCHAR(50) NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    type ENUM(
        'Pública',
        'Privada',
        'Municipal'
    ) NOT NULL,
    DEA_CODE VARCHAR(50) UNIQUE,
    RIF VARCHAR(20) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_school_type_codes CHECK (
        (
            type = 'Pública'
            AND DEA_CODE IS NOT NULL
            AND RIF IS NULL
            AND company_name IS NULL
        )
        OR (
            type IN ('Privada', 'Municipal')
            AND RIF IS NOT NULL
            AND DEA_CODE IS NULL
            AND company_name IS NOT NULL
        )
    )
);

-- 🌟 Movida aquí: Ya existe la tabla schools
CREATE TABLE IF NOT EXISTS academic_periods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE, -- Ej: "2025-2026"
    start_date DATE NOT NULL, -- Ej: "2025-09-15"
    end_date DATE NOT NULL, -- Ej: "2026-07-31"
    is_active BOOLEAN DEFAULT FALSE, -- Período en curso (solo uno en TRUE)
    SIG VARCHAR(10) NOT NULL,
    FOREIGN KEY (SIG) REFERENCES schools (SIG) ON DELETE CASCADE
);

-- 🌟 Movida aquí: Ya existen los periodos académicos
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

-- =========================================================================
-- 2. TABLAS DE USUARIOS Y DEPENDIENTES DIRECTOS
-- =========================================================================

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
    name VARCHAR(255) NOT NULL, -- Ej: "1er Año"
    SIG VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (SIG) REFERENCES schools (SIG) ON DELETE CASCADE
);

-- =========================================================================
-- 3. ENTIDADES DE CARGOS (Profesores y Administradores)
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
-- 4. CONTROL DE ESTUDIOS (Secciones, Materias e Inscripciones)
-- =========================================================================

CREATE TABLE IF NOT EXISTS sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL, -- Ej: "A"
    SIG VARCHAR(10) NOT NULL,
    id_period INT NOT NULL,
    id_year INT NOT NULL,
    capacity INT NOT NULL DEFAULT 35,
    guide_id INT NOT NULL, -- Apunta al ID de la tabla teachers
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (SIG) REFERENCES schools (SIG) ON DELETE CASCADE,
    FOREIGN KEY (id_period) REFERENCES academic_periods (id) ON DELETE RESTRICT,
    FOREIGN KEY (id_year) REFERENCES years (id) ON DELETE RESTRICT,
    FOREIGN KEY (guide_id) REFERENCES teachers (id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS subjects (
    code_subject VARCHAR(20) PRIMARY KEY, -- Ej: "MAT-1"
    name VARCHAR(255) NOT NULL,
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
    representative_id INT NOT NULL, -- Enlace a la tabla de representantes
    tuition_number VARCHAR(255) NOT NULL UNIQUE, -- Número de matrícula único
    allergies TEXT NULL,
    medical_condition TEXT NULL,
    weight INT NOT NULL, -- Peso en kg
    height INT NOT NULL, -- Altura en cm
    shirt_size VARCHAR(50) NOT NULL,
    pants_size VARCHAR(50) NOT NULL,
    shoe_size VARCHAR(50) NOT NULL,
    gender ENUM('Masculino', 'Femenino') NOT NULL DEFAULT 'Masculino',
    birth_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_user) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (SIG) REFERENCES schools (SIG) ON DELETE CASCADE,
    FOREIGN KEY (representative_id) REFERENCES representatives (id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_student INT NOT NULL,
    id_section INT NOT NULL,
    id_period INT NOT NULL,
    status ENUM(
        'Activo',
        'Aprobado',
        'Retirado',
        'Materia Pendiente',
        'Reprobado'
    ) DEFAULT 'Activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_student_period (id_student, id_period),
    FOREIGN KEY (id_student) REFERENCES students (id) ON DELETE RESTRICT,
    FOREIGN KEY (id_section) REFERENCES sections (id) ON DELETE RESTRICT,
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

-- =========================================================================
-- 5. INSERCIONES DE DATOS INICIALES (Data Semilla Corregida)
-- =========================================================================

-- Inserción de Roles
INSERT INTO
    roles (name)
VALUES ('SuperAdmin'),
    ('Estudiante'),
    ('Profesor'),
    ('Director'),
    ('Administrador');

-- 🌟 Inserción de Escuela Maestra (Primero, para que su SIG exista)
INSERT INTO
    schools (
        SIG,
        company_name,
        name,
        address,
        phone,
        email,
        type,
        DEA_CODE
    )
VALUES (
        'SIG1234',
        NULL,
        'Escuela 1',
        'Direccion 1',
        '1234567890',
        'escuela1@gmail.com',
        'Pública',
        'DEA001'
    );

-- 🌟 Inserción de Período académico (Corregido: incluyendo su respectiva FK a la escuela 'SIG1234')
INSERT INTO
    academic_periods (
        name,
        start_date,
        end_date,
        is_active,
        SIG
    )
VALUES (
        '2025-2026',
        '2025-09-15',
        '2026-07-31',
        TRUE,
        'SIG1234'
    );

-- Inserción de Usuario Administrador Inicial
INSERT INTO
    users (
        document,
        name,
        last_name,
        email,
        phone,
        pass,
        role_id
    )
VALUES (
        'V-30021867',
        'Bryant',
        'Facenda',
        'bryantffacen@gmail.com',
        '1234567890',
        '$2b$10$bRnuv6.gvFqGmd.E2rvx4uI.E0Wta9yvSdtqH2AwAMO478qCTYHk.',
        1
    );

INSERT INTO
    years (name, SIG)
VALUES ('1er Año', 'SIG1234'),
    ('2do Año', 'SIG1234'),
    ('3er Año', 'SIG1234'),
    ('4to Año', 'SIG1234'),
    ('5to Año', 'SIG1234'),
    ('6to Año', 'SIG1234');