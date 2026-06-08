-- Ejecutar en sigace_db si evaluation_plans tiene UNIQUE solo en id_load_academic.
-- Ese índice impedía crear un plan por lapso (solo permitía uno por carga académica).
USE sigace_db;

ALTER TABLE evaluation_plans DROP INDEX IF EXISTS id_load_academic;
