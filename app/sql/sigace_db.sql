/* SQL script for MySQL SIGACE database */
-- developer: @bafaf
-- date: 2026-04-30
-- version: 1.0.0
-- description: This script creates the SIGACE database and tables for the project.

CREATE DATABASE sigace_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sigace_db;

--------------------------------------------------------
-- 1. Tablas maetras
--------------------------------------------------------

-- tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  -- datos generales del usuario
  id INT AUTO_INCREMENT PRIMARY KEY,
  dni VARCHAR(10) UNIQUE NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(10) NOT NULL,
  birthdate DATE NOT NULL,
  pass VARCHAR(255) NOT NULL,
  `role` ENUM('administrator', 'teacher', 'student') NOT NULL DEFAULT 'student',
  status boolean DEFAULT FALSE,
  age INT AS (TIMESTAMPDIFF(YEAR, birthdate, CURDATE())) VIRTUAL,
  -- metadatos
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- tabla de escuelas
CREATE TABLE IF NOT EXISTS schools (
  code_sig VARCHAR(7) UNIQUE NOT NULL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  address VARCHAR(100) NOT NULL,
  code_school VARCHAR(10) UNIQUE NOT NULL,
  type ENUM('publica', 'privada') NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- tabla de secciones
CREATE TABLE IF NOT EXISTS sections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  code_section VARCHAR(10) UNIQUE NOT NULL,
  teachers_id INT NOT NULL,
  max_cup INT NOT NULL,
  school_id VARCHAR(7) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  Foreign Key (teachers_id) REFERENCES teachers(id),
  Foreign Key (school_id) REFERENCES schools(code_sig)
);

-- tabla de cargos
CREATE TABLE IF NOT EXISTS loads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  code_load VARCHAR(10) UNIQUE NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- tabla de asignaturas
CREATE TABLE IF NOT EXISTS subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id VARCHAR(7) NOT NULL,
  name VARCHAR(50) NOT NULL,
  year_subject VARCHAR(10) NOT NULL,
  code_subject VARCHAR(10) UNIQUE NOT NULL,
  training_area VARCHAR(50) NOT NULL,
  -- restricciones
  FOREIGN KEY (school_id) REFERENCES schools(code_sig) ON DELETE CASCADE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- tabla de planes de evaluacion
CREATE TABLE IF NOT EXISTS evaluation_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  code_evaluation_plan VARCHAR(10) UNIQUE NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- tabla de profesores
CREATE TABLE IF NOT EXISTS teachers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_user INT UNIQUE NOT NULL,
  id_school VARCHAR(7) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_teacher_user FOREIGN KEY (id_user) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_teacher_school FOREIGN KEY (id_school) REFERENCES schools(code_sig) ON DELETE CASCADE
);


-- tabla de representantes legales (antes de students por FK)
CREATE TABLE IF NOT EXISTS legal_representatives(
  id INT AUTO_INCREMENT PRIMARY KEY,
  dni VARCHAR(10) NOT NULL,
  frist_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  phone VARCHAR(10) NOT NULL,
  email VARCHAR(100) NOT NULL,
  relationship ENUM('mamá', 'papá', 'tutor', 'institucional') NOT NULL,
  -- certificado de parentesco
  code_certificate VARCHAR(10) UNIQUE NOT NULL,
  -- metadatos
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- tabla de estudiantes
CREATE TABLE IF NOT EXISTS students (
  -- datos generales del usuario
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_user INT UNIQUE NOT NULL,
  gender ENUM('masculino', 'femenino') NOT NULL,
  -- datos del representante legal
  id_legal_representative INT NOT NULL,
  -- datos del estudiante lugar de nacimiento
  birth_country VARCHAR(50) NOT NULL,
  birth_state VARCHAR(50) NOT NULL,
  birth_municipality VARCHAR(50) NOT NULL,
  -- datos del estudiante direccion
  state VARCHAR(50) NOT NULL,
  municipality VARCHAR(50) NOT NULL,
  address VARCHAR(100) NOT NULL,
  -- datos del estudiante salud
  blood_type VARCHAR(5) NOT NULL,
  allergies VARCHAR(255) NOT NULL,
  `weight` DECIMAL(5,2) NOT NULL,
  `height` DECIMAL(5,2) NOT NULL,
  shirt_size VARCHAR(10) NOT NULL,
  shoe_size VARCHAR(10) NOT NULL,
  pant_size VARCHAR(10) NOT NULL,
  medical_condition VARCHAR(255) NOT NULL,
  -- datos del representante
  rep_dni VARCHAR(10) NOT NULL,
  rep_name VARCHAR(50) NOT NULL,
  rep_last_name VARCHAR(50) NOT NULL,
  rep_phone VARCHAR(10) NOT NULL,
  rep_email VARCHAR(100) NOT NULL,
  rep_relationship VARCHAR(50) NOT NULL,
  -- datos del estudiante para control de estudios
  `condition` ENUM('regular', 'new_entry') NOT NULL,
  condition_description VARCHAR(255) NOT NULL,
  -- datos del estudiante relacionados a la escuela e la que se inscribe
  id_school VARCHAR(7) NOT NULL,
  id_section INT NOT NULL,
  id_year INT NOT NULL,
  -- metadatos
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- restricciones
  CONSTRAINT fk_student_user FOREIGN KEY (id_user) REFERENCES users(id),
  CONSTRAINT fk_student_school FOREIGN KEY (id_school) REFERENCES schools(code_sig),
  CONSTRAINT fk_student_legal_representative FOREIGN KEY (id_legal_representative) REFERENCES legal_representatives(id)
);

-- tabla de logs de acciones
CREATE TABLE IF NOT EXISTS logs_actions(
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_user INT NOT NULL,
  action VARCHAR(255) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_logs_actions_user FOREIGN KEY (id_user) REFERENCES users(id)
);

-- tabla de secciones
CREATE TABLE sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    grado VARCHAR(20) NOT NULL, 
    letra CHAR(1) NOT NULL,     
    periodo_id INT,             
    guia_id INT,                
    FOREIGN KEY (guia_id) REFERENCES teachers(id)
);

-- tabla de inscripciones
CREATE TABLE IF NOT EXISTS enrollments(
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  section_id INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (section_id) REFERENCES secciones(id)
)

-- tabla de cargos academicos
CREATE TABLE IF NOT EXISTS loads_academics(
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject_id INT NOT NULL,
  section_id INT NOT NULL,
  teacher_id INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- restricciones
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  FOREIGN KEY (section_id) REFERENCES secciones(id),
  FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

CREATE TABLE IF NOT EXISTS evaluations(
  id INT AUTO_INCREMENT PRIMARY KEY,
  load_academic_id INT NOT NULL,
  -- datos de la evaluacion
  evaluation_title VARCHAR(50) NOT NULL,
  evaluation_description VARCHAR(255) NOT NULL,
  evaluation_score DECIMAL(5,2) NOT NULL,
  evaluation_date DATE NOT NULL,

  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- restricciones
  FOREIGN KEY (load_academic_id) REFERENCES loads_academics(id)
  );


INSERT INTO schools (code_sig, name, address, code_school, type) VALUES ("SIG4465", "U.E.N Juan de Escalona", "Av. El arroyo, el hatillo", "OD19641509", "publica");

INSERT INTO subjects (school_id, name, year_subject, code_subject, training_area) VALUES ("SIG4465", "Matemáticas", "1to", "MAT01", "Formacion General");