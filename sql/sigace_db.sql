/* SQL script for MySQL SIGACE database */
-- developer: @bafaf
-- date: 2026-04-30
-- version: 1.0.0
-- description: This script creates the SIGACE database and tables for the project.
CREATE DATABASE IF NOT EXISTS sigace_db;
USE sigace_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dni VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(50) NOT NULL,
  lastName VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(10) NOT NULL,
  birthdate DATE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'teacher', 'student') NOT NULL DEFAULT 'student',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  lastLogin TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS schools (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  address VARCHAR(100) NOT NULL,
  code_sig VARCHAR(10) UNIQUE NOT NULL,
  code_school VARCHAR(10) UNIQUE NOT NULL,
  type ENUM('publica', 'privada') NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  code_section VARCHAR(10) UNIQUE NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS loads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  code_load VARCHAR(10) UNIQUE NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  code_subject VARCHAR(10) UNIQUE NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evaluation_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  code_evaluation_plan VARCHAR(10) UNIQUE NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teachers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_user INT UNIQUE NOT NULL,
  id_school INT NOT NULL,
  id_section INT NOT NULL,
  id_load INT NOT NULL,
  id_subject INT NOT NULL,
  id_evaluation_plan INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_teacher_user FOREIGN KEY (id_user) REFERENCES users(id),
  CONSTRAINT fk_teacher_school FOREIGN KEY (id_school) REFERENCES schools(id),
  CONSTRAINT fk_teacher_section FOREIGN KEY (id_section) REFERENCES sections(id),
  CONSTRAINT fk_teacher_load FOREIGN KEY (id_load) REFERENCES loads(id),
  CONSTRAINT fk_teacher_subject FOREIGN KEY (id_subject) REFERENCES subjects(id),
  CONSTRAINT fk_teacher_evaluation FOREIGN KEY (id_evaluation_plan) REFERENCES evaluation_plans(id)
);

CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_user INT UNIQUE NOT NULL,
  id_parent INT NOT NULL,
  id_representative INT NOT NULL,
  birthdate DATE NOT NULL,
  gender ENUM('masculino', 'femenino') NOT NULL,
  birth_country VARCHAR(50) NOT NULL,
  birth_state VARCHAR(50) NOT NULL,
  blood_type VARCHAR(5) NOT NULL,
  allergies VARCHAR(255) NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  height DECIMAL(5,2) NOT NULL,
  shirt_size VARCHAR(10) NOT NULL,
  shoe_size VARCHAR(10) NOT NULL,
  pant_size VARCHAR(10) NOT NULL,
  medical_condition VARCHAR(255) NOT NULL,
  rep_dni VARCHAR(10) NOT NULL,
  rep_name VARCHAR(50) NOT NULL,
  rep_last_name VARCHAR(50) NOT NULL,
  rep_phone VARCHAR(10) NOT NULL,
  rep_email VARCHAR(100) NOT NULL,
  rep_relationship VARCHAR(50) NOT NULL,
  id_school INT NOT NULL,
  id_section INT NOT NULL,
  id_load INT NOT NULL,
  id_subject INT NOT NULL,
  id_evaluation_plan INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_student_user FOREIGN KEY (id_user) REFERENCES users(id),
  CONSTRAINT fk_student_school FOREIGN KEY (id_school) REFERENCES schools(id),
  CONSTRAINT fk_student_section FOREIGN KEY (id_section) REFERENCES sections(id),
  CONSTRAINT fk_student_load FOREIGN KEY (id_load) REFERENCES loads(id),
  CONSTRAINT fk_student_subject FOREIGN KEY (id_subject) REFERENCES subjects(id),
  CONSTRAINT fk_student_evaluation FOREIGN KEY (id_evaluation_plan) REFERENCES evaluation_plans(id)
);

