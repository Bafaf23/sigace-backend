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
 * @param {string} gender - Género del estudiante
 */
export class Students {
  constructor(
    id,
    id_user,
    gender,
    SIG,
    representative_id,
    tuition_number,
    year_id,
    id_section,
    id_period,
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
    this.gender = gender;
    this.id_user = id_user;
    this.SIG = SIG;
    this.representative_id = representative_id;
    this.tuition_number = tuition_number;
    this.year_id = year_id;
    this.id_section = id_section;
    this.id_period = id_period;
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
  /**
   ** Obtiene a todos los estudiantes de un colegio dentro de un periodo específico.
   * @param {object} param
   * @param {string} param.SIG - codigo unico del colegio
   * @param {number} param.id_period - id del period academico
   * @returns
   */
  static async getAllStudents({ SIG, id_period }) {
    let db;
    try {
      db = await connectToDatabase();
      const [rows] = await db.query(
        `SELECT 
          students.id, 
          students.id_user, 
          students.gender, 
          students.SIG, 
          students.representative_id, 
          students.tuition_number, 
          students.birth_date, 
          students.allergies, 
          students.medical_condition, 
          students.weight, 
          students.height, 
          students.shirt_size, 
          students.pants_size, 
          students.shoe_size, 
          users.name, 
          users.last_name, 
          users.email, 
          users.phone, 
          users.document, 
          users.role_id, 
          representatives.name AS representative_name, 
          representatives.last_name AS representative_last_name, 
          representatives.phone AS representative_phone, 
          representatives.relationship AS representative_relationship, 
          en.id_section, 
          sec.name AS section, 
          yer.id AS id_year, 
          yer.name AS year,
          en.status AS enrollment_status
      FROM students 
      INNER JOIN users ON students.id_user = users.id 
      INNER JOIN representatives ON students.representative_id = representatives.id
      INNER JOIN enrollments en ON students.id = en.id_student 
      INNER JOIN sections sec ON en.id_section = sec.id
      INNER JOIN years yer ON sec.id_year = yer.id
      WHERE students.SIG = ? 
        AND en.id_period = ?
      ORDER BY yer.id ASC, sec.name ASC, users.last_name ASC`,
        [SIG, id_period],
      );
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

  static async createStudent(student) {
    let db;
    try {
      db = await connectToDatabase();
      const [result] = await db.query(
        "INSERT INTO students (id_user, gender, SIG, representative_id, tuition_number, allergies, medical_condition, weight, height, shirt_size, pants_size, shoe_size, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          student.id_user,
          student.gender,
          student.SIG,
          student.representative_id,
          student.tuition_number,
          student.allergies,
          student.medical_condition,
          student.weight,
          student.height,
          student.shirt_size,
          student.pants_size,
          student.shoe_size,
          student.status,
        ],
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error al crear el estudiante:", error);
      throw error;
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }

  /**
   * @description Actualiza un estudiante por su ID
   * @param {string} id
   * @param {Object} student
   * @returns {boolean}
   */
  static async updateStudent(id, student) {
    let db;
    try {
      db = await connectToDatabase();
      const [result] = await db.query(
        "UPDATE students SET gender = ?, birth_date = ?, height = ?, allergies = ?, medical_condition = ?, weight = ?, shirt_size = ?, pants_size = ?, shoe_size = ?, status = ? WHERE id = ?",
        [
          student.gender,
          student.birth_date,
          student.height,
          student.allergies,
          student.medical_condition,
          student.weight,
          student.shirt_size,
          student.pants_size,
          student.shoe_size,
          student.status,
          id,
        ],
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error al actualizar el estudiante:", error);
      throw error;
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }
  /**
   * Obtiene los estudiantes no matriculados
   * @param {object} params - Objecto con los parámetros
   * @param {number} params.id_period - ID del periodo
   * @param {string} params.SIG - SIG de la escuela
   * @returns {Array<object>} - Array de estudiantes no matriculados
   */
  static async getStudentNotEnrolled({ id_period, SIG }) {
    let db;
    try {
      db = await connectToDatabase();
      const [rows] = await db.query(
        "SELECT u.name, u.last_name, u.document, s.id FROM students s INNER JOIN users u ON s.id_user = u.id LEFT JOIN enrollments e ON s.id = e.id_student AND e.id_period = ? WHERE e.id IS NULL AND s.SIG = ?",
        [id_period, SIG],
      );
      return rows;
    } catch (error) {
      console.error("Error al obtener los estudiantes no matriculados:", error);
      throw error;
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }

  /**
   * Obtiene a los estudiates de una sección
   * @param {object} params - Objecto con los parámetros
   * @param {number} params.id_section - ID de la sección
   * @param {string} params.SIG - SIG de la escuela
   * @returns {Array<object>} - Array de estudiantes
   */
  static async getStudentsBySection({ id_section, SIG }) {
    let db;
    try {
      db = await connectToDatabase();
      const [rows] = await db.query(
        `SELECT 
    s.id, 
    s.id_user, 
    s.SIG, 
    s.tuition_number, 
    u.name, 
    u.last_name, 
    u.document 
FROM students s 
INNER JOIN users u ON s.id_user = u.id  
INNER JOIN enrollments e ON s.id = e.id_student
WHERE e.id_section = ? AND s.SIG = ?`,
        [id_section, SIG],
      );
      return rows;
    } catch (error) {
      console.error("Error al obtener los estudiantes de la sección:", error);
      throw error;
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }
}
