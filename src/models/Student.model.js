import { connectToDatabase, closeDatabaseConnection } from "../db.js";

/**
 * @class Student
 * @description Modelo de estudiante
 * @param {number} id - ID del estudiante
 * @param {number} id_user - ID del usuario
 * @param {string} SIG - SIG del estudiante
 * @param {number} representative_id - ID del representante
 * @param {string} tuition_number - Número de matrícula
 * @param {number} year_id - ID del año
 * @param {number} session_id - ID de la sesión
 * @param {string} allergies - Alergias del estudiante
 * @param {string} medical_condition - Condición médica del estudiante
 * @param {number} weight - Peso del estudiante
 * @param {number} height - Altura del estudiante
 * @param {string} shirt_size - Talla de camisa del estudiante
 * @param {string} pants_size - Talla de pantalón del estudiante
 * @param {string} shoe_size - Talla de zapato del estudiante
 * @param {string} status - Estado del estudiante
 * @param {string} created_at - Fecha de creación del estudiante
 * @param {string} updated_at - Fecha de actualización del estudiante
 */
export class Student {
  constructor(
    id,
    id_user,
    SIG,
    representative_id,
    tuition_number,
    year_id,
    session_id,
    allergies,
    medical_condition,
    weight,
    height,
    shirt_size,
    pants_size,
    shoe_size,
    status,
    created_at,
    updated_at,
  ) {
    this.id = id;
    this.id_user = id_user;
    this.SIG = SIG;
    this.representative_id = representative_id;
    this.tuition_number = tuition_number;
    this.year_id = year_id;
    this.session_id = session_id;
    this.allergies = allergies;
    this.medical_condition = medical_condition;
    this.weight = weight;
    this.height = height;
    this.shirt_size = shirt_size;
    this.pants_size = pants_size;
    this.shoe_size = shoe_size;
    this.status = status;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  static async createTableStudents() {
    let db;
    try {
      db = await connectToDatabase();
      const [result] = await db.query(
        "CREATE TABLE IF NOT EXISTS students (id INT AUTO_INCREMENT PRIMARY KEY, id_user INT NOT NULL, SIG VARCHAR(255) NOT NULL, representative_id INT NOT NULL, tuition_number VARCHAR(255) NOT NULL, year_id INT NOT NULL, session_id INT NOT NULL, allergies TEXT NOT NULL, medical_condition TEXT NOT NULL, weight INT NOT NULL, height INT NOT NULL, shirt_size VARCHAR(255) NOT NULL, pants_size VARCHAR(255) NOT NULL, shoe_size VARCHAR(255) NOT NULL, status VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)",
      );
      console.log("✅ Table Students created successfully");
      return true;
    } catch (error) {
      console.error("Error al crear la tabla de estudiantes:", error);
      throw error;
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }

  static async getAllStudents({ SIG }) {
    let db;
    try {
      db = await connectToDatabase();
      const [rows] = await db.query("SELECT * FROM students WHERE SIG = ?", [
        SIG,
      ]);
      return rows;
    } catch (error) {
      console.error("Error al obtener los estudiantes:", error);
      throw error;
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }
}
