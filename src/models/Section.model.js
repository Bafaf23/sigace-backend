import { connectToDatabase, closeDatabaseConnection } from "../db.js";

export class Sections {
  constructor(name, SIG, id_period, id_year, guide_id, capacity) {
    this.name = name;
    this.SIG = SIG;
    this.id_period = id_period;
    this.id_year = id_year;
    this.guide_id = guide_id;
    this.capacity = capacity;
  }

  /**
   * Obtiene el ID del período académico por su nombre
   * @param {string} periodName - Nombre del período académico
   * @returns {Promise<number>} - ID del período académico
   */
  static async getPeriodIdByName(periodName) {
    let db;
    try {
      db = await connectToDatabase();
      const [rows] = await db.query(
        "SELECT id FROM academic_periods WHERE name = ? LIMIT 1",
        [periodName],
      );
      return rows[0]?.id ?? null;
    } catch (error) {
      console.error("Error al obtener el período académico:", error);
      throw error;
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }

  /**
   * Crea una sección en la base de datos
   * @param {object} section - Objecto con los datos de la sección
   * @param {string} section.name - Nombre de la sección
   * @param {string} section.SIG - SIG de la escuela
   * @param {number} section.id_period - ID del período académico
   * @param {number} section.id_year - ID del año académico
   * @param {number} section.guide_id - ID del guía de la sección
   * @param {number} section.capacity - Capacidad de la sección
   * @returns {Promise<boolean>} - True si la sección se creó correctamente, false en caso contrario
   */
  static async createSection(section) {
    let db;
    try {
      db = await connectToDatabase();
      const [result] = await db.query(
        "INSERT INTO sections (name, SIG, id_period, id_year, guide_id, capacity) VALUES (?, ?, ?, ?, ?, ?)",
        [
          section.name,
          section.SIG,
          section.id_period,
          section.id_year,
          section.guide_id,
          section.capacity,
        ],
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error al crear la sección:", error);
      throw error;
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }

  /**
   * Obtiene las secciones de la escuela
   * @param {string} SIG - SIG de la escuela
   * @returns {Promise<Array<object>>} - Array de secciones
   */
  static async getSections(SIG) {
    let db;
    try {
      db = await connectToDatabase();
      const [rows] = await db.query(
        `SELECT 
    sections.id, 
    sections.name, 
    sections.id_period, 
    sections.id_year, 
    sections.guide_id, 
    sections.capacity,
    years.name AS year_name, 
    teachers.id AS teacher_id,
    users.name AS teacher_name, 
    users.last_name AS teacher_last_name,
    
    (
      SELECT COUNT(e.id) 
      FROM enrollments e 
      WHERE e.id_section = sections.id 
        AND e.id_period = sections.id_period 
        AND e.status IN ('Activo', 'Repitiente')
    ) AS total_students

  FROM sections
  INNER JOIN years ON sections.id_year = years.id
  INNER JOIN teachers ON sections.guide_id = teachers.id
  INNER JOIN users ON teachers.id_user = users.id
  WHERE sections.SIG = ? 
    AND users.role_id = 3`,
        [SIG],
      );
      return rows;
    } catch (error) {
      console.error("Error al obtener las secciones:", error);
      throw error;
    } finally {
      if (db) {
        await closeDatabaseConnection(db);
      }
    }
  }
}
